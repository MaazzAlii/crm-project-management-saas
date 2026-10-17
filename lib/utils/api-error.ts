/**
 * =============================================================================
 * API Error Extractor & User-Friendly Message Mapping
 * =============================================================================
 * Handles extracting and mapping API errors across multiple payload shapes:
 * 1. data.error as a string (raw message or error code)
 * 2. data.error as an object with { message, code }
 * 3. data.message as a top-level string
 * 
 * Maps technical codes (NOT_FOUND, INVALID_STATUS, FORBIDDEN, UNAUTHORIZED)
 * to clear, user-friendly copy while retaining technical details in console only.
 */

export const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: 'The invitation was not found or may have been deleted.',
  INVALID_STATUS: 'This invitation is no longer pending and cannot be revoked.',
  FORBIDDEN: 'You do not have permission to manage team invitations.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  SEAT_LIMIT_REACHED: 'Your team member seat limit has been reached.',
  PENDING_LIMIT_REACHED: 'Your pending invitation limit has been reached.',
};

/**
 * Extracts a human-friendly error string from an API response body.
 * Guaranteed to never return "[object Object]" or raw JSON structures to UI callers.
 *
 * @param data Parsed JSON response payload from fetch
 * @param fallback Default message if no error information can be parsed
 */
export function extractApiError(
  data: any,
  fallback: string = 'An unexpected error occurred. Please try again.'
): string {
  if (!data || typeof data !== 'object') {
    if (typeof data === 'string' && data.trim()) {
      const trimmed = data.trim();
      return FRIENDLY_ERROR_MESSAGES[trimmed] || trimmed;
    }
    return fallback;
  }

  // 1. data.error as a primitive string
  if (typeof data.error === 'string' && data.error.trim()) {
    const errorStr = data.error.trim();
    return FRIENDLY_ERROR_MESSAGES[errorStr] || errorStr;
  }

  // 2. data.error as an object with message and/or code
  if (typeof data.error === 'object' && data.error !== null) {
    if (typeof data.error.message === 'string' && data.error.message.trim()) {
      const msgStr = data.error.message.trim();
      return FRIENDLY_ERROR_MESSAGES[msgStr] || msgStr;
    }
    if (typeof data.error.code === 'string' && data.error.code.trim()) {
      const codeStr = data.error.code.trim();
      if (FRIENDLY_ERROR_MESSAGES[codeStr]) {
        return FRIENDLY_ERROR_MESSAGES[codeStr];
      }
    }
  }

  // 3. data.message as a top-level string
  if (typeof data.message === 'string' && data.message.trim()) {
    const messageStr = data.message.trim();
    return FRIENDLY_ERROR_MESSAGES[messageStr] || messageStr;
  }

  // 4. data.code as top-level code
  if (typeof data.code === 'string' && data.code.trim()) {
    const codeStr = data.code.trim();
    if (FRIENDLY_ERROR_MESSAGES[codeStr]) {
      return FRIENDLY_ERROR_MESSAGES[codeStr];
    }
  }

  return fallback;
}
