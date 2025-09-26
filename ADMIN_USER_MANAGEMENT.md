# 🛡️ Guide d'Administration - Gestion des Utilisateurs

## 📋 Vue d'ensemble

L'interface d'administration d'Ainalyzer permet aux Super Administrateurs de gérer complètement les utilisateurs de la plateforme avec des fonctionnalités avancées de gestion des rôles et des statuts.

## 🚀 Fonctionnalités Disponibles

### ✅ **Interface Admin Complète**
- **Statistiques détaillées** : Utilisateurs, images, analyses, stockage
- **Métriques avancées** : Moyennes par utilisateur, top utilisateurs
- **Gestion des utilisateurs** : Actions complètes sur chaque utilisateur
- **Gestion des types d'analyses** : Configuration des prompts

### 🔐 **Système de Rôles**

#### **Hiérarchie des Rôles**
1. **User** (Utilisateur standard)
   - Accès aux fonctionnalités de base
   - Upload d'images et analyses
   - Gestion de ses propres clés API

2. **Admin** (Administrateur)
   - Accès à l'interface d'administration
   - Gestion des types d'analyses
   - Consultation des statistiques
   - **Ne peut pas modifier les utilisateurs**

3. **SuperAdmin** (Super Administrateur)
   - Tous les droits d'un Admin
   - **Gestion complète des utilisateurs**
   - Promotion/rétrogradation des rôles
   - Suspension/réactivation des comptes
   - Suppression définitive des utilisateurs

## 🎯 Actions Disponibles pour les Super Administrateurs

### **1. Gestion des Rôles**

#### **Promouvoir un Utilisateur → Admin**
- Bouton : `Promouvoir Admin`
- Donne accès à l'interface d'administration
- Permet la gestion des types d'analyses

#### **Promouvoir un Admin → SuperAdmin**
- Bouton : `Promouvoir SuperAdmin`
- Donne tous les droits de gestion des utilisateurs
- **Attention** : Action critique, bien réfléchir

#### **Révoquer les Droits Admin**
- Bouton : `Révoquer Admin`
- Rétrograde un Admin vers User
- Retire l'accès à l'interface d'administration

### **2. Gestion des Statuts**

#### **Suspendre un Utilisateur**
- Bouton : `Suspendre`
- Bloque l'accès à la plateforme
- Conserve les données utilisateur
- **Réversible**

#### **Réactiver un Utilisateur**
- Bouton : `Réactiver`
- Restaure l'accès à la plateforme
- Disponible pour les comptes suspendus

### **3. Suppression Définitive**

#### **Supprimer un Utilisateur**
- Bouton : `Supprimer` (rouge)
- **⚠️ ACTION IRRÉVERSIBLE**
- Double confirmation requise
- Supprime **TOUTES** les données :
  - Compte utilisateur
  - Images uploadées
  - Analyses effectuées
  - Clés API
  - Historique d'activité

## 🛡️ Protections de Sécurité

### **Restrictions Importantes**
- ✅ **Auto-protection** : Impossible de se modifier soi-même
- ✅ **Protection SuperAdmin** : Impossible de modifier un autre SuperAdmin
- ✅ **Confirmations multiples** : Double confirmation pour les suppressions
- ✅ **Audit trail** : Toutes les actions sont enregistrées
- ✅ **Vérifications côté serveur** : Impossible de contourner les protections

### **Qui Peut Faire Quoi**

| Action | User | Admin | SuperAdmin |
|--------|------|-------|------------|
| Voir l'interface admin | ❌ | ✅ | ✅ |
| Gérer les types d'analyses | ❌ | ✅ | ✅ |
| Voir les statistiques | ❌ | ✅ | ✅ |
| Modifier les rôles | ❌ | ❌ | ✅ |
| Suspendre/réactiver | ❌ | ❌ | ✅ |
| Supprimer des utilisateurs | ❌ | ❌ | ✅ |

## 📊 Interface Utilisateur

### **Informations Affichées pour Chaque Utilisateur**
- **Identité** : Nom d'affichage, email
- **Rôle** : Badge coloré avec icône
- **Statut** : Active, Inactive, Suspended
- **Statistiques** :
  - Nombre d'images uploadées
  - Nombre d'analyses effectuées
  - Nombre de clés API configurées
  - Espace de stockage utilisé (MB)
- **Dates** :
  - Date de création du compte
  - Dernière connexion

### **Boutons d'Actions Contextuels**
Les boutons s'affichent selon :
- Le rôle de l'utilisateur connecté
- Le rôle de l'utilisateur cible
- Le statut de l'utilisateur cible

## ⚠️ Bonnes Pratiques

### **Avant de Promouvoir un SuperAdmin**
1. **Vérifier l'identité** de la personne
2. **Confirmer la nécessité** de ces droits étendus
3. **S'assurer de la confiance** accordée
4. **Documenter** la décision

### **Avant de Supprimer un Utilisateur**
1. **Vérifier** qu'il n'y a pas d'erreur d'identité
2. **Sauvegarder** les données importantes si nécessaire
3. **Confirmer** que la suppression est définitive
4. **Double-vérifier** la décision

### **Gestion des Suspensions**
- **Préférer la suspension** à la suppression quand possible
- **Documenter** les raisons de la suspension
- **Revoir régulièrement** les comptes suspendus
- **Communiquer** avec l'utilisateur si approprié

## 🔧 Accès à l'Interface Admin

### **URL d'Accès**
```
https://votre-domaine.com/admin
```

### **Prérequis**
- Être connecté avec un compte Admin ou SuperAdmin
- Avoir le rôle approprié dans la base de données

### **Redirection Automatique**
- Les utilisateurs non-admin sont redirigés vers `/dashboard`
- Les utilisateurs non-connectés sont redirigés vers `/login`

## 📈 Statistiques Disponibles

### **Métriques Globales**
- **Nombre total d'utilisateurs**
- **Nombre total d'images**
- **Nombre total d'analyses**
- **Espace de stockage utilisé** (GB)

### **Métriques Moyennes**
- **Images par utilisateur**
- **Stockage par utilisateur** (MB)

### **Top Utilisateurs**
- **Classement par stockage utilisé**
- **Affichage des 5 premiers**

## 🚨 Gestion des Erreurs

### **Messages d'Erreur Courants**
- `"Accès refusé"` → Vérifier le rôle SuperAdmin
- `"Utilisateur non trouvé"` → L'utilisateur a peut-être été supprimé
- `"Impossible de se modifier soi-même"` → Protection de sécurité
- `"Impossible de modifier un autre superadmin"` → Protection de sécurité

### **En Cas de Problème**
1. **Vérifier** les logs du serveur
2. **Confirmer** les rôles dans la base de données
3. **Redémarrer** le serveur si nécessaire
4. **Vérifier** les variables d'environnement

## 🎉 Résultat Final

Vous disposez maintenant d'un **système d'administration complet et sécurisé** pour gérer tous les aspects des utilisateurs de votre plateforme Ainalyzer !

### **Fonctionnalités Opérationnelles**
- ✅ Interface moderne et intuitive
- ✅ Actions sécurisées avec confirmations
- ✅ Protections contre les erreurs critiques
- ✅ Audit trail des actions importantes
- ✅ Statistiques détaillées en temps réel
- ✅ Gestion complète du cycle de vie utilisateur

**Votre plateforme est maintenant prête pour une utilisation en production avec un système d'administration de niveau entreprise !** 🚀👑
