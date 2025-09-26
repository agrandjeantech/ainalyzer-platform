# 🚀 Étapes Précises de Déploiement Vercel

## ✅ Étape Actuelle : Repository Connecté

Vous avez connecté Vercel à votre repository `agrandjeantech/ainalyzer-platform`. Parfait !

## 📋 Prochaines Étapes Détaillées

### 1. Importer le Projet (2 min)

Dans votre dashboard Vercel :

1. **Cliquer sur "New Project"** (bouton bleu)
2. **Trouver votre repository** : `agrandjeantech/ainalyzer-platform`
3. **Cliquer "Import"** à côté du nom du repository
4. **Vérifier la configuration** :
   - **Framework Preset** : `Next.js` (détecté automatiquement)
   - **Root Directory** : `./` (par défaut)
   - **Build Command** : `npm run build` (par défaut)
   - **Output Directory** : `.next` (par défaut)
   - **Install Command** : `npm install` (par défaut)

### 2. Configurer les Variables d'Environnement (IMPORTANT)

**AVANT de cliquer "Deploy", vous DEVEZ configurer les variables d'environnement :**

1. **Cliquer sur "Environment Variables"** (section dépliable)
2. **Ajouter ces variables une par une** :

#### Variables Obligatoires :

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app-name.vercel.app` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-prod-project.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (votre clé anon) | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (votre clé service) | Production |
| `ENCRYPTION_KEY` | `32-character-random-key` | Production |
| `NODE_ENV` | `production` | Production |

#### Comment ajouter chaque variable :
1. **Name** : Taper le nom exact (ex: `NEXT_PUBLIC_APP_URL`)
2. **Value** : Coller la valeur
3. **Environment** : Sélectionner `Production`
4. **Cliquer "Add"**
5. **Répéter** pour chaque variable

### 3. Générer une Clé de Chiffrement

Pour `ENCRYPTION_KEY`, vous avez besoin d'une clé de 32 caractères :

```bash
# Dans votre terminal local
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copiez le résultat et utilisez-le comme valeur pour `ENCRYPTION_KEY`.

### 4. Créer un Projet Supabase de Production

**IMPORTANT** : Créez un nouveau projet Supabase séparé pour la production :

1. **Aller sur** [supabase.com](https://supabase.com)
2. **Créer un nouveau projet** (pas le même que pour le développement)
3. **Nom** : `ainalyzer-production` (ou similaire)
4. **Région** : Europe (pour de meilleures performances)
5. **Attendre** que le projet soit créé (2-3 minutes)

### 5. Configurer la Base de Données Production

Une fois le projet Supabase créé :

1. **Aller dans "SQL Editor"**
2. **Copier le contenu** de `database/schema.sql`
3. **Coller et exécuter** dans l'éditeur SQL
4. **Copier le contenu** de `database/migration_add_prompt_configuration.sql`
5. **Coller et exécuter** dans l'éditeur SQL

### 6. Configurer le Storage Supabase

1. **Aller dans "Storage"**
2. **Créer un nouveau bucket** :
   - **Name** : `analysis-images`
   - **Public** : ✅ Coché
3. **Cliquer "Create bucket"**

### 7. Récupérer les Clés Supabase

1. **Aller dans "Settings" > "API"**
2. **Copier** :
   - **Project URL** → pour `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → pour `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → pour `SUPABASE_SERVICE_ROLE_KEY`

### 8. Finaliser les Variables Vercel

Retournez dans Vercel et mettez à jour les variables avec les vraies valeurs Supabase.

### 9. Déployer !

1. **Cliquer "Deploy"** (bouton bleu)
2. **Attendre** le déploiement (2-3 minutes)
3. **Vérifier** que le build réussit

## 🚨 Points d'Attention

### Variables d'Environnement
- **Ne pas oublier** `ENCRYPTION_KEY` (32 caractères)
- **Utiliser les vraies URLs** Supabase de production
- **Vérifier** que toutes les variables sont en `Production`

### Base de Données
- **Nouveau projet** Supabase pour la production
- **Exécuter les 2 fichiers SQL** dans l'ordre
- **Créer le bucket** `analysis-images`

### Première Connexion
- **Créer un compte** sur votre app déployée
- **Aller dans la base Supabase** > Auth > Users
- **Copier l'ID** de votre utilisateur
- **Exécuter** : `UPDATE users SET role = 'admin' WHERE id = 'votre-user-id';`

## ✅ Checklist de Vérification

- [ ] Repository importé dans Vercel
- [ ] Variables d'environnement configurées (6 variables)
- [ ] Projet Supabase production créé
- [ ] Base de données migrée (2 fichiers SQL)
- [ ] Bucket storage créé
- [ ] Déploiement lancé
- [ ] Build réussi
- [ ] Site accessible
- [ ] Compte admin créé

## 🆘 En Cas de Problème

### Build Failed
- Vérifier les variables d'environnement
- Regarder les logs de build dans Vercel

### Site ne se charge pas
- Vérifier les URLs Supabase
- Vérifier que la base de données est migrée

### Erreur d'authentification
- Vérifier les clés Supabase
- Vérifier que le projet Supabase est actif

---

## 🎯 Résultat Attendu

Une fois terminé, vous aurez :
- ✅ **Site en ligne** sur une URL Vercel
- ✅ **Base de données** de production
- ✅ **Authentification** fonctionnelle
- ✅ **Upload d'images** opérationnel
- ✅ **Analyses IA** prêtes à l'emploi

**Temps total estimé : 20-30 minutes**
