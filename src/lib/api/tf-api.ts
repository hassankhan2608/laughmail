import type {
  CheckResult,
  TempProvider,
  TempStats,
} from '@/types/mail';

const TF_API = '/api/tf';

const VALID_PROVIDERS: TempProvider[] = ['outlook', 'hotmail', 'gmail', 'high.edu.pl'];

export function buildAccountQuery(
  providers: TempProvider[],
  dot: boolean,
  plus: boolean
): string {
  const list = providers.length > 0 ? providers : VALID_PROVIDERS;
  return `providers=${encodeURIComponent(list.join(','))}&dot=${dot ? '1' : '0'}&plus=${plus ? '1' : '0'}`;
}

export async function generateAddress(
  providers: TempProvider[],
  dot: boolean,
  plus: boolean
): Promise<string> {
  const res = await fetch(`${TF_API}/account?${buildAccountQuery(providers, dot, plus)}`);
  return handleResponse<string>(res, (data) => {
    if (typeof data.email !== 'string') throw new Error('Invalid response from server');
    return data.email.trim().toLowerCase();
  });
}

export async function checkInbox(email: string): Promise<CheckResult> {
  const res = await fetch(`${TF_API}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return {
    data: Array.isArray(data.data) ? data.data : [],
    totalReceived: typeof data.totalReceived === 'number' ? data.totalReceived : 0,
  };
}

export async function fetchStats(
  providers: TempProvider[],
  dot: boolean,
  plus: boolean
): Promise<TempStats> {
  const res = await fetch(`${TF_API}/stats?${buildAccountQuery(providers, dot, plus)}`);
  return handleResponse<TempStats>(res, (data) => data as unknown as TempStats);
}

export function attachmentProxyUrl(
  email: string,
  messageId: string,
  attachmentId: string
): string {
  const params = new URLSearchParams({ email, messageId, attachmentId });
  return `${TF_API}/attachment?${params.toString()}`;
}

export function isValidTempAddress(email: string): boolean {
  const at = email.indexOf('@');
  if (at <= 0 || at === email.length - 1) return false;
  const local = email.slice(0, at).toLowerCase();
  const domain = email.slice(at).toLowerCase();
  if (domain === '@high.edu.pl') return true;
  const hasPlus = local.includes('+');
  const hasDot = local.includes('.');
  if (domain === '@gmail.com') return hasPlus || hasDot;
  if (domain.includes('outlook.') || domain.includes('hotmail.')) return hasPlus;
  return hasPlus || hasDot;
}

async function handleResponse<T>(
  res: Response,
  parse: (data: Record<string, unknown>) => T
): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return parse(data);
}
