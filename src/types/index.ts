// Types de base pour l'application Ainalyzer

// Types utilisateur et authentification
export type UserRole = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserProfile {
  user_id: string;
  display_name: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Types pour les sessions et activités
export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  ip_address?: string;
  user_agent?: string;
  login_at: string;
  logout_at?: string;
  session_duration?: number;
}

// Types pour les clés API
export interface ApiKey {
  id: string;
  user_id: string;
  provider: 'openai' | 'anthropic';
  name: string;
  encrypted_key: string;
  created_at: string;
  last_used?: string;
  active: boolean;
}

// Types pour les analyses
export interface AnalysisType {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  category: string;
  active: boolean;
  created_at: string;
}

export interface Image {
  id: string;
  user_id: string;
  original_name: string;
  storage_path: string;
  size_bytes: number;
  format: string;
  uploaded_at: string;
  status: 'uploading' | 'ready' | 'processing' | 'error';
}

// Interface pour les annotations d'analyse
export interface AnalysisAnnotation {
  id: string;
  type: 'rectangle' | 'circle' | 'arrow' | 'text';
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
  };
  label: string;
  description?: string;
  color?: string;
}

export interface Analysis {
  id: string;
  image_id: string;
  user_id: string;
  analysis_type_id: string;
  provider: 'openai' | 'anthropic';
  duration_ms: number;
  result_json: Record<string, unknown>;
  annotations?: AnalysisAnnotation[];
  processing_time_ms?: number;
  ai_provider?: string;
  ai_model?: string;
  tokens_used?: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
  // Nouveaux champs pour l'historique et PDF
  title?: string;
  description?: string;
  annotated_image_url?: string;
  annotated_image_path?: string;
  pdf_generated?: boolean;
  pdf_url?: string;
  pdf_path?: string;
  is_favorite?: boolean;
  tags?: string[];
  summary?: string;
}

// Interface étendue pour l'historique des analyses avec informations jointes
export interface AnalysisHistoryItem {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  description?: string;
  summary?: string;
  is_favorite: boolean;
  tags: string[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  pdf_generated: boolean;
  annotated_image_url?: string;
  pdf_url?: string;
  // Informations de l'image
  image_name: string;
  original_image_url?: string;
  image_size_bytes: number;
  image_format: string;
  // Informations du type d'analyse
  analysis_type: string;
  analysis_category: string;
  // Métadonnées de performance
  provider: 'openai' | 'anthropic';
  duration_ms: number;
  tokens_used?: number;
  // Aperçu du contenu
  preview_text: string;
  annotations_count: number;
}

// Interface pour les filtres de l'historique
export interface AnalysisHistoryFilters {
  search?: string;
  analysis_type?: string;
  category?: string;
  provider?: string;
  is_favorite?: boolean;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  status?: 'pending' | 'processing' | 'completed' | 'error';
}

// Interface pour la génération PDF
export interface PdfGenerationRequest {
  analysis_id: string;
  include_annotations?: boolean;
  include_original_image?: boolean;
  custom_title?: string;
  custom_description?: string;
}

export interface PdfGenerationResponse {
  success: boolean;
  pdf_url?: string;
  pdf_path?: string;
  file_size_bytes?: number;
  generation_time_ms?: number;
  error?: string;
}

// Types pour les composants UI
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Types pour les réponses API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Types pour les formulaires
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

// Types pour la gestion des utilisateurs (superadmin)
export interface UserManagement extends User {
  display_name: string;
  preferences: Record<string, unknown>;
  total_images: number;
  total_analyses: number;
  total_api_keys: number;
  last_activity?: string;
  recently_active: boolean;
}

export interface PlatformStatistics {
  total_users: number;
  total_admins: number;
  total_superadmins: number;
  active_users: number;
  users_last_24h: number;
  users_last_7d: number;
  total_images: number;
  total_analyses: number;
  total_api_keys: number;
  images_last_24h: number;
  analyses_last_24h: number;
  avg_images_per_user: number;
  avg_analyses_per_user: number;
}

export interface RoleChangeRequest {
  target_user_id: string;
  new_role: UserRole;
}

export interface StatusChangeRequest {
  target_user_id: string;
  new_status: UserStatus;
}

// Types pour les permissions
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  condition?: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { resource: 'own_profile', action: 'read' },
    { resource: 'own_profile', action: 'update' },
    { resource: 'own_images', action: 'create' },
    { resource: 'own_images', action: 'read' },
    { resource: 'own_images', action: 'delete' },
    { resource: 'own_analyses', action: 'create' },
    { resource: 'own_analyses', action: 'read' },
    { resource: 'own_api_keys', action: 'create' },
    { resource: 'own_api_keys', action: 'read' },
    { resource: 'own_api_keys', action: 'update' },
    { resource: 'own_api_keys', action: 'delete' },
    { resource: 'analysis_types', action: 'read' },
  ],
  admin: [
    // Hérite de tous les droits user
    { resource: 'analysis_types', action: 'create' },
    { resource: 'analysis_types', action: 'update' },
    { resource: 'analysis_types', action: 'delete' },
  ],
  superadmin: [
    // Hérite de tous les droits admin + user
    { resource: 'all_users', action: 'read' },
    { resource: 'all_users', action: 'update' },
    { resource: 'user_roles', action: 'update' },
    { resource: 'user_status', action: 'update' },
    { resource: 'platform_statistics', action: 'read' },
    { resource: 'all_activities', action: 'read' },
    { resource: 'all_login_history', action: 'read' },
  ],
};

// Types pour les erreurs
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Types pour la configuration
export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    version: string;
    url: string;
  };
}
