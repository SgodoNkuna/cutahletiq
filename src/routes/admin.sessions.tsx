import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Loader2, Dumbbell } from "lucide-react";

export const Route = createFileRoute("/admin/sessions")({
  head: () => ({
    meta: [
      { title: "Sessions — Admin" },
      { name: "description", content: "All training sessions across teams." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSessions,
});

type Row = {
  id: string;
  name: string;
  session_date: string;
  notes: string | null;
  programmes: { name: string; team_id: string | null } | null;
  completion_count?: number;
};

function AdminSessions() {
  const { profile } = useAuth();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("id, name, session_date, notes, programmes(name, team_id)")
        .order("session_date", { ascending: false })
        .limit(100);
      if (cancelled) return;
      const sessions = (data ?? []) as unknown as Row[];
      const counts = await Promise.all(
        sessions.map((s) =>
          supabase
            .from("session_completions")
            .select("id", { count: "exact", head: true })
            .eq("session_id", s.id)
            .then((r) => r.count ?? 0),
        ),
      );
      sessions.forEach((s, i) => (s.completion_count = counts[i]));
      if (!cancelled) {
        setRows(sessions);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (!profile) return null;

  return (
    <MobileFrame title="Training sessions">
      <div className="px-5 space-y-3">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-navy uppercase tracking-wider"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to dept
        </Link>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-card rounded-xl border p-6 text-center text-sm text-muted-foreground">
            No sessions recorded yet.
          </div>
        ) : (
          <div className="bg-card rounded-xl border divide-y">
            {rows.map((s) => (
              <div key={s.id} className="p-3 flex items-start gap-3">
                <div className="bg-navy/10 text-navy rounded-lg p-2">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {s.programmes?.name ?? "—"} ·{" "}
                    {new Date(s.session_date).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg leading-none">{s.completion_count ?? 0}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                    done
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileFrame>
  );
}
