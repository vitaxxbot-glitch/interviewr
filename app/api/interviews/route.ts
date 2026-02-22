export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createInterview, listInterviews } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const interviews = listInterviews();
    return NextResponse.json(interviews);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, goal, instructions } = await req.json();
    if (!title || !goal) return NextResponse.json({ error: 'title and goal are required' }, { status: 400 });

    const id = uuidv4().slice(0, 8);
    createInterview(id, title, goal, instructions || '');
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
