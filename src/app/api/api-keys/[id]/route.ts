import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PUT - Mettre à jour une clé API (nom ou statut actif)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { name, active } = await request.json()
    const { id: keyId } = await params

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

    // Vérifier que la clé appartient à l'utilisateur
    const { data: existingKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingKey) {
      return NextResponse.json(
        { error: 'Clé API non trouvée' },
        { status: 404 }
      )
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (active !== undefined) updateData.active = active

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      )
    }

    // Mettre à jour la clé
    const { data: updatedKey, error: updateError } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', keyId)
      .eq('user_id', user.id)
      .select('id, provider, name, created_at, last_used, active')
      .single()

    if (updateError) {
      console.error('Erreur lors de la mise à jour:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la clé' },
        { status: 500 }
      )
    }

    // Enregistrer l'activité
    await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'api_key_updated',
        details: {
          key_id: keyId,
          provider: existingKey.provider,
          changes: updateData,
          timestamp: new Date().toISOString(),
        },
      })

    return NextResponse.json({ 
      data: updatedKey,
      message: 'Clé API mise à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur dans PUT /api/api-keys/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une clé API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: keyId } = await params

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

    // Vérifier que la clé appartient à l'utilisateur
    const { data: existingKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingKey) {
      return NextResponse.json(
        { error: 'Clé API non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer la clé
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la clé' },
        { status: 500 }
      )
    }

    // Enregistrer l'activité
    await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'api_key_deleted',
        details: {
          key_id: keyId,
          provider: existingKey.provider,
          name: existingKey.name,
          timestamp: new Date().toISOString(),
        },
      })

    return NextResponse.json({ 
      message: 'Clé API supprimée avec succès'
    })
  } catch (error) {
    console.error('Erreur dans DELETE /api/api-keys/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Tester une clé API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: keyId } = await params

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

    // Récupérer la clé chiffrée
    const { data: apiKeyData, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', keyId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !apiKeyData) {
      return NextResponse.json(
        { error: 'Clé API non trouvée' },
        { status: 404 }
      )
    }

    // Déchiffrer la clé
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      )
    }

    const { data: decryptedKey, error: decryptError } = await supabase
      .rpc('decrypt_api_key', {
        encrypted_key: apiKeyData.encrypted_key,
        encryption_key: encryptionKey
      })

    if (decryptError) {
      console.error('Erreur lors du déchiffrement:', decryptError)
      return NextResponse.json(
        { error: 'Erreur lors du déchiffrement de la clé' },
        { status: 500 }
      )
    }

    // Tester la clé selon le provider
    let testResult = { valid: false, error: null }

    try {
      if (apiKeyData.provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${decryptedKey}`,
            'Content-Type': 'application/json',
          },
        })
        testResult.valid = response.ok
        if (!response.ok) {
          testResult.error = `HTTP ${response.status}: ${response.statusText}`
        }
      } else if (apiKeyData.provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': decryptedKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }],
          }),
        })
        testResult.valid = response.ok
        if (!response.ok) {
          testResult.error = `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      testResult.error = 'Erreur de connexion à l\'API'
    }

    // Mettre à jour last_used si le test est réussi
    if (testResult.valid) {
      await supabase
        .from('api_keys')
        .update({ last_used: new Date().toISOString() })
        .eq('id', keyId)
    }

    // Enregistrer l'activité
    await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'api_key_tested',
        details: {
          key_id: keyId,
          provider: apiKeyData.provider,
          result: testResult.valid ? 'success' : 'failure',
          error: testResult.error,
          timestamp: new Date().toISOString(),
        },
      })

    return NextResponse.json({ 
      data: testResult,
      message: testResult.valid ? 'Clé API valide' : 'Clé API invalide'
    })
  } catch (error) {
    console.error('Erreur dans POST /api/api-keys/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
