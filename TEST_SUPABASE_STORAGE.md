# 🧪 Tests pour vérifier la mise à jour Supabase Storage

## 🔍 1. Vérifier les nouvelles colonnes

```sql
-- Vérifier les colonnes de la table images
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'images' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

```sql
-- Vérifier les colonnes de la table analyses
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'analyses' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## 🔧 2. Tester les fonctions (si elles existent)

```sql
-- Vérifier quelles fonctions existent
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%storage%' OR routine_name LIKE '%cleanup%';
```

```sql
-- Tester get_user_storage_usage avec votre UUID
SELECT * FROM get_user_storage_usage('6eb8c06f-9585-4758-8905-b397ae1539a3');
```

```sql
-- Si la fonction n'existe pas, créer une version simple pour tester
CREATE OR REPLACE FUNCTION test_user_images(user_uuid UUID)
RETURNS TABLE(
  image_count BIGINT,
  total_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as image_count,
    COALESCE(SUM(size_bytes), 0) as total_size
  FROM public.images 
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```sql
-- Tester la fonction simple
SELECT * FROM test_user_images('6eb8c06f-9585-4758-8905-b397ae1539a3');
```

## 📊 3. Vérifier les données existantes

```sql
-- Compter les utilisateurs
SELECT COUNT(*) as total_users FROM public.users;
```

```sql
-- Compter les images
SELECT COUNT(*) as total_images FROM public.images;
```

```sql
-- Vérifier vos données personnelles
SELECT 
  id,
  original_name,
  size_bytes,
  format,
  storage_bucket,
  file_hash,
  uploaded_at
FROM public.images 
WHERE user_id = '6eb8c06f-9585-4758-8905-b397ae1539a3'
ORDER BY uploaded_at DESC;
```

## 🗂️ 4. Vérifier les buckets Storage

Dans le dashboard Supabase > Storage, vérifiez que vous avez :
- ✅ Bucket `analysis-images`
- ✅ Bucket `temp-images`

## 🔄 5. Si les fonctions n'existent pas

Si vous obtenez des erreurs "function does not exist", exécutez ces fonctions simplifiées :

```sql
-- Version simplifiée de get_user_storage_usage
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
        COALESCE(storage_bucket, 'unknown'), 
        jsonb_build_object(
          'count', COUNT(*),
          'size_bytes', COALESCE(SUM(size_bytes), 0)
        )
      ), 
      '{}'::jsonb
    ) as storage_by_bucket
  FROM public.images 
  WHERE user_id = user_uuid
  GROUP BY storage_bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```sql
-- Version simplifiée de get_platform_storage_stats
CREATE OR REPLACE FUNCTION get_platform_storage_stats()
RETURNS TABLE(
  total_users INTEGER,
  total_images INTEGER,
  total_size_gb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(DISTINCT id)::INTEGER FROM public.users) as total_users,
    COUNT(*)::INTEGER as total_images,
    ROUND((COALESCE(SUM(size_bytes), 0) / 1024.0 / 1024.0 / 1024.0)::NUMERIC, 2) as total_size_gb
  FROM public.images;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## ✅ 6. Tests finaux

```sql
-- Test final avec votre UUID
SELECT * FROM get_user_storage_usage('6eb8c06f-9585-4758-8905-b397ae1539a3');
```

```sql
-- Test des statistiques globales
SELECT * FROM get_platform_storage_stats();
```

## 🚨 Résolution des problèmes

Si vous continuez à avoir des erreurs :

1. **Vérifiez les permissions** :
```sql
GRANT EXECUTE ON FUNCTION get_user_storage_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_platform_storage_stats() TO authenticated;
```

2. **Vérifiez que les tables existent** :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('images', 'analyses', 'users');
```

3. **Recréez les fonctions une par une** en utilisant les versions simplifiées ci-dessus.
