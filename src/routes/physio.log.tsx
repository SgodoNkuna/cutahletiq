import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MobileFrame } from "@/components/MobileFrame";
import { SectionHeader } from "@/components/primitives";
import { roster } from "@/data/mock";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/physio/log")({
  head: () => ({
    meta: [
      { title: "New Injury Log — CUT Athletiq" },
      { name: "description", content: "Document a new injury and start a rehab plan." },
    ],
  }),
  component: PhysioLogPage,
});

const MECHANISMS = ["Contact", "Non-contact", "Overuse", "Re-injury"];
const SEVERITIES = ["Mild", "Moderate", "Severe"];

function PhysioLogPage() {
  const navigate = useNavigate();
  const [athleteId, setAthleteId] = React.useState<string>(roster[0].id);
  const [region, setRegion] = React.useState("Right Hamstring");
  const [pain, setPain] = React.useState(5);
  const [mechanism, setMechanism] = React.useState("Non-contact");
  const [severity, setSeverity] = React.useState("Mild");
  const [rtp, setRtp] = React.useState(7);
  const [notes, setNotes] = React.useState("");

  const submit = () => {
    const a = roster.find((r) => r.id === athleteId)!;
    toast.success(`Case opened · ${a.name} · ${region}`);
    setTimeout(() => navigate({ to: "/physio" }), 600);
  };

  return (
    <MobileFrame title="New Injury Log">
      <div className="px-5 space-y-4">
        <Field label="Athlete">
          <select
            value={athleteId}
            onChange={(e) => setAthleteId(e.target.value)}
            className="w-full rounded-md border bg-card px-3 py-2 text-sm"
          >
            {roster.map((r) => (
              <option key={r.id} value={r.id}>{r.name} · {r.sport}</option>
            ))}
          </select>
        </Field>

        <Field label="Region">
          <Input value={region} onChange={(e) => setRegion(e.target.value)} />
        </Field>

        <Field label={`Pain · ${pain}/10`}>
          <Slider value={[pain]} onValueChange={(v) => setPain(v[0])} min={0} max={10} step={1} />
        </Field>

        <Field label="Mechanism">
          <PillRow options={MECHANISMS} value={mechanism} onChange={setMechanism} />
        </Field>

        <Field label="Severity">
          <PillRow options={SEVERITIES} value={severity} onChange={setSeverity} />
        </Field>

        <Field label={`Estimated RTP · ${rtp} days`}>
          <Slider value={[rtp]} onValueChange={(v) => setRtp(v[0])} min={1} max={42} step={1} />
        </Field>

        <Field label="Clinical notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Mechanism, palpation findings, plan of care…"
            className="w-full rounded-md border bg-card p-3 text-sm resize-none"
          />
        </Field>

        <button
          onClick={submit}
          className="w-full bg-gold text-navy-deep font-bold uppercase tracking-wider rounded-full py-3 hover:scale-[1.01] transition-transform shadow-lg"
        >
          Open case
        </button>
      </div>
    </MobileFrame>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function PillRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold border transition-colors",
            value === o ? "bg-navy text-primary-foreground border-navy" : "bg-card border-border text-muted-foreground hover:border-navy/40",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// Re-export SectionHeader so unused-warning is silent? not needed actually:
void SectionHeader;
