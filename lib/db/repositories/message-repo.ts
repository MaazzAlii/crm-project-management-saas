/**
 * =============================================================================
 * Innoventix Platform v2 — Communication & Unified Inbox Repository
 * =============================================================================
 * Domain data access layer for Channels, Message Ingestion & Communications.
 */

import { query, queryOne, transaction } from '../index';
import { buildSelectQuery, buildInsertQuery, PaginationOptions } from '../query-builder';
import { CommunicationChannel, CommunicationMessage, ChannelType, MessageDirection } from '../../types/database';

export class MessageRepository {
  /**
   * Get or create a communication channel for an organization
   */
  async getOrCreateChannel(
    orgId: string,
    provider: ChannelType,
    externalAccountId: string,
    channelName?: string
  ): Promise<CommunicationChannel> {
    try {
      let channel = await queryOne<CommunicationChannel>(
        `SELECT * FROM communication_channels 
         WHERE organization_id = $1 AND provider = $2 AND external_account_id = $3`,
        [orgId, provider, externalAccountId]
      );

      if (!channel) {
        const insert = buildInsertQuery('communication_channels', {
          organization_id: orgId,
          provider,
          external_account_id: externalAccountId,
          channel_name: channelName || `${provider} channel`,
          status: 'active',
        });
        const res = await query<CommunicationChannel>(insert.text, insert.values);
        channel = res.rows[0];
      }

      return channel;
    } catch (error) {
      console.error('[MessageRepository.getOrCreateChannel] Error getting/creating channel:', error);
      throw error;
    }
  }

  /**
   * List messages for an organization with optional client / channel filters
   */
  async getMessages(
    orgId: string,
    options?: PaginationOptions & {
      clientId?: string;
      channelId?: string;
    }
  ): Promise<{ messages: CommunicationMessage[]; total: number }> {
    try {
      const where: any[] = [];
      if (options?.clientId) {
        where.push({ field: 'client_id', operator: '=', value: options.clientId });
      }
      if (options?.channelId) {
        where.push({ field: 'channel_id', operator: '=', value: options.channelId });
      }

      const selectQ = buildSelectQuery({
        table: 'communication_messages',
        orgId,
        where,
        pagination: options || { page: 1, limit: 50, orderBy: 'sent_at', orderDirection: 'DESC' },
      });

      const countSql = `SELECT COUNT(*) as count FROM communication_messages WHERE organization_id = $1 ${
        options?.clientId ? 'AND client_id = $2' : ''
      }`;
      const countParams = options?.clientId ? [orgId, options.clientId] : [orgId];

      const [dataRes, countRes] = await Promise.all([
        query<CommunicationMessage>(selectQ.text, selectQ.values),
        queryOne<{ count: string }>(countSql, countParams),
      ]);

      return {
        messages: dataRes.rows,
        total: parseInt(countRes?.count || '0', 10),
      };
    } catch (error) {
      console.error('[MessageRepository.getMessages] Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Insert an incoming or outgoing communication message
   */
  async createMessage(orgId: string, data: {
    channelId: string;
    clientId?: string | null;
    direction: MessageDirection;
    body: string;
    senderName?: string | null;
    senderIdentifier?: string | null;
    externalMessageId?: string | null;
    metadata?: Record<string, any>;
  }): Promise<CommunicationMessage> {
    try {
      const insertData = {
        organization_id: orgId,
        channel_id: data.channelId,
        client_id: data.clientId || null,
        direction: data.direction,
        body: data.body,
        sender_name: data.senderName || null,
        sender_identifier: data.senderIdentifier || null,
        external_message_id: data.externalMessageId || null,
        metadata: JSON.stringify(data.metadata || {}),
      };

      const q = buildInsertQuery('communication_messages', insertData);
      const res = await query<CommunicationMessage>(q.text, q.values);
      return res.rows[0];
    } catch (error) {
      console.error('[MessageRepository.createMessage] Error creating message:', error);
      throw error;
    }
  }
}

export const messageRepo = new MessageRepository();
