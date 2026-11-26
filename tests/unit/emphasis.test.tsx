import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { emphasis, emphasisWords } from "@/lib/emphasis";

const html = (text: string) => renderToStaticMarkup(<>{emphasis(text)}</>);

describe("emphasis()", () => {
  it("wraps *starred* words in <em>", () => {
    expect(html("I breathe *life* into brands.")).toBe("I breathe <em>life</em> into brands.");
  });

  it("handles several emphasised words", () => {
    expect(html("a *face*, a *voice* and a *shopfront*.")).toBe(
      "a <em>face</em>, a <em>voice</em> and a <em>shopfront</em>.",
    );
  });

  it("leaves plain text alone", () => {
    expect(html("Products that sell themselves.")).toBe("Products that sell themselves.");
  });

  it("never renders admin-entered markup as HTML", () => {
    const out = html('<img src=x onerror="alert(1)"> *hi*');
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
    expect(out).toContain("<em>hi</em>");
  });

  it("ignores an unmatched asterisk", () => {
    expect(html("5 * 3 = 15")).toBe("5 * 3 = 15");
  });
});

describe("emphasisWords()", () => {
  it("splits into words and marks the emphasised ones", () => {
    expect(emphasisWords("I give it a *face*")).toEqual([
      { word: "I", em: false },
      { word: "give", em: false },
      { word: "it", em: false },
      { word: "a", em: false },
      { word: "face", em: true },
    ]);
  });
});
