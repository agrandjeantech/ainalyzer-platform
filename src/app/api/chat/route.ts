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
    const { message, provider, conversationHistory } = await request.json()

    if (!message || !provider) {
      return NextResponse.json(
        { error: 'Message et provider requis' },
        { status: 400 }
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
        { error: `Clé API ${provider} non trouvée. Configurez vos clés API dans les paramètres.` },
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

    let response: any = null
    const startTime = Date.now()

    try {
      // Générer la réponse avec le provider choisi
      if (provider === 'openai') {
        response = await chatWithOpenAI(decryptedKey, message, conversationHistory)
      } else if (provider === 'anthropic') {
        response = await chatWithAnthropic(decryptedKey, message, conversationHistory)
      } else {
        throw new Error('Provider non supporté')
      }

      const duration = Date.now() - startTime

      // Mettre à jour la dernière utilisation de la clé API
      await supabase
        .from('api_keys')
        .update({ last_used: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('provider', provider)

      return NextResponse.json({
        success: true,
        data: {
          message: response.content,
          provider: provider,
          model: response.model,
          duration: duration,
          usage: response.usage
        }
      })

    } catch (error) {
      return NextResponse.json(
        { error: `Erreur de chat: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erreur chat:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

async function chatWithOpenAI(apiKey: string, message: string, conversationHistory: any[] = []) {
  const openai = new OpenAI({
    apiKey: apiKey
  })

  // Construire l'historique de conversation
  const messages = [
    {
      role: "system" as const,
      content: `Tu es Ainalyzer AI, un assistant spécialisé dans l'analyse d'accessibilité des interfaces utilisateur. 

Ton rôle est d'aider les utilisateurs à :
- Comprendre les principes d'accessibilité web (WCAG)
- Analyser leurs interfaces pour identifier les problèmes d'accessibilité
- Proposer des solutions concrètes et pratiques
- Expliquer l'importance de l'accessibilité numérique

Tu réponds en français, de manière claire et pédagogique. Tu peux donner des exemples de code HTML/CSS quand c'est pertinent.

Si l'utilisateur te montre une image ou parle d'une interface, concentre-toi sur les aspects d'accessibilité : contraste, navigation au clavier, lecteurs d'écran, structure sémantique, etc.`
    },
    ...conversationHistory,
    {
      role: "user" as const,
      content: message
    }
  ]

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: messages,
    max_tokens: 1000,
    temperature: 0.7
  })

  return {
    content: response.choices[0]?.message?.content || '',
    model: 'gpt-4',
    usage: response.usage
  }
}

async function chatWithAnthropic(apiKey: string, message: string, conversationHistory: any[] = []) {
  const anthropic = new Anthropic({
    apiKey: apiKey
  })

  // Construire l'historique pour Claude
  const systemPrompt = `Tu es Ainalyzer AI, un assistant spécialisé dans l'analyse d'accessibilité des interfaces utilisateur. 

Ton rôle est d'aider les utilisateurs à :
- Comprendre les principes d'accessibilité web (WCAG)
- Analyser leurs interfaces pour identifier les problèmes d'accessibilité
- Proposer des solutions concrètes et pratiques
- Expliquer l'importance de l'accessibilité numérique

Tu réponds en français, de manière claire et pédagogique. Tu peux donner des exemples de code HTML/CSS quand c'est pertinent.

Si l'utilisateur te montre une image ou parle d'une interface, concentre-toi sur les aspects d'accessibilité : contraste, navigation au clavier, lecteurs d'écran, structure sémantique, etc.`

  // Construire les messages pour Claude
  const messages = [
    ...conversationHistory,
    {
      role: "user" as const,
      content: message
    }
  ]

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-latest",
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages
  })

  return {
    content: response.content[0]?.type === 'text' ? response.content[0].text : '',
    model: 'claude-3-5-sonnet-latest',
    usage: response.usage
  }
}
