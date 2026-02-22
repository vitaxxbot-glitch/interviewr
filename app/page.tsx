'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Interview {
  id: string;
  title: string;
  goal: string;
  created_at: number;
}

export default function Home() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [form, setForm] = useState({ title: '', goal: '', instructions: '' });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/interviews').then(r => r.json()).then(setInterviews).catch(console.error);
  }, [created]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setCreated(data.id);
      setForm({ title: '', goal: '', instructions: '' });
    } finally {
      setLoading(false);
    }
  }

  const interviewLink = created
    ? `${window.location.origin}/interview/${created}`
    : null;

  function copyLink() {
    if (!interviewLink) return;
    navigator.clipboard.writeText(interviewLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Interviewr</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              AI-powered adaptive interviews
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-medium"
            style={{ background: 'var(--card-border)', color: 'var(--muted)' }}>
            Admin
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">

        {/* Create form */}
        <section>
          <h2 className="text-lg font-medium mb-6">Create new interview</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Event feedback 2024"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
                style={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Interview goal</label>
              <textarea
                required
                rows={3}
                placeholder="What do you want to learn? e.g. Understand what attendees valued most and what they'd change"
                value={form.goal}
                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors resize-none"
                style={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Additional instructions <span style={{ color: 'var(--muted)' }}>(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Focus especially on the workshops. Keep it under 10 minutes."
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors resize-none"
                style={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all"
              style={{
                background: loading ? 'var(--muted)' : 'var(--accent)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating…' : 'Create interview →'}
            </button>
          </form>
        </section>

        {/* Created success */}
        {created && interviewLink && (
          <div className="p-5 rounded-2xl border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--success)' }}>
              ✓ Interview created — share this link
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 px-3 py-2 rounded-lg text-xs break-all"
                style={{ background: 'var(--card-border)', color: 'var(--muted)' }}>
                {interviewLink}
              </code>
              <button
                onClick={copyLink}
                className="shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: copied ? 'var(--success)' : 'var(--accent)',
                  color: 'white',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex gap-3 mt-3">
              <Link href={`/dashboard/${created}`}
                className="text-xs underline underline-offset-2"
                style={{ color: 'var(--accent)' }}>
                View dashboard →
              </Link>
            </div>
          </div>
        )}

        {/* Existing interviews */}
        {interviews.length > 0 && (
          <section>
            <h2 className="text-lg font-medium mb-4">Your interviews</h2>
            <div className="space-y-3">
              {interviews.map(iv => (
                <div key={iv.id}
                  className="p-4 rounded-2xl border flex items-center justify-between gap-4"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{iv.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{iv.goal}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/interview/${iv.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                      Interview
                    </Link>
                    <Link href={`/dashboard/${iv.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ background: 'var(--accent)' }}>
                      Dashboard
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
