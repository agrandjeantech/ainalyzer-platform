# 🔧 Configuration Supabase Storage pour les Images

## 📋 Problème Identifié

Les URLs d'images ne sont pas accessibles publiquement :
```
https://klmjtjbreenasalyvybj.supabase.co/storage/v1/object/public/analysis-images/...
```

Erreur : `400 Bad Request` - Le bucket n'est pas configuré comme public.

## ✅ Solution : Configurer le Bucket comme Public

### 1. **Aller dans Supabase Dashboard**
- Connectez-vous à [supabase.com](https://supabase.com)
- Sélectionnez votre projet
- Allez dans **Storage** dans le menu de gauche

### 2. **Configurer le Bucket `analysis-images`**

#### Option A : Via l'Interface Web
1. Cliquez sur le bucket `analysis-images`
2. Cliquez sur **Settings** (icône engrenage)
3. Cochez **Public bucket** ✅
4. Cliquez sur **Save**

#### Option B : Via SQL (plus rapide)
Exécutez cette requête dans l'éditeur SQL de Supabase :

```sql
-- Rendre le bucket analysis-images public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'analysis-images';
```

### 3. **Configurer les Politiques RLS (Row Level Security)**

Exécutez ces requêtes SQL pour permettre l'accès public aux images :

```sql
-- Politique pour permettre la lecture publique des images
CREATE POLICY "Public read access for analysis images" ON storage.objects
FOR SELECT USING (bucket_id = 'analysis-images');

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload analysis images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'analysis-images' 
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la suppression aux propriétaires
CREATE POLICY "Users can delete their own analysis images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'analysis-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. **Vérifier la Configuration**

Après avoir appliqué ces changements, testez l'URL dans votre navigateur :
```
https://klmjtjbreenasalyvybj.supabase.co/storage/v1/object/public/analysis-images/6eb8c06f-9585-4758-8905-b397ae1539a3/1758884093962-xg7xzz.png
```

L'image devrait maintenant s'afficher ! 🎉

## 🔍 Vérification Alternative

Si vous voulez vérifier que le bucket est bien public, vous pouvez exécuter :

```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'analysis-images';
```

Le champ `public` doit être `true`.

## 📝 Notes Importantes

- **Sécurité** : Les images sont organisées par dossier utilisateur, donc même si le bucket est public, les utilisateurs ne peuvent pas deviner les URLs des autres
- **Performance** : Les URLs publiques sont plus rapides car elles utilisent le CDN de Supabase
- **Cache** : Les images sont automatiquement mises en cache par le navigateur

## 🚀 Après Configuration

Une fois le bucket configuré comme public :
1. ✅ Les miniatures s'afficheront dans l'historique
2. ✅ Les images se chargeront dans la page d'analyse
3. ✅ Les annotations seront correctement positionnées
4. ✅ La génération PDF fonctionnera avec les vraies images

**C'est la solution recommandée et la plus propre !** 🎊
