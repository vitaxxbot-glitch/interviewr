export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  const tmpAudio = join(tmpdir(), `interviewr-${randomUUID()}.webm`);
  const tmpOut   = join(tmpdir(), `interviewr-${randomUUID()}`);

  try {
    const form = await req.formData();
    const file = form.get('audio') as File | null;
    if (!file) return NextResponse.json({ error: 'No audio' }, { status: 400 });

    // Save audio blob to temp file
    const buf = Buffer.from(await file.arrayBuffer());
    writeFileSync(tmpAudio, buf);

    // Run whisper (tiny model = fast, ~1-2s for short clips)
    const cmd = `python3 -m whisper "${tmpAudio}" --model tiny --output_format txt --output_dir "${tmpOut}" --fp16 False 2>/dev/null`;
    execSync(cmd, { timeout: 30000 });

    // Read result
    const txtFile = join(tmpOut, `interviewr-${tmpAudio.split('-').pop()?.replace('.webm', '.txt') || 'out.txt'}`);
    // Whisper names the output after the input file
    const baseName = tmpAudio.replace('.webm', '.txt').split('/').pop()!;
    const result = join(tmpOut, baseName);

    let text = '';
    if (existsSync(result)) {
      text = require('fs').readFileSync(result, 'utf8').trim();
    } else {
      // Fallback: try any .txt in tmpOut
      const files = require('fs').readdirSync(tmpOut).filter((f: string) => f.endsWith('.txt'));
      if (files.length > 0) text = require('fs').readFileSync(join(tmpOut, files[0]), 'utf8').trim();
    }

    return NextResponse.json({ text });
  } catch (e) {
    console.error('Transcribe error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    // Cleanup
    try { unlinkSync(tmpAudio); } catch {}
    try { require('fs').rmSync(tmpOut, { recursive: true, force: true }); } catch {}
  }
}
