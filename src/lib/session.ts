import type { TempSession } from '@/types/mail';

const SESSION_KEY = 'laughmail_address';

export function saveSession(session: TempSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): TempSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session: TempSession = JSON.parse(stored);
    if (typeof session?.address !== 'string' || !session.address) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function isSessionValid(session: TempSession | null): boolean {
  return !!session && typeof session.address === 'string' && session.address.length > 0;
}
