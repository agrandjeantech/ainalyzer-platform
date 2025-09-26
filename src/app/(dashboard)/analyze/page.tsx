'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BrainIcon, MessageSquareIcon, ImageIcon } from 'lucide-react'
import { TopBar } from '@/components/ui/TopBar'
import { BackButton } from '@/components/ui/BackButton'

// Métadonnées pour cette page (côté client)
if (typeof document !== 'undefined') {
  document.title = "Ainalyzer - Analyse d'images"
}
import { AnalysisChat } from '@/components/dashboard/AnalysisChat'
import { ImageUploader } from '@/components/dashboard/ImageUploader'
import { AnalysisTypesSelector } from '@/components/dashboard/AnalysisTypesSelector'
import { ImageAnnotationViewer } from '@/components/dashboard/ImageAnnotationViewer'
import { useAnalysisTypes } from '@/hooks/useAnalysisTypes'
import { RealAnalysisButton } from '@/components/dashboard/RealAnalysisButton'

interface AnalysisResult {
  type: string
  issues: number
  recommendations: number
  annotations: Array<{
    id: string
    type: 'issue' | 'recommendation' | 'info'
    title: string
    description: string
    x: number
    y: number
    width: number
    height: number
    color: string
  }>
  summary: string
}

export default function AnalyzePage() {
  const [user, setUser] = useState<any>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { analysisTypes } = useAnalysisTypes()

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

  const handleAnalysisTypesChange = (newSelection: string[]) => {
    setSelectedTypes(newSelection)
  }

  const handleImageUpload = (file: File, uploadData: any) => {
    setUploadedImage(file)
    console.log('Image uploadée vers Supabase:', uploadData)
  }

  const handleImageRemove = () => {
    setUploadedImage(null)
  }

  const generateMockResults = (): AnalysisResult[] => {
    // Templates d'analyses avec données variées
    const analysisTemplates = [
      {
        type: "Analyse des régions",
        issues: 2,
        recommendations: 3,
        summary: "L'interface présente une structure claire avec quelques améliorations possibles pour l'accessibilité.",
        annotations: [
          {
            id: "region-1",
            type: "issue" as const,
            title: "Zone sans label",
            description: "Cette région manque d'un label accessible pour les lecteurs d'écran.",
            x: 15, y: 20, width: 25, height: 15, color: "#ef4444"
          },
          {
            id: "region-2",
            type: "recommendation" as const,
            title: "Améliorer le contraste",
            description: "Le contraste de cette zone pourrait être amélioré pour une meilleure lisibilité.",
            x: 60, y: 35, width: 30, height: 20, color: "#f59e0b"
          }
        ]
      },
      {
        type: "Éléments interactifs",
        issues: 1,
        recommendations: 2,
        summary: "Les boutons sont bien structurés mais certains manquent d'états de focus visibles.",
        annotations: [
          {
            id: "interactive-1",
            type: "issue" as const,
            title: "Focus invisible",
            description: "Ce bouton n'a pas d'indicateur de focus visible pour la navigation au clavier.",
            x: 45, y: 70, width: 20, height: 8, color: "#ef4444"
          },
          {
            id: "interactive-2",
            type: "recommendation" as const,
            title: "Taille de cible",
            description: "Cette zone cliquable pourrait être plus grande pour faciliter l'interaction.",
            x: 75, y: 60, width: 15, height: 12, color: "#f59e0b"
          }
        ]
      },
      {
        type: "Navigation et structure",
        issues: 3,
        recommendations: 1,
        summary: "La navigation présente quelques défis d'accessibilité mais la structure générale est cohérente.",
        annotations: [
          {
            id: "nav-1",
            type: "issue" as const,
            title: "Menu sans ARIA",
            description: "Le menu principal manque d'attributs ARIA pour la navigation au clavier.",
            x: 10, y: 5, width: 80, height: 10, color: "#ef4444"
          },
          {
            id: "nav-2",
            type: "recommendation" as const,
            title: "Breadcrumb suggéré",
            description: "Ajouter un fil d'Ariane améliorerait l'orientation des utilisateurs.",
            x: 20, y: 85, width: 60, height: 8, color: "#f59e0b"
          }
        ]
      },
      {
        type: "Contenu et lisibilité",
        issues: 1,
        recommendations: 4,
        summary: "Le contenu est globalement accessible avec des opportunités d'amélioration de la lisibilité.",
        annotations: [
          {
            id: "content-1",
            type: "issue" as const,
            title: "Texte trop petit",
            description: "Cette section contient du texte inférieur à 16px, difficile à lire.",
            x: 30, y: 40, width: 40, height: 25, color: "#ef4444"
          },
          {
            id: "content-2",
            type: "recommendation" as const,
            title: "Espacement améliorable",
            description: "Augmenter l'espacement entre les paragraphes améliorerait la lisibilité.",
            x: 25, y: 50, width: 50, height: 20, color: "#f59e0b"
          }
        ]
      },
      {
        type: "Images et médias",
        issues: 2,
        recommendations: 2,
        summary: "Les médias nécessitent des améliorations d'accessibilité, notamment les textes alternatifs.",
        annotations: [
          {
            id: "media-1",
            type: "issue" as const,
            title: "Alt text manquant",
            description: "Cette image importante n'a pas de texte alternatif descriptif.",
            x: 50, y: 25, width: 35, height: 30, color: "#ef4444"
          },
          {
            id: "media-2",
            type: "recommendation" as const,
            title: "Légendes suggérées",
            description: "Ajouter des légendes aux images améliorerait la compréhension.",
            x: 40, y: 15, width: 45, height: 35, color: "#f59e0b"
          }
        ]
      },
      {
        type: "Formulaires et saisie",
        issues: 4,
        recommendations: 1,
        summary: "Les formulaires présentent plusieurs problèmes d'accessibilité qui nécessitent une attention.",
        annotations: [
          {
            id: "form-1",
            type: "issue" as const,
            title: "Labels manquants",
            description: "Plusieurs champs de formulaire n'ont pas de labels associés.",
            x: 20, y: 60, width: 60, height: 25, color: "#ef4444"
          },
          {
            id: "form-2",
            type: "recommendation" as const,
            title: "Messages d'erreur",
            description: "Améliorer les messages d'erreur pour plus de clarté.",
            x: 35, y: 75, width: 30, height: 15, color: "#f59e0b"
          }
        ]
      }
    ]

    // Générer les résultats basés sur les types sélectionnés
    const results: AnalysisResult[] = []
    
    for (let i = 0; i < selectedTypes.length; i++) {
      const selectedTypeId = selectedTypes[i]
      const template = analysisTemplates[i % analysisTemplates.length]
      
      // Trouver le nom réel du type d'analyse à partir de l'ID
      const analysisType = analysisTypes.find(type => type.id === selectedTypeId)
      const analysisTypeName = analysisType?.name || template.type
      
      // Créer une copie avec le vrai nom de l'analyse
      const result = {
        ...template,
        type: analysisTypeName,
        annotations: template.annotations.map(ann => ({
          ...ann,
          id: `${selectedTypeId}-${ann.id}` // ID unique par type sélectionné
        }))
      }
      
      results.push(result)
    }

    return results
  }

  const handleStartAnalysis = async () => {
    if (!uploadedImage || selectedTypes.length === 0) return
    
    setIsAnalyzing(true)
    setShowResults(false)
    console.log('Démarrage analyse:', { image: uploadedImage.name, types: selectedTypes })
    
    // Simulation avec génération de résultats
    setTimeout(() => {
      const results = generateMockResults()
      setAnalysisResults(results)
      setIsAnalyzing(false)
      setShowResults(true)
    }, 3000)
  }

  const handleNewAnalysis = () => {
    setShowResults(false)
    setAnalysisResults([])
    setUploadedImage(null)
    setSelectedTypes([])
  }

  const canAnalyze = uploadedImage && selectedTypes.length > 0 && !isAnalyzing

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
      <TopBar />
      
      <BackButton href="/dashboard" label="Retour au dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 h-[calc(100vh-120px)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyse d'images</h1>
          <p className="text-gray-600">
            Analysez l'accessibilité de vos interfaces avec l'IA
          </p>
        </div>
        {!showResults ? (
          /* Interface d'upload et sélection */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            
            {/* Left Column - Chat with AI */}
            <div className="flex flex-col">
              <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <MessageSquareIcon className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold">Chat avec Ainalyzer AI</h2>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Posez des questions sur l'analyse d'accessibilité
                  </p>
                </div>
                
                <AnalysisChat 
                  isAnalyzing={isAnalyzing}
                  uploadedImage={uploadedImage}
                  selectedTypes={selectedTypes}
                />
              </div>
            </div>

            {/* Right Column - Image Upload & Analysis Selection */}
            <div className="flex flex-col space-y-6">
              
              {/* Analysis Types Selection */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Types d'analyses</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sélectionnez les analyses à effectuer
                  </p>
                </div>
                <div className="p-4">
                  <AnalysisTypesSelector
                    selectedTypes={selectedTypes}
                    onSelectionChange={handleAnalysisTypesChange}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-white rounded-lg shadow-sm border flex-1">
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold">Upload d'image</h2>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Glissez-déposez ou sélectionnez une image (JPG, PNG, max 10MB)
                  </p>
                </div>
                
                <div className="p-4 flex-1">
                  <ImageUploader
                    onImageUpload={handleImageUpload}
                    onImageRemove={handleImageRemove}
                    uploadedImage={uploadedImage}
                  />
                </div>
              </div>

              {/* Analyze Button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="px-8 py-3"
                  disabled={!canAnalyze}
                  onClick={handleStartAnalysis}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <BrainIcon className="h-4 w-4 mr-2" />
                      Analyser ({selectedTypes.length} type{selectedTypes.length > 1 ? 's' : ''})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Interface de résultats avec annotations */
          <div className="h-full flex flex-col">
            {/* Header des résultats */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Résultats d'analyse</h2>
                <p className="text-gray-600">
                  Analyse terminée pour "{uploadedImage?.name}"
                </p>
              </div>
              <Button variant="outline" onClick={handleNewAnalysis}>
                Nouvelle analyse
              </Button>
            </div>

            {/* Chat + Annotations */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
              
              {/* Chat Column - Plus petit */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
                  <div className="p-4 border-b">
                    <div className="flex items-center space-x-2">
                      <MessageSquareIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Chat IA</h3>
                    </div>
                  </div>
                  
                  <AnalysisChat 
                    isAnalyzing={isAnalyzing}
                    uploadedImage={uploadedImage}
                    selectedTypes={selectedTypes}
                  />
                </div>
              </div>

              {/* Annotations Column - Plus grand */}
              <div className="lg:col-span-3">
                {uploadedImage && (
                  <ImageAnnotationViewer
                    imageFile={uploadedImage}
                    analysisResults={analysisResults}
                    isAnalyzing={isAnalyzing}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
