'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Mail,
  RefreshCw,
  Clock,
  Inbox as InboxIcon,
  ChevronRight,
  Paperclip,
  Download,
  FileText,
} from 'lucide-react';
import type { TempMessage } from '@/types/mail';
import { EmailContent } from '@/components/ui/email-content';
import { attachmentProxyUrl } from '@/lib/api/tf-api';

interface InboxProps {
  emails: TempMessage[];
  address: string;
  onRefresh: () => void;
  onEmailClick: (email: TempMessage) => void;
  onDownloadAttachment: (
    messageId: string,
    attachmentId: string,
    filename: string
  ) => void;
  isRefreshing: boolean;
  nextRefreshIn?: number;
}

export const Inbox: React.FC<InboxProps> = ({
  emails,
  address,
  onRefresh,
  onEmailClick,
  onDownloadAttachment,
  isRefreshing,
  nextRefreshIn,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleEmail = (mail: TempMessage) => {
    const next = selectedId === mail.id ? null : mail.id;
    setSelectedId(next);
    if (next !== null) onEmailClick(mail);
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

      <div className="max-w-7xl mx-auto px-4 pb-16 md:pb-20">
        <div className="absolute top-0 left-4 w-3 h-3 border-l border-t border-border" />
        <div className="absolute top-0 right-4 w-3 h-3 border-r border-t border-border" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6 pt-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <InboxIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border border-primary rounded-full" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Inbox</h2>
                <p className="text-sm text-muted-foreground">
                  {address ? address : 'Generate or recover an address'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-xs">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {isRefreshing
                    ? 'Refreshing...'
                    : nextRefreshIn !== undefined && nextRefreshIn > 0
                      ? `Polling · ${nextRefreshIn}s`
                      : 'Polling'}
                </span>
              </div>

              <Button
                onClick={onRefresh}
                variant="outline"
                size="lg"
                disabled={isRefreshing || !address}
                className="min-h-[44px]"
                aria-label="Refresh inbox"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} sm:mr-2`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-6 left-0 w-2 h-2 border-l border-t border-primary/30" />

            {emails.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 space-y-4 rounded-lg border border-dashed border-muted-foreground/20"
              >
                <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <Mail className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm text-muted-foreground">
                    Emails sent to your address will appear here
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-1 rounded-lg border overflow-hidden">
                <AnimatePresence initial={false}>
                  {emails.map((mail, index) => {
                    const isOpen = selectedId === mail.id;
                    return (
                      <motion.div
                        key={mail.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() => toggleEmail(mail)}
                          className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left hover:bg-muted/30 transition-colors"
                        >
                          <ChevronRight
                            className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{mail.from}</p>
                            <p className="text-sm text-foreground/90 truncate">
                              {mail.subject || '(No subject)'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                            {mail.attachments && mail.attachments.length > 0 && (
                              <span className="flex items-center gap-1 text-primary">
                                <Paperclip className="h-3 w-3" />
                                {mail.attachments.length}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {mail.date
                                ? new Date(mail.date).toLocaleString()
                                : ''}
                            </span>
                          </div>
                        </button>

                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-border/50 bg-muted/5">
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <h3 className="text-lg font-semibold">
                                    {mail.subject || '(No subject)'}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    From: {mail.from} ·{' '}
                                    {mail.date
                                      ? new Date(mail.date).toLocaleString()
                                      : ''}
                                  </p>
                                </div>

                                {mail.attachments && mail.attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-3">
                                    {mail.attachments.map((attachment) =>
                                      attachment.contentType?.startsWith(
                                        'image/'
                                      ) ? (
                                        <a
                                          key={attachment.id}
                                          href={attachmentProxyUrl(
                                            address,
                                            mail.id,
                                            attachment.id
                                          )}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block max-w-[200px]"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={attachmentProxyUrl(
                                              address,
                                              mail.id,
                                              attachment.id
                                            )}
                                            alt="attachment"
                                            className="rounded border border-border h-auto w-full"
                                          />
                                        </a>
                                      ) : (
                                        <Button
                                          key={attachment.id}
                                          variant="outline"
                                          size="sm"
                                          className="gap-2"
                                          onClick={() =>
                                            onDownloadAttachment(
                                              mail.id,
                                              attachment.id,
                                              `attachment-${attachment.id}`
                                            )
                                          }
                                        >
                                          <Download className="h-4 w-4" />
                                          <FileText className="h-4 w-4" />
                                          Attachment
                                        </Button>
                                      )
                                    )}
                                  </div>
                                )}

                                <div className="email-body">
                                  <EmailContent
                                    body={mail.body}
                                    bodyContentType={mail.bodyContentType}
                                    email={address}
                                    messageId={mail.id}
                                    inlineCids={mail.inlineCids}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
