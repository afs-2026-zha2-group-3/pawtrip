import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
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
import { authQueryOptions } from "../../../queries/auth";
import {
  administrativeRegionsQueryOptions,
  type PetPolicies,
} from "../../../queries/admin-locations";
import {
  citiesQueryOptions,
  type CityLevelFilter,
  type CityListItem,
} from "../../../queries/admin-cities";
import {
  type TablePageMetadata,
} from "../../../queries/location-pagination";
import { CityEditor } from "./-city-editor";
import { PaginationControls } from "./-pagination-controls";

const paginationFeatures = tableFeatures({ rowPaginationFeature });
const initialCityPagination: PaginationState = { pageIndex: 0, pageSize: 10 };
const emptyMetadata: TablePageMetadata = {
  rowCount: 0,
  pageCount: 0,
  hasNext: false,
  hasPrevious: false,
  totalIsExact: true,
};

export const Route = createFileRoute("/_authenticated/admin/cities")({
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
  component: AdminCitiesRoute,
});

function AdminCitiesRoute() {
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

  return <CityManagementPage />;
}

function CityManagementPage() {
  const regionsQuery = useQuery(administrativeRegionsQueryOptions());
  const [provinceAdcode, setProvinceAdcode] = useState<string>();
  const [level, setLevel] = useState<CityLevelFilter>();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pagination, setPagination] = useState<PaginationState>(initialCityPagination);
  const [editingCity, setEditingCity] = useState<CityListItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput), 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  useEffect(() => {
    setPagination((current) => current.pageIndex === 0 ? current : { ...current, pageIndex: 0 });
  }, [provinceAdcode, level, keyword]);

  const citiesQuery = useQuery(citiesQueryOptions({
    provinceAdcode,
    level,
    keyword,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  }));
  const metadata = citiesQuery.data ? cityTablePageMetadata(citiesQuery.data) : emptyMetadata;

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>城市管理</CardTitle>
          <CardDescription>
            维护城市与省级叶节点的携宠政策和允许饲养犬种，数据仅来自系统数据库。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <span className="text-sm font-medium">省份</span>
              <Select
                value={provinceAdcode ?? "all"}
                onValueChange={(value) => {
                  if (typeof value !== "string") return;
                  setProvinceAdcode(value === "all" ? undefined : value);
                }}
                disabled={!regionsQuery.data?.length}
              >
                <SelectTrigger aria-label="省份筛选" className="w-full">
                  <SelectValue>
                    {(value: string | null) => value === "all" || !value
                      ? "全部省份"
                      : regionsQuery.data?.find((region) => region.adcode === value)?.name ?? "全部省份"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">全部省份</SelectItem>
                    {regionsQuery.data?.map((province) => (
                      <SelectItem key={province.adcode} value={province.adcode}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">级别</span>
              <Select
                value={level ?? "all"}
                onValueChange={(value) => {
                  if (typeof value !== "string") return;
                  setLevel(value === "all" ? undefined : value as CityLevelFilter);
                }}
              >
                <SelectTrigger aria-label="级别筛选" className="w-full">
                  <SelectValue>
                    {(value: string | null) => levelLabel(value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">全部级别</SelectItem>
                    <SelectItem value="city">城市级</SelectItem>
                    <SelectItem value="province">省级叶节点</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">关键词</span>
              <Input
                aria-label="搜索城市"
                placeholder="搜索城市名称"
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
              />
            </div>
          </div>

          <CityTable
            rows={citiesQuery.data?.items ?? emptyRows}
            pagination={pagination}
            onPaginationChange={setPagination}
            metadata={metadata}
            isFetching={citiesQuery.isFetching}
            onEdit={setEditingCity}
          />
        </CardContent>
      </Card>
      {editingCity ? (
        <CityEditor city={editingCity} onClose={() => setEditingCity(null)} />
      ) : null}
    </main>
  );
}

const emptyRows: CityListItem[] = [];

function CityTable({
  rows,
  pagination,
  onPaginationChange,
  metadata,
  isFetching,
  onEdit,
}: {
  rows: CityListItem[];
  pagination: PaginationState;
  onPaginationChange: (updater: PaginationState | ((previous: PaginationState) => PaginationState)) => void;
  metadata: TablePageMetadata;
  isFetching: boolean;
  onEdit: (city: CityListItem) => void;
}) {
  const columns: ColumnDef<typeof paginationFeatures, CityListItem>[] = [
    { accessorKey: "name", header: "名称" },
    { accessorKey: "provinceName", header: "省份" },
    {
      id: "level",
      header: "级别",
      cell: ({ row }) => row.original.level === "city" ? "城市级" : "省级叶节点",
    },
    {
      id: "policy",
      header: "政策配置",
      cell: ({ row }) => policySummary(row.original.petPolicies),
    },
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
    <section aria-label="城市列表" className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <Table aria-label="城市">
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {isFetching ? "加载中…" : "没有符合条件的城市"}
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

function policySummary(policies: PetPolicies): string {
  const values = [
    policies.allowedPetTypes,
    policies.maxPetsPerPerson,
    policies.maxSinglePetWeightKg,
    policies.maxSinglePetShoulderHeightCm,
    policies.leashRequired,
    policies.vaccinationProofRequired,
    policies.extraFeeCents,
    policies.reservationRequired,
  ];
  const configured = values.filter((value) => value !== null).length;
  return configured === 0 ? "未配置" : `${configured}/8`;
}

function levelLabel(value: string | null): string {
  if (value === "city") return "城市级";
  if (value === "province") return "省级叶节点";
  return "全部级别";
}

function cityTablePageMetadata(page: {
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}): TablePageMetadata {
  return {
    rowCount: page.totalElements,
    pageCount: page.totalPages,
    hasNext: page.hasNext,
    hasPrevious: page.hasPrevious,
    totalIsExact: true,
  };
}
