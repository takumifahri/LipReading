'use client';

import React, { useEffect, useState } from 'react';

const WORDS = [
  'buka', 'tutup', 'antek-antek', 'tulis', 'menulis',
  'berbicara', 'pintu', 'membawa', 'mengambil', 'meletakkan',
  'mengirim', 'menyimpan', 'memperbaiki', 'pembelajaran', 'perbaikan',
  'pemahaman', 'pemberitahuan', 'komunikasi', 'transformasi', 'buku', 'asing'
];

export default function WordsPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem('lip_history');
        if (raw) setHistory(JSON.parse(raw));
      } catch {
        // ignore localStorage failures
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-black mb-6">Known Words</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {WORDS.map((w) => (
            <div key={w} className="p-3 bg-white/5 rounded-lg border border-white/5 text-center">
              <span className="font-bold uppercase text-sm">{w}</span>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-4">Recent Predictions</h2>
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <div className="text-zinc-500 italic">No recent predictions</div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <div>
                  <div className="font-bold">{h.word}</div>
                  <div className="text-xs text-zinc-400">
                    {h.timestamp ? new Date(h.timestamp).toLocaleString() : 'No timestamp'}
                  </div>
                </div>
                <div className="text-sm font-mono">{Math.round((h.confidence || 0) * 100)}%</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
