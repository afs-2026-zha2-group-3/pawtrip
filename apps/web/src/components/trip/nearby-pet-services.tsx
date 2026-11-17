import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="font-medium text-foreground">
        {label} · {service.name}
      </p>
      <p className="text-muted-foreground">
        距{attractionName}约 {formatDistanceKm(service.distanceMeters)}
      </p>
      <p className="text-muted-foreground">{service.address ?? "地址未收录"}</p>
      <p className="text-muted-foreground">
        营业时间：{service.openingHours ?? "暂无"}
      </p>
    </div>
  );
}
