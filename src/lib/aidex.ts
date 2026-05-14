// AIDEX scoring engine — fully deterministic, no AI text, no randomness.
// Questions, weights, and thresholds are loaded from aidexConfig (admin-editable).

import { loadConfig } from "./aidexConfig";
import type { Answer, Answers, QId, Question } from "./aidex.types";

export type { Answer, Answers, QId, Question };

export function getQuestions(): Question[] {
  return loadConfig().questions;
}

// Back-compat: legacy `QUESTIONS` import — kept as a getter so updates from admin reflect immediately.
export const QUESTIONS: Question[] = new Proxy([] as Question[], {
  get(_t, prop) {
    const arr = getQuestions();
    // @ts-ignore
    return arr[prop];
  },
  has(_t, prop) {
    return prop in getQuestions();
  },
  ownKeys() {
    return Reflect.ownKeys(getQuestions());
  },
  getOwnPropertyDescriptor(_t, prop) {
    return Object.getOwnPropertyDescriptor(getQuestions(), prop);
  },
});

const SCALE: Record<Answer, number> = { 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 };

export type Recommendation = "Manual" | "Hybrid" | "Automate";

export interface Result {
  score: number;
  potential: number;
  risk: number;
  recommendation: Recommendation;
  drivers: string[];
  watchout: string;
  safeguards: string[];
}

const DRIVER_TEXT: Record<"Q9" | "Q4" | "Q3" | "Q1" | "Q2", Record<3 | 4 | 5, string>> = {
  Q9: {
    5: "Transformational ROI: AI creates major value even after prompting, iteration, and review.",
    4: "Strong ROI: AI saves significant time or improves quality even after review.",
    3: "Moderate ROI: AI provides meaningful support, but the gains are not dramatic.",
  },
  Q4: {
    5: "Instantly reviewable: errors are easy to spot at a glance.",
    4: "Easy to verify: quick spot-checks can catch most errors.",
    3: "Reviewable with a checklist: verification is possible but requires structure.",
  },
  Q3: {
    5: "Excellent AI fit: current tools handle this task reliably and consistently.",
    4: "Strong AI fit: current tools perform well with light human review.",
    3: "Decent AI fit: AI can draft effectively but will need edits and steering.",
  },
  Q1: {
    5: "Crystal-clear brief: success criteria and constraints are fully defined.",
    4: "Clear brief: outputs and constraints are defined well enough for delegation.",
    3: "Reasonably clear: the goal is defined, but some criteria still need tightening.",
  },
  Q2: {
    5: "Highly repeatable workflow: rule-based steps make delegation scalable.",
    4: "Mostly repeatable: consistent steps make AI delegation stable.",
    3: "Partly repeatable: some steps can be delegated, others need human handling.",
  },
};

const WATCH_TEXT: Record<"Q6" | "Q5" | "Q7" | "Q8", Record<3 | 4 | 5, string>> = {
  Q6: {
    5: "Highly sensitive data: strong privacy/compliance controls are mandatory.",
    4: "Sensitive data involved: confidentiality and tool choice become critical.",
    3: "Some confidentiality concerns: apply basic privacy safeguards.",
  },
  Q5: {
    5: "High-stakes if wrong: undetected errors could cause severe harm.",
    4: "Serious consequences if wrong: strict human review is required.",
    3: "Noticeable impact if wrong: add a structured review step.",
  },
  Q7: {
    5: "Critical human accountability: the final decision must remain fully human-owned.",
    4: "High judgment required: AI can support, but humans must own the outcome.",
    3: "Moderate judgment needed: use AI for drafts, then validate with human context.",
  },
  Q8: {
    5: "Differentiation is essential: AI may average outputs—human originality must lead.",
    4: "Distinct voice matters: keep human creative direction and final polish.",
    3: "Some originality needed: use AI for variations, then refine with human taste.",
  },
};

const DRIVER_PRIORITY: Array<"Q9" | "Q4" | "Q3" | "Q1" | "Q2"> = ["Q9", "Q4", "Q3", "Q1", "Q2"];
const WATCH_PRIORITY: Array<"Q6" | "Q5" | "Q7" | "Q8"> = ["Q6", "Q5", "Q7", "Q8"];

function pickDrivers(a: Answers): string[] {
  const high = DRIVER_PRIORITY.filter((q) => a[q] >= 4);
  const picks: Array<{ q: "Q9" | "Q4" | "Q3" | "Q1" | "Q2"; level: 3 | 4 | 5 }> = [];
  for (const q of high) if (picks.length < 2) picks.push({ q, level: a[q] as 4 | 5 });
  if (picks.length < 2) {
    const mediums = DRIVER_PRIORITY.filter((q) => a[q] === 3 && !picks.find((p) => p.q === q));
    for (const q of mediums) if (picks.length < 2) picks.push({ q, level: 3 });
  }
  if (picks.length < 2) {
    for (const q of DRIVER_PRIORITY) {
      if (picks.find((p) => p.q === q)) continue;
      if (picks.length < 2) picks.push({ q, level: 3 });
    }
  }
  return picks.slice(0, 2).map((p) => DRIVER_TEXT[p.q][p.level]);
}

function pickWatchout(a: Answers): string {
  const high = WATCH_PRIORITY.filter((q) => a[q] >= 4);
  if (high.length > 0) {
    const q = high[0];
    return WATCH_TEXT[q][a[q] as 4 | 5];
  }
  const threes = WATCH_PRIORITY.filter((q) => a[q] === 3);
  if (threes.length > 0) return WATCH_TEXT[threes[0]][3];
  return WATCH_TEXT[WATCH_PRIORITY[0]][3];
}

function buildSafeguards(a: Answers): string[] {
  const out: string[] = [];
  if (a.Q6 >= 3) {
    out.push("Remove or anonymize sensitive data before sharing with AI.");
    out.push("Use approved, privacy-compliant tools.");
    out.push("Keep human approval in the loop.");
    if (a.Q6 === 5) out.push("Maintain compliance documentation for every run.");
  }
  if (a.Q5 >= 3) {
    out.push("Require human approval before output is used.");
    out.push("Run outputs through a structured checklist.");
    out.push("Limit AI to drafting; humans finalize.");
    if (a.Q5 === 5) out.push("Add a mandatory second-person review.");
  }
  if (a.Q7 >= 3) {
    out.push("Human owns the final decision and accountability.");
    out.push("Add a second-person review for important calls.");
    if (a.Q7 === 5) out.push("Do not automate — keep humans in the decision loop.");
  }
  if (a.Q8 >= 3) {
    out.push("Use AI for exploration and variations only.");
    out.push("Human defines and finalizes the output voice.");
    if (a.Q8 === 5) out.push("Avoid automation — originality must remain human-led.");
  }
  const unique = Array.from(new Set(out));
  if (unique.length === 0) {
    return [
      "Spot-check AI outputs before using them.",
      "Keep a human reviewer for any consequential output.",
    ];
  }
  return unique.slice(0, 4);
}

export function compute(a: Answers): Result {
  const cfg = loadConfig();
  const v = (q: QId) => SCALE[a[q]];
  const potential = (v("Q1") + v("Q2") + v("Q3") + v("Q4") + v("Q9")) / 5;
  const risk = (v("Q5") + v("Q6") + v("Q7") + v("Q8")) / 4;
  const raw = potential - cfg.riskWeight * risk;
  const score = Math.max(0, Math.min(100, raw));

  let recommendation: Recommendation;
  if (score < cfg.thresholds.manualMax) recommendation = "Manual";
  else if (score < cfg.thresholds.hybridMax) recommendation = "Hybrid";
  else {
    const g = cfg.automateGate;
    const ok = a.Q4 >= g.minQ4 && a.Q5 <= g.maxRiskAnswer && a.Q6 <= g.maxRiskAnswer && a.Q7 <= g.maxRiskAnswer && a.Q8 <= g.maxRiskAnswer;
    recommendation = ok ? "Automate" : "Hybrid";
  }

  return {
    score: Math.round(score),
    potential: Math.round(potential),
    risk: Math.round(risk),
    recommendation,
    drivers: pickDrivers(a),
    watchout: pickWatchout(a),
    safeguards: buildSafeguards(a),
  };
}
