import { useState } from "react";

interface ParentGateProps {
  onPass: () => void;
  onCancel: () => void;
}

interface GateQuestion {
  a: number;
  b: number;
  options: number[];
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function makeQuestion(): GateQuestion {
  const a = randomInt(6, 9);
  const b = randomInt(4, 9);
  const answer = a + b;
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    options.add(answer + randomInt(-4, 4));
  }
  const shuffled = [...options];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return { a, b, options: shuffled };
}

/** Keeps the purchase screen behind a task a preschooler is unlikely to solve by tapping. */
export function ParentGate({ onPass, onCancel }: ParentGateProps) {
  const [question, setQuestion] = useState(makeQuestion);
  const [wrong, setWrong] = useState(false);

  return (
    <div className="parent-overlay" role="dialog" aria-modal="true" aria-label="Для взрослых">
      <section className="parent-card parent-gate">
        <h2>Для взрослых</h2>
        <p>Чтобы продолжить, решите пример:</p>
        <p className="parent-gate__question">
          {question.a} + {question.b} = ?
        </p>
        <div className="parent-gate__options">
          {question.options.map((value) => (
            <button
              key={value}
              type="button"
              className="parent-gate__option"
              onClick={() => {
                if (value === question.a + question.b) {
                  onPass();
                  return;
                }
                setWrong(true);
                setQuestion(makeQuestion());
              }}
            >
              {value}
            </button>
          ))}
        </div>
        {wrong ? <p className="parent-gate__hint">Неверно. Попробуйте ещё раз.</p> : null}
        <button type="button" className="parent-card__back" onClick={onCancel}>
          Назад
        </button>
      </section>
    </div>
  );
}
