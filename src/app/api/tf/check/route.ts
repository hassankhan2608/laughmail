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
