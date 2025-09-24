'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UploadIcon, 
  ImageIcon, 
  XIcon, 
  FileIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  Loader2Icon
} from 'lucide-react'

interface UploadedImageData {
  id: string
  path: string
  publicUrl?: string
  metadata: {
    originalName: string
    size: number
    width?: number
    height?: number
  }
}

interface ImageUploaderProps {
  onImageUpload: (file: File, uploadData: UploadedImageData) => void
  onImageRemove?: () => void
  uploadedImage: File | null
}

export function ImageUploader({ onImageUpload, onImageRemove, uploadedImage }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const MAX_SIZE = 10 * 1024 * 1024 // 10MB

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Format non supporté. Utilisez JPG, PNG ou WebP.'
    }
    if (file.size > MAX_SIZE) {
      return 'Fichier trop volumineux. Maximum 10MB.'
    }
    return null
  }

  const uploadToSupabase = async (file: File): Promise<UploadedImageData> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include', // Important pour inclure les cookies de session
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erreur lors de l\'upload')
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de l\'upload')
    }

    return result.data
  }

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const uploadData = await uploadToSupabase(file)
      onImageUpload(file, uploadData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setIsUploading(false)
    }
  }, [onImageUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleRemoveImage = () => {
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageRemove?.()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Area */}
      {!uploadedImage ? (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isUploading 
              ? 'border-blue-500 bg-blue-50 cursor-wait' 
              : isDragOver 
                ? 'border-blue-500 bg-blue-50 cursor-pointer' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
            }
          `}
          onDragOver={!isUploading ? handleDragOver : undefined}
          onDragLeave={!isUploading ? handleDragLeave : undefined}
          onDrop={!isUploading ? handleDrop : undefined}
          onClick={!isUploading ? () => fileInputRef.current?.click() : undefined}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`
              p-4 rounded-full 
              ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}
            `}>
              {isUploading ? (
                <Loader2Icon className="h-8 w-8 text-blue-600 animate-spin" />
              ) : (
                <UploadIcon className={`
                  h-8 w-8 
                  ${isDragOver ? 'text-blue-600' : 'text-gray-600'}
                `} />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isUploading 
                  ? 'Upload en cours...' 
                  : isDragOver 
                    ? 'Déposez votre image ici' 
                    : 'Upload d\'image'
                }
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {isUploading 
                  ? 'Envoi vers Supabase Storage...' 
                  : 'Glissez-déposez une image ou cliquez pour sélectionner'
                }
              </p>
              <Button variant="outline" size="sm" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <FileIcon className="h-4 w-4 mr-2" />
                    Choisir une image
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-xs text-gray-500">
              JPG, PNG, WebP • Maximum 10MB
            </div>
          </div>
        </div>
      ) : (
        /* Uploaded Image Preview */
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-white rounded-lg border flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {uploadedImage.name}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {formatFileSize(uploadedImage.size)} • {uploadedImage.type}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Prêt pour l'analyse
                </span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              className="flex-shrink-0"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Instructions */}
      <div className="text-xs text-gray-500 text-center">
        <p>Formats supportés : JPG, PNG, WebP</p>
        <p>Taille maximale : 10MB</p>
      </div>
    </div>
  )
}
