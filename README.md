# Crivox  AI Comment Generator

> Generate authentic, platform-aware social media comments in seconds using AI.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- Generate comments from pasted text, a URL (passed as reference), or an image
- 8 tone styles: Professional, Casual, Witty, Supportive, Bold, Educational, Insightful, Authoritative
- Platform-aware output: LinkedIn, Twitter/X, Instagram, Facebook, Reddit, Blog/Website
- 9 languages: English, Spanish, French, German, Portuguese, Hindi, Arabic, Chinese, Japanese
- Up to 5 comment variations per generation (3 on free)
- Bulk generation for up to 5 posts at once
- Comment queue with scheduling
- Reusable templates (user-defined + presets)
- Public share links for generated comment sets
- Usage stats dashboard
- Dark/light mode, Google OAuth

## Getting Started

### Clone

```bash
git clone https://github.com/MuhammadTanveerAbbas/Crivox.git
cd Crivox
```

### Install

```bash
pnpm install
```

### Environment Setup

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### Run

```bash
pnpm dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `GROQ_API_KEY` | Groq API key  get one at [console.groq.com](https://console.groq.com/keys) |

> **Note:** The Groq API key is currently used directly in the client (`src/lib/groq.ts`). For production, move it to a server-side function or Supabase Edge Function and set it as a secret via:
> ```bash
> supabase secrets set GROQ_API_KEY=your-key
> ```

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Auth & DB:** Supabase (Google OAuth, Postgres)
- **AI:** Groq API (`llama-3.3-70b-versatile`)
- **Animations:** Framer Motion

## Folder Structure

```
crivox/
├── public/               # Static assets
├── src/
│   ├── components/       # UI components (landing, dashboard, shadcn/ui)
│   ├── contexts/         # React context (AuthContext)
│   ├── hooks/            # Custom hooks
│   ├── integrations/     # Supabase client
│   ├── lib/              # Groq client, utilities
│   └── pages/            # Route-level page components
├── supabase/
│   └── schema.sql        # Database schema
└── .env.example
```

## Author

Muhammad Tanveer Abbas  [themvpguy.vercel.app](https://themvpguy.vercel.app/)

## License

[MIT](./LICENSE)
