-- Schema SQL pour Ainalyzer - Plateforme d'analyse d'images
-- À exécuter dans Supabase SQL Editor

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour chiffrement (pour les clés API)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TABLES UTILISATEUR (avec Auth Supabase native)
-- =============================================

-- Table users (étend auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Table user_profiles
CREATE TABLE public.user_profiles (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLES SESSIONS ET ACTIVITÉ
-- =============================================

-- Table user_activities
CREATE TABLE public.user_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table login_history
CREATE TABLE public.login_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_at TIMESTAMP WITH TIME ZONE,
    session_duration INTEGER -- en secondes
);

-- =============================================
-- TABLES MÉTIER
-- =============================================

-- Table api_keys (clés API chiffrées)
CREATE TABLE public.api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic')),
    name TEXT NOT NULL,
    encrypted_key TEXT NOT NULL, -- Clé chiffrée avec pgcrypto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true
);

-- Table analysis_types (types d'analyses configurables)
CREATE TABLE public.analysis_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    category TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table images (stockage des métadonnées d'images)
CREATE TABLE public.images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    original_name TEXT NOT NULL,
    storage_bucket TEXT DEFAULT 'analysis-images',
    storage_path TEXT NOT NULL, -- Chemin dans Supabase Storage
    public_url TEXT,
    file_hash TEXT,
    size_bytes BIGINT NOT NULL,
    format TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'analyzed', 'error'))
);

-- Table analyses (résultats des analyses)
CREATE TABLE public.analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_id UUID REFERENCES public.images(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    analysis_type_id UUID REFERENCES public.analysis_types(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic')),
    duration_ms INTEGER NOT NULL,
    result_json JSONB DEFAULT '{}',
    annotations JSONB DEFAULT '[]',
    processing_time_ms INTEGER DEFAULT 0,
    ai_provider TEXT,
    ai_model TEXT,
    tokens_used INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEX POUR PERFORMANCE
-- =============================================

-- Index sur les colonnes fréquemment utilisées
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);

CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at);

CREATE INDEX idx_login_history_user_id ON public.login_history(user_id);
CREATE INDEX idx_login_history_login_at ON public.login_history(login_at);

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_provider ON public.api_keys(provider);
CREATE INDEX idx_api_keys_active ON public.api_keys(active);

CREATE INDEX idx_analysis_types_active ON public.analysis_types(active);
CREATE INDEX idx_analysis_types_category ON public.analysis_types(category);

CREATE INDEX idx_images_user_id ON public.images(user_id);
CREATE INDEX idx_images_status ON public.images(status);
CREATE INDEX idx_images_uploaded_at ON public.images(uploaded_at);

CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_image_id ON public.analyses(image_id);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at);

-- =============================================
-- TRIGGERS POUR UPDATED_AT
-- =============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policies pour user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour user_activities
CREATE POLICY "Users can view own activities" ON public.user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert activities" ON public.user_activities
    FOR INSERT WITH CHECK (true);

-- Policies pour login_history
CREATE POLICY "Users can view own login history" ON public.login_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage login history" ON public.login_history
    FOR ALL WITH CHECK (true);

-- Policies pour api_keys
CREATE POLICY "Users can manage own API keys" ON public.api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Policies pour analysis_types (lecture publique, écriture admin)
CREATE POLICY "Anyone can view active analysis types" ON public.analysis_types
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage analysis types" ON public.analysis_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies pour images
CREATE POLICY "Users can manage own images" ON public.images
    FOR ALL USING (auth.uid() = user_id);

-- Policies pour analyses
CREATE POLICY "Users can manage own analyses" ON public.analyses
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- DONNÉES INITIALES
-- =============================================

-- Types d'analyses spécialisés pour l'accessibilité
INSERT INTO public.analysis_types (name, description, system_prompt, category) VALUES
(
    'Région',
    'Analyse des régions et zones principales de l''interface',
    'Analyse cette image d''interface et identifie les différentes régions principales (header, navigation, contenu principal, sidebar, footer, etc.). Pour chaque région identifiée, décris son rôle, sa position relative, et son importance dans la hiérarchie de l''information. Indique si les régions sont clairement délimitées visuellement.',
    'Structure'
),
(
    'Hiérarchie des titres',
    'Analyse de la structure hiérarchique des titres et sous-titres',
    'Examine cette image et identifie tous les titres et sous-titres visibles. Analyse leur hiérarchie visuelle (taille, poids, couleur, espacement) et détermine l''ordre logique des niveaux de titre (H1, H2, H3, etc.). Signale toute incohérence dans la hiérarchie ou les niveaux manqués qui pourraient poser des problèmes d''accessibilité.',
    'Structure'
),
(
    'Éléments interactifs',
    'Identification et analyse des éléments interactifs',
    'Identifie tous les éléments interactifs dans cette image (boutons, liens, champs de formulaire, menus déroulants, cases à cocher, etc.). Pour chaque élément, décris son type, sa fonction probable, son état visuel (actif, désactivé, sélectionné), et évalue si son rôle interactif est clairement indiqué visuellement.',
    'Interaction'
),
(
    'Ordre de navigation au clavier',
    'Analyse de l''ordre logique de navigation au clavier',
    'Examine cette interface et détermine l''ordre logique de navigation au clavier (tab order). Identifie tous les éléments focusables et propose un ordre de navigation cohérent de gauche à droite, de haut en bas. Signale les éléments qui pourraient être problématiques pour la navigation au clavier ou qui risquent d''être ignorés.',
    'Navigation'
),
(
    'Ordre de vocalisation pour les lecteurs d''écran',
    'Analyse de l''ordre de lecture pour les technologies d''assistance',
    'Analyse cette interface du point de vue d''un lecteur d''écran. Détermine l''ordre logique dans lequel les informations devraient être vocalisées pour être compréhensibles. Identifie les éléments qui pourraient créer de la confusion (contenu en colonnes, éléments positionnés absolument, etc.) et propose un ordre de lecture optimal.',
    'Accessibilité'
),
(
    'Texte alternatif',
    'Génération de textes alternatifs pour les images et éléments visuels',
    'Analyse cette image et génère des textes alternatifs appropriés pour tous les éléments visuels significatifs (images, icônes, graphiques, etc.). Distingue entre les images décoratives (alt="") et les images informatives. Pour les images informatives, fournis un texte alternatif concis mais complet qui transmet l''information essentielle. Pour les images complexes, propose également une description longue si nécessaire.',
    'Accessibilité'
);

-- =============================================
-- FONCTIONS UTILITAIRES
-- =============================================

-- Fonction pour chiffrer les clés API
CREATE OR REPLACE FUNCTION encrypt_api_key(api_key TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        encrypt(api_key::bytea, encryption_key::bytea, 'aes'),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour déchiffrer les clés API
CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN convert_from(
        decrypt(decode(encrypted_key, 'base64'), encryption_key::bytea, 'aes'),
        'UTF8'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER POUR CRÉATION AUTOMATIQUE DU PROFIL
-- =============================================

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO public.user_profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users pour création automatique
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- VUES UTILES
-- =============================================

-- Vue pour les statistiques utilisateur
CREATE VIEW public.user_stats AS
SELECT 
    u.id,
    u.email,
    up.display_name,
    u.role,
    u.status,
    u.created_at,
    u.last_login,
    COUNT(DISTINCT i.id) as total_images,
    COUNT(DISTINCT a.id) as total_analyses,
    COUNT(DISTINCT ak.id) as total_api_keys
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.images i ON u.id = i.user_id
LEFT JOIN public.analyses a ON u.id = a.user_id
LEFT JOIN public.api_keys ak ON u.id = ak.user_id AND ak.active = true
GROUP BY u.id, u.email, up.display_name, u.role, u.status, u.created_at, u.last_login;

-- Vue pour les analyses récentes
CREATE VIEW public.recent_analyses AS
SELECT 
    a.id,
    a.created_at,
    u.email as user_email,
    up.display_name as user_name,
    i.original_name as image_name,
    at.name as analysis_type,
    a.provider,
    a.status,
    a.duration_ms
FROM public.analyses a
JOIN public.users u ON a.user_id = u.id
JOIN public.user_profiles up ON u.id = up.user_id
JOIN public.images i ON a.image_id = i.id
JOIN public.analysis_types at ON a.analysis_type_id = at.id
ORDER BY a.created_at DESC;

-- Commentaires sur les tables
COMMENT ON TABLE public.users IS 'Table des utilisateurs étendant auth.users';
COMMENT ON TABLE public.user_profiles IS 'Profils utilisateur avec préférences';
COMMENT ON TABLE public.user_activities IS 'Journal des activités utilisateur';
COMMENT ON TABLE public.login_history IS 'Historique des connexions';
COMMENT ON TABLE public.api_keys IS 'Clés API chiffrées des utilisateurs';
COMMENT ON TABLE public.analysis_types IS 'Types d''analyses configurables';
COMMENT ON TABLE public.images IS 'Métadonnées des images uploadées';
COMMENT ON TABLE public.analyses IS 'Résultats des analyses d''images';
