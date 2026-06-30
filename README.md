# Green Star Solutions

Portfolio + agency site for a Las Vegas digital & AI consultancy. Built so the
craft of the site itself is the sales argument.

Next.js (App Router) · Tailwind v4 · TypeScript. Fully static — fast and cheap
to host.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Where to edit things

Everything is component-structured under `components/` so copy and layout are
easy to change.

| You want to change…              | Edit                            |
| -------------------------------- | ------------------------------- |
| Headline / hero copy             | `components/Hero.tsx`           |
| The case study (swap the client) | `components/CaseStudy.tsx`      |
| Services / pricing ladder        | `components/Services.tsx`       |
| Process steps                    | `components/Process.tsx`        |
| Who it's for                     | `components/Audience.tsx`       |
| Founder / about + signature      | `components/About.tsx`          |
| Colors, type, spacing tokens     | `app/globals.css` (top of file) |
| Email, phone, form endpoint      | `lib/config.ts`                 |

### Design tokens

All colors and fonts are CSS variables in `app/globals.css`. The system is a
warm paper base, a deep green-black ink, and one restrained forest accent.
Fonts: Bricolage Grotesque (display), Hanken Grotesk (body), Newsreader
(editorial italic). The `✦` mark is `components/StarMark.tsx`.

> Heads up: don't name a CSS class `.invert` — it collides with Tailwind's
> built-in `invert` filter utility. The dark sections use `.surface-forest`.

## The onboarding form (Netlify Forms)

`components/ProjectForm.tsx` is a 5-step guided flow (business → goals → style →
assets → contact). It submits via **Netlify Forms** — no third-party service,
no API keys. Submissions land in your Netlify dashboard under **Forms**.

How it's wired:

- `components/NetlifyFormDetect.tsx` renders a hidden, static form named
  `project-inquiry` listing every field. Netlify's build bot scans the deployed
  HTML, finds it, and provisions the backend. (A client-rendered React form
  isn't visible to that scanner on its own — hence the hidden form.)
- The live form POSTs `multipart/form-data` to `/` with a matching `form-name`.
  Field names in `ProjectForm.tsx` must match those in `NetlifyFormDetect.tsx`.

After the first deploy:

1. In Netlify → **Forms**, you'll see `project-inquiry` registered.
2. Turn on email alerts: **Site configuration → Forms → Form notifications →
   add notification → email**, pointed at your inbox.

**Note:** Netlify Forms only runs on Netlify — submissions can't be tested from
`localhost` or a plain static server. File uploads are supported and count
toward your plan's form usage.

Also update `CONTACT_EMAIL`, `PHONE` in `lib/config.ts` and the signature line
in `components/About.tsx`.

## Deploy

This is a **static export** (`output: "export"` in `next.config.ts`).
`npm run build` emits a plain `./out` folder.

- **Netlify (drag & drop)** — drag the **`out/`** folder onto your site's
  Deploys page. (Do not drop the project root or `.next`.)
- **Netlify (Git)** — build command `npm run build`, publish directory `out`.
- **Vercel** — import the repo; zero config.
