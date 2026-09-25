/**
 * =============================================================================
 * Innoventix Platform v2 — PostgreSQL Database Model Definitions
 * Pure TypeScript interfaces representing database tables, records, and types.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// Common & Utility Types
// -----------------------------------------------------------------------------

export type UUID = string;
export type Timestamp = string | Date;
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject { [key: string]: JSONValue; }
export interface JSONArray extends Array<JSONValue> {}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
}

// -----------------------------------------------------------------------------
// Authentication & User Models
// -----------------------------------------------------------------------------

export type UserRole = "user" | "org_admin" | "super_admin";

export interface User {
  id: UUID;
  email: string;
  password_hash: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  last_login_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SuperAdmin {
  id: UUID;
  user_id: UUID;
  created_at: Timestamp;
}

export interface RefreshToken {
  id: UUID;
  user_id: UUID;
  token_hash: string;
  token_family: UUID;
  is_revoked: boolean;
  expires_at: Timestamp;
  created_at: Timestamp;
}

export interface Session {
  id: UUID;
  user_id: UUID;
  org_id: UUID | null;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  expires_at: Timestamp;
  created_at: Timestamp;
}

// -----------------------------------------------------------------------------
// Multi-Tenancy: Organizations & Memberships
// -----------------------------------------------------------------------------

export type MembershipRole = "owner" | "admin" | "member" | "viewer";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";
export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise";

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  logo_url: string | null;
  billing_email: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  onboarding_completed: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Membership {
  id: UUID;
  organization_id: UUID;
  user_id: UUID;
  role: MembershipRole;
  invited_by: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Subscription {
  id: UUID;
  organization_id: UUID;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: Timestamp;
  current_period_end: Timestamp;
  cancel_at_period_end: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// -----------------------------------------------------------------------------
// CRM: Clients, Leads & Communication Logs
// -----------------------------------------------------------------------------

export type LeadStatus = "new" | "contacted" | "qualifying" | "proposal" | "negotiation" | "won" | "lost";
export type ClientStatus = "lead" | "active" | "churned" | "archived";

export interface Client {
  id: UUID;
  organization_id: UUID;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  status: ClientStatus;
  notes: string | null;
  assigned_to: UUID | null;
  custom_fields: JSONObject | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ClientTag {
  id: UUID;
  organization_id: UUID;
  name: string;
  color: string;
  created_at: Timestamp;
}

export interface ClientTagAssignment {
  client_id: UUID;
  tag_id: UUID;
}

export interface Lead {
  id: UUID;
  organization_id: UUID;
  client_id: UUID | null;
  title: string;
  value: number;
  currency: string;
  status: LeadStatus;
  score: number | null;
  score_reason: string | null;
  assigned_to: UUID | null;
  stage_order: number;
  expected_close_date: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CommunicationLog {
  id: UUID;
  organization_id: UUID;
  client_id: UUID;
  user_id: UUID;
  channel: "email" | "phone" | "whatsapp" | "meeting" | "slack" | "other";
  subject: string | null;
  content: string;
  occurred_at: Timestamp;
  created_at: Timestamp;
}

// -----------------------------------------------------------------------------
// Project Management: Projects, Tasks & Deliverables
// -----------------------------------------------------------------------------

export type ProjectStatus = "planning" | "in_progress" | "in_review" | "completed" | "on_hold" | "archived";
export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type DeliverableStatus = "draft" | "submitted" | "approved" | "changes_requested";

export interface Project {
  id: UUID;
  organization_id: UUID;
  client_id: UUID | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  budget: number | null;
  currency: string;
  start_date: Timestamp | null;
  deadline: Timestamp | null;
  completed_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ProjectTemplate {
  id: UUID;
  organization_id: UUID;
  name: string;
  description: string | null;
  template_data: JSONObject;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Task {
  id: UUID;
  organization_id: UUID;
  project_id: UUID;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: UUID | null;
  due_date: Timestamp | null;
  sort_order: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Deliverable {
  id: UUID;
  organization_id: UUID;
  project_id: UUID;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  file_url: string | null;
  feedback_notes: string | null;
  approved_at: Timestamp | null;
  approved_by: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ProjectActivityLog {
  id: UUID;
  organization_id: UUID;
  project_id: UUID;
  user_id: UUID | null;
  action: string;
  details: JSONObject | null;
  created_at: Timestamp;
}

// -----------------------------------------------------------------------------
// Communication Hub & Unified Inbox
// -----------------------------------------------------------------------------

export type ChannelType = "email" | "whatsapp" | "slack" | "discord" | "upwork";

export interface MessageThread {
  id: UUID;
  organization_id: UUID;
  client_id: UUID | null;
  channel: ChannelType;
  channel_thread_id: string;
  subject: string | null;
  last_message_at: Timestamp;
  is_unread: boolean;
  assigned_to: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Message {
  id: UUID;
  organization_id: UUID;
  thread_id: UUID;
  sender_type: "user" | "client" | "system";
  sender_id: UUID | null;
  sender_name: string;
  sender_email: string | null;
  content: string;
  attachments: JSONArray | null;
  metadata: JSONObject | null;
  sent_at: Timestamp;
  created_at: Timestamp;
}

// -----------------------------------------------------------------------------
// Notifications, AI & Audit Logs
// -----------------------------------------------------------------------------

export type NotificationType = "task_assigned" | "deliverable_submitted" | "deliverable_approved" | "invoice_paid" | "mention" | "system_alert";

export interface Notification {
  id: UUID;
  organization_id: UUID;
  user_id: UUID;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: Timestamp;
}

export interface AiFeatureSettings {
  id: UUID;
  organization_id: UUID;
  auto_reply_enabled: boolean;
  lead_scoring_enabled: boolean;
  task_extraction_enabled: boolean;
  weekly_report_enabled: boolean;
  model_name: string;
  updated_at: Timestamp;
}

export interface AiUsageLog {
  id: UUID;
  organization_id: UUID;
  user_id: UUID | null;
  feature: string;
  tokens_prompt: number;
  tokens_completion: number;
  cost_estimate: number;
  created_at: Timestamp;
}

export interface AuditLog {
  id: UUID;
  organization_id: UUID | null;
  user_id: UUID | null;
  action: string;
  entity_type: string;
  entity_id: UUID | null;
  old_values: JSONObject | null;
  new_values: JSONObject | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Timestamp;
}

// -----------------------------------------------------------------------------
// Client Portal Models
// -----------------------------------------------------------------------------

export interface ClientPortalUser {
  id: UUID;
  client_id: UUID;
  organization_id: UUID;
  email: string;
  password_hash: string;
  full_name: string;
  is_active: boolean;
  last_login_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ClientPortalSettings {
  id: UUID;
  organization_id: UUID;
  portal_subdomain: string | null;
  brand_color: string | null;
  welcome_message: string | null;
  allow_deliverable_comments: boolean;
  updated_at: Timestamp;
}
