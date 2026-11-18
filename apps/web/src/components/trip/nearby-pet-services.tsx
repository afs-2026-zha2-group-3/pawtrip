import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, MapPin, Phone, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { formatDistanceKm } from "@/lib/distance";
import {
  nearbyPetServicesQueryOptions,
  type NearbyPetService,
} from "@/queries/locations";

export function NearbyPetServices({
  poiId,
  attractionName,
}: {
  poiId: string;
  attractionName: string;
}) {
  const [open, setOpen] = useState(false);
  const services = useQuery({
    ...nearbyPetServicesQueryOptions(poiId),
    enabled: open,
    throwOnError: false,
  });
  const hospital = services.data?.hospital ?? null;
  const supplies = services.data?.supplies ?? null;

  return (
    <details
      className="mt-2"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer text-sm text-muted-foreground select-none">
        附近宠物服务
      </summary>
      <div className="mt-2 flex flex-col gap-2 text-xs">
        {!open ? null : services.isPending ? (
          <p className="text-muted-foreground">正在查找附近宠物服务…</p>
        ) : services.isError ? (
          <p className="text-muted-foreground">暂时无法获取附近宠物服务</p>
        ) : !hospital && !supplies ? (
          <p className="text-muted-foreground">暂无附近宠物服务</p>
        ) : (
          <>
            {hospital ? (
              <NearbyServiceRow
                label="宠物医院"
                service={hospital}
                attractionName={attractionName}
              />
            ) : null}
            {supplies ? (
              <NearbyServiceRow
                label="宠物用品店"
                service={supplies}
                attractionName={attractionName}
              />
            ) : null}
          </>
        )}
      </div>
    </details>
  );
}

function NearbyServiceRow({
  label,
  service,
  attractionName,
}: {
  label: string;
  service: NearbyPetService;
  attractionName: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md bg-muted/40 px-3 py-2">
      <p className="font-medium text-foreground">
        {label} · {service.name}
      </p>
      <p className="text-muted-foreground">
        距{attractionName}约 {formatDistanceKm(service.distanceMeters)}
      </p>
      <CopyableField
        icon={Phone}
        label="电话"
        value={usablePhone(service.tel)}
        emptyText="暂无电话"
        copyAriaLabel={`复制${service.name}电话`}
      />
      <CopyableField
        icon={MapPin}
        label="地址"
        value={usableAddress(service.address)}
        emptyText="暂无地址"
        copyAriaLabel={`复制${service.name}地址`}
      />
      <p className="text-muted-foreground">
        营业时间：{service.openingHours ?? "暂无"}
      </p>
    </div>
  );
}

function usablePhone(value: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return /\d/.test(trimmed) ? trimmed : null;
}

function usableAddress(value: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function CopyableField({
  icon: Icon,
  label,
  value,
  emptyText,
  copyAriaLabel,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  emptyText: string;
  copyAriaLabel: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  if (value == null) {
    return (
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          {label}：{emptyText}
        </span>
      </p>
    );
  }

  const text = value;

  async function handleCopy() {
    const ok = await copyText(text);
    setStatus(ok ? "copied" : "error");
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="shrink-0 text-muted-foreground">{label}：</span>
      <span className="min-w-0 flex-1 break-all text-foreground">{text}</span>
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="shrink-0"
        aria-label={copyAriaLabel}
        onClick={() => void handleCopy()}
      >
        {status === "copied" ? (
          <Check className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        ) : (
          <Copy aria-hidden="true" />
        )}
        <span role="status" aria-live="polite">
          {status === "copied" ? "已复制" : status === "error" ? "复制失败" : "复制"}
        </span>
      </Button>
    </div>
  );
}