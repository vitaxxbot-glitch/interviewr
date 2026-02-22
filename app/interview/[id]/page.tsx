'use client';
import { useState, useEffect, useRef, use } from 'react';
import dynamic from 'next/dynamic';
const VoiceButton = dynamic(() => import('@/components/VoiceButton'), { ssr: false });

interface Message { role: 'user' | 'assistant'; content: string; }
interface Interview { id: string; title: string; goal: string; }
type Params = Promise<{ id: string }>;

export default function InterviewPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [stage, setStage] = useState<'intro' | 'chat' | 'done'>('intro');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQ, setMaxQ] = useState(10);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/interviews/${id}`).then(r => r.json()).then(setInterview).catch(console.error);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function startInterview(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/interviews/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const { sessionId: sid } = await res.json();
      setSessionId(sid);
      setStage('chat');

      const chatRes = await fetch(`/api/interviews/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, message: null }),
      });
      const data = await chatRes.json();
      setMessages([{ role: 'assistant', content: data.reply }]);
      if (data.maxQuestions) setMaxQ(data.maxQuestions);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || !sessionId || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/interviews/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.questionCount) setQuestionCount(data.questionCount);
      if (data.isComplete) setTimeout(() => setStage('done'), 1800);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  if (!interview) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Spinner />
    </div>
  );

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (stage === 'intro') return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, marginBottom: 24 }}>
          <span>●</span> Live interview
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 10 }}>{interview.title}</h1>
        <p style={{ color: 'var(--fg-2)', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
          A short conversation with AI — adapts to your answers. Takes about <strong style={{ color: 'var(--fg)' }}>5 minutes</strong>.
        </p>

        <form onSubmit={startInterview} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'First name', type: 'text', placeholder: 'Alex', value: name, set: setName, auto: 'autoFocus' },
            { label: 'Email', type: 'email', placeholder: 'alex@company.com', value: email, set: setEmail },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{f.label}</label>
              <input
                type={f.type} required
                placeholder={f.placeholder}
                value={f.value}
                onChange={e => f.set(e.target.value)}
                autoFocus={f.label === 'First name'}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--fg)', fontSize: 15, outline: 'none' }}
              />
            </div>
          ))}
          <button type="submit" disabled={loading} style={{
            marginTop: 8, padding: '14px', borderRadius: 'var(--radius)', border: 'none',
            background: loading ? 'var(--fg-3)' : 'var(--accent)', color: 'white',
            fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Starting…' : 'Begin →'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--fg-3)', marginTop: 20 }}>
          Your answers go directly to the team — no copy-paste needed.
        </p>
      </div>
    </main>
  );

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (stage === 'done') return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="animate-fade-up" style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>✓</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 10 }}>Thanks, {name}!</h2>
        <p style={{ color: 'var(--fg-2)', fontSize: 15, lineHeight: 1.6 }}>
          Your interview is complete. Responses sent directly to the team — no action needed on your end.
        </p>
      </div>
    </main>
  );

  // ── CHAT ─────────────────────────────────────────────────────────────────
  const progress = Math.min((questionCount / maxQ) * 100, 95);

  return (
    <main style={{ height: '100svh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '10px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{interview.title}</span>
            <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>In progress…</span>
          </div>
          <div style={{ height: 3, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'var(--accent)', width: `${Math.max(progress, 4)}%`, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, i) => (
            <div key={i} className="animate-fade-up" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '82%', padding: '11px 16px', fontSize: 14, lineHeight: 1.6,
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--card)',
                color: msg.role === 'user' ? 'white' : 'var(--fg)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', borderRadius: '4px 18px 18px 18px', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                <span className="dot-1" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg-3)', display: 'block' }} />
                <span className="dot-2" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg-3)', display: 'block' }} />
                <span className="dot-3" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--fg-3)', display: 'block' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input + voice */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--card)', padding: '12px 16px', flexShrink: 0 }}>
        <form onSubmit={sendMessage} style={{ maxWidth: 640, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <VoiceButton onTranscript={t => setInput(i => i ? i + ' ' + t : t)} />

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type or speak your answer…"
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--fg)', fontSize: 14, outline: 'none',
            }}
          />
          <button type="submit" disabled={loading || !input.trim()} style={{
            padding: '11px 20px', borderRadius: 'var(--radius)', border: 'none', flexShrink: 0,
            background: (loading || !input.trim()) ? 'var(--fg-3)' : 'var(--accent)',
            color: 'white', fontSize: 14, fontWeight: 600,
            cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
          }}>
            Send
          </button>
        </form>
      </div>
    </main>
  );
}

function Spinner() {
  return <>
    <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
  </>;
}
