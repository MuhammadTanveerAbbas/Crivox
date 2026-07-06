<div align="center">

  <img src="public/logo.svg" alt="Crivox Logo" width="80" height="80" />

# Crivox

**AI-powered social media comment generator for every platform and tone.**

[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge)](https://console.groq.com)

</div>

---

## Overview

Crivox solves the blank reply box problem. Paste any social media post and get thoughtful, platform-aware comments tailored to your voice. Built for creators, marketers, and professionals who engage daily on LinkedIn, Twitter/X, Instagram, Facebook, Reddit, and blogs.

---

## Features

- **AI Comment Generator** — Paste text, a URL, or upload an image screenshot. Get up to 5 unique variations powered by Groq (Llama 3.3 70B + Llama 4 Scout for vision)
- **8 Tone Styles** — Professional, Casual, Witty, Supportive, Bold, Educational, Insightful, Authoritative
- **9 Languages** — English, Spanish, French, German, Portuguese, Hindi, Arabic, Chinese, Japanese
- **Bulk Generation** — Generate comments for up to 5 posts at once with CSV export
- **Comment Queue** — Schedule, track, and mark comments as posted with date/time and notes
- **Templates Library** — 11 built-in presets across 6 categories + create your own
- **Analytics Dashboard** — 30-day trend, tone distribution pie chart, platform breakdown bar chart
- **Generation History** — Search, filter by tone/platform, favorite, re-generate, CSV export
- **Shareable Links** — Public comment set URLs with no login required
- **Dark/Light Mode** — Persistent theme preference

---

## Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v3, shadcn/ui, Radix UI primitives |
| Backend | Supabase (Auth, PostgreSQL, Row Level Security) |
| AI | Groq API (Llama 3.3 70B, Llama 4 Scout) |
| State | TanStack Query v5 |
| Forms | React Hook Form, Zod |
| Charts | Recharts |
| Animations | Framer Motion |
| Deployment | Vercel (SPA) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- Groq API key

### Installation

```bash
git clone https://github.com/MuhammadTanveerAbbas/crivox.git
cd crivox
pnpm install
cp .env.example .env.local
# Fill in your Supabase and Groq credentials
pnpm dev
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project ID |
| `SUPABASE_URL` | Server | Same as VITE_SUPABASE_URL (for Vercel API functions) |
| `SUPABASE_ANON_KEY` | Server | Same as VITE_SUPABASE_PUBLISHABLE_KEY (for Vercel API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase service role key (edge functions only) |
| `GROQ_API_KEY` | Yes | Groq API key (set as Supabase Edge Function secret) |
| `CRON_SECRET` | Keep-alive | Secret for Vercel cron endpoint |

---

## Project Structure

```
crivox/
├── api/                    # Vercel serverless functions
│   ├── health.ts
│   └── keep-alive.ts
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── landing/        # Landing page sections
│   │   ├── ui/             # shadcn/ui primitives
│   │   ├── CommentGenerator.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ...
│   ├── contexts/           # AuthContext
│   ├── hooks/              # use-mobile, use-media-query
│   ├── integrations/
│   │   └── supabase/       # Supabase client + types
│   ├── lib/                # groq.ts, utils.ts, schemas.ts, sanitize.ts
│   ├── pages/              # Route page components
│   └── main.tsx            # Entry point
├── supabase/
│   ├── functions/generate-comments/  # Edge function
│   ├── schema.sql          # Full DB schema with RLS
│   └── config.toml
├── .env.example
├── package.json
└── README.md
```

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server (port 8080) |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | ESLint check |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Vitest test run |

---

## Deployment

Deploy on Vercel:

1. Push to GitHub
2. Import project in Vercel dashboard
3. Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `CRON_SECRET`)
4. Deploy (build command: `vite build`, output: `dist`)

### Supabase Edge Function

```bash
supabase secrets set GROQ_API_KEY=<your-key>
supabase functions deploy generate-comments
```

---

## License

MIT License — see [LICENSE](LICENSE).

---

## Built by The MVP Guy

**Muhammad Tanveer Abbas** — SaaS Developer | Production-ready MVPs in 14–21 days
Portfolio: https://themvpguy.vercel.app
