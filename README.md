# Portfolio

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=threedotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

My personal portfolio website with an interactive AI chat feature, 3D graphics, animated backgrounds, and a projects showcase. Built with Next.js, Three.js, and the Groq API.

**Live:** [idrissamaiga.iditechs.com](https://idrissamaiga.iditechs.com)

---

## Features

- **AI chat** -- ask questions about me, my experience, or my projects via an integrated chatbot (Groq API)
- **3D graphics** -- interactive visuals built with Three.js and React Three Fiber
- **Matrix background** -- animated code-rain background effect
- **Projects showcase** -- portfolio of highlighted projects with links
- **Skills section** -- organized technical skills display
- **Contact form** -- reach out via the built-in contact form (Nodemailer)
- **CV endpoint** -- downloadable resume
- **Dark mode** -- full dark mode support
- **Smooth animations** -- Framer Motion + GSAP transitions throughout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| 3D | Three.js, React Three Fiber, Drei |
| Animation | Framer Motion, GSAP |
| UI | Tailwind CSS, Shadcn/ui, Lucide Icons |
| AI | Groq SDK |
| Email | Nodemailer |

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
git clone https://github.com/IdrissaMaiga/portfolio.git
cd portfolio
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
GROQ_API_KEY=your-groq-api-key
# App email is sent through the own mail server (Stalwart), auth as a no-reply mailbox
SMTP_HOST=mail.iditechs.com
SMTP_PORT=465
SMTP_USER=noreply
SMTP_PASS=your-noreply-mailbox-password
SMTP_FROM="Idrissa Maiga" <noreply@iditechs.com>
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
portfolio/
├── app/
│   ├── api/
│   │   ├── ai/route.ts          # AI chat endpoint
│   │   ├── contact/route.ts     # Contact form handler
│   │   └── cv/route.ts          # CV download endpoint
│   ├── layout.tsx
│   ├── loading.tsx
│   └── page.tsx                 # Home (hero, about, projects, skills, contact)
├── components/
│   ├── hero-section.tsx
│   ├── about-section.tsx
│   ├── projects-section.tsx
│   ├── skills-section.tsx
│   ├── contact-section.tsx
│   ├── chat-button.tsx          # AI chat trigger
│   ├── matrix-background.tsx    # Animated matrix effect
│   ├── navbar-section.tsx
│   ├── footer.tsx
│   └── ui/                      # Shadcn/ui components
├── lib/
│   └── utils.ts
└── public/
    └── logos/
```

## Contributing

Contributions are welcome. Fork the repo, create a branch, and submit a pull request.

## License

MIT
