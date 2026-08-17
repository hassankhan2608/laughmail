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
