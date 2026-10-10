'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Deal,
  PipelineStage,
  PipelineLabel,
  DealChecklist,
  DealComment,
  DealActivity,
} from '@/lib/types/pipeline';
import {
  X,
  Tag,
  CheckSquare,
  Calendar,
  DollarSign,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  History,
  Trash2,
  Archive,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronDown,
  Check,
  Send,
  Loader2,
} from 'lucide-react';
import { WonLostDialog } from './WonLostDialog';

interface DealDetailModalProps {
  dealId: string | null;
  pipelineId: string;
  stages: PipelineStage[];
  labels: PipelineLabel[];
  onClose: () => void;
  onDealUpdated?: (deal: Deal) => void;
  onDealDeleted?: (dealId: string) => void;
}

export function DealDetailModal({
  dealId,
  pipelineId,
  stages,
  labels: pipelineLabels,
  onClose,
  onDealUpdated,
  onDealDeleted,
}: DealDetailModalProps) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Active tab in bottom feed (comments vs activity)
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [comments, setComments] = useState<DealComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [checklists, setChecklists] = useState<DealChecklist[]>([]);

  // Popover controls
  const [showLabelsPopover, setShowLabelsPopover] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);

  // New label creation state
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#38bdf8');
  const [creatingLabel, setCreatingLabel] = useState(false);

  const fetchDealDetails = useCallback(async () => {
    if (!dealId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/deals/${dealId}`);
      const json = await res.json();
      if (json.data) {
        setDeal(json.data);
      }

      // Fetch checklists
      const clRes = await fetch(`/api/deals/${dealId}/checklists`);
      const clJson = await clRes.json();
      if (clJson.data) setChecklists(clJson.data);

      // Fetch comments
      const cmRes = await fetch(`/api/deals/${dealId}/comments`);
      const cmJson = await cmRes.json();
      if (cmJson.data) setComments(cmJson.data);

      // Fetch activity
      const actRes = await fetch(`/api/deals/${dealId}/activity`);
      const actJson = await actRes.json();
      if (actJson.data) setActivities(actJson.data);
    } catch (err) {
      console.error('Failed to load deal details', err);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    if (dealId) {
      fetchDealDetails();
    }
  }, [dealId, fetchDealDetails]);

  // Handle ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!dealId) return null;

  const handleFieldUpdate = async (fields: Partial<Deal>) => {
    if (!deal) return;
    setSavingState('saving');
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fields,
          expectedVersion: deal.version,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setDeal(json.data);
        onDealUpdated?.(json.data);
        setSavingState('saved');
        setTimeout(() => setSavingState('idle'), 1500);
      } else {
        setSavingState('idle');
      }
    } catch {
      setSavingState('idle');
    }
  };

  const handleStageChange = async (toStageId: string) => {
    if (!deal || deal.stage_id === toStageId) return;
    const targetStage = stages.find((s) => s.id === toStageId);
    if (targetStage?.is_lost) {
      setShowLostDialog(true);
      return;
    }

    setSavingState('saving');
    try {
      const res = await fetch(`/api/deals/${deal.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStageId,
          expectedVersion: deal.version,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setDeal(json.data);
        onDealUpdated?.(json.data);
        setSavingState('saved');
        setTimeout(() => setSavingState('idle'), 1500);
        fetchDealDetails();
      }
    } finally {
      setSavingState('idle');
    }
  };

  const handleConfirmLost = async (lostReason: string) => {
    if (!deal) return;
    const lostStage = stages.find((s) => s.is_lost) || stages[stages.length - 1];
    setShowLostDialog(false);

    try {
      const res = await fetch(`/api/deals/${deal.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStageId: lostStage.id,
          expectedVersion: deal.version,
          lostReason,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setDeal(json.data);
        onDealUpdated?.(json.data);
        fetchDealDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    if (!deal) return;
    const currentLabelIds = (deal.labels || []).map((l) => l.id);
    const hasLabel = currentLabelIds.includes(labelId);
    const newLabelIds = hasLabel
      ? currentLabelIds.filter((id) => id !== labelId)
      : [...currentLabelIds, labelId];

    await handleFieldUpdate({ label_ids: newLabelIds } as any);
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    try {
      setCreatingLabel(true);
      const res = await fetch(`/api/pipelines/${pipelineId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLabelName.trim(), color: newLabelColor }),
      });
      const json = await res.json();
      if (json.data) {
        setNewLabelName('');
        await handleToggleLabel(json.data.id);
      }
    } finally {
      setCreatingLabel(false);
    }
  };

  // Checklists
  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal || !newChecklistTitle.trim()) return;
    try {
      const res = await fetch(`/api/deals/${deal.id}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newChecklistTitle.trim() }),
      });
      const json = await res.json();
      if (json.data) {
        setChecklists((prev) => [...prev, json.data]);
        setNewChecklistTitle('');
        setAddingChecklist(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklistItem = async (checklistId: string, itemTitle: string) => {
    if (!deal || !itemTitle.trim()) return;
    try {
      const res = await fetch(`/api/deals/${deal.id}/checklists/${checklistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: itemTitle.trim() }),
      });
      const json = await res.json();
      if (json.data) {
        setChecklists((prev) =>
          prev.map((cl) =>
            cl.id === checklistId
              ? { ...cl, items: [...(cl.items || []), json.data] }
              : cl
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklistItem = async (checklistId: string, itemId: string, isDone: boolean) => {
    if (!deal) return;
    try {
      const res = await fetch(`/api/deals/${deal.id}/checklists/${checklistId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_done: isDone }),
      });
      const json = await res.json();
      if (json.data) {
        setChecklists((prev) =>
          prev.map((cl) =>
            cl.id === checklistId
              ? {
                  ...cl,
                  items: (cl.items || []).map((item) => (item.id === itemId ? json.data : item)),
                }
              : cl
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Comments
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal || !newComment.trim()) return;
    try {
      const res = await fetch(`/api/deals/${deal.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const json = await res.json();
      if (json.data) {
        setComments((prev) => [json.data, ...prev]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Archive & Delete
  const handleArchive = async () => {
    if (!deal) return;
    await fetch(`/api/deals/${deal.id}/archive`, { method: 'POST' });
    onDealDeleted?.(deal.id);
    onClose();
  };

  const handleDelete = async () => {
    if (!deal) return;
    if (confirm('Are you sure you want to permanently delete this deal?')) {
      await fetch(`/api/deals/${deal.id}`, { method: 'DELETE' });
      onDealDeleted?.(deal.id);
      onClose();
    }
  };

  const currentStage = stages.find((s) => s.id === deal?.stage_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full shadow-sm"
              style={{ backgroundColor: currentStage?.color || '#6366f1' }}
            />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {currentStage?.name || 'Pipeline Deal'}
            </span>
            {savingState === 'saving' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-sky-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {savingState === 'saved' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading || !deal ? (
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
            {/* Left Content Column */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto border-r border-slate-800/80">
              {/* Deal Title */}
              <div>
                <input
                  type="text"
                  defaultValue={deal.title}
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== deal.title) {
                      handleFieldUpdate({ title: e.target.value.trim() });
                    }
                  }}
                  placeholder="Deal title..."
                  className="w-full text-xl font-extrabold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:outline-none py-1 transition"
                />
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Value</label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="number"
                      defaultValue={deal.value}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (val !== deal.value) handleFieldUpdate({ value: val });
                      }}
                      className="w-20 font-mono text-xs font-bold text-white bg-transparent border-b border-transparent focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Probability</label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={deal.probability}
                      onBlur={(e) => {
                        const prob = parseInt(e.target.value, 10) || 50;
                        if (prob !== deal.probability) handleFieldUpdate({ probability: prob });
                      }}
                      className="w-12 font-mono text-xs font-bold text-white bg-transparent border-b border-transparent focus:border-sky-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Close Date</label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="date"
                      defaultValue={deal.expected_close_date || ''}
                      onChange={(e) => handleFieldUpdate({ expected_close_date: e.target.value || null })}
                      className="text-xs text-slate-200 bg-transparent border-b border-transparent focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Stage</label>
                  <select
                    value={deal.stage_id}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="mt-0.5 block w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    {stages.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Labels list */}
              {(deal.labels || []).length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block">Labels</label>
                  <div className="flex flex-wrap gap-2">
                    {(deal.labels || []).map((lbl) => (
                      <span
                        key={lbl.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: `${lbl.color}20`,
                          color: lbl.color,
                          border: `1px solid ${lbl.color}40`,
                        }}
                      >
                        {lbl.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">Description & Notes</label>
                <textarea
                  defaultValue={deal.description || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (deal.description || '')) {
                      handleFieldUpdate({ description: e.target.value });
                    }
                  }}
                  rows={4}
                  placeholder="Add details, deal background, client requirements..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Checklists */}
              <div className="space-y-4">
                {checklists.map((cl) => {
                  const items = cl.items || [];
                  const total = items.length;
                  const done = items.filter((i) => i.is_done).length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <div key={cl.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-sky-400" />
                          <h4 className="text-xs font-bold text-white">{cl.title}</h4>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{pct}%</span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full bg-sky-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Items list */}
                      <div className="space-y-1.5">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2.5 rounded-lg p-1.5 hover:bg-slate-900/80 transition"
                          >
                            <input
                              type="checkbox"
                              checked={item.is_done}
                              onChange={(e) =>
                                handleToggleChecklistItem(cl.id, item.id, e.target.checked)
                              }
                              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-600 focus:ring-sky-500"
                            />
                            <span
                              className={`text-xs ${
                                item.is_done ? 'line-through text-slate-500' : 'text-slate-200'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Add item inline */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const input = (e.currentTarget.elements.namedItem('itemTitle') as HTMLInputElement);
                          if (input?.value) {
                            handleAddChecklistItem(cl.id, input.value);
                            input.value = '';
                          }
                        }}
                        className="flex gap-2 pt-1"
                      >
                        <input
                          name="itemTitle"
                          type="text"
                          placeholder="Add checklist item..."
                          className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>

              {/* Feed: Comments / Activity Tabs */}
              <div className="border-t border-slate-800 pt-4 space-y-4">
                <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-2 text-xs font-bold transition pb-1 ${
                      activeTab === 'comments'
                        ? 'text-sky-400 border-b-2 border-sky-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Comments ({comments.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 text-xs font-bold transition pb-1 ${
                      activeTab === 'activity'
                        ? 'text-sky-400 border-b-2 border-sky-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <History className="h-3.5 w-3.5" /> Activity Stream
                  </button>
                </div>

                {activeTab === 'comments' && (
                  <div className="space-y-3">
                    <form onSubmit={handlePostComment} className="flex gap-2">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-sky-500 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>

                    <div className="space-y-2">
                      {comments.map((cm) => (
                        <div key={cm.id} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-200">
                              {cm.author_name || cm.author_email || 'Team Member'}
                            </span>
                            <span>{new Date(cm.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{cm.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-2">
                    {activities.map((act) => (
                      <div key={act.id} className="flex items-start gap-2.5 text-xs text-slate-300 py-1">
                        <div className="h-2 w-2 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-semibold text-white">{act.actor_name || 'User'}</span>{' '}
                          <span className="text-slate-400">{act.action}</span>
                          <div className="text-[10px] text-slate-500">{new Date(act.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Action Sidebar */}
            <div className="w-full md:w-64 p-6 bg-slate-950/40 space-y-4">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Add to Deal
              </h5>

              {/* Labels Popover Button */}
              <div className="relative">
                <button
                  onClick={() => setShowLabelsPopover(!showLabelsPopover)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-sky-400" /> Labels
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                </button>

                {showLabelsPopover && (
                  <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-3 shadow-2xl z-20 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold text-white">Pipeline Labels</span>
                      <button
                        onClick={() => setShowLabelsPopover(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {pipelineLabels.map((lbl) => {
                        const isAttached = (deal.labels || []).some((l) => l.id === lbl.id);
                        return (
                          <button
                            key={lbl.id}
                            onClick={() => handleToggleLabel(lbl.id)}
                            className="flex w-full items-center justify-between rounded-lg p-1.5 hover:bg-slate-800 text-left transition"
                          >
                            <span
                              className="rounded px-2 py-0.5 text-xs font-semibold"
                              style={{
                                backgroundColor: `${lbl.color}25`,
                                color: lbl.color,
                              }}
                            >
                              {lbl.name}
                            </span>
                            {isAttached && <Check className="h-3.5 w-3.5 text-sky-400" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Create New Label Form */}
                    <form onSubmit={handleCreateLabel} className="pt-2 border-t border-slate-800 space-y-2">
                      <input
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="New label name..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      <div className="flex items-center justify-between">
                        <input
                          type="color"
                          value={newLabelColor}
                          onChange={(e) => setNewLabelColor(e.target.value)}
                          className="h-6 w-8 rounded cursor-pointer bg-transparent border-0"
                        />
                        <button
                          type="submit"
                          disabled={!newLabelName.trim() || creatingLabel}
                          className="rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-sky-500 disabled:opacity-50"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Add Checklist Trigger */}
              {addingChecklist ? (
                <form onSubmit={handleAddChecklist} className="space-y-2">
                  <input
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="Checklist title..."
                    autoFocus
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!newChecklistTitle.trim()}
                      className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-bold text-white hover:bg-sky-500"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingChecklist(false)}
                      className="rounded-lg p-1 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddingChecklist(true)}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-sky-400" /> Add Checklist
                </button>
              )}

              {/* Contact Information */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Contact Info
                </h5>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      defaultValue={deal.company_name || ''}
                      placeholder="Company name"
                      onBlur={(e) => handleFieldUpdate({ company_name: e.target.value })}
                      className="w-full bg-transparent border-b border-transparent focus:border-sky-500 focus:outline-none text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="email"
                      defaultValue={deal.contact_email || ''}
                      placeholder="Contact email"
                      onBlur={(e) => handleFieldUpdate({ contact_email: e.target.value })}
                      className="w-full bg-transparent border-b border-transparent focus:border-sky-500 focus:outline-none text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="tel"
                      defaultValue={deal.contact_phone || ''}
                      placeholder="Contact phone"
                      onBlur={(e) => handleFieldUpdate({ contact_phone: e.target.value })}
                      className="w-full bg-transparent border-b border-transparent focus:border-sky-500 focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Actions & Lifecycle */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Deal Actions
                </h5>

                {deal.status === 'open' && (
                  <>
                    <button
                      onClick={() => {
                        const wonStage = stages.find((s) => s.is_won);
                        if (wonStage) handleStageChange(wonStage.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl bg-emerald-600/10 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-600/20 transition"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Mark as Won
                    </button>
                    <button
                      onClick={() => setShowLostDialog(true)}
                      className="flex w-full items-center gap-2 rounded-xl bg-rose-600/10 border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-600/20 transition"
                    >
                      <XCircle className="h-4 w-4" /> Mark as Lost
                    </button>
                  </>
                )}

                <button
                  onClick={handleArchive}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  <Archive className="h-3.5 w-3.5 text-slate-400" /> Archive Deal
                </button>

                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-400" /> Delete Deal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Won/Lost dialog */}
      <WonLostDialog
        isOpen={showLostDialog}
        dealTitle={deal?.title}
        onConfirm={handleConfirmLost}
        onCancel={() => setShowLostDialog(false)}
      />
    </div>
  );
}
