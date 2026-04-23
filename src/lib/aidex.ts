// AIDEX scoring engine — fully deterministic, no AI text, no randomness.

export type Answer = 1 | 2 | 3 | 4 | 5;
export type Answers = Record<QId, Answer>;
export type QId = "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6" | "Q7" | "Q8" | "Q9";

export interface Question {
  id: QId;
  title: string;
  labels: [string, string, string, string, string]; // 1..5
}

export const QUESTIONS: Question[] = [
  {
    id: "Q1",
    title: "Goal Clarity",
    labels: [
      "Vague goal / unclear output",
      "Some clarity, missing key constraints",
      "Clear goal, partial success criteria",
      "Clear output format + constraints",
      "Fully specified + measurable success + examples",
    ],
  },
  {
    id: "Q2",
    title: "Task Structure & Repeatability",
    labels: [
      "One-off / ad-hoc",
      "Mostly ad-hoc",
      "Some repeatable steps",
      "Mostly repeatable",
      "Highly repeatable, rule-based",
    ],
  },
  {
    id: "Q3",
    title: "AI Fit (Today)",
    labels: [
      "Unreliable, frequent errors",
      "Inconsistent",
      "Draft OK, needs edits/steering",
      "Good with light review",
      "Highly reliable, repeatable",
    ],
  },
  {
    id: "Q4",
    title: "Reviewability",
    labels: [
      "Very hard to verify",
      "Hard, time-consuming checks",
      "Verifiable with a checklist",
      "Easy spot-check",
      "Instantly verifiable",
    ],
  },
  {
    id: "Q5",
    title: "Failure Impact",
    labels: [
      "Minor rework",
      "Low impact",
      "Noticeable business/user impact",
      "Serious consequences",
      "High-stakes (legal/safety/reputation/ethical harm)",
    ],
  },
  {
    id: "Q6",
    title: "Data Sensitivity",
    labels: [
      "Public / non-sensitive",
      "Internal low sensitivity",
      "Confidential / limited personal data",
      "Significant PII",
      "Regulated/high-risk",
    ],
  },
  {
    id: "Q7",
    title: "Judgment & Accountability",
    labels: [
      "Pure execution",
      "Light judgment",
      "Moderate judgment",
      "High judgment",
      "Critical judgment",
    ],
  },
  {
    id: "Q8",
    title: "Differentiation Requirement",
    labels: ["Not important", "Low", "Medium", "High", "Essential"],
  },
  {
    id: "Q9",
    title: "Net Outcome Value",
    labels: [
      "Negative value",
      "Slight value",
      "Moderate value",
      "High value",
      "Transformational value",
    ],
  },
];

const SCALE: Record<Answer, number> = { 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 };

export type Recommendation = "Manual" | "Hybrid" | "Automate";

export interface Result {
  score: number;
  potential: number;
  risk: number;
  recommendation: Recommendation;
  drivers: string[]; // exactly 2
  watchout: string; // exactly 1
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
  for (const q of high) {
    if (picks.length < 2) picks.push({ q, level: a[q] as 4 | 5 });
  }
  if (picks.length < 2) {
    const mediums = DRIVER_PRIORITY.filter((q) => a[q] === 3 && !picks.find((p) => p.q === q));
    for (const q of mediums) {
      if (picks.length < 2) picks.push({ q, level: 3 });
    }
  }
  // Fallback: if still <2 (all answers <3), pick top by priority at their actual level capped to 3
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
  // pick highest 3, by priority
  const threes = WATCH_PRIORITY.filter((q) => a[q] === 3);
  if (threes.length > 0) return WATCH_TEXT[threes[0]][3];
  // fallback: lowest-risk priority item at level 3
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
  // Dedupe + clamp 2-4
  const unique = Array.from(new Set(out));
  if (unique.length === 0) {
    return [
      "Spot-check AI outputs before using them.",
      "Keep a human reviewer for any consequential output.",
    ];
  }
  // Aim for 2–4: prefer first 4 unique
  return unique.slice(0, 4).length >= 2 ? unique.slice(0, 4) : unique.slice(0, 2);
}

export function compute(a: Answers): Result {
  const v = (q: QId) => SCALE[a[q]];
  const potential = (v("Q1") + v("Q2") + v("Q3") + v("Q4") + v("Q9")) / 5;
  const risk = (v("Q5") + v("Q6") + v("Q7") + v("Q8")) / 4;
  const raw = potential - 0.8 * risk;
  const score = Math.max(0, Math.min(100, raw));

  let recommendation: Recommendation;
  if (score < 40) recommendation = "Manual";
  else if (score < 70) recommendation = "Hybrid";
  else {
    const automateOk = a.Q4 >= 4 && a.Q5 <= 3 && a.Q6 <= 3 && a.Q7 <= 3 && a.Q8 <= 3;
    recommendation = automateOk ? "Automate" : "Hybrid";
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
