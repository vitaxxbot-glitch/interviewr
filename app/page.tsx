'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const VoiceButton = dynamic(() => import('@/components/VoiceButton'), { ssr: false });

interface Interview { id: string; title: string; goal: string; created_at: number; }

export default function Home() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [form, setForm] = useState({ title: '', goal: '' });
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const { id } = await res.json();
      setCreated({ id, link: `${window.location.origin}/interview/${id}` });
      setForm({ title: '', goal: '' });
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
  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' });
    window.location.href = '/login';
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🎙️</span>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>Interviewr</span>
          </div>
          <button onClick={logout} style={{ fontSize: 12, color: 'var(--fg-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 20px' }}>
        <section className="animate-fade-up">
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }}>New interview</h2>
          <form onSubmit={handleCreate} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Name</label>
              <input type="text" required autoFocus placeholder="e.g. Employee benefits survey"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Objective</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-3)' }}>
                  <span>Tap mic to speak</span>
                  <VoiceButton
                    size="sm"
                    label={false}
                    onTranscript={t => setForm(f => ({ ...f, goal: f.goal ? f.goal + ' ' + t : t }))}
                  />
                </div>
              </div>
              <textarea required rows={4}
                placeholder="What do you want to learn? Type or speak it."
                value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={loading} style={{ padding: '13px', borderRadius: 'var(--radius)', border: 'none', background: loading ? 'var(--fg-3)' : 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Creating…' : 'Create →'}
            </button>
          </form>
        </section>

        {created && (
          <div className="animate-fade-up" style={{ marginTop: 12, padding: 16, background: 'var(--accent-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(124,92,191,0.25)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>✓ Ready — share this link</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <code style={{ flex: 1, fontSize: 11, padding: '7px 10px', background: 'var(--bg)', borderRadius: 8, color: 'var(--fg-2)', wordBreak: 'break-all' }}>{created.link}</code>
              <button onClick={copyLink} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 8, border: 'none', background: copied ? 'var(--green)' : 'var(--accent)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 14 }}>
              <Link href={`/dashboard/${created.id}`} style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Dashboard →</Link>
              <Link href={`/interview/${created.id}`} target="_blank" style={{ fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none' }}>Preview ↗</Link>
            </div>
          </div>
        )}

        {interviews.length > 0 && (
          <section style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Interviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {interviews.map((iv, i) => (
                <SwipeRow key={iv.id} onDelete={() => handleDelete(iv.id)} deleting={deleting === iv.id}>
                  <div style={{ flex: 1, minWidth: 0, padding: '12px 14px' }}>
                    <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--fg-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{iv.goal}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 14px 0 0', flexShrink: 0 }}>
                    <Link href={`/interview/${iv.id}`} target="_blank" style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-2)', textDecoration: 'none' }}>Link ↗</Link>
                    <Link href={`/dashboard/${iv.id}`} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--accent)', fontSize: 12, fontWeight: 600, color: 'white', textDecoration: 'none' }}>Results</Link>
                  </div>
                </SwipeRow>
              ))}
            </div>
          </section>
        )}

        {interviews.length === 0 && !created && (
          <p style={{ textAlign: 'center', color: 'var(--fg-3)', fontSize: 13, marginTop: 40 }}>No interviews yet ↑</p>
        )}
      </div>
    </main>
  );
}

// Swipe-to-delete row
function SwipeRow({ children, onDelete, deleting }: { children: React.ReactNode; onDelete: () => void; deleting: boolean }) {
  const [offset, setOffset] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const startX = useRef(0);
  const DELETE_THRESHOLD = 80;

  function onTouchStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX; }
  function onTouchMove(e: React.TouchEvent) {
    const dx = startX.current - e.touches[0].clientX;
    if (dx > 0) setOffset(Math.min(dx, DELETE_THRESHOLD + 20));
  }
  function onTouchEnd() {
    if (offset >= DELETE_THRESHOLD) { setConfirmed(true); setOffset(DELETE_THRESHOLD); }
    else setOffset(0);
  }

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      {/* Delete bg */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: DELETE_THRESHOLD, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius)' }}>
        {confirmed ? (
          <button onClick={() => { setOffset(0); setConfirmed(false); onDelete(); }}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '8px 12px' }}>
            {deleting ? '…' : 'Delete?'}
          </button>
        ) : (
          <span style={{ fontSize: 18, pointerEvents: 'none' }}>🗑️</span>
        )}
      </div>

      {/* Content */}
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ display: 'flex', alignItems: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', transform: `translateX(-${offset}px)`, transition: offset === 0 ? 'transform 0.2s ease' : 'none', userSelect: 'none' }}>
        {children}
      </div>
    </div>
  );
}
