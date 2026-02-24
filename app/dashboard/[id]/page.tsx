'use client';

import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';

interface Message { role: string; content: string; }
interface Session {
  id: string; name: string; email: string; completed: number;
  started_at: number; message_count: number; messages: Message[];
}
interface DashboardData {
  interview: { id: string; title: string; goal: string };
  sessions: Session[];
  totalResponses: number;
  completedResponses: number;
  summary: string | null;
}

type Params = Promise<{ id: string }>;

export default function DashboardPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [goalExpanded, setGoalExpanded] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchData = useCallback(async (withSummary = false) => {
    const url = withSummary ? `/api/dashboard/${id}?summary=1` : `/api/dashboard/${id}`;
    const res = await fetch(url);
    const d = await res.json();
    setData(d);
    return d;
  }, [id]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleSummary(force = false) {
    setLoadingSummary(true);
    try {
      const url = force ? `/api/dashboard/${id}?summary=1&force=1` : `/api/dashboard/${id}?summary=1`;
      const res = await fetch(url);
      const d = await res.json();
      setData(d);
    } finally {
      setLoadingSummary(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/interview/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copySummary() {
    if (!data?.summary) return;
    navigator.clipboard.writeText(data.summary);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  }

  async function saveGoal() {
    if (!data) return;
    setSavingGoal(true);
    try {
      await fetch(`/api/interviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalDraft }),
      });
      setData(d => d ? { ...d, interview: { ...d.interview, goal: goalDraft } } : d);
      setEditingGoal(false);
    } finally {
      setSavingGoal(false);
    }
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 12 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--fg)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ fontSize: 14, color: 'var(--fg-2)' }}>Loading…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const { interview, sessions, totalResponses, completedResponses } = data;
  const goalIsLong = interview.goal.length > 120;

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 24px' }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--fg-3)', display: 'block', marginBottom: 8, textDecoration: 'none' }}>
            ← All interviews
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)' }}>{interview.title}</h1>

              {/* Collapsible goal */}
              {editingGoal ? (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <textarea
                    autoFocus
                    rows={3}
                    value={goalDraft}
                    onChange={e => setGoalDraft(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 13, resize: 'none', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveGoal} disabled={savingGoal} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--fg)', color: 'var(--card)', fontSize: 13, fontWeight: 600, cursor: savingGoal ? 'not-allowed' : 'pointer' }}>
                      {savingGoal ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditingGoal(false)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--fg-2)', fontSize: 13, cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 3 }}>
                  <p style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55, maxWidth: 500 }}>
                    {goalIsLong && !goalExpanded
                      ? interview.goal.slice(0, 120) + '…'
                      : interview.goal}
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                    {goalIsLong && (
                      <button
                        onClick={() => setGoalExpanded(v => !v)}
                        style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--fg-3)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                      >
                        {goalExpanded ? 'Show less' : 'Show more'}
                      </button>
                    )}
                    <button
                      onClick={() => { setGoalDraft(interview.goal); setEditingGoal(true); }}
                      style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--fg-3)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={copyLink} style={{
              flexShrink: 0, padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none',
              background: copied ? 'var(--green)' : 'var(--fg)', color: 'var(--card)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              {copied ? '✓ Copied' : 'Share link'}
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}>

        {/* Stats */}
        <div className="animate-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { n: totalResponses, label: 'Responses' },
            { n: completedResponses, label: 'Completed' },
            { n: totalResponses ? `${Math.round((completedResponses / totalResponses) * 100)}%` : '—', label: 'Completion' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '20px 22px',
            }}>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--fg)' }}>{s.n}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Auto-refresh notice */}
        <p style={{ fontSize: 11, color: 'var(--fg-3)', textAlign: 'right', marginTop: -20 }}>
          ↻ Updates every 15s
        </p>

        {/* AI Summary */}
        <section className="animate-fade-up stagger-1">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg)' }}>AI Summary</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {data.summary && (
                <button
                  onClick={copySummary}
                  style={{
                    padding: '7px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                    background: summaryCopied ? 'var(--green)' : 'var(--card)', color: summaryCopied ? 'white' : 'var(--fg-2)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {summaryCopied ? '✓ Copied' : 'Copy'}
                </button>
              )}
              {data.summary ? (
                <button
                  onClick={() => handleSummary(true)}
                  disabled={loadingSummary || completedResponses === 0}
                  style={{
                    padding: '7px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                    background: 'var(--card)', color: 'var(--fg-2)', fontSize: 13, fontWeight: 500,
                    cursor: loadingSummary ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadingSummary ? 'Regenerating…' : '↺ Regenerate'}
                </button>
              ) : (
                <button
                  onClick={() => handleSummary()}
                  disabled={loadingSummary || completedResponses === 0}
                  style={{
                    padding: '7px 16px', borderRadius: 'var(--radius)', border: 'none',
                    background: (loadingSummary || completedResponses === 0) ? 'var(--fg-3)' : 'var(--fg)',
                    color: 'var(--card)', fontSize: 13, fontWeight: 600,
                    cursor: (loadingSummary || completedResponses === 0) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadingSummary ? 'Generating…' : 'Generate'}
                </button>
              )}
            </div>
          </div>

          {completedResponses === 0 ? (
            <div style={{
              padding: 32, borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border)',
              textAlign: 'center', color: 'var(--fg-3)', fontSize: 14,
            }}>
              Share the link to start collecting responses.
              <br />
              <span style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
                The summary will appear here once people complete the interview.
              </span>
            </div>
          ) : loadingSummary ? (
            <div style={{
              padding: 32, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
              background: 'var(--card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--fg)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              <p style={{ fontSize: 13, color: 'var(--fg-2)' }}>Generating AI summary…</p>
            </div>
          ) : data.summary ? (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 24,
            }}>
              <MarkdownContent content={data.summary} />
            </div>
          ) : (
            <div style={{
              padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
              background: 'var(--card)', color: 'var(--fg-2)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>{completedResponses} completed interview{completedResponses !== 1 ? 's' : ''} ready to summarize.</span>
            </div>
          )}
        </section>

        {/* Individual responses */}
        {sessions.length > 0 && (
          <section className="animate-fade-up stagger-2">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, color: 'var(--fg)' }}>
              Responses <span style={{ color: 'var(--fg-3)', fontWeight: 400 }}>({sessions.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map(session => (
                <div key={session.id} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setExpanded(expanded === session.id ? null : session.id)}
                    style={{
                      width: '100%', padding: '14px 18px', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--bg-2)', color: 'var(--fg-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700,
                      }}>
                        {session.name[0]?.toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg)' }}>{session.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.02em',
                        background: session.completed ? 'var(--green-bg)' : 'var(--bg-2)',
                        color: session.completed ? 'var(--green)' : 'var(--fg-2)',
                      }}>
                        {session.completed ? 'Complete' : 'In progress'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                        {expanded === session.id ? '↑' : '↓'}
                      </span>
                    </div>
                  </button>

                  {expanded === session.id && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {session.messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '85%', padding: '9px 14px', fontSize: 13, lineHeight: 1.55,
                            borderRadius: msg.role === 'user' ? '14px 14px 3px 14px' : '3px 14px 14px 14px',
                            background: msg.role === 'user' ? 'var(--bg-2)' : 'var(--bg)',
                            color: 'var(--fg)',
                            border: '1px solid var(--border)',
                          }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <footer style={{ textAlign: 'center', padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--card)', fontSize: 12, color: 'var(--fg-3)' }}>
        Una iniciativa de The Agile Monkeys
      </footer>
    </main>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {content.split('\n').map((line, i) => {
        if (line.startsWith('## '))
          return <h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg)', marginTop: 16 }}>{line.slice(3)}</h3>;
        if (line.startsWith('# '))
          return <h2 key={i} style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg)', marginTop: 16 }}>{line.slice(2)}</h2>;
        if (line.startsWith('- ') || line.startsWith('* '))
          return <p key={i} style={{ fontSize: 13, color: 'var(--fg)', paddingLeft: 16, lineHeight: 1.6 }}>
            <span style={{ marginRight: 8 }}>·</span>{line.slice(2)}
          </p>;
        if (line.trim() === '') return <div key={i} style={{ height: 4 }} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.65 }}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j} style={{ color: 'var(--fg)', fontWeight: 600 }}>{p.slice(2, -2)}</strong>
                : p
            )}
          </p>
        );
      })}
    </div>
  );
}
