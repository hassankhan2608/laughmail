'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Mail,
  RefreshCw,
  Trash2,
  Clock,
  Inbox as InboxIcon,
  ChevronRight,
  Paperclip,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Email } from '@/types/mail';
import { EmailContent } from '@/components/ui/email-content';

interface InboxProps {
  emails: Email[];
  onRefresh: () => void;
  onDelete: (emailId: string) => void;
  onEmailClick: (email: Email) => Promise<void>;
  onDownloadAttachment: (
    attachmentUrl: string,
    filename: string
  ) => Promise<void>;
  isRefreshing: boolean;
  nextRefreshIn?: number;
}

export const Inbox: React.FC<InboxProps> = ({
  emails,
  onRefresh,
  onDelete,
  onEmailClick,
  onDownloadAttachment,
  isRefreshing,
  nextRefreshIn,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  // Update selected email when emails state changes (after fetchFullMessage)
  useEffect(() => {
    if (selectedEmail) {
      const updatedEmail = emails.find((e) => e.id === selectedEmail.id);
      if (
        updatedEmail &&
        updatedEmail.attachments &&
        !selectedEmail.attachments
      ) {
        setSelectedEmail(updatedEmail);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emails]);

  const handleEmailClick = async (mail: Email) => {
    setSelectedEmail(mail);
    setShowMobilePreview(true);

    // Fetch full message details including attachments
    if (!mail.attachments) {
      setIsLoadingMessage(true);
      await onEmailClick(mail);
      setIsLoadingMessage(false);
    }
  };

  const handleBackToList = () => {
    setShowMobilePreview(false);
  };

  const handleDelete = (emailId: string) => {
    onDelete(emailId);
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
      setShowMobilePreview(false);
    }
  };

  const unreadCount = emails.filter((e) => !e.seen).length;

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
                  {unreadCount > 0 &&
                    `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Status Badge */}
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
                disabled={isRefreshing}
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

          <div className="grid lg:grid-cols-5 gap-6 relative">
            <div className="hidden lg:block absolute left-[40%] top-0 bottom-0 w-px bg-border" />

            <div
              className={`lg:col-span-2 relative ${showMobilePreview ? 'hidden lg:block' : 'block'}`}
            >
              <div className="absolute -top-6 left-0 w-2 h-2 border-l border-t border-primary/30" />

              <div className="h-[600px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <AnimatePresence mode="popLayout">
                  {emails.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12 space-y-4"
                    >
                      <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                        <Mail className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="font-medium">No emails yet</p>
                        <p className="text-sm text-muted-foreground">
                          Emails sent to your address will appear here
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    emails.map((mail, index) => (
                      <motion.div
                        key={mail.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`p-4 cursor-pointer hover:border-primary/50 transition-all ${
                            selectedEmail?.id === mail.id
                              ? 'border-primary bg-primary/5'
                              : ''
                          } ${!mail.seen ? 'bg-card' : 'bg-card/50'}`}
                          onClick={() => handleEmailClick(mail)}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">
                                    {mail.from.address}
                                  </p>
                                  {!mail.seen && (
                                    <Badge
                                      variant="default"
                                      className="h-5 px-1.5"
                                    >
                                      <span className="text-xs">New</span>
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-foreground/90 truncate mt-1">
                                  {mail.subject}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(mail.createdAt).toLocaleTimeString()}
                              </div>
                              {mail.hasAttachments && (
                                <div className="flex items-center gap-1 text-primary">
                                  <Paperclip className="h-3 w-3" />
                                  <span>Attachment</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div
              className={`lg:col-span-3 relative ${showMobilePreview ? 'block' : 'hidden lg:block'}`}
            >
              <div className="absolute -top-6 right-0 w-2 h-2 border-r border-t border-primary/30" />

              <AnimatePresence mode="wait">
                {selectedEmail ? (
                  <motion.div
                    key={selectedEmail.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="relative h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                  >
                    <div className="border rounded-lg p-6 md:p-8 space-y-6 bg-muted/5 mr-2">
                      {/* Loading overlay for message fetch */}
                      {isLoadingMessage && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                          <div className="flex flex-col items-center gap-3">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                              Loading message details...
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-border" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-border" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-border" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-border" />

                      <Button
                        onClick={handleBackToList}
                        variant="ghost"
                        size="sm"
                        className="lg:hidden mb-4"
                      >
                        <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                        Back to Inbox
                      </Button>

                      <div className="space-y-4 border-b pb-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <h3 className="text-xl md:text-2xl font-semibold">
                              {selectedEmail.subject}
                            </h3>
                            <p className="text-sm md:text-base text-muted-foreground">
                              From: {selectedEmail.from.address}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleDelete(selectedEmail.id)}
                              variant="ghost"
                              size="icon"
                              title="Delete email"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(selectedEmail.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="prose prose-neutral dark:prose-invert max-w-none">
                        <EmailContent
                          html={selectedEmail.html}
                          text={selectedEmail.text}
                          intro={selectedEmail.intro}
                        />
                      </div>

                      {selectedEmail.attachments &&
                        selectedEmail.attachments.length > 0 && (
                          <div className="space-y-3 pt-4 border-t">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Paperclip className="h-4 w-4" />
                              <span>
                                Attachments ({selectedEmail.attachments.length})
                              </span>
                            </div>
                            <div className="space-y-2">
                              {selectedEmail.attachments.map((attachment) => (
                                <Card
                                  key={attachment.id}
                                  className="p-3 flex items-center justify-between gap-3 hover:border-primary/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-2 rounded bg-primary/10">
                                      <Paperclip className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {attachment.filename}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {(attachment.size / 1024).toFixed(2)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-shrink-0"
                                    onClick={() =>
                                      onDownloadAttachment(
                                        attachment.downloadUrl,
                                        attachment.filename
                                      )
                                    }
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative h-full min-h-[400px] rounded-lg border border-dashed border-muted-foreground/20 lg:flex items-center justify-center hidden"
                  >
                    <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-current opacity-50" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-current opacity-50" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-current opacity-50" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-current opacity-50" />

                    <div className="text-center space-y-2">
                      <Mail className="h-16 w-16 text-muted-foreground/40 mx-auto" />
                      <p className="text-muted-foreground">
                        Select an email to view
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
