-- Migration : Ajout des colonnes de configuration des prompts
-- Date : 2025-01-19
-- Description : Ajoute les colonnes pour personnaliser les prompts techniques par type d'analyse

-- =============================================
-- AJOUT DES NOUVELLES COLONNES
-- =============================================

-- Ajouter les colonnes de configuration des prompts à analysis_types
ALTER TABLE public.analysis_types 
ADD COLUMN coordination_prompt TEXT,
ADD COLUMN formatting_instructions TEXT,
ADD COLUMN annotation_rules TEXT;

-- Commentaires sur les nouvelles colonnes
COMMENT ON COLUMN public.analysis_types.coordination_prompt IS 'Instructions spécifiques pour la précision des coordonnées selon le type d''analyse';
COMMENT ON COLUMN public.analysis_types.formatting_instructions IS 'Instructions de formatage personnalisées pour les annotations';
COMMENT ON COLUMN public.analysis_types.annotation_rules IS 'Règles spécifiques pour les annotations de ce type d''analyse';

-- =============================================
-- MISE À JOUR DES DONNÉES EXISTANTES
-- =============================================

-- Prompts de coordination spécialisés par type d'analyse
UPDATE public.analysis_types 
SET 
    coordination_prompt = 'Délimitez les grandes zones fonctionnelles (header, navigation, contenu principal, sidebar, footer). Utilisez des zones larges qui englobent toute la région concernée. Coordonnées approximatives acceptées pour avoir une vue d''ensemble.',
    formatting_instructions = 'Rôle et fonction : [description du rôle de la région] | Position et hiérarchie : [position dans la page et importance] | Délimitation visuelle : [comment la région est délimitée] | Problèmes d''accessibilité : [problèmes identifiés] | Suggestions de code : [code HTML/CSS pour améliorer]',
    annotation_rules = 'Zones larges pour les régions. x,y = coin supérieur gauche de la région. width/height = dimensions complètes de la zone fonctionnelle.'
WHERE name = 'Région';

UPDATE public.analysis_types 
SET 
    coordination_prompt = 'Délimitez précisément chaque titre et sous-titre. Zones ajustées à la taille exacte du texte. Coordonnées précises pour identifier clairement la hiérarchie visuelle.',
    formatting_instructions = 'Rôle et fonction : [niveau hiérarchique du titre] | Position et hiérarchie : [ordre dans la structure] | Délimitation visuelle : [style visuel du titre] | Problèmes d''accessibilité : [problèmes de hiérarchie] | Suggestions de code : [balises HTML appropriées]',
    annotation_rules = 'Zones précises autour du texte des titres. Pas de marge excessive. Coordonnées exactes pour différencier les niveaux.'
WHERE name = 'Hiérarchie des titres';

UPDATE public.analysis_types 
SET 
    coordination_prompt = 'Délimitez précisément chaque élément interactif (boutons, liens, champs). Zones petites et précises centrées sur l''élément cliquable. Coordonnées exactes pour identifier clairement chaque contrôle.',
    formatting_instructions = 'Rôle et fonction : [type d''élément interactif] | Position et hiérarchie : [importance dans l''interface] | Délimitation visuelle : [état visuel de l''élément] | Problèmes d''accessibilité : [problèmes d''interaction] | Suggestions de code : [attributs ARIA et HTML]',
    annotation_rules = 'Zones précises pour chaque élément interactif. x,y = coin exact de l''élément. width/height = dimensions réelles sans marge.'
WHERE name = 'Éléments interactifs';

UPDATE public.analysis_types 
SET 
    coordination_prompt = 'Délimitez chaque élément focusable dans l''ordre de navigation. Zones précises pour montrer le parcours logique du focus. Numérotez visuellement l''ordre de tabulation.',
    formatting_instructions = 'Rôle et fonction : [élément focusable] | Position et hiérarchie : [ordre de tabulation] | Délimitation visuelle : [indicateur de focus] | Problèmes d''accessibilité : [problèmes de navigation] | Suggestions de code : [tabindex et structure HTML]',
    annotation_rules = 'Zones précises pour chaque élément focusable. Ordre numéroté dans les annotations. Coordonnées exactes pour le parcours de navigation.'
WHERE name = 'Ordre de navigation au clavier';

UPDATE public.analysis_types 
SET 
    coordination_prompt = 'Délimitez les zones de contenu dans l''ordre de lecture logique. Zones englobant les blocs de contenu complets. Coordonnées pour montrer le flux de lecture.',
    formatting_instructions = 'Rôle et fonction : [type de contenu] | Position et hiérarchie : [ordre de lecture] | Délimitation visuelle : [structure du contenu] | Problèmes d''accessibilité : [problèmes de vocalisation] | Suggestions de code : [structure sémantique HTML]',
    annotation_rules = 'Zones englobant les blocs de contenu. Ordre de lecture dans les annotations. Coordonnées pour le flux logique.'
WHERE name = 'Ordre de vocalisation pour les lecteurs d''écran';

UPDATE public.analysis_types 
SET 
    coordination_prompt = 'Délimitez précisément chaque image, icône ou élément visuel nécessitant un texte alternatif. Zones exactes autour des éléments graphiques. Coordonnées précises pour identifier chaque élément visuel.',
    formatting_instructions = 'Rôle et fonction : [type d''élément visuel] | Position et hiérarchie : [importance de l''image] | Délimitation visuelle : [description de l''élément] | Problèmes d''accessibilité : [manque de texte alt] | Suggestions de code : [attribut alt approprié]',
    annotation_rules = 'Zones précises autour des éléments visuels. x,y = coin exact de l''image/icône. Dimensions exactes de l''élément graphique.'
WHERE name = 'Texte alternatif';

-- =============================================
-- TEMPLATES DE PROMPTS PAR DÉFAUT
-- =============================================

-- Insérer des templates de prompts pour les nouveaux types d'analyse
INSERT INTO public.analysis_types (name, description, system_prompt, category, coordination_prompt, formatting_instructions, annotation_rules) VALUES
(
    'Contraste et lisibilité',
    'Analyse du contraste des couleurs et de la lisibilité du texte',
    'Analyse le contraste des couleurs dans cette interface. Identifie tous les éléments textuels et évalue si le contraste avec leur arrière-plan respecte les standards WCAG 2.1 (ratio 4.5:1 pour le texte normal, 3:1 pour le texte large). Signale les problèmes de lisibilité.',
    'Accessibilité',
    'Délimitez précisément chaque zone de texte avec son arrière-plan immédiat. Zones très précises pour mesurer le contraste exact entre le texte et son fond. Coordonnées exactes du texte uniquement.',
    'Rôle et fonction : [type de texte] | Position et hiérarchie : [importance du texte] | Délimitation visuelle : [couleurs utilisées] | Problèmes d''accessibilité : [ratio de contraste insuffisant] | Suggestions de code : [couleurs CSS améliorées]',
    'Zones précises autour du texte et de son arrière-plan. Coordonnées exactes pour le calcul de contraste. Pas de marge supplémentaire.'
),
(
    'Formulaires et étiquettes',
    'Analyse de l''accessibilité des formulaires et de leurs étiquettes',
    'Examine tous les éléments de formulaire dans cette interface (champs de saisie, boutons radio, cases à cocher, listes déroulantes, etc.). Vérifie que chaque champ a une étiquette appropriée, que les groupes de champs sont correctement organisés, et que les messages d''erreur sont accessibles.',
    'Formulaires',
    'Délimitez précisément chaque champ de formulaire et son étiquette associée. Zones précises pour montrer la relation entre le champ et son label. Coordonnées exactes des éléments de formulaire.',
    'Rôle et fonction : [type de champ] | Position et hiérarchie : [organisation du formulaire] | Délimitation visuelle : [relation champ-étiquette] | Problèmes d''accessibilité : [étiquettes manquantes] | Suggestions de code : [attributs label et ARIA]',
    'Zones précises pour chaque champ et son étiquette. Coordonnées exactes pour montrer les associations. Dimensions réelles des contrôles.'
);

-- =============================================
-- MISE À JOUR DES VUES
-- =============================================

-- Recréer la vue pour inclure les nouvelles colonnes
DROP VIEW IF EXISTS public.analysis_types_full;
CREATE VIEW public.analysis_types_full AS
SELECT 
    id,
    name,
    description,
    system_prompt,
    coordination_prompt,
    formatting_instructions,
    annotation_rules,
    category,
    active,
    created_at
FROM public.analysis_types
WHERE active = true
ORDER BY category, name;

-- Commentaire sur la vue
COMMENT ON VIEW public.analysis_types_full IS 'Vue complète des types d''analyse avec tous les prompts de configuration';

-- =============================================
-- VALIDATION DES DONNÉES
-- =============================================

-- Vérifier que toutes les colonnes ont été ajoutées
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'analysis_types' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les données mises à jour
SELECT 
    name,
    CASE 
        WHEN coordination_prompt IS NOT NULL THEN 'Configuré'
        ELSE 'Non configuré'
    END as coordination_status,
    CASE 
        WHEN formatting_instructions IS NOT NULL THEN 'Configuré'
        ELSE 'Non configuré'
    END as formatting_status,
    CASE 
        WHEN annotation_rules IS NOT NULL THEN 'Configuré'
        ELSE 'Non configuré'
    END as rules_status
FROM public.analysis_types
ORDER BY name;
