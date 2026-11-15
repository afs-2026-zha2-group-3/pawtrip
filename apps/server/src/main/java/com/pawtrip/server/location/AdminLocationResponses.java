package com.pawtrip.server.location;

import java.util.List;
import tools.jackson.databind.JsonNode;

public final class AdminLocationResponses {

	private AdminLocationResponses() {
	}

	public record RegionOption(String adcode, String name, String level, List<RegionOption> children) {

		public RegionOption {
			children = List.copyOf(children);
		}
	}

	public record LocationTypeOption(String key, String label, List<String> typeCodes) {

		public LocationTypeOption {
			typeCodes = List.copyOf(typeCodes);
		}
	}

	public record Page<T>(int page, int pageSize, long totalElements, int totalPages, boolean hasNext,
			boolean hasPrevious, List<T> items) {

		public Page {
			items = List.copyOf(items);
		}
	}

	public record AmapCandidate(String poiId, String name, String typeCode, String address, String location,
			String regionCode, boolean saved, JsonNode poi) {

		public AmapCandidate {
			poi = poi.deepCopy();
		}

		@Override
		public JsonNode poi() {
			return this.poi.deepCopy();
		}
	}

	public record SavedLocation(String poiId, String name, String typeCode, String typeGroup, String address,
			Double longitude, Double latitude, String regionCode, Integer minVisitHours, Integer maxVisitHours) {

		static SavedLocation from(PawtripLocation location) {
			return new SavedLocation(
					location.getPoiId(),
					location.getName(),
					location.getTypeCode(),
					location.getTypeGroup(),
					location.getAddress(),
					location.getLongitude(),
					location.getLatitude(),
					location.getRegionCode(),
					location.getMinVisitHours(),
					location.getMaxVisitHours());
		}
	}

	public record LocationDetail(String poiId, String typeGroup, Integer minVisitHours, Integer maxVisitHours,
			JsonNode poi, JsonNode business, List<PhotoDetail> photos) {

		public LocationDetail {
			poi = poi.deepCopy();
			business = business.deepCopy();
			photos = List.copyOf(photos);
		}

		@Override
		public JsonNode poi() {
			return this.poi.deepCopy();
		}

		@Override
		public JsonNode business() {
			return this.business.deepCopy();
		}
	}

	public record PhotoDetail(Long photoId, Integer order, String title, String sourceUrl, JsonNode metadata) {

		public PhotoDetail {
			metadata = metadata.deepCopy();
		}

		@Override
		public JsonNode metadata() {
			return this.metadata.deepCopy();
		}
	}

}
