'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { useMailSession } from '@/hooks/use-mail-session';
import { EmailGenerator } from '@/components/ui/email-generator';
import { FeaturesGrid } from '@/components/ui/features-grid';
import { Inbox } from '@/components/ui/inbox';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { fetchStats } from '@/lib/api/tf-api';
import { Sparkles, Mail, Github } from 'lucide-react';

export default function Home() {
  const {
    session,
    emails,
    isLoading,
    error,
    generate,
    recover,
    selectEmail,
    refresh,
    downloadAttachment,
  } = useMailSession();

  const [copied, setCopied] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [statsTotal, setStatsTotal] = useState<string>();

  // Load global stats once; hide silently on failure
  useEffect(() => {
    fetchStats([], true, true)
      .then((s) => setStatsTotal(s.totalFormatted))
      .catch(() => setStatsTotal(undefined));
  }, []);

  useEffect(() => {
    if (!session?.address) return;
    const interval = setInterval(() => {
      setNextRefreshIn((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.address]);

  useEffect(() => {
    setErrorMessage(error ?? undefined);
  }, [error]);

  const handleCopy = () => {
    if (session?.address) {
      navigator.clipboard.writeText(session.address);
      setCopied(true);
      toast.success('Email address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerate = async (
    providers: Parameters<typeof generate>[0],
    dot: boolean,
    plus: boolean
  ) => {
    setErrorMessage(undefined);
    await generate(providers, dot, plus);
  };

  const handleRecover = async (address: string) => {
    setErrorMessage(undefined);
    try {
      await recover(address);
    } catch {
      setErrorMessage('Could not recover that address.');
    }
  };

  const handleRefresh = () => {
    refresh();
    setNextRefreshIn(5);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(0 0% 3.9%)',
            border: '1px solid hsl(0 0% 14%)',
            color: 'hsl(0 0% 100%)',
          },
        }}
      />

      {/* Fixed Navigation */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              <span className="text-xl font-bold tracking-tight">LaughMail</span>
            </div>

            <nav className="flex items-center gap-3">
              {session?.address && (
                <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative border-b overflow-hidden">
        <div className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)]">
          <FlickeringGrid
            className="z-0 absolute inset-0"
            squareSize={4}
            gridGap={6}
            color="rgb(128, 128, 128)"
            maxOpacity={0.6}
            flickerChance={0.4}
          />
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, hsl(var(--background)) 35%, hsl(var(--background) / 0.4) 65%, transparent 100%)',
            }}
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Temporary Email Service
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Disposable Email
              <br />
              <span className="text-muted-foreground">in Seconds</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Generate a temporary email address on real Outlook, Hotmail &amp;
              Gmail. No registration. Recover your last address anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Email Generator */}
      <EmailGenerator
        email={session?.address || ''}
        onCopy={handleCopy}
        onGenerate={handleGenerate}
        onRecover={handleRecover}
        copied={copied}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />

      {/* Divider Grid */}
      <section className="relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-border hidden lg:block"
          style={{ left: 'calc(50% - 40rem)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-px bg-border hidden lg:block"
          style={{ right: 'calc(50% - 40rem)' }}
        />
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
          <div className="h-12" />
        </div>
      </section>

      {/* Inbox */}
      <Inbox
        emails={emails}
        address={session?.address || ''}
        onRefresh={handleRefresh}
        onEmailClick={selectEmail}
        onDownloadAttachment={downloadAttachment}
        isRefreshing={isLoading}
        nextRefreshIn={session?.address ? nextRefreshIn : undefined}
      />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <span className="font-semibold">LaughMail</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Powered by the temp.tf mailbox pool. Emails live as long as the
              provider account exists. No registration, no tracking.
            </p>
            <div className="flex items-center gap-4">
              {statsTotal && (
                <span className="text-xs text-muted-foreground">
                  {statsTotal} addresses available
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                by{' '}
                <span className="text-foreground font-medium">
                  hassankhan2608
                </span>
              </span>
              <a
                href="https://github.com/hassankhan2608/laughmail"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub Repository"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
