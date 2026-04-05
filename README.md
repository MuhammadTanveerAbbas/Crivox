<div align="center">

  <img src="public/logo.svg" alt="Crivox Logo" width="80" height="80" />

# Crivox

**AI-powered social media comment generator for every platform and tone.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://crivox.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge)](https://console.groq.com)

</div>

---

<div align="center">
  <img src="public/Crivox.png" alt="Crivox Preview" width="100%" />
</div>

---

## Overview

Crivox solves the blank reply box problem. Paste any social media post — or drop an image — and get multiple thoughtful, platform-aware comments tailored to your chosen tone in seconds. It's built for creators, marketers, and professionals who engage on LinkedIn, Twitter/X, Instagram, Facebook, Reddit, and blogs daily. Unlike generic AI writing tools, Crivox is purpose-built for comments: it understands platform context, tone nuance, and engagement best practices out of the box.

---

## ✨ Features

- 🚀 **AI Comment Generator** — Paste text, a URL, or an image and get up to 5 unique comment variations powered by Groq's Llama 3.3 70B and Llama 4 Scout (vision)
- 🎭 **8 Tone Styles** — Professional, Casual, Witty, Supportive, Bold, Educational, Insightful, and Authoritative
- 🌍 **9 Language Support** — Generate comments in English, Spanish, French, German, Portuguese, Hindi, Arabic, Chinese, and Japanese
- ⚡ **Bulk Generation** — Generate comments for up to 5 posts simultaneously with shared tone/platform settings and CSV export
- 📋 **Comment Queue** — Schedule and track comments by date/time, mark as posted, and add notes
- 📚 **Templates Library** — 11 built-in preset templates across 6 categories, plus create and save your own
- 📊 **Analytics Dashboard** — Visual stats for total generations, tone distribution (pie chart), platform breakdown (bar chart), and 30-day activity trend
- 🕓 **Generation History** — Full searchable history with favorites, filters by tone/platform, one-click re-generate, and CSV export
- 🔗 **Shareable Links** — Share generated comment sets via a public URL with no login required
- 🌙 **Dark / Light Mode** — Full theme support with persistent preference
- 🔒 **Auth + RLS** — Supabase Auth with PKCE flow and Row Level Security — all data is user-scoped

---

## 🛠 Tech Stack

| Category   | Technology                                       |
| ---------- | ------------------------------------------------ |
| Frontend   | React 18 + TypeScript + Vite                     |
| Styling    | Tailwind CSS v3 + shadcn/ui + Radix UI           |
| Backend    | Supabase (Auth + PostgreSQL + RLS)               |
| AI         | Groq AI — Llama 3.3 70B + Llama 4 Scout (vision) |
| Animations | Framer Motion                                    |
| Charts     | Recharts                                         |
| Forms      | React Hook Form + Zod                            |
| State      | TanStack Query v5                                |
| Deployment | Vercel                                           |

---

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- Groq API key

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/MuhammadTanveerAbbas/crivox.git
cd crivox

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your values (see Environment Variables section below)

# 4. Run the development server
pnpm dev

# 5. Open in browser
http://localhost:5173
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>

# Supabase service role key (server/edge functions only — never expose on frontend)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Groq AI (frontend)
VITE_GROQ_API_KEY=<your-groq-api-key>

# Groq AI (Supabase Edge Functions — set via: supabase secrets set GROQ_API_KEY=value)
GROQ_API_KEY=<your-groq-api-key>
```

Get your keys:

- Supabase: https://supabase.com
- Groq: https://console.groq.com/keys

---

## 📁 Project Structure

```
crivox/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── landing/         # Landing page sections
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── CommentGenerator.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── ...
│   ├── contexts/            # AuthContext
│   ├── hooks/               # Custom React hooks
│   ├── integrations/
│   │   └── supabase/        # Supabase client + generated types
│   ├── lib/                 # groq.ts, utils.ts
│   ├── pages/               # Route-level page components
│   └── main.tsx             # App entry point
├── supabase/
│   ├── schema.sql           # Database schema
│   └── config.toml
├── .env.example
├── package.json
└── README.md
```

---

## 📦 Available Scripts

| Command           | Description               |
| ----------------- | ------------------------- |
| `pnpm dev`        | Start development server  |
| `pnpm build`      | Build for production      |
| `pnpm build:dev`  | Build in development mode |
| `pnpm preview`    | Preview production build  |
| `pnpm lint`       | Run ESLint                |
| `pnpm test`       | Run tests (Vitest)        |
| `pnpm test:watch` | Run tests in watch mode   |

---

## 🌐 Deployment

This project is deployed on **Vercel**.

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MuhammadTanveerAbbas/crivox)

1. Click the button above
2. Connect your GitHub account
3. Add environment variables in the Vercel dashboard
4. Deploy

---

## 🗺 Roadmap

- [x] AI comment generation (text, URL, image)
- [x] 8 tone styles + 9 languages
- [x] Bulk generation (up to 5 posts)
- [x] Comment queue with scheduling
- [x] Templates library
- [x] Analytics dashboard
- [x] Shareable comment links
- [x] Dark / light mode
- [ ] Browser extension for in-page generation
- [ ] Team workspaces and collaboration
- [ ] Mobile app

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Built by The MVP Guy

<div align="center">

**Muhammad Tanveer Abbas**
SaaS Developer | Building production-ready MVPs in 14–21 days

[![Portfolio](https://img.shields.io/badge/Portfolio-themvpguy.vercel.app-black?style=for-the-badge)](https://themvpguy.vercel.app)
[![Twitter](https://img.shields.io/badge/Twitter-@themvpguy-1DA1F2?style=for-the-badge&logo=twitter)](https://x.com/themvpguy)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/muhammadtanveerabbas)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github)](https://github.com/MuhammadTanveerAbbas)

_If this project helped you, please consider giving it a ⭐_

</div>
