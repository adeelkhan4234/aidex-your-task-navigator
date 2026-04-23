import { Recommendation, Result } from "@/lib/aidex";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  result: Result;
  onRestart: () => void;
}

const RECO_META: Record<Recommendation, { label: string; tone: string; subtitle: string; ring: string }> = {
  Manual: {
    label: "Manual",
    tone: "bg-manual text-manual-foreground",
    subtitle: "Do it yourself.",
    ring: "hsl(var(--manual))",
  },
  Hybrid: {
    label: "Hybrid",
    tone: "bg-hybrid text-hybrid-foreground",
    subtitle: "AI assists, human owns the output.",
    ring: "hsl(var(--hybrid))",
  },
  Automate: {
    label: "Automate",
    tone: "bg-automate text-automate-foreground",
    subtitle: "Safe to automate with checks.",
    ring: "hsl(var(--automate))",
  },
};

export function ResultView({ result, onRestart }: Props) {
  const meta = RECO_META[result.recommendation];
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - result.score / 100);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero result card */}
      <div className="rounded-2xl border border-hairline bg-card shadow-elevated overflow-hidden">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 p-8 sm:p-10 items-center">
          <div className="relative w-[160px] h-[160px] mx-auto md:mx-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={meta.ring}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-5xl text-foreground">{result.score}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">AIDEX</div>
            </div>
          </div>

          <div className="text-center md:text-left">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${meta.tone}`}>
              {meta.label}
            </div>
            <h2 className="font-display text-3xl sm:text-4xl mt-4 text-foreground">{meta.subtitle}</h2>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>Potential <span className="text-foreground font-medium">{result.potential}</span></span>
              <span>Risk <span className="text-foreground font-medium">{result.risk}</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-hairline bg-card p-6 sm:p-8 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-4 h-4 text-automate" />
            <h3 className="font-display text-xl">Why</h3>
          </div>
          <ul className="space-y-3">
            {[...result.drivers, result.watchout].map((text, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground/60 shrink-0" />
                <span className="text-foreground/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-hairline bg-card p-6 sm:p-8 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-accent" />
            <h3 className="font-display text-xl">Safeguards</h3>
          </div>
          <ul className="space-y-3">
            {result.safeguards.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <span className="text-foreground/90">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <RotateCcw className="w-4 h-4" /> Run another assessment
        </Button>
      </div>
    </div>
  );
}
