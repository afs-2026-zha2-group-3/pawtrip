import { PawPrint } from "lucide-react";
import TiltedCard, {
  TiltedCardLayer,
} from "@/components/ui/tilted-card";
import { photoDataUrl } from "@/lib/pet-photo";
import type { Pet, PetType } from "@/queries/pets";

const petTypeLabels: Record<PetType, string> = {
  CAT: "猫",
  DOG: "狗",
};

export function PetCard({
  pet,
  index,
  onOpen,
}: {
  pet: Pet;
  index: number;
  onOpen: (pet: Pet) => void;
}) {
  const photo = photoDataUrl(pet.photo);
  const typeLabel = petTypeLabels[pet.petType];
  const badgeLabel =
    pet.petType === "DOG" && pet.dogBreed ? pet.dogBreed.name : typeLabel;

  return (
    <TiltedCard
      imageSrc={photo ?? undefined}
      altText={`${pet.name}（${badgeLabel}）`}
      containerWidth="100%"
      containerHeight={320}
      imageWidth="100%"
      imageHeight={320}
      gyroscope={false}
      showTooltip={false}
      introDelay={index * 80}
      onClick={() => onOpen(pet)}
      className="w-full"
    >
      {photo ? null : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
          <PawPrint
            aria-hidden="true"
            className="size-16 text-muted-foreground/40"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <TiltedCardLayer depth={30}>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
          <span className="truncate text-lg font-semibold">{pet.name}</span>
          <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur">
            {badgeLabel}
          </span>
        </div>
      </TiltedCardLayer>
    </TiltedCard>
  );
}