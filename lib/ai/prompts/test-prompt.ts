import { AIChatMessage } from '../types'

/**
 * Basic health-check prompt for self-testing provider connectivity and latency.
 */
export function buildTestPrompt(pingMessage: string = 'Ping!'): AIChatMessage[] {
  return [
    {
      role: 'system',
      content: 'You are an AI system health-check responder. Reply briefly confirming connectivity and status.',
    },
    {
      role: 'user',
      content: pingMessage,
    },
  ]
}
