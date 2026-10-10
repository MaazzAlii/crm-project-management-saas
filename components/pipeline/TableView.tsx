'use client';

import React, { useState } from 'react';
import { Deal, PipelineStage } from '@/lib/types/pipeline';
import { Download, ArrowUpDown, Building2, Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface TableViewProps {
  deals: Deal[];
  stages: PipelineStage[];
  pipelineId: string;
  onDealClick?: (deal: Deal) => void;
}

export function TableView({ deals, stages, pipelineId, onDealClick }: TableViewProps) {
  const [sortField, setSortField] = useState<keyof Deal>('value');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: keyof Deal) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedDeals = [...deals].sort((a, b) => {
    const aVal = a[sortField] ?? '';
    const bVal = b[sortField] ?? '';
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const getStage = (stageId: string) => stages.find((s) => s.id === stageId);

  const formatCurrency = (val?: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-3">
      {/* Table toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">
          Showing {deals.length} deals
        </span>
        <a
          href={`/api/pipelines/${pipelineId}/export`}
          download
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
        >
          <Download className="h-3.5 w-3.5 text-sky-400" /> Export CSV
        </a>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/90 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th
                onClick={() => handleSort('title')}
                className="p-3.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Title <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5">Stage</th>
              <th
                onClick={() => handleSort('value')}
                className="p-3.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  Value <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5 text-right">Probability</th>
              <th className="p-3.5 text-right">Weighted Value</th>
              <th
                onClick={() => handleSort('expected_close_date')}
                className="p-3.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Close Date <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {sortedDeals.map((deal) => {
              const stage = getStage(deal.stage_id);
              const weighted = (deal.value || 0) * ((deal.probability || 0) / 100);

              return (
                <tr
                  key={deal.id}
                  onClick={() => onDealClick?.(deal)}
                  className="hover:bg-slate-900/70 cursor-pointer transition"
                >
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{deal.title}</div>
                    {(deal.company_name || deal.contact_name) && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {deal.company_name || deal.contact_name}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${stage?.color || '#6366f1'}20`,
                        color: stage?.color || '#6366f1',
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: stage?.color || '#6366f1' }}
                      />
                      {stage?.name || 'Stage'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-sky-400">
                    {formatCurrency(deal.value, deal.currency)}
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-300">
                    {deal.probability}%
                  </td>
                  <td className="p-3.5 text-right font-mono text-slate-400">
                    {formatCurrency(weighted, deal.currency)}
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {deal.expected_close_date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(deal.expected_close_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3.5">
                    {deal.status === 'won' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Won
                      </span>
                    )}
                    {deal.status === 'lost' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                        <XCircle className="h-3 w-3" /> Lost
                      </span>
                    )}
                    {deal.status === 'open' && (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                        Open
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
