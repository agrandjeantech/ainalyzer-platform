# 🔑 Comment rendre un utilisateur administrateur

## 📋 Méthodes pour promouvoir un utilisateur au rôle admin

### 🎯 Méthode 1 : Via l'interface Supabase (Recommandée)

**1. Connectez-vous à votre dashboard Supabase :**
- Allez sur [supabase.com](https://supabase.com)
- Connectez-vous à votre projet

**2. Accédez à l'éditeur SQL :**
- Dans le menu de gauche, cliquez sur "SQL Editor"
- Ou allez dans "Database" → "SQL Editor"

**3. Exécutez cette requête SQL :**
```sql
-- Remplacez 'user@example.com' par l'email de l'utilisateur à promouvoir
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

**4. Vérifiez le changement :**
```sql
-- Vérifier que l'utilisateur est maintenant admin
SELECT id, email, role, status, created_at 
FROM public.users 
WHERE email = 'user@example.com';
```

### 🎯 Méthode 2 : Via l'éditeur de table

**1. Dans Supabase Dashboard :**
- Allez dans "Database" → "Tables"
- Cliquez sur la table `users`

**2. Trouvez l'utilisateur :**
- Utilisez la barre de recherche ou parcourez la liste
- Trouvez la ligne avec l'email de l'utilisateur

**3. Modifiez le rôle :**
- Cliquez sur la cellule `role` de cet utilisateur
- Changez la valeur de `user` à `admin`
- Appuyez sur Entrée pour sauvegarder

### 🎯 Méthode 3 : Via psql (Avancé)

Si vous avez accès direct à PostgreSQL :

```sql
-- Se connecter à la base de données
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

-- Mettre à jour le rôle
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'user@example.com';

-- Vérifier
SELECT email, role FROM public.users WHERE email = 'user@example.com';
```

## 🔍 Identifier l'utilisateur à promouvoir

### Trouver l'email de votre compte :

**Option 1 - Via l'interface :**
- Connectez-vous à votre application
- L'email est affiché dans le header du dashboard

**Option 2 - Via SQL :**
```sql
-- Voir tous les utilisateurs
SELECT id, email, role, status, created_at 
FROM public.users 
ORDER BY created_at DESC;
```

**Option 3 - Via l'Auth Supabase :**
```sql
-- Voir les utilisateurs authentifiés
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

## ✅ Vérification que ça fonctionne

**1. Après avoir changé le rôle :**
- Déconnectez-vous de l'application
- Reconnectez-vous

**2. Vérifiez l'accès admin :**
- Allez sur `/dashboard`
- Vous devriez voir la carte "Administration" en rouge
- Cliquez sur "Panel Admin" pour accéder au dashboard admin

**3. Vérifiez les permissions :**
- L'URL `/admin` devrait être accessible
- Vous devriez voir les statistiques de la plateforme
- La liste des utilisateurs devrait s'afficher

## 🚨 Important - Sécurité

**⚠️ Précautions :**
- Ne donnez le rôle admin qu'aux personnes de confiance
- Un admin peut voir tous les utilisateurs et leurs données
- Un admin a accès aux statistiques globales de la plateforme

**🔒 Bonnes pratiques :**
- Créez un compte dédié pour l'administration
- Utilisez un email professionnel pour les comptes admin
- Documentez qui a les droits admin et pourquoi

## 🛠️ Commande SQL complète recommandée

```sql
-- 1. Vérifier l'utilisateur actuel
SELECT id, email, role, status 
FROM public.users 
WHERE email = 'VOTRE_EMAIL@example.com';

-- 2. Promouvoir au rôle admin
UPDATE public.users 
SET role = 'admin', 
    updated_at = NOW()
WHERE email = 'VOTRE_EMAIL@example.com';

-- 3. Vérifier le changement
SELECT id, email, role, status, updated_at 
FROM public.users 
WHERE email = 'VOTRE_EMAIL@example.com';
```

## 🎯 Exemple concret

Si votre email est `alex@example.com` :

```sql
-- Promouvoir alex@example.com en admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'alex@example.com';

-- Vérifier
SELECT email, role FROM public.users WHERE email = 'alex@example.com';
-- Résultat attendu: alex@example.com | admin
```

**Après cette modification, reconnectez-vous à l'application et vous devriez voir le bouton "Panel Admin" dans votre dashboard !**
