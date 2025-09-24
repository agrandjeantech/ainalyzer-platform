# 🔄 Mise à jour Supabase - ÉTAPE 7 : Storage et Images

## 📋 OBJECTIF
Mettre à jour votre projet Supabase existant pour supporter le stockage d'images et les nouvelles fonctionnalités de l'ÉTAPE 7.

## ⚠️ IMPORTANT
Ces mises à jour doivent être appliquées à votre projet Supabase existant **EN PLUS** des configurations de `SUPABASE_STORAGE_SETUP.md`.

## 🗄️ 1. MISE À JOUR DU SCHÉMA DATABASE

### Exécuter dans Supabase SQL Editor :

```sql
-- =============================================
-- MISE À JOUR TABLE IMAGES
-- =============================================

-- Ajouter les nouvelles colonnes à la table images
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS storage_bucket TEXT DEFAULT 'analysis-images',
ADD COLUMN IF NOT EXISTS public_url TEXT,
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Mettre à jour les valeurs par défaut pour le status
ALTER TABLE public.images 
ALTER COLUMN status SET DEFAULT 'uploaded';

-- Ajouter les nouveaux statuts possibles
ALTER TABLE public.images 
DROP CONSTRAINT IF EXISTS images_status_check;

ALTER TABLE public.images 
ADD CONSTRAINT images_status_check 
CHECK (status IN ('uploaded', 'processing', 'analyzed', 'error'));

-- Créer les index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_images_file_hash ON public.images(file_hash);
CREATE INDEX IF NOT EXISTS idx_images_storage_path ON public.images(storage_path);
CREATE INDEX IF NOT EXISTS idx_images_storage_bucket ON public.images(storage_bucket);

-- =============================================
-- MISE À JOUR TABLE ANALYSES
-- =============================================

-- Ajouter les nouvelles colonnes à la table analyses
ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS annotations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_provider TEXT,
ADD COLUMN IF NOT EXISTS ai_model TEXT,
ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0;

-- Créer les index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_analyses_ai_provider ON public.analyses(ai_provider);
CREATE INDEX IF NOT EXISTS idx_analyses_ai_model ON public.analyses(ai_model);

-- =============================================
-- FONCTIONS UTILITAIRES POUR LE STORAGE
-- =============================================

-- Fonction pour calculer l'usage de stockage d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS TABLE(
  total_size_bytes BIGINT,
  total_images INTEGER,
  storage_by_bucket JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(size_bytes), 0) as total_size_bytes,
    COUNT(*)::INTEGER as total_images,
    COALESCE(
      jsonb_object_agg(
        storage_bucket, 
        jsonb_build_object(
          'count', bucket_count,
          'size_bytes', bucket_size
        )
      ), 
      '{}'::jsonb
    ) as storage_by_bucket
  FROM (
    SELECT 
      storage_bucket,
      COUNT(*) as bucket_count,
      SUM(size_bytes) as bucket_size,
      SUM(size_bytes) OVER () as size_bytes
    FROM public.images 
    WHERE user_id = user_uuid
    GROUP BY storage_bucket
  ) bucket_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les images orphelines (sans analyses)
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les images uploadées il y a plus de 7 jours sans analyses
  DELETE FROM public.images 
  WHERE uploaded_at < NOW() - INTERVAL '7 days'
  AND status = 'uploaded'
  AND NOT EXISTS (
    SELECT 1 FROM public.analyses 
    WHERE analyses.image_id = images.id
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques d'usage par utilisateur
CREATE OR REPLACE FUNCTION get_platform_storage_stats()
RETURNS TABLE(
  total_users INTEGER,
  total_images INTEGER,
  total_size_gb NUMERIC,
  avg_images_per_user NUMERIC,
  avg_size_per_user_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT u.id)::INTEGER as total_users,
    COUNT(i.id)::INTEGER as total_images,
    ROUND((COALESCE(SUM(i.size_bytes), 0) / 1024.0 / 1024.0 / 1024.0)::NUMERIC, 2) as total_size_gb,
    ROUND((COUNT(i.id)::NUMERIC / NULLIF(COUNT(DISTINCT u.id), 0))::NUMERIC, 1) as avg_images_per_user,
    ROUND((COALESCE(SUM(i.size_bytes), 0) / 1024.0 / 1024.0 / NULLIF(COUNT(DISTINCT u.id), 0))::NUMERIC, 1) as avg_size_per_user_mb
  FROM public.users u
  LEFT JOIN public.images i ON u.id = i.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- MISE À JOUR DES VUES
-- =============================================

-- Recréer la vue user_stats avec les nouvelles colonnes
DROP VIEW IF EXISTS public.user_stats;

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
    COUNT(DISTINCT ak.id) as total_api_keys,
    COALESCE(SUM(i.size_bytes), 0) as total_storage_bytes,
    ROUND((COALESCE(SUM(i.size_bytes), 0) / 1024.0 / 1024.0)::NUMERIC, 2) as total_storage_mb
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.user_id
LEFT JOIN public.images i ON u.id = i.user_id
LEFT JOIN public.analyses a ON u.id = a.user_id
LEFT JOIN public.api_keys ak ON u.id = ak.user_id AND ak.active = true
GROUP BY u.id, u.email, up.display_name, u.role, u.status, u.created_at, u.last_login;

-- Recréer la vue recent_analyses avec les nouvelles colonnes
DROP VIEW IF EXISTS public.recent_analyses;

CREATE VIEW public.recent_analyses AS
SELECT 
    a.id,
    a.created_at,
    u.email as user_email,
    up.display_name as user_name,
    i.original_name as image_name,
    i.size_bytes as image_size,
    at.name as analysis_type,
    a.provider,
    a.ai_provider,
    a.ai_model,
    a.tokens_used,
    a.processing_time_ms,
    a.status,
    a.duration_ms,
    jsonb_array_length(COALESCE(a.annotations, '[]'::jsonb)) as annotation_count
FROM public.analyses a
JOIN public.users u ON a.user_id = u.id
JOIN public.user_profiles up ON u.id = up.user_id
JOIN public.images i ON a.image_id = i.id
JOIN public.analysis_types at ON a.analysis_type_id = at.id
ORDER BY a.created_at DESC;

-- =============================================
-- TRIGGERS POUR AUDIT ET NETTOYAGE
-- =============================================

-- Fonction pour logger les uploads d'images
CREATE OR REPLACE FUNCTION log_image_upload()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_activities (user_id, action, details)
    VALUES (
        NEW.user_id,
        'image_upload',
        jsonb_build_object(
            'image_id', NEW.id,
            'original_name', NEW.original_name,
            'size_bytes', NEW.size_bytes,
            'format', NEW.format,
            'storage_bucket', NEW.storage_bucket
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour logger les uploads
DROP TRIGGER IF EXISTS trigger_log_image_upload ON public.images;
CREATE TRIGGER trigger_log_image_upload
    AFTER INSERT ON public.images
    FOR EACH ROW EXECUTE FUNCTION log_image_upload();

-- Fonction pour logger les analyses terminées
CREATE OR REPLACE FUNCTION log_analysis_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Seulement logger quand le status passe à 'completed'
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        INSERT INTO public.user_activities (user_id, action, details)
        VALUES (
            NEW.user_id,
            'analysis_completed',
            jsonb_build_object(
                'analysis_id', NEW.id,
                'image_id', NEW.image_id,
                'analysis_type_id', NEW.analysis_type_id,
                'provider', NEW.provider,
                'ai_provider', NEW.ai_provider,
                'ai_model', NEW.ai_model,
                'duration_ms', NEW.duration_ms,
                'processing_time_ms', NEW.processing_time_ms,
                'tokens_used', NEW.tokens_used,
                'annotation_count', jsonb_array_length(COALESCE(NEW.annotations, '[]'::jsonb))
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour logger les analyses terminées
DROP TRIGGER IF EXISTS trigger_log_analysis_completion ON public.analyses;
CREATE TRIGGER trigger_log_analysis_completion
    AFTER UPDATE ON public.analyses
    FOR EACH ROW EXECUTE FUNCTION log_analysis_completion();

-- =============================================
-- COMMENTAIRES SUR LES NOUVELLES COLONNES
-- =============================================

COMMENT ON COLUMN public.images.storage_bucket IS 'Bucket Supabase Storage (analysis-images ou temp-images)';
COMMENT ON COLUMN public.images.public_url IS 'URL publique de l''image si le bucket est public';
COMMENT ON COLUMN public.images.file_hash IS 'Hash SHA-256 pour détecter les doublons';
COMMENT ON COLUMN public.images.metadata IS 'Métadonnées JSON (dimensions, etc.)';

COMMENT ON COLUMN public.analyses.annotations IS 'Annotations JSON générées par l''IA';
COMMENT ON COLUMN public.analyses.processing_time_ms IS 'Temps de traitement côté serveur';
COMMENT ON COLUMN public.analyses.ai_provider IS 'Fournisseur IA utilisé (openai, anthropic)';
COMMENT ON COLUMN public.analyses.ai_model IS 'Modèle IA spécifique utilisé';
COMMENT ON COLUMN public.analyses.tokens_used IS 'Nombre de tokens consommés';

-- =============================================
-- PERMISSIONS POUR LES NOUVELLES FONCTIONS
-- =============================================

-- Permettre aux utilisateurs d'appeler get_user_storage_usage pour leurs propres données
GRANT EXECUTE ON FUNCTION get_user_storage_usage(UUID) TO authenticated;

-- Seuls les admins peuvent appeler les fonctions de nettoyage et stats globales
REVOKE EXECUTE ON FUNCTION cleanup_orphaned_images() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_platform_storage_stats() FROM PUBLIC;

-- Les fonctions seront appelées via des API routes avec des vérifications de rôle
```

## 🗂️ 2. CONFIGURATION STORAGE (À faire après le SQL)

### Dans le Dashboard Supabase > Storage :

1. **Créer les buckets** (si pas déjà fait) :
   - `analysis-images` (privé, 10MB max)
   - `temp-images` (privé, 10MB max)

2. **Configurer les policies** (copier depuis `SUPABASE_STORAGE_SETUP.md`)

## 🔧 3. VARIABLES D'ENVIRONNEMENT

### Ajouter à votre `.env.local` :

```env
# Supabase Storage Configuration (nouvelles variables)
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1
SUPABASE_STORAGE_ANALYSIS_BUCKET=analysis-images
SUPABASE_STORAGE_TEMP_BUCKET=temp-images

# Limites de stockage
MAX_FILE_SIZE=10485760
MAX_USER_STORAGE=104857600
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
```

## ✅ 4. VÉRIFICATION

### Après avoir appliqué les mises à jour :

1. **Vérifier les nouvelles colonnes** :
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name IN ('images', 'analyses') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

2. **Tester les nouvelles fonctions** :
```sql
-- Tester avec votre user_id
SELECT * FROM get_user_storage_usage('your-user-uuid-here');
SELECT * FROM get_platform_storage_stats();
```

3. **Vérifier les buckets Storage** dans le dashboard Supabase

## 🚨 NOTES IMPORTANTES

- **Sauvegarde** : Faites une sauvegarde avant d'appliquer ces changements
- **Ordre d'exécution** : Exécutez le SQL avant de configurer le Storage
- **Types TypeScript** : Les types ont déjà été mis à jour dans le projet
- **Compatibilité** : Ces changements sont rétrocompatibles avec les données existantes

## 🔄 PROCHAINES ÉTAPES

Après avoir appliqué ces mises à jour :
1. Redémarrer votre application Next.js
2. Tester l'upload d'images via l'interface
3. Vérifier que les métadonnées sont correctement sauvegardées
4. Contrôler les logs d'activité dans la table `user_activities`
