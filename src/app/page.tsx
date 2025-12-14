'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { useMailSession } from '@/hooks/use-mail-session';
import { EmailGenerator } from '@/components/ui/email-generator';
import { FeaturesGrid } from '@/components/ui/features-grid';
import { Inbox } from '@/components/ui/inbox';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { LoginModal } from '@/components/auth/login-modal';
import { SignupModal } from '@/components/auth/signup-modal';
import { SettingsDialog } from '@/components/ui/settings-dialog';
import { AccountMenu } from '@/components/layout/account-menu';
import { Button } from '@/components/ui/button';
import { Email } from '@/types/mail';
import { Mail, Sparkles, LogIn, UserPlus, Github, Loader2 } from 'lucide-react';

export default function Home() {
  const {
    session,
    emails,
    isLoading,
    isAuthenticated,
    quickRegister,
    login,
    register,
    deleteAccount,
    selectEmail,
    deleteEmail,
    downloadAttachment,
    refresh,
    getDomains,
    clearAllEmails,
  } = useMailSession();

  const [copied, setCopied] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string>();

  // Poll countdown timer
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleCopy = () => {
    if (session?.account.address) {
      navigator.clipboard.writeText(session.account.address);
      setCopied(true);
      toast.success('Email address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewEmail = async () => {
    setErrorMessage(undefined);
    try {
      await quickRegister();
    } catch {
      setErrorMessage('Failed to generate email. Please try again.');
    }
  };

  const handleRefresh = () => {
    refresh();
    setNextRefreshIn(5);
  };

  const handleEmailClick = async (email: Email) => {
    await selectEmail(email);
  };

  const handleDownloadAttachment = async (url: string, filename: string) => {
    await downloadAttachment(url, filename);
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
              <span className="text-xl font-bold tracking-tight">
                LaughMail
              </span>
            </div>

            <nav className="flex items-center gap-3">
              {isAuthenticated && session ? (
                <AccountMenu
                  email={session.account.address}
                  isTemporary={true}
                  storageUsed={session.account.used}
                  storageQuota={session.account.quota}
                  onLogin={() => setShowLogin(true)}
                  onSignup={() => setShowSignup(true)}
                  onSettings={() => setShowSettings(true)}
                />
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowLogin(true)}
                    className="gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                  <Button onClick={() => setShowSignup(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative border-b overflow-hidden">
        {/* Flickering Grid Background - extended slightly beyond bounds for perfect edge coverage */}
        <div className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)]">
          <FlickeringGrid
            className="z-0 absolute inset-0"
            squareSize={4}
            gridGap={6}
            color="rgb(128, 128, 128)"
            maxOpacity={0.6}
            flickerChance={0.4}
          />
          {/* Radial gradient mask - fades grid from edges to center, clear in middle */}
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
              Generate a temporary email address instantly. No registration
              required. Protect your privacy and keep your real inbox clean.
            </p>

            {!isAuthenticated && (
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Button
                  onClick={handleNewEmail}
                  size="lg"
                  className="min-w-[200px]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Email'
                  )}
                </Button>
                <Button
                  onClick={() => setShowLogin(true)}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px]"
                  disabled={isLoading}
                >
                  Login to Existing
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Email Generator Section (only when authenticated) */}
      {isAuthenticated && (
        <EmailGenerator
          email={session?.account.address || ''}
          onCopy={handleCopy}
          onGenerate={handleNewEmail}
          copied={copied}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {/* Divider Grid */}
      {isAuthenticated && (
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
            {/* Horizontal divider line connecting to side borders */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
            <div className="h-12" />
          </div>
        </section>
      )}

      {/* Inbox Section (only when authenticated) */}
      {isAuthenticated && (
        <Inbox
          emails={emails}
          onRefresh={handleRefresh}
          onDelete={deleteEmail}
          onEmailClick={handleEmailClick}
          onDownloadAttachment={handleDownloadAttachment}
          isRefreshing={isLoading}
          nextRefreshIn={nextRefreshIn}
        />
      )}

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
              Built with Next.js and the Mail.tm API. Emails are temporary and
              will be deleted automatically.
            </p>
            <div className="flex items-center gap-4">
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

      {/* Modals */}
      <LoginModal
        open={showLogin}
        onOpenChange={setShowLogin}
        onLogin={login}
      />
      <SignupModal
        open={showSignup}
        onOpenChange={setShowSignup}
        onSignup={register}
        getDomains={async () => {
          const domains = await getDomains();
          return domains.map((d) => d.domain);
        }}
      />

      {session && (
        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          email={session.account.address}
          isTemporary={true}
          accountId={session.account.id}
          createdAt={new Date(session.account.createdAt)}
          updatedAt={new Date(session.account.updatedAt)}
          storageUsed={session.account.used}
          storageQuota={session.account.quota}
          messageCount={emails.length}
          onClearAllEmails={clearAllEmails}
          onDeleteAccount={deleteAccount}
        />
      )}
    </div>
  );
}
