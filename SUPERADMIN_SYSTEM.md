# 🔐 Système de Rôles Superadmin - Ainalyzer Platform

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète du système de rôles avec le nouveau rôle **superadmin** dans la plateforme Ainalyzer.

### 🎯 Hiérarchie des Rôles

```
user < admin < superadmin
```

- **user** : Utilisateur standard avec accès aux fonctionnalités de base
- **admin** : Administrateur avec gestion des types d'analyses + tous les droits user
- **superadmin** : Super administrateur avec gestion complète des utilisateurs + tous les droits admin

## 🗄️ Modifications de Base de Données

### Migration SQL

Le fichier `database/migration_add_superadmin_role.sql` contient :

1. **Modification de la contrainte de rôle**
   ```sql
   ALTER TABLE public.users ADD CONSTRAINT users_role_check 
   CHECK (role IN ('user', 'admin', 'superadmin'));
   ```

2. **Nouvelles politiques RLS**
   - Superadmins peuvent voir tous les utilisateurs
   - Superadmins peuvent modifier les rôles et statuts
   - Superadmins ont accès à toutes les données

3. **Vues spécialisées**
   - `admin_user_management` : Vue complète pour la gestion des utilisateurs
   - `platform_statistics` : Statistiques globales de la plateforme

4. **Fonctions sécurisées**
   - `promote_user_role()` : Changer le rôle d'un utilisateur
   - `change_user_status()` : Changer le statut d'un utilisateur

### Sécurités Intégrées

- **Protection du dernier superadmin** : Impossible de rétrograder ou suspendre le dernier superadmin actif
- **Audit trail** : Toutes les modifications sont enregistrées dans `user_activities`
- **Validation stricte** : Vérification des rôles et statuts valides

## 🔧 API Routes

### Gestion des Utilisateurs

#### `GET /api/admin/users`
- **Accès** : Superadmin uniquement
- **Fonction** : Récupérer la liste des utilisateurs avec filtres et pagination
- **Paramètres** :
  - `limit` : Nombre d'utilisateurs par page (défaut: 50)
  - `offset` : Décalage pour la pagination (défaut: 0)
  - `search` : Recherche par email ou nom d'affichage
  - `role` : Filtrer par rôle (user/admin/superadmin)
  - `status` : Filtrer par statut (active/inactive/suspended)

#### `PUT /api/admin/users/[id]/role`
- **Accès** : Superadmin uniquement
- **Fonction** : Modifier le rôle d'un utilisateur
- **Body** : `{ "new_role": "user|admin|superadmin" }`
- **Sécurités** : Empêche la rétrogradation du dernier superadmin

#### `PUT /api/admin/users/[id]/status`
- **Accès** : Superadmin uniquement
- **Fonction** : Modifier le statut d'un utilisateur
- **Body** : `{ "new_status": "active|inactive|suspended" }`
- **Sécurités** : Empêche la suspension du dernier superadmin actif

#### `GET /api/admin/statistics`
- **Accès** : Superadmin uniquement
- **Fonction** : Récupérer les statistiques globales de la plateforme
- **Retour** : Métriques complètes d'utilisation et d'activité

## 🎨 Types TypeScript

### Nouveaux Types

```typescript
export type UserRole = 'user' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserManagement extends User {
  display_name: string;
  preferences: Record<string, unknown>;
  total_images: number;
  total_analyses: number;
  total_api_keys: number;
  last_activity?: string;
  recently_active: boolean;
}

export interface PlatformStatistics {
  total_users: number;
  total_admins: number;
  total_superadmins: number;
  active_users: number;
  users_last_24h: number;
  users_last_7d: number;
  total_images: number;
  total_analyses: number;
  total_api_keys: number;
  images_last_24h: number;
  analyses_last_24h: number;
  avg_images_per_user: number;
  avg_analyses_per_user: number;
}
```

### Système de Permissions

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { resource: 'own_profile', action: 'read' },
    { resource: 'own_profile', action: 'update' },
    { resource: 'own_images', action: 'create' },
    // ... autres permissions user
  ],
  admin: [
    // Hérite de tous les droits user +
    { resource: 'analysis_types', action: 'create' },
    { resource: 'analysis_types', action: 'update' },
    { resource: 'analysis_types', action: 'delete' },
  ],
  superadmin: [
    // Hérite de tous les droits admin + user +
    { resource: 'all_users', action: 'read' },
    { resource: 'all_users', action: 'update' },
    { resource: 'user_roles', action: 'update' },
    { resource: 'user_status', action: 'update' },
    { resource: 'platform_statistics', action: 'read' },
    // ... autres permissions superadmin
  ],
};
```

## 🛠️ Utilitaires de Permissions

### Fonctions Principales

```typescript
// Vérifier une permission spécifique
hasPermission(userRole: UserRole, resource: string, action: string): boolean

// Vérifier si un utilisateur est admin ou superadmin
isAdmin(userRole: UserRole): boolean

// Vérifier si un utilisateur est superadmin
isSuperAdmin(userRole: UserRole): boolean

// Vérifier si un rôle peut modifier un autre rôle
canModifyRole(currentUserRole: UserRole, targetUserRole: UserRole, newRole: UserRole): boolean

// Hook React pour les permissions
usePermissions(userRole: UserRole | undefined)
```

### Utilitaires d'Affichage

```typescript
// Obtenir le label d'affichage d'un rôle
getRoleLabel(role: UserRole): string
// user -> "Utilisateur", admin -> "Administrateur", superadmin -> "Super Administrateur"

// Obtenir la couleur d'affichage d'un rôle
getRoleColor(role: UserRole): string
// user -> "bg-gray-100 text-gray-800", admin -> "bg-blue-100 text-blue-800", etc.

// Obtenir l'icône d'un rôle
getRoleIcon(role: UserRole): string
// user -> "👤", admin -> "🛡️", superadmin -> "👑"
```

## 🚀 Déploiement

### Étapes de Migration

1. **Exécuter la migration SQL**
   ```sql
   -- Dans Supabase SQL Editor
   -- Copier/coller le contenu de database/migration_add_superadmin_role.sql
   ```

2. **Créer le premier superadmin**
   ```sql
   UPDATE public.users 
   SET role = 'superadmin' 
   WHERE email = 'votre-email@example.com';
   ```

3. **Déployer le code**
   ```bash
   git add .
   git commit -m "feat: Add superadmin role system"
   git push origin master
   ```

4. **Vérifier le déploiement**
   - Tester la connexion avec le compte superadmin
   - Vérifier l'accès aux nouvelles fonctionnalités
   - Tester les permissions et restrictions

### Variables d'Environnement

Aucune nouvelle variable d'environnement requise. Le système utilise les connexions Supabase existantes.

## 🔒 Sécurité

### Mesures de Protection

1. **Protection du dernier superadmin**
   - Impossible de rétrograder le dernier superadmin
   - Impossible de suspendre le dernier superadmin actif
   - Vérifications côté serveur ET base de données

2. **Audit complet**
   - Toutes les modifications de rôles/statuts sont loggées
   - Traçabilité complète dans `user_activities`
   - Horodatage et détails de chaque action

3. **Validation stricte**
   - Vérification des permissions à chaque requête
   - Validation des rôles et statuts
   - Protection contre les injections SQL via Supabase RLS

4. **Isolation des données**
   - Row Level Security (RLS) activé sur toutes les tables
   - Politiques spécifiques par rôle
   - Accès restreint selon les permissions

### Bonnes Pratiques

1. **Gestion des superadmins**
   - Limiter le nombre de superadmins (2-3 maximum)
   - Utiliser des comptes dédiés avec authentification forte
   - Réviser régulièrement les accès

2. **Monitoring**
   - Surveiller les activités des superadmins
   - Alertes sur les modifications de rôles critiques
   - Audit régulier des permissions

3. **Sauvegarde**
   - Sauvegarder la base de données avant les migrations
   - Tester les migrations sur un environnement de développement
   - Plan de rollback en cas de problème

## 📊 Interface Utilisateur

### Fonctionnalités Prévues

1. **Dashboard Superadmin**
   - Vue d'ensemble des statistiques
   - Graphiques d'activité
   - Alertes et notifications

2. **Gestion des Utilisateurs**
   - Liste paginée avec filtres
   - Modification des rôles en un clic
   - Gestion des statuts (actif/suspendu)
   - Historique des modifications

3. **Statistiques Avancées**
   - Métriques d'utilisation
   - Tendances d'activité
   - Rapports d'export

4. **Audit Trail**
   - Journal des activités
   - Filtres par utilisateur/action
   - Export des logs

## 🧪 Tests

### Tests à Effectuer

1. **Tests de Permissions**
   - Vérifier l'accès aux routes selon les rôles
   - Tester les restrictions de modification
   - Valider les protections du dernier superadmin

2. **Tests d'Interface**
   - Navigation selon les rôles
   - Affichage conditionnel des fonctionnalités
   - Gestion des erreurs

3. **Tests de Sécurité**
   - Tentatives d'accès non autorisé
   - Validation des données d'entrée
   - Protection contre les attaques courantes

## 📝 Notes de Version

### Version 1.0 - Système Superadmin

**Nouvelles fonctionnalités :**
- ✅ Rôle superadmin avec permissions étendues
- ✅ API complète de gestion des utilisateurs
- ✅ Système de permissions hiérarchique
- ✅ Protection du dernier superadmin
- ✅ Audit trail complet
- ✅ Statistiques de plateforme

**Améliorations :**
- ✅ Types TypeScript complets
- ✅ Utilitaires de permissions
- ✅ Documentation complète
- ✅ Sécurité renforcée

**À venir :**
- 🔄 Interface utilisateur superadmin
- 🔄 Dashboard de statistiques
- 🔄 Système de notifications
- 🔄 Export de données

---

## 🆘 Support

Pour toute question ou problème concernant le système superadmin :

1. Consulter cette documentation
2. Vérifier les logs Supabase
3. Tester sur l'environnement de développement
4. Contacter l'équipe de développement

**Important** : Toujours tester les modifications sur un environnement de développement avant la production !
