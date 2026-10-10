'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Target, AlertCircle, BarChart3, PieChart } from 'lucide-react';

interface ForecastData {
  totalOpenValue: number;
  weightedForecast: number;
  totalOpenDeals: number;
  avgDealSize: number;
  winRate: number;
  wonThisMonth: { count: number; value: number };
  lostThisMonth: { count: number; value: number };
  lostReasons: { reason: string; count: number; totalValue: number }[];
  monthlyForecast: {
    month: string;
    totalValue: number;
    weightedValue: number;
    dealsCount: number;
  }[];
}

interface ForecastViewProps {
  pipelineId: string;
}

export function ForecastView({ pipelineId }: ForecastViewProps) {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch(`/api/pipelines/${pipelineId}/stats`);
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        }
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [pipelineId]);

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  // Calculate max monthly value for SVG chart scaling
  const maxMonthValue = Math.max(
    ...data.monthlyForecast.map((m) => m.totalValue),
    10000
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Weighted Pipeline Forecast</span>
            <TrendingUp className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {formatCurrency(data.weightedForecast)}
          </div>
          <div className="text-[11px] text-slate-400">
            Total Pipeline: <span className="text-slate-300 font-mono">{formatCurrency(data.totalOpenValue)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Average Deal Size</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {formatCurrency(data.avgDealSize)}
          </div>
          <div className="text-[11px] text-slate-400">
            Active Deals: <span className="text-slate-300 font-mono">{data.totalOpenDeals}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">90-Day Win Rate</span>
            <Target className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-xl font-extrabold text-purple-400 font-mono">
            {data.winRate}%
          </div>
          <div className="text-[11px] text-slate-400">
            Won: {data.wonThisMonth.count} this month
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Won Revenue (This Month)</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {formatCurrency(data.wonThisMonth.value)}
          </div>
          <div className="text-[11px] text-slate-400">
            Lost: {formatCurrency(data.lostThisMonth.value)} ({data.lostThisMonth.count} deals)
          </div>
        </div>
      </div>

      {/* Monthly Forecast Bar Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Monthly Deal Forecast Projections</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-sky-500" />
              <span className="text-slate-400">Total Value</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
              <span className="text-slate-400">Weighted Value</span>
            </div>
          </div>
        </div>

        {data.monthlyForecast.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-slate-500">
            No forecast data available for upcoming months.
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {data.monthlyForecast.map((m) => {
              const totalPct = Math.round((m.totalValue / maxMonthValue) * 100);
              const weightedPct = Math.round((m.weightedValue / maxMonthValue) * 100);

              return (
                <div key={m.month} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 font-mono">{m.month}</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {formatCurrency(m.weightedValue)} (Weighted) / {formatCurrency(m.totalValue)} (Total) · {m.dealsCount} deals
                    </span>
                  </div>
                  <div className="h-4 w-full rounded-lg bg-slate-950/80 p-0.5 relative overflow-hidden flex gap-1">
                    <div
                      className="h-full rounded bg-sky-500/80 transition-all duration-300"
                      style={{ width: `${totalPct}%` }}
                    />
                    <div
                      className="h-full rounded bg-emerald-500/90 transition-all duration-300 absolute top-0.5 left-0.5 bottom-0.5"
                      style={{ width: `${weightedPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lost Reasons Analytics Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400" />
          <h3 className="text-sm font-bold text-white">Lost Deals Analysis by Reason</h3>
        </div>

        {data.lostReasons.length === 0 ? (
          <p className="text-xs text-slate-500">No lost deals recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.lostReasons.map((lr) => (
              <div
                key={lr.reason}
                className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 space-y-1"
              >
                <div className="text-xs font-semibold text-slate-200 truncate">{lr.reason}</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-rose-400 font-mono">{lr.count} deals</span>
                  <span className="text-xs font-mono text-slate-400">{formatCurrency(lr.totalValue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
