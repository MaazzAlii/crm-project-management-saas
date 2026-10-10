'use client';

import React, { useState } from 'react';
import { PipelineStage } from '@/lib/types/pipeline';
import { AlertTriangle, Trash2, X, ArrowRight } from 'lucide-react';

interface DeleteStageModalProps {
  isOpen: boolean;
  stage: PipelineStage | null;
  dealCount: number;
  otherStages: PipelineStage[];
  onConfirm: (moveToStageId: string | null) => Promise<void>;
  onClose: () => void;
}

export function DeleteStageModal({
  isOpen,
  stage,
  dealCount,
  otherStages,
  onConfirm,
  onClose,
}: DeleteStageModalProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    otherStages.length > 0 ? otherStages[0].id : ''
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !stage) return null;

  const hasDeals = dealCount > 0;

  const handleDelete = async () => {
    if (hasDeals && !selectedTargetId) {
      setError('Please select a destination stage to move the deals to.');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm(hasDeals ? selectedTargetId : null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete column');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Stage</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Column: <span className="font-semibold text-slate-200">{stage.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {hasDeals ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 flex gap-2.5 items-start">
              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200">
                <p className="font-semibold">
                  This stage currently contains {dealCount} active {dealCount === 1 ? 'deal' : 'deals'}.
                </p>
                <p className="text-amber-300/80 mt-1">
                  Select a destination column to reassign these deals before deleting.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Move deals to:
              </label>
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-sky-500 focus:outline-none"
              >
                {otherStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.is_won ? 'Won' : s.is_lost ? 'Lost' : 'Active'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-xs text-slate-300">
            Are you sure you want to delete this column? This action cannot be undone.
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || (hasDeals && !selectedTargetId)}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition disabled:opacity-50"
          >
            {isDeleting ? (
              'Deleting...'
            ) : hasDeals ? (
              <>
                <span>Transfer & Delete</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            ) : (
              'Delete Column'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
