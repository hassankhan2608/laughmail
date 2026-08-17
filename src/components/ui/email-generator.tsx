'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Mail,
  Copy,
  CheckCircle2,
  RefreshCw,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import type { TempProvider } from '@/types/mail';

gsap.registerPlugin(ScrambleTextPlugin);

interface EmailGeneratorProps {
  email: string;
  onCopy: () => void;
  onGenerate: (providers: TempProvider[], dot: boolean, plus: boolean) => void;
  onRecover: (address: string) => void;
  copied: boolean;
  isLoading: boolean;
  errorMessage?: string;
}

const PROVIDERS: TempProvider[] = ['outlook', 'hotmail', 'gmail', 'high.edu.pl'];

export const EmailGenerator: React.FC<EmailGeneratorProps> = ({
  email,
  onCopy,
  onGenerate,
  onRecover,
  copied,
  isLoading,
  errorMessage,
}) => {
  const emailRef = useRef<HTMLElement>(null);
  const prevEmailRef = useRef<string>(email);
  const [providers, setProviders] = useState<TempProvider[]>(PROVIDERS);
  const [dot, setDot] = useState(true);
  const [plus, setPlus] = useState(true);
  const [recoverValue, setRecoverValue] = useState('');

  useEffect(() => {
    if (emailRef.current) {
      if (isLoading && !email) {
        const loadingText = 'Generating Email';
        emailRef.current.textContent = loadingText;
        gsap.to(emailRef.current, {
          duration: 0.8,
          scrambleText: { text: loadingText, chars: '.:', speed: 0.5 },
          ease: 'none',
          repeat: -1,
          repeatDelay: 0,
        });
      } else if (email && email !== prevEmailRef.current) {
        gsap.killTweensOf(emailRef.current);
        gsap.to(emailRef.current, {
          duration: 1.2,
          scrambleText: { text: email, chars: '.:', speed: 0.5 },
          ease: 'none',
        });
        prevEmailRef.current = email;
      }
    }
  }, [email, isLoading]);

  const toggleProvider = (p: TempProvider) => {
    setProviders((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = () => {
    if (providers.length === 0) return;
    onGenerate(providers, dot, plus);
  };

  const handleRecover = () => {
    const value = recoverValue.trim().toLowerCase();
    if (!value) return;
    onRecover(value);
  };

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
              Real Outlook, Hotmail &amp; Gmail delivery. No registration.
            </p>
          </div>

          {/* Provider selection */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-3">PROVIDERS</p>
            <div className="flex flex-wrap justify-center gap-2">
              {PROVIDERS.map((p) => {
                const active = providers.includes(p);
                return (
                  <Badge
                    key={p}
                    variant={active ? 'default' : 'outline'}
                    className="cursor-pointer select-none px-3 py-1.5 text-sm capitalize"
                    onClick={() => toggleProvider(p)}
                  >
                    {p === 'high.edu.pl' ? 'high.edu.pl' : p}
                  </Badge>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={dot} onCheckedChange={setDot} />
                Dot
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={plus} onCheckedChange={setPlus} />
                Plus
              </label>
            </div>
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
                    : email || 'Generate an address to get started'}
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

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={onCopy}
                  size="lg"
                  className="flex-1 min-w-[140px]"
                  disabled={!email || isLoading}
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
                  onClick={handleGenerate}
                  variant="outline"
                  size="lg"
                  className="flex-1 min-w-[140px]"
                  disabled={isLoading || providers.length === 0}
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

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border/50">
                <Input
                  value={recoverValue}
                  onChange={(e) => setRecoverValue(e.target.value)}
                  placeholder="Recover a previous address (name+alias@outlook.com)"
                  className="flex-1 font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleRecover()}
                />
                <Button
                  onClick={handleRecover}
                  variant="ghost"
                  className="gap-2"
                  disabled={isLoading || !recoverValue.trim()}
                >
                  <RotateCcw className="h-4 w-4" />
                  Recover Address
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
