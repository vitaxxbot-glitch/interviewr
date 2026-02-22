'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { router.push(next); router.refresh(); }
      else setError('Wrong password');
    } finally { setLoading(false); }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎙️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Interviewr</h1>
          <p style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4 }}>Admin access</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password" required autoFocus
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 'var(--radius)', border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`, background: 'var(--bg)', color: 'var(--fg)', fontSize: 15, outline: 'none' }}
          />
          {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 'var(--radius)', border: 'none', background: loading ? 'var(--fg-3)' : 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '...' : 'Enter →'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
