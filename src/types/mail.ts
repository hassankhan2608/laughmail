// temp.tf API Types

export type TempProvider =
  | 'outlook'
  | 'hotmail'
  | 'gmail'
  | 'high.edu.pl';

export interface TempAttachment {
  id: string;
  contentType: string;
}

export interface TempMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  bodyContentType: string; // 'html' | text
  attachments: TempAttachment[];
  inlineCids: Record<string, string>; // cid -> attachmentId
}

export interface TempSession {
  address: string;
}

export interface CheckResult {
  data: TempMessage[];
  totalReceived: number;
}

export interface TempStats {
  totalFormatted: string;
  breakdownFormatted: Record<string, string>;
  totalReceived: number;
  breakdown: Record<string, number>;
}

export interface ApiError {
  error: string;
}

// App State Types
export type EmailStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
  session: TempSession | null;
  emails: TempMessage[];
  emailStatus: EmailStatus;
  selectedEmail: TempMessage | null;
  error: string | null;
}
