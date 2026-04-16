import { createFileRoute } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { feedPosts } from "@/data/mock";
import { Pin, Heart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Team Feed — CUT Athletiq" },
      { name: "description", content: "Announcements, milestones and recovery tips for the CUT sports community." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  return (
    <MobileFrame title="Team Feed">
      <div className="px-5 space-y-3">
        {feedPosts.map((p) => (
          <article
            key={p.id}
            className={
              "rounded-2xl border bg-card p-4 shadow-sm " +
              (p.pinned ? "border-gold/60 bg-gold/5" : "")
            }
          >
            <div className="flex items-center gap-2 text-[11px]">
              {p.pinned && (
                <span className="flex items-center gap-1 rounded-full bg-gold text-navy-deep px-2 py-0.5 font-bold uppercase tracking-wider">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              )}
              <span className="font-bold">{p.author}</span>
              <span className="text-muted-foreground">· {p.role}</span>
              <span className="text-muted-foreground ml-auto">{p.time}</span>
            </div>
            <h3 className="font-display text-xl mt-2 leading-tight">{p.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{p.body}</p>

            <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
              <button className="flex items-center gap-1 hover:text-destructive">
                <Heart className="h-3.5 w-3.5" /> {12 + p.id.length}
              </button>
              <button className="flex items-center gap-1 hover:text-navy">
                <MessageCircle className="h-3.5 w-3.5" /> {3 + p.id.length}
              </button>
            </div>
          </article>
        ))}
      </div>
    </MobileFrame>
  );
}
