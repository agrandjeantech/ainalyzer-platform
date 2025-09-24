# 🚀 Guide de Déploiement - Ainalyzer Platform

## 📋 Prérequis

- [x] Projet Next.js 14+ fonctionnel
- [x] Base de données Supabase configurée
- [x] Compte GitHub/GitLab
- [ ] Compte Vercel
- [ ] Variables d'environnement préparées

## 🎯 Solution Recommandée : VERCEL

### ✅ Pourquoi Vercel ?

**Avantages techniques :**
- Support natif Next.js 15.5.3
- Edge Functions pour API Routes
- Intégration Supabase optimisée
- Déploiement automatique Git
- HTTPS et CDN inclus
- Plan gratuit généreux

**Alternatives considérées :**
- **Netlify** : Bon mais moins optimisé pour Next.js
- **Railway** : Excellent mais plus cher
- **Render** : Bien mais plus lent
- **AWS/Vercel** : Complexe à configurer

## 🚀 Étapes de Déploiement

### 1. Préparation du Repository

```bash
# Vérifier que le projet est dans Git
cd ainalyzer-platform
git status

# Si pas encore initialisé
git init
git add .
git commit -m "Initial commit - Ready for deployment"

# Pousser vers GitHub/GitLab
git remote add origin https://github.com/votre-username/ainalyzer-platform.git
git push -u origin main
```

### 2. Configuration Vercel

1. **Créer un compte** sur [vercel.com](https://vercel.com)
2. **Connecter GitHub/GitLab**
3. **Importer le projet** `ainalyzer-platform`
4. **Configurer les variables d'environnement**

### 3. Variables d'Environnement Production

```env
# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Encryption Key for API Keys Storage
ENCRYPTION_KEY=your_32_character_encryption_key

# Environment
NODE_ENV=production
```

### 4. Configuration Build (vercel.json)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["fra1"]
}
```

### 5. Optimisations Production

#### A. Next.js Config
```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

export default nextConfig
```

#### B. Middleware Optimization
```typescript
// src/middleware.ts - Déjà optimisé pour la production
```

### 6. Base de Données Production

#### A. Supabase Production Setup
1. **Créer un projet Supabase** de production (séparé du dev)
2. **Exécuter les migrations** :
   ```sql
   -- database/schema.sql
   -- database/migration_add_prompt_configuration.sql
   ```
3. **Configurer RLS policies**
4. **Setup Storage buckets**

#### B. Variables Supabase Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

## 🔧 Configuration Avancée

### 1. Domaine Personnalisé
1. **Acheter un domaine** (ex: ainalyzer.com)
2. **Configurer DNS** dans Vercel
3. **HTTPS automatique** activé

### 2. Monitoring et Analytics
```typescript
// Vercel Analytics (gratuit)
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 3. Performance Optimizations
```typescript
// Image optimization
import Image from 'next/image'

// Font optimization
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
```

## 🚨 Checklist Pré-Déploiement

### Code & Configuration
- [ ] Tests passent localement
- [ ] Build réussit (`npm run build`)
- [ ] Variables d'environnement configurées
- [ ] Supabase production configuré
- [ ] Migrations DB exécutées

### Sécurité
- [ ] Clés API sécurisées
- [ ] RLS policies activées
- [ ] CORS configuré
- [ ] Rate limiting en place

### Performance
- [ ] Images optimisées
- [ ] Bundle size vérifié
- [ ] Lighthouse score > 90

## 📊 Monitoring Post-Déploiement

### 1. Vercel Dashboard
- **Deployments** : Historique et logs
- **Functions** : Performance API routes
- **Analytics** : Trafic et performance

### 2. Supabase Dashboard
- **Database** : Monitoring des requêtes
- **Auth** : Statistiques utilisateurs
- **Storage** : Usage et performance

### 3. Logs et Debugging
```bash
# Logs Vercel
vercel logs your-deployment-url

# Logs en temps réel
vercel logs --follow
```

## 🔄 Workflow de Déploiement

### Développement → Production
1. **Développement local** avec `.env.local`
2. **Push vers Git** déclenche auto-deploy
3. **Preview deployments** pour les branches
4. **Production deployment** sur merge main

### Rollback Strategy
```bash
# Rollback vers déploiement précédent
vercel rollback
```

## 💰 Coûts Estimés

### Plan Gratuit Vercel
- **100GB** bandwidth/mois
- **1000** serverless function invocations/jour
- **Domaines personnalisés** illimités
- **HTTPS** automatique

### Plan Pro ($20/mois) si nécessaire
- **1TB** bandwidth
- **100,000** function invocations/jour
- **Analytics avancés**
- **Support prioritaire**

## 🆘 Troubleshooting

### Erreurs Communes
1. **Build fails** : Vérifier TypeScript errors
2. **API timeout** : Augmenter maxDuration
3. **Supabase connection** : Vérifier variables env
4. **Image loading** : Configurer domains

### Support
- **Vercel Docs** : [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs** : [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs** : [nextjs.org/docs](https://nextjs.org/docs)

---

## 🎯 Résumé

**Vercel est la solution optimale** pour votre plateforme d'analyse d'images car :
- Support natif Next.js 15.5.3
- Edge Functions pour vos API IA
- Intégration Supabase parfaite
- Déploiement automatique Git
- Plan gratuit généreux
- Performance et sécurité optimales

**Temps estimé de déploiement : 30-60 minutes**
