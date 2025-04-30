// User related types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'professor' | 'graduation_assistant';
}

export interface UserSimple {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export interface GraduationAssistant extends UserSimple {
  bio?: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_verified: boolean;
  student_count?: number;
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

export interface ThesisComment {
  id: string;
  content: string;
  is_resolved: boolean;
  is_approval: boolean;
  parent_id: string | null;
  thesis_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
  };
  replies?: ThesisComment[];
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

// Request related types
export interface ThesisRequest {
  id: string;
  thesis_id: string;
  assistant_id: string;
  status: 'requested' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  thesis?: Thesis;
  assistant?: GraduationAssistant;
  student_name?: string | null;
  assistant_name?: string | null;
  thesis_title?: string | null;
} 

// Review related types
export interface ReviewCreate {
  text: string;
  preliminary_evaluation: number; // Should be between 2 and 6
}

export interface ReviewRead {
  id: number; // Assuming integer ID based on schema, could be string
  title: string;
  text: string;
  preliminary_evaluation: number;
  thesis_id: string;
  assistant_id: string;
} 