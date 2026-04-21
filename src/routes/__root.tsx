import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth-context";
import { RoleProvider } from "@/lib/role-context";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-navy">404</h1>
        <h2 className="mt-2 text-xl font-semibold">Off the field</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That screen doesn't exist in the demo.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-navy px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-navy-deep"
          >
            Back to splash
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "CUT Athletiq" },
      { name: "description", content: "Phase 1 test build — sport-performance app for athletes, coaches and physios at the Central University of Technology." },
      { name: "author", content: "CUT Sports Department" },
      { property: "og:title", content: "CUT Athletiq" },
      { property: "og:description", content: "Sport-performance app for athletes, coaches and physios at the Central University of Technology." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "CUT Athletiq" },
      { name: "twitter:description", content: "Sport-performance app for athletes, coaches and physios at the Central University of Technology." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9b4e7c2a-579f-48ef-ab50-dbe3a869e629/id-preview-c22782b2--c2d82f4f-b742-4c88-92e9-ec7faa30713b.lovable.app-1776413844154.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9b4e7c2a-579f-48ef-ab50-dbe3a869e629/id-preview-c22782b2--c2d82f4f-b742-4c88-92e9-ec7faa30713b.lovable.app-1776413844154.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <RoleProvider>
        <Outlet />
        <Toaster position="top-center" />
      </RoleProvider>
    </AuthProvider>
  );
}
