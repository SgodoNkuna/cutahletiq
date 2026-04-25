import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2, Megaphone, Image as ImageIcon, Video, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Nudge = Database["public"]["Tables"]["nudges"]["Row"];
type Announcement = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  media_url: string | null;
  signed_media_url?: string | null;
  media_type: "image" | "video" | null;
  created_at: string;
  author?: { first_name: string | null; last_name: string | null } | null;
};

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
      { name: "description", content: "Announcements, milestones, and team alerts." },
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

async function signedAnnouncementUrl(pathOrUrl: string | null) {
  if (!pathOrUrl) return null;
  const marker = "/announcements/";
  const path = pathOrUrl.includes(marker) ? pathOrUrl.split(marker).pop() : pathOrUrl;
  if (!path) return pathOrUrl;
  const { data } = await supabase.storage.from("announcements").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? pathOrUrl;
}

function FeedPage() {
  const { user, profile } = useAuth();
  const [nudges, setNudges] = React.useState<Nudge[]>([]);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const isAdmin = profile?.role === "admin";

  const loadAnnouncements = React.useCallback(async () => {
    const { data } = await supabase
      .from("announcements")
      .select(
        "id, author_id, title, body, media_url, media_type, created_at, author:profiles!announcements_author_id_fkey(first_name, last_name)",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = (data ?? []) as unknown as Announcement[];
    const withMedia = await Promise.all(
      rows.map(async (a) => ({ ...a, signed_media_url: await signedAnnouncementUrl(a.media_url) })),
    );
    setAnnouncements(withMedia);
  }, []);

  const loadNudges = React.useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("nudges")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setNudges(data ?? []);
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      await Promise.all([loadAnnouncements(), loadNudges()]);
      setLoading(false);
    })();

    const ch = supabase
      .channel(`feed:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nudges", filter: `recipient_id=eq.${user.id}` },
        () => void loadNudges(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => void loadAnnouncements(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [user, loadAnnouncements, loadNudges]);

  const removeAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast.error("Could not delete");
    else {
      toast.success("Deleted");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <MobileFrame title="Feed">
      <div className="px-5 space-y-3 pb-6">
        {isAdmin && <AnnouncementComposer onPosted={loadAnnouncements} />}

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : (
          <>
            {announcements.map((a) => {
              const author =
                `${a.author?.first_name ?? ""} ${a.author?.last_name ?? ""}`.trim() || "Admin";
              return (
                <article
                  key={`ann-${a.id}`}
                  className="rounded-2xl border border-gold/30 bg-gradient-to-br from-card to-gold/5 shadow-sm overflow-hidden"
                >
                  {a.signed_media_url && a.media_type === "image" && (
                    <img
                      src={a.signed_media_url}
                      alt={a.title}
                      className="w-full max-h-72 object-cover"
                      loading="lazy"
                    />
                  )}
                  {a.signed_media_url && a.media_type === "video" && (
                    <video
                      src={a.signed_media_url}
                      controls
                      className="w-full max-h-72 bg-black"
                      preload="metadata"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-gold">
                      <Megaphone className="h-3 w-3" /> Announcement
                      {isAdmin && a.author_id === profile?.id && (
                        <button
                          onClick={() => removeAnnouncement(a.id)}
                          className="ml-auto text-destructive hover:opacity-70"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <h2 className="font-display text-lg leading-tight mt-1">{a.title}</h2>
                    {a.body && (
                      <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">
                        {a.body}
                      </p>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
                      {author} · {timeAgo(a.created_at)}
                    </div>
                  </div>
                </article>
              );
            })}

            {nudges.map((n) => (
              <article key={n.id} className="rounded-2xl border bg-card p-4 shadow-sm flex gap-3">
                <div className="text-2xl shrink-0">{ICONS[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
              </article>
            ))}

            {announcements.length === 0 && nudges.length === 0 && (
              <div className="bg-card rounded-xl border p-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <div className="text-sm font-bold mt-3">Nothing new yet</div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Announcements from admins, PRs, programmes and physio updates will show here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </MobileFrame>
  );
}

function AnnouncementComposer({ onPosted }: { onPosted: () => Promise<void> }) {
  const { profile } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [posting, setPosting] = React.useState(false);

  const reset = () => {
    setTitle("");
    setBody("");
    setFile(null);
  };

  const post = async () => {
    if (!profile) return;
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    setPosting(true);

    let media_url: string | null = null;
    let media_type: "image" | "video" | null = null;

    if (file) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isImage && !isVideo) {
        toast.error("Only images or videos are allowed");
        setPosting(false);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("Max file size is 50 MB");
        setPosting(false);
        return;
      }
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `${profile.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("announcements")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        toast.error(`Upload failed: ${upErr.message}`);
        setPosting(false);
        return;
      }
      media_url = path;
      media_type = isVideo ? "video" : "image";
    }

    const { error } = await supabase.from("announcements").insert({
      author_id: profile.id,
      title: title.trim(),
      body: body.trim(),
      media_url,
      media_type,
    });
    setPosting(false);

    if (error) {
      toast.error("Could not post");
      return;
    }
    toast.success("Posted");
    reset();
    setOpen(false);
    await onPosted();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-gold/50 bg-gold/5 p-3 flex items-center gap-2 text-sm font-bold text-navy hover:bg-gold/10 transition-colors"
      >
        <Megaphone className="h-4 w-4 text-gold" />
        <span>New announcement</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
          Admin
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-gold/50 bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gold">
          <Megaphone className="h-3.5 w-3.5" /> New announcement
        </div>
        <button
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Friday training cancelled)"
        maxLength={120}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm font-bold"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Optional message body…"
        rows={3}
        maxLength={2000}
        className="w-full rounded-md border bg-background p-3 text-sm resize-none"
      />
      <label className="flex items-center gap-2 rounded-md border-2 border-dashed border-border p-3 cursor-pointer hover:border-gold/60 transition-colors">
        {file?.type.startsWith("video/") ? (
          <Video className="h-4 w-4 text-navy" />
        ) : (
          <ImageIcon className="h-4 w-4 text-navy" />
        )}
        <span className="text-xs font-bold flex-1 truncate">
          {file ? file.name : "Attach image or video (optional)"}
        </span>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setFile(null);
            }}
            className="text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <button
        onClick={post}
        disabled={posting}
        className="w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-2.5 text-xs disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {posting && <Loader2 className="h-4 w-4 animate-spin" />}
        Post to feed
      </button>
    </div>
  );
}
