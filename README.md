<div align="center">

# Crivox

**AI-powered social media comment generator for every platform and tone.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge)](https://console.groq.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## Overview

Crivox solves the blank reply box problem. Paste any social media post and get thoughtful, platform-aware comments tailored to your voice in seconds.

Built for creators, marketers, and professionals who engage daily on LinkedIn, Twitter/X, Instagram, Facebook, Reddit, and more.

---

## Features

- **AI Comment Generator**: Paste text, a URL, or upload a screenshot. Get up to 5 unique variations powered by Groq (auto-selects the best available model at runtime)
- **8 Tone Styles**: Professional, Casual, Witty, Supportive, Bold, Educational, Insightful, Authoritative
- **9 Languages**: English, Spanish, French, German, Portuguese, Hindi, Arabic, Chinese, Japanese
- **11 Platforms**: LinkedIn, Twitter/X, Instagram, Facebook, Reddit, Blog, Hacker News, Indie Hackers, GitHub Discussions, Threads, Medium
- **Bulk Generation**: Generate comments for up to 5 posts at once with CSV export
- **Templates Library**: 11 built-in presets + create your own across 6 categories
- **Comment History**: Search, filter by tone/platform, favorite, re-generate, export CSV
- **Shareable Links**: Share a public comment set with a single link (no login required)
- **Voice Profile**: Store up to 3 writing samples so the AI matches your personal style
- **AI Memory**: Save your name, profession, and goals so the AI always writes in context
- **Dark / Light Mode**: Persistent theme preference

---

## Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v3, shadcn/ui, Radix UI |
| Backend | Supabase (Auth, PostgreSQL, Row Level Security) |
| AI | Groq API auto model selection at runtime |
| State | TanStack Query v5 |
| Animations | Framer Motion |
| Charts | Recharts |
| Deployment | Vercel |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm / pnpm
- Supabase project
- Groq API key

### Installation

```bash
git clone https://github.com/MuhammadTanveerAbbas/crivox.git
cd crivox
npm install          # or pnpm install
cp .env.example .env.local
# Fill in your Supabase and Groq credentials
npm run dev
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project ID |
| `SUPABASE_URL` | Server | Same as VITE_SUPABASE_URL (Vercel API functions) |
| `SUPABASE_ANON_KEY` | Server | Same as VITE_SUPABASE_PUBLISHABLE_KEY |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase service role key (edge functions) |
| `GROQ_API_KEY` | Yes | Groq API key (Supabase Edge Function secret) |
| `CRON_SECRET` | Keep-alive | Secret for Vercel cron endpoint |
| `STRIPE_SECRET_KEY` | Billing | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Billing | Stripe webhook signing secret |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Billing | Stripe publishable key |

---

## Project Structure

```
crivox/
├── api/                        # Vercel serverless functions
│   ├── health.ts
│   ├── keep-alive.ts
│   ├── create-checkout.ts
│   └── stripe-webhook.ts
├── src/
│   ├── components/
│   │   ├── landing/            # Landing page sections
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── CommentGenerator.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── CrivoxIcon.tsx
│   ├── contexts/               # AuthContext
│   ├── hooks/
│   ├── lib/                    # groq.ts, groqReliability.ts, utils, schemas, sanitize
│   └── pages/
├── supabase/
│   └── functions/generate-comments/   # Edge function (Groq calls)
├── .env.example
└── README.md
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 8080) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint check |
| `npm test` | Vitest test run |

---

## Groq Auto Model Selection

The `generate-comments` edge function does **not** hardcode a single model name. At startup it calls the Groq `/models` endpoint, caches the result for 30 minutes, and picks the best available chat-capable model from the configured preference list (`GROQ_MODEL` → `GROQ_FALLBACK_MODELS`). If a model is paused, removed, or returns a 404, the function automatically retries with the next available model no redeployment required.

Rate limits (`429`) are handled with `Retry-After`-aware exponential backoff and bounded retries, so transient limits degrade gracefully rather than surfacing errors to the user.

---

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel dashboard
3. Set all environment variables listed above
4. Deploy build command: `vite build`, output directory: `dist`

### Supabase Edge Function

```bash
supabase secrets set GROQ_API_KEY=<your-key>
supabase functions deploy generate-comments
```

---

## License

MIT see [LICENSE](LICENSE).

---

## Built by Tanveer

**Muhammad Tanveer Abbas** | SaaS Developer
Portfolio: [muhammadtanveerabbas.vercel.app](https://muhammadtanveerabbas.vercel.app)
