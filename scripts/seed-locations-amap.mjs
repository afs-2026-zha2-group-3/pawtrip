#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

// 与后端 AdminLocationService.LOCATION_TYPES 保持一致。
const LOCATION_TYPES = {
	attraction: { label: "景点", typeCodes: ["110000"] },
	hotel: { label: "住宿", typeCodes: ["100000"] },
	"pet-hospital": { label: "宠物医院", typeCodes: ["090700"] },
	"pet-supplies": { label: "宠物用品店", typeCodes: ["061211"] },
	restaurant: { label: "餐厅", typeCodes: ["050000"] },
};

const DEFAULT_REGION = "440400";
const DEFAULT_MAX_PER_TYPE = 200;
const AMAP_PAGE_SIZE = 25;
const AMAP_MAX_RESULTS = 200;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 600;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
	const options = {
		regions: [DEFAULT_REGION],
		types: Object.keys(LOCATION_TYPES),
		maxPerType: DEFAULT_MAX_PER_TYPE,
		dbPath: resolve(repoRoot, process.env.SEED_DB ?? "apps/server/data/pawtrip.db"),
		delayMs: 150,
		dryRun: false,
		help: false,
	};
	for (const argument of argv) {
		if (argument === "--help" || argument === "-h") {
			options.help = true;
		} else if (argument === "--dry-run") {
			options.dryRun = true;
		} else if (argument.startsWith("--regions=") || argument.startsWith("--region=")) {
			options.regions = argument.split("=", 2)[1].split(",").map((value) => value.trim()).filter(Boolean);
		} else if (argument.startsWith("--types=")) {
			options.types = argument.split("=", 2)[1].split(",").map((value) => value.trim()).filter(Boolean);
		} else if (argument.startsWith("--max=")) {
			options.maxPerType = Number(argument.split("=", 2)[1]);
		} else if (argument.startsWith("--db=")) {
			options.dbPath = resolve(argument.split("=", 2)[1]);
		} else if (argument.startsWith("--delay=")) {
			options.delayMs = Number(argument.split("=", 2)[1]);
		} else {
			throw new Error(`Unknown argument: ${argument}`);
		}
	}
	if (options.regions.length === 0 || options.regions.some((region) => !/^\d{6}$/.test(region))) {
		throw new Error("--regions must contain 6-digit adcodes");
	}
	if (options.types.length === 0 || options.types.some((type) => !LOCATION_TYPES[type])) {
		throw new Error(`--types must be a subset of: ${Object.keys(LOCATION_TYPES).join(",")}`);
	}
	if (!Number.isInteger(options.maxPerType) || options.maxPerType < 1 || options.maxPerType > AMAP_MAX_RESULTS) {
		throw new Error(`--max must be an integer between 1 and ${AMAP_MAX_RESULTS}`);
	}
	if (!Number.isFinite(options.delayMs) || options.delayMs < 0) {
		throw new Error("--delay must be a non-negative number of milliseconds");
	}
	return options;
}

function loadApiKey() {
	if (process.env.AMAP_API_KEY) {
		return process.env.AMAP_API_KEY;
	}
	const envPath = resolve(repoRoot, ".env");
	if (!existsSync(envPath)) {
		return null;
	}
	for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
		const match = line.match(/^\s*AMAP_API_KEY\s*=\s*(.*)\s*$/);
		if (match) {
			return match[1].replace(/^["']|["']$/g, "").trim() || null;
		}
	}
	return null;
}

function sleep(milliseconds) {
	return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function amapText(value) {
	if (typeof value !== "string") {
		return null;
	}
	const trimmed = value.trim();
	return trimmed === "" ? null : trimmed;
}

function primaryTypeCode(typeCode) {
	const value = amapText(typeCode);
	return value === null ? null : value.split(/[;,|]/, 1)[0].trim();
}

function typeCodePrefix(typeCode) {
	let prefix = typeCode;
	while (prefix.length > 2 && prefix.endsWith("00")) {
		prefix = prefix.slice(0, -2);
	}
	return prefix;
}

function matchesTypeGroup(typeCode, typeCodes) {
	const primary = primaryTypeCode(typeCode);
	if (primary === null) {
		return false;
	}
	return typeCodes.some((expected) => primary.startsWith(typeCodePrefix(expected)));
}

function parseCoordinates(location) {
	const value = amapText(location);
	if (value === null) {
		return null;
	}
	const parts = value.split(",");
	if (parts.length !== 2) {
		return null;
	}
	const longitude = Number(parts[0].trim());
	const latitude = Number(parts[1].trim());
	if (!Number.isFinite(longitude) || !Number.isFinite(latitude)
		|| longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
		return null;
	}
	return { longitude, latitude };
}

function normalizePoi(poi, typeGroup, regionCode) {
	const poiId = amapText(poi?.id);
	const name = amapText(poi?.name);
	const typeCode = amapText(poi?.typecode);
	const coordinates = parseCoordinates(poi?.location);
	if (poiId === null || !/^[A-Za-z0-9_-]{1,64}$/.test(poiId)
		|| name === null || typeCode === null || coordinates === null) {
		return null;
	}
	const adcode = amapText(poi.adcode);
	const business = poi.business && typeof poi.business === "object" && !Array.isArray(poi.business)
		? poi.business
		: {};
	const photos = Array.isArray(poi.photos)
		? poi.photos
			.filter((photo) => photo !== null && typeof photo === "object" && !Array.isArray(photo))
			.map((photo, index) => ({
				order: index,
				sourceJson: JSON.stringify(photo),
				title: amapText(photo.title),
				sourceUrl: amapText(photo.url) ?? "",
			}))
		: [];
	return {
		poiId,
		name,
		typeCode,
		typeGroup,
		address: amapText(poi.address),
		longitude: coordinates.longitude,
		latitude: coordinates.latitude,
		regionCode: adcode !== null && /^\d{6}$/.test(adcode) ? adcode : regionCode,
		poiJson: JSON.stringify(poi),
		businessJson: JSON.stringify(business),
		photos,
	};
}

async function searchPage({ apiKey, regionCode, typeCodes, pageNum, pageSize }) {
	const url = new URL("https://restapi.amap.com/v5/place/text");
	url.searchParams.set("key", apiKey);
	url.searchParams.set("types", typeCodes.join("|"));
	url.searchParams.set("region", regionCode);
	url.searchParams.set("city_limit", "true");
	url.searchParams.set("page_num", String(pageNum));
	url.searchParams.set("page_size", String(pageSize));
	url.searchParams.set("show_fields", "business,photos");

	let lastError;
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
			if (!response.ok) {
				throw new Error(`AMap HTTP ${response.status}`);
			}
			const body = await response.json();
			if (body.status === "1" && body.infocode === "10000") {
				return Array.isArray(body.pois) ? body.pois : [];
			}
			const infocode = String(body.infocode ?? "");
			const message = `AMap error ${infocode}: ${body.info ?? "unknown"}`;
			if (infocode === "10021" || infocode === "10019" || infocode === "10004") {
				throw new Error(message);
			}
			throw Object.assign(new Error(message), { fatal: true });
		} catch (error) {
			lastError = error.cause?.code === "SELF_SIGNED_CERT_IN_CHAIN"
				? new Error("TLS 证书链被企业代理替换，请改用 npm run seed:locations 或 node --use-system-ca")
				: error;
			if (error.fatal || attempt === MAX_ATTEMPTS) {
				break;
			}
			await sleep(RETRY_BASE_DELAY_MS * attempt);
		}
	}
	throw lastError;
}

async function fetchPois({ apiKey, regionCode, typeGroup, maxPerType, delayMs }) {
	const { typeCodes } = LOCATION_TYPES[typeGroup];
	const matched = [];
	let rawFetched = 0;
	for (let pageNum = 1; rawFetched < AMAP_MAX_RESULTS && matched.length < maxPerType; pageNum += 1) {
		const pois = await searchPage({ apiKey, regionCode, typeCodes, pageNum, pageSize: AMAP_PAGE_SIZE });
		rawFetched += pois.length;
		for (const poi of pois) {
			if (matchesTypeGroup(poi?.typecode, typeCodes)) {
				matched.push(poi);
				if (matched.length >= maxPerType) {
					break;
				}
			}
		}
		if (pois.length < AMAP_PAGE_SIZE) {
			break;
		}
		if (delayMs > 0) {
			await sleep(delayMs);
		}
	}
	return { pois: matched, rawFetched };
}

function openDatabase(databasePath) {
	if (!existsSync(databasePath)) {
		throw new Error(`Database not found: ${databasePath}. Start the backend once so Flyway creates the schema.`);
	}
	const db = new DatabaseSync(databasePath);
	db.exec("PRAGMA busy_timeout = 5000");
	const hasTable = db.prepare(
		"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pawtrip_location'",
	).get();
	if (!hasTable) {
		db.close();
		throw new Error("Table pawtrip_location is missing. Run the backend once to apply Flyway migrations.");
	}
	return db;
}

function persist(db, locations) {
	const insertLocation = db.prepare(`
		INSERT INTO pawtrip_location (
			poi_id, name, type_code, type_group, address, longitude, latitude,
			region_code, poi_json, business_json
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(poi_id) DO NOTHING
	`);
	const insertPhoto = db.prepare(`
		INSERT INTO location_photo (location_id, photo_order, source_json, title, source_url)
		VALUES (?, ?, ?, ?, ?)
	`);
	let inserted = 0;
	let existing = 0;
	let photos = 0;

	db.exec("BEGIN IMMEDIATE");
	try {
		for (const location of locations) {
			const result = insertLocation.run(
				location.poiId,
				location.name,
				location.typeCode,
				location.typeGroup,
				location.address,
				location.longitude,
				location.latitude,
				location.regionCode,
				location.poiJson,
				location.businessJson,
			);
			if (Number(result.changes) === 0) {
				existing += 1;
				continue;
			}
			inserted += 1;
			for (const photo of location.photos) {
				insertPhoto.run(Number(result.lastInsertRowid), photo.order, photo.sourceJson, photo.title, photo.sourceUrl);
				photos += 1;
			}
		}
		db.exec("COMMIT");
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
	return { inserted, existing, photos };
}

function printHelp() {
	console.log(`Usage: node scripts/seed-locations-amap.mjs [options]

Fetch AMap POIs and insert them into pawtrip_location/location_photo.
Existing poi_id rows are skipped, so admin edits are never overwritten.

Options:
  --regions=440400[,440100]  City adcodes (default: 440400 珠海)
  --types=all|attraction,hotel,pet-hospital,pet-supplies,restaurant
  --max=200                  Max POIs per region and type (1-200)
  --db=path                  SQLite path (default: apps/server/data/pawtrip.db)
  --delay=150                Delay between AMap requests in ms
  --dry-run                  Only fetch and report, do not write
  -h, --help                 Show this help

API key: AMAP_API_KEY from the environment or repo-root .env
`);
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		printHelp();
		return;
	}
	const apiKey = loadApiKey();
	if (!apiKey) {
		throw new Error("AMAP_API_KEY is not configured in the environment or repo-root .env");
	}

	let db = options.dryRun ? null : openDatabase(options.dbPath);
	const totals = { inserted: 0, existing: 0, photos: 0, invalid: 0, fetched: 0 };
	try {
		for (const regionCode of options.regions) {
			for (const typeGroup of options.types) {
				const { label } = LOCATION_TYPES[typeGroup];
				let fetched;
				try {
					fetched = await fetchPois({
						apiKey,
						regionCode,
						typeGroup,
						maxPerType: options.maxPerType,
						delayMs: options.delayMs,
					});
				} catch (error) {
					throw new Error(`[${regionCode}/${typeGroup}] ${error.message}`);
				}
				const locations = fetched.pois
					.map((poi) => normalizePoi(poi, typeGroup, regionCode))
					.filter((location) => location !== null);
				const invalid = fetched.pois.length - locations.length;
				totals.fetched += fetched.rawFetched;
				totals.invalid += invalid;

				if (options.dryRun) {
					const sample = locations.slice(0, 3).map((location) => location.name).join(" / ");
					console.log(`[${regionCode}] ${label}: raw=${fetched.rawFetched} matched=${fetched.pois.length} `
						+ `valid=${locations.length} invalid=${invalid}${sample ? ` | ${sample}` : ""}`);
					continue;
				}

				const outcome = persist(db, locations);
				totals.inserted += outcome.inserted;
				totals.existing += outcome.existing;
				totals.photos += outcome.photos;
				console.log(`[${regionCode}] ${label}: raw=${fetched.rawFetched} matched=${fetched.pois.length} `
					+ `inserted=${outcome.inserted} existing=${outcome.existing} photos=${outcome.photos} invalid=${invalid}`);
			}
		}
	} finally {
		db?.close();
	}

	if (options.dryRun) {
		console.log(`Dry run: regions=${options.regions.join(",")} types=${options.types.join(",")} `
			+ `max/type=${options.maxPerType} raw=${totals.fetched} invalid=${totals.invalid}`);
		return;
	}
	console.log(`Done: inserted=${totals.inserted} existing=${totals.existing} `
		+ `photos=${totals.photos} invalid=${totals.invalid} into ${options.dbPath}`);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
