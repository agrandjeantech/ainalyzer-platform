# 🔧 Configuration des Variables d'Environnement Vercel

## 📋 **ÉTAPES POUR AJOUTER/MODIFIER LES VARIABLES**

### **1. Accéder aux Paramètres Vercel**

1. **Aller sur** [vercel.com](https://vercel.com)
2. **Se connecter** avec votre compte
3. **Cliquer** sur votre projet `ainalyzer-platform`
4. **Aller dans** l'onglet **"Settings"** (en haut)
5. **Cliquer** sur **"Environment Variables"** (dans le menu de gauche)

### **2. Ajouter NEXT_PUBLIC_APP_URL**

#### **Si la variable n'existe pas encore :**
1. **Dans la section "Environment Variables"**
2. **Name** : `NEXT_PUBLIC_APP_URL`
3. **Value** : `https://votre-app-name.vercel.app` (remplacez par votre vraie URL)
4. **Environment** : Sélectionner `Production`
5. **Cliquer** "Add"

#### **Si la variable existe déjà :**
1. **Trouver** `NEXT_PUBLIC_APP_URL` dans la liste
2. **Cliquer** sur les **3 points** (⋯) à droite
3. **Cliquer** "Edit"
4. **Modifier** la valeur avec votre vraie URL
5. **Cliquer** "Save"

### **3. Variables Complètes à Configurer**

Voici toutes les variables nécessaires :

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://votre-app-name.vercel.app` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-prod-project.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (votre clé anon) | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (votre clé service) | Production |
| `ENCRYPTION_KEY` | `32-character-random-key` | Production |
| `NODE_ENV` | `production` | Production |

### **4. Générer une Clé de Chiffrement**

Pour `ENCRYPTION_KEY`, exécutez cette commande dans votre terminal local :

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copiez le résultat et utilisez-le comme valeur.

### **5. Redéployer Après Modification**

**Important :** Après avoir ajouté/modifié des variables :

1. **Aller dans** l'onglet **"Deployments"**
2. **Cliquer** sur les **3 points** (⋯) du dernier déploiement
3. **Cliquer** "Redeploy"
4. **Confirmer** le redéploiement

**Ou automatiquement :**
- Les variables seront prises en compte au prochain push Git

### **6. Vérifier les Variables**

Pour vérifier que les variables sont bien configurées :

1. **Dans "Environment Variables"**, vous devriez voir toutes vos variables
2. **Dans "Deployments"**, le dernier build devrait réussir
3. **Sur votre site**, les fonctionnalités devraient marcher

## 🎯 **EXEMPLE CONCRET**

Si votre URL Vercel est `https://ainalyzer-platform-git-master-agrandjeantech.vercel.app` :

```
Name: NEXT_PUBLIC_APP_URL
Value: https://ainalyzer-platform-git-master-agrandjeantech.vercel.app
Environment: Production
```

## 🚨 **Points Importants**

### **Variables Publiques vs Privées**
- **`NEXT_PUBLIC_*`** : Visibles côté client (navigateur)
- **Autres variables** : Seulement côté serveur (sécurisées)

### **Redéploiement Nécessaire**
- Les nouvelles variables ne sont actives qu'après redéploiement
- Vercel peut redéployer automatiquement ou manuellement

### **Environnements**
- **Production** : Pour votre site en ligne
- **Preview** : Pour les branches de test (optionnel)
- **Development** : Pour le développement local (optionnel)

## ✅ **Checklist de Vérification**

- [ ] `NEXT_PUBLIC_APP_URL` configurée avec la vraie URL Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurée (projet Supabase production)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurée
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurée
- [ ] `ENCRYPTION_KEY` générée et configurée
- [ ] `NODE_ENV` = `production`
- [ ] Redéploiement effectué
- [ ] Site accessible et fonctionnel

## 🆘 **En Cas de Problème**

### **Variable non prise en compte**
- Vérifier l'orthographe exacte
- Redéployer manuellement
- Vérifier l'environnement (Production)

### **Site ne fonctionne pas**
- Vérifier les logs dans Vercel > Functions
- Vérifier que Supabase est configuré
- Vérifier que toutes les variables sont présentes

---

**Une fois toutes les variables configurées, votre plateforme d'analyse d'images sera pleinement opérationnelle ! 🚀**
