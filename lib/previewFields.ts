import { commaList, str } from "./formdata";

/** Which form fields a preview may overlay (only text, never ids or flags). */
const CONTENT = [
  "heroKorean",
  "heroHeadline",
  "heroIntro",
  "heroCtaPrimary",
  "heroCtaSecondary",
  "statement",
  "contactKorean",
  "contactHeadline",
  "contactIntro",
  "contactButton",
  "footerTagline",
  "footerNote",
  "assembleWorking",
  "assembleDone",
];
const ROOM = [
  "name",
  "korean",
  "navLabel",
  "service",
  "headline",
  "body",
  "ctaLabel",
  "galleryTitle",
  "galleryCaption",
  "theme",
];

export const contentDraft = (f: FormData) =>
  Object.fromEntries(CONTENT.map((k) => [k, str(f, k).slice(0, 600)]));
export const roomDraft = (f: FormData) => ({
  ...Object.fromEntries(ROOM.map((k) => [k, str(f, k).slice(0, 600)])),
  chips: commaList(f, "chips").slice(0, 10),
});
