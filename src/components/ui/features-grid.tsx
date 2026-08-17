'use client';

import { motion } from 'framer-motion';
import { Sparkles, Inbox, Clock, CheckCircle2, Copy } from 'lucide-react';
import { PlusCard } from './plus-card';

export const FeaturesGrid: React.FC = () => {
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

      <div className="max-w-7xl mx-auto px-4 py-24 md:py-32">
        <div className="absolute top-0 left-4 w-3 h-3 border-l border-t border-border" />
        <div className="absolute top-0 right-4 w-3 h-3 border-r border-t border-border" />

        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <h2 className="text-4xl md:text-5xl font-bold">How it works</h2>
            <p className="text-lg text-muted-foreground">
              Simple, fast, and secure temporary email
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 auto-rows-auto gap-4">
            <PlusCard
              title="Instant Generation"
              description="Get a temporary email address instantly with no registration, no sign-up, and no personal information required. Addresses are built from temp.tf's own pool of real provider accounts—Outlook, Hotmail, Gmail and high.edu.pl."
              icon={<Sparkles className="h-8 w-8" />}
              className="lg:col-span-3 lg:row-span-2"
            />
            <PlusCard
              title="Auto Inbox"
              description="Emails appear automatically in your inbox. No refresh needed, no waiting. The inbox polls every 5 seconds, and real Outlook/Gmail delivery means mail actually lands."
              icon={<Inbox className="h-8 w-8" />}
              className="lg:col-span-3 lg:row-span-1"
            />
            <PlusCard
              title="Long-Lived Aliases"
              description="Your plus/dot alias keeps receiving mail as long as the underlying provider account exists—no 60-minute expiry, plenty of time for verifications and sign-ups."
              icon={<Clock className="h-8 w-8" />}
              className="lg:col-span-2 lg:row-span-1"
            />
            <PlusCard
              title="Privacy First"
              description="Only messages for your generated alias are shown. Your real base address is never exposed, no registration, no tracking, no logs."
              icon={<CheckCircle2 className="h-8 w-8" />}
              className="lg:col-span-2 lg:row-span-1"
            />
            <PlusCard
              title="One-Click Copy"
              description="Copy your temporary address to clipboard with a single click. Use it anywhere you need disposable email—recover it later on any device."
              icon={<Copy className="h-8 w-8" />}
              className="lg:col-span-2 lg:row-span-1"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl ml-auto text-right"
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-3">
              Built for privacy. Designed for simplicity.
            </h3>
            <p className="text-muted-foreground text-lg">
              LaughMail gives you disposable email addresses that protect your
              privacy while testing services, signing up for newsletters, or
              avoiding spam. No hassle, no tracking.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
