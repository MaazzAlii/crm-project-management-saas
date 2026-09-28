/**
 * =============================================================================
 * Innoventix Platform v2 — Communication & Unified Inbox Repository
 * =============================================================================
 * Domain data access layer for Message Threads, Multi-Channel Ingestion & Messages.
 */

import { query, queryOne, transaction } from '../index';
import { buildSelectQuery, buildInsertQuery, buildUpdateQuery, PaginationOptions } from '../query-builder';
import { MessageThread, CommunicationMessage, ChannelType, MessageDirection } from '../../types/database';

export class MessageRepository {
  /**
   * List message threads for an organization with client filter & pagination
   */
  async getThreads(
    orgId: string,
    options?: PaginationOptions & {
      clientId?: string;
      channel?: ChannelType;
      status?: 'open' | 'closed' | 'archived';
    }
  ): Promise<{ threads: MessageThread[]; total: number }> {
    try {
      const where: any[] = [];
      if (options?.clientId) {
        where.push({ field: 'client_id', operator: '=', value: options.clientId });
      }
      if (options?.channel) {
        where.push({ field: 'channel', operator: '=', value: options.channel });
      }
      if (options?.status) {
        where.push({ field: 'status', operator: '=', value: options.status });
      }

      const selectQ = buildSelectQuery({
        table: 'message_threads',
        orgId,
        where,
        pagination: options || { page: 1, limit: 30, orderBy: 'last_message_at', orderDirection: 'DESC' },
      });

      const countSql = `SELECT COUNT(*) as count FROM message_threads WHERE organization_id = $1 ${
        options?.clientId ? 'AND client_id = $2' : ''
      }`;
      const countParams = options?.clientId ? [orgId, options.clientId] : [orgId];

      const [dataRes, countRes] = await Promise.all([
        query<MessageThread>(selectQ.text, selectQ.values),
        queryOne<{ count: string }>(countSql, countParams),
      ]);

      return {
        threads: dataRes.rows,
        total: parseInt(countRes?.count || '0', 10),
      };
    } catch (error) {
      console.error('[MessageRepository.getThreads] Error fetching threads:', error);
      throw error;
    }
  }

  /**
   * Find a specific thread by UUID scoped to organization
   */
  async getThreadById(threadId: string, orgId: string): Promise<MessageThread | null> {
    try {
      return await queryOne<MessageThread>(
        'SELECT * FROM message_threads WHERE id = $1 AND organization_id = $2',
        [threadId, orgId]
      );
    } catch (error) {
      console.error(`[MessageRepository.getThreadById] Error fetching thread ${threadId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new message thread
   */
  async createThread(orgId: string, data: {
    clientId: string;
    channel: ChannelType;
    subject?: string | null;
    externalThreadId?: string | null;
  }): Promise<MessageThread> {
    try {
      const insertData = {
        organization_id: orgId,
        client_id: data.clientId,
        channel: data.channel,
        subject: data.subject || null,
        external_thread_id: data.externalThreadId || null,
        status: 'open',
        last_message_at: new Date(),
      };

      const q = buildInsertQuery('message_threads', insertData);
      const res = await query<MessageThread>(q.text, q.values);
      return res.rows[0];
    } catch (error) {
      console.error('[MessageRepository.createThread] Error creating thread:', error);
      throw error;
    }
  }

  /**
   * Get all messages in a thread
   */
  async getMessages(threadId: string, orgId: string): Promise<CommunicationMessage[]> {
    try {
      const sql = `
        SELECT * FROM communication_messages 
        WHERE thread_id = $1 AND organization_id = $2 
        ORDER BY created_at ASC
      `;
      const res = await query<CommunicationMessage>(sql, [threadId, orgId]);
      return res.rows;
    } catch (error) {
      console.error(`[MessageRepository.getMessages] Error fetching messages for thread ${threadId}:`, error);
      throw error;
    }
  }

  /**
   * Append a message to a thread and update thread metadata
   */
  async createMessage(orgId: string, data: {
    threadId: string;
    clientId: string;
    channel: ChannelType;
    direction: MessageDirection;
    content: string;
    senderIdentifier?: string | null;
    externalMessageId?: string | null;
    metadata?: Record<string, any>;
  }): Promise<CommunicationMessage> {
    return await transaction(async (client) => {
      // 1. Insert message
      const insertData = {
        organization_id: orgId,
        thread_id: data.threadId,
        client_id: data.clientId,
        channel: data.channel,
        direction: data.direction,
        content: data.content,
        sender_identifier: data.senderIdentifier || null,
        external_message_id: data.externalMessageId || null,
        metadata: JSON.stringify(data.metadata || {}),
      };

      const q = buildInsertQuery('communication_messages', insertData);
      const res = await client.query<CommunicationMessage>(q.text, q.values);
      const message = res.rows[0];

      // 2. Update thread's last_message_at and last_message_snippet
      const snippet = data.content.slice(0, 100);
      await client.query(
        `UPDATE message_threads 
         SET last_message_at = NOW(), 
             last_message_snippet = $1,
             updated_at = NOW() 
         WHERE id = $2 AND organization_id = $3`,
        [snippet, data.threadId, orgId]
      );

      return message;
    });
  }

  /**
   * Look up existing thread by external ID or contact identifier (for webhook routing)
   */
  async matchThreadByContact(
    orgId: string,
    channel: ChannelType,
    externalThreadId: string
  ): Promise<MessageThread | null> {
    try {
      return await queryOne<MessageThread>(
        `SELECT * FROM message_threads 
         WHERE organization_id = $1 AND channel = $2 AND external_thread_id = $3`,
        [orgId, channel, externalThreadId]
      );
    } catch (error) {
      console.error('[MessageRepository.matchThreadByContact] Error finding thread:', error);
      throw error;
    }
  }
}

export const messageRepo = new MessageRepository();
