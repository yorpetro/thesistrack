// User related types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

// Thesis related types
export enum ThesisStatus {
  draft = 'draft',
  submitted = 'submitted',
  under_review = 'under_review',
  needs_revision = 'needs_revision',
  approved = 'approved',
  declined = 'declined'
}

export interface Thesis {
  id: string;
  title: string;
  abstract: string | null;
  status: ThesisStatus;
  student_id: string;
  supervisor_id: string | null;
  defense_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThesisWithRelations extends Thesis {
  student: User;
  supervisor: User | null;
}

export interface UserSimple {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

// Attachment related types
export interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  thesis_id: string;
  uploaded_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface AttachmentWithUser extends Attachment {
  uploaded_by: User;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  content_type: string;
  size: number;
}

export interface PreviewData {
  type: string;
  mimetype: string;
  content_type: string;
  content: string | null;
  html: string | null;
  filename: string;
  file_size: number;
  description: string | null;
}

// Comment related types
export interface CommentBase {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_resolved: boolean;
  thesis_id: string;
  user_id: string;
  parent_id: string | null;
}

// Committee related types
export interface CommitteeMemberSimple {
  id: string;
  thesis_id: string;
  professor_id: string;
  role: string;
  professor: UserSimple;
}

// API response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ErrorResponse {
  detail: string | {
    loc: (string | number)[];
    msg: string;
    type: string;
  }[];
} 