import { describe, it, expect } from 'vitest';
import { extractApiError } from '@/lib/utils/api-error';

describe('ISSUE-S2.2 & S2.3: Invite Expiry & Invalidation Error Handling', () => {
  it('extracts human-readable message from 410 EXPIRED response shape, preventing [object Object]', () => {
    // Exact response shape returned by POST /api/invitations/accept when token has expired
    const expiredApiResponse: Record<string, any> = {
      success: false,
      error: {
        message:
          'This invitation has expired. Invitations are valid for 7 days. Please request a new invitation from your workspace administrator.',
        code: 'EXPIRED',
      },
    };

    // The defective implementation in AcceptInviteButton.tsx did:
    // throw new Error(data.message || data.error || 'Failed to accept invitation')
    const oldDefectiveExtracted = expiredApiResponse.message || expiredApiResponse.error;
    const oldErrorMessage = new Error(oldDefectiveExtracted as any).message;
    expect(oldErrorMessage).toBe('[object Object]'); // Confirms the reproduction of the bug!

    // The fixed implementation uses extractApiError:
    const friendlyMessage = extractApiError(expiredApiResponse, 'Failed to accept invitation');
    expect(friendlyMessage).not.toBe('[object Object]');
    expect(friendlyMessage).not.toContain('[object Object]');
    expect(friendlyMessage).toBe(
      'This invitation has expired. Invitations are valid for 7 days. Please request a new invitation from your workspace administrator.'
    );

    // When passed to new Error(friendlyMessage):
    const newErrorMessage = new Error(friendlyMessage).message;
    expect(newErrorMessage).toBe(
      'This invitation has expired. Invitations are valid for 7 days. Please request a new invitation from your workspace administrator.'
    );
  });

  it('extracts human-readable message from 400 invalid_or_expired response shape, preventing [object Object]', () => {
    // Exact response shape returned when old invalidated token is submitted
    const invalidatedApiResponse: Record<string, any> = {
      success: false,
      error: {
        message: 'This invitation is invalid or has expired',
        code: 'INVALID_OR_EXPIRED',
      },
    };

    // Defective implementation reproduction
    const oldDefectiveExtracted = invalidatedApiResponse.message || invalidatedApiResponse.error;
    const oldErrorMessage = new Error(oldDefectiveExtracted as any).message;
    expect(oldErrorMessage).toBe('[object Object]');

    // Fixed implementation
    const friendlyMessage = extractApiError(invalidatedApiResponse, 'Failed to accept invitation');
    expect(friendlyMessage).not.toBe('[object Object]');
    expect(friendlyMessage).not.toContain('[object Object]');
    expect(friendlyMessage).toBe('This invitation is invalid or has expired');
  });

  it('handles technical error codes and fallback cleanly', () => {
    expect(extractApiError({ error: { code: 'NOT_FOUND' } })).toBe(
      'The invitation was not found or may have been deleted.'
    );
    expect(extractApiError({ error: { code: 'FORBIDDEN' } })).toBe(
      'You do not have permission to manage team invitations.'
    );
    expect(extractApiError(null, 'Fallback error message')).toBe('Fallback error message');
  });
});
