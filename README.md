# LaughMail 📧

A sleek, modern disposable email client built with Next.js 16 and the Mail.tm API. Generate temporary email addresses instantly with a beautiful dark UI.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

- **Instant Email Generation** - One-click temporary email creation with GSAP scramble animation
- **Real-time Inbox** - 5-second polling for new messages (no WebSocket required)
- **Full Email Support** - HTML rendering, attachments, and source view
- **Account Management** - Login to existing accounts or register custom addresses
- **Responsive Design** - Mobile-first with drawer modals on small screens
- **Dark Theme** - Vercel-inspired pure black UI with Kode Mono font
- **Session Persistence** - Credentials saved to localStorage for convenience

## Tech Stack

| Category   | Technology                                                                  |
| ---------- | --------------------------------------------------------------------------- |
| Framework  | [Next.js 16](https://nextjs.org/) (App Router)                              |
| Language   | [TypeScript 5](https://www.typescriptlang.org/)                             |
| Styling    | [Tailwind CSS 4](https://tailwindcss.com/)                                  |
| Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Animations | [GSAP](https://gsap.com/) + [Framer Motion](https://www.framer.com/motion/) |
| Icons      | [Lucide React](https://lucide.dev/)                                         |
| Toasts     | [Sonner](https://sonner.emilkowal.ski/)                                     |
| API        | [Mail.tm](https://mail.tm/)                                                 |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+

### Installation

```bash
# Clone the repository
git clone https://github.com/hassankhan2608/laughmail.git
cd laughmail

# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `bun run dev`   | Start development server with hot reload |
| `bun run build` | Build for production                     |
| `bun run start` | Start production server                  |
| `bun run lint`  | Run ESLint                               |

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Tailwind + CSS variables
│   ├── layout.tsx       # Root layout with Sonner
│   └── page.tsx         # Main page component
├── components/
│   ├── auth/            # Login & signup modals
│   ├── email/           # Email list & viewer
│   ├── layout/          # Account menu
│   └── ui/              # Reusable UI components
├── hooks/
│   ├── use-mail-session.ts  # Mail.tm session management
│   └── use-mobile.tsx       # Mobile detection
├── lib/
│   ├── api/mail-api.ts  # Mail.tm API client
│   ├── session.ts       # localStorage utilities
│   └── utils.ts         # cn() helper
└── types/
    └── mail.ts          # TypeScript definitions
```

## How It Works

1. **Generate Email** - Click "Generate Email" to create a random address via Mail.tm API
2. **Wait for Messages** - Inbox polls every 5 seconds for new emails
3. **Read & Manage** - Click emails to view content, download attachments, or delete
4. **Settings** - Access account info, storage usage, and bulk delete options

## API Reference

LaughMail uses the [Mail.tm API](https://docs.mail.tm/) for all email operations:

- `POST /accounts` - Create new account
- `POST /token` - Authenticate and get JWT
- `GET /messages` - Fetch inbox messages
- `GET /messages/{id}` - Get full message content
- `DELETE /messages/{id}` - Delete a message
- `GET /domains` - List available domains

## Customization

### Theming

Edit `src/app/globals.css` to customize colors:

```css
:root {
  --background: 0 0% 0%; /* Pure black */
  --foreground: 0 0% 98%; /* Off-white text */
  --primary: 0 0% 98%; /* Primary buttons */
  --muted: 0 0% 15%; /* Muted backgrounds */
}
```

### Fonts

The app uses [Kode Mono](https://fonts.google.com/specimen/Kode+Mono) for a techy feel. Change in `layout.tsx`:

```tsx
const kodeMono = Kode_Mono({ subsets: ['latin'] });
```

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hassankhan2608/laughmail)

### Docker

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
```

## Contributing

Contributions are welcome! Please open an issue or submit a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- Built by [Hassan Khan](https://github.com/hassankhan2608)
- Email API by [Mail.tm](https://mail.tm/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)

---

<p align="center">
  <sub>Made by <a href="https://github.com/hassankhan2608">hassankhan2608</a></sub>
</p>
