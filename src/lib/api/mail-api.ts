import type {
  Domain,
  Account,
  Email,
  Session,
  PaginatedResponse,
} from '@/types/mail';
import { randFullName } from '@ngneat/falso';

const API_BASE = 'https://api.mail.tm';
const RATE_LIMIT_DELAY = 1000;
const MAX_RETRIES = 3;

class RateLimiter {
  private lastRequest = 0;
  private minDelay: number;

  constructor(minDelay: number) {
    this.minDelay = minDelay;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.minDelay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minDelay - timeSinceLastRequest)
      );
    }

    this.lastRequest = Date.now();
  }
}

const rateLimiter = new RateLimiter(RATE_LIMIT_DELAY);

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  await rateLimiter.wait();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get('Retry-After') || '5',
          10
        );
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData['hydra:description'] ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }

  throw new Error('Max retries exceeded');
}

// Domain endpoints
export async function getDomains(): Promise<Domain[]> {
  const response = await fetchWithRetry<PaginatedResponse<Domain>>(
    `${API_BASE}/domains`
  );
  return response['hydra:member'].filter((d) => d.isActive);
}

export async function getRandomDomain(): Promise<string> {
  const domains = await getDomains();
  if (domains.length === 0) {
    throw new Error('No active domains available');
  }
  return domains[Math.floor(Math.random() * domains.length)].domain;
}

// Account endpoints
export async function createAccount(
  address: string,
  password: string
): Promise<Account> {
  return fetchWithRetry<Account>(`${API_BASE}/accounts`, {
    method: 'POST',
    body: JSON.stringify({ address, password }),
  });
}

export async function getAccount(
  accountId: string,
  token: string
): Promise<Account> {
  return fetchWithRetry<Account>(`${API_BASE}/accounts/${accountId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteAccount(
  accountId: string,
  token: string
): Promise<void> {
  await rateLimiter.wait();
  const response = await fetch(`${API_BASE}/accounts/${accountId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to delete account');
  }
}

// Auth endpoints
export async function login(
  address: string,
  password: string
): Promise<{ token: string; id: string }> {
  return fetchWithRetry<{ token: string; id: string }>(`${API_BASE}/token`, {
    method: 'POST',
    body: JSON.stringify({ address, password }),
  });
}

// Message endpoints
export async function getMessages(token: string): Promise<Email[]> {
  const response = await fetchWithRetry<PaginatedResponse<Email>>(
    `${API_BASE}/messages`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response['hydra:member'];
}

export async function getMessage(
  messageId: string,
  token: string
): Promise<Email> {
  return fetchWithRetry<Email>(`${API_BASE}/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteMessage(
  messageId: string,
  token: string
): Promise<void> {
  await rateLimiter.wait();
  const response = await fetch(`${API_BASE}/messages/${messageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to delete message');
  }
}

export async function markAsRead(
  messageId: string,
  token: string
): Promise<Email> {
  return fetchWithRetry<Email>(`${API_BASE}/messages/${messageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/merge-patch+json',
    },
    body: JSON.stringify({ seen: true }),
  });
}

export async function getMessageSource(
  messageId: string,
  token: string
): Promise<string> {
  await rateLimiter.wait();
  const response = await fetch(`${API_BASE}/sources/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch message source');
  }

  const data = await response.json();
  return data.data;
}

export async function downloadAttachment(
  attachmentId: string,
  token: string
): Promise<Blob> {
  await rateLimiter.wait();
  const response = await fetch(`${API_BASE}/attachments/${attachmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to download attachment');
  }

  return response.blob();
}

// Helper functions
export function generateRandomEmail(domain: string): string {
  const name = randFullName()
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 12);
  const random = Math.random().toString(36).slice(2, 6);
  return `${name}${random}@${domain}`;
}

export function generateRandomPassword(): string {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

// Full registration flow
export async function quickRegister(): Promise<Session> {
  const domain = await getRandomDomain();
  const address = generateRandomEmail(domain);
  const password = generateRandomPassword();

  const account = await createAccount(address, password);
  const { token } = await login(address, password);

  // Token expires in 1 hour
  const expiresAt = Date.now() + 60 * 60 * 1000;

  return {
    token,
    account,
    expiresAt,
  };
}

export async function loginWithCredentials(
  address: string,
  password: string
): Promise<Session> {
  const { token, id } = await login(address, password);
  const account = await getAccount(id, token);

  const expiresAt = Date.now() + 60 * 60 * 1000;

  return {
    token,
    account,
    expiresAt,
  };
}

export async function registerWithCredentials(
  address: string,
  password: string
): Promise<Session> {
  const account = await createAccount(address, password);
  const { token } = await login(address, password);

  const expiresAt = Date.now() + 60 * 60 * 1000;

  return {
    token,
    account,
    expiresAt,
  };
}
