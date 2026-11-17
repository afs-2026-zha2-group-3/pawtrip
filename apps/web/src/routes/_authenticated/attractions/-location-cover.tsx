import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { safeImageUrl } from "@/lib/location-image";

export function LocationCover({
  coverPhotoUrl,
  name,
  typeLabel,
  className,
}: {
  coverPhotoUrl: string | null;
  name: string;
  typeLabel: string;
  className?: string;
}) {
  const imageUrl = safeImageUrl(coverPhotoUrl);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    setHasLoadError(false);
  }, [imageUrl]);

  if (!imageUrl || hasLoadError) {
    return (
      <div
        role="img"
        aria-label={`${name}暂无图片`}
        className={cn(
          "flex aspect-video w-full flex-col items-center justify-center gap-1.5 bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageOff aria-hidden className="size-6" />
        <span className="text-xs">{typeLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setHasLoadError(true)}
      className={cn("aspect-video w-full object-cover", className)}
    />
  );
}