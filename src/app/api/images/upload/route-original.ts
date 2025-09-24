import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractImageMetadata, validateImageFile } from '@/lib/storage'

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

    // Récupérer le fichier depuis FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Extraire les métadonnées
    const metadata = await extractImageMetadata(file)

    // Vérifier si l'image existe déjà (par hash)
    if (metadata.hash) {
      const { data: existingImage } = await supabase
        .from('images')
        .select('id, storage_path, public_url')
        .eq('user_id', user.id)
        .eq('file_hash', metadata.hash)
        .single()

      if (existingImage) {
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
    }

    // Validation du fichier
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${random}.${extension}`
    const filePath = `${user.id}/${fileName}`

    // Upload vers Supabase Storage (côté serveur)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('analysis-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Erreur d'upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('analysis-images')
      .getPublicUrl(filePath)

    // Sauvegarder les informations en base
    const { data: imageRecord, error: dbError } = await supabase
      .from('images')
      .insert({
        user_id: user.id,
        original_name: metadata.originalName,
        storage_bucket: 'analysis-images',
        storage_path: filePath,
        public_url: urlData.publicUrl,
        size_bytes: metadata.size,
        format: metadata.type,
        file_hash: metadata.hash,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          originalName: metadata.originalName
        },
        status: 'uploading'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erreur DB:', dbError)
      return NextResponse.json(
        { error: 'Erreur de sauvegarde en base' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: imageRecord.id,
        path: filePath,
        publicUrl: urlData.publicUrl,
        metadata: {
          originalName: metadata.originalName,
          size: metadata.size,
          width: metadata.width,
          height: metadata.height
        }
      }
    })

  } catch (error) {
    console.error('Erreur upload:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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
    console.error('Erreur récupération images:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
