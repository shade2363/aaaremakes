# AAARemakes — website

Static one-page site for **AAARemakes LLC** (engine conversion pipelines for classic games).
No build step, no dependencies, no framework. Open `index.html` and it runs.

```
index.html          markup + all copy
assets/styles.css   design system and layout
assets/main.js      nav, reveals, FAQ, contact form
assets/favicon.svg  mark
robots.txt          crawler rules
```

## View it

- Double-click `index.html`, **or**
- Serve the folder: `python -m http.server 4321` → <http://127.0.0.1:4321>

A local server is currently running on port 4321 from this folder.

## Edit the content

Everything a visitor reads is plain text in `index.html`. The sections are:

| Section | Anchor | What lives there |
| --- | --- | --- |
| Hero | `#top` | headline, lede, three headline stats |
| Pipeline | `#pipeline` | the four conversion stages |
| Projects | `#projects` | one `<article class="project">` per title |
| Download | `#download` | release card, requirements, demo scope, three steps |
| Roadmap | `#roadmap` | four timeline entries |
| Studio | `#studio` | about copy + three principles |
| Support | `#support` | donation band + Squarespace checkout link |
| FAQ | `#faq` | `<details>` blocks |
| Contact | `#contact` | email, studio line, enquiry form |

### Project status

Each project card has a badge and a six-row stage grid:

```html
<span class="badge badge-live"><span class="pulse"></span>Playable build</span>
...
<div><dt>Navmesh</dt><dd class="s-done">complete</dd></div>
```

- Badge: `badge-live` (green, playable) or `badge-dev` (amber, in development).
- Stage state: `s-done` (green) · `s-work` (orange, in progress) · `s-next` (grey, queued).

Keep these honest — the site's whole pitch is that it doesn't overstate progress.

### Release info (auto)

The Download section and the Fallout 4-Ever card read the latest release from
`https://api.github.com/repos/shade2363/Fallout-4-Ever` on page load
(`assets/main.js`, section "live release info"). Version, date, installer size, the download
link and the checksums link update themselves.

- Repo is set once: `const REPO = "shade2363/Fallout-4-Ever";`
- The HTML holds a static fallback (`v0.3.1`, `29.6 MB`, 6 November 2026) that stays if the API
  is unreachable or rate-limited, so the page never shows an empty box.
- Hard-coded numbers that do **not** auto-update: 4,260 actors, 7,198 navmeshes, 5 DLC worlds,
  ~150 GB. Refresh those from the release notes when they change.

## Animated background

`assets/background.js` paints a fixed layer behind the page:

- **Aurora** (CSS, `styles.css`): two large radial glows drifting on 54s / 76s cycles.
- **Embers and dust** (canvas `#bg`): 34–110 soft motes rising slowly with a sine sway,
  pre-rendered glow sprites, 30fps, additive blending. Density scales with window area.
- Grain and vignette sit above both.

Behaviour:

- **Reduced motion**: the embers keep drifting at about a third of the speed and the aurora freezes.
  Nothing is busy, but the layer still reads as alive — so it stays visible on machines with
  Windows *Animation effects* switched off (browsers report that as `prefers-reduced-motion: reduce`).
- **Full speed preview**: add `?motion=on` to the URL, e.g. `index.html?motion=on`.
- The canvas pauses when the tab is hidden and resizes on debounce.

Tuning knobs, all in `background.js`: `PALETTE` (colours), the `target` particle count
(`(width * height) / 17000`, capped at 110), `rise` and `alpha` in `makeParticle`, and `opacity`
of `.bg-canvas` in `styles.css`.

## Donations (Squarespace → PayPal)

Squarespace's payment block can't be embedded in a static page, so the Support band links out to the
live checkout:

```
https://aaaremakes.com/sq/pay/donations
```

That URL sits on the Squarespace site and 302-redirects to a PayPal payment link
(`paypal.com/ncp/payment/...`), which handles the card details and receipts. It's the only
`data-donate` link on the page; the footer *Support* link just scrolls to `#support`.

- **Keep the Squarespace page published.** If you move `aaaremakes.com` off Squarespace and onto
  this static site, the `/sq/pay/...` path dies. In that case point the button straight at the
  PayPal payment link instead, or at a new Squarespace donation page on a subdomain.
- To change the destination, search `data-donate` in `index.html`.
- The button opens in a new tab with `rel="noopener noreferrer"`.

Copy notes: the band says donations are optional, buy no access or perks, and that builds are never
gated. Keep that wording — Bethesda's fan-content rules require fan work to stay free, and optional
tips with no perks are the safest posture for a conversion project.

## Discord and repository links

The invite `https://discord.gg/GNZsfuD9RS` (server **AAARemakes**, non-expiring) appears in five places:

| Where | What it says |
| --- | --- |
| Header | icon button beside the Donate pill (`aria-label="Join the AAARemakes Discord server"`) |
| Contact block | row `DISCORD` → "Join the AAARemakes server" |
| Download section | "Stuck at a step? Ask in the Discord" under the three steps |
| Footer | `Community` column: Discord · GitHub · Releases |
| FAQ | "Can I follow the work?" and "Where do I report a bug?" |

To swap the invite, search for `discord.gg/GNZsfuD9RS` (five occurrences). Keep `target="_blank"`
and `rel="noopener noreferrer"`.

## Things to replace before going live

1. **Email** — already wired. The address is stored base64-encoded in `assets/main.js`
   (`MAIL_PARTS`) and assembled only when someone clicks, so it never appears in the HTML, in the
   visible page, or as a plain string in the source. The contact row simply reads
   "Email the studio", and the enquiry form sends to the same address.
   To change it, encode the two halves and paste them in:

   ```bash
   node -e "console.log(Buffer.from('local-part').toString('base64'))"
   node -e "console.log(Buffer.from('domain.com').toString('base64'))"
   ```

   The form has no backend: it composes a `mailto:` message in the visitor's mail client.
   If you want a real inbox, point it at a form service (Formspree, Basin, Netlify Forms)
   and post to it from `main.js` instead.
2. **Attribution** — the download section credits "made by @yourstruly_0 with opness1549".
   Adjust the wording or link if you want it attributed differently.
3. **Domain** — the site targets `https://aaaremakes.com/`. Add a canonical link in `<head>`:
   `<link rel="canonical" href="https://aaaremakes.com/">`, then enable the Sitemap line in
   `robots.txt`. Note that `aaaremakes.com` currently serves a private Squarespace site — the
   donation button depends on that Squarespace install staying published at
   `/sq/pay/donations` (see the Donations section).
4. **Social preview** — add a 1200×630 `assets/og.jpg` and
   `<meta property="og:image" content="https://aaaremakes.com/assets/og.jpg">`.
5. **Legal** — the footer already states trademarks belong to their owners and that no game
   assets are distributed. Get the wording checked for your jurisdiction before launch.

## Deploy

Any static host works — no configuration needed.

- **Netlify / Vercel / Cloudflare Pages**: drag the folder in, or connect the repo.
- **GitHub Pages**: push to a repo, enable Pages on the branch root.
- **Plain hosting**: upload the folder contents to `public_html`.

## Design notes

- Near-black base, forge-orange accent, condensed display type (Barlow Condensed) over Inter.
- All visuals are CSS/SVG — no screenshot assets, so nothing is borrowed from the games.
- Responsive from 360px up; mobile menu, sticky header with a scroll-progress hairline.
- Respects `prefers-reduced-motion`: reveals, marquee and pulses stop.
- Lighthouse (local): accessibility 0.96+ · best practices 1.0 · SEO clean when served over HTTP.
