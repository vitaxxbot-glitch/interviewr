export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'interviewr';
const COOKIE = 'interviewr_auth';

export async function POST(req: Request) {
  const { password } = await req.json();
  if (password !== ADMIN_PASS) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, ADMIN_PASS, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('interviewr_auth');
  return res;
}
