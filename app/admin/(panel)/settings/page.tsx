import { db } from "@/lib/db";
import { mediaById, toMediaValue } from "@/lib/adminData";
import { storageMode } from "@/lib/mediaSave";
import { mailConfigured } from "@/lib/mail";
import { saveSettings, testEmail } from "@/app/admin/actions/settings";
import { AdminForm } from "@/components/admin/AdminForm";
import { Fieldset, Select, TextArea, TextField, Toggle } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/MediaField";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const s = (await db.siteSettings.findUnique({ where: { id: 1 } }))!;
  const og = await mediaById(s.ogImageId);
  const smtpUser = process.env.SMTP_USER;
  return (
    <>
      <h1 className="a-title">Settings</h1>

      <AdminForm action={saveSettings}>
        <Fieldset legend="Email">
          <TextField
            label="Send enquiry notifications to"
            name="notifyEmail"
            type="email"
            defaultValue={s.notifyEmail}
            placeholder={smtpUser ?? "you@gmail.com"}
            hint={
              smtpUser
                ? `Leave empty to use ${smtpUser}.`
                : "Leave empty to use the email account the site sends from."
            }
          />
          <TextField
            label="Public contact email (optional)"
            name="displayEmail"
            type="email"
            defaultValue={s.displayEmail ?? ""}
            hint="Used as the reply address on visitor confirmations."
          />
          <Toggle
            label="Send visitors a short confirmation email"
            name="confirmVisitor"
            defaultChecked={s.confirmVisitor}
            hint="Off by default. When on, visitors get a 감사합니다 note saying you’ll reply within two working days."
          />
        </Fieldset>

        <Fieldset legend="Social links">
          <TextField
            label="Instagram"
            name="instagram"
            type="url"
            defaultValue={s.instagram ?? ""}
            placeholder="https://instagram.com/…"
          />
          <TextField
            label="TikTok"
            name="tiktok"
            type="url"
            defaultValue={s.tiktok ?? ""}
            placeholder="https://tiktok.com/@…"
          />
          <TextField
            label="Etsy"
            name="etsy"
            type="url"
            defaultValue={s.etsy ?? ""}
            placeholder="https://etsy.com/shop/…"
          />
        </Fieldset>

        <Fieldset legend="Search and sharing">
          <TextField
            label="Page title"
            name="seoTitle"
            defaultValue={s.seoTitle}
            maxLength={70}
            hint="Shown in Google and browser tabs. Around 60 characters."
          />
          <TextArea
            label="Description"
            name="seoDescription"
            defaultValue={s.seoDescription}
            rows={3}
            maxLength={170}
            hint="Shown under the title in Google."
          />
          <MediaField
            label="Share image (optional)"
            name="ogImage"
            value={toMediaValue(og)}
            storage={storageMode()}
            hint="Shown when the site is shared on WhatsApp, Instagram or LinkedIn. 1200 × 630 works best. Leave empty to use the silk with your name."
          />
        </Fieldset>

        <Fieldset legend="Feel">
          <Select
            label="First-visit theme"
            name="defaultTheme"
            defaultValue={s.defaultTheme}
            options={[
              { value: "dark", label: "Dark (the original design)" },
              { value: "light", label: "Light (ivory)" },
              { value: "system", label: "Follow the visitor’s device" },
            ]}
            hint="Visitors can always switch with the sun/moon button."
          />
          <Toggle
            label="Custom cursor on computers"
            name="cursorEnabled"
            defaultChecked={s.cursorEnabled}
            hint="The small ivory dot and ring. Never shown on phones."
          />
        </Fieldset>
      </AdminForm>

      <section className="a-panel" aria-labelledby="test-email">
        <h2 id="test-email">Check your email works</h2>
        <p className="a-hint">
          {mailConfigured()
            ? "Sends a test message using your app password, so you know enquiries will reach you."
            : "Email isn’t set up yet. Add SMTP_USER and SMTP_APP_PASSWORD on Vercel (the README shows how), then try this."}
        </p>
        <AdminForm action={testEmail} submitLabel="Send test email" className="a-form a-inline-form">
          <TextField
            label="Send it to"
            name="to"
            type="email"
            defaultValue={s.notifyEmail || smtpUser || ""}
          />
        </AdminForm>
      </section>
    </>
  );
}
