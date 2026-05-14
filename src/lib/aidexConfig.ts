// Runtime-configurable AIDEX config, persisted to localStorage.
// Keeps the app fully client-side — no backend.

import type { Question, QId } from "./aidex.types";

export interface AidexConfig {
  questions: Question[];
  riskWeight: number; // default 0.8
  thresholds: { manualMax: number; hybridMax: number }; // <manualMax = Manual; <hybridMax = Hybrid; else Automate (gated)
  automateGate: { minQ4: number; maxRiskAnswer: number }; // Q4 >= minQ4 AND Q5..Q8 <= maxRiskAnswer
}

export const DEFAULT_QUESTIONS: Question[] = [
  { id: "Q1", title: "Goal Clarity", labels: ["Vague goal / unclear output", "Some clarity, missing key constraints", "Clear goal, partial success criteria", "Clear output format + constraints", "Fully specified + measurable success + examples"] },
  { id: "Q2", title: "Task Structure & Repeatability", labels: ["One-off / ad-hoc", "Mostly ad-hoc", "Some repeatable steps", "Mostly repeatable", "Highly repeatable, rule-based"] },
  { id: "Q3", title: "AI Fit (Today)", labels: ["Unreliable, frequent errors", "Inconsistent", "Draft OK, needs edits/steering", "Good with light review", "Highly reliable, repeatable"] },
  { id: "Q4", title: "Reviewability", labels: ["Very hard to verify", "Hard, time-consuming checks", "Verifiable with a checklist", "Easy spot-check", "Instantly verifiable"] },
  { id: "Q5", title: "Failure Impact", labels: ["Minor rework", "Low impact", "Noticeable business/user impact", "Serious consequences", "High-stakes (legal/safety/reputation/ethical harm)"] },
  { id: "Q6", title: "Data Sensitivity", labels: ["Public / non-sensitive", "Internal low sensitivity", "Confidential / limited personal data", "Significant PII", "Regulated/high-risk"] },
  { id: "Q7", title: "Judgment & Accountability", labels: ["Pure execution", "Light judgment", "Moderate judgment", "High judgment", "Critical judgment"] },
  { id: "Q8", title: "Differentiation Requirement", labels: ["Not important", "Low", "Medium", "High", "Essential"] },
  { id: "Q9", title: "Net Outcome Value", labels: ["Negative value", "Slight value", "Moderate value", "High value", "Transformational value"] },
];

export const DEFAULT_CONFIG: AidexConfig = {
  questions: DEFAULT_QUESTIONS,
  riskWeight: 0.8,
  thresholds: { manualMax: 40, hybridMax: 70 },
  automateGate: { minQ4: 4, maxRiskAnswer: 3 },
};

const STORAGE_KEY = "aidex.config.v1";
const listeners = new Set<() => void>();
let cache: AidexConfig | null = null;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function isValid(c: any): c is AidexConfig {
  if (!c || !Array.isArray(c.questions) || c.questions.length !== 9) return false;
  const ids: QId[] = ["Q1","Q2","Q3","Q4","Q5","Q6","Q7","Q8","Q9"];
  for (let i = 0; i < 9; i++) {
    const q = c.questions[i];
    if (!q || q.id !== ids[i] || typeof q.title !== "string" || !Array.isArray(q.labels) || q.labels.length !== 5) return false;
  }
  if (typeof c.riskWeight !== "number") return false;
  if (!c.thresholds || typeof c.thresholds.manualMax !== "number" || typeof c.thresholds.hybridMax !== "number") return false;
  if (!c.automateGate || typeof c.automateGate.minQ4 !== "number" || typeof c.automateGate.maxRiskAnswer !== "number") return false;
  return true;
}

export function loadConfig(): AidexConfig {
  if (cache) return cache;
  if (typeof window === "undefined") return clone(DEFAULT_CONFIG);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValid(parsed)) {
        cache = parsed;
        return parsed;
      }
    }
  } catch {}
  cache = clone(DEFAULT_CONFIG);
  return cache;
}

export function saveConfig(next: AidexConfig) {
  cache = clone(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
  listeners.forEach((l) => l());
}

export function resetConfig() {
  saveConfig(clone(DEFAULT_CONFIG));
}

export function subscribeConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
