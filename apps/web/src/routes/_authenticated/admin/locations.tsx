import { useEffect, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import {
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import {
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AmapCandidateEditor, SavedLocationEditor } from "./-location-editor";
import { PaginationControls } from "./-pagination-controls";
import { authQueryOptions } from "../../../queries/auth";
import {
  administrativeRegionsQueryOptions,
  amapLocationsQueryOptions,
  locationTypesQueryOptions,
  savedLocationsQueryOptions,
  type AmapCandidate,
  type AdministrativeRegion,
  type SavedLocation,
} from "../../../queries/admin-locations";
import {
  amapParamsFromPagination,
  amapTablePageMetadata,
  initialLocationPagination,
  resetPaginationForFilterChange,
  savedLocationParamsFromPagination,
  savedLocationTablePageMetadata,
  type TablePageMetadata,
} from "../../../queries/location-pagination";

const paginationFeatures = tableFeatures({ rowPaginationFeature });
const emptyAmapRows: AmapCandidate[] = [];
const emptySavedRows: SavedLocation[] = [];
const allLocationsTab = "all";
const pawtripLocationsTab = "pawtrip";

type LocationTab = typeof allLocationsTab | typeof pawtripLocationsTab;

const amapColumns: ColumnDef<typeof paginationFeatures, AmapCandidate>[] = [
  { accessorKey: "name", header: "地点名称", cell: ({ getValue }) => getValue() || "—" },
  { accessorKey: "typeCode", header: "类型编码", cell: ({ getValue }) => getValue() || "—" },
  { accessorKey: "address", header: "地址", cell: ({ getValue }) => getValue() || "—" },
  {
    id: "status",
    header: "保存状态",
    cell: ({ row }) => row.original.saved ? "已添加到 Pawtrip" : "未保存",
  },
];

const savedColumns: ColumnDef<typeof paginationFeatures, SavedLocation>[] = [
  { accessorKey: "name", header: "地点名称" },
  { accessorKey: "typeGroup", header: "类型" },
  { accessorKey: "address", header: "地址", cell: ({ getValue }) => getValue() || "—" },
  {
    accessorKey: "minVisitHours",
    header: "最少游玩时间（小时）",
    cell: ({ getValue }) => getValue() ?? "—",
  },
  {
    accessorKey: "maxVisitHours",
    header: "最多游玩时间（小时）",
    cell: ({ getValue }) => getValue() ?? "—",
  },
];

export const Route = createFileRoute("/_authenticated/admin/locations")({
  beforeLoad: async ({ context }) => {
    if (typeof window === "undefined") return;

    let user;
    try {
      user = await context.queryClient.fetchQuery(authQueryOptions);
    } catch {
      throw redirect({ to: "/login" });
    }

    if (user.role !== "ADMIN") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLocationsRoute,
});

function AdminLocationsRoute() {
  const navigate = useNavigate();
  const isClient = typeof window !== "undefined";
  const auth = useQuery({ ...authQueryOptions, enabled: isClient });

  useEffect(() => {
    if (auth.data && auth.data.role !== "ADMIN") {
      void navigate({ to: "/", replace: true });
    } else if (auth.isError) {
      void navigate({ to: "/login", replace: true });
    }
  }, [auth.data, auth.isError, navigate]);

  if (!isClient || auth.isPending || auth.isError || auth.data?.role !== "ADMIN") {
    return null;
  }

  return <LocationManagementPage />;
}

function LocationManagementPage() {
  const regionsQuery = useQuery(administrativeRegionsQueryOptions());
  const typesQuery = useQuery(locationTypesQueryOptions());
  const [regionCode, setRegionCode] = useState<string>();
  const [typeGroup, setTypeGroup] = useState<string>();
  const [activeTab, setActiveTab] = useState<LocationTab>(allLocationsTab);
  const [editingCandidate, setEditingCandidate] = useState<AmapCandidate | null>(null);
  const [editingSavedLocation, setEditingSavedLocation] = useState<SavedLocation | null>(null);
  const [amapPagination, setAmapPagination] = useState<PaginationState>(
    initialLocationPagination,
  );
  const [savedPagination, setSavedPagination] = useState<PaginationState>(
    initialLocationPagination,
  );
  const selectedTypeGroup = typeGroup ?? typesQuery.data?.[0]?.key;

  const amapParams = amapParamsFromPagination(
    { regionCode, typeGroup: selectedTypeGroup ?? "" },
    amapPagination,
  );
  const amapQuery = useQuery({
    ...amapLocationsQueryOptions(amapParams),
    enabled: activeTab === allLocationsTab && Boolean(selectedTypeGroup) && Boolean(regionCode),
  });

  const savedParams = savedLocationParamsFromPagination(
    { regionCode, typeGroup: selectedTypeGroup },
    savedPagination,
  );
  const savedQuery = useQuery({
    ...savedLocationsQueryOptions(savedParams),
    enabled: activeTab === pawtripLocationsTab && typesQuery.isSuccess,
  });

  const updateFilters = (nextRegionCode: string | undefined, nextTypeGroup: string | undefined) => {
    setRegionCode(nextRegionCode);
    setTypeGroup(nextTypeGroup);
    setAmapPagination((pagination) => resetPaginationForFilterChange(pagination));
    setSavedPagination((pagination) => resetPaginationForFilterChange(pagination));
  };

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>地点管理</CardTitle>
          <CardDescription>
            按行政区和地点类型浏览高德候选地点及已保存的 Pawtrip 地点。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-medium">城市</span>
              <RegionTreeSelect
                regions={regionsQuery.data ?? []}
                value={regionCode}
                onValueChange={(value) => updateFilters(value, selectedTypeGroup)}
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">地点类型</span>
              <Select
                value={selectedTypeGroup ?? ""}
                onValueChange={(value) => {
                  if (typeof value !== "string") return;
                  updateFilters(regionCode, value);
                }}
                disabled={!typesQuery.data?.length}
              >
                <SelectTrigger aria-label="地点类型筛选" className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      typesQuery.data?.find((option) => option.key === value)?.label
                      ?? "选择地点类型"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {typesQuery.data?.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              if (value === allLocationsTab || value === pawtripLocationsTab) {
                setActiveTab(value);
              }
            }}
            className="gap-4"
          >
            <TabsList aria-label="地点列表">
              <TabsTrigger value={allLocationsTab}>所有地点</TabsTrigger>
              <TabsTrigger value={pawtripLocationsTab}>pawtrip地点</TabsTrigger>
            </TabsList>
            <TabsContent value={allLocationsTab}>
              <AmapLocationsTable
                rows={amapQuery.data?.items ?? emptyAmapRows}
                hasRegion={Boolean(regionCode)}
                pagination={amapPagination}
                onPaginationChange={setAmapPagination}
                metadata={amapQuery.data ? amapTablePageMetadata(amapQuery.data) : emptyMetadata}
                isFetching={amapQuery.isFetching}
                onEdit={setEditingCandidate}
              />
            </TabsContent>
            <TabsContent value={pawtripLocationsTab}>
              <SavedLocationsTable
                rows={savedQuery.data?.items ?? emptySavedRows}
                pagination={savedPagination}
                onPaginationChange={setSavedPagination}
                metadata={savedQuery.data ? savedLocationTablePageMetadata(savedQuery.data) : emptyMetadata}
                isFetching={savedQuery.isFetching}
                onEdit={setEditingSavedLocation}
              />
            </TabsContent>
          </Tabs>
          {editingCandidate && selectedTypeGroup ? (
            <AmapCandidateEditor
              candidate={editingCandidate}
              typeGroup={selectedTypeGroup}
              listParams={amapParams}
              onClose={() => setEditingCandidate(null)}
            />
          ) : null}
          {editingSavedLocation ? (
            <SavedLocationEditor
              location={editingSavedLocation}
              onClose={() => setEditingSavedLocation(null)}
            />
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}

function RegionTreeSelect({
  regions,
  value,
  onValueChange,
}: {
  regions: AdministrativeRegion[];
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectRegion = (regionCode: string | undefined) => {
    onValueChange(regionCode);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={
          <Button
            type="button"
            variant="outline"
            aria-label="城市筛选"
            className="w-full justify-between"
          />
        }
      >
        <span>{getRegionLabel(regions, value ?? null)}</span>
        <ChevronDown aria-hidden="true" data-icon="inline-end" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={4} align="start" className="z-50 w-(--anchor-width)">
          <Popover.Popup className="max-h-80 w-full overflow-y-auto rounded-lg border bg-popover p-2 text-popover-foreground shadow-md outline-none">
            <ul className="grid gap-1" aria-label="省市选项">
              {value ? (
                <li>
                  <button
                    type="button"
                    className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => selectRegion(undefined)}
                  >
                    清除城市选择
                  </button>
                </li>
              ) : null}
              {regions.map((province) => (
                <li key={province.adcode}>
                  {province.children.length > 0 ? (
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                        <ChevronRight
                          aria-hidden="true"
                          className="size-4 shrink-0 transition-transform group-open:rotate-90"
                        />
                        {province.name}
                      </summary>
                      <ul className="ml-4 grid gap-1 border-l pl-3">
                        {province.children.map((city) => (
                          <li key={city.adcode}>
                            <RegionTreeOption
                              name={city.name}
                              selected={value === city.adcode}
                              onSelect={() => selectRegion(city.adcode)}
                            />
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <RegionTreeOption
                      name={province.name}
                      selected={value === province.adcode}
                      onSelect={() => selectRegion(province.adcode)}
                    />
                  )}
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function RegionTreeOption({
  name,
  selected,
  onSelect,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
      onClick={onSelect}
    >
      {name}
      {selected ? <Check aria-hidden="true" className="size-4" /> : null}
    </button>
  );
}

function AmapLocationsTable({
  rows,
  hasRegion,
  pagination,
  onPaginationChange,
  metadata,
  isFetching,
  onEdit,
}: {
  rows: AmapCandidate[];
  hasRegion: boolean;
  pagination: PaginationState;
  onPaginationChange: (updater: PaginationState | ((previous: PaginationState) => PaginationState)) => void;
  metadata: TablePageMetadata;
  isFetching: boolean;
  onEdit: (candidate: AmapCandidate) => void;
}) {
  const columns: ColumnDef<typeof paginationFeatures, AmapCandidate>[] = [
    ...amapColumns,
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`编辑 ${row.original.name || "地点"}`}
          disabled={row.original.saved}
          onClick={() => onEdit(row.original)}
        >
          编辑
        </Button>
      ),
    },
  ];
  const table = useTable({
    features: paginationFeatures,
    columns,
    data: rows,
    state: { pagination },
    onPaginationChange,
    manualPagination: true,
    pageCount: metadata.pageCount,
  });

  return (
    <section aria-label="所有地点表格" className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <Table aria-label="所有地点">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={amapColumns.length} className="h-24 text-center">
                  {isFetching
                    ? "加载中…"
                    : hasRegion ? "没有符合条件的地点" : "请选择城市后查询"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        pagination={pagination}
        metadata={metadata}
        isFetching={isFetching}
        showTotals={false}
        onPrevious={() => table.previousPage()}
        onNext={() => table.nextPage()}
      />
    </section>
  );
}

function SavedLocationsTable({
  rows,
  pagination,
  onPaginationChange,
  metadata,
  isFetching,
  onEdit,
}: {
  rows: SavedLocation[];
  pagination: PaginationState;
  onPaginationChange: (updater: PaginationState | ((previous: PaginationState) => PaginationState)) => void;
  metadata: TablePageMetadata;
  isFetching: boolean;
  onEdit: (location: SavedLocation) => void;
}) {
  const columns: ColumnDef<typeof paginationFeatures, SavedLocation>[] = [
    ...savedColumns,
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`编辑 ${row.original.name}`}
          onClick={() => onEdit(row.original)}
        >
          编辑
        </Button>
      ),
    },
  ];
  const table = useTable({
    features: paginationFeatures,
    columns,
    data: rows,
    state: { pagination },
    onPaginationChange,
    manualPagination: true,
    rowCount: metadata.rowCount,
  });

  return (
    <section aria-label="pawtrip地点表格" className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <Table aria-label="pawtrip地点">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={savedColumns.length} className="h-24 text-center">
                  {isFetching ? "加载中…" : "没有已保存的地点"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        pagination={pagination}
        metadata={metadata}
        isFetching={isFetching}
        onPrevious={() => table.previousPage()}
        onNext={() => table.nextPage()}
      />
    </section>
  );
}

function getRegionLabel(
  regions: AdministrativeRegion[] | undefined,
  value: string | null,
): string {
  if (!value) return "请选择城市";

  const province = regions?.find((region) => region.adcode === value);
  if (province) return province.name;

  for (const region of regions ?? []) {
    const city = region.children.find((child) => child.adcode === value);
    if (city) return city.name;
  }

  return value;
}

const emptyMetadata: TablePageMetadata = {
  rowCount: 0,
  pageCount: 0,
  hasNext: false,
  hasPrevious: false,
  totalIsExact: true,
};
