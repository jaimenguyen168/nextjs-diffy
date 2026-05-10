<img width="1536" height="1024" alt="diffy" src="https://github.com/user-attachments/assets/abb914f9-e023-480d-8af4-770918520d3f" />

<div align="center">
  <img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=000000" alt="Next.js" />
  <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/-tRPC-black?style=for-the-badge&logoColor=white&logo=trpc&color=2596BE" alt="tRPC" />
  <img src="https://img.shields.io/badge/-Prisma-black?style=for-the-badge&logoColor=white&logo=prisma&color=2D3748" alt="Prisma" />
  <img src="https://img.shields.io/badge/-Inngest-black?style=for-the-badge&logoColor=white&logo=inngest&color=5B21B6" alt="Inngest" />
  <img src="https://img.shields.io/badge/-Better_Auth-black?style=for-the-badge&logoColor=white&logo=auth0&color=EB5424" alt="Better Auth" />
  <img src="https://img.shields.io/badge/-Neon-black?style=for-the-badge&logoColor=white&logo=postgresql&color=00E599" alt="Neon" />
</div>

---

## 📋 Table of Contents

1. 📋 [Project Overview](#project-overview)
2. 🔋 [Key Features](#key-features)
3. 🚀 [Planned Features](#planned-features)
4. 📌 [Getting Started](#getting-started)

---

## <a name="project-overview">📋 Project Overview</a>

**Diffy** is an AI-powered code review tool that integrates with your GitHub repositories to automatically analyze pull requests. Connect your repos, trigger a review, and get a structured breakdown of risks, bugs, and suggestions — all from a clean dashboard. Reviews can be posted directly back to GitHub as PR comments.

---

## <a name="key-features">🔋 Key Features</a>

- 👉 **GitHub Integration**: connect your GitHub account via OAuth and link any of your repositories to Diffy for automated review coverage
- 👉 **AI Pull Request Reviews**: trigger on-demand AI reviews of any open PR — get a risk score, walkthrough summary, categorized comments (bugs, performance, security, style), and severity ratings
- 👉 **Post Reviews to GitHub**: select individual AI comments and post them directly to the PR on GitHub as a formatted review, including a walkthrough and risk score header
- 👉 **Background Job Processing**: reviews are processed asynchronously via Inngest so the UI stays fast and responsive, with real-time status updates (Pending → Completed / Failed)
- 👉 **Dashboard**: view all connected repos with live open PR counts, browse PRs by state (open / closed / all), and track review history per repo
- 👉 **Authentication**: full email/password sign-up and sign-in with Better Auth, including email verification and session management
- 👉 **Type-safe API**: end-to-end type safety from database to client using tRPC v11, Zod, and TanStack Query
- 👉 **Modern UI**: built with shadcn/ui, Tailwind CSS, Radix UI primitives, and Sonner toasts for a polished, accessible interface

---

## <a name="planned-features">🚀 Planned Features</a>

- 💳 **Billing & Subscriptions**: usage-based or seat-based plans via Stripe — free tier with limited reviews per month, Pro for unlimited reviews and advanced AI models
- 📊 **Usage Dashboard**: track reviews consumed, tokens used, and quota remaining within the current billing period
- 📬 **Review Notifications**: email or Slack alerts when a background review completes, so you never miss results
- 🏢 **Teams & Organizations**: invite teammates, share connected repositories across an org, and manage member permissions
- 🧩 **Custom Review Rules**: configure which categories (security, performance, style) Diffy focuses on per repository

---

## <a name="getting-started">📌 Getting Started</a>

### Prerequisites

- Node.js 20+
- pnpm
- A [Neon](https://neon.tech) PostgreSQL database
- A GitHub OAuth App
- An [Inngest](https://inngest.com) account

### Installation

**Clone the repository**

```bash
git clone https://github.com/jaimenguyen168/next-diffy.git
cd next-diffy
```

**Install dependencies**

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root of the project and add the following:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (Neon)
DATABASE_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=

# AI
GOOGLE_GENERATIVE_AI_API_KEY=
OPENAI_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

### Database Setup

```bash
pnpm db:push
```

### Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

To process background review jobs locally, run the Inngest dev server in a separate terminal:

```bash
npx inngest-cli@latest dev
```

### GitHub Webhook Setup

To enable automatic review triggers on PR events, register a webhook on your GitHub repository:

- **Payload URL**: `https://your-domain.com/api/webhooks/github`
- **Content type**: `application/json`
- **Secret**: the value of your `GITHUB_WEBHOOK_SECRET` env var
- **Events**: select **Pull requests**

For local development, use your ngrok URL as the payload URL base (e.g. `https://your-ngrok-id.ngrok-free.app/api/webhooks/github`).
