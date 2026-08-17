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
