'use client';
import { useState, useEffect, useRef, use } from 'react';

interface Message { role: 'user' | 'assistant'; content: string; }
interface Interview {
  id: string; title: string; goal: string;
  intro_message: string; success_message: string; fields: string;
}
type Params = Promise<{ id: string }>;

export default function InterviewPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [stage, setStage] = useState<'intro' | 'chat' | 'done'>('intro');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQ, setMaxQ] = useState(5);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/interviews/${id}`).then(r => r.json()).then(d => {
      setInterview(d);
      if (d.max_questions) setMaxQ(d.max_questions);
    }).catch(console.error);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fields: string[] = interview?.fields ? JSON.parse(interview.fields) : ['name', 'email'];

  async function startInterview(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/interviews/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: fields.includes('email') ? email : undefined, phone: fields.includes('phone') ? phone : undefined }),
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
      if (data.retryable || !data.reply) {
        setStage('intro');
        setSessionId(null);
        alert('The AI is temporarily unavailable. Please try again in a moment.');
      } else {
        setMessages([{ role: 'assistant', content: data.reply }]);
        if (data.maxQuestions !== undefined) setMaxQ(data.maxQuestions);
        if (data.suggestions) setSuggestions(data.suggestions);
      }
    } catch {
      setStage('intro');
      setSessionId(null);
      alert('Service temporarily unavailable. Please try again in a moment.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function sendMessage(msg?: string) {
    const userMsg = (msg ?? input).trim();
    if (!userMsg || !sessionId || loading) return;
    setInput('');
    setSuggestions([]);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch(`/api/interviews/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMsg }),
      });
      const data = await res.json();
      if (data.retryable) {
        setInput(userMsg);
        setMessages(prev => prev.slice(0, -1));
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ The AI is temporarily busy. Please try again in a moment.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'Something went wrong.' }]);
        if (data.questionCount !== undefined) setQuestionCount(data.questionCount);
        if (data.suggestions) setSuggestions(data.suggestions);
        if (data.isComplete) setTimeout(() => setStage('done'), 2000);
      }
    } catch {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'user') return prev.slice(0, -1);
        return prev;
      });
      setInput(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Service temporarily unavailable. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  if (!interview) return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid var(--fg)', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />
      <p style={{ fontSize: 14, color: 'var(--fg-2)' }}>Loading…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── INTRO ──────────────────────────────────────────────────────────
  if (stage === 'intro') return (
    <main style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 24px' }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 18 }}>
            🎙️
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 8 }}>
            {interview.title}
          </h1>
          <p style={{ color: 'var(--fg-2)', fontSize: 14, lineHeight: 1.6 }}>
            {interview.intro_message || (
              <>A short AI conversation — a few questions, adapts to your answers. About <strong style={{ color: 'var(--fg)' }}>{maxQ <= 3 ? '1–2' : maxQ <= 5 ? '2–3' : '5'} min</strong>.</>
            )}
          </p>
        </div>

        <form onSubmit={startInterview} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {fields.map((field, i) => {
              const isLast = i === fields.length - 1;
              if (field === 'name') return (
                <input key="name" type="text" required autoFocus
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ padding: '15px 16px', border: 'none', borderBottom: isLast ? 'none' : '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              );
              if (field === 'email') return (
                <input key="email" type="email" required={fields.includes('email')}
                  placeholder="Your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ padding: '15px 16px', border: 'none', borderBottom: isLast ? 'none' : '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              );
              if (field === 'phone') return (
                <input key="phone" type="tel"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ padding: '15px 16px', border: 'none', borderBottom: isLast ? 'none' : '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              );
              return null;
            })}
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px', borderRadius: 'var(--radius-lg)', border: 'none',
            background: loading ? 'var(--fg-3)' : 'var(--fg)', color: 'var(--card)',
            fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '-0.01em',
          }}>
            {loading ? 'Starting…' : 'Start →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--fg-3)', marginTop: 14, lineHeight: 1.5 }}>
          Your answers go directly to the team.
        </p>
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--fg-3)', marginTop: 40 }}>
        Powered by The Agile Monkeys
      </p>
    </main>
  );

  // ── DONE ──────────────────────────────────────────────────────────
  if (stage === 'done') {
    const rawSuccess = interview.success_message;
    const successMsg = rawSuccess
      ? rawSuccess.replace(/\{name\}/gi, name)
      : 'All done. Your answers are with the team — nothing else needed.';
    const successTitle = rawSuccess
      ? null
      : `Thanks, ${name}!`;

    return (
      <main style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div className="animate-fade-up" style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🙌</div>
          {successTitle && (
            <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
              {successTitle}
            </h2>
          )}
          <p style={{ color: 'var(--fg-2)', fontSize: 16, lineHeight: 1.6 }}>
            {successMsg}
          </p>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--fg-3)', marginTop: 48 }}>
          Powered by The Agile Monkeys
        </p>
      </main>
    );
  }

  // ── CHAT ──────────────────────────────────────────────────────────
  const progress = Math.min((questionCount / maxQ) * 100, 92);

  return (
    <main style={{ height: '100svh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* Progress header */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '10px 16px', flexShrink: 0 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--fg)', borderRadius: 99, width: `${Math.max(progress, 5)}%`, transition: 'width 0.7s ease' }} />
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
                background: msg.role === 'user' ? 'var(--fg)' : 'var(--card)',
                color: msg.role === 'user' ? 'var(--card)' : 'var(--fg)',
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

      {/* Input + suggestions */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--card)', padding: '8px 12px 12px', flexShrink: 0 }}>
        {/* Suggested answers */}
        {suggestions.length > 0 && !loading && (
          <div style={{ maxWidth: 600, margin: '0 auto 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                style={{
                  padding: '7px 13px', borderRadius: 20, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--fg)', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'background 0.15s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              placeholder="Type your answer…"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" disabled={loading || !input.trim()} style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: (loading || !input.trim()) ? 'var(--fg-3)' : 'var(--fg)',
            color: 'var(--card)', fontSize: 18, cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            ↑
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--fg-3)', marginTop: 8 }}>
          Powered by The Agile Monkeys
        </p>
      </div>
    </main>
  );
}
