import type { ChangeEvent, ReactNode } from "react";
import { CircleFadingPlus, PawPrint, Pencil, Trash2 } from "lucide-react";
import pawStickerLg from "@/assets/paw-sticker-lg.png";
import pawStickerSm from "@/assets/paw-sticker-sm.png";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { photoDataUrl } from "@/lib/pet-photo";
import type { Pet, PetPersonality, PetPreference, PetType } from "@/queries/pets";

export const petTypeLabels: Record<PetType, string> = {
  CAT: "猫",
  DOG: "狗",
};

// REQ-014 词表标签（design D1/D8，键与后端枚举镜像；表单与详情共用）
export const preferenceLabels: Record<PetPreference, string> = {
  SWIMMING: "游泳",
  HIKING: "爬山",
  GRASS_RUNNING: "草地奔跑",
  CITY_WALKING: "城市漫步",
  SNOW_PLAY: "玩雪",
};

export const personalityLabels: Record<PetPersonality, string> = {
  ENERGETIC: "活泼好动",
  CALM: "温和平静",
  TIMID: "胆小敏感",
};

export const petCardTitleClass =
  "text-[22px] font-medium leading-[26.4px] tracking-[-0.0227em] text-foreground";
export const petRowClass = "grid grid-cols-[6rem_1fr] items-center gap-4";
export const petLabelClass = "text-sm font-normal text-muted-foreground";
export const petValueClass = "text-base text-foreground";
export const petPillPrimaryClass =
  "h-9 gap-2 rounded-full border border-foreground/20 bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90 [&_svg:not([class*='size-'])]:size-4";
export const petPillOutlineClass =
  "h-9 gap-2 rounded-full border-border bg-card px-4 text-sm font-medium hover:bg-muted [&_svg:not([class*='size-'])]:size-4";

const PHOTO_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";

export function PetProfileCard({
  title,
  photo,
  photoAlt,
  onPhotoSelect,
  photoError,
  children,
  footer,
}: {
  title: ReactNode;
  photo: string | null;
  photoAlt: string;
  onPhotoSelect?: (event: ChangeEvent<HTMLInputElement>) => void;
  photoError?: string | null;
  children: ReactNode;
  footer: ReactNode;
}) {
  const photoBlock = photo ? (
    <img
      src={photo}
      alt={photoAlt}
      className="aspect-[298/378] w-full rounded-2xl object-cover"
    />
  ) : (
    <div className="grid aspect-[298/378] w-full place-content-center rounded-2xl bg-gradient-to-br from-muted to-secondary">
      <PawPrint aria-hidden="true" className="size-12 text-muted-foreground/40" />
    </div>
  );

  return (
    <section className="relative w-full max-w-3xl rounded-[26px] bg-card p-6 shadow-pet-card sm:p-8">
      <img
        src={pawStickerLg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-5 w-[72px] select-none"
      />
      <img
        src={pawStickerSm}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-[84px] w-[38px] select-none"
      />
      <div className="flex flex-col gap-6">
        {title}
        <div className="flex flex-col gap-6 md:flex-row md:gap-10">
          <div className="w-full max-w-[220px] shrink-0">
            {onPhotoSelect ? (
              <label className="group relative block cursor-pointer">
                <input
                  type="file"
                  accept={PHOTO_ACCEPT}
                  className="sr-only"
                  onChange={onPhotoSelect}
                />
                {photoBlock}
                <span className="absolute bottom-2 right-2 grid size-8 place-content-center rounded-full bg-card text-foreground shadow-md transition-transform group-hover:scale-110">
                  <CircleFadingPlus aria-hidden="true" className="size-4" />
                </span>
                <span className="sr-only">更换照片</span>
              </label>
            ) : (
              photoBlock
            )}
            {photoError ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {photoError}
              </p>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 md:min-h-[279px]">
            {children}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {footer}
        </div>
      </div>
    </section>
  );
}

export function PetProfileView({
  pet,
  onEdit,
  onDelete,
}: {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <PetProfileCard
      title={<h2 className={petCardTitleClass}>{pet.name}的档案</h2>}
      photo={photoDataUrl(pet.photo)}
      photoAlt={`${pet.name}的照片`}
      footer={
        <>
          <Button
            variant="outline"
            aria-label={`删除 ${pet.name}`}
            className="size-9 rounded-full border-border bg-card hover:bg-muted [&_svg:not([class*='size-'])]:size-4"
            onClick={onDelete}
          >
            <Trash2 aria-hidden="true" />
          </Button>
          <Button className={petPillPrimaryClass} onClick={onEdit}>
            <Pencil aria-hidden="true" />
            编辑
          </Button>
        </>
      }
    >
      <ProfileRow label="名字" value={pet.name} />
      <ProfileRow label="类型" value={petTypeLabels[pet.petType]} />
      {pet.petType === "DOG" ? (
        <ProfileRow label="品种" value={pet.dogBreed?.name ?? "未设置"} />
      ) : null}
      <ProfileRow label="体重（kg）" value={String(pet.weightKg)} />
      <ProfileRow label="肩高（cm）" value={String(pet.shoulderHeightCm)} />
      <ProfileRow
        label="喜好"
        value={
          pet.preferences.length > 0
            ? pet.preferences
                .map((preference) => preferenceLabels[preference])
                .join("、")
            : "未设置"
        }
      />
      <ProfileRow
        label="性格"
        value={pet.personality ? personalityLabels[pet.personality] : "未设置"}
      />
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <span className="flex items-center gap-2">
          <Checkbox
            checked={pet.hasLeash}
            disabled
            aria-label="有牵引绳"
            className="disabled:opacity-100"
          />
          <span className="text-sm text-foreground">有牵引绳</span>
        </span>
        <span className="flex items-center gap-2">
          <Checkbox
            checked={pet.hasVaccinationProof}
            disabled
            aria-label="有免疫证明"
            className="disabled:opacity-100"
          />
          <span className="text-sm text-foreground">有免疫证明</span>
        </span>
      </div>
    </PetProfileCard>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={petRowClass}>
      <span className={petLabelClass}>{label}</span>
      <span className={petValueClass}>{value}</span>
    </div>
  );
}