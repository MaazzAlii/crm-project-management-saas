/**
 * =============================================================================
 * Innoventix Platform v2 — User Repository
 * =============================================================================
 * Domain data access layer for Users, Roles, and Authentication persistence.
 */

import { query, queryOne, transaction } from '../index';
import { buildSelectQuery, buildInsertQuery, buildUpdateQuery, PaginationOptions } from '../query-builder';
import { User, UserRole } from '../../types/database';

export class UserRepository {
  /**
   * Find a user by UUID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await queryOne<User>('SELECT * FROM users WHERE id = $1 AND is_active = true', [id]);
    } catch (error) {
      console.error(`[UserRepository.findById] Error fetching user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const normalized = email.toLowerCase().trim();
      return await queryOne<User>('SELECT * FROM users WHERE email = $1 AND is_active = true', [normalized]);
    } catch (error) {
      console.error(`[UserRepository.findByEmail] Error fetching user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user record
   */
  async create(data: {
    email: string;
    passwordHash: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    role?: UserRole;
  }): Promise<User> {
    return await transaction(async (client) => {
      const normalizedEmail = data.email.toLowerCase().trim();
      const insertData: Record<string, any> = {
        email: normalizedEmail,
        password_hash: data.passwordHash,
        full_name: data.fullName || null,
        avatar_url: data.avatarUrl || null,
        role: data.role || 'user',
        is_active: true,
        email_verified: false,
      };

      const q = buildInsertQuery('users', insertData);
      const res = await client.query<User>(q.text, q.values);
      const user = res.rows[0];

      // Mirror to auth.users and public.profiles for relational FK compatibility
      try {
        await client.query(
          'INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [user.id, normalizedEmail]
        );
        await client.query(
          `INSERT INTO public.profiles (id, email, full_name, avatar_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [user.id, normalizedEmail, user.full_name, user.avatar_url]
        );
      } catch {
        // Safe fallback if compatibility schema is not in use
      }

      return user;
    });
  }

  /**
   * Update user details
   */
  async update(
    id: string,
    data: {
      fullName?: string | null;
      avatarUrl?: string | null;
      passwordHash?: string;
      emailVerified?: boolean;
      role?: UserRole;
    }
  ): Promise<User | null> {
    try {
      const updateData: Record<string, any> = {};
      if (data.fullName !== undefined) updateData.full_name = data.fullName;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
      if (data.passwordHash !== undefined) updateData.password_hash = data.passwordHash;
      if (data.emailVerified !== undefined) updateData.email_verified = data.emailVerified;
      if (data.role !== undefined) updateData.role = data.role;
      updateData.updated_at = new Date();

      const q = buildUpdateQuery({
        table: 'users',
        data: updateData,
        id,
      });

      const res = await query<User>(q.text, q.values);
      return res.rows[0] || null;
    } catch (error) {
      console.error(`[UserRepository.update] Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update user last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      await query('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [id]);
    } catch (error) {
      console.error(`[UserRepository.updateLastLogin] Error updating last_login_at for ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a user (soft delete)
   */
  async deactivate(id: string): Promise<boolean> {
    try {
      const res = await query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    } catch (error) {
      console.error(`[UserRepository.deactivate] Error deactivating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * List users with optional pagination
   */
  async list(pagination?: PaginationOptions): Promise<{ users: User[]; total: number }> {
    try {
      const selectQ = buildSelectQuery({
        table: 'users',
        where: [{ field: 'is_active', operator: '=', value: true }],
        pagination: pagination || { page: 1, limit: 20, orderBy: 'created_at', orderDirection: 'DESC' },
      });

      const [dataRes, countRes] = await Promise.all([
        query<User>(selectQ.text, selectQ.values),
        queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      ]);

      return {
        users: dataRes.rows,
        total: parseInt(countRes?.count || '0', 10),
      };
    } catch (error) {
      console.error('[UserRepository.list] Error listing users:', error);
      throw error;
    }
  }

  /**
   * Get all organization memberships for a user
   */
  async getMemberships(userId: string): Promise<Array<{
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    role: string;
  }>> {
    try {
      const sql = `
        SELECT 
          m.organization_id as "organizationId",
          o.name as "organizationName",
          o.slug as "organizationSlug",
          m.role
        FROM organization_members m
        JOIN organizations o ON o.id = m.organization_id
        WHERE m.user_id = $1 AND o.is_suspended = false
        ORDER BY m.created_at ASC
      `;
      const res = await query(sql, [userId]);
      return res.rows;
    } catch (error) {
      console.error(`[UserRepository.getMemberships] Error fetching memberships for ${userId}:`, error);
      throw error;
    }
  }
}

export const userRepo = new UserRepository();
