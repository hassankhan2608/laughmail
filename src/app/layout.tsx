import type { Metadata } from 'next';
import { Geist, Geist_Mono, Kode_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const kodeMono = Kode_Mono({
  variable: '--font-kode-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'LaughMail - Disposable Email Service',
  description:
    'Generate temporary email addresses instantly. No registration required. Protect your privacy with disposable emails.',
  keywords: [
    'temporary email',
    'disposable email',
    'temp mail',
    'anonymous email',
    'privacy',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kodeMono.variable} antialiased`}
        style={{ fontFamily: 'var(--font-kode-mono), monospace' }}
      >
        {children}
      </body>
    </html>
  );
}
