import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les données de la requête
    const { imageId, analysisTypeId, provider } = await request.json()

    if (!imageId || !analysisTypeId || !provider) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Récupérer l'image
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single()

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer le type d'analyse
    const { data: analysisType, error: analysisTypeError } = await supabase
      .from('analysis_types')
      .select('*')
      .eq('id', analysisTypeId)
      .single()

    if (analysisTypeError || !analysisType) {
      return NextResponse.json(
        { error: 'Type d\'analyse non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer la clé API de l'utilisateur
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('active', true)
      .single()

    if (apiKeyError || !apiKey) {
      return NextResponse.json(
        { error: `Clé API ${provider} non trouvée ou inactive` },
        { status: 400 }
      )
    }

    // Déchiffrer la clé API
    const { data: decryptedKey } = await supabase.rpc('decrypt_api_key', {
      encrypted_key: apiKey.encrypted_key,
      encryption_key: process.env.ENCRYPTION_KEY || 'default-key'
    })

    if (!decryptedKey) {
      return NextResponse.json(
        { error: 'Impossible de déchiffrer la clé API' },
        { status: 500 }
      )
    }

    // Obtenir l'URL de l'image
    const { data: imageUrl } = supabase.storage
      .from('analysis-images')
      .getPublicUrl(image.storage_path)

    if (!imageUrl.publicUrl) {
      return NextResponse.json(
        { error: 'Impossible d\'obtenir l\'URL de l\'image' },
        { status: 500 }
      )
    }

    console.log('URL de l\'image générée:', imageUrl.publicUrl)

    // Créer l'enregistrement d'analyse
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        image_id: imageId,
        analysis_type_id: analysisTypeId,
        provider: provider,
        ai_provider: provider,
        ai_model: provider === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-latest',
        duration_ms: 0,
        result_json: {},
        status: 'processing'
      })
      .select()
      .single()

    if (analysisError) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'analyse' },
        { status: 500 }
      )
    }

    let analysisResult: any = null
    let duration = 0
    const startTime = Date.now()

    try {
      // Analyser avec le provider choisi
      if (provider === 'openai') {
        analysisResult = await analyzeWithOpenAI(
          decryptedKey,
          imageUrl.publicUrl,
          analysisType
        )
      } else if (provider === 'anthropic') {
        analysisResult = await analyzeWithAnthropic(
          decryptedKey,
          imageUrl.publicUrl,
          analysisType,
          supabase,
          image.storage_path
        )
      } else {
        throw new Error('Provider non supporté')
      }

      duration = Date.now() - startTime

      // Mettre à jour l'analyse avec les résultats
      const { error: updateError } = await supabase
        .from('analyses')
        .update({
          result_json: analysisResult,
          duration_ms: duration,
          status: 'completed'
        })
        .eq('id', analysis.id)

      if (updateError) {
        throw new Error('Erreur lors de la sauvegarde des résultats')
      }

      // Mettre à jour la dernière utilisation de la clé API
      await supabase
        .from('api_keys')
        .update({ last_used: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('provider', provider)

      return NextResponse.json({
        success: true,
        data: {
          analysisId: analysis.id,
          result: analysisResult,
          duration: duration,
          provider: provider
        }
      })

    } catch (error) {
      // Marquer l'analyse comme échouée
      await supabase
        .from('analyses')
        .update({
          status: 'error',
          result_json: { error: error instanceof Error ? error.message : 'Erreur inconnue' },
          duration_ms: Date.now() - startTime
        })
        .eq('id', analysis.id)

      return NextResponse.json(
        { error: `Erreur d'analyse: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erreur analyse:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// Fonction pour construire le prompt enrichi avec les nouveaux champs
function buildEnhancedPrompt(analysisType: AnalysisType) {
  let enhancedPrompt = analysisType.system_prompt

  // Ajouter les instructions de coordination si disponibles
  if (analysisType.coordination_prompt) {
    enhancedPrompt += `\n\nINSTRUCTIONS DE COORDINATION SPÉCIFIQUES:\n${analysisType.coordination_prompt}`
  }

  // Ajouter les instructions de formatage si disponibles
  const defaultFormatting = "Rôle et fonction : [description] | Position et hiérarchie : [description] | Délimitation visuelle : [description] | Problèmes d'accessibilité : [liste] | Suggestions de code : [code HTML/CSS]"
  const formattingInstructions = analysisType.formatting_instructions || defaultFormatting

  // Ajouter les règles d'annotation si disponibles
  const defaultRules = "Coordonnées précises en pourcentages de l'image. x,y = coin supérieur gauche de la zone."
  const annotationRules = analysisType.annotation_rules || defaultRules

  enhancedPrompt += `

INSTRUCTIONS TECHNIQUES POUR LA RÉPONSE:
Votre réponse doit être structurée en deux parties:

1. ANALYSE TEXTUELLE: Suivez exactement les instructions du prompt système ci-dessus.
   STRUCTUREZ votre analyse avec des sections numérotées (1., 2., 3., etc.) pour chaque zone/région identifiée.

2. ANNOTATIONS: Pour chaque section numérotée de votre analyse, créez UNE annotation correspondante:
{
  "annotations": [
    {
      "id": "zone_1",
      "type": "info",
      "title": "Nom de la zone (ex: Navigation Latérale, En-tête, etc.)",
      "description": "STRUCTUREZ le contenu avec ce format exact: ${formattingInstructions}",
      "x": [position X en pourcentage 0-100],
      "y": [position Y en pourcentage 0-100], 
      "width": [largeur en pourcentage],
      "height": [hauteur en pourcentage],
      "color": "#0066cc"
    }
  ]
}

RÈGLES TECHNIQUES CRUCIALES:
${annotationRules}
- Chaque annotation doit reprendre INTÉGRALEMENT le contenu de la section correspondante
- Incluez TOUS les détails selon le format spécifié
- Ne résumez pas, ne raccourcissez pas : copiez TOUT le texte de chaque section

Séparez les deux parties par "---ANNOTATIONS---"`

  return enhancedPrompt
}

async function analyzeWithOpenAI(apiKey: string, imageUrl: string, analysisType: AnalysisType) {
  const openai = new OpenAI({
    apiKey: apiKey
  })

  // Construire le prompt enrichi avec les nouveaux champs
  const enhancedPrompt = buildEnhancedPrompt(analysisType)

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: enhancedPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analysez cette image selon les critères demandés. Fournissez d'abord une analyse conversationnelle, puis les annotations avec coordonnées précises."
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 4000,
    temperature: 0.1
  })

  const fullResponse = response.choices[0]?.message?.content || ''
  
  // LOG DÉTAILLÉ DE LA RÉPONSE BRUTE DE L'IA
  console.log('=== RÉPONSE BRUTE OPENAI ===')
  console.log('Réponse complète:', fullResponse)
  console.log('Longueur de la réponse:', fullResponse.length)
  
  const parts = fullResponse.split('---ANNOTATIONS---')
  console.log('Nombre de parties après split:', parts.length)
  
  let annotations = []
  let textualAnalysis = fullResponse

  if (parts.length === 2) {
    textualAnalysis = parts[0].trim()
    const annotationsPart = parts[1].trim()
    
    console.log('=== PARTIE ANNOTATIONS BRUTE ===')
    console.log('Contenu annotations brut:', annotationsPart)
    
    try {
      const annotationsData = JSON.parse(annotationsPart)
      annotations = annotationsData.annotations || []
      
      console.log('=== ANNOTATIONS PARSÉES ===')
      console.log('Nombre d\'annotations:', annotations.length)
      annotations.forEach((ann, index) => {
        console.log(`Annotation ${index + 1}:`, {
          id: ann.id,
          title: ann.title,
          coordinates: { x: ann.x, y: ann.y, width: ann.width, height: ann.height },
          type: ann.type
        })
      })
      
    } catch (e) {
      console.log('=== ERREUR PARSING ANNOTATIONS ===')
      console.log('Erreur:', e)
      console.log('Contenu qui a causé l\'erreur:', annotationsPart.substring(0, 500))
    }
  } else {
    console.log('=== PAS DE SÉPARATEUR ANNOTATIONS TROUVÉ ===')
    console.log('Recherche de JSON dans la réponse...')
    
    // Essayer de trouver du JSON dans la réponse
    const jsonMatch = fullResponse.match(/\{[\s\S]*"annotations"[\s\S]*\}/g)
    if (jsonMatch) {
      console.log('JSON potentiel trouvé:', jsonMatch[0])
      try {
        const annotationsData = JSON.parse(jsonMatch[0])
        annotations = annotationsData.annotations || []
        console.log('Annotations extraites du JSON:', annotations.length)
      } catch (e) {
        console.log('Erreur parsing JSON trouvé:', e)
      }
    }
  }

  return {
    provider: 'openai',
    model: 'gpt-4o',
    content: textualAnalysis,
    annotations: annotations,
    usage: response.usage,
    timestamp: new Date().toISOString()
  }
}

interface AnalysisType {
  system_prompt: string
  coordination_prompt?: string
  formatting_instructions?: string
  annotation_rules?: string
}

async function analyzeWithAnthropic(apiKey: string, imageUrl: string, analysisType: AnalysisType, supabase: any, imagePath: string) {
  const anthropic = new Anthropic({
    apiKey: apiKey
  })

  // Construire le prompt enrichi avec les nouveaux champs
  const enhancedPrompt = buildEnhancedPrompt(analysisType)

  try {
    let imageBuffer: ArrayBuffer
    let mimeType: string

    // Essayer d'abord l'URL publique
    try {
      console.log('Tentative de téléchargement via URL publique:', imageUrl)
      const imageResponse = await fetch(imageUrl)
      
      if (!imageResponse.ok) {
        throw new Error(`URL publique inaccessible: ${imageResponse.status}`)
      }

      imageBuffer = await imageResponse.arrayBuffer()
      mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
      console.log('Téléchargement via URL publique réussi')

    } catch (urlError) {
      console.log('URL publique échouée, tentative de téléchargement direct depuis Supabase:', urlError)
      
      // Fallback: télécharger directement depuis Supabase Storage
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('analysis-images')
        .download(imagePath)

      if (downloadError || !imageData) {
        throw new Error(`Impossible de télécharger l'image depuis Supabase: ${downloadError?.message}`)
      }

      imageBuffer = await imageData.arrayBuffer()
      mimeType = imageData.type || 'image/jpeg'
      console.log('Téléchargement direct depuis Supabase réussi')
    }
    
    // Vérifier que l'image n'est pas vide
    if (imageBuffer.byteLength === 0) {
      throw new Error('Image vide téléchargée')
    }

    // Vérifier la taille de l'image (Claude a une limite)
    const imageSizeMB = imageBuffer.byteLength / (1024 * 1024)
    if (imageSizeMB > 20) {
      throw new Error(`Image trop grande: ${imageSizeMB.toFixed(2)}MB (max 20MB)`)
    }

    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    
    // S'assurer que le type MIME est supporté par Claude
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!supportedTypes.includes(mimeType)) {
      mimeType = 'image/jpeg' // Fallback vers JPEG
    }

    console.log(`Analyse Claude - Taille: ${imageSizeMB.toFixed(2)}MB, Type: ${mimeType}, Base64 length: ${imageBase64.length}`)

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 4000,
      system: enhancedPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analysez cette image selon les critères demandés. Fournissez d'abord une analyse conversationnelle, puis les annotations avec coordonnées précises."
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: imageBase64
              }
            }
          ]
        }
      ]
    })

    const fullResponse = response.content[0]?.type === 'text' ? response.content[0].text : ''
    
    // LOG DÉTAILLÉ DE LA RÉPONSE BRUTE DE L'IA
    console.log('=== RÉPONSE BRUTE ANTHROPIC ===')
    console.log('Réponse complète:', fullResponse)
    console.log('Longueur de la réponse:', fullResponse.length)
    
    const parts = fullResponse.split('---ANNOTATIONS---')
    console.log('Nombre de parties après split:', parts.length)
    
    let annotations = []
    let textualAnalysis = fullResponse

    if (parts.length === 2) {
      textualAnalysis = parts[0].trim()
      const annotationsPart = parts[1].trim()
      
      console.log('=== PARTIE ANNOTATIONS BRUTE ===')
      console.log('Contenu annotations brut:', annotationsPart)
      
      try {
        const annotationsData = JSON.parse(annotationsPart)
        annotations = annotationsData.annotations || []
        
        console.log('=== ANNOTATIONS PARSÉES ===')
        console.log('Nombre d\'annotations:', annotations.length)
        annotations.forEach((ann: any, index: number) => {
          console.log(`Annotation ${index + 1}:`, {
            id: ann.id,
            title: ann.title,
            coordinates: { x: ann.x, y: ann.y, width: ann.width, height: ann.height },
            type: ann.type
          })
        })
        
      } catch (e) {
        console.log('=== ERREUR PARSING ANNOTATIONS ===')
        console.log('Erreur:', e)
        console.log('Contenu qui a causé l\'erreur:', annotationsPart.substring(0, 500))
      }
    } else {
      console.log('=== PAS DE SÉPARATEUR ANNOTATIONS TROUVÉ ===')
      console.log('Recherche de JSON dans la réponse...')
      
      // Essayer de trouver du JSON dans la réponse
      const jsonMatch = fullResponse.match(/\{[\s\S]*"annotations"[\s\S]*\}/g)
      if (jsonMatch) {
        console.log('JSON potentiel trouvé:', jsonMatch[0])
        try {
          const annotationsData = JSON.parse(jsonMatch[0])
          annotations = annotationsData.annotations || []
          console.log('Annotations extraites du JSON:', annotations.length)
        } catch (e) {
          console.log('Erreur parsing JSON trouvé:', e)
        }
      }
    }

    return {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-latest',
      content: textualAnalysis,
      annotations: annotations,
      usage: response.usage,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Erreur analyse Claude:', error)
    throw new Error(`Erreur Claude: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}
