import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import sharp from 'sharp'

export interface UploadResult {
  success: boolean
  data?: {
    id: string
    path: string
    fullPath: string
    publicUrl?: string
  }
  error?: string
}

export interface ImageMetadata {
  originalName: string
  size: number
  type: string
  width?: number
  height?: number
  hash?: string
}

/**
 * Génère un hash simple pour un fichier
 */
async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Génère un nom de fichier unique
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  return `${timestamp}-${random}.${extension}`
}

/**
 * Valide un fichier image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
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

/**
 * Extrait les métadonnées d'une image
 */
export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  const metadata: ImageMetadata = {
    originalName: file.name,
    size: file.size,
    type: file.type,
    hash: await generateFileHash(file)
  }

  // Extraire les dimensions si possible
  try {
    const dimensions = await getImageDimensions(file)
    metadata.width = dimensions.width
    metadata.height = dimensions.height
  } catch (error) {
    console.warn('Impossible d\'extraire les dimensions:', error)
  }

  return metadata
}

/**
 * Obtient les dimensions d'une image avec Sharp (côté serveur)
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    // Convertir le File en Buffer pour Sharp
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Utiliser Sharp pour obtenir les métadonnées
    const metadata = await sharp(buffer).metadata()
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    }
  } catch (error) {
    console.warn('Erreur lors de l\'extraction des dimensions avec Sharp:', error)
    // Retourner des dimensions par défaut en cas d'erreur
    return {
      width: 0,
      height: 0
    }
  }
}

/**
 * Upload une image vers Supabase Storage (côté client)
 */
export async function uploadImageToStorage(
  file: File,
  bucket: string = 'analysis-images',
  folder?: string
): Promise<UploadResult> {
  try {
    const supabase = createClient()

    // Validation du fichier
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: 'Utilisateur non authentifié'
      }
    }

    // Générer le chemin du fichier
    const fileName = generateUniqueFileName(file.name)
    const folderPath = folder || user.id
    const filePath = `${folderPath}/${fileName}`

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return {
        success: false,
        error: `Erreur d'upload: ${error.message}`
      }
    }

    // Obtenir l'URL publique si nécessaire
    let publicUrl: string | undefined
    try {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      publicUrl = urlData.publicUrl
    } catch (urlError) {
      console.warn('Impossible d\'obtenir l\'URL publique:', urlError)
    }

    return {
      success: true,
      data: {
        id: data.id || '',
        path: data.path,
        fullPath: data.fullPath,
        publicUrl
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }
  }
}

/**
 * Supprime une image de Supabase Storage
 */
export async function deleteImageFromStorage(
  filePath: string,
  bucket: string = 'analysis-images'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      return {
        success: false,
        error: `Erreur de suppression: ${error.message}`
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }
  }
}

/**
 * Obtient une URL signée pour accéder à une image privée
 */
export async function getSignedImageUrl(
  filePath: string,
  bucket: string = 'analysis-images',
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      return {
        error: `Erreur de génération d'URL: ${error.message}`
      }
    }

    return { url: data.signedUrl }
  } catch (error) {
    return {
      error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }
  }
}

/**
 * Liste les images d'un utilisateur
 */
export async function listUserImages(
  userId: string,
  bucket: string = 'analysis-images'
): Promise<{ files?: any[]; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      return {
        error: `Erreur de listage: ${error.message}`
      }
    }

    return { files: data }
  } catch (error) {
    return {
      error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }
  }
}

/**
 * Calcule l'usage de stockage d'un utilisateur
 */
export async function getUserStorageUsage(userId: string): Promise<{
  totalSize?: number
  fileCount?: number
  error?: string
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from('analysis-images')
      .list(userId)

    if (error) {
      return {
        error: `Erreur de calcul d'usage: ${error.message}`
      }
    }

    const totalSize = data?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0
    const fileCount = data?.length || 0

    return {
      totalSize,
      fileCount
    }
  } catch (error) {
    return {
      error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }
  }
}

/**
 * Nettoie les images temporaires anciennes (côté serveur)
 * Cette fonction devrait être appelée via une API route ou un cron job
 */
export async function cleanupTempImages(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient()

    // Supprimer les images temporaires de plus de 24h directement
    const { error } = await supabase.storage
      .from('temp-images')
      .list('', { limit: 1000 })

    if (error) {
      return {
        success: false,
        error: `Erreur de listage: ${error.message}`
      }
    }

    // Note: La fonction cleanup_temp_images sera ajoutée plus tard au schéma
    // Pour l'instant, cette fonction est un placeholder
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: `Erreur inattendue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    }
  }
}
