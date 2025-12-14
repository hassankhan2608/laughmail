'use client';

import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Mail, Paperclip } from 'lucide-react';
import type { Email } from '@/types/mail';

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (email: Email) => void;
  isLoading?: boolean;
}

export function EmailList({
  emails,
  selectedId,
  onSelect,
  isLoading,
}: EmailListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2 p-3 rounded-lg border">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Mail className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">No emails yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your inbox is empty. Emails will appear here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {emails.map((email) => (
          <button
            key={email.id}
            onClick={() => onSelect(email)}
            className={cn(
              'w-full text-left p-3 rounded-lg border transition-colors',
              'hover:bg-accent hover:border-accent-foreground/20',
              selectedId === email.id && 'bg-accent border-primary/30',
              !email.seen && 'border-l-2 border-l-primary'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-medium truncate text-sm',
                      !email.seen && 'font-semibold'
                    )}
                  >
                    {email.from.name || email.from.address}
                  </span>
                  {!email.seen && (
                    <Badge variant="default" className="text-xs px-1.5 py-0">
                      New
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    'text-sm truncate mt-0.5',
                    !email.seen ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {email.subject || '(No subject)'}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {email.intro || 'No preview available'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(email.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {email.hasAttachments && (
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
