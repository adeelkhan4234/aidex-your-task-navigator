import { Question, Answer } from "@/lib/aidex";

interface Props {
  question: Question;
  index: number;
  total: number;
  value?: Answer;
  onChange: (v: Answer) => void;
}

export function QuestionCard({ question, index, total, value, onChange }: Props) {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-6 sm:p-8 shadow-soft animate-fade-up">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Question {index + 1} of {total}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-foreground">
            {question.title}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-3">
        {question.labels.map((label, i) => {
          const v = (i + 1) as Answer;
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              data-selected={selected}
              className="scale-pill min-h-[100px] sm:min-h-[140px]"
              aria-pressed={selected}
            >
              <span className="font-display text-2xl sm:text-3xl mb-2 opacity-80">{v}</span>
              <span className="text-xs sm:text-[13px] leading-snug text-center">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
