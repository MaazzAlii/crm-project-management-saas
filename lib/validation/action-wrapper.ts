import { z, ZodError } from 'zod'
import { sanitizeObject } from './sanitize'

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Validates and sanitizes raw input against a Zod schema.
 * Rejects invalid payloads with clean user-friendly messages without leaking internal system details.
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  rawInput: unknown
): ValidationResult<T> {
  try {
    // 1. Pre-sanitize strings in input to neutralize potential injection payloads
    const sanitizedInput = sanitizeObject(rawInput)

    // 2. Parse against schema
    const parsed = schema.parse(sanitizedInput)

    return {
      success: true,
      data: parsed,
    }
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {}
      const firstError = err.issues[0]?.message || 'Invalid input parameters.'

      err.issues.forEach((issue) => {
        const path = issue.path.join('.') || 'general'
        if (!fieldErrors[path]) {
          fieldErrors[path] = []
        }
        fieldErrors[path].push(issue.message)
      })

      return {
        success: false,
        error: firstError,
        fieldErrors,
      }
    }

    return {
      success: false,
      error: 'Malformed or invalid input data.',
    }
  }
}
