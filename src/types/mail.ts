// Mail.tm API Types

export interface Domain {
  id: string;
  domain: string;
  isActive: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  address: string;
  quota: number;
  used: number;
  isDisabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAddress {
  address: string;
  name: string;
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  disposition: string;
  transferEncoding: string;
  related: boolean;
  size: number;
  downloadUrl: string;
}

export interface Email {
  id: string;
  accountId: string;
  msgid: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  intro: string;
  seen: boolean;
  isDeleted: boolean;
  hasAttachments: boolean;
  size: number;
  downloadUrl: string;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
  // Full email content (fetched separately)
  text?: string;
  html?: string[];
  attachments?: Attachment[];
}

export interface Session {
  token: string;
  account: Account;
  expiresAt: number;
}

export interface ApiError {
  code: number;
  message: string;
}

export interface PaginatedResponse<T> {
  'hydra:member': T[];
  'hydra:totalItems': number;
}

// App State Types
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';
export type EmailStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
  session: Session | null;
  authStatus: AuthStatus;
  emails: Email[];
  emailStatus: EmailStatus;
  selectedEmail: Email | null;
  error: string | null;
}
