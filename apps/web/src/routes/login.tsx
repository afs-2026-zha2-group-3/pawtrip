import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarDays, MapPinned, PawPrint } from "lucide-react";
import pawStickerLg from "@/assets/paw-sticker-lg.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "../lib/http/api-error";
import { authQueryOptions, login } from "../queries/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const features = [
  {
    icon: PawPrint,
    title: "宠物档案",
    detail: "记录毛孩子的基本信息与照片",
  },
  {
    icon: MapPinned,
    title: "宠物友好地点",
    detail: "城市、景点与周边服务的宠物规则一目了然",
  },
  {
    icon: CalendarDays,
    title: "行程规划",
    detail: "按天安排景点与交通，出发前心里有数",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useQuery({
    ...authQueryOptions,
    enabled: typeof window !== "undefined",
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (auth.isSuccess) {
      void navigate({ to: "/", replace: true });
    }
  }, [auth.isSuccess, navigate]);

  const mutation = useMutation({
    mutationFn: () => login(username, password),
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(authQueryOptions.queryKey, user);
      void navigate({ to: "/", replace: true });
    },
  });

  const errorMessage = mutation.isError
    ? mutation.error instanceof ApiError && mutation.error.status === 401
      ? "用户名或密码不正确。"
      : "登录失败，请重试。"
    : null;

  return (
    <main className="flex min-h-svh w-full items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[30px] bg-card shadow-pet-card ring-1 ring-foreground/10 lg:grid-cols-[1.08fr_1fr]">
        <section className="relative flex flex-col justify-between gap-8 bg-paw-accent-softer p-7 sm:p-10">
          <img
            src={pawStickerLg}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 -right-10 w-64 rotate-12 opacity-[0.06] select-none"
          />
          <div className="relative flex flex-col gap-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-paw-accent-strong text-white shadow-md">
                <PawPrint aria-hidden="true" className="size-6" />
              </span>
              <span className="text-[26px] font-semibold tracking-[-0.03em]">
                PawTrip
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold tracking-[0.35em] text-paw-accent-strong">
                携宠出行助手
              </p>
              <h1 className="max-w-sm text-[1.7rem] leading-[1.3] font-semibold tracking-tight sm:text-[2rem]">
                和毛孩子一起，
                <br />
                去看更大的世界
              </h1>
              <p className="hidden max-w-sm text-sm leading-6 text-muted-foreground sm:block">
                记录宠物档案，查看宠物友好城市与景点规则，把每一次出发都安排妥当。
              </p>
            </div>
            <ul className="hidden flex-col gap-4 sm:flex">
              {features.map(({ icon: Icon, title, detail }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-paw-accent-strong ring-1 ring-paw-accent/20">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{title}</span>
                    <span className="text-xs leading-5 text-muted-foreground">
                      {detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative hidden items-end justify-between gap-6 sm:flex">
            <p className="pb-1 text-xs leading-5 text-muted-foreground">
              每一次出发，
              <br />
              都有它同行。
            </p>
            <div
              aria-hidden="true"
              className="grid size-24 shrink-0 -rotate-6 place-items-center rounded-full border-2 border-dashed border-paw-accent-strong/40 text-paw-accent-strong"
            >
              <div className="flex flex-col items-center gap-0.5">
                <PawPrint className="size-5" />
                <span className="text-[9px] font-semibold tracking-[0.25em]">
                  PAWTRIP
                </span>
                <span className="text-[10px] font-medium tracking-[0.2em]">
                  携宠出行
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center gap-7 p-7 sm:p-10 lg:border-l lg:border-dashed lg:border-paw-accent/25">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">登录</h2>
            <p className="text-sm text-muted-foreground">
              使用你的 PawTrip 账号继续。
            </p>
          </div>
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                className="h-10 bg-background"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="h-10 bg-background"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {errorMessage ? (
              <p className="text-sm font-medium text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <Button
              type="submit"
              className="mt-1 h-10 w-full rounded-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "登录中…" : "登录"}
            </Button>
          </form>
          <p className="border-t border-dashed border-paw-accent/25 pt-5 text-xs text-muted-foreground">
            PawTrip · 携宠出行，一路有它
          </p>
        </section>
      </div>
    </main>
  );
}
