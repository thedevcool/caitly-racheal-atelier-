import { emphasisWords } from "@/lib/emphasis";

/**
 * Words are separate spans so the scroll can bring them from 20% to 100% in
 * turn. Gold words carry a gold layer over an ink layer; the scroll fades the
 * gold in. Without JavaScript everything simply shows at full strength.
 */
export function Statement({ text }: { text: string }) {
  return (
    <section className="band statement" aria-label="Statement" data-statement>
      <p>
        {emphasisWords(text).map((w, i) => (
          <span key={i}>
            {w.space && " "}
            {w.em ? (
              <em className="sw sw-em">
                <span className="sw-ink">{w.word}</span>
                <span className="sw-gold" aria-hidden="true">
                  {w.word}
                </span>
              </em>
            ) : (
              <span className="sw">{w.word}</span>
            )}
          </span>
        ))}
      </p>
    </section>
  );
}
