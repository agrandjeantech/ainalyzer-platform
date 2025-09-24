// Types de base pour l'application Ainalyzer

// Types utilisateur et authentification
export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserProfile {
  user_id: string;
  display_name: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Types pour les sessions et activités
export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, any>;
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

export interface Analysis {
  id: string;
  image_id: string;
  user_id: string;
  analysis_type_id: string;
  provider: 'openai' | 'anthropic';
  duration_ms: number;
  result_json: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
}

// Types pour les composants UI
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
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

// Types pour les erreurs
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
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
