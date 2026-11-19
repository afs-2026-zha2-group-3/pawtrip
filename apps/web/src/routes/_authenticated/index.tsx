import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import TiltedCard from "@/components/ui/tilted-card";
import { cn } from "@/lib/utils";
import { useCompanionHint } from "@/lib/companion/use-companion-hint";
import { useActiveTrip } from "@/lib/trip/selectors";
import { petsPreviewQueryOptions } from "../../queries/pets";
import { tripsPreviewQueryOptions } from "../../queries/trips";
import homeTitle from "@/assets/home-title.png";
import photoSunroom from "@/assets/home-photos/Rectangle 4572.png";
import photoCamper from "@/assets/home-photos/Rectangle 4571.png";
import photoCarWindow from "@/assets/home-photos/Rectangle 4571-1.png";
import photoCatBowls from "@/assets/home-photos/Rectangle 4571-2.png";
import photoMeadow from "@/assets/home-photos/Rectangle 4571-3.png";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

const photos = [
  { src: photoSunroom, alt: "阳光房里躺在宠物床上的三只狗", title: "Pet Friendly Hotel" },
  { src: photoCamper, alt: "房车前草地上的萨摩耶与猫", title: "Pet Friendly Park" },
  { src: photoCarWindow, alt: "从车窗探出头的两只柴犬", title: "Pet Traffic" },
  { src: photoCatBowls, alt: "坐在食碗旁的橘猫", title: "Pet Canteen" },
  { src: photoMeadow, alt: "草地上与主人玩耍的小狗", title: "Pet Play" },
];

function HomePage() {
  const pets = useQuery({ ...petsPreviewQueryOptions(), throwOnError: false });
  const trips = useQuery({ ...tripsPreviewQueryOptions(), throwOnError: false });
  const active = useActiveTrip();

  const hint =
    pets.isPending || trips.isPending
      ? null
      : (pets.data ?? []).length === 0
        ? "先给我建个档案吧，这样我才能被你记住"
        : (trips.data ?? []).length === 0
          ? "我从城市浏览开始带你挑目的地吧"
          : active
            ? `继续完善「${active.name}」吧，我还想多去几个地方`
            : "去「我的行程」点一张卡片，我们接着上次的旅程";
  useCompanionHint(hint, Route.fullPath);

  return (
    <main className="flex w-full flex-col items-center pt-20">
      <div className="flex w-full max-w-7xl flex-col items-center px-6">
        <img
          src={homeTitle}
          alt="Every Trip, Pet-Friendly. Discover pet-friendly places, plan your perfect trip, and make every journey unforgettable with your furry friend."
          className="w-full max-w-[1120px] animate-in fade-in slide-in-from-bottom-4 duration-700 dark:invert"
        />
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-4 delay-150 duration-700 fill-mode-backwards">
          <Link
            to="/paws"
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2 rounded-full px-5 shadow-xs")}
          >
            创建宠物档案
            <CircleArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link
            to={active ? "/attractions" : "/cities"}
            className={cn(buttonVariants(), "h-10 gap-2 rounded-full px-5 shadow-xs")}
          >
            {active ? "继续旅程" : "开始旅程"}
            <CircleArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
      <div className="mt-6 flex w-full snap-x gap-10 overflow-x-auto px-8 pt-8 pb-16 [scrollbar-color:var(--paw-accent)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-paw-accent/50 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5 min-[1330px]:justify-center min-[1330px]:snap-none">
        {photos.map((photo, index) => (
          <div
            key={photo.src}
            className="shrink-0 snap-center animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-backwards"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <TiltedCard
              imageSrc={photo.src}
              altText={photo.alt}
              containerWidth={220}
              containerHeight={220}
              imageWidth={220}
              imageHeight={220}
              radius={18}
              rotateAmplitude={10}
              scaleOnHover={1.06}
              glare={0.3}
              shadow={0.35}
              intro={false}
            >
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] bg-gradient-to-t from-black/55 via-black/20 to-transparent px-3 pt-10 pb-2.5 text-left text-lg font-medium text-white font-['Constantia'] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {photo.title}
              </div>
            </TiltedCard>
          </div>
        ))}
      </div>
    </main>
  );
}
