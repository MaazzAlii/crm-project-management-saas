'use client';

/**
 * =============================================================================
 * Access Override Card & Modal for Super Admin (BILL-3B)
 * =============================================================================
 * Allows granting (Lifetime, 1/3/6/12 months, custom date) and revoking
 * plan overrides with real-time effective plan display.
 */

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  Trash2,
  Check,
  User,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { grantPlanOverrideAction, revokePlanOverrideAction } from '@/app/super-admin/plan-override-actions';
import { CurrentPlanResult } from '@/lib/billing/current-plan';
import { OverrideDuration } from '@/lib/services/plan-override';

interface PlanOverrideCardProps {
  orgId: string;
  orgName: string;
  currentOverride: {
    plan_override: string | null;
    plan_override_expires_at?: string | Date | null;
    plan_override_granted_at?: string | Date | null;
    plan_override_granted_by?: string | null;
    plan_override_note?: string | null;
    granter_email?: string | null;
  } | null;
  effectivePlan: CurrentPlanResult;
}

export function PlanOverrideCard({
  orgId,
  orgName,
  currentOverride,
  effectivePlan,
}: PlanOverrideCardProps) {
  const router = useRouter();
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<OverrideDuration>('lifetime');
  const [customDate, setCustomDate] = useState('');
  const [note, setNote] = useState(currentOverride?.plan_override_note || '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasActiveOverride = !!currentOverride?.plan_override;

  // Format expiration date
  const formatExpiry = (d?: string | Date | null) => {
    if (!d) return 'Permanent';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    const isExpired = date.getTime() < Date.now();
    return `${isExpired ? 'Expired: ' : 'Expires: '}${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  };

  const handleGrant = () => {
    setError(null);
    startTransition(async () => {
      const res = await grantPlanOverrideAction({
        organizationId: orgId,
        duration: selectedDuration,
        customExpiresAt: selectedDuration === 'custom' ? customDate : null,
        note: note.trim() || null,
      });

      if (!res.success) {
        setError(res.error || 'Failed to grant override');
      } else {
        setIsGrantOpen(false);
        setError(null);
        router.refresh();
      }
    });
  };

  const handleRevoke = () => {
    setError(null);
    startTransition(async () => {
      const res = await revokePlanOverrideAction(orgId);
      if (!res.success) {
        setError(res.error || 'Failed to revoke override');
      } else {
        setIsRevokeOpen(false);
        setError(null);
        router.refresh();
      }
    });
  };

  // Min date for custom picker (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const durationOptions: { id: OverrideDuration; label: string; desc: string }[] = [
    { id: 'lifetime', label: 'Lifetime VIP', desc: 'Permanent Enterprise access' },
    { id: '1_month', label: '1 Month', desc: 'Sponsored Enterprise (30 days)' },
    { id: '3_month', label: '3 Months', desc: 'Sponsored Enterprise (90 days)' },
    { id: '6_month', label: '6 Months', desc: 'Sponsored Enterprise (180 days)' },
    { id: '12_month', label: '12 Months', desc: 'Sponsored Enterprise (1 year)' },
    { id: 'custom', label: 'Custom Date', desc: 'Choose a specific expiration date' },
  ];

  return (
    <div
      data-testid="plan-override-card"
      className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Access Override Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Grant or revoke sponsored or permanent Enterprise tier access for this tenant.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {hasActiveOverride ? (
            <>
              <button
                type="button"
                onClick={() => setIsGrantOpen(true)}
                data-testid="change-override-btn"
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Change Override
              </button>
              <button
                type="button"
                onClick={() => setIsRevokeOpen(true)}
                data-testid="revoke-override-btn"
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Revoke
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsGrantOpen(true)}
              data-testid="grant-override-btn"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Grant Override
            </button>
          )}
        </div>
      </div>

      {/* Override Status Banner */}
      <div className="rounded-lg border border-border/80 bg-muted/30 p-4">
        {hasActiveOverride ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                ACTIVE OVERRIDE: {currentOverride?.plan_override?.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                {formatExpiry(currentOverride?.plan_override_expires_at)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
              {currentOverride?.granter_email && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>Granted by: <strong className="text-foreground">{currentOverride.granter_email}</strong></span>
                </div>
              )}
              {currentOverride?.plan_override_granted_at && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>
                    Granted on:{' '}
                    <strong className="text-foreground">
                      {new Date(currentOverride.plan_override_granted_at).toLocaleDateString()}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {currentOverride?.plan_override_note && (
              <div className="flex items-start gap-1.5 rounded-md bg-card/60 border border-border p-2.5 text-xs">
                <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Admin Note:</strong> {currentOverride.plan_override_note}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-muted-foreground/60 shrink-0" />
            <div>
              <p className="font-semibold text-foreground">No override active</p>
              <p className="text-[11px] text-muted-foreground">
                This workspace operates under its standard billing subscription plan limits.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time Effective Plan & Entitlements Breakdown */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Current Effective Plan Entitlements
          </h3>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/20 capitalize font-mono">
            Slug: {effectivePlan.effectivePlanId}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="rounded-lg border border-border bg-card p-3">
            <span className="text-muted-foreground block text-[11px]">Max Seats</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {effectivePlan.planConfig.maxMembers}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <span className="text-muted-foreground block text-[11px]">Max Invites</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {effectivePlan.planConfig.maxPendingInvites}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <span className="text-muted-foreground block text-[11px]">Clients</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {effectivePlan.planConfig.maxClients >= 999999 ? 'Unlimited' : effectivePlan.planConfig.maxClients}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <span className="text-muted-foreground block text-[11px]">Projects</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {effectivePlan.planConfig.maxProjects >= 999999 ? 'Unlimited' : effectivePlan.planConfig.maxProjects}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <span className="text-muted-foreground block text-[11px]">Channels</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {effectivePlan.planConfig.maxChannels}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <span className="text-muted-foreground block text-[11px]">AI Requests</span>
            <span className="font-bold text-foreground text-sm mt-0.5 block">
              {effectivePlan.planConfig.maxAIRequestsMonthly}
            </span>
          </div>
        </div>

        {/* Feature Flags Grid */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            {effectivePlan.planConfig.ssoEnabled ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/60" />
            )}
            SSO / SAML
          </span>

          <span className="flex items-center gap-1.5 font-medium">
            {effectivePlan.planConfig.auditLogsEnabled ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/60" />
            )}
            Audit Logs
          </span>

          <span className="flex items-center gap-1.5 font-medium">
            {effectivePlan.planConfig.apiAccessEnabled ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/60" />
            )}
            API Access
          </span>

          <span className="flex items-center gap-1.5 font-medium">
            {effectivePlan.planConfig.clientPortalEnabled ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/60" />
            )}
            Client Portal
          </span>

          <span className="flex items-center gap-1.5 font-medium">
            {effectivePlan.planConfig.emailIntegrationEnabled ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/60" />
            )}
            Email Integration
          </span>
        </div>
      </div>

      {/* Grant Override Modal */}
      {isGrantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  {hasActiveOverride ? 'Update Plan Override' : 'Grant Access Override'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGrantOpen(false);
                  setError(null);
                }}
                className="text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Granting an override grants <strong>Enterprise quotas (500 members, SSO, Audit Logs, API Access)</strong> to{' '}
              <strong className="text-foreground">{orgName}</strong>.
            </p>

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Select Override Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                {durationOptions.map((opt) => {
                  const isSelected = selectedDuration === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={`duration-opt-${opt.id}`}
                      onClick={() => setSelectedDuration(opt.id)}
                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs">{opt.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Date Input */}
            {selectedDuration === 'custom' && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-foreground">
                  Custom Expiration Date
                </label>
                <input
                  type="date"
                  min={minDateStr}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  data-testid="custom-expiry-input"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-ring focus:outline-none"
                />
              </div>
            )}

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Administrative Note (Optional)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Sponsored beta partner, community champion, or founding member."
                data-testid="override-note-input"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
              <span className="text-[10px] text-muted-foreground block text-right">
                {note.length}/500
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsGrantOpen(false);
                  setError(null);
                }}
                disabled={isPending}
                className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrant}
                disabled={isPending || (selectedDuration === 'custom' && !customDate)}
                data-testid="confirm-grant-btn"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm & Grant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {isRevokeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <h3 className="text-base font-bold text-foreground">Revoke Plan Override</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRevokeOpen(false);
                  setError(null);
                }}
                className="text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to revoke the active access override for{' '}
              <strong className="text-foreground">{orgName}</strong>?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The organization will immediately fall back to its underlying subscription plan or the Free tier limits.
            </p>

            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsRevokeOpen(false);
                  setError(null);
                }}
                disabled={isPending}
                className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={isPending}
                data-testid="confirm-revoke-btn"
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
