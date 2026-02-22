'use client';

import { useState, useEffect, useRef, use } from 'react';

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/interviews/${id}`)
      .then(r => r.json())
      .then(data => setInterview(data))
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function startInterview(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Create session
      const res = await fetch(`/api/interviews/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const { sessionId: sid } = await res.json();
      setSessionId(sid);

      // Get first message from AI
      const chatRes = await fetch(`/api/interviews/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, message: null }),
      });
      const { reply } = await chatRes.json();
      setMessages([{ role: 'assistant', content: reply }]);
      setStage('chat');
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
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
      const { reply, isComplete } = await res.json();
      const cleanReply = reply.replace('INTERVIEW_COMPLETE', '').trim();
      setMessages(prev => [...prev, { role: 'assistant', content: cleanReply }]);
      if (isComplete) setTimeout(() => setStage('done'), 1200);
    } finally {
      setLoading(false);
    }
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // Intro screen
  if (stage === 'intro') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="text-3xl mb-4">🎙️</div>
            <h1 className="text-2xl font-semibold tracking-tight">{interview.title}</h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              You'll have a short conversation with an AI. It adapts to your answers — no fixed questions.
              Takes about 5–10 minutes.
            </p>
          </div>

          <form onSubmit={startInterview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Your name</label>
              <input
                type="text" required
                placeholder="Alex"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email" required
                placeholder="alex@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium text-white mt-2"
              style={{ background: loading ? 'var(--muted)' : 'var(--accent)', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Starting…' : 'Start interview →'}
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: 'var(--muted)' }}>
            Your responses are anonymous and used only for this research.
          </p>
        </div>
      </main>
    );
  }

  // Done screen
  if (stage === 'done') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-6">✓</div>
          <h2 className="text-2xl font-semibold mb-3">Thank you, {name}!</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Your interview is complete. Your answers have been recorded and will help shape better decisions.
          </p>
        </div>
      </main>
    );
  }

  // Chat screen
  return (
    <main className="h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b px-6 py-4 shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{ background: 'var(--accent)', color: 'white' }}>AI</div>
          <div>
            <p className="text-sm font-medium">{interview.title}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Interviewing {name}</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={{
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--card)',
                  color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                  border: msg.role === 'assistant' ? `1px solid var(--border)` : 'none',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl text-sm flex gap-1 items-center"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '18px 18px 18px 4px' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--muted)', animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--muted)', animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--muted)', animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t px-6 py-4 shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type your answer…"
            className="flex-1 px-4 py-3 rounded-xl border text-sm outline-none"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl text-sm font-medium text-white transition-all"
            style={{
              background: (loading || !input.trim()) ? 'var(--muted)' : 'var(--accent)',
              cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
            }}
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
