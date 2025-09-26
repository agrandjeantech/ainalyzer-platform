# 🔍 Guide de Diagnostic - Erreur 500 Upload d'Images

## 📋 Problème Identifié

**Symptôme :** Erreur 500 (Internal Server Error) lors de l'upload d'images sur certains ordinateurs, alors que cela fonctionne sur d'autres.

**Commit de correction :** `d2d2080` - "Fix: Improve image upload error handling and diagnostics"

## 🛠️ Améliorations Déployées

### ✅ **Logging Détaillé**
La nouvelle route d'upload inclut maintenant un logging complet à chaque étape :

1. **Headers de requête** (User-Agent, Content-Type, Content-Length)
2. **Authentification** utilisateur
3. **Parsing FormData** avec timeout de 30s
4. **Extraction fichier** avec détails (nom, taille, type)
5. **Validation** du fichier
6. **Extraction métadonnées** avec fallback pour le hash
7. **Vérification doublons**
8. **Upload Supabase** Storage
9. **Génération URL** publique
10. **Sauvegarde base** de données

### ✅ **Gestion d'Erreurs Améliorée**
- **Messages d'erreur détaillés** avec l'étape qui a échoué
- **Informations de debug** (durée, détails techniques)
- **Fallbacks** pour les opérations critiques
- **Timeout protection** pour éviter les blocages

## 🔍 Comment Diagnostiquer

### **Étape 1 : Tester sur l'Ordinateur Problématique**

1. **Ouvrez** https://ainalyzer-platform.vercel.app/real-analyze
2. **Ouvrez les outils développeur** (F12)
3. **Allez dans l'onglet Console**
4. **Tentez d'uploader** une image
5. **Notez l'erreur** exacte dans la console

### **Étape 2 : Analyser les Logs Vercel**

1. **Allez sur** https://vercel.com/dashboard
2. **Sélectionnez** votre projet ainalyzer-platform
3. **Cliquez sur** "Functions" → "/api/images/upload"
4. **Consultez les logs** en temps réel

### **Étape 3 : Identifier l'Étape qui Échoue**

La nouvelle version affiche des logs détaillés comme :
```
=== DÉBUT UPLOAD IMAGE ===
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
Content-Length: 2048576
✓ Client Supabase créé
✓ Utilisateur authentifié: 12345678-1234-1234-1234-123456789012
✓ FormData parsé
✓ Fichier extrait: { name: "image.jpg", size: 2048576, type: "image/jpeg" }
✓ Fichier validé
✓ Métadonnées extraites: { hash: "a1b2c3d4e5f6...", size: 2048576, type: "image/jpeg" }
✓ Pas de doublon détecté
✓ Chemin généré: 12345678-1234-1234-1234-123456789012/1727259600000-abc123.jpg
❌ ERREUR à l'étape: supabase_upload
```

## 🎯 Causes Potentielles et Solutions

### **1. Problème de Parsing FormData**
**Symptôme :** Erreur à l'étape `form_data_parsing`
**Causes possibles :**
- Navigateur ancien ne supportant pas FormData correctement
- Taille de fichier trop importante
- Connexion internet instable

**Solution :**
- Vérifier la version du navigateur
- Tester avec un fichier plus petit
- Vérifier la connexion internet

### **2. Problème d'Authentification**
**Symptôme :** Erreur à l'étape `authentication`
**Causes possibles :**
- Session expirée
- Cookies bloqués
- Problème de configuration Supabase

**Solution :**
- Se reconnecter
- Vérifier les paramètres de cookies
- Tester en navigation privée

### **3. Problème de Hash/Métadonnées**
**Symptôme :** Erreur à l'étape `metadata_extraction`
**Causes possibles :**
- API crypto non supportée (navigateur ancien)
- Fichier corrompu

**Solution :**
- La nouvelle version inclut un fallback automatique
- Tester avec un autre fichier

### **4. Problème Upload Supabase**
**Symptôme :** Erreur à l'étape `supabase_upload`
**Causes possibles :**
- Problème de réseau
- Bucket Supabase non configuré
- Permissions insuffisantes

**Solution :**
- Vérifier la configuration Supabase Storage
- Tester la connectivité réseau

### **5. Problème Base de Données**
**Symptôme :** Erreur à l'étape `database_save`
**Causes possibles :**
- Schema de base de données incorrect
- Contraintes de validation

**Solution :**
- Vérifier le schema de la table `images`
- Consulter les logs de base de données

## 📊 Informations de Debug Collectées

La nouvelle version collecte automatiquement :

- **User-Agent** : Identifie le navigateur et l'OS
- **Content-Type** : Vérifie le format de la requête
- **Content-Length** : Taille de la requête
- **Durée** : Temps d'exécution de chaque étape
- **Détails d'erreur** : Messages techniques précis

## 🚀 Prochaines Étapes

1. **Testez** sur l'ordinateur problématique
2. **Collectez** les logs détaillés
3. **Identifiez** l'étape qui échoue
4. **Appliquez** la solution correspondante
5. **Rapportez** les résultats pour affiner le diagnostic

## 📞 Support

Si le problème persiste après ces étapes :

1. **Copiez** les logs complets de la console
2. **Notez** l'étape exacte qui échoue
3. **Précisez** :
   - Navigateur et version
   - Système d'exploitation
   - Taille et type de fichier testé
   - Message d'erreur exact

---

*Cette version améliorée devrait permettre d'identifier précisément la cause de l'erreur 500 et de la résoudre rapidement.*
