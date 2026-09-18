import { AIChatMessage } from '../types'

export interface TaskExtractionInput {
  messageBody: string
  senderName: string
  clientName?: string
  projectName?: string
  channel?: string
}

/**
 * Builds system and user prompt for Task 46 — Auto-Task Extraction from Messages.
 */
export function buildTaskExtractionPrompt(input: TaskExtractionInput): AIChatMessage[] {
  const systemPrompt = `You are an agile project management assistant specialized in identifying deliverables, action items, and bug reports from client communication.

Your goal is to parse the client message and extract all explicit or strongly implied actionable tasks.

Guidelines:
1. Each task must have:
   - "title": Action-oriented imperative statement (e.g. "Update landing page mobile CTA color")
   - "description": Contextual details from the client request
   - "priority": "low" | "medium" | "high" | "urgent"
   - "estimatedHours": Realistic agency hours (e.g. 1, 2, 4, 8)
   - "suggestedAssigneeRole": e.g. "Frontend Engineer", "UI/UX Designer", "Account Manager", "QA Specialist"
2. Do not invent tasks if the message contains only courtesy greetings or general conversation.
3. If no actionable tasks exist, return an empty array {"tasks": []}.
4. Output strictly valid JSON matching this schema:
{
  "tasks": [
    {
      "title": "...",
      "description": "...",
      "priority": "medium",
      "estimatedHours": 2,
      "suggestedAssigneeRole": "Frontend Engineer"
    }
  ]
}`

  const userPrompt = `Client: ${input.clientName || 'Client'}
Sender: ${input.senderName}
Associated Project: ${input.projectName || 'General Workspace'}
Channel: ${input.channel || 'Direct Message'}

Message Content:
"""
${input.messageBody}
"""

Extract actionable project tasks from this message into the JSON schema.`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}
