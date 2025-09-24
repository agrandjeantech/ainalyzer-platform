# 🚀 Ainalyzer - Plateforme d'Analyse d'Images

Une plateforme web moderne d'analyse d'images pour l'accessibilité utilisant l'intelligence artificielle.

## 📋 Stack Technique

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS + Shadcn/UI
- **Backend**: Next.js API Routes + Vercel Edge Functions
- **Database**: Supabase (PostgreSQL + Auth + Storage + Sessions)
- **Authentification**: Supabase Auth (sessions natives)

## 🛠️ Installation et Configuration

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Git

### ÉTAPE 1 - Setup Initial (✅ TERMINÉ)

Le projet a été initialisé avec la configuration suivante :

```bash
# 1. Création du projet Next.js 14
npx create-next-app@latest ainalyzer-platform --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Installation des dépendances Shadcn/UI
npm install lucide-react class-variance-authority clsx tailwind-merge

# 3. Configuration Shadcn/UI
npx shadcn@latest init

# 4. Installation des composants UI de base
npx shadcn@latest add button card badge
```

### Structure du Projet

```
ainalyzer-platform/
├── src/
│   ├── app/                    # App Router Next.js 14
│   │   ├── (auth)/            # Route group - Authentification
│   │   ├── (dashboard)/       # Route group - Dashboard utilisateur
│   │   ├── (admin)/           # Route group - Interface admin
│   │   ├── api/               # API Routes
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Page d'accueil
│   ├── components/            # Composants React
│   │   ├── ui/                # Composants UI (Shadcn/UI)
│   │   ├── auth/              # Composants d'authentification
│   │   ├── dashboard/         # Composants dashboard
│   │   └── admin/             # Composants admin
│   ├── hooks/                 # Hooks React personnalisés
│   ├── types/                 # Types TypeScript
│   ├── utils/                 # Utilitaires
│   ├── constants/             # Constantes
│   └── lib/                   # Configuration (Shadcn/UI utils)
├── public/                    # Assets statiques
├── .env.local.example         # Template variables d'environnement
└── README.md                  # Documentation
```

## 🚦 Démarrage Rapide

### 1. Cloner et installer

```bash
cd ainalyzer-platform
npm install
```

### 2. Configuration des variables d'environnement

```bash
# Copier le template
cp .env.local.example .env.local

# Éditer .env.local avec vos valeurs (pour les étapes suivantes)
```

### 3. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📚 Fonctionnalités Prévues

### ✅ ÉTAPE 1 - Setup Initial (TERMINÉ)
- [x] Projet Next.js 14 avec TypeScript
- [x] Configuration TailwindCSS + Shadcn/UI
- [x] Structure de dossiers organisée
- [x] Types TypeScript de base
- [x] Page d'accueil de démonstration

### ✅ ÉTAPE 2 - Configuration Supabase + Auth (TERMINÉ)
- [x] Setup projet Supabase
- [x] Configuration client Supabase
- [x] Middleware d'authentification
- [x] Pages login/register
- [x] Schema DB initial
- [x] Dashboard utilisateur basique
- [x] Guide de configuration Supabase

### ✅ ÉTAPE 3 - Gestion des sessions utilisateur (TERMINÉ)
- [x] API pour historique des connexions
- [x] Hooks de session management
- [x] Composants session info
- [x] Logout functionality avec historique
- [x] Page de gestion des sessions
- [x] Tracking des activités utilisateur

### ✅ ÉTAPE 4 - API Keys Management (TERMINÉ)
- [x] CRUD sécurisé pour clés API
- [x] Chiffrement des clés avec pgcrypto
- [x] Interface de gestion complète
- [x] Test des clés API avec providers
- [x] Hooks React pour gestion des clés
- [x] Composants UI avancés

### ✅ ÉTAPE 5 - System d'analyses (TERMINÉ)
- [x] Configuration des 6 types d'analyses d'accessibilité
- [x] Prompts spécialisés pour chaque type
- [x] API complète pour gestion des types
- [x] Interface utilisateur pour visualiser les analyses
- [x] Hooks React pour gestion des données
- [x] Composants UI avec catégorisation

### ⏳ ÉTAPE 6 - Upload et traitement images
- [ ] Supabase Storage
- [ ] Processing pipeline
- [ ] Gestion des formats

### ⏳ ÉTAPE 7 - Interface résultats
- [ ] Visualisation annotations
- [ ] Export des résultats
- [ ] Historique des analyses

### ⏳ ÉTAPE 8 - Admin dashboard
- [ ] Interface administration
- [ ] Gestion utilisateurs
- [ ] Statistiques plateforme

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Linting ESLint

# Shadcn/UI
npx shadcn@latest add [component]  # Ajouter un composant UI
```

## 📖 Documentation de Référence

- [Next.js 14](https://nextjs.org/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Shadcn/UI](https://ui.shadcn.com/docs)
- [Supabase](https://supabase.com/docs) (pour les étapes suivantes)

## 🎯 Validation ÉTAPE 5

Pour valider que l'ÉTAPE 5 est correctement configurée :

1. ✅ `npm run dev` lance le serveur sans erreur
2. ✅ Page `/analyses` accessible depuis le dashboard
3. ✅ Affichage des 6 types d'analyses d'accessibilité
4. ✅ Catégorisation par type (Structure, Interaction, Navigation, Accessibilité)
5. ✅ Interface collapsible par catégorie
6. ✅ Aperçu des prompts système pour chaque analyse
7. ✅ Design responsive et intuitif

**Note :** Les types d'analyses sont maintenant configurés et prêts pour l'intégration avec le système d'upload d'images.

## 📝 Notes de Développement

### Types TypeScript
Les types de base sont définis dans `src/types/index.ts` et incluent :
- Types utilisateur et authentification
- Types pour les sessions et activités
- Types pour les clés API et analyses
- Types pour les composants UI et formulaires

### Configuration Shadcn/UI
- Thème : Neutral
- CSS Variables dans `src/app/globals.css`
- Utilitaires dans `src/lib/utils.ts`
- Composants dans `src/components/ui/`

### Prochaines Étapes
L'ÉTAPE 6 consistera à :
1. Upload d'images avec Supabase Storage
2. Pipeline de traitement des images
3. Gestion des formats d'images
4. Interface d'upload avec drag & drop

**Pour configurer Supabase maintenant :**
Suivre le guide détaillé dans `SUPABASE_SETUP.md`

**Note importante :** Pour tester les clés API, vous devez configurer la variable `ENCRYPTION_KEY` dans votre `.env.local` (32 caractères).

## 🤝 Contribution

Ce projet suit un développement étape par étape. Chaque étape doit être validée avant de passer à la suivante.

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.
