import { db } from "@/lib/db";
import { mediaById, toMediaValue } from "@/lib/adminData";
import { storageMode } from "@/lib/mediaSave";
import { saveContent } from "@/app/admin/actions/content";
import { AdminForm } from "@/components/admin/AdminForm";
import { Fieldset, TextArea, TextField } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/MediaField";

export const metadata = { title: "Words" };

const ITALIC = "Put *stars* around a word to make it gold italic.";

export default async function ContentEditor() {
  const s = (await db.siteSettings.findUnique({ where: { id: 1 } }))!;
  const [hero, contact] = await Promise.all([mediaById(s.heroImageId), mediaById(s.contactImageId)]);
  const storage = storageMode();
  return (
    <>
      <h1 className="a-title">The words</h1>
      <p className="a-lede">
        Everything visitors read on the home page, top to bottom. Changes go live when you save.
      </p>
      <AdminForm action={saveContent} preview="content">
        <Fieldset legend="Hero">
          <TextField label="Korean line" name="heroKorean" defaultValue={s.heroKorean} lang="ko" />
          <TextField label="Headline" name="heroHeadline" defaultValue={s.heroHeadline} hint={ITALIC} />
          <TextArea label="Intro" name="heroIntro" defaultValue={s.heroIntro} rows={3} maxLength={400} />
          <div className="a-grid2">
            <TextField label="Gold button" name="heroCtaPrimary" defaultValue={s.heroCtaPrimary} />
            <TextField label="Outline button" name="heroCtaSecondary" defaultValue={s.heroCtaSecondary} />
          </div>
          <MediaField
            label="Hero image"
            name="heroImage"
            value={toMediaValue(hero)}
            storage={storage}
            hint="A wide image, at least 1800px across. It sits behind the headline."
          />
        </Fieldset>

        <Fieldset legend="Statement">
          <TextArea
            label="Statement"
            name="statement"
            defaultValue={s.statement}
            rows={2}
            maxLength={300}
            hint={ITALIC}
          />
        </Fieldset>

        <Fieldset legend="Commission (contact)">
          <TextField label="Korean line" name="contactKorean" defaultValue={s.contactKorean} lang="ko" />
          <TextField label="Headline" name="contactHeadline" defaultValue={s.contactHeadline} hint={ITALIC} />
          <TextArea
            label="Intro"
            name="contactIntro"
            defaultValue={s.contactIntro}
            rows={3}
            maxLength={400}
          />
          <TextField label="Button" name="contactButton" defaultValue={s.contactButton} />
          <MediaField
            label="Background image"
            name="contactImage"
            value={toMediaValue(contact)}
            storage={storage}
          />
        </Fieldset>

        <Fieldset legend="Footer">
          <TextField label="Tagline" name="footerTagline" defaultValue={s.footerTagline} />
          <TextArea
            label="Small print"
            name="footerNote"
            defaultValue={s.footerNote ?? ""}
            rows={2}
            maxLength={300}
            hint="Optional. Clear this once all the sample art is replaced."
          />
        </Fieldset>
      </AdminForm>
    </>
  );
}
