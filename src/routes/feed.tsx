import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Nudge = Database["public"]["Tables"]["nudges"]["Row"];

const ICONS: Record<Nudge["type"], string> = {
  new_programme: "🏋️",
  pr_achieved: "🏅",
  missed_session: "⚠️",
  rtp_status_change: "🟢",
  injury_flagged: "🩺",
  checkin_reminder: "📋",
};

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Feed — CUT Athletiq" },
      { name: "description", content: "Notifications and milestones from your team." },
    ],
  }),
  component: FeedPage,
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function FeedPage() {
  const { user } = useAuth();
  const [nudges, setNudges] = React.useState<Nudge[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("nudges")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setNudges(data ?? []);
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    void load();
    const ch = supabase
      .channel(`feed:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nudges", filter: `recipient_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user, load]);

  return (
    <MobileFrame title="Feed">
      <div className="px-5 space-y-3">
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : nudges.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <div className="text-sm font-bold mt-3">Nothing new yet</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              You'll see PR alerts, new programmes and physio updates here.
            </p>
          </div>
        ) : (
          nudges.map((n) => (
            <article key={n.id} className="rounded-2xl border bg-card p-4 shadow-sm flex gap-3">
              <div className="text-2xl shrink-0">{ICONS[n.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                  {timeAgo(n.created_at)}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </MobileFrame>
  );
}
