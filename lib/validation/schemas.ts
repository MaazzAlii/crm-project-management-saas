import { z } from 'zod'

// ==========================================
// 1. Common Utility / Scalar Validators
// ==========================================

export const UUIDSchema = z.string().uuid('Invalid identifier format')

export const SafeStringSchema = z
  .string()
  .trim()
  .max(1000, 'Input exceeds maximum length of 1000 characters')

export const SafeTextSchema = z
  .string()
  .trim()
  .max(10000, 'Text content exceeds maximum length of 10000 characters')

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address')
  .max(255, 'Email cannot exceed 255 characters')

export const PhoneSchema = z
  .string()
  .trim()
  .max(50, 'Phone number cannot exceed 50 characters')
  .regex(/^[+\d\s\-()]*$/, 'Phone number contains invalid characters')
  .optional()
  .nullable()

export const CurrencySchema = z
  .enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'AED', 'SAR', 'SGD'])
  .default('USD')

export const UrlSchema = z
  .string()
  .trim()
  .url('Must be a valid URL starting with http:// or https://')
  .max(2048, 'URL exceeds maximum length')
  .optional()
  .nullable()

// ==========================================
// 2. Client Schemas
// ==========================================

export const CreateClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Client name must be at least 2 characters')
    .max(255, 'Client name cannot exceed 255 characters'),
  company: z.string().trim().max(255).optional().nullable(),
  email: EmailSchema.optional().nullable(),
  phone: PhoneSchema,
  platform: z
    .enum(['WhatsApp', 'Slack', 'Email', 'Discord', 'Upwork', 'Other'])
    .default('WhatsApp'),
  country: z.string().trim().max(100).optional().nullable(),
  currency: CurrencySchema,
  payment_schedule: z
    .enum(['Per Project', 'Monthly', 'Weekly', 'Milestone', 'Hourly'])
    .default('Per Project'),
  communication_mode: z.enum(['manual', 'connected']).default('connected'),
  notes: SafeTextSchema.optional().nullable(),
})

export const UpdateClientSchema = CreateClientSchema.partial().extend({
  id: UUIDSchema.optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
})

// ==========================================
// 3. Project Schemas
// ==========================================

export const CreateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project title must be at least 2 characters')
    .max(255, 'Project title cannot exceed 255 characters'),
  client_id: UUIDSchema,
  description: SafeTextSchema.optional().nullable(),
  type: z
    .enum(['UGC Media', 'AI Voice Agent', 'Automation', 'Combined', 'Custom', 'Consulting'])
    .default('Custom'),
  brief_source: z
    .enum(['WhatsApp', 'Slack', 'Upwork', 'Discord', 'Email', 'Portal', 'Manual'])
    .default('Manual'),
  budget: z
    .coerce
    .number()
    .min(0, 'Project budget cannot be negative')
    .max(10000000, 'Budget exceeds allowable threshold')
    .default(0),
  currency: CurrencySchema,
  status: z
    .enum(['planning', 'brief_received', 'in_progress', 'review', 'delivered', 'invoiced', 'paid', 'blocked', 'on_hold'])
    .default('planning'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  start_date: z.string().date().optional().nullable(),
  deadline: z.string().date().optional().nullable(),
  assigned_to: UUIDSchema.optional().nullable(),
  notes: SafeTextSchema.optional().nullable(),
})

export const UpdateProjectSchema = CreateProjectSchema.partial()

// ==========================================
// 4. Task Schemas
// ==========================================

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Task title must be at least 2 characters')
    .max(255, 'Task title cannot exceed 255 characters'),
  project_id: UUIDSchema,
  description: SafeTextSchema.optional().nullable(),
  assigned_to: UUIDSchema.optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'completed', 'blocked']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().date().optional().nullable(),
})

export const UpdateTaskSchema = CreateTaskSchema.partial()

// ==========================================
// 5. Deliverable & Review Schemas
// ==========================================

export const CreateDeliverableSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Deliverable title must be at least 2 characters')
    .max(255, 'Deliverable title cannot exceed 255 characters'),
  project_id: UUIDSchema,
  file_url: UrlSchema,
  drive_link: UrlSchema,
  status: z.enum(['pending', 'in_review', 'approved', 'revision_required']).default('pending'),
  client_feedback: SafeTextSchema.optional().nullable(),
})

export const DeliverableApprovalSchema = z.object({
  deliverableId: UUIDSchema,
  feedback: SafeTextSchema.optional().nullable(),
})

export const DeliverableRevisionSchema = z.object({
  deliverableId: UUIDSchema,
  notes: z
    .string()
    .trim()
    .min(5, 'Please provide detailed revision instructions (at least 5 characters)')
    .max(5000, 'Revision instructions cannot exceed 5000 characters'),
})

// ==========================================
// 6. Organization Profile & Team Schemas
// ==========================================

export const UpdateOrgProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(255, 'Organization name cannot exceed 255 characters'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase alphanumeric characters and hyphens')
    .optional(),
  timezone: z.string().trim().max(100).default('UTC'),
  logo_url: UrlSchema,
})

export const InviteTeamMemberSchema = z.object({
  email: EmailSchema,
  role: z.enum(['admin', 'member', 'billing_manager', 'viewer']).default('member'),
})

// ==========================================
// 7. Messages & Communication Schemas
// ==========================================

export const OutboundMessageSchema = z.object({
  clientId: UUIDSchema,
  channelType: z.enum(['slack', 'whatsapp', 'email', 'discord', 'upwork', 'in_app']),
  body: z
    .string()
    .trim()
    .min(1, 'Message body cannot be empty')
    .max(8000, 'Message body cannot exceed 8000 characters'),
  attachments: z
    .array(
      z.object({
        name: z.string().trim().max(255),
        url: z.string().trim().url(),
        size: z.number().max(52428800, 'Attachment size exceeds 50MB limit'),
        type: z.string().trim().max(100),
      })
    )
    .max(10, 'Maximum 10 attachments per message')
    .optional()
    .default([]),
})

// ==========================================
// 8. AI Settings & Usage Schemas
// ==========================================

export const UpdateAISettingsSchema = z.object({
  reply_suggestions: z.boolean().default(true),
  lead_scoring: z.boolean().default(true),
  task_extraction: z.boolean().default(true),
  weekly_narrative: z.boolean().default(true),
})

// ==========================================
// 9. Lead Scoring & Pipeline Schemas
// ==========================================

export const LeadScoreInputSchema = z.object({
  dealValue: z.coerce.number().min(0).max(10000000),
  stageVelocityDays: z.coerce.number().min(0).max(3650),
  communicationCount: z.coerce.number().min(0).max(100000),
  completedProjectsCount: z.coerce.number().min(0).max(10000),
  overdueProjectsCount: z.coerce.number().min(0).max(10000),
  clientPlatform: z.string().trim().max(50).default('WhatsApp'),
})

// ==========================================
// 10. File Upload Verification Schema
// ==========================================

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'application/zip',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'text/plain',
  'text/csv',
]

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

export const FileUploadVerificationSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1, 'Filename required')
    .max(255, 'Filename exceeds 255 characters')
    .regex(/^[^<>:"/\\|?*\x00-\x1F]+$/, 'Filename contains invalid characters'),
  sizeBytes: z
    .number()
    .min(1, 'File cannot be empty')
    .max(MAX_FILE_SIZE_BYTES, 'File size exceeds maximum allowable limit (50MB)'),
  mimeType: z
    .string()
    .trim()
    .refine((type) => ALLOWED_MIME_TYPES.includes(type), {
      message: 'File type is not permitted for security reasons',
    }),
})
