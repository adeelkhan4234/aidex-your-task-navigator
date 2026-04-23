import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calculator } from "@/components/Calculator";
import { ArrowRight, Hand, Sparkles, Bot } from "lucide-react";

const Index = () => {
  const [started, setStarted] = useState(false);
  const calcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started && calcRef.current) {
      calcRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [started]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-hairline">
        <div className="container flex items-center justify-between h-16">
          <a href="#top" className="font-display text-xl tracking-tight">
            AIDEX<span className="text-accent">.</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </nav>
          <Button size="sm" onClick={() => setStarted(true)}>Start</Button>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="bg-hero">
        <div className="container py-20 sm:py-28 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline bg-card text-xs text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-automate" /> No signup. No tracking. Under 3 minutes.
          </div>
          <h1 className="font-display text-5xl sm:text-7xl leading-[1.05] text-foreground">
            Manual, Hybrid, or<br />
            <span className="italic text-accent">Automate?</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AIDEX — the AI Delegation Index — gives you a clear, deterministic answer
            for any task. Nine questions. One score. Zero guesswork.
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Button size="lg" onClick={() => setStarted(true)} className="gap-2">
              Start Calculator <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how">How it works</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Output types */}
      <section className="container py-20">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Hand, label: "Manual", desc: "Do it yourself.", tone: "manual" },
            { icon: Sparkles, label: "Hybrid", desc: "AI assists, human owns the output.", tone: "hybrid" },
            { icon: Bot, label: "Automate", desc: "Safe to automate with checks.", tone: "automate" },
          ].map(({ icon: Icon, label, desc, tone }) => (
            <div
              key={label}
              className="rounded-2xl border border-hairline bg-card p-7 shadow-soft hover:shadow-elevated transition-shadow"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-${tone} text-${tone}-foreground mb-5`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-2xl mb-2">{label}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-hairline bg-secondary/40">
        <div className="container py-20">
          <h2 className="font-display text-4xl sm:text-5xl mb-12 max-w-2xl">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "01", t: "Answer 9 questions", d: "Each on a 1–5 scale with clear, plain-language labels. No typing." },
              { n: "02", t: "Deterministic scoring", d: "Potential minus weighted Risk. No AI text. Same inputs, same answer." },
              { n: "03", t: "Get your verdict", d: "Manual, Hybrid, or Automate — with reasons and safeguards." },
            ].map((s) => (
              <div key={s.n}>
                <div className="font-display text-5xl text-accent mb-3">{s.n}</div>
                <h3 className="font-display text-2xl mb-2">{s.t}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section ref={calcRef} className="border-t border-hairline">
        <div className="container py-16 max-w-3xl">
          {started ? (
            <Calculator onExit={() => setStarted(false)} />
          ) : (
            <div className="text-center py-16">
              <h2 className="font-display text-4xl mb-4">Ready in 3 minutes.</h2>
              <p className="text-muted-foreground mb-8">No accounts, no data stored. Just answers.</p>
              <Button size="lg" onClick={() => setStarted(true)} className="gap-2">
                Start Calculator <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-hairline bg-secondary/40">
        <div className="container py-20 max-w-3xl">
          <h2 className="font-display text-4xl mb-6">About AIDEX</h2>
          <p className="text-muted-foreground leading-relaxed">
            AIDEX is a lightweight decision tool. It weighs the upside of delegating a task to AI
            against the risks of doing so — sensitivity, accountability, reviewability, and originality —
            and returns a single, transparent recommendation. No models. No randomness.
            Just a small, opinionated rubric you can trust.
          </p>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} AIDEX</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
