export type DeadlineType = 'submission' | 'review' | 'defense' | 'revision';

export interface Deadline {
  id: string;
  title: string;
  description?: string;
  deadline_date: string;
  deadline_type: DeadlineType;
  is_active: boolean;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeadlineDetail extends Deadline {
  is_upcoming: boolean;
  days_remaining?: number;
}

export interface DeadlineCreate {
  title: string;
  description?: string;
  deadline_date: string;
  deadline_type: DeadlineType;
  is_active: boolean;
  is_global: boolean;
}

export interface DeadlineUpdate {
  title?: string;
  description?: string;
  deadline_date?: string;
  deadline_type?: DeadlineType;
  is_active?: boolean;
  is_global?: boolean;
} 