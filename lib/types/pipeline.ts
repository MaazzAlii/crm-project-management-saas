export type DealStatus = 'open' | 'won' | 'lost' | 'archived';

export interface Pipeline {
  id: string;
  org_id: string;
  name: string;
  description?: string | null;
  is_default: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  org_id: string;
  pipeline_id: string;
  name: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  wip_limit?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  org_id: string;
  pipeline_id: string;
  stage_id: string;
  client_id?: string | null;
  owner_id?: string | null;
  title: string;
  description?: string | null;
  value: number;
  currency: string;
  probability: number;
  position: number;
  expected_close_date?: string | null;
  status: DealStatus;
  lost_reason?: string | null;
  closed_at?: string | null;
  version: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Contact & Client details
  company_name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  client_name?: string | null;
  client_company?: string | null;
  owner_name?: string | null;
  owner_email?: string | null;

  // Enriched relational aggregations
  labels?: PipelineLabel[];
  checklists?: DealChecklistWithItems[];
  comments_count?: number;
  checklist_total_count?: number;
  checklist_done_count?: number;
  checklists_total?: number;
  checklists_done?: number;
}

export interface PipelineLabel {
  id: string;
  org_id: string;
  pipeline_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface DealLabel {
  deal_id: string;
  label_id: string;
}

export interface DealChecklistItem {
  id: string;
  org_id?: string;
  checklist_id: string;
  title: string;
  text?: string;
  is_done: boolean;
  position: number;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealChecklist {
  id: string;
  org_id?: string;
  deal_id: string;
  title: string;
  position?: number;
  created_at: string;
  updated_at?: string;
  items?: DealChecklistItem[];
}

export interface DealChecklistWithItems extends DealChecklist {
  items: DealChecklistItem[];
}

export interface DealComment {
  id: string;
  org_id?: string;
  deal_id: string;
  author_id?: string | null;
  author_name?: string | null;
  author_email?: string | null;
  author_avatar_url?: string | null;
  content: string;
  body?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type DealActivityType =
  | 'created'
  | 'updated'
  | 'moved'
  | 'won'
  | 'lost'
  | 'reopened'
  | 'comment_added'
  | 'checklist_added'
  | 'checklist_updated'
  | 'checklist_item_added'
  | 'checklist_item_completed'
  | 'checklist_item_uncompleted'
  | 'archived'
  | 'restored';

export interface DealActivity {
  id: string;
  org_id: string;
  deal_id: string;
  actor_id?: string | null;
  actor_name?: string | null;
  action: string;
  type?: DealActivityType;
  metadata?: Record<string, any>;
  data?: Record<string, any>;
  created_at: string;
}

export interface BoardStageView {
  stage: PipelineStage;
  deals: Deal[];
  totalDeals: number;
  totalValue: number;
  hasMore?: boolean;
}

export interface DealFilters {
  q?: string;
  ownerId?: string;
  clientId?: string;
  labelId?: string;
  minValue?: number;
  maxValue?: number;
  closeBefore?: string;
  closeAfter?: string;
  showClosed?: boolean;
  status?: 'open' | 'won' | 'lost' | 'archived';
}

export interface CreateDealInput {
  pipeline_id: string;
  stage_id: string;
  title: string;
  value?: number;
  currency?: string;
  probability?: number;
  expected_close_date?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  client_id?: string | null;
  owner_id?: string | null;
  label_ids?: string[];
}

export interface UpdateDealInput {
  stage_id?: string;
  title?: string;
  description?: string | null;
  value?: number;
  currency?: string;
  probability?: number;
  position?: number;
  expected_close_date?: string | null;
  status?: DealStatus;
  lost_reason?: string | null;
  closed_at?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  client_id?: string | null;
  owner_id?: string | null;
  label_ids?: string[];
}

export interface StageWithDeals extends PipelineStage {
  deals: Deal[];
  totalValue: number;
  dealCount: number;
}

export interface PipelineBoardData {
  pipeline: Pipeline;
  stages: StageWithDeals[];
  labels: PipelineLabel[];
  totals: {
    totalValue: number;
    weightedValue: number;
    openDealsCount: number;
    wonDealsCount: number;
    lostDealsCount: number;
    winRatePercent: number;
  };
}
