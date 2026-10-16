import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  updateSuperAdminUserAction,
  toggleSuperAdminUserActiveAction,
  deleteSuperAdminUserAction,
} from '@/app/super-admin/user-actions'
import * as db from '@/lib/db'
import * as superAdminAuth from '@/lib/auth/super-admin'
import * as sessionModule from '@/lib/auth/session'
import * as auditLogger from '@/lib/audit/logger'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('ADMIN-1 Super-Admin User Management Server Actions', () => {
  const superAdminUserId = '00000000-0000-4000-8000-000000000001'
  const targetUserId = '00000000-0000-4000-8000-000000000002'

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(superAdminAuth, 'requireSuperAdmin').mockResolvedValue(true as any)
    vi.spyOn(sessionModule, 'getCurrentSessionContext').mockResolvedValue({
      user: { id: superAdminUserId, email: 'admin@innoventix.io' },
      isSuperAdmin: true,
    } as any)
    vi.spyOn(auditLogger, 'logAuditEvent').mockResolvedValue(undefined as any)
  })

  describe('updateSuperAdminUserAction', () => {
    it('rejects empty full name', async () => {
      const res = await updateSuperAdminUserAction(targetUserId, {
        fullName: '   ',
        email: 'valid@example.com',
      })
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/Full name is required/)
    })

    it('rejects invalid email address format', async () => {
      const res = await updateSuperAdminUserAction(targetUserId, {
        fullName: 'Valid Name',
        email: 'invalid-email',
      })
      expect(res.success).toBe(false)
      expect(res.error).toMatch(/valid email/)
    })

    it('rejects duplicate email if already in use by another account', async () => {
      vi.spyOn(db, 'queryOne').mockResolvedValueOnce({ id: 'someone-else-id' } as any)

      const res = await updateSuperAdminUserAction(targetUserId, {
        fullName: 'Jane Doe',
        email: 'existing@example.com',
      })

      expect(res.success).toBe(false)
      expect(res.code).toBe('EMAIL_ALREADY_EXISTS')
    })

    it('successfully updates user and profile when data is valid', async () => {
      vi.spyOn(db, 'queryOne').mockResolvedValueOnce(null) // no duplicate email
      const transactionSpy = vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => {
        const mockClient = { query: vi.fn().mockResolvedValue({ rowCount: 1 }) }
        return cb(mockClient)
      })

      const res = await updateSuperAdminUserAction(targetUserId, {
        fullName: 'Jane Doe Updated',
        email: 'jane.new@example.com',
      })

      expect(res.success).toBe(true)
      expect(transactionSpy).toHaveBeenCalled()
    })
  })

  describe('toggleSuperAdminUserActiveAction', () => {
    it('blocks super-admin from deactivating their own account', async () => {
      const res = await toggleSuperAdminUserActiveAction(superAdminUserId, false)
      expect(res.success).toBe(false)
      expect(res.code).toBe('SELF_DEACTIVATION_BLOCKED')
    })

    it('deactivates target user and revokes active tokens and sessions', async () => {
      const querySpy = vi.spyOn(db, 'query').mockResolvedValue({ rowCount: 1 } as any)

      const res = await toggleSuperAdminUserActiveAction(targetUserId, false)
      expect(res.success).toBe(true)

      // Verify token and session revocation queries were executed
      const calls = querySpy.mock.calls
      expect(calls.some(([sql]: any) => sql.includes('refresh_tokens SET is_revoked = true'))).toBe(true)
      expect(calls.some(([sql]: any) => sql.includes('sessions SET is_active = false'))).toBe(true)
    })

    it('reactivates target user cleanly', async () => {
      const querySpy = vi.spyOn(db, 'query').mockResolvedValue({ rowCount: 1 } as any)

      const res = await toggleSuperAdminUserActiveAction(targetUserId, true)
      expect(res.success).toBe(true)
      const calls = querySpy.mock.calls
      expect(calls.some(([sql]: any) => sql.includes('UPDATE users SET is_active = $1'))).toBe(true)
    })
  })

  describe('deleteSuperAdminUserAction', () => {
    it('blocks super-admin from deleting their own account', async () => {
      const res = await deleteSuperAdminUserAction(superAdminUserId, 'admin@innoventix.io')
      expect(res.success).toBe(false)
      expect(res.code).toBe('SELF_DELETION_BLOCKED')
    })

    it('returns not found if target user does not exist in database', async () => {
      vi.spyOn(db, 'queryOne').mockResolvedValueOnce(null)

      const res = await deleteSuperAdminUserAction(targetUserId, 'missing@example.com')
      expect(res.success).toBe(false)
      expect(res.code).toBe('NOT_FOUND')
    })

    it('rejects deletion with 400 when typed confirmation email does not match user email', async () => {
      vi.spyOn(db, 'queryOne').mockResolvedValueOnce({
        id: targetUserId,
        email: 'target@example.com',
        full_name: 'Target User',
      } as any)

      const res = await deleteSuperAdminUserAction(targetUserId, 'wrong-email@example.com')
      expect(res.success).toBe(false)
      expect(res.code).toBe('TYPED_CONFIRMATION_REQUIRED')
      expect(res.status).toBe(400)
    })

    it('blocks deletion with 400 if user is currently an owner or admin of an organization', async () => {
      vi.spyOn(db, 'queryOne')
        .mockResolvedValueOnce({
          id: targetUserId,
          email: 'target@example.com',
          full_name: 'Target User',
        } as any) // target user exists
        .mockResolvedValueOnce({ count: 2 } as any) // has 2 active ownerships

      const res = await deleteSuperAdminUserAction(targetUserId, 'target@example.com')
      expect(res.success).toBe(false)
      expect(res.code).toBe('USER_HAS_ACTIVE_OWNERSHIP')
      expect(res.status).toBe(400)
      expect(res.error).toMatch(/owner or admin/)
    })

    it('successfully deletes user when typed email matches and user has no active ownerships', async () => {
      vi.spyOn(db, 'queryOne')
        .mockResolvedValueOnce({
          id: targetUserId,
          email: 'target@example.com',
          full_name: 'Target User',
        } as any) // target user exists
        .mockResolvedValueOnce({ count: 0 } as any) // 0 active ownerships

      const transactionSpy = vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => {
        const mockClient = { query: vi.fn().mockResolvedValue({ rowCount: 1 }) }
        return cb(mockClient)
      })

      const res = await deleteSuperAdminUserAction(targetUserId, 'target@example.com')
      expect(res.success).toBe(true)
      expect(transactionSpy).toHaveBeenCalled()
    })
  })
})
