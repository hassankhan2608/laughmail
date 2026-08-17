# temp.tf Backend Migration Implementation Plan

> **For AI agent workers:** Required subs kill: use subagent-driven-development (recommended) or executing-plans to implement task-by-task. Steps use checkboxes (`- [ ]`).

**Goal:** Replace the Mail.tm backend with temp.tf's public API (no-registration plus/dot alias addresses on real providers), keeping LaughMail's pure-black/Kode Mono aesthetic, with last-used-address persistence and auto-recover on load.

**Architecture:** 4 Next.js server-side proxy routes (`/api/tf/*`) forward browser requests to `https://temp.tf/api/*` because temp.tf sends no CORS headers. A new client library (`tf-api.ts`), reworked hook, and adapted EmailGenerator/Inbox/EmailContent/pages consume them. All auth/account UI is deleted (no temp.tf equivalent).

**Tech stack:** Next.js 16 App Router route handlers, TypeScript, existing Tailwind/shadcn/GSAP/Framer Motion/Sonner.

**Spec:** `docs/superpowers/specs/2026-08-17-temptf-backend-design.md`

**temp.tf API contract (verified live 2026-08-17):**
- `GET /api/account?providers=outlook,hotmail,gmail,high.edu.pl&dot=0|1&plus=0|1` → `{email:"name+alias@outlook.com"}`
- `POST /api/check` body `{"email":"..."}` → `{data: TempMessage[], totalReceived: number}`; foreign address → 403 `{error:"Forbidden"}`
- `GET /api/stats?providers=...&dot=...&plus=...` → `{totalFormatted, breakdownFormatted, totalReceived, breakdown}`
- `GET /api/attachment?email=&messageId=&attachmentId=` → binary blob (image/pdf viewable, Content-Disposition attachment)
- `TempMessage`: `{id, subject, from, date, body, bodyContentType: "html"|other, attachments:[{id,contentType}], inlineCids:{cid:attachmentId}}`
- Errors: JSON `{error}`; 429 has `Retry-After`; client retries 5xx once after 800ms.

**Address validation rule (from temp.tf client):** local part before `@`; `@high.edu.pl` → always OK (server blacklist); `@gmail.com` → must contain `+` or `.`; contains `outlook.`/`hotmail.` → must contain `+`; other → must contain `+` or `.`.

---

## File map

**Create:**
- `src/app/api/tf/account/route.ts` — GET proxy → `/api/account`
- `src/app/api/tf/check/route.ts` — POST proxy → `/api/check` (+ validation)
- `src/app/api/tf/stats/route.ts` — GET proxy → `/api/stats`
- `src/app/api/tf/attachment/route.ts` — GET proxy → `/api/attachment`
- `src/lib/api/tf-api.ts` — client library (generateAddress, checkInbox, fetchStats, attachmentProxyUrl, isValidTempAddress, buildAccountQuery)

**Rewrite:**
- `src/types/mail.ts` — TempProvider/TempMessage/TempAttachment/TempSession/TempStats/CheckResult; drop Mail.tm types
- `src/lib/session.ts` — TempSession `{address}` shape, no expiry
- `src/hooks/use-mail-session.ts` — address-only state, auto-recover, generate/recover/refresh, 5s polling
- `src/components/ui/email-generator.tsx` — provider toggles + dot/plus switches + recover input + copy/new address
- `src/components/ui/email-content.tsx` — `body`/`bodyContentType`/`inlineCids` props, cid→proxy rewrite, `[image:]` text rewrite
- `src/components/ui/inbox.tsx` — inline expand, string `from`/`date`, proxy attachments, no delete
- `src/app/page.tsx` — remove auth UI, always-visible generator/inbox, stats footer
- `src/components/ui/features-grid.tsx` — accurate copy (provider-lifetime, real Outlook/Gmail)

**Delete (after verification no remaining imports):**
- `src/components/auth/login-modal.tsx`, `signup-modal.tsx`
- `src/components/layout/account-menu.tsx`
- `src/components/ui/settings-dialog.tsx`, `responsive-modal.tsx`, `user-profile-dropdown.tsx`
- `src/components/email/email-viewer.tsx`, `email-list.tsx`
- `src/lib/api/mail-api.ts`
- `src/hooks/use-mobile.tsx`
- Orphaned primitives (only referenced by deleted files — verify with grep first): `ui/progress.tsx`, `ui/select.tsx`, `ui/scroll-area.tsx`, `ui/skeleton.tsx`, `ui/dialog.tsx`, `ui/drawer.tsx`, `ui/avatar.tsx`, `ui/dropdown-menu.tsx`, `ui/label.tsx`, `ui/separator.tsx`, `ui/tabs.tsx` (keep `ui/switch.tsx` — used for Dot/Plus toggles; keep `ui/input.tsx` — used by the reworked EmailGenerator recover field)

**Prune `package.json`** (verify nothing imports these after deletions): `@ngneat/falso`, `@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-progress`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-tabs`, `vaul`, `next-themes` (unused now; verify). Keep `@radix-ui/react-switch` + `@radix-ui/react-slot`.

---

### Task 1: Types — rewrite `src/types/mail.ts`

**Files:** `src/types/mail.ts`, `src/types/index.ts`

- [ ] **Step 1: Replace file contents**

```ts
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
```

`src/types/index.ts` keeps `export * from './mail';` — unchanged.

- [ ] **Step 2: Verify**

Run: `bunx tsc --noEmit`
Expect: no errors mentioning `mail.ts` (old names may error until Task 4 — acceptable if only in soon-rewritten files).

- [ ] **Step 3: Commit**

```bash
git add src/types/mail.ts src/types/index.ts
git commit -m "refactor: replace Mail.tm types with temp.tf types"
```

---

### Task 2: Proxy routes — `/api/tf/*`

**Files:** create `src/app/api/tf/account/route.ts`, `src/app/api/tf/check/route.ts`, `src/app/api/tf/stats/route.ts`, `src/app/api/tf/attachment/route.ts`

- [ ] **Step 1: Create `src/app/api/tf/account/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TF_BASE = 'https://temp.tf/api';

const VALID_PROVIDERS = ['outlook', 'hotmail', 'gmail', 'high.edu.pl'];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const providers = (searchParams.get('providers') ?? VALID_PROVIDERS.join(','))
    .split(',')
    .filter((p) => VALID_PROVIDERS.includes(p as never));
  const dot = searchParams.get('dot') === '1' ? '1' : '0';
  const plus = searchParams.get('plus') === '1' ? '1' : '0';

  try {
    const res = await fetch(
      `${TF_BASE}/account?providers=${encodeURIComponent(providers.join(','))}&dot=${dot}&plus=${plus}`,
      { cache: 'no-store', headers: { Accept: 'application/json' } }
    );
    const body = await res.text();
    const headers: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store',
    };
    const retryAfter = res.headers.get('retry-after');
    if (retryAfter) headers['Retry-After'] = retryAfter;
    return new NextResponse(body, { status: res.status, headers });
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 });
  }
}
```

- [ ] **Step 2: Create `src/app/api/tf/check/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TF_BASE = 'https://temp.tf/api';

function isValidTempAddress(email: string): boolean {
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

export async function POST(request: NextRequest) {
  let email: string;
  try {
    const body = await request.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });
  if (!isValidTempAddress(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const res = await fetch(`${TF_BASE}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });
    const body = await res.text();
    const headers: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store',
    };
    const retryAfter = res.headers.get('retry-after');
    if (retryAfter) headers['Retry-After'] = retryAfter;
    return new NextResponse(body, { status: res.status, headers });
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 });
  }
}
```

Note: `isValidTempAddress` intentionally lives in both proxy (server) and `tf-api.ts` (client) — proxy rejects invalid addresses before hitting upstream; client gives instant UX.

- [ ] **Step 3: Create `src/app/api/tf/stats/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TF_BASE = 'https://temp.tf/api';

const VALID_PROVIDERS = ['outlook', 'hotmail', 'gmail', 'high.edu.pl'];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const providers = (searchParams.get('providers') ?? VALID_PROVIDERS.join(','))
    .split(',')
    .filter((p) => VALID_PROVIDERS.includes(p as never));
  const dot = searchParams.get('dot') === '1' ? '1' : '0';
  const plus = searchParams.get('plus') === '1' ? '1' : '0';

  try {
    const res = await fetch(
      `${TF_BASE}/stats?providers=${encodeURIComponent(providers.join(','))}&dot=${dot}&plus=${plus}`,
      { cache: 'no-store', headers: { Accept: 'application/json' } }
    );
    const body = await res.text();
    const headers: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store',
    };
    const retryAfter = res.headers.get('retry-after');
    if (retryAfter) headers['Retry-After'] = retryAfter;
    return new NextResponse(body, { status: res.status, headers });
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 });
  }
}
```

- [ ] **Step 4: Create `src/app/api/tf/attachment/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TF_BASE = 'https://temp.tf/api';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const email = searchParams.get('email') ?? '';
  const messageId = searchParams.get('messageId') ?? '';
  const attachmentId = searchParams.get('attachmentId') ?? '';
  if (!email || !messageId || !attachmentId) {
    return NextResponse.json(
      { error: 'email, messageId, attachmentId are required' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${TF_BASE}/attachment?email=${encodeURIComponent(email)}&messageId=${encodeURIComponent(messageId)}&attachmentId=${encodeURIComponent(attachmentId)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) {
      const body = await res.text();
      return new NextResponse(body, { status: res.status, headers: { 'Cache-Control': 'no-store' } });
    }
    const buf = await res.arrayBuffer();
    const headers: Record<string, string> = {
      'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
      'Content-Disposition': res.headers.get('content-disposition') ?? 'attachment',
      'Cache-Control': 'no-store',
    };
    return new NextResponse(Buffer.from(buf), { status: 200, headers });
  } catch {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 });
  }
}
```

- [ ] **Step 5: Have Next compile the routes**

Run: `bun run dev` (leave running), then:

```bash
curl -s "http://localhost:3000/api/tf/account?providers=outlook&dot=0&plus=1"
curl -s -X POST "http://localhost:3000/api/tf/check" -H "Content-Type: application/json" -d '{"email":"foo@bar.com"}'
curl -s "http://localhost:3000/api/tf/stats?providers=outlook&dot=0&plus=1"
curl -s "http://localhost:3000/api/tf/attachment?email=x&messageId=y&attachmentId=z"
```

Expect: account returns `{"email":"...@outlook.com"}`; check on foreign address returns 403 `{"error":"Forbidden"}`; stats returns numbers; bad attachment returns 400 JSON.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/tf
git commit -m "feat: add temp.tf proxy API routes"
```

---

### Task 3: Client library + session persistence

**Files:** create `src/lib/api/tf-api.ts`, rewrite `src/lib/session.ts`

- [ ] **Step 1: Create `src/lib/api/tf-api.ts`**

```ts
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
  return handleResponse<TempStats>(res, (data) => data);
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
```

- [ ] **Step 2: Rewrite `src/lib/session.ts`**

```ts
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
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/tf-api.ts src/lib/session.ts
git commit -m "feat: add temp.tf client library and address persistence"
```

---

### Task 4: Rework `use-mail-session.ts`

**Files:** `src/hooks/use-mail-session.ts`

- [ ] **Step 1: Replace file contents**

```ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TempMessage, TempProvider, TempSession } from '@/types/mail';
import {
  checkInbox,
  generateAddress,
  attachmentProxyUrl,
} from '@/lib/api/tf-api';
import {
  saveSession,
  getSession,
  clearSession,
  isSessionValid,
} from '@/lib/session';
import { toast } from 'sonner';

const POLLING_INTERVAL = 5000; // 5 seconds

export function useMailSession() {
  const [session, setSession] = useState<TempSession | null>(null);
  const [emails, setEmails] = useState<TempMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<TempMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-recover last used address on load
  useEffect(() => {
    const stored = getSession();
    if (stored && isSessionValid(stored)) {
      setSession(stored);
      checkInbox(stored.address)
        .then((result) => {
          setEmails(result.data);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch inbox');
        });
    }
    setIsLoading(false);
  }, []);

  const fetchEmails = useCallback(async () => {
    if (!session?.address) return;

    try {
      const result = await checkInbox(session.address);
      setEmails(result.data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch emails';
      setError(message);
    }
  }, [session?.address]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    setIsPolling(true);
    fetchEmails();
    pollingRef.current = setInterval(fetchEmails, POLLING_INTERVAL);
  }, [fetchEmails]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (session?.address) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [session?.address, startPolling, stopPolling]);

  const handleGenerate = useCallback(
    async (providers: TempProvider[], dot: boolean, plus: boolean) => {
      setIsLoading(true);
      setError(null);
      try {
        const address = await generateAddress(providers, dot, plus);
        const newSession: TempSession = { address };
        setSession(newSession);
        saveSession(newSession);
        setEmails([]);
        setSelectedEmail(null);
        toast.success('Email created successfully!');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create email';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleRecover = useCallback(async (address: string) => {
    if (!address) {
      setError('Enter an address.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkInbox(address);
      const newSession: TempSession = { address };
      setSession(newSession);
      saveSession(newSession);
      setEmails(result.data);
      setSelectedEmail(null);
      toast.success('Address recovered');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to recover address';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectEmail = useCallback((email: TempMessage) => {
    setSelectedEmail(email);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchEmails();
    toast.success('Inbox refreshed');
  }, [fetchEmails]);

  const handleDownloadAttachment = useCallback(
    async (messageId: string, attachmentId: string, filename: string) => {
      if (!session?.address) return;
      try {
        const res = await fetch(
          attachmentProxyUrl(session.address, messageId, attachmentId)
        );
        if (!res.ok) throw new Error('Failed to download attachment');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'attachment';
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to download attachment';
        toast.error(message);
      }
    },
    [session?.address]
  );

  const handleClearSelected = useCallback(() => setSelectedEmail(null), []);

  return {
    session,
    emails,
    selectedEmail,
    isLoading,
    isPolling,
    error,
    isAuthenticated: isSessionValid(session),

    generate: handleGenerate,
    recover: handleRecover,
    selectEmail: handleSelectEmail,
    refresh: handleRefresh,
    downloadAttachment: handleDownloadAttachment,
    clearSelectedEmail: handleClearSelected,
  };
}
```

- [ ] **Step 2: Verify**

Run: `bunx tsc --noEmit`
Expect: only the not-yet-updated consumer errors (email-generator/inbox/page) — none in `hooks/`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-mail-session.ts
git commit -m "feat: rework session hook for temp.tf with auto-recover"
```

---

### Task 5: EmailGenerator — providers, syntax toggles, recover

**Files:** `src/components/ui/email-generator.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Mail,
  Copy,
  CheckCircle2,
  RefreshCw,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import type { TempProvider } from '@/types/mail';

gsap.registerPlugin(ScrambleTextPlugin);

interface EmailGeneratorProps {
  email: string;
  onCopy: () => void;
  onGenerate: (providers: TempProvider[], dot: boolean, plus: boolean) => void;
  onRecover: (address: string) => void;
  copied: boolean;
  isLoading: boolean;
  errorMessage?: string;
}

const PROVIDERS: TempProvider[] = ['outlook', 'hotmail', 'gmail', 'high.edu.pl'];

export const EmailGenerator: React.FC<EmailGeneratorProps> = ({
  email,
  onCopy,
  onGenerate,
  onRecover,
  copied,
  isLoading,
  errorMessage,
}) => {
  const emailRef = useRef<HTMLElement>(null);
  const prevEmailRef = useRef<string>(email);
  const [providers, setProviders] = useState<TempProvider[]>(PROVIDERS);
  const [dot, setDot] = useState(true);
  const [plus, setPlus] = useState(true);
  const [recoverValue, setRecoverValue] = useState('');

  useEffect(() => {
    if (emailRef.current) {
      if (isLoading && !email) {
        const loadingText = 'Generating Email';
        emailRef.current.textContent = loadingText;
        gsap.to(emailRef.current, {
          duration: 0.8,
          scrambleText: { text: loadingText, chars: '.:', speed: 0.5 },
          ease: 'none',
          repeat: -1,
          repeatDelay: 0,
        });
      } else if (email && email !== prevEmailRef.current) {
        gsap.killTweensOf(emailRef.current);
        gsap.to(emailRef.current, {
          duration: 1.2,
          scrambleText: { text: email, chars: '.:', speed: 0.5 },
          ease: 'none',
        });
        prevEmailRef.current = email;
      }
    }
  }, [email, isLoading]);

  const toggleProvider = (p: TempProvider) => {
    setProviders((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = () => {
    if (providers.length === 0) return;
    onGenerate(providers, dot, plus);
  };

  const handleRecover = () => {
    const value = recoverValue.trim().toLowerCase();
    if (!value) return;
    onRecover(value);
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

      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="absolute top-0 left-4 w-3 h-3 border-l border-t border-border" />
        <div className="absolute top-0 right-4 w-3 h-3 border-r border-t border-border" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="text-center space-y-1">
            <h2 className="text-3xl font-semibold">Your Temporary Address</h2>
            <p className="text-sm text-muted-foreground">
              Real Outlook, Hotmail &amp; Gmail delivery. No registration.
            </p>
          </div>

          {/* Provider selection */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-3">PROVIDERS</p>
            <div className="flex flex-wrap justify-center gap-2">
              {PROVIDERS.map((p) => {
                const active = providers.includes(p);
                return (
                  <Badge
                    key={p}
                    variant={active ? 'default' : 'outline'}
                    className="cursor-pointer select-none px-3 py-1.5 text-sm capitalize"
                    onClick={() => toggleProvider(p)}
                  >
                    {p === 'high.edu.pl' ? 'high.edu.pl' : p}
                  </Badge>
                );
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={dot} onCheckedChange={setDot} />
                Dot
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={plus} onCheckedChange={setPlus} />
                Plus
              </label>
            </div>
          </div>

          <div className="relative border rounded-lg p-6 bg-muted/5">
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-primary/50" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-primary/50" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-primary/50" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-primary/50" />

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded border bg-background/50">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <code ref={emailRef} className="text-base md:text-lg font-mono flex-1 break-all">
                  {isLoading
                    ? 'Generating Email'
                    : email || 'Generate an address to get started'}
                </code>
              </div>

              {errorMessage && !isLoading && (
                <div className="p-3 rounded border border-destructive/50 bg-destructive/10">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <span className="text-destructive">⚠</span>
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={onCopy}
                  size="lg"
                  className="flex-1 min-w-[140px]"
                  disabled={!email || isLoading}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Address
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleGenerate}
                  variant="outline"
                  size="lg"
                  className="flex-1 min-w-[140px]"
                  disabled={isLoading || providers.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      New Address
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border/50">
                <Input
                  value={recoverValue}
                  onChange={(e) => setRecoverValue(e.target.value)}
                  placeholder="Recover a previous address (name+alias@outlook.com)"
                  className="flex-1 font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleRecover()}
                />
                <Button
                  onClick={handleRecover}
                  variant="ghost"
                  className="gap-2"
                  disabled={isLoading || !recoverValue.trim()}
                >
                  <RotateCcw className="h-4 w-4" />
                  Recover Address
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
```

Note: `Input` (`ui/input.tsx`) is kept — it is only used by deleted modals today, but the recover field above needs it. `Switch` (`ui/switch.tsx`) also kept for the Dot/Plus toggles.

- [ ] **Step 2: Verify**

Run: `bunx tsc --noEmit`
Expect: this file passes; remaining errors only in inbox/page (fixed next).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/email-generator.tsx
git commit -m "feat: add provider/syntax toggles and address recovery to generator"
```

---

### Task 6: EmailContent — body/bodyContentType/inlineCids

**Files:** `src/components/ui/email-content.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { attachmentProxyUrl } from '@/lib/api/tf-api';

interface EmailContentProps {
  body?: string;
  bodyContentType?: string;
  email?: string;
  messageId?: string;
  inlineCids?: Record<string, string>;
}

/**
 * Renders temp.tf email body safely.
 * - HTML: cid: sources rewritten to /api/tf/attachment proxy URLs, DOMPurify sanitized
 * - Text: `[image: N]` tokens replaced with inline proxy images
 */
export function EmailContent({
  body,
  bodyContentType,
  email,
  messageId,
  inlineCids,
}: EmailContentProps) {
  const isHtml = bodyContentType === 'html';

  const sanitizedHtml = useMemo(() => {
    if (!body || !isHtml) return null;

    let rawHtml = body;
    // Rewrite cid: image sources to proxy URLs
    if (email && messageId && inlineCids && Object.keys(inlineCids).length > 0) {
      rawHtml = rawHtml.replace(/src=["']cid:([^"'>\s]+)["']/gi, (_match, cid: string) => {
        const cleaned = cid.trim().replace(/^<|>$/g, '');
        const attachmentId = inlineCids[cleaned];
        if (!attachmentId) {
          return 'src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'/%3E"';
        }
        return `src="${attachmentProxyUrl(email, messageId, attachmentId)}"`;
      });
    }

    const clean = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'a', 'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'div', 'span',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'dl', 'dt',
        'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'img',
        'figure', 'figcaption', 'blockquote', 'pre', 'code', 'hr', 'sub',
        'sup', 'small', 'mark', 'address', 'article', 'section', 'header',
        'footer', 'center', 'font',
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'width', 'height', 'style', 'class',
        'id', 'target', 'rel', 'colspan', 'rowspan', 'cellpadding',
        'cellspacing', 'border', 'align', 'valign', 'bgcolor', 'color',
        'face', 'size',
      ],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target', 'rel'],
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, 'text/html');
    doc.querySelectorAll('a').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
    doc.querySelectorAll('img').forEach((img) => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    });
    return doc.body.innerHTML;
  }, [body, isHtml, email, messageId, inlineCids]);

  const textContent = useMemo(() => {
    if (!body || isHtml) return null;
    if (!email || !messageId || !inlineCids || Object.keys(inlineCids).length === 0) {
      return body;
    }
    const attachmentIds = Object.values(inlineCids);
    let index = 0;
    return body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>\n')
      .replace(/\[image:\s*([^\]]+)\]/gi, () => {
        const attachmentId = attachmentIds[index++];
        if (!attachmentId) return '';
        return `<img src="${attachmentProxyUrl(email, messageId, attachmentId)}" alt="inline" style="max-width:100%;height:auto;" />`;
      });
  }, [body, isHtml, email, messageId, inlineCids]);

  if (sanitizedHtml) {
    return (
      <div
        className="email-body break-words max-w-full overflow-auto [&_img]:max-w-full [&_img]:h-auto"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  if (textContent) {
    return (
      <div
        className="whitespace-pre-wrap break-words max-w-full [&_img]:max-w-full [&_img]:h-auto"
        dangerouslySetInnerHTML={{ __html: textContent }}
      />
    );
  }

  return <p className="text-muted-foreground italic text-sm">(No content)</p>;
}
```

- [ ] **Step 2: Verify**

Run: `bunx tsc --noEmit`
Expect: file-level pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/email-content.tsx
git commit -m "feat: render temp.tf bodies with cid/image rewrite and sanitization"
```

---

### Task 7: Inbox — inline expand, proxy attachments, no delete

**Files:** `src/components/ui/inbox.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
                                      attachment.contentType?.startsWith('image/') ? (
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
```

Note: `Badge` import is unused in this file after the rewrite — remove it from the import list in the actual file (the code above drops it). Also fix: `React.useState` needs `import { useState }` — the file header imports `useState` and uses it; the provider state in Task 5 uses `React.useState` with `import React` — adjust to `useState` import there. Apply both in-file at write time.

- [ ] **Step 2: Verify**

Run: `bunx tsc --noEmit`
Expect: file-level pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/inbox.tsx
git commit -m "feat: rework inbox for temp.tf inline expansion and proxy attachments"
```

---

### Task 8: page.tsx — remove auth, always-on generator/inbox, stats

**Files:** `src/app/page.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import { useMailSession } from '@/hooks/use-mail-session';
import { EmailGenerator } from '@/components/ui/email-generator';
import { FeaturesGrid } from '@/components/ui/features-grid';
import { Inbox } from '@/components/ui/inbox';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { fetchStats } from '@/lib/api/tf-api';
import { Sparkles, Mail, Github } from 'lucide-react';

export default function Home() {
  const {
    session,
    emails,
    isLoading,
    error,
    generate,
    recover,
    selectEmail,
    refresh,
    downloadAttachment,
  } = useMailSession();

  const [copied, setCopied] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [statsTotal, setStatsTotal] = useState<string>();

  // Load global stats once; hide silently on failure
  useEffect(() => {
    fetchStats([], true, true)
      .then((s) => setStatsTotal(s.totalFormatted))
      .catch(() => setStatsTotal(undefined));
  }, []);

  useEffect(() => {
    if (!session?.address) return;
    const interval = setInterval(() => {
      setNextRefreshIn((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.address]);

  useEffect(() => {
    setErrorMessage(error ?? undefined);
  }, [error]);

  const handleCopy = () => {
    if (session?.address) {
      navigator.clipboard.writeText(session.address);
      setCopied(true);
      toast.success('Email address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerate = async (
    providers: Parameters<typeof generate>[0],
    dot: boolean,
    plus: boolean
  ) => {
    setErrorMessage(undefined);
    await generate(providers, dot, plus);
  };

  const handleRecover = async (address: string) => {
    setErrorMessage(undefined);
    try {
      await recover(address);
    } catch {
      setErrorMessage('Could not recover that address.');
    }
  };

  const handleRefresh = () => {
    refresh();
    setNextRefreshIn(5);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(0 0% 3.9%)',
            border: '1px solid hsl(0 0% 14%)',
            color: 'hsl(0 0% 100%)',
          },
        }}
      />

      {/* Fixed Navigation */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6" />
              <span className="text-xl font-bold tracking-tight">LaughMail</span>
            </div>

            <nav className="flex items-center gap-3">
              {session?.address && (
                <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative border-b overflow-hidden">
        <div className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)]">
          <FlickeringGrid
            className="z-0 absolute inset-0"
            squareSize={4}
            gridGap={6}
            color="rgb(128, 128, 128)"
            maxOpacity={0.6}
            flickerChance={0.4}
          />
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, hsl(var(--background)) 35%, hsl(var(--background) / 0.4) 65%, transparent 100%)',
            }}
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Temporary Email Service
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Disposable Email
              <br />
              <span className="text-muted-foreground">in Seconds</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Generate a temporary email address on real Outlook, Hotmail &amp;
              Gmail. No registration. Recover your last address anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Email Generator */}
      <EmailGenerator
        email={session?.address || ''}
        onCopy={handleCopy}
        onGenerate={handleGenerate}
        onRecover={handleRecover}
        copied={copied}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />

      {/* Divider Grid */}
      <section className="relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-border hidden lg:block"
          style={{ left: 'calc(50% - 40rem)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-px bg-border hidden lg:block"
          style={{ right: 'calc(50% - 40rem)' }}
        />
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
          <div className="h-12" />
        </div>
      </section>

      {/* Inbox */}
      <Inbox
        emails={emails}
        address={session?.address || ''}
        onRefresh={handleRefresh}
        onEmailClick={selectEmail}
        onDownloadAttachment={downloadAttachment}
        isRefreshing={isLoading}
        nextRefreshIn={session?.address ? nextRefreshIn : undefined}
      />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <span className="font-semibold">LaughMail</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Powered by the temp.tf mailbox pool. Emails live as long as the
              provider account exists. No registration, no tracking.
            </p>
            <div className="flex items-center gap-4">
              {statsTotal && (
                <span className="text-xs text-muted-foreground">
                  {statsTotal} addresses available
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                by{' '}
                <span className="text-foreground font-medium">
                  hassankhan2608
                </span>
              </span>
              <a
                href="https://github.com/hassankhan2608/laughmail"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub Repository"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `bunx tsc --noEmit`
Expect: type-clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: remove auth UI, always-on generator and inbox with temp.tf"
```

---

### Task 9: FeaturesGrid copy + delete obsolete files + prune deps

**Files:** `src/components/ui/features-grid.tsx`, multiple deletions, `package.json`

- [ ] **Step 1: Fix FeaturesGrid claims**

Edit these three PlusCard `description` values (keep titles, icons, layout):

- Instant Generation: `"No registration. Addresses are built from temp.tf's own pool of real provider accounts—Outlook, Hotmail, Gmail and high.edu.pl."`
- Auto Inbox: `"The inbox polls every 5 seconds, so verification codes and links appear automatically. Real Outlook/Gmail delivery means mail actually lands."`
- 60-Minute Lifetime → rename title to `Long-Lived Aliases`, description `"Your plus/dot alias keeps receiving mail as long as the underlying provider account exists—no 60-minute expiry."`
- Privacy First: `"Only messages for your generated alias are shown. No personal address is exposed, no registration, no tracking."`

Replace the whole block in `src/components/ui/features-grid.tsx` (the five `PlusCard` entries from line ~57 to ~109).

- [ ] **Step 2: Verify no imports of files to be deleted**

```bash
grep -rn "auth/login-modal\|auth/signup-modal\|layout/account-menu\|settings-dialog\|responsive-modal\|user-profile-dropdown\|email/email-viewer\|email/email-list\|mail-api\|use-mobile\|ui/progress\|ui/select\|ui/scroll-area\|ui/skeleton\|ui/dialog\|ui/drawer\|ui/avatar\|ui/dropdown-menu\|ui/label\|ui/separator\|ui/tabs" src --include="*.tsx" --include="*.ts"
```

Expect: only matches inside the files themselves (self-references) — none from page.tsx, inbox.tsx, email-generator.tsx, email-content.tsx. `ui/input.tsx` and `ui/switch.tsx` are kept (used by EmailGenerator).

- [ ] **Step 3: Delete obsolete files**

```bash
git rm -r src/components/auth src/components/layout src/components/email
git rm src/components/ui/settings-dialog.tsx src/components/ui/responsive-modal.tsx \
       src/components/ui/user-profile-dropdown.tsx \
       src/lib/api/mail-api.ts src/hooks/use-mobile.tsx
# primitives only used by deleted files (adjust per Step 2 findings):
git rm src/components/ui/progress.tsx src/components/ui/select.tsx \
       src/components/ui/scroll-area.tsx src/components/ui/skeleton.tsx \
       src/components/ui/dialog.tsx src/components/ui/drawer.tsx \
       src/components/ui/avatar.tsx src/components/ui/dropdown-menu.tsx \
       src/components/ui/label.tsx src/components/ui/separator.tsx \
       src/components/ui/tabs.tsx 2>/dev/null || true
```

Then run `bunx tsc --noEmit`; fix any accidental leftover with the grep results above.

- [ ] **Step 4: Prune `package.json`**

Remove (after confirming zero imports): `@ngneat/falso`, `@radix-ui/react-avatar`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-progress`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-tabs`, `vaul`, `next-themes` (verify `grep -rn "next-themes" src` empty).

Run: `bun install` to refresh `bun.lock`.

- [ ] **Step 5: Verify**

Run: `bunx tsc --noEmit && bun run lint`
Expect: clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove Mail.tm auth/account stack and prune unused deps"
```

---

### Task 10: Full verification — build + browser smoke

**Files:** none

- [ ] **Step 1: Production build**

Run: `bun run build`
Expect: success, no type errors, all routes compiled.

- [ ] **Step 2: Browser smoke (dev server)**

With `bun run dev` running:

1. Open `http://localhost:3000`
2. Generate Email → a real Outlook/whatever address appears with scramble animation
3. Copy Address → clipboard toast
4. Inbox shows empty state; 5s polling indicator visible
5. Refresh browser → address auto-recovers (localStorage persisted), inbox re-fetches
6. Recover Address with `foo@bar.com` → error (invalid)
7. Recover with a previously generated `name+alias@outlook.com` → success
8. Toggle providers to Gmail-only + Dot → generate works
9. FeaturesGrid copy reads correctly; footer mentions temp.tf and shows stats count

- [ ] **Step 3: Final commit if any fixups**

```bash
git add -A
git commit -m "chore: final temp.tf migration fixes" || true
```

---

## Verification summary

- Type-check clean: `bunx tsc --noEmit`
- Lint clean: `bun run lint`
- Build clean: `bun run build`
- Live API: curl all 4 proxy routes (account/check/stats/attachment incl. error paths)
- Browser: generate → copy → empty inbox → refresh auto-recover → invalid recover error → provider/syntax toggles