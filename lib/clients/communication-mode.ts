import { createClient } from '@/lib/supabase/server'

export type CommunicationMode = 'manual' | 'connected'

/**
 * Checks whether an organization has at least one active communication channel
 * configured (Slack, WhatsApp, Email, Discord, Upwork).
 */
export async function hasActiveChannels(organizationId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('communication_channels')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (!error && typeof count === 'number') {
      return count > 0
    }
  } catch (err) {
    console.error('[CommunicationMode] Error checking active channels:', err)
  }

  return false
}

/**
 * Resolves the default communication mode for a new client.
 * Defaults to 'connected' when active channels exist for the org,
 * or 'connected' as the standard platform default.
 */
export async function getDefaultCommunicationMode(
  organizationId: string
): Promise<CommunicationMode> {
  const hasChannels = await hasActiveChannels(organizationId)
  return hasChannels ? 'connected' : 'connected'
}

/**
 * Validates the strict one-way transition rule:
 * - manual -> connected: ALLOWED
 * - connected -> manual: BLOCKED (permanent transition)
 * - connected -> connected: IDEMPOTENT (no-op)
 */
export function validateModeTransition(
  currentMode: string | undefined | null,
  targetMode: string
): { valid: boolean; error?: string } {
  const normalizedCurrent = (currentMode || 'manual').toLowerCase()
  const normalizedTarget = targetMode.toLowerCase()

  if (normalizedCurrent === 'connected' && normalizedTarget === 'manual') {
    return {
      valid: false,
      error: 'Connected mode is permanent and cannot be reverted to manual. This preserves synced communication history and audit logs.',
    }
  }

  return { valid: true }
}

/**
 * Returns true if the client is eligible to be upgraded from manual to connected mode.
 */
export function canSwitchToConnected(currentMode: string | undefined | null): boolean {
  return (currentMode || 'manual').toLowerCase() === 'manual'
}

/**
 * Helper to check if auto-sync is active for a client record.
 */
export function isClientAutoSyncEnabled(mode?: string | null): boolean {
  return (mode || 'manual').toLowerCase() === 'connected'
}

/**
 * Visual badge metadata for UI presentation across CRM views.
 */
export function getModeBadgeInfo(mode?: string | null) {
  const isConnected = isClientAutoSyncEnabled(mode)

  if (isConnected) {
    return {
      mode: 'connected' as const,
      label: 'Connected Hub',
      shortLabel: 'Connected',
      sublabel: 'Auto-Sync Active',
      color: 'emerald',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description:
        'Inbound & outbound messages across WhatsApp, Slack, Email, Discord, and Upwork are automatically synced to the Unified Inbox.',
      isPermanent: true,
    }
  }

  return {
    mode: 'manual' as const,
    label: 'Manual Mode',
    shortLabel: 'Manual',
    sublabel: 'Manual Entry Only',
    color: 'sky',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    description:
      'Communications are logged by hand via calls, meetings, and off-platform notes. Automated webhooks do not sync to this profile.',
    isPermanent: false,
  }
}
