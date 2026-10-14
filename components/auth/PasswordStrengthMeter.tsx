'use client'

import React from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { calculatePasswordStrength, PasswordStrengthScore } from '@/lib/auth/password'

interface PasswordStrengthMeterProps {
  password: string
  showChecklist?: boolean
  className?: string
}

export function PasswordStrengthMeter({
  password,
  showChecklist = true,
  className = '',
}: PasswordStrengthMeterProps) {
  const strength: PasswordStrengthScore = calculatePasswordStrength(password)
  const { score, label, hasMinLength, hasUppercase, hasLowercase, hasDigit, hasSymbol } = strength

  // Bar colors according to strength score: semantic tokens bg-destructive, bg-amber-500, bg-emerald-500, bg-muted
  const getSegmentColor = (segmentIndex: number) => {
    if (score < segmentIndex) {
      return 'bg-muted dark:bg-slate-800'
    }
    if (score === 1) return 'bg-destructive'
    if (score === 2) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getLabelColor = () => {
    if (score === 0) return 'text-muted-foreground'
    if (score === 1) return 'text-destructive font-semibold'
    if (score === 2) return 'text-amber-500 font-semibold'
    return 'text-emerald-500 font-semibold'
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* 4-segment visual strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground text-[11px]">Password strength</span>
          <span
            data-testid="strength-label"
            aria-live="polite"
            className={`text-[11px] capitalize transition-colors ${getLabelColor()}`}
          >
            {password.length === 0 ? 'Empty' : label}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5">
          <div
            data-testid="strength-segment-1"
            className={`h-full rounded-full transition-colors duration-200 ${getSegmentColor(1)}`}
          />
          <div
            data-testid="strength-segment-2"
            className={`h-full rounded-full transition-colors duration-200 ${getSegmentColor(2)}`}
          />
          <div
            data-testid="strength-segment-3"
            className={`h-full rounded-full transition-colors duration-200 ${getSegmentColor(3)}`}
          />
          <div
            data-testid="strength-segment-4"
            className={`h-full rounded-full transition-colors duration-200 ${getSegmentColor(4)}`}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {showChecklist && (
        <div className="rounded-xl border border-border bg-card/60 p-3 space-y-1.5 text-[11px] transition-colors">
          <p className="font-medium text-muted-foreground text-[11px]">Requirements:</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              }`}
            >
              {hasMinLength ? (
                <CheckCircle2 className="h-3 w-3 shrink-0" />
              ) : (
                <XCircle className="h-3 w-3 shrink-0 opacity-40" />
              )}
              <span>8+ characters</span>
            </div>
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                hasUppercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              }`}
            >
              {hasUppercase ? (
                <CheckCircle2 className="h-3 w-3 shrink-0" />
              ) : (
                <XCircle className="h-3 w-3 shrink-0 opacity-40" />
              )}
              <span>Uppercase letter</span>
            </div>
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                hasLowercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              }`}
            >
              {hasLowercase ? (
                <CheckCircle2 className="h-3 w-3 shrink-0" />
              ) : (
                <XCircle className="h-3 w-3 shrink-0 opacity-40" />
              )}
              <span>Lowercase letter</span>
            </div>
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                hasDigit ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              }`}
            >
              {hasDigit ? (
                <CheckCircle2 className="h-3 w-3 shrink-0" />
              ) : (
                <XCircle className="h-3 w-3 shrink-0 opacity-40" />
              )}
              <span>Number (0-9)</span>
            </div>
            <div
              className={`flex items-center gap-1.5 col-span-2 transition-colors ${
                hasSymbol ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              }`}
            >
              {hasSymbol ? (
                <CheckCircle2 className="h-3 w-3 shrink-0" />
              ) : (
                <XCircle className="h-3 w-3 shrink-0 opacity-40" />
              )}
              <span>Special character / symbol (e.g. !@#$%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
