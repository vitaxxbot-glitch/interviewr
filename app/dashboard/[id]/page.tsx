'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Message { role: 'user' | 'assistant'; content: string; created_at: number; }
interface SessionDetail {
  id: string; name: string; email: string; completed: number;
  started_at: number; message_count: number; messages: Message[];
}
interface DashboardData {
  interview: { id: string; title: string; goal: string; created_at: number };
  sessions: SessionDetail[];
  totalResponses: number;
  completedResponses: number;
  summary: string | null;
}

type Params = Promise<{ id: string }>;

export default function DashboardPage({ params }: { params: Params }) {
  const { id } = use(params);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard/${id}`).then(r => r.json()).then(setData).catch(console.error);
  }, [id]);

  async function fetchSummary() {
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/dashboard/${id}?summary=1`);
      const newData = await res.json();
      setData(newData);
    } finally {
      setLoadingSummary(false);
    }
  }

  function copyInterviewLink() {
    navigator.clipboard.writeText(`${window.location.origin}/interview/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const { interview, sessions, totalResponses, completedResponses } = data;

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link href="/" className="text-xs mb-2 block hover:underline" style={{ color: 'var(--muted)' }}>
                ← All interviews
              </Link>
              <h1 className="text-xl font-semibold tracking-tight">{interview.title}</h1>
              <p className="text-sm mt-1 leading-snug" style={{ color: 'var(--muted)' }}>{interview.goal}</p>
            </div>
            <button
              onClick={copyInterviewLink}
              className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: copied ? 'var(--success)' : 'var(--accent)' }}
            >
              {copied ? '✓ Copied' : 'Share link'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Responses', value: totalResponses },
            { label: 'Completed', value: completedResponses },
            { label: 'Completion rate', value: totalResponses ? `${Math.round((completedResponses / totalResponses) * 100)}%` : '—' },
          ].map(stat => (
            <div key={stat.label} className="p-5 rounded-2xl border"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-3xl font-semibold tracking-tight">{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">AI Summary</h2>
            {!data.summary && (
              <button
                onClick={fetchSummary}
                disabled={loadingSummary || completedResponses === 0}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{
                  background: (loadingSummary || completedResponses === 0) ? 'var(--muted)' : 'var(--accent)',
                  cursor: (loadingSummary || completedResponses === 0) ? 'not-allowed' : 'pointer',
                }}
              >
                {loadingSummary ? 'Generating…' : 'Generate summary'}
              </button>
            )}
          </div>

          {completedResponses === 0 && !data.summary && (
            <div className="p-6 rounded-2xl border text-center"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No completed interviews yet. Share the link to start collecting responses.
              </p>
            </div>
          )}

          {data.summary && (
            <div className="p-6 rounded-2xl border prose prose-sm max-w-none"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              <MarkdownContent content={data.summary} />
            </div>
          )}
        </section>

        {/* Individual sessions */}
        {sessions.length > 0 && (
          <section>
            <h2 className="text-lg font-medium mb-4">Responses ({sessions.length})</h2>
            <div className="space-y-3">
              {sessions.map(session => (
                <div key={session.id} className="rounded-2xl border overflow-hidden"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <button
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                    onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
                        style={{ background: 'var(--accent)' }}>
                        {session.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{session.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{session.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          background: session.completed ? '#dcfce7' : '#fef3c7',
                          color: session.completed ? '#166534' : '#92400e',
                        }}>
                        {session.completed ? 'Complete' : 'In progress'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {expandedSession === session.id ? '↑' : '↓'}
                      </span>
                    </div>
                  </button>

                  {expandedSession === session.id && (
                    <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                      {session.messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                            style={{
                              background: msg.role === 'user' ? 'var(--accent)' : 'var(--background)',
                              color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
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
    </main>
  );
}

// Simple markdown renderer for the summary
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('## '))
          return <h3 key={i} className="text-base font-semibold mt-4 first:mt-0">{line.slice(3)}</h3>;
        if (line.startsWith('# '))
          return <h2 key={i} className="text-lg font-semibold mt-4 first:mt-0">{line.slice(2)}</h2>;
        if (line.startsWith('**') && line.endsWith('**'))
          return <p key={i} className="font-semibold text-sm">{line.slice(2, -2)}</p>;
        if (line.startsWith('- '))
          return <p key={i} className="text-sm pl-4 before:content-['·'] before:mr-2" style={{ color: 'var(--foreground)' }}>{line.slice(2)}</p>;
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i} className="text-sm leading-relaxed">{line}</p>;
      })}
    </div>
  );
}
