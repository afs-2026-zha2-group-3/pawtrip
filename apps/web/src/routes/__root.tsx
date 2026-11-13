import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ApiError } from "../lib/http/api-error";
import { TanStackDevtools } from "@tanstack/react-devtools";
import Footer from "../components/Footer";
import Header from "../components/Header";

import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFoundComponent,
});

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const queryClient = useQueryClient();
  const message = error instanceof ApiError ? error.detail : "Something went wrong.";

  const handleRetry = async () => {
    await queryClient.resetQueries();
    reset();
  };

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <p className="island-kicker mb-3">PawTrip</p>
        <h1 className="display-title mb-3 text-3xl font-bold text-[var(--sea-ink)]">
          Unable to load this page
        </h1>
        <p className="mb-6 text-base leading-8 text-[var(--sea-ink-soft)]">{message}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="rounded-full bg-[var(--sea-ink)] px-5 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </section>
    </main>
  );
}

function NotFoundComponent() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <p className="island-kicker mb-3">PawTrip</p>
        <h1 className="display-title mb-3 text-3xl font-bold text-[var(--sea-ink)]">
          Page not found
        </h1>
        <p className="mb-6 text-base leading-8 text-[var(--sea-ink-soft)]">
          The page you requested does not exist.
        </p>
        <Link to="/" className="font-semibold text-[var(--sea-ink)] underline">
          Back to home
        </Link>
      </section>
    </main>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <Header />
        {children}
        <Footer />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
