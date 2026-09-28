/**
 * =============================================================================
 * Innoventix Platform v2 — User Service
 * =============================================================================
 * Business logic layer for User Management, Profile updates, Preferences, and Security.
 */

import { userRepo } from '../db/repositories/user-repo';
import { auditRepo } from '../db/repositories/audit-repo';
import { query, queryOne } from '../db';
import { hashPassword } from '../auth/password';
import { NotFoundError, ValidationError, ConflictError } from '../utils/error-handler';
import { User, PaginationOptions } from '../types/database';

export class UserService {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<User> {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  /**
   * Update user profile details
   */
  async updateProfile(
    userId: string,
    data: {
      fullName?: string | null;
      avatarUrl?: string | null;
    }
  ): Promise<User> {
    const updated = await userRepo.update(userId, data);
    if (!updated) {
      throw new NotFoundError('User not found or inactive');
    }

    await auditRepo.log({
      userId,
      action: 'USER_PROFILE_UPDATED',
      resourceType: 'user',
      resourceId: userId,
      metadata: { fields: Object.keys(data) },
    });

    return updated;
  }

  /**
   * Get user preferences (UI theme, notifications, defaults)
   */
  async getUserPreferences(userId: string): Promise<Record<string, any>> {
    const row = await queryOne<{ preferences: any }>('SELECT preferences FROM users WHERE id = $1', [userId]);
    if (!row) {
      throw new NotFoundError('User not found');
    }
    return row.preferences || {};
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<Record<string, any>> {
    const row = await queryOne<{ preferences: any }>(
      'UPDATE users SET preferences = COALESCE(preferences, \'{}\'::jsonb) || $2::jsonb, updated_at = NOW() WHERE id = $1 RETURNING preferences',
      [userId, JSON.stringify(preferences)]
    );
    if (!row) {
      throw new NotFoundError('User not found');
    }

    await auditRepo.log({
      userId,
      action: 'USER_PREFERENCES_UPDATED',
      resourceType: 'user',
      resourceId: userId,
      metadata: { keys: Object.keys(preferences) },
    });

    return row.preferences;
  }

  /**
   * Admin: Create a new user directly
   */
  async adminCreateUser(data: {
    email: string;
    password: string;
    fullName?: string;
    role?: 'user' | 'org_admin' | 'super_admin';
  }): Promise<User> {
    const existing = await userRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await userRepo.create({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: data.role || 'user',
    });

    return user;
  }

  /**
   * Admin: Deactivate a user
   */
  async deactivateUser(userId: string, actorUserId: string): Promise<boolean> {
    const user = await this.getUserProfile(userId);
    const deactivated = await userRepo.deactivate(userId);

    await auditRepo.log({
      userId: actorUserId,
      action: 'USER_DEACTIVATED',
      resourceType: 'user',
      resourceId: userId,
      metadata: { email: user.email },
    });

    return deactivated;
  }

  /**
   * Get all organizations the user belongs to
   */
  async getUserOrganizations(userId: string) {
    return await userRepo.getMemberships(userId);
  }

  /**
   * List users with pagination (Admin access)
   */
  async listUsers(pagination?: PaginationOptions & { search?: string }) {
    if (pagination?.search) {
      const search = `%${pagination.search}%`;
      const page = pagination.page || 1;
      const limit = pagination.limit || 20;
      const offset = (page - 1) * limit;

      const [usersRes, countRes] = await Promise.all([
        query<User>(
          'SELECT * FROM users WHERE is_active = true AND (email ILIKE $1 OR full_name ILIKE $1) ORDER BY created_at DESC LIMIT $2 OFFSET $3',
          [search, limit, offset]
        ),
        queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM users WHERE is_active = true AND (email ILIKE $1 OR full_name ILIKE $1)',
          [search]
        ),
      ]);

      return {
        users: usersRes.rows,
        total: parseInt(countRes?.count || '0', 10),
      };
    }

    return await userRepo.list(pagination);
  }
}

export const userService = new UserService();
