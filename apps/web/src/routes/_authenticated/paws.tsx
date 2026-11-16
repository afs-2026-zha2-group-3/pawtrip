import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PetCard } from "./-pet-card";
import { PetDeleteDialog, PetDialog } from "./-pet-dialogs";
import { petsQueryOptions, type Pet } from "../../queries/pets";

export const Route = createFileRoute("/_authenticated/paws")({
  component: PawsPage,
});

function PawsPage() {
  const petsQuery = useQuery(petsQueryOptions());
  const [dialog, setDialog] = useState<{ pet: Pet | null } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pet | null>(null);
  const pets = petsQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">我的宠物</h1>
          <p className="text-sm text-muted-foreground">管理宠物资料与照片。</p>
        </div>
        <Button onClick={() => setDialog({ pet: null })}>
          <Plus aria-hidden="true" />
          添加宠物
        </Button>
      </header>

      {petsQuery.isPending ? (
        <PetGridSkeleton />
      ) : pets.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>还没有宠物</CardTitle>
            <CardDescription>
              添加第一只宠物，开始记录你们的信息。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setDialog({ pet: null })}>
              <Plus aria-hidden="true" />
              添加第一只宠物
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet, index) => (
            <PetCard
              key={pet.id}
              pet={pet}
              index={index}
              onOpen={(selected) => setDialog({ pet: selected })}
            />
          ))}
        </div>
      )}

      {dialog ? (
        <PetDialog
          key={dialog.pet?.id ?? "new"}
          initialPet={dialog.pet}
          onClose={() => setDialog(null)}
          onRequestDelete={(pet) => {
            setDialog(null);
            setPendingDelete(pet);
          }}
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

function PetGridSkeleton() {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
    >
      <span className="sr-only">正在加载宠物…</span>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-80 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}