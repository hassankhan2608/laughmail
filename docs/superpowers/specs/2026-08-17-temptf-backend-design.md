# LaughMail — Switch Backend to temp.tf

Date: 2026-08-17
Status: Approved (scope decision: remove all auth/account UI)

## Problem

LaughMail currently uses the Mail.tm API (registration + JWT + delete endpoints).
User wants the temp.tf backend instead: no-registration disposable addresses
built from temp.tf's own provider pool (plus/dot aliases on real Outlook/Gmail),
with temp.tf-style interaction but LaughMail's existing aesthetic (pure black,
Kode Mono, GSAP scramble, shadcn, Framer Motion).

Last-used address must persist so a refresh/revisit auto-recovers it (acts
"logged in").

## temp.tf API (verified live)

Public, no auth. **No CORS headers** → LaughMail must proxy server-side.

| Endpoint | Method | Params / Body | Response |
|---|---|---|---|
| `https://temp.tf/api/account` | GET | `providers=outlook,hotmail,gmail,high.edu.pl` (comma list), `dot=0\|1`, `plus=0\|1` | `{email: "name+alias@outlook.com"}` |
| `https://temp.tf/api/check` | POST | JSON `{email}` | `{data: TempMessage[], totalReceived: number}` |
| `https://temp.tf/api/stats` | GET | same as account | `{totalFormatted, breakdownFormatted, totalReceived, breakdown}` |
| `https://temp.tf/api/attachment` | GET | `email`, `messageId`, `attachmentId` | binary blob (image/pdf served for preview) |

`TempMessage` fields: `id`, `subject`, `from`, `date`, `body`,
`bodyContentType` (`"html"` | other = text), `attachments: []`, `inlineCids: {cid: attachmentId}`.

Errors: JSON `{error}`; HTTP 429 carries `Retry-After`; 5xx → client retries
once after 800ms. `/api/check` on non-temp.tf address → 403 `{error:"Forbidden"}`.

Address validation (mirrored from temp.tf client bundle):
- `@high.edu.pl`: local part not in service blacklist (skip blacklist client-side; server enforces)
- `@gmail.com`: must contain `+` or `.`
- contains `outlook.`/`hotmail.`: must contain `+`
- other domains: must contain `+` or `.`

There is **no delete, no domain-list, no auth** endpoint. Mail.tm-only features
(delete email, clear inbox, delete account, login, signup, settings, storage
quota, seen/mark-as-read, source view) are removed, not faked.

## Architecture

```
Browser (LaughMail UI)
  │  fetch("/api/tf/account?...")           ← same-origin, no CORS issue
  ▼
Next.js proxy routes (src/app/api/tf/*)
  │  server-side fetch https://temp.tf/api/*
  ▼
temp.tf backend
```

New files:
- `src/app/api/tf/account/route.ts` — GET; validates providers/dot/plus; forwards; surfaces `{error}` and 429 `Retry-After`
- `src/app/api/tf/check/route.ts` — POST; forwards `{email}`; surfaces errors; returns `{data, totalReceived}`
- `src/app/api/tf/stats/route.ts` — GET; forwards stats
- `src/app/api/tf/attachment/route.ts` — GET; forwards binary; preserves `Content-Type`; passes `Content-Disposition: attachment` from upstream (download-first)

Each route: `export const runtime = "nodejs"` (server fetch), base URL
`https://temp.tf/api`, response passthrough with status + headers, JSON error
passthrough. No caching of inbox data (`Cache-Control: no-store` on check route).

## Types — rewrite `src/types/mail.ts`

- `TempProvider` = `"outlook" | "hotmail" | "gmail" | "high.edu.pl"`
- `TempAttachment { id: string; contentType: string; [k: string]: unknown }`
- `TempMessage { id; subject; from; date; body; bodyContentType: "html" | string; attachments: TempAttachment[]; inlineCids: Record<string, string> }`
- `TempSession { address: string }` — persists last-used address
- `CheckResult { data: TempMessage[]; totalReceived: number }`
- Drop `Domain`, `Account`, `PaginatedResponse`, `EmailAddress`, `Session` (old shape), `AppState` replaces old `Session` references; keep `AppState`/`EmailStatus` shape adapted.

## Client library — new `src/lib/api/tf-api.ts`

(Replaces `mail-api.ts` calls in the hook; delete `mail-api.ts`.)
- `generateAddress(providers: TempProvider[], dot: boolean, plus: boolean): Promise<string>`
- `checkInbox(email: string): Promise<CheckResult>`
- `fetchStats(providers, dot, plus): Promise<Stats>`
- `attachmentProxyUrl(email, messageId, attachmentId): string` → `/api/tf/attachment?…`
- `isValidTempAddress(email): boolean` — mirrors temp.tf validation above
- `buildAccountQuery(providers, dot, plus)` — mirrors temp.tf rule: if only
  `high.edu.pl` → dot=0/plus=0; if Gmail-only + dot → providers `["gmail"]`; etc.

`lib/session.ts`: keep API (`saveSession/getSession/clearSession`) but new
`TempSession` shape; **no expiry** (addresses live while provider account
exists); `isSessionValid` returns `!!address`.

## Hook — rework `src/hooks/use-mail-session.ts`

Same exported surface minus removed actions, adapted:
- state: `session: TempSession | null`, `emails: TempMessage[]`, `isLoading`, `isPolling`, `error`, `nextRefreshIn`
- **auto-recover**: on mount, if stored address → set active, immediately `checkInbox` (acts logged-in on refresh/revisit)
- `generate(providers, dot, plus)` → new address → save → auto check inbox
- `recover(address)` → validate → save → check inbox
- `refresh()` → `checkInbox(session.address)`; keep 5s polling while active
- removed: `login`, `register`, `logout`, `deleteAccount`, `deleteEmail`,
  `getSource`, `clearAllEmails`, `getDomains`, `markAsRead`

## UI changes

`src/app/page.tsx`:
- Remove: LoginModal, SignupModal, SettingsDialog, AccountMenu imports/state; `LogIn`/`UserPlus` buttons and conditional `isAuthenticated` gating (always show generator + inbox once an address exists)
- Nav shows LaughMail wordmark only (+ status chip)
- Hero keeps flickering grid + headline; primary CTA = "Generate Email" (always visible)
- Stats footer (from `/api/tf/stats`): compact line under the address — "556,301+ messages received" — included in the build (cheap, adds temp.tf feel); failures hide it silently

`src/components/ui/email-generator.tsx`:
- Add provider toggle row (Outlook / Hotmail / Gmail / high.edu.pl — Badge-style, temp.tf-like)
- Add Dot / Plus syntax switches (Switch; dot only meaningful for Gmail → disable otherwise with hint)
- Keep GSAP scramble, copy button, "New Address" button
- Recovery input ("Recover Address"): text field + button; validates `isValidTempAddress`; shows server `{error}` from check

`src/components/ui/inbox.tsx`:
- Inline expand per message (current selected-email expansion pattern); render body via `EmailContent`
- Attachments: list + download via proxy URL (`/api/tf/attachment`); image/pdf inline preview per temp.tf behavior
- Rewrite `cid:` image sources → proxy URLs using `inlineCids` mapping; text-mode `[image: …]` tokens → inline images (mirror temp.tf)
- Remove delete/trash UI; keep refresh + countdown + empty state
- `EmailContent` props adapted: `body`, `bodyContentType`, `inlineCids`, `email`, `messageId` (replaces `html`/`text`/`intro`)

Deleted files: `src/components/auth/*`, `src/components/layout/account-menu.tsx`,
`src/components/ui/settings-dialog.tsx`, `src/components/email/*`,
`src/components/ui/responsive-modal.tsx` (only used by deleted modals),
`src/lib/api/mail-api.ts`. Remove now-unused deps from package.json if nothing
else imports them (verify: `@ngneat/falso` — only mail-api used it; Radix
dialog/drawer/select still used by remaining UI — keep until verified).

`FeaturesGrid` copy: replace "60-Minute Lifetime"/"deleted after expiration"
with accurate claims: "lives as long as the provider account exists", "real
Outlook/Gmail delivery".

## Error handling

- Proxy routes: pass through upstream status; JSON `{error}` → same to client; 429 → forward `Retry-After`; client shows message + optional retry delay
- `checkInbox` with invalid/foreign address → 403 → show `Forbidden` message, keep current address
- Network failure in proxy → 502 `{error:"Upstream unavailable"}`

## Testing

- `curl` each proxy route against real backend: account (all provider combos), check (generated address), stats, attachment error case
- `bun run build` + `bun run lint` clean
- Browser smoke: generate → copy → check inbox empty state → recover persisted
  address on refresh (auto-check) → invalid address error path

## Out of scope

- Sending mail (temp.tf has no send API)
- Phone numbers (temp.tf phone is a separate beta page, no /api endpoints)
- Deleting messages/server-side clearing (no API)
- Registering custom bases (temp.tf aliases only)