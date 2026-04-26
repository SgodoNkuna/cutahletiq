import * as React from "react";

/**
 * Dev-only error boundary that:
 * - Surfaces the failing file/line/column when available
 * - Detects esbuild "stale transform" / "Transform failed" errors and auto-reloads once
 * - In production, renders a clean fallback (no internals leaked)
 *
 * Reload guard uses sessionStorage so we never loop more than once per session.
 */
type Props = { children: React.ReactNode };
type State = { error: Error | null; info: React.ErrorInfo | null };

const RELOAD_KEY = "__cut_stale_transform_reload__";
const AUTO_RETRY_KEY = "__cut_auto_retry_enabled__";

/** Dev-only: read the user's preference for auto-retry on stale transforms. */
export function isAutoRetryEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = localStorage.getItem(AUTO_RETRY_KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

/** Dev-only: toggle auto-retry. Returns the new value. */
export function setAutoRetryEnabled(enabled: boolean): boolean {
  try {
    localStorage.setItem(AUTO_RETRY_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
  return enabled;
}

function isStaleTransform(err: Error | null) {
  if (!err) return false;
  const m = `${err.name} ${err.message} ${err.stack ?? ""}`;
  return (
    /Transform failed/i.test(m) ||
    /Failed to fetch dynamically imported module/i.test(m) ||
    /Importing a module script failed/i.test(m) ||
    /ChunkLoadError/i.test(m) ||
    /Loading chunk \d+ failed/i.test(m) ||
    /Unexpected end of file/i.test(m)
  );
}

function parseLocation(err: Error | null): string | null {
  if (!err?.stack) return null;
  // first line that looks like a file:line:col
  const line = err.stack.split("\n").find((l) => /\.(t|j)sx?:\d+:\d+/.test(l));
  return line ? line.trim() : null;
}

export class DevErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info });
    if (typeof window === "undefined") return;
    if (isStaleTransform(error) && isAutoRetryEnabled()) {
      try {
        const already = sessionStorage.getItem(RELOAD_KEY);
        if (!already) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          // give React a tick to flush before reload
          setTimeout(() => window.location.reload(), 250);
        }
      } catch {
        // sessionStorage unavailable — fall through to UI
      }
    }
  }

  reset = () => {
    try {
      sessionStorage.removeItem(RELOAD_KEY);
    } catch {
      /* ignore */
    }
    this.setState({ error: null, info: null });
  };

  hardReload = () => {
    try {
      sessionStorage.removeItem(RELOAD_KEY);
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    const isDev = import.meta.env?.DEV === true;
    const loc = parseLocation(error);
    const stale = isStaleTransform(error);

    if (!isDev) {
      // Production: clean, branded fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="max-w-sm text-center space-y-3">
            <div className="font-display text-4xl text-navy">Off the field</div>
            <p className="text-sm text-muted-foreground">
              Something went wrong loading this screen. Please try again.
            </p>
            <button
              onClick={this.hardReload}
              className="rounded-full bg-gold text-navy-deep font-bold uppercase tracking-wider px-6 py-2 text-sm"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-6 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="rounded-xl border-2 border-destructive/60 bg-destructive/5 p-4">
            <div className="text-[10px] uppercase tracking-wider font-bold text-destructive mb-1">
              {stale ? "Stale transform — auto-reloading" : "Runtime error"}
            </div>
            <div className="font-display text-xl">{error.name}</div>
            <p className="text-sm text-foreground/80 mt-1 break-words">{error.message}</p>
            {loc && (
              <div className="mt-3 rounded-md bg-background border p-2 text-xs font-mono break-all">
                {loc}
              </div>
            )}
          </div>

          {error.stack && (
            <details className="rounded-xl border bg-card p-3">
              <summary className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">
                Stack trace
              </summary>
              <pre className="text-[10px] font-mono mt-2 whitespace-pre-wrap break-all text-foreground/80">
                {error.stack}
              </pre>
            </details>
          )}

          {info?.componentStack && (
            <details className="rounded-xl border bg-card p-3">
              <summary className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">
                Component stack
              </summary>
              <pre className="text-[10px] font-mono mt-2 whitespace-pre-wrap break-all text-foreground/80">
                {info.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <button
              onClick={this.reset}
              className="flex-1 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Try again
            </button>
            <button
              onClick={this.hardReload}
              className="flex-1 rounded-full bg-gold text-navy-deep px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Hard reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
