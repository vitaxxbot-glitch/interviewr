'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Interview {
  id: string; title: string; goal: string; created_at: number;
  intro_message: string; success_message: string; fields: string; max_questions: number;
  response_count: number;
}

export default function Home() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [form, setForm] = useState({ title: '', goal: '', maxQuestions: 5 });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  function loadInterviews() {
    fetch('/api/interviews').then(r => r.json()).then(setInterviews).catch(console.error);
  }
  useEffect(loadInterviews, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/interviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, maxQuestions: form.maxQuestions }),
      });
      setForm({ title: '', goal: '', maxQuestions: 5 });
      loadInterviews();
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

  async function handleEditSave() {
    if (!editing) return;
    setEditSaving(true);
    try {
      const fields = editing.fields;
      await fetch(`/api/interviews/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intro_message: editing.intro_message,
          success_message: editing.success_message,
          fields,
          max_questions: editing.max_questions,
        }),
      });
      setEditing(null);
      loadInterviews();
    } finally { setEditSaving(false); }
  }

  function toggleField(field: string) {
    if (!editing) return;
    const current: string[] = JSON.parse(editing.fields || '["name","email"]');
    if (field === 'name') return; // always required
    const next = current.includes(field)
      ? current.filter(f => f !== field)
      : [...current, field];
    setEditing({ ...editing, fields: JSON.stringify(next) });
  }

  return (
    <>
      <main style={{ minHeight: '100svh', background: 'var(--bg)' }}>
        {/* Header */}
        <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 560, margin: '0 auto', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎙️</div>
              <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>Interviewr</span>
            </div>
            <a href="/login" style={{ fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none' }}>Logout</a>
          </div>
        </header>

        <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 80px' }}>

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

              <textarea
                required rows={4}
                placeholder="Objective — what do you want to learn?"
                value={form.goal}
                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                style={{ padding: '13px 15px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontSize: 15, width: '100%', resize: 'none', fontFamily: 'inherit', boxShadow: 'var(--shadow-sm)' }}
              />

              <button type="submit" disabled={loading} style={{
                padding: '14px', borderRadius: 'var(--radius)', border: 'none',
                background: loading ? 'var(--fg-3)' : 'var(--fg)', color: 'var(--card)',
                fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '-0.01em',
              }}>
                {loading ? 'Creating…' : 'Create interview →'}
              </button>
            </form>
          </div>

          {/* Interview list */}
          {interviews.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-2)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
                Your interviews
              </h2>
              {menuOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(null)} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {interviews.map((iv, i) => (
                  <SwipeRow key={iv.id} onDelete={() => handleDelete(iv.id)} deleting={deleting === iv.id} index={i}>
                    <div style={{ flex: 1, minWidth: 0, padding: '13px 14px' }}>
                      <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 2 }}>Responses: {iv.response_count}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 12px 0 0', flexShrink: 0 }}>
                      <Link href={`/interview/${iv.id}`} target="_blank"
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-2)', textDecoration: 'none', background: 'var(--card)' }}>
                        Share ↗
                      </Link>
                      <Link href={`/dashboard/${iv.id}`}
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--fg)', fontSize: 12, fontWeight: 600, color: 'var(--card)', textDecoration: 'none' }}>
                        Results
                      </Link>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === iv.id ? null : iv.id); }}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, color: 'var(--fg-2)', background: 'var(--card)', cursor: 'pointer', fontWeight: 700, lineHeight: 1 }}
                        >
                          ···
                        </button>
                        {menuOpen === iv.id && (
                          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 140, overflow: 'hidden' }}>
                            <button
                              onClick={() => { setMenuOpen(null); setEditing({ ...iv, fields: iv.fields || '["name","email"]' }); }}
                              style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid var(--border)', background: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: 'var(--fg)' }}
                            >
                              Customize
                            </button>
                            <button
                              onClick={() => { setMenuOpen(null); handleDelete(iv.id); }}
                              style={{ display: 'block', width: '100%', padding: '10px 14px', border: 'none', background: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: 'var(--red)' }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </SwipeRow>
                ))}
              </div>
            </div>
          )}

          {interviews.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--fg-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
              <p style={{ fontSize: 14 }}>No interviews yet. Create your first one above.</p>
            </div>
          )}
        </div>

        <footer style={{ textAlign: 'center', padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--card)', fontSize: 12, color: 'var(--fg-3)' }}>
          Powered by The Agile Monkeys
        </footer>
      </main>

      {/* Edit Modal */}
      {editing && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setEditing(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div className="animate-fade-up" style={{ width: '100%', maxWidth: 560, background: 'var(--card)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '24px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>Edit interview</h2>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--fg-2)', padding: '4px 8px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Intro message */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Intro message
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Hi! This is a quick 2-minute survey about your experience."
                  value={editing.intro_message}
                  onChange={e => setEditing({ ...editing, intro_message: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 14, resize: 'none', fontFamily: 'inherit' }}
                />
                <p style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>Leave blank to use the default message.</p>
              </div>

              {/* Fields to collect */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Fields to collect
                </label>
                {[
                  { key: 'name', label: 'Name', required: true },
                  { key: 'email', label: 'Email', required: false },
                  { key: 'phone', label: 'Phone', required: false },
                ].map(({ key, label, required }) => {
                  const currentFields: string[] = JSON.parse(editing.fields || '["name","email"]');
                  const checked = currentFields.includes(key);
                  return (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', cursor: required ? 'default' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={required}
                        onChange={() => toggleField(key)}
                        style={{ width: 16, height: 16, accentColor: 'var(--fg)' }}
                      />
                      <span style={{ fontSize: 14, color: 'var(--fg)' }}>{label}</span>
                      {required && <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>(always required)</span>}
                    </label>
                  );
                })}
              </div>

              {/* Success message */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Success message
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Thanks, {name}! We'll be in touch soon."
                  value={editing.success_message}
                  onChange={e => setEditing({ ...editing, success_message: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 14, resize: 'none', fontFamily: 'inherit' }}
                />
                <p style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>Use {'{name}'} to personalise. Leave blank for default.</p>
              </div>

              <button
                onClick={handleEditSave}
                disabled={editSaving}
                style={{ padding: '14px', borderRadius: 'var(--radius)', border: 'none', background: editSaving ? 'var(--fg-3)' : 'var(--fg)', color: 'var(--card)', fontSize: 15, fontWeight: 600, cursor: editSaving ? 'not-allowed' : 'pointer' }}
              >
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
