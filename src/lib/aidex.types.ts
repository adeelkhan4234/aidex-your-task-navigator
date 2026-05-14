export type Answer = 1 | 2 | 3 | 4 | 5;
export type QId = "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6" | "Q7" | "Q8" | "Q9";
export type Answers = Record<QId, Answer>;

export interface Question {
  id: QId;
  title: string;
  labels: [string, string, string, string, string];
}
