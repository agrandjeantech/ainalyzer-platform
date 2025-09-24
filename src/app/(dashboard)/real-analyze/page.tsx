'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BrainIcon, MessageSquareIcon, ImageIcon, UploadIcon, SettingsIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import Link from 'next/link'
import { TopBar } from '@/components/ui/TopBar'
import { BackButton } from '@/components/ui/BackButton'
import { AnalysisChat } from '@/components/dashboard/AnalysisChat'
import { ImageAnnotationViewer } from '@/components/dashboard/ImageAnnotationViewer'
import { useAnalysisTypes } from '@/hooks/useAnalysisTypes'
import { useApiKeys } from '@/hooks/useApiKeys'

export default function AnalyzePage() {
  const [user, setUser] = useState<any>(null)
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null)
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null)
  const [selectedAnalysisTypes, setSelectedAnalysisTypes] = useState<string[]>([])
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>('openai')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisMessages, setAnalysisMessages] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'analyze' | 'results'>('upload')
  
  const router = useRouter()
  const supabase = createClient()
  const { analysisTypes } = useAnalysisTypes()
  const { apiKeys } = useApiKeys()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    checkUser()
  }, [router, supabase.auth])

  // Vérifier les clés API disponibles
  const availableProviders = apiKeys
    .filter(key => key.active)
    .map(key => key.provider as 'openai' | 'anthropic')

  const hasApiKeys = availableProviders.length > 0

  // S'assurer que le provider sélectionné est disponible
  useEffect(() => {
    if (hasApiKeys && !availableProviders.includes(selectedProvider)) {
      setSelectedProvider(availableProviders[0])
    }
  }, [availableProviders, selectedProvider, hasApiKeys])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'upload')
      }

      if (!data.success) {
        throw new Error(data.error || 'Upload échoué')
      }

      setUploadedImageId(data.data.id)
      setUploadedImageFile(file)
      setCurrentStep('configure') // Passer à l'étape de configuration

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setUploadError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleAnalysisComplete = (result: any, analysisTypeId: string) => {
    // Ajouter l'ID du type d'analyse au résultat
    const resultWithType = {
      ...result,
      analysisTypeId: analysisTypeId
    }
    
    setAnalysisResults(prev => [...prev, resultWithType])
    
    // Envoyer le résultat textuel dans le chat
    if (result.result?.content) {
      const analysisType = analysisTypes.find(t => t.id === analysisTypeId)
      // Créer un message d'analyse pour le chat
      const analysisMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: `📊 **Analyse ${analysisType?.name || 'Inconnue'} (${result.provider === 'openai' ? 'GPT-4o' : 'Claude 3.5 Sonnet'}) terminée**\n\n${result.result.content}`,
        timestamp: new Date(),
        provider: result.provider,
        model: result.result.model,
        usage: result.result.usage
      }
      
      // Ajouter le message au chat
      setAnalysisMessages(prev => [...prev, analysisMessage])
    }
  }

  const handleStartAnalyses = async () => {
    if (!canAnalyze) return
    
    setIsAnalyzing(true)
    setAnalysisResults([]) // Reset des résultats précédents
    
    // Ajouter un message indiquant le début de l'analyse
    const startMessage = {
      id: `start-${Date.now()}`,
      role: 'assistant' as const,
      content: `🚀 **Analyse lancée !**\n\nJ'analyse votre image avec ${selectedAnalysisTypes.length} type${selectedAnalysisTypes.length > 1 ? 's' : ''} d'analyse sélectionné${selectedAnalysisTypes.length > 1 ? 's' : ''}. Cela peut prendre quelques instants...\n\n${selectedAnalysisTypes.map(typeId => {
        const type = analysisTypes.find(t => t.id === typeId)
        return `• ${type?.name || 'Analyse'}`
      }).join('\n')}`,
      timestamp: new Date()
    }
    
    setAnalysisMessages(prev => [...prev, startMessage])
    
    try {
      // Lancer toutes les analyses en séquence
      for (const analysisTypeId of selectedAnalysisTypes) {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageId: uploadedImageId,
            analysisTypeId: analysisTypeId,
            provider: selectedProvider
          }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          handleAnalysisComplete(data.data, analysisTypeId)
        } else {
          console.error('Erreur analyse:', data.error)
          // Continuer avec les autres analyses même si une échoue
        }
      }
    } catch (error) {
      console.error('Erreur lors des analyses:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setUploadedImageId(null)
    setUploadedImageFile(null)
    setSelectedAnalysisTypes([])
    setAnalysisResults([])
    setUploadError(null)
  }

  const canAnalyze = uploadedImageId && selectedAnalysisTypes.length > 0 && hasApiKeys

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BrainIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Bar */}
      <TopBar 
        title="Analyse" 
        subtitle="Analysez vos images avec l'IA"
        badge={{
          text: "IA Réelle",
          variant: "secondary",
          className: "bg-green-50 text-green-700"
        }}
      />
      
      {/* Back Button */}
      <BackButton href="/dashboard" label="Retour au dashboard" />

      {/* Main Content */}
      <main className="h-[calc(100vh-120px)]">
        <div className="grid grid-cols-4 gap-0 h-full">
          
          {/* Left Column - Chat (1/4) - Prend toute la hauteur */}
          <div className="col-span-1 border-r h-full flex flex-col bg-white">
            {/* Header du chat */}
            <div className="border-b flex-shrink-0 p-4">
              <div className="flex items-center space-x-2">
                <MessageSquareIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Chat IA</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Questions sur l'accessibilité
              </p>
            </div>
            
            {/* Chat qui prend toute la hauteur restante */}
            <div className="flex-1 overflow-hidden">
              <AnalysisChat 
                analysisMessages={analysisMessages}
                hasApiKeys={hasApiKeys}
                currentStep={currentStep}
                analysisTypes={analysisTypes}
                selectedTypes={selectedAnalysisTypes}
                uploadedImage={uploadedImageFile}
                isAnalyzing={isAnalyzing}
                onAnalysisTypesChange={setSelectedAnalysisTypes}
                onStartAnalysis={handleStartAnalyses}
                selectedProvider={selectedProvider}
                onProviderChange={setSelectedProvider}
              />
            </div>
          </div>

          {/* Right Column - Analysis (3/4) */}
          <div className="col-span-3 flex flex-col h-full">
            
            {/* Zone d'upload/analyse simplifiée */}
            <div className="flex-1 overflow-hidden">
              {!uploadedImageFile ? (
                <div className="h-full">
                  <Card className="h-full flex flex-col rounded-none border-0">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="flex items-center space-x-2">
                        <ImageIcon className="h-5 w-5 text-green-600" />
                        <span>Upload d'image</span>
                      </CardTitle>
                      <CardDescription>
                        Sélectionnez une image à analyser avec l'IA
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center flex flex-col justify-center">
                        <UploadIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-4">
                          <div>
                            <p className="text-gray-600 mb-2">Sélectionnez une image à analyser</p>
                            <p className="text-sm text-gray-500">JPG, PNG (max 10MB)</p>
                          </div>
                          
                          {/* Bouton stylé comme les autres boutons */}
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                              className="hidden"
                              id="file-upload"
                            />
                            <label htmlFor="file-upload">
                              <Button 
                                asChild
                                disabled={isUploading}
                                className="cursor-pointer"
                              >
                                <span>
                                  <UploadIcon className="h-4 w-4 mr-2" />
                                  Choisir un fichier
                                </span>
                              </Button>
                            </label>
                          </div>
                          
                          {isUploading && (
                            <div className="mt-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                              <p className="text-sm text-gray-600 mt-2">Upload en cours...</p>
                            </div>
                          )}
                          {uploadError && (
                            <div className="mt-4 text-red-600 text-sm">
                              Erreur: {uploadError}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : analysisResults.length > 0 ? (
                // Afficher les annotations si il y a des résultats
                <div className="h-full">
                  <div className="h-full relative">
                    {/* Info fichier en overlay */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className="flex items-center space-x-3 p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border">
                        <ImageIcon className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-medium text-sm">{uploadedImageFile.name}</p>
                          <p className="text-xs text-gray-600">
                            {(uploadedImageFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleReset}>
                          Changer
                        </Button>
                      </div>
                    </div>
                    
                    {/* Composant d'annotations */}
                    <ImageAnnotationViewer
                      imageFile={uploadedImageFile}
                      analysisResults={analysisResults.map(result => {
                        const annotations = result.result?.annotations || []
                        const issues = annotations.filter((ann: any) => ann.type === 'issue').length
                        const recommendations = annotations.filter((ann: any) => ann.type === 'recommendation').length
                        
                        // Utiliser l'analysisTypeId stocké avec le résultat
                        const analysisType = analysisTypes.find(t => t.id === result.analysisTypeId)
                        
                        return {
                          type: analysisType?.name || 'Analyse',
                          issues: issues,
                          recommendations: recommendations,
                          annotations: annotations,
                          summary: result.result?.content || 'Analyse terminée'
                        }
                      })}
                      isAnalyzing={false}
                    />
                  </div>
                </div>
              ) : (
                // Afficher la preview simple si pas encore d'analyse
                <div className="h-full">
                  <Card className="h-full flex flex-col rounded-none border-0">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="flex items-center space-x-2">
                        <ImageIcon className="h-5 w-5 text-green-600" />
                        <span>Image uploadée</span>
                      </CardTitle>
                      <CardDescription>
                        Configurez l'analyse et cliquez sur "Analyser"
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <div className="flex-1 flex flex-col space-y-4">
                        {/* Info fichier */}
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <ImageIcon className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="font-medium">{uploadedImageFile.name}</p>
                              <p className="text-sm text-gray-600">
                                {(uploadedImageFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={handleReset}>
                            Changer
                          </Button>
                        </div>
                        
                        {/* Preview - Hauteur fixe */}
                        <div className="h-[70vh] flex items-center justify-center bg-gray-50 rounded-lg border">
                          <img
                            src={URL.createObjectURL(uploadedImageFile)}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
