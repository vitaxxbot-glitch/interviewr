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
      if (data.isComplete) setTimeout(() => setStage('done'), 2000);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  if (!interview) return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── INTRO ──────────────────────────────────────────────────────────
  if (stage === 'intro') return (
    <main style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 24px' }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 18, boxShadow: '0 4px 12px rgba(124,92,191,0.3)' }}>
            🎙️
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 8 }}>
            {interview.title}
          </h1>
          <p style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.6 }}>
            A short AI conversation — a few questions, adapts to your answers. About <strong style={{ color: 'var(--fg)' }}>5 min</strong>.
          </p>
        </div>

        <form onSubmit={startInterview} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <input
              type="text" required autoFocus
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ padding: '15px 16px', border: 'none', borderBottom: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
            <input
              type="email" required
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ padding: '15px 16px', border: 'none', background: 'transparent', color: 'var(--fg)', fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px', borderRadius: 'var(--radius-lg)', border: 'none',
            background: loading ? 'var(--fg-3)' : 'var(--accent)', color: 'white',
            fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.01em', boxShadow: loading ? 'none' : '0 3px 10px rgba(124,92,191,0.3)',
          }}>
            {loading ? 'Starting…' : 'Start →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--fg-3)', marginTop: 14, lineHeight: 1.5 }}>
          Your answers go directly to the team.
        </p>
      </div>
    </main>
  );

  // ── DONE ──────────────────────────────────────────────────────────
  if (stage === 'done') return (
    <main style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div className="animate-fade-up" style={{ maxWidth: 360 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🙌</div>
        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
          Thanks, {name}!
        </h2>
        <p style={{ color: 'var(--fg-2)', fontSize: 16, lineHeight: 1.6 }}>
          All done. Your answers are with the team — nothing else needed.
        </p>
      </div>
    </main>
  );

  // ── CHAT ──────────────────────────────────────────────────────────
  const progress = Math.min((questionCount / maxQ) * 100, 92);

  return (
    <main style={{ height: '100svh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Progress header */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '10px 16px', flexShrink: 0 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 99, width: `${Math.max(progress, 5)}%`, transition: 'width 0.7s ease' }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--fg-3)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
            {questionCount}/{maxQ}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((msg, i) => (
            <div key={i} className="animate-fade-up" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '82%', padding: '12px 16px', fontSize: 15, lineHeight: 1.6,
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--card)',
                color: msg.role === 'user' ? 'white' : 'var(--fg)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex' }}>
              <div style={{ padding: '12px 18px', borderRadius: '4px 20px 20px 20px', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', gap: 4, alignItems: 'center' }}>
                <span className="dot-1" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--fg-3)', display: 'block' }} />
                <span className="dot-2" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--fg-3)', display: 'block' }} />
                <span className="dot-3" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--fg-3)', display: 'block' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--card)', padding: '10px 12px 12px', flexShrink: 0 }}>
        <form onSubmit={sendMessage} style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <VoiceButton onTranscript={t => setInput(i => i ? i + ' ' + t : t)} />
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              placeholder="Type or speak your answer…"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" disabled={loading || !input.trim()} style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: (loading || !input.trim()) ? 'var(--fg-3)' : 'var(--accent)',
            color: 'white', fontSize: 18, cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            ↑
          </button>
        </form>
      </div>
    </main>
  );
}
