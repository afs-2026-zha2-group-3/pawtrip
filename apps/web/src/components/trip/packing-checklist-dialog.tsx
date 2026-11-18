import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import pawStickerSm from "@/assets/paw-sticker-sm.png";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/http/api-error";
import {
  createPackingItemMutationOptions,
  deletePackingItemMutationOptions,
  generatePackingChecklistMutationOptions,
  packingChecklistQueryKeys,
  packingChecklistQueryOptions,
  packingErrorMessage,
  updatePackingItemMutationOptions,
  type PackingCategory,
  type PackingItem,
} from "@/queries/packing-checklist";

const CATEGORY_ORDER: PackingCategory[] = [
  "DOCUMENTS",
  "FOOD",
  "TRAVEL",
  "HEALTH",
  "CLEANING",
];

const categoryLabels: Record<PackingCategory, string> = {
  DOCUMENTS: "证件",
  FOOD: "饮食",
  TRAVEL: "出行",
  HEALTH: "健康",
  CLEANING: "清洁",
};

interface PackingChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: number;
}

export function PackingChecklistDialog({
  open,
  onOpenChange,
  tripId,
}: PackingChecklistDialogProps) {
  const queryClient = useQueryClient();
  const checklistQuery = useQuery(
    packingChecklistQueryOptions(tripId, { enabled: open }),
  );
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PackingCategory>("TRAVEL");
  const [quantity, setQuantity] = useState("1");
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: packingChecklistQueryKeys.detail(tripId),
    });

  const generateMutation = useMutation({
    ...generatePackingChecklistMutationOptions(tripId),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (error) => setActionError(packingErrorMessage(error)),
  });
  const createMutation = useMutation({
    ...createPackingItemMutationOptions(tripId),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (error) => setActionError(packingErrorMessage(error)),
  });
  const updateMutation = useMutation({
    ...updatePackingItemMutationOptions(tripId),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (error) => setActionError(packingErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    ...deletePackingItemMutationOptions(tripId),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (error) => setActionError(packingErrorMessage(error)),
  });

  const checklist = checklistQuery.data ?? null;
  const progress = checklist?.progress ?? { checked: 0, total: 0 };
  const complete = progress.total > 0 && progress.checked === progress.total;
  const profileRequired =
    generateMutation.error instanceof ApiError &&
    generateMutation.error.code === "PET_PROFILE_REQUIRED";
  const pending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const trimmed = name.trim();
    const parsedQuantity = Number(quantity);
    if (!trimmed) {
      setFormError("请填写物品名称。");
      return;
    }
    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 1 ||
      parsedQuantity > 99
    ) {
      setFormError("数量需为 1–99 的整数。");
      return;
    }
    createMutation.mutate(
      { name: trimmed, category, quantity: parsedQuantity },
      {
        onSuccess: () => {
          setName("");
          setQuantity("1");
        },
      },
    );
  }

  function toggleItem(item: PackingItem, checked: boolean) {
    updateMutation.mutate({ itemId: item.id, input: { checked } });
  }

  function commitQuantity(item: PackingItem, value: number) {
    if (value === item.quantity) {
      return;
    }
    updateMutation.mutate({ itemId: item.id, input: { quantity: value } });
  }

  function removeItem(item: PackingItem) {
    deleteMutation.mutate(item.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl print:hidden">
        <div data-testid="packing-checklist-dialog" className="flex flex-col gap-3">
          <img
            src={pawStickerSm}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-3 right-20 w-12 select-none"
          />
          <DialogHeader className="pr-36">
            <DialogTitle>携带清单</DialogTitle>
            <DialogDescription>
              按宠物档案与行程场景生成，勾选与修改会自动保存。
            </DialogDescription>
          </DialogHeader>

          {checklistQuery.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              正在读取携带清单…
            </p>
          ) : checklistQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-sm">
              <p role="alert" className="text-muted-foreground">
                清单加载失败，请稍后重试。
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void checklistQuery.refetch()}
              >
                重试
              </Button>
            </div>
          ) : !checklist ? (
            profileRequired ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  还没有宠物档案，先创建档案才能按档案生成携带清单。
                </p>
                <Link
                  to="/paws"
                  className="text-sm text-primary underline underline-offset-2"
                >
                  去创建宠物档案
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  尚未生成携带清单
                </p>
                <Button
                  type="button"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                >
                  <Plus aria-hidden="true" />
                  生成携带清单
                </Button>
                {actionError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {actionError}
                  </p>
                ) : null}
              </div>
            )
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/40 px-4 py-3">
                <p
                  data-testid="packing-dialog-progress"
                  className="text-sm font-medium"
                >
                  已打包 {progress.checked} / {progress.total} 件
                </p>
                {complete ? (
                  <p className="text-sm text-paw-accent">
                    全部打包完成，可以出发啦！
                  </p>
                ) : null}
              </div>

              {checklist.items.length === 0 ? (
                <p className="rounded-2xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                  清单暂无物品，可在下方新增。
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {CATEGORY_ORDER.map((group) => {
                    const items = checklist.items.filter(
                      (item) => item.category === group,
                    );
                    if (items.length === 0) {
                      return null;
                    }
                    return (
                      <section key={group} aria-label={categoryLabels[group]}>
                        <h3 className="mb-2 text-sm font-medium text-paw-ink">
                          {categoryLabels[group]}
                        </h3>
                        <ul className="flex flex-col gap-2">
                          {items.map((item) => (
                            <PackingItemRow
                              key={item.id}
                              item={item}
                              disabled={pending}
                              onToggle={toggleItem}
                              onQuantityCommit={commitQuantity}
                              onDelete={removeItem}
                            />
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              )}

              <form
                onSubmit={handleAdd}
                className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-border p-3"
              >
                <div className="min-w-40 flex-1">
                  <Input
                    aria-label="新物品名称"
                    placeholder="物品名称"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <Select
                  value={category}
                  onValueChange={(value) => {
                    if (typeof value === "string") {
                      setCategory(value as PackingCategory);
                    }
                  }}
                >
                  <SelectTrigger aria-label="新物品分类" className="w-24">
                    <SelectValue>
                      {(value: PackingCategory | null) =>
                        value ? categoryLabels[value] : "分类"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CATEGORY_ORDER.map((value) => (
                        <SelectItem key={value} value={value}>
                          {categoryLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Input
                  aria-label="新物品数量"
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="w-16 text-center"
                />
                <Button type="submit" disabled={createMutation.isPending}>
                  新增
                </Button>
              </form>

              {formError ? (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              ) : null}
              {actionError ? (
                <p role="alert" className="text-sm text-destructive">
                  {actionError}
                </p>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PackingItemRow({
  item,
  disabled,
  onToggle,
  onQuantityCommit,
  onDelete,
}: {
  item: PackingItem;
  disabled: boolean;
  onToggle: (item: PackingItem, checked: boolean) => void;
  onQuantityCommit: (item: PackingItem, quantity: number) => void;
  onDelete: (item: PackingItem) => void;
}) {
  const [quantity, setQuantity] = useState(String(item.quantity));

  useEffect(() => {
    setQuantity(String(item.quantity));
  }, [item.quantity]);

  function commit() {
    const parsed = Number(quantity);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) {
      setQuantity(String(item.quantity));
      return;
    }
    onQuantityCommit(item, parsed);
  }

  return (
    <li
      data-testid="packing-item"
      className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2"
    >
      <Checkbox
        checked={item.checked}
        disabled={disabled}
        aria-label={`勾选 ${item.name}`}
        onCheckedChange={(checked) => onToggle(item, checked === true)}
      />
      <span
        className={
          item.checked
            ? "min-w-0 flex-1 truncate text-sm text-muted-foreground line-through"
            : "min-w-0 flex-1 truncate text-sm"
        }
      >
        {item.name}
      </span>
      <Input
        aria-label={`修改 ${item.name} 数量`}
        type="number"
        min={1}
        max={99}
        value={quantity}
        disabled={disabled}
        onChange={(event) => setQuantity(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        className="h-7 w-16 text-center"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`删除 ${item.name}`}
        disabled={disabled}
        onClick={() => onDelete(item)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}
