import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Fonctions de validation et métadonnées simplifiées (sans sharp)
function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Type de fichier non supporté. Utilisez JPG, PNG ou WebP.'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Fichier trop volumineux. Taille maximale : 10MB.'
    }
  }

  return { valid: true }
}

async function generateFileHash(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    console.error('Erreur génération hash:', error)
    // Fallback: utiliser timestamp + taille comme hash
    return `fallback_${Date.now()}_${file.size}`
  }
}

async function extractImageMetadata(file: File) {
  try {
    const hash = await generateFileHash(file)
    return {
      originalName: file.name,
      size: file.size,
      type: file.type,
      hash: hash,
      // Dimensions par défaut (sans sharp)
      width: 0,
      height: 0
    }
  } catch (error) {
    console.error('Erreur extraction métadonnées:', error)
    throw new Error('Impossible d\'extraire les métadonnées du fichier')
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let step = 'initialization'
  
  try {
    console.log('=== DÉBUT UPLOAD IMAGE ===')
    console.log('User-Agent:', request.headers.get('user-agent'))
    console.log('Content-Type:', request.headers.get('content-type'))
    console.log('Content-Length:', request.headers.get('content-length'))
    
    step = 'supabase_client'
    const supabase = await createClient()
    console.log('✓ Client Supabase créé')
    
    step = 'authentication'
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Erreur auth:', authError)
      return NextResponse.json(
        { error: 'Erreur d\'authentification', details: authError.message },
        { status: 401 }
      )
    }
    if (!user) {
      console.error('Utilisateur non authentifié')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }
    console.log('✓ Utilisateur authentifié:', user.id)

    step = 'form_data_parsing'
    // Récupérer le fichier depuis FormData avec timeout
    let formData: FormData
    try {
      formData = await Promise.race([
        request.formData(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout parsing FormData')), 30000)
        )
      ])
    } catch (error) {
      console.error('Erreur parsing FormData:', error)
      return NextResponse.json(
        { error: 'Erreur de parsing des données', details: error instanceof Error ? error.message : 'Timeout' },
        { status: 400 }
      )
    }
    console.log('✓ FormData parsé')

    step = 'file_extraction'
    const file = formData.get('file') as File
    
    if (!file) {
      console.error('Aucun fichier dans FormData')
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    console.log('✓ Fichier extrait:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    step = 'file_validation'
    // Validation du fichier
    const validation = validateImageFile(file)
    if (!validation.valid) {
      console.error('Validation échouée:', validation.error)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    console.log('✓ Fichier validé')

    step = 'metadata_extraction'
    // Extraire les métadonnées (sans sharp)
    let metadata
    try {
      metadata = await extractImageMetadata(file)
      console.log('✓ Métadonnées extraites:', {
        hash: metadata.hash.substring(0, 16) + '...',
        size: metadata.size,
        type: metadata.type
      })
    } catch (error) {
      console.error('Erreur métadonnées:', error)
      return NextResponse.json(
        { error: 'Erreur d\'extraction des métadonnées', details: error instanceof Error ? error.message : 'Erreur inconnue' },
        { status: 500 }
      )
    }

    step = 'duplicate_check'
    // Vérifier si l'image existe déjà (par hash)
    if (metadata.hash && !metadata.hash.startsWith('fallback_')) {
      try {
        const { data: existingImage, error: duplicateError } = await supabase
          .from('images')
          .select('id, storage_path, public_url')
          .eq('user_id', user.id)
          .eq('file_hash', metadata.hash)
          .single()

        if (duplicateError && duplicateError.code !== 'PGRST116') {
          console.error('Erreur vérification doublon:', duplicateError)
        }

        if (existingImage) {
          console.log('✓ Image dupliquée trouvée:', existingImage.id)
          return NextResponse.json({
            success: true,
            data: {
              id: existingImage.id,
              path: existingImage.storage_path,
              publicUrl: existingImage.public_url,
              isDuplicate: true
            }
          })
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des doublons:', error)
        // Continuer sans vérification de doublon
      }
    }
    console.log('✓ Pas de doublon détecté')

    step = 'file_path_generation'
    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${timestamp}-${random}.${extension}`
    const filePath = `${user.id}/${fileName}`
    console.log('✓ Chemin généré:', filePath)

    step = 'supabase_upload'
    // Upload vers Supabase Storage (côté serveur)
    let uploadData
    try {
      const uploadResult = await supabase.storage
        .from('analysis-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadResult.error) {
        console.error('Erreur upload Supabase:', uploadResult.error)
        return NextResponse.json(
          { error: `Erreur d'upload: ${uploadResult.error.message}`, details: uploadResult.error },
          { status: 500 }
        )
      }

      uploadData = uploadResult.data
      console.log('✓ Upload Supabase réussi:', uploadData.path)
    } catch (error) {
      console.error('Exception upload Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur d\'upload vers le stockage', details: error instanceof Error ? error.message : 'Erreur inconnue' },
        { status: 500 }
      )
    }

    step = 'public_url_generation'
    // Obtenir l'URL publique
    let urlData
    try {
      urlData = supabase.storage
        .from('analysis-images')
        .getPublicUrl(filePath)
      console.log('✓ URL publique générée')
    } catch (error) {
      console.error('Erreur génération URL:', error)
      return NextResponse.json(
        { error: 'Erreur de génération d\'URL', details: error instanceof Error ? error.message : 'Erreur inconnue' },
        { status: 500 }
      )
    }

    step = 'database_save'
    // Sauvegarder les informations en base
    let imageRecord
    try {
      const insertResult = await supabase
        .from('images')
        .insert({
          user_id: user.id,
          original_name: metadata.originalName,
          storage_bucket: 'analysis-images',
          storage_path: filePath,
          public_url: urlData.data.publicUrl,
          size_bytes: metadata.size,
          format: metadata.type,
          file_hash: metadata.hash,
          metadata: {
            width: metadata.width,
            height: metadata.height,
            originalName: metadata.originalName
          },
          status: 'uploaded'
        })
        .select()
        .single()

      if (insertResult.error) {
        console.error('Erreur DB insert:', insertResult.error)
        return NextResponse.json(
          { error: 'Erreur de sauvegarde en base', details: insertResult.error.message },
          { status: 500 }
        )
      }

      imageRecord = insertResult.data
      console.log('✓ Enregistrement DB réussi:', imageRecord.id)
    } catch (error) {
      console.error('Exception DB:', error)
      return NextResponse.json(
        { error: 'Erreur de base de données', details: error instanceof Error ? error.message : 'Erreur inconnue' },
        { status: 500 }
      )
    }

    const duration = Date.now() - startTime
    console.log(`✓ Upload terminé en ${duration}ms`)
    console.log('=== FIN UPLOAD IMAGE ===')

    return NextResponse.json({
      success: true,
      data: {
        id: imageRecord.id,
        path: filePath,
        publicUrl: urlData.data.publicUrl,
        metadata: {
          originalName: metadata.originalName,
          size: metadata.size,
          width: metadata.width,
          height: metadata.height
        }
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`=== ERREUR UPLOAD (étape: ${step}, durée: ${duration}ms) ===`)
    console.error('Erreur détaillée:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace')
    
    return NextResponse.json(
      { 
        error: 'Erreur serveur interne', 
        step: step,
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        duration: duration
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== DÉBUT GET IMAGES ===')
    
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Récupérer les images de l'utilisateur
    const { data: images, error } = await supabase
      .from('images')
      .select(`
        id,
        original_name,
        storage_path,
        public_url,
        size_bytes,
        format,
        metadata,
        uploaded_at,
        status
      `)
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erreur récupération images:', error)
      return NextResponse.json(
        { error: 'Erreur de récupération des images' },
        { status: 500 }
      )
    }

    // Compter le total
    const { count } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    console.log(`✓ ${images.length} images récupérées`)
    console.log('=== FIN GET IMAGES ===')

    return NextResponse.json({
      success: true,
      data: {
        images,
        total: count || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('=== ERREUR GET IMAGES ===')
    console.error('Erreur récupération images:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
