# Your atelier: a guide for Caitly

Everything on your website can be changed from your **admin**, on your phone or computer. You never need a developer to change words, prices, or work.

**Your admin:** `https://your-site-address/admin` (save it to your home screen).

---

## 1. Signing in

1. Go to `/admin`.
2. Enter your email and password, then tap **Enter the atelier**.

You stay signed in for two weeks on that device. If you type the wrong password too many times, the login rests for 15 minutes.

**Forgot your password?** Whoever set up the site runs `pnpm admin:hash` to make a new one and updates `ADMIN_PASSWORD_HASH` on Vercel.

---

## 2. The dashboard

When you sign in you’ll see:

- **New enquiries:** tap to read them.
- **Sample pieces left to replace:** the studio sample art still on your site.
- **Packages that are hidden drafts:** packages waiting for your prices.
- **A warning** if an enquiry email didn’t reach your inbox (the enquiry is still safe in the admin; tap **Retry sending**).
- **Finish setting up:** anything still missing on Vercel (email, storage, and so on).

---

## 3. Replacing the sample art (do this first)

On the dashboard, under **Replace the sample art**, each sample piece has a **Replace** button.

1. Tap **Replace**.
2. Tap **Replace** again under the image (or drag a file onto it on a computer).
3. Choose your photo or video:
   - Images: JPG, PNG, WebP or AVIF, up to 10 MB.
   - Videos: MP4 or WebM, up to 80 MB.
4. **Write the alt text**: one short sentence describing what it shows, for people who use screen readers. For example: _“Rose-gold serum bottle on wet silk.”_ This is required.
5. **For videos, add a poster** (the still shown before it plays): pause the video on a lovely frame and tap **Use the current frame**, or upload a photo.
6. Update the title, category and hook if you like.
7. Tap **Save changes**. It’s live straight away, and the piece disappears from your “sample art” list.

**Where things appear on the home page:** turn on **Show on the home page**. The first three pieces in each room fill the phones (Screening Room), the frames (Shopfront) and the browser window (Studio). Drag pieces in **Work** to change which come first.

---

## 4. Adding new work

**Work → Add new work**, then upload, describe, choose the room and save.

- **Category** powers the filter buttons on each room’s page (for example Beauty, Travel, Printable).
- **Hook** is the caption on reels: _“I stopped using foundation.”_
- **Link** can point to the Etsy listing, the live website, or the published paper.
- **Give it a case-study page** creates its own page with the description.
- Only add a **client name** if they’re happy to be named.

To **reorder**, drag the dotted handle, or use the ↑ ↓ arrows. To **hide** something without deleting it, turn off **Show on the site**.

---

## 5. Changing the words

**Words** holds everything on the home page: the hero, the statement, the commission section and the footer.

- Put **stars around a word** to make it gold italic: `I breathe *life* into brands.`
- Tap **Preview** to open your site in a new tab with your unsaved changes (a gold bar at the bottom says you’re previewing). Nothing is live until you tap **Save changes**.
- Once all the sample art is replaced, clear the **Small print** under the footer.

**Rooms** holds each room’s name, Korean name, description, chips and button. Drag rooms to change their order on the home page.

---

## 6. Setting your prices

**Packages** comes with five drafts priced **“From [your price]”**. They stay hidden until you publish them.

1. Tap **Edit** on a package.
2. Set the price as you’d say it: _“From $250”_ or _“From ₦150,000”_.
3. List what’s included, one item per line.
4. Turn on **Published**, then save.

When at least one package is published, a **“Ways to begin”** section appears on the home page and in its room.

---

## 7. Testimonials

Only real words from real clients, shared with their permission. The section stays hidden until you add one. **Testimonials → Add a testimonial**, then confirm it’s real, and save.

---

## 8. Enquiries

When someone sends a brief:

1. It’s **saved in your admin first**, so it can never be lost.
2. You get an **email** with everything they wrote. **Press Reply** in your email app to answer them directly.

In **Enquiries** you can filter (New / Read / Replied / Archived), search, and **Download CSV**. Opening one marks it Read. **Reply by email** opens your mail app with a greeting ready; afterwards tap **Mark as replied**.

Visitors who send more than five briefs an hour are politely asked to wait (spam protection).

---

## 9. Settings

- **Send enquiry notifications to:** your inbox (empty = the address the site sends from).
- **Send visitors a short confirmation email:** off by default.
- **Social links**, **Page title** and **Description** for Google, and a **Share image** (1200 × 630) for WhatsApp and Instagram.
- **First-visit theme:** dark (the original), light (ivory) or follow the visitor’s phone. Visitors can always switch with the sun/moon button.
- **Custom cursor** on computers.
- **Send test email:** checks your email is working.

---

## 10. Setting up your Gmail app password (one time)

The site sends enquiry emails from your own Gmail using an **app password**, a special password just for the website (never your normal one).

1. Turn on **2-Step Verification**: Google Account → Security → 2-Step Verification.
2. Go to Google Account → Security → **App passwords** (or search “App passwords” in your Google Account).
3. Create one named **Website**. Google shows a 16-character password. Copy it.
4. In **Vercel → your project → Settings → Environment Variables**, set:
   - `SMTP_USER` = your Gmail address
   - `SMTP_APP_PASSWORD` = the 16-character password
   - (`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465` and `SMTP_SECURE=true` are already the defaults)
5. **Redeploy** (Vercel → Deployments → ⋯ → Redeploy).
6. In your admin, **Settings → Send test email**. You should get it within a minute.

Never share the app password or paste it anywhere else. If you ever think it leaked, delete it in Google and make a new one.

Personal Gmail can send a few hundred emails a day, far more than enquiries need.

---

## 11. Little things visitors can do

- **Sun/moon button:** switch between dark and light.
- **Pause button:** stop the page’s breathing animation (remembered).
- Visitors who have “reduce motion” turned on in their phone settings get a calm, still version automatically.

---

_아름다움은 팔린다 · beauty sells_
