'use client';

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface WonLostDialogProps {
  isOpen: boolean;
  dealTitle?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const PRESET_REASONS = [
  'Price / Budget Constraints',
  'Competitor Chosen',
  'No Budget / Project Cancelled',
  'No Response / Ghosted',
  'Timing / Delayed to next quarter',
  'Feature mismatch',
  'Other',
];

export function WonLostDialog({ isOpen, dealTitle, onConfirm, onCancel }: WonLostDialogProps) {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    if (!finalReason) return;
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-base font-bold text-white">Mark Deal as Lost</h3>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <p className="text-xs text-slate-300">
            Please specify why <span className="font-semibold text-white">&quot;{dealTitle || 'this deal'}&quot;</span> was lost to help improve sales forecasting and analytics:
          </p>

          <div className="space-y-2">
            {PRESET_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-3 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition ${
                  selectedReason === r
                    ? 'border-rose-500/50 bg-rose-500/10 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="lost_reason"
                  value={r}
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="text-rose-500 focus:ring-rose-500"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom reason details
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why the deal was lost..."
                rows={3}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition"
            >
              Confirm Lost Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
