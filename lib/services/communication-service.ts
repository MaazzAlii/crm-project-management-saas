/**
 * =============================================================================
 * Innoventix Platform v2 — Communication & Unified Inbox Service
 * =============================================================================
 * Business logic layer for Multi-Channel Messaging, Ingestion, Dispatch, and Channels.
 */

import { messageRepo } from '../db/repositories/message-repo';
import { clientRepo } from '../db/repositories/client-repo';
import { auditRepo } from '../db/repositories/audit-repo';
import { query, queryOne } from '../db';
import { NotFoundError } from '../utils/error-handler';
import { ChannelType, MessageDirection, PaginationOptions } from '../types/database';

export class CommunicationService {
  /**
   * Ingest an inbound message from an external channel (Slack, WhatsApp, Email, etc.)
   */
  async ingestInboundMessage(
    orgId: string,
    data: {
      provider: ChannelType;
      externalAccountId: string;
      senderIdentifier: string;
      senderName?: string | null;
      body: string;
      externalMessageId?: string | null;
      metadata?: Record<string, any>;
    }
  ) {
    // 1. Get or create channel
    const channel = await messageRepo.getOrCreateChannel(
      orgId,
      data.provider,
      data.externalAccountId
    );

    // 2. Try auto-matching to a connected client
    let matchedClientId: string | null = null;
    const client = await clientRepo.findByContact(orgId, data.senderIdentifier);
    if (client && client.communication_mode === 'connected') {
      matchedClientId = client.id;
    }

    // 3. Store message
    const message = await messageRepo.createMessage(orgId, {
      channelId: channel.id,
      clientId: matchedClientId,
      direction: 'inbound',
      body: data.body,
      senderName: data.senderName,
      senderIdentifier: data.senderIdentifier,
      externalMessageId: data.externalMessageId,
      metadata: data.metadata,
    });

    return message;
  }

  /**
   * Dispatch an outbound message to a client via channel
   */
  async sendMessage(
    orgId: string,
    actorUserId: string,
    data: {
      channelId: string;
      clientId?: string | null;
      body: string;
      senderName?: string;
    }
  ) {
    const message = await messageRepo.createMessage(orgId, {
      channelId: data.channelId,
      clientId: data.clientId || null,
      direction: 'outbound',
      body: data.body,
      senderName: data.senderName || 'Team Member',
    });

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'COMMUNICATION_MESSAGE_SENT',
      resourceType: 'message',
      resourceId: message.id,
      metadata: { clientId: data.clientId, channelId: data.channelId },
    });

    return message;
  }

  /**
   * Get single message by ID
   */
  async getMessage(messageId: string, orgId: string) {
    const res = await queryOne('SELECT * FROM communication_messages WHERE id = $1 AND organization_id = $2', [
      messageId,
      orgId,
    ]);
    if (!res) {
      throw new NotFoundError('Message not found');
    }
    return res;
  }

  /**
   * Get messages for an organization / client
   */
  async getMessages(
    orgId: string,
    options?: PaginationOptions & { clientId?: string; channelId?: string }
  ) {
    return await messageRepo.getMessages(orgId, options);
  }

  /**
   * Get all communication channels configured for the organization
   */
  async getChannels(orgId: string) {
    const res = await query('SELECT * FROM communication_channels WHERE organization_id = $1 ORDER BY provider ASC', [
      orgId,
    ]);
    return res.rows;
  }

  /**
   * Configure or link a communication channel
   */
  async configureChannel(
    orgId: string,
    actorUserId: string,
    data: {
      provider: ChannelType;
      externalAccountId: string;
      name?: string;
    }
  ) {
    const channel = await messageRepo.getOrCreateChannel(
      orgId,
      data.provider,
      data.externalAccountId
    );

    await auditRepo.log({
      organizationId: orgId,
      userId: actorUserId,
      action: 'COMMUNICATION_CHANNEL_CONFIGURED',
      resourceType: 'channel',
      resourceId: channel.id,
      metadata: { provider: data.provider, externalAccountId: data.externalAccountId },
    });

    return channel;
  }

  /**
   * Get communication history for a specific client
   */
  async getClientHistory(orgId: string, clientId: string, options?: PaginationOptions) {
    return await messageRepo.getMessages(orgId, {
      ...options,
      clientId,
    });
  }
}

export const communicationService = new CommunicationService();
