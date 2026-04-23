import { useMemo, useState } from "react";
import { QUESTIONS, Answer, Answers, compute } from "@/lib/aidex";
import { QuestionCard } from "./QuestionCard";
import { ResultView } from "./ResultView";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  onExit: () => void;
}

export function Calculator({ onExit }: Props) {
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  const currentValue = answers[current.id];
  const allAnswered = QUESTIONS.every((q) => answers[q.id]);
  const progress = Math.round(((step + (currentValue ? 1 : 0)) / total) * 100);

  const result = useMemo(() => (showResult && allAnswered ? compute(answers as Answers) : null), [showResult, allAnswered, answers]);

  const setAnswer = (v: Answer) => {
    setAnswers((prev) => ({ ...prev, [current.id]: v }));
    // auto-advance
    if (step < total - 1) {
      setTimeout(() => setStep((s) => s + 1), 220);
    }
  };

  if (showResult && result) {
    return (
      <ResultView
        result={result}
        onRestart={() => {
          setAnswers({});
          setStep(0);
          setShowResult(false);
          onExit();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="uppercase tracking-[0.18em]">Calculator</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <QuestionCard
        key={current.id}
        question={current}
        index={step}
        total={total}
        value={currentValue}
        onChange={setAnswer}
      />

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => (step === 0 ? onExit() : setStep((s) => s - 1))}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 0 ? "Back" : "Previous"}
        </Button>

        {step < total - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!currentValue}
            className="gap-2"
          >
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={() => setShowResult(true)}
            disabled={!allAnswered}
            className="gap-2"
          >
            Calculate <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
