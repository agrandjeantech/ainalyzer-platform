# 🗄️ Configuration Supabase Storage - ÉTAPE 7

## 📋 OBJECTIF
Configurer Supabase Storage pour le stockage persistant des images et créer le pipeline de traitement complet.

## 🛠️ ÉTAPES DE CONFIGURATION

### 1. Création des Buckets Supabase

Connectez-vous à votre dashboard Supabase et exécutez ces commandes SQL :

```sql
-- Créer le bucket pour les images d'analyse
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'analysis-images',
  'analysis-images',
  false,
  10485760, -- 10MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Créer le bucket pour les images temporaires (pendant l'analyse)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-images',
  'temp-images',
  false,
  10485760, -- 10MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

### 2. Policies de Sécurité Storage

```sql
-- Policy pour permettre aux utilisateurs d'uploader leurs propres images
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'analysis-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour permettre aux utilisateurs de voir leurs propres images
CREATE POLICY "Users can view their own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'analysis-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour permettre aux utilisateurs de supprimer leurs propres images
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'analysis-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policies similaires pour le bucket temporaire
CREATE POLICY "Users can upload temp images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'temp-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view temp images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'temp-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete temp images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'temp-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Mise à jour du Schéma Database

```sql
-- Ajouter les colonnes pour le stockage des images
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS storage_bucket TEXT DEFAULT 'analysis-images',
ADD COLUMN IF NOT EXISTS storage_path TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS public_url TEXT,
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Index pour les recherches par hash (éviter les doublons)
CREATE INDEX IF NOT EXISTS idx_images_file_hash ON images(file_hash);
CREATE INDEX IF NOT EXISTS idx_images_storage_path ON images(storage_path);

-- Ajouter les colonnes pour les résultats d'analyse
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS result_json JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS annotations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_provider TEXT,
ADD COLUMN IF NOT EXISTS ai_model TEXT,
ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0;

-- Index pour les recherches d'analyses
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_image_id ON analyses(image_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
```

### 4. Fonctions Utilitaires

```sql
-- Fonction pour nettoyer les images temporaires anciennes
CREATE OR REPLACE FUNCTION cleanup_temp_images()
RETURNS void AS $$
BEGIN
  -- Supprimer les images temporaires de plus de 24h
  DELETE FROM storage.objects 
  WHERE bucket_id = 'temp-images' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer la taille totale des images d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(size_bytes) 
     FROM images 
     WHERE user_id = user_uuid), 
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Configuration des Variables d'Environnement

Ajoutez ces variables à votre `.env.local` :

```env
# Supabase Storage Configuration
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1
SUPABASE_STORAGE_ANALYSIS_BUCKET=analysis-images
SUPABASE_STORAGE_TEMP_BUCKET=temp-images

# Limites de stockage
MAX_FILE_SIZE=10485760
MAX_USER_STORAGE=104857600
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp
```

## 🔧 PROCHAINES ÉTAPES

1. **Créer les utilitaires de storage** (`src/lib/storage/`)
2. **Modifier ImageUploader** pour utiliser Supabase Storage
3. **Créer le pipeline d'analyse** avec sauvegarde
4. **Interface de gestion des images** uploadées
5. **Historique des analyses** par utilisateur

## ⚠️ NOTES IMPORTANTES

- Les images sont organisées par utilisateur : `{user_id}/{filename}`
- Le bucket `temp-images` est pour les analyses en cours
- Le bucket `analysis-images` est pour le stockage permanent
- Les policies RLS protègent l'accès aux images par utilisateur
- Nettoyage automatique des fichiers temporaires recommandé
