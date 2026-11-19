import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PawPrint, Plus } from "lucide-react";
import {
  PetProfileView,
  petPillPrimaryClass,
} from "@/components/pet/pet-profile-card";
import { Button } from "@/components/ui/button";
import { useCompanionHint } from "@/lib/companion/use-companion-hint";
import { cn } from "@/lib/utils";
import { photoDataUrl } from "@/lib/pet-photo";
import { PetDeleteDialog, PetDialog } from "./-pet-dialogs";
import { petsQueryOptions, type Pet } from "../../queries/pets";

export const Route = createFileRoute("/_authenticated/paws")({
  component: PawsPage,
});

function PawsPage() {
  const petsQuery = useQuery(petsQueryOptions());
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{ pet: Pet | null } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pet | null>(null);
  const pets = petsQuery.data ?? [];
  const selected = pets.find((pet) => pet.id === selectedId) ?? pets[0] ?? null;

  useCompanionHint(
    petsQuery.isPending
      ? null
      : selected
        ? "我的档案都在这呢，填写的越全推荐的越准！"
        : "先给我建个档案吧，之后的推荐都靠它",
    Route.fullPath,
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {petsQuery.isPending ? (
        <div
          className="h-[420px] animate-pulse rounded-[26px] bg-card/80"
          aria-busy="true"
        >
          <span className="sr-only">正在加载宠物…</span>
        </div>
      ) : selected ? (
        <>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {pets.map((pet) => {
              const thumb = photoDataUrl(pet.photo);
              const active = pet.id === selected.id;
              return (
                <button
                  key={pet.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => setSelectedId(pet.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-foreground text-background shadow-md"
                      : "bg-card text-foreground shadow-sm hover:bg-muted",
                  )}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="size-6 rounded-full object-cover"
                    />
                  ) : (
                    <PawPrint aria-hidden="true" className="size-4" />
                  )}
                  {pet.name}
                </button>
              );
            })}
            <Button
              variant="outline"
              className="rounded-full bg-card px-4 shadow-sm"
              onClick={() => setDialog({ pet: null })}
            >
              <Plus aria-hidden="true" />
              添加宠物
            </Button>
          </div>
          <PetProfileView
            pet={selected}
            onEdit={() => setDialog({ pet: selected })}
            onDelete={() => setPendingDelete(selected)}
          />
        </>
      ) : (
        <section className="flex flex-col items-center gap-3 rounded-[26px] bg-card p-8 text-center shadow-pet-card">
          <PawPrint aria-hidden="true" className="size-10 text-muted-foreground/40" />
          <h2 className="text-lg font-medium leading-[21.6px]">还没有宠物</h2>
          <p className="text-sm text-muted-foreground">
            添加第一只宠物，开始记录你们的信息。
          </p>
          <Button
            className={petPillPrimaryClass}
            onClick={() => setDialog({ pet: null })}
          >
            <Plus aria-hidden="true" />
            添加第一只宠物
          </Button>
        </section>
      )}

      {dialog ? (
        <PetDialog
          key={dialog.pet?.id ?? "new"}
          initialPet={dialog.pet}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {pendingDelete ? (
        <PetDeleteDialog
          pet={pendingDelete}
          onClose={() => setPendingDelete(null)}
        />
      ) : null}
    </main>
  );
}