# 🔧 Configuration Supabase pour Ainalyzer

## 📋 Étapes de Configuration

### 1. Créer un projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Se connecter ou créer un compte
3. Cliquer sur "New Project"
4. Choisir une organisation
5. Nommer le projet : `ainalyzer-platform`
6. Générer un mot de passe sécurisé pour la base de données
7. Choisir une région proche (ex: Europe West)
8. Cliquer sur "Create new project"

### 2. Récupérer les clés de configuration

Une fois le projet créé :

1. Aller dans **Settings** > **API**
2. Copier les valeurs suivantes :
   - **Project URL** : `https://your-project-id.supabase.co`
   - **anon public key** : `eyJ...` (clé publique)
   - **service_role key** : `eyJ...` (clé privée - à garder secrète)

### 3. Configurer les variables d'environnement

1. Dans le projet, copier le template :
```bash
cp .env.local.example .env.local
```

2. Éditer `.env.local` avec vos valeurs :
```env
# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Encryption Key for API Keys Storage (générer une clé de 32 caractères)
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Development
NODE_ENV=development
```

### 4. Exécuter le schéma de base de données

1. Dans Supabase Dashboard, aller dans **SQL Editor**
2. Cliquer sur "New query"
3. Copier tout le contenu du fichier `database/schema.sql`
4. Coller dans l'éditeur SQL
5. Cliquer sur "Run" pour exécuter le script

⚠️ **Important** : Le script doit s'exécuter sans erreur. Si des erreurs apparaissent, vérifier que :
- Les extensions `uuid-ossp` et `pgcrypto` sont activées
- Aucune table n'existe déjà avec les mêmes noms

### 5. Configurer l'authentification

1. Dans Supabase Dashboard, aller dans **Authentication** > **Settings**
2. Dans **Site URL**, ajouter : `http://localhost:3000`
3. Dans **Redirect URLs**, ajouter :
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth/callback`

### 6. Configurer le Storage (optionnel pour l'instant)

1. Aller dans **Storage**
2. Créer un bucket nommé `images`
3. Configurer les policies pour permettre aux utilisateurs d'uploader leurs images

## 🧪 Test de l'authentification

### 1. Démarrer l'application

```bash
cd ainalyzer-platform
npm run dev
```

### 2. Tester le flux d'authentification

1. Ouvrir http://localhost:3000
2. Cliquer sur "Inscription"
3. Créer un compte avec un email valide
4. Vérifier que :
   - Le compte est créé dans Supabase Auth
   - L'utilisateur est redirigé vers `/dashboard`
   - Les données apparaissent dans les tables `users` et `user_profiles`

### 3. Tester la connexion

1. Se déconnecter depuis le dashboard
2. Aller sur `/login`
3. Se connecter avec les identifiants créés
4. Vérifier la redirection vers le dashboard

### 4. Vérifier les données dans Supabase

1. Dans **Authentication** > **Users** : voir le nouvel utilisateur
2. Dans **Table Editor** > **users** : voir l'entrée utilisateur
3. Dans **Table Editor** > **user_profiles** : voir le profil créé

## 🔍 Vérification des Tables

Après exécution du schéma, vous devriez voir ces tables dans **Table Editor** :

### Tables principales :
- ✅ `users` - Utilisateurs étendant auth.users
- ✅ `user_profiles` - Profils utilisateur
- ✅ `user_activities` - Journal d'activités
- ✅ `login_history` - Historique des connexions
- ✅ `api_keys` - Clés API chiffrées
- ✅ `analysis_types` - Types d'analyses (avec données initiales)
- ✅ `images` - Métadonnées des images
- ✅ `analyses` - Résultats des analyses

### Vues :
- ✅ `user_stats` - Statistiques utilisateur
- ✅ `recent_analyses` - Analyses récentes

### Fonctions :
- ✅ `encrypt_api_key()` - Chiffrement des clés API
- ✅ `decrypt_api_key()` - Déchiffrement des clés API
- ✅ `handle_new_user()` - Création automatique du profil

## 🚨 Dépannage

### Erreur "Cannot find module '@/types/database'"
- Normal avant la configuration Supabase
- Les types seront reconnus une fois les tables créées

### Erreur de connexion Supabase
- Vérifier les variables d'environnement dans `.env.local`
- Redémarrer le serveur de développement après modification

### Erreur lors de l'inscription
- Vérifier que le schéma SQL a été exécuté correctement
- Vérifier les policies RLS dans Supabase

### Tables non visibles
- Vérifier que le script SQL s'est exécuté sans erreur
- Actualiser la page dans Supabase Dashboard

## 📝 Prochaines étapes

Une fois l'authentification fonctionnelle :

1. **ÉTAPE 3** - Gestion des sessions utilisateur
2. **ÉTAPE 4** - API Keys Management  
3. **ÉTAPE 5** - System d'analyses
4. **ÉTAPE 6** - Upload et traitement images
5. **ÉTAPE 7** - Interface résultats
6. **ÉTAPE 8** - Admin dashboard

## 🔐 Sécurité

- ⚠️ Ne jamais commiter le fichier `.env.local`
- ⚠️ Garder la `service_role_key` secrète
- ⚠️ Utiliser HTTPS en production
- ⚠️ Configurer les bonnes URL de redirection en production
