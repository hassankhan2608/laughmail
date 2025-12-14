'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mail, Copy, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrambleTextPlugin);

interface EmailGeneratorProps {
  email: string;
  onCopy: () => void;
  onGenerate: () => void;
  copied: boolean;
  isLoading: boolean;
  errorMessage?: string;
}

export const EmailGenerator: React.FC<EmailGeneratorProps> = ({
  email,
  onCopy,
  onGenerate,
  copied,
  isLoading,
  errorMessage,
}) => {
  const emailRef = useRef<HTMLElement>(null);
  const prevEmailRef = useRef<string>(email);

  useEffect(() => {
    if (emailRef.current) {
      if (isLoading && !email) {
        // Infinite loading scramble on "Generating Email" text
        const loadingText = 'Generating Email';
        emailRef.current.textContent = loadingText;

        gsap.to(emailRef.current, {
          duration: 0.8,
          scrambleText: {
            text: loadingText,
            chars: '.:',
            speed: 0.5,
          },
          ease: 'none',
          repeat: -1,
          repeatDelay: 0,
        });
      } else if (email && email !== prevEmailRef.current) {
        // Show actual email with original scramble effect
        gsap.killTweensOf(emailRef.current);
        gsap.to(emailRef.current, {
          duration: 1.2,
          scrambleText: {
            text: email,
            chars: '.:',
            speed: 0.5,
          },
          ease: 'none',
        });
        prevEmailRef.current = email;
      }
    }
  }, [email, isLoading]);

  return (
    <section className="relative border-b">
      <div
        className="absolute left-0 top-0 bottom-0 w-px bg-border hidden lg:block"
        style={{ left: 'calc(50% - 40rem)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-px bg-border hidden lg:block"
        style={{ right: 'calc(50% - 40rem)' }}
      />

      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="absolute top-0 left-4 w-3 h-3 border-l border-t border-border" />
        <div className="absolute top-0 right-4 w-3 h-3 border-r border-t border-border" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="text-center space-y-1">
            <h2 className="text-3xl font-semibold">Your Temporary Address</h2>
            <p className="text-sm text-muted-foreground">
              Active for the next 60 minutes
            </p>
          </div>

          <div className="relative border rounded-lg p-6 bg-muted/5">
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary/50" />

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded border bg-background/50">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <code
                  ref={emailRef}
                  className="text-base md:text-lg font-mono flex-1 break-all"
                >
                  {isLoading
                    ? 'Generating Email'
                    : email || 'Login or signup to get your email address'}
                </code>
              </div>

              {errorMessage && !isLoading && (
                <div className="p-3 rounded border border-destructive/50 bg-destructive/10">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <span className="text-destructive">⚠</span>
                    {errorMessage}
                  </p>
                </div>
              )}

              {email && !errorMessage && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={onCopy}
                    size="lg"
                    className="flex-1 min-w-[140px]"
                    disabled={isLoading}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Address
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={onGenerate}
                    variant="outline"
                    size="lg"
                    className="flex-1 min-w-[140px]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        New Address
                      </>
                    )}
                  </Button>
                </div>
              )}

              {errorMessage && !isLoading && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={onGenerate}
                    variant="default"
                    size="lg"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="relative h-24 border border-dashed rounded opacity-20">
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-current" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-current" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-current" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-current" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
