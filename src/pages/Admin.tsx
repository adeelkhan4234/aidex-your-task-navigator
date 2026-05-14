import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  AidexConfig,
  DEFAULT_CONFIG,
  loadConfig,
  resetConfig,
  saveConfig,
} from "@/lib/aidexConfig";
import {
  ArrowLeft,
  Download,
  Upload,
  RotateCcw,
  Save,
  Lock,
} from "lucide-react";

const PASSCODE_KEY = "aidex.admin.unlocked.v1";

export default function Admin() {
  const [unlocked, setUnlocked] = useState<boolean>(
    () => sessionStorage.getItem(PASSCODE_KEY) === "1"
  );
  const [pass, setPass] = useState("");
  // Demo passcode — change as needed. Anyone visiting /admin can edit local config.
  const PASS = "aidex";

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-display text-2xl flex items-center gap-2">
              <Lock className="w-5 h-5" /> Admin access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the admin passcode. Edits are stored locally in your browser only — no backend.
            </p>
            <Input
              type="password"
              placeholder="Passcode"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") tryUnlock();
              }}
            />
            <div className="flex justify-between">
              <Button variant="ghost" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Link>
              </Button>
              <Button onClick={tryUnlock}>Unlock</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

    function tryUnlock() {
      if (pass === PASS) {
        sessionStorage.setItem(PASSCODE_KEY, "1");
        setUnlocked(true);
      } else {
        toast.error("Incorrect passcode");
      }
    }
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [cfg, setCfg] = useState<AidexConfig>(() => loadConfig());
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<AidexConfig>) => {
    setCfg((c) => ({ ...c, ...patch }));
    setDirty(true);
  };

  const updateQuestion = (i: number, patch: Partial<{ title: string; labels: string[] }>) => {
    setCfg((c) => {
      const next = { ...c, questions: c.questions.map((q, idx) => (idx === i ? { ...q, ...patch } as typeof q : q)) };
      return next;
    });
    setDirty(true);
  };

  const onSave = () => {
    saveConfig(cfg);
    setDirty(false);
    toast.success("Configuration saved");
  };

  const onReset = () => {
    resetConfig();
    setCfg(loadConfig());
    setDirty(false);
    toast.success("Reset to defaults");
  };

  const onExport = () => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aidex-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        // Basic validation
        if (!parsed.questions || parsed.questions.length !== 9) throw new Error("Invalid file");
        setCfg(parsed);
        setDirty(true);
        toast.success("Imported — review and Save");
      } catch (e: any) {
        toast.error("Invalid config file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-hairline sticky top-0 bg-background/90 backdrop-blur z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-1" /> Exit
              </Link>
            </Button>
            <div className="font-display text-xl">
              AIDEX <span className="text-muted-foreground text-sm font-sans">/ admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Reset
            </Button>
            <Button size="sm" onClick={onSave} disabled={!dirty}>
              <Save className="w-4 h-4 mr-1" /> {dirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10 max-w-5xl">
        <Tabs defaultValue="questions">
          <TabsList>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="scoring">Scoring</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4 mt-6">
            {cfg.questions.map((q, i) => (
              <Card key={q.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-mono text-muted-foreground tracking-wider">
                    {q.id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={q.title}
                      onChange={(e) => updateQuestion(i, { title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {q.labels.map((label, li) => (
                      <div key={li}>
                        <Label className="text-xs">Level {li + 1}</Label>
                        <Textarea
                          rows={3}
                          value={label}
                          onChange={(e) => {
                            const labels = [...q.labels];
                            labels[li] = e.target.value;
                            updateQuestion(i, { labels });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="scoring" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Scoring formula</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-3 rounded">
                  score = Potential − (riskWeight × Risk)
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Risk weight</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="2"
                      value={cfg.riskWeight}
                      onChange={(e) => update({ riskWeight: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Manual ceiling (score &lt;)</Label>
                    <Input
                      type="number"
                      value={cfg.thresholds.manualMax}
                      onChange={(e) =>
                        update({
                          thresholds: { ...cfg.thresholds, manualMax: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Hybrid ceiling (score &lt;)</Label>
                    <Input
                      type="number"
                      value={cfg.thresholds.hybridMax}
                      onChange={(e) =>
                        update({
                          thresholds: { ...cfg.thresholds, hybridMax: parseInt(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Automate safety gate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Even with a high score, Automate is only allowed if reviewability is strong AND all
                  risk answers stay at or below the cap.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Min Q4 (Reviewability)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={cfg.automateGate.minQ4}
                      onChange={(e) =>
                        update({
                          automateGate: {
                            ...cfg.automateGate,
                            minQ4: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max risk answer (Q5–Q8)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={cfg.automateGate.maxRiskAnswer}
                      onChange={(e) =>
                        update({
                          automateGate: {
                            ...cfg.automateGate,
                            maxRiskAnswer: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Raw configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={24}
                  className="font-mono text-xs"
                  value={JSON.stringify(cfg, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setCfg(parsed);
                      setDirty(true);
                    } catch {
                      // ignore until valid
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Default values:{" "}
                  <button
                    className="underline"
                    onClick={() => {
                      setCfg(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
                      setDirty(true);
                    }}
                  >
                    load defaults into editor
                  </button>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
