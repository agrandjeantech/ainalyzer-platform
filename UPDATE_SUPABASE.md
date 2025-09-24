# 🔄 Mise à jour Supabase - Nouveaux types d'analyses

## Instructions pour mettre à jour votre base de données Supabase

Vous avez maintenant les nouveaux types d'analyses d'accessibilité dans le fichier `database/schema.sql`. Voici comment mettre à jour votre base Supabase existante.

## Option 1 : Mise à jour ciblée (Recommandée)

Cette option met à jour uniquement les types d'analyses sans affecter vos autres données.

### Étapes :

1. **Aller dans Supabase Dashboard** → **SQL Editor**

2. **Créer une nouvelle requête** et coller ce code :

```sql
-- Supprimer les anciens types d'analyses
DELETE FROM public.analysis_types;

-- Insérer les nouveaux types d'analyses spécialisés pour l'accessibilité
INSERT INTO public.analysis_types (name, description, system_prompt, category) VALUES
(
    'Région',
    'Analyse des régions et zones principales de l''interface',
    'Analyse cette image d''interface et identifie les différentes régions principales (header, navigation, contenu principal, sidebar, footer, etc.). Pour chaque région identifiée, décris son rôle, sa position relative, et son importance dans la hiérarchie de l''information. Indique si les régions sont clairement délimitées visuellement.',
    'Structure'
),
(
    'Hiérarchie des titres',
    'Analyse de la structure hiérarchique des titres et sous-titres',
    'Examine cette image et identifie tous les titres et sous-titres visibles. Analyse leur hiérarchie visuelle (taille, poids, couleur, espacement) et détermine l''ordre logique des niveaux de titre (H1, H2, H3, etc.). Signale toute incohérence dans la hiérarchie ou les niveaux manqués qui pourraient poser des problèmes d''accessibilité.',
    'Structure'
),
(
    'Éléments interactifs',
    'Identification et analyse des éléments interactifs',
    'Identifie tous les éléments interactifs dans cette image (boutons, liens, champs de formulaire, menus déroulants, cases à cocher, etc.). Pour chaque élément, décris son type, sa fonction probable, son état visuel (actif, désactivé, sélectionné), et évalue si son rôle interactif est clairement indiqué visuellement.',
    'Interaction'
),
(
    'Ordre de navigation au clavier',
    'Analyse de l''ordre logique de navigation au clavier',
    'Examine cette interface et détermine l''ordre logique de navigation au clavier (tab order). Identifie tous les éléments focusables et propose un ordre de navigation cohérent de gauche à droite, de haut en bas. Signale les éléments qui pourraient être problématiques pour la navigation au clavier ou qui risquent d''être ignorés.',
    'Navigation'
),
(
    'Ordre de vocalisation pour les lecteurs d''écran',
    'Analyse de l''ordre de lecture pour les technologies d''assistance',
    'Analyse cette interface du point de vue d''un lecteur d''écran. Détermine l''ordre logique dans lequel les informations devraient être vocalisées pour être compréhensibles. Identifie les éléments qui pourraient créer de la confusion (contenu en colonnes, éléments positionnés absolument, etc.) et propose un ordre de lecture optimal.',
    'Accessibilité'
),
(
    'Texte alternatif',
    'Génération de textes alternatifs pour les images et éléments visuels',
    'Analyse cette image et génère des textes alternatifs appropriés pour tous les éléments visuels significatifs (images, icônes, graphiques, etc.). Distingue entre les images décoratives (alt="") et les images informatives. Pour les images informatives, fournis un texte alternatif concis mais complet qui transmet l''information essentielle. Pour les images complexes, propose également une description longue si nécessaire.',
    'Accessibilité'
);
```

3. **Cliquer sur "Run"** pour exécuter la requête

## Option 2 : Réinitialisation complète

⚠️ **ATTENTION** : Cette option supprimera TOUTES vos données existantes !

Si vous voulez repartir de zéro :

1. **Aller dans Supabase Dashboard** → **SQL Editor**
2. **Copier tout le contenu** du fichier `database/schema.sql`
3. **Coller dans l'éditeur SQL**
4. **Cliquer sur "Run"**

## Vérification

### 1. Dans Supabase Dashboard

Aller dans **Table Editor** → **analysis_types**

Vous devriez voir 6 entrées :

| name | category | active |
|------|----------|--------|
| Région | Structure | true |
| Hiérarchie des titres | Structure | true |
| Éléments interactifs | Interaction | true |
| Ordre de navigation au clavier | Navigation | true |
| Ordre de vocalisation pour les lecteurs d'écran | Accessibilité | true |
| Texte alternatif | Accessibilité | true |

### 2. Dans votre application

1. Lancer `npm run dev`
2. Aller sur http://localhost:3000/analyses
3. Vous devriez voir les 6 types d'analyses organisés par catégorie :
   - **Structure** (2 types)
   - **Interaction** (1 type)
   - **Navigation** (1 type)
   - **Accessibilité** (2 types)

## Résolution des problèmes

### Si vous avez des erreurs

1. **Vérifier les permissions** : Assurez-vous d'utiliser le bon projet Supabase
2. **Vérifier la syntaxe** : Les apostrophes dans le SQL doivent être échappées (`''`)
3. **Vérifier les contraintes** : Si vous avez des analyses existantes, elles pourraient empêcher la suppression

### Si les types n'apparaissent pas dans l'app

1. **Vérifier la connexion** : Assurez-vous que votre `.env.local` est correct
2. **Redémarrer le serveur** : `npm run dev`
3. **Vérifier la console** : Ouvrir les outils de développement pour voir les erreurs

## Prochaines étapes

Une fois la mise à jour effectuée, vous pourrez :

1. ✅ Voir les 6 types d'analyses sur `/analyses`
2. ✅ Tester l'interface collapsible par catégorie
3. ✅ Voir les prompts spécialisés pour chaque type
4. ✅ Préparer l'ÉTAPE 6 - Upload d'images

## Support

Si vous rencontrez des problèmes, vérifiez :
- Les logs de Supabase dans le Dashboard
- La console de votre navigateur
- Les erreurs dans le terminal de développement
