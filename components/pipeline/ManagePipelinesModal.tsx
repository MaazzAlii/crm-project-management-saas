'use client';

import React, { useState } from 'react';
import { Pipeline } from '@/lib/types/pipeline';
import { X, Plus, Check, Trash2, Edit2, Layers } from 'lucide-react';

interface ManagePipelinesModalProps {
  isOpen: boolean;
  pipelines: Pipeline[];
  activePipelineId: string;
  onSelectPipeline: (pipelineId: string) => void;
  onClose: () => void;
  onPipelinesChanged: () => void;
}

export function ManagePipelinesModal({
  isOpen,
  pipelines,
  activePipelineId,
  onSelectPipeline,
  onClose,
  onPipelinesChanged,
}: ManagePipelinesModalProps) {
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newPipelineDesc, setNewPipelineDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipelineName.trim()) return;

    try {
      const res = await fetch('/api/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPipelineName.trim(),
          description: newPipelineDesc.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setNewPipelineName('');
        setNewPipelineDesc('');
        setIsCreating(false);
        onPipelinesChanged();
        onSelectPipeline(json.data.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await fetch(`/api/pipelines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      });
      setEditingId(null);
      onPipelinesChanged();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (pipelines.length <= 1) {
      alert('Cannot delete the only sales pipeline in your organization.');
      return;
    }
    if (confirm('Are you sure you want to delete this sales pipeline and its columns?')) {
      try {
        const res = await fetch(`/api/pipelines/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.data?.success) {
          onPipelinesChanged();
          if (activePipelineId === id) {
            const fallback = pipelines.find((p) => p.id !== id);
            if (fallback) onSelectPipeline(fallback.id);
          }
        } else {
          alert(json.error?.message || 'Failed to delete pipeline');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sky-400">
            <Layers className="h-5 w-5" />
            <h3 className="text-base font-bold text-white">Manage Sales Pipelines</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Existing Pipelines List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {pipelines.map((p) => {
            const isActive = p.id === activePipelineId;
            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-xl border p-3 transition ${
                  isActive
                    ? 'border-sky-500/40 bg-sky-500/10'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                {isEditing ? (
                  <div className="flex flex-1 items-center gap-2 mr-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleUpdate(p.id)}
                      className="rounded bg-sky-600 px-2.5 py-1 text-xs font-bold text-white"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      onSelectPipeline(p.id);
                      onClose();
                    }}
                    className="flex flex-1 items-center gap-2.5 cursor-pointer"
                  >
                    <span className="text-xs font-bold text-white">{p.name}</span>
                    {p.is_default && (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                        Default
                      </span>
                    )}
                    {isActive && <Check className="h-4 w-4 text-sky-400 ml-auto mr-2" />}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  {!isEditing && (
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setEditName(p.name);
                      }}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {pipelines.length > 1 && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Pipeline Form */}
        {isCreating ? (
          <form onSubmit={handleCreate} className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">New Pipeline Details</h4>
            <input
              required
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              placeholder="Pipeline Name (e.g. Inbound Enterprise)"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
            <input
              value={newPipelineDesc}
              onChange={(e) => setNewPipelineDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newPipelineName.trim()}
                className="rounded-xl bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-500 disabled:opacity-50"
              >
                Create Pipeline
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-2.5 text-xs font-semibold text-slate-300 hover:border-sky-500 hover:text-sky-400 transition"
          >
            <Plus className="h-4 w-4" /> Create Another Pipeline
          </button>
        )}
      </div>
    </div>
  );
}
