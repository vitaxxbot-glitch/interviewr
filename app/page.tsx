'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { UserButton } from '@clerk/nextjs';

const VoiceButton = dynamic(() => import('@/components/VoiceButton'), { ssr: false });

interface Interview { id: string; title: string; goal: string; created_at: number; }

export default function Home() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [form, setForm] = useState({ title: '', goal: '', maxQuestions: 5 });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ id: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  function loadInterviews() {
    fetch('/api/interviews').then(r => r.json()).then(setInterviews).catch(console.error);
  }
  useEffect(loadInterviews, [created]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, maxQuestions: form.maxQuestions }),
      });
      const { id } = await res.json();
      setCreated({ id, link: `${window.location.origin}/interview/${id}` });
      setForm({ title: '', goal: '', maxQuestions: 8 });
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch('/api/interviews', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadInterviews();
    } finally { setDeleting(null); }
  }

  function copyLink() {
    if (!created) return;
    navigator.clipboard.writeText(created.link);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎙️</div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>Interviewr</span>
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 48px' }}>

        {/* Create form */}
        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>New interview</h1>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text" required autoFocus
              placeholder="Name — e.g. Employee benefits survey"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{ padding: '13px 15px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontSize: 15, width: '100%', boxShadow: 'var(--shadow-sm)' }}
            />

            <div style={{ position: 'relative' }}>
              <textarea
                required rows={4}
                placeholder="Objective — what do you want to learn? Type or speak it."
                value={form.goal}
                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                style={{ padding: '13px 50px 13px 15px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontSize: 15, width: '100%', resize: 'none', fontFamily: 'inherit', boxShadow: 'var(--shadow-sm)' }}
              />
              <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
                <VoiceButton size="sm" label={false} onTranscript={t => setForm(f => ({ ...f, goal: f.goal ? f.goal + ' ' + t : t }))} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              padding: '14px', borderRadius: 'var(--radius)', border: 'none',
              background: loading ? 'var(--fg-3)' : 'var(--accent)', color: 'white',
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 2px 8px rgba(124,92,191,0.35)',
              letterSpacing: '-0.01em',
            }}>
              {loading ? 'Creating…' : 'Create interview →'}
            </button>
          </form>
        </div>

        {/* Created link */}
        {created && (
          <div className="animate-fade-up" style={{ marginBottom: 32, padding: 16, background: 'var(--accent-bg)', borderRadius: 'var(--radius-lg)', border: '1.5px solid rgba(124,92,191,0.2)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 10 }}>
              ✓ Interview created
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <code style={{ flex: 1, fontSize: 12, padding: '8px 10px', background: 'var(--card)', borderRadius: 8, color: 'var(--fg-2)', wordBreak: 'break-all', border: '1px solid var(--border)' }}>
                {created.link}
              </code>
              <button onClick={copyLink} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 8, border: 'none', background: copied ? 'var(--green)' : 'var(--accent)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link href={`/dashboard/${created.id}`} style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>View dashboard →</Link>
              <Link href={`/interview/${created.id}`} target="_blank" style={{ fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none' }}>Preview ↗</Link>
            </div>
          </div>
        )}

        {/* Interview list */}
        {interviews.length > 0 && (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-2)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
              Your interviews
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {interviews.map((iv, i) => (
                <SwipeRow key={iv.id} onDelete={() => handleDelete(iv.id)} deleting={deleting === iv.id} index={i}>
                  <div style={{ flex: 1, minWidth: 0, padding: '13px 14px' }}>
                    <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{iv.goal}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 12px 0 0', flexShrink: 0 }}>
                    <Link href={`/interview/${iv.id}`} target="_blank"
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-2)', textDecoration: 'none', background: 'var(--card)' }}>
                      Share ↗
                    </Link>
                    <Link href={`/dashboard/${iv.id}`}
                      style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--accent)', fontSize: 12, fontWeight: 600, color: 'white', textDecoration: 'none' }}>
                      Results
                    </Link>
                  </div>
                </SwipeRow>
              ))}
            </div>
          </div>
        )}

        {interviews.length === 0 && !created && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
            <p style={{ fontSize: 14 }}>No interviews yet. Create your first one above.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function SwipeRow({ children, onDelete, deleting, index }: {
  children: React.ReactNode; onDelete: () => void; deleting: boolean; index: number;
}) {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const startX = useRef(0);
  const THRESHOLD = 72;

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }
  function onTouchMove(e: React.TouchEvent) {
    const dx = startX.current - e.touches[0].clientX;
    if (dx > 0) setOffset(Math.min(dx, THRESHOLD + 10));
  }
  function onTouchEnd() {
    if (offset >= THRESHOLD * 0.7) { setRevealed(true); setOffset(THRESHOLD); }
    else { setOffset(0); setRevealed(false); }
  }

  return (
    <div className="animate-fade-up" style={{ animationDelay: `${index * 0.04}s`, position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      {/* Delete bg */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: THRESHOLD, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius)' }}>
        <button
          onClick={() => { setOffset(0); setRevealed(false); onDelete(); }}
          disabled={deleting}
          style={{ background: 'none', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '10px 14px' }}>
          {deleting ? '…' : 'Delete'}
        </button>
      </div>
      {/* Row */}
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ display: 'flex', alignItems: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', transform: `translateX(-${offset}px)`, transition: offset === 0 && !revealed ? 'transform 0.25s ease' : 'none', userSelect: 'none', boxShadow: 'var(--shadow-sm)' }}>
        {children}
      </div>
    </div>
  );
}
