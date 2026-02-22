'use client';
import { useState, useRef, useCallback } from 'react';

interface Props {
  onTranscript: (text: string) => void;
  size?: 'sm' | 'md';
  label?: boolean;
}

export default function VoiceButton({ onTranscript, size = 'md', label = true }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggle = useCallback(async () => {
    if (state === 'recording') {
      mediaRef.current?.stop();
      return;
    }
    if (state === 'processing') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setState('processing');

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const form = new FormData();
        form.append('audio', blob, `audio.${mimeType.includes('webm') ? 'webm' : 'mp4'}`);

        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: form });
          const data = await res.json();
          if (data.text) onTranscript(data.text);
        } catch (e) {
          console.error('Transcription failed', e);
        } finally {
          setState('idle');
        }
      };

      mediaRef.current = rec;
      rec.start();
      setState('recording');
    } catch (e) {
      alert('Microphone access needed. Please allow it in your browser settings.');
      setState('idle');
    }
  }, [state, onTranscript]);

  const isRec = state === 'recording';
  const isProc = state === 'processing';
  const dim = size === 'sm' ? 36 : 42;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isProc}
      title={isRec ? 'Stop recording' : isProc ? 'Transcribing…' : 'Record voice'}
      style={{
        width: dim, height: dim, borderRadius: '50%', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: isProc ? 'not-allowed' : 'pointer', flexShrink: 0,
        background: isRec ? 'var(--accent)' : isProc ? 'var(--bg-2)' : 'var(--bg-2)',
        color: isRec ? 'white' : 'var(--fg-2)',
        transition: 'all 0.15s',
        boxShadow: isRec ? '0 0 0 4px rgba(124,92,191,0.2)' : 'none',
        animation: isRec ? 'pulse 1.5s ease-in-out infinite' : 'none',
        gap: 4,
        fontSize: size === 'sm' ? 14 : 16,
        position: 'relative',
      }}
    >
      {isProc ? (
        <span style={{ fontSize: 12 }}>...</span>
      ) : isRec ? (
        <span>⏹</span>
      ) : (
        <span>🎙️</span>
      )}
      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 4px rgba(124,92,191,0.2)} 50%{box-shadow:0 0 0 8px rgba(124,92,191,0.1)} }`}</style>
    </button>
  );
}
