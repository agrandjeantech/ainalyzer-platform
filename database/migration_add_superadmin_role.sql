-- Migration pour ajouter le rôle superadmin
-- À exécuter dans Supabase SQL Editor

-- =============================================
-- ÉTAPE 1: MODIFIER LA CONTRAINTE DE RÔLE
-- =============================================

-- Supprimer l'ancienne contrainte
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Ajouter la nouvelle contrainte avec superadmin
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'admin', 'superadmin'));

-- =============================================
-- ÉTAPE 2: NOUVELLES POLITIQUES RLS POUR SUPERADMIN
-- =============================================

-- Supprimer les anciennes politiques pour les recréer
DROP POLICY IF EXISTS "Admins can manage analysis types" ON public.analysis_types;

-- Nouvelle politique pour analysis_types (admin ET superadmin peuvent gérer)
CREATE POLICY "Admins and superadmins can manage analysis types" ON public.analysis_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- =============================================
-- ÉTAPE 3: POLITIQUES SPÉCIFIQUES AU SUPERADMIN
-- =============================================

-- Politique pour que les superadmins puissent voir tous les utilisateurs
CREATE POLICY "Superadmins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- Politique pour que les superadmins puissent modifier les rôles des autres utilisateurs
CREATE POLICY "Superadmins can update user roles" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- Politique pour que les superadmins puissent voir tous les profils
CREATE POLICY "Superadmins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- Politique pour que les superadmins puissent voir toutes les activités
CREATE POLICY "Superadmins can view all activities" ON public.user_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- Politique pour que les superadmins puissent voir tout l'historique de connexion
CREATE POLICY "Superadmins can view all login history" ON public.login_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- =============================================
-- ÉTAPE 4: NOUVELLES VUES POUR LA GESTION DES UTILISATEURS
-- =============================================

-- Vue détaillée des utilisateurs pour les superadmins
CREATE OR REPLACE VIEW public.admin_user_management AS
SELECT 
    u.id,
    u.email,
    u.role,
    u.status,
    u.created_at,
    u.updated_at,
    u.last_login,
    up.display_name,
    up.preferences,
    -- Statistiques d'utilisation
    COUNT(DISTINCT i.id) as total_images,
    COUNT(DISTINCT a.id) as total_analyses,
    COUNT(DISTINCT ak.id) as total_api_keys,
    -- Dernière activité
    MAX(ua.created_at) as last_activity,
    -- Statut de connexion récent (connecté dans les 24h)
    CASE 
        WHEN u.last_login > NOW() - INTERVAL '24 hours' THEN true 
        ELSE false 
    END as recently_active
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.images i ON u.id = i.user_id
LEFT JOIN public.analyses a ON u.id = a.user_id
LEFT JOIN public.api_keys ak ON u.id = ak.user_id AND ak.active = true
LEFT JOIN public.user_activities ua ON u.id = ua.user_id
GROUP BY u.id, u.email, u.role, u.status, u.created_at, u.updated_at, u.last_login, up.display_name, up.preferences
ORDER BY u.created_at DESC;

-- Vue des statistiques globales pour les superadmins
CREATE OR REPLACE VIEW public.platform_statistics AS
SELECT 
    -- Statistiques utilisateurs
    COUNT(DISTINCT CASE WHEN u.role = 'user' THEN u.id END) as total_users,
    COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as total_admins,
    COUNT(DISTINCT CASE WHEN u.role = 'superadmin' THEN u.id END) as total_superadmins,
    COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as active_users,
    COUNT(DISTINCT CASE WHEN u.last_login > NOW() - INTERVAL '24 hours' THEN u.id END) as users_last_24h,
    COUNT(DISTINCT CASE WHEN u.last_login > NOW() - INTERVAL '7 days' THEN u.id END) as users_last_7d,
    
    -- Statistiques d'utilisation
    COUNT(DISTINCT i.id) as total_images,
    COUNT(DISTINCT a.id) as total_analyses,
    COUNT(DISTINCT ak.id) as total_api_keys,
    
    -- Statistiques temporelles
    COUNT(DISTINCT CASE WHEN i.uploaded_at > NOW() - INTERVAL '24 hours' THEN i.id END) as images_last_24h,
    COUNT(DISTINCT CASE WHEN a.created_at > NOW() - INTERVAL '24 hours' THEN a.id END) as analyses_last_24h,
    
    -- Moyennes
    ROUND(AVG(user_image_count.image_count), 2) as avg_images_per_user,
    ROUND(AVG(user_analysis_count.analysis_count), 2) as avg_analyses_per_user
FROM public.users u
LEFT JOIN public.images i ON u.id = i.user_id
LEFT JOIN public.analyses a ON u.id = a.user_id
LEFT JOIN public.api_keys ak ON u.id = ak.user_id AND ak.active = true
LEFT JOIN (
    SELECT user_id, COUNT(*) as image_count 
    FROM public.images 
    GROUP BY user_id
) user_image_count ON u.id = user_image_count.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as analysis_count 
    FROM public.analyses 
    GROUP BY user_id
) user_analysis_count ON u.id = user_analysis_count.user_id;

-- =============================================
-- ÉTAPE 5: FONCTIONS UTILITAIRES POUR SUPERADMIN
-- =============================================

-- Fonction pour promouvoir un utilisateur (seulement pour superadmin)
CREATE OR REPLACE FUNCTION promote_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Vérifier que l'utilisateur actuel est superadmin
    SELECT role INTO current_user_role 
    FROM public.users 
    WHERE id = auth.uid();
    
    IF current_user_role != 'superadmin' THEN
        RAISE EXCEPTION 'Seuls les superadmins peuvent modifier les rôles';
    END IF;
    
    -- Vérifier que le nouveau rôle est valide
    IF new_role NOT IN ('user', 'admin', 'superadmin') THEN
        RAISE EXCEPTION 'Rôle invalide: %', new_role;
    END IF;
    
    -- Empêcher la rétrogradation du dernier superadmin
    IF new_role != 'superadmin' THEN
        IF (SELECT COUNT(*) FROM public.users WHERE role = 'superadmin') <= 1 THEN
            IF (SELECT role FROM public.users WHERE id = target_user_id) = 'superadmin' THEN
                RAISE EXCEPTION 'Impossible de rétrograder le dernier superadmin';
            END IF;
        END IF;
    END IF;
    
    -- Mettre à jour le rôle
    UPDATE public.users 
    SET role = new_role, updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Enregistrer l'activité
    INSERT INTO public.user_activities (user_id, action, details)
    VALUES (
        auth.uid(), 
        'role_change', 
        jsonb_build_object(
            'target_user_id', target_user_id,
            'new_role', new_role,
            'timestamp', NOW()
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour suspendre/activer un utilisateur (seulement pour superadmin)
CREATE OR REPLACE FUNCTION change_user_status(target_user_id UUID, new_status TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Vérifier que l'utilisateur actuel est superadmin
    SELECT role INTO current_user_role 
    FROM public.users 
    WHERE id = auth.uid();
    
    IF current_user_role != 'superadmin' THEN
        RAISE EXCEPTION 'Seuls les superadmins peuvent modifier le statut des utilisateurs';
    END IF;
    
    -- Vérifier que le nouveau statut est valide
    IF new_status NOT IN ('active', 'inactive', 'suspended') THEN
        RAISE EXCEPTION 'Statut invalide: %', new_status;
    END IF;
    
    -- Empêcher la suspension du dernier superadmin
    IF new_status != 'active' THEN
        IF (SELECT COUNT(*) FROM public.users WHERE role = 'superadmin' AND status = 'active') <= 1 THEN
            IF (SELECT role FROM public.users WHERE id = target_user_id) = 'superadmin' THEN
                RAISE EXCEPTION 'Impossible de suspendre le dernier superadmin actif';
            END IF;
        END IF;
    END IF;
    
    -- Mettre à jour le statut
    UPDATE public.users 
    SET status = new_status, updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Enregistrer l'activité
    INSERT INTO public.user_activities (user_id, action, details)
    VALUES (
        auth.uid(), 
        'status_change', 
        jsonb_build_object(
            'target_user_id', target_user_id,
            'new_status', new_status,
            'timestamp', NOW()
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ÉTAPE 6: POLITIQUES RLS POUR LES NOUVELLES FONCTIONS
-- =============================================

-- Politique pour permettre aux superadmins d'utiliser les fonctions de gestion
CREATE POLICY "Superadmins can execute management functions" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- =============================================
-- COMMENTAIRES ET DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION promote_user_role(UUID, TEXT) IS 'Fonction pour changer le rôle d''un utilisateur (superadmin uniquement)';
COMMENT ON FUNCTION change_user_status(UUID, TEXT) IS 'Fonction pour changer le statut d''un utilisateur (superadmin uniquement)';
COMMENT ON VIEW public.admin_user_management IS 'Vue complète pour la gestion des utilisateurs par les superadmins';
COMMENT ON VIEW public.platform_statistics IS 'Statistiques globales de la plateforme pour les superadmins';

-- =============================================
-- INSTRUCTIONS POST-MIGRATION
-- =============================================

-- Pour créer le premier superadmin, exécuter cette requête en remplaçant l'email :
-- UPDATE public.users SET role = 'superadmin' WHERE email = 'votre-email@example.com';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration superadmin terminée avec succès !';
    RAISE NOTICE 'Hiérarchie des rôles : user < admin < superadmin';
    RAISE NOTICE 'Permissions superadmin : gestion complète des utilisateurs + tous les droits admin';
    RAISE NOTICE 'N''oubliez pas de créer votre premier superadmin avec : UPDATE public.users SET role = ''superadmin'' WHERE email = ''votre-email@example.com'';';
END $$;
