# 🔧 Correction des Redirections Supabase vers Localhost

## 🚨 **PROBLÈME IDENTIFIÉ**

Quand vous utilisez les magic links ou la récupération de mot de passe, Supabase vous redirige vers `localhost` au lieu de votre URL Vercel de production.

## ✅ **SOLUTION : Configurer les URLs de Redirection Supabase**

### **1. Accéder aux Paramètres Supabase**

1. **Aller sur** [supabase.com](https://supabase.com)
2. **Se connecter** avec votre compte
3. **Sélectionner** votre projet de production
4. **Aller dans** "Settings" (icône engrenage en bas à gauche)
5. **Cliquer** sur "Authentication" dans le menu

### **2. Configurer les URLs de Redirection**

#### **Site URL (URL principale)**
1. **Trouver** la section **"Site URL"**
2. **Remplacer** `http://localhost:3000` 
3. **Par** votre URL Vercel : `https://votre-app-name.vercel.app`
4. **Cliquer** "Save"

#### **Redirect URLs (URLs autorisées)**
1. **Trouver** la section **"Redirect URLs"**
2. **Ajouter** ces URLs (une par ligne) :
   ```
   https://votre-app-name.vercel.app/auth/callback
   https://votre-app-name.vercel.app/dashboard
   https://votre-app-name.vercel.app/login
   https://votre-app-name.vercel.app/**
   ```
3. **Supprimer** les URLs localhost si présentes
4. **Cliquer** "Save"

### **3. Configuration Complète Recommandée**

#### **Site URL**
```
https://votre-app-name.vercel.app
```

#### **Redirect URLs** (ajouter toutes ces lignes)
```
https://votre-app-name.vercel.app/auth/callback
https://votre-app-name.vercel.app/dashboard
https://votre-app-name.vercel.app/login
https://votre-app-name.vercel.app/register
https://votre-app-name.vercel.app/**
```

### **4. Vérifier les Templates d'Email**

1. **Aller dans** "Authentication" > "Email Templates"
2. **Vérifier** que les liens dans les templates utilisent `{{ .SiteURL }}`
3. **Templates à vérifier :**
   - **Confirm signup** (confirmation d'inscription)
   - **Magic Link** (lien magique)
   - **Change Email Address** (changement d'email)
   - **Reset Password** (réinitialisation mot de passe)

#### **Exemple de template correct :**
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirm your mail</a></p>
```

### **5. Tester les Redirections**

Après configuration :

1. **Essayer** un magic link
2. **Essayer** la récupération de mot de passe
3. **Vérifier** que vous êtes redirigé vers votre URL Vercel

## 🎯 **EXEMPLE CONCRET**

Si votre URL Vercel est `https://ainalyzer-platform-git-master-agrandjeantech.vercel.app` :

#### **Site URL**
```
https://ainalyzer-platform-git-master-agrandjeantech.vercel.app
```

#### **Redirect URLs**
```
https://ainalyzer-platform-git-master-agrandjeantech.vercel.app/auth/callback
https://ainalyzer-platform-git-master-agrandjeantech.vercel.app/dashboard
https://ainalyzer-platform-git-master-agrandjeantech.vercel.app/login
https://ainalyzer-platform-git-master-agrandjeantech.vercel.app/register
https://ainalyzer-platform-git-master-agrandjeantech.vercel.app/**
```

## 🚨 **POINTS IMPORTANTS**

### **Wildcard URL**
- `/**` à la fin permet toutes les sous-routes
- Utile pour les redirections dynamiques

### **HTTPS Obligatoire**
- Toujours utiliser `https://` en production
- Jamais `http://` pour les URLs de production

### **Pas de Slash Final**
- ❌ `https://votre-app.vercel.app/`
- ✅ `https://votre-app.vercel.app`

## 🔄 **WORKFLOW COMPLET**

### **Pour un Nouveau Projet Supabase**
1. **Créer** le projet Supabase
2. **Configurer** immédiatement les URLs de production
3. **Tester** l'authentification

### **Pour un Projet Existant**
1. **Modifier** Site URL vers production
2. **Ajouter** les Redirect URLs de production
3. **Supprimer** les URLs localhost
4. **Tester** les fonctionnalités

## ✅ **CHECKLIST DE VÉRIFICATION**

- [ ] Site URL configurée avec l'URL Vercel
- [ ] Redirect URLs ajoutées (callback, dashboard, login, register, wildcard)
- [ ] URLs localhost supprimées
- [ ] Templates d'email vérifiés
- [ ] Magic links testés
- [ ] Récupération mot de passe testée
- [ ] Redirections fonctionnelles

## 🆘 **TROUBLESHOOTING**

### **Toujours redirigé vers localhost**
- Vider le cache du navigateur
- Vérifier que les URLs sont bien sauvegardées
- Attendre quelques minutes (propagation)

### **Erreur "Invalid redirect URL"**
- Vérifier l'orthographe exacte de l'URL
- Vérifier que l'URL est dans la liste autorisée
- Ajouter le wildcard `/**`

### **Magic links ne fonctionnent pas**
- Vérifier les templates d'email
- Vérifier que `{{ .SiteURL }}` est utilisé
- Tester avec un autre email

---

**Une fois configuré, tous vos liens Supabase redirigeront correctement vers votre site Vercel ! 🚀**
