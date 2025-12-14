'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmailContent } from '@/components/ui/email-content';
import { ArrowLeft, Trash2, Download, Code, Paperclip, X } from 'lucide-react';
import type { Email } from '@/types/mail';

interface EmailViewerProps {
  email: Email;
  onBack: () => void;
  onDelete: (id: string) => void;
  onDownloadAttachment: (id: string, filename: string) => void;
  onGetSource: (id: string) => Promise<string>;
}

export function EmailViewer({
  email,
  onBack,
  onDelete,
  onDownloadAttachment,
  onGetSource,
}: EmailViewerProps) {
  const [showSource, setShowSource] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);

  const handleShowSource = async () => {
    if (source) {
      setShowSource(!showSource);
      return;
    }

    setLoadingSource(true);
    try {
      const src = await onGetSource(email.id);
      setSource(src);
      setShowSource(true);
    } catch {
      // Error handled by parent
    } finally {
      setLoadingSource(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">
            {email.subject || '(No subject)'}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShowSource}
            disabled={loadingSource}
            title="View source"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(email.id)}
            className="text-destructive hover:text-destructive"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Email metadata */}
      <div className="p-4 border-b shrink-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {email.from.name || email.from.address}
          </span>
          {email.from.name && (
            <span className="text-sm text-muted-foreground">
              &lt;{email.from.address}&gt;
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>To: {email.to.map((t) => t.address).join(', ')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{format(new Date(email.createdAt), 'PPpp')}</span>
          {email.hasAttachments && (
            <Badge variant="secondary" className="text-xs">
              <Paperclip className="h-3 w-3 mr-1" />
              {email.attachments?.length || 0} attachment(s)
            </Badge>
          )}
        </div>
      </div>

      {/* Attachments */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="p-3 border-b shrink-0">
          <div className="flex flex-wrap gap-2">
            {email.attachments.map((attachment) => (
              <Button
                key={attachment.id}
                variant="outline"
                size="sm"
                onClick={() =>
                  onDownloadAttachment(attachment.id, attachment.filename)
                }
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                {attachment.filename}
                <span className="ml-1 text-muted-foreground">
                  ({Math.round(attachment.size / 1024)}KB)
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        {showSource && source ? (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSource(false)}
              className="absolute top-2 right-2 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all bg-muted/50">
              {source}
            </pre>
          </div>
        ) : email.html && email.html.length > 0 ? (
          <div className="p-4">
            <EmailContent html={email.html} text={email.text} />
          </div>
        ) : (
          <div className="p-4">
            <EmailContent text={email.text || 'No content available'} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
