import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Récupérer les clés API de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les clés API (sans les clés chiffrées)
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, provider, name, created_at, last_used, active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des clés API:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des clés API' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: apiKeys })
  } catch (error) {
    console.error('Erreur dans GET /api/api-keys:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Ajouter une nouvelle clé API
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { provider, name, apiKey } = await request.json()

    // Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Validation des données
    if (!provider || !name || !apiKey) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (!['openai', 'anthropic'].includes(provider)) {
      return NextResponse.json(
        { error: 'Provider non supporté' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur n'a pas déjà une clé pour ce provider
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('active', true)
      .single()

    if (existingKey) {
      return NextResponse.json(
        { error: `Une clé ${provider} active existe déjà` },
        { status: 409 }
      )
    }

    // Récupérer la clé de chiffrement depuis les variables d'environnement
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY non configurée')
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    // Chiffrer la clé API en utilisant la fonction PostgreSQL
    const { data: encryptedResult, error: encryptError } = await supabase
      .rpc('encrypt_api_key', {
        api_key: apiKey,
        encryption_key: encryptionKey
      })

    if (encryptError) {
      console.error('Erreur lors du chiffrement:', encryptError)
      return NextResponse.json(
        { error: 'Erreur lors du chiffrement de la clé' },
        { status: 500 }
      )
    }

    // Insérer la clé chiffrée
    const { data: newApiKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        provider,
        name,
        encrypted_key: encryptedResult,
        active: true,
      })
      .select('id, provider, name, created_at, last_used, active')
      .single()

    if (insertError) {
      console.error('Erreur lors de l\'insertion:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde de la clé' },
        { status: 500 }
      )
    }

    // Enregistrer l'activité
    await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'api_key_created',
        details: {
          provider,
          name,
          timestamp: new Date().toISOString(),
        },
      })

    return NextResponse.json({ 
      data: newApiKey,
      message: 'Clé API ajoutée avec succès'
    })
  } catch (error) {
    console.error('Erreur dans POST /api/api-keys:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
