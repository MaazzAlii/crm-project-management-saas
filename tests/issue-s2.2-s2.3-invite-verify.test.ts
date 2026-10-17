import { describe, it, expect } from 'vitest';
import { extractApiError } from '@/lib/utils/api-error';
import { AcceptInviteButton, handleAcceptError } from '@/app/invite/[token]/AcceptInviteButton';

describe('ISSUE-S2.2 & S2.3: Invite Expiry & Invalidation Error Handling', () => {
  it('AcceptInviteButton component is exported', () => {
    expect(AcceptInviteButton).toBeDefined();
    expect(typeof AcceptInviteButton).toBe('function');
  });

  it('handleAcceptError extracts human-readable message from 410 EXPIRED response shape, preventing [object Object]', () => {
    // Exact response shape returned by POST /api/invitations/accept when token has expired
    const expiredApiResponse: Record<string, any> = {
      success: false,
      error: {
        message:
          'This invitation has expired. Invitations are valid for 7 days. Please request a new invitation from your workspace administrator.',
        code: 'EXPIRED',
      },
    };

    // Calls the real handleAcceptError from AcceptInviteButton
    const errorMessage = handleAcceptError(expiredApiResponse);
    expect(typeof errorMessage).toBe('string');
    expect(errorMessage).not.toBe('[object Object]');
    expect(errorMessage).not.toContain('[object Object]');
    expect(errorMessage).toBe(
      'This invitation has expired. Invitations are valid for 7 days. Please request a new invitation from your workspace administrator.'
    );

    // When used in new Error(errorMessage).message as done in AcceptInviteButton
    const errorInstance = new Error(errorMessage);
    expect(errorInstance.message).toBe(
      'This invitation has expired. Invitations are valid for 7 days. Please request a new invitation from your workspace administrator.'
    );
  });

  it('handleAcceptError extracts human-readable message from 400 invalid_or_expired response shape, preventing [object Object]', () => {
    // Exact response shape returned when old invalidated token is submitted
    const invalidatedApiResponse: Record<string, any> = {
      success: false,
      error: {
        message: 'This invitation is invalid or has expired',
        code: 'INVALID_OR_EXPIRED',
      },
    };

    // Calls the real handleAcceptError from AcceptInviteButton
    const errorMessage = handleAcceptError(invalidatedApiResponse);
    expect(typeof errorMessage).toBe('string');
    expect(errorMessage).not.toBe('[object Object]');
    expect(errorMessage).not.toContain('[object Object]');
    expect(errorMessage).toBe('This invitation is invalid or has expired');

    const errorInstance = new Error(errorMessage);
    expect(errorInstance.message).toBe('This invitation is invalid or has expired');
  });

  it('extractApiError handles technical error codes and fallback cleanly', () => {
    expect(extractApiError({ error: { code: 'NOT_FOUND' } })).toBe(
      'The invitation was not found or may have been deleted.'
    );
    expect(extractApiError({ error: { code: 'FORBIDDEN' } })).toBe(
      'You do not have permission to manage team invitations.'
    );
    expect(extractApiError(null, 'Fallback error message')).toBe('Fallback error message');
  });
});
