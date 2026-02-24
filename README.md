# HotPatch OTA — Next.js Website

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home / landing page |
| `/features` | Feature deep-dives |
| `/docs` | How It Works (user guide) |
| `/pricing` | Plans & comparison table |
| `/updates` | Product changelog |
| `/dashboard` | Interactive dashboard |

## Stack

- **Next.js 14** — App Router
- **TypeScript**
- **Tailwind CSS** — for utility classes
- **Chart.js** — dashboard charts (loaded dynamically, client-side only)

## Project Structure

```
app/
  layout.tsx          Root layout (SVG logo defs, Navbar)
  page.tsx            Home
  features/page.tsx
  docs/page.tsx       How It Works (with sticky TOC)
  pricing/page.tsx    Pricing toggle + comparison table
  updates/page.tsx    Changelog
  dashboard/page.tsx  Interactive dashboard
  globals.css         Design tokens + shared animations

components/
  Navbar.tsx          Sticky nav with active-route underline
  Logo.tsx            SVG <use href="#logo"> wrapper
  Footer.tsx          Shared footer
  FaqItem.tsx         Client component accordion
  CtaSection.tsx      Reusable CTA banner
```
