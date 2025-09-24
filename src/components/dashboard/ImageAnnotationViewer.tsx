'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ZoomInIcon, 
  ZoomOutIcon, 
  RotateCcwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  XIcon,
  PanelRightIcon,
  PanelRightCloseIcon,
  EyeIcon,
  EyeOffIcon,
  FilterIcon
} from 'lucide-react'

// Types pour le parser d'annotation
interface AnnotationItem {
  type: 'item'
  label: string
  content: string
}

interface AnnotationCode {
  type: 'code'
  content: string
}

interface AnnotationText {
  type: 'text'
  content: string
}

interface AnnotationSection {
  type: 'section'
  title: string
  items: (AnnotationItem | AnnotationCode | AnnotationText)[]
}

interface AnnotationTitle {
  type: 'main-title'
  content: string
}

type ParsedAnnotationContent = (AnnotationTitle | AnnotationSection)[]

// Composant pour formater le contenu des annotations
function FormattedAnnotationContent({ content }: { content: string }) {
  // Parser spécialisé pour le format structuré avec séparateurs "|"
  const parseAnnotationText = (text: string) => {
    const sections: { label: string; content: string; isCode?: boolean }[] = []
    
    // Détecter le format avec séparateurs "|" (ex: "Rôle et fonction : [desc] | Position et hiérarchie : [desc]")
    if (text.includes(' | ')) {
      const parts = text.split(' | ')
      
      parts.forEach(part => {
        const colonIndex = part.indexOf(' : ')
        if (colonIndex > 0) {
          const label = part.substring(0, colonIndex).trim()
          const content = part.substring(colonIndex + 3).trim()
          
          // Détecter si c'est du code
          const isCode = label.toLowerCase().includes('code') || 
                        label.toLowerCase().includes('html') ||
                        label.toLowerCase().includes('css') ||
                        label.toLowerCase().includes('suggestion') ||
                        content.includes('<') || 
                        content.includes('{') ||
                        content.includes('class=') ||
                        content.includes('aria-') ||
                        content.includes('function') ||
                        content.includes('const ') ||
                        content.includes('var ')
          
          sections.push({
            label,
            content,
            isCode
          })
        }
      })
    } else {
      // Fallback: détecter les patterns avec ":" (ex: "Label : contenu")
      const genericPatternRegex = /^([^:\n]+)\s*:\s*([\s\S]+?)(?=\n[^:\n]+\s*:|$)/gm
      const matches = Array.from(text.matchAll(genericPatternRegex))
      
      if (matches.length > 0) {
        // Contenu structuré avec des labels
        matches.forEach(match => {
          const label = match[1].trim()
          const content = match[2].trim()
          
          // Détecter si c'est du code
          const isCode = label.toLowerCase().includes('code') || 
                        label.toLowerCase().includes('html') ||
                        label.toLowerCase().includes('css') ||
                        label.toLowerCase().includes('suggestion') ||
                        content.includes('<') || 
                        content.includes('{') ||
                        content.includes('class=') ||
                        content.includes('aria-') ||
                        content.includes('function') ||
                        content.includes('const ') ||
                        content.includes('var ')
          
          sections.push({
            label,
            content,
            isCode
          })
        })
      } else {
        // Pas de structure détectée, traiter comme texte simple
        const isCode = text.includes('<') || 
                      text.includes('{') ||
                      text.includes('class=') ||
                      text.includes('aria-') ||
                      text.includes('function') ||
                      text.includes('const ') ||
                      text.includes('var ') ||
                      (text.split('\n').length > 3 && text.includes('  ')) // Indentation
        
        sections.push({
          label: '',
          content: text,
          isCode
        })
      }
    }
    
    return sections
  }
  
  const sections = parseAnnotationText(content)
  
  return (
    <div className="space-y-4 max-w-none">
      {sections.map((section, index) => {
        if (!section.label) {
          // Texte simple sans label
          if (section.isCode) {
            return (
              <div key={index} className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-w-full">
                <pre className="text-sm text-gray-200 whitespace-pre-wrap break-words">
                  <code>{section.content}</code>
                </pre>
              </div>
            )
          } else {
            return (
              <div key={index} className="text-sm text-gray-700 break-words leading-relaxed whitespace-pre-wrap">
                {section.content}
              </div>
            )
          }
        }
        
        return (
          <div key={index} className="space-y-2">
            {/* Label de la section */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-800 text-sm break-words">
                  {section.label}
                </span>
                {!section.isCode && (
                  <span className="text-gray-600 text-sm break-words ml-2">
                    : {section.content}
                  </span>
                )}
              </div>
            </div>
            
            {/* Code block si c'est du code */}
            {section.isCode && (
              <div className="ml-5 mt-2">
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-w-full">
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap break-words">
                    <code>{section.content}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface Annotation {
  id: string
  type: 'issue' | 'recommendation' | 'info'
  title: string
  description: string
  x: number // Position en pourcentage
  y: number // Position en pourcentage
  width: number // Largeur en pourcentage
  height: number // Hauteur en pourcentage
  color: string
}

interface AnalysisResult {
  type: string
  issues: number
  recommendations: number
  annotations: Annotation[]
  summary: string
}

interface ImageAnnotationViewerProps {
  imageFile: File
  analysisResults: AnalysisResult[]
  isAnalyzing: boolean
}

export function ImageAnnotationViewer({ 
  imageFile, 
  analysisResults, 
  isAnalyzing 
}: ImageAnnotationViewerProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)
  const [zoom, setZoom] = useState(1)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [showSummaryPanel, setShowSummaryPanel] = useState(false)
  const [visibleAnalysisTypes, setVisibleAnalysisTypes] = useState<Record<string, boolean>>({})
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialiser la visibilité de tous les types d'analyses
  useEffect(() => {
    const initialVisibility: Record<string, boolean> = {}
    analysisResults.forEach(result => {
      initialVisibility[result.type] = true
    })
    setVisibleAnalysisTypes(initialVisibility)
  }, [analysisResults])

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [imageFile])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleResetZoom = () => setZoom(1)

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case 'issue':
        return <AlertTriangleIcon className="h-3 w-3" />
      case 'recommendation':
        return <InfoIcon className="h-3 w-3" />
      default:
        return <CheckCircleIcon className="h-3 w-3" />
    }
  }

  // Couleurs par type d'analyse (palette distinctive)
  const getAnalysisTypeColor = (analysisType: string) => {
    const colors = [
      'bg-blue-500/20 border-blue-500', // Bleu
      'bg-green-500/20 border-green-500', // Vert
      'bg-purple-500/20 border-purple-500', // Violet
      'bg-orange-500/20 border-orange-500', // Orange
      'bg-pink-500/20 border-pink-500', // Rose
      'bg-teal-500/20 border-teal-500', // Sarcelle
      'bg-indigo-500/20 border-indigo-500', // Indigo
      'bg-red-500/20 border-red-500', // Rouge
    ]
    
    const index = analysisResults.findIndex(result => result.type === analysisType)
    return colors[index % colors.length]
  }

  const getAnalysisTypeBgColor = (analysisType: string) => {
    const colors = [
      'bg-blue-500', // Bleu
      'bg-green-500', // Vert
      'bg-purple-500', // Violet
      'bg-orange-500', // Orange
      'bg-pink-500', // Rose
      'bg-teal-500', // Sarcelle
      'bg-indigo-500', // Indigo
      'bg-red-500', // Rouge
    ]
    
    const index = analysisResults.findIndex(result => result.type === analysisType)
    return colors[index % colors.length]
  }

  // Trouver le type d'analyse d'une annotation
  const getAnnotationAnalysisType = (annotationId: string) => {
    for (const result of analysisResults) {
      if (result.annotations.some(ann => ann.id === annotationId)) {
        return result.type
      }
    }
    return analysisResults[0]?.type || ''
  }

  const toggleAnalysisTypeVisibility = (analysisType: string) => {
    setVisibleAnalysisTypes(prev => ({
      ...prev,
      [analysisType]: !prev[analysisType]
    }))
  }

  const toggleAllAnalysisTypes = () => {
    const allVisible = Object.values(visibleAnalysisTypes).every(visible => visible)
    const newVisibility: Record<string, boolean> = {}
    analysisResults.forEach(result => {
      newVisibility[result.type] = !allVisible
    })
    setVisibleAnalysisTypes(newVisibility)
  }

  const totalIssues = analysisResults.reduce((sum, result) => sum + result.issues, 0)
  const totalRecommendations = analysisResults.reduce((sum, result) => sum + result.recommendations, 0)
  
  // Filtrer les annotations selon les types d'analyses visibles
  const visibleAnnotations = analysisResults
    .filter(result => visibleAnalysisTypes[result.type])
    .flatMap(result => result.annotations)
  
  const visibleAnalysisCount = Object.values(visibleAnalysisTypes).filter(Boolean).length

  if (isAnalyzing) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Image avec skeleton */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Analyse en cours...</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyse de l'image en cours...</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau de résumé skeleton */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Résultats d'analyse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full flex">
      {/* Zone principale avec image */}
      <div className={`flex-1 transition-all duration-300 ${showSummaryPanel ? 'mr-80' : 'mr-0'}`}>
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle>Image analysée</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSummaryPanel(!showSummaryPanel)}
                  className="flex items-center space-x-2"
                >
                  {showSummaryPanel ? (
                    <>
                      <PanelRightCloseIcon className="h-4 w-4" />
                      <span>Masquer résumé</span>
                    </>
                  ) : (
                    <>
                      <PanelRightIcon className="h-4 w-4" />
                      <span>Afficher résumé</span>
                    </>
                  )}
                </Button>
                <div className="h-4 w-px bg-gray-300"></div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnnotations(!showAnnotations)}
                >
                  {showAnnotations ? 'Masquer' : 'Afficher'} annotations
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOutIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetZoom}>
                  <RotateCcwIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomInIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Filtres par type d'analyse */}
            {analysisResults.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FilterIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Filtrer les annotations ({visibleAnalysisCount}/{analysisResults.length})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleAllAnalysisTypes}
                    className="text-xs"
                  >
                    {visibleAnalysisCount === analysisResults.length ? 'Tout masquer' : 'Tout afficher'}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {analysisResults.map((result, index) => (
                    <Button
                      key={index}
                      variant={visibleAnalysisTypes[result.type] ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAnalysisTypeVisibility(result.type)}
                      className={`flex items-center space-x-2 text-xs border-2 ${
                        visibleAnalysisTypes[result.type] 
                          ? `${getAnalysisTypeBgColor(result.type)} hover:opacity-90 text-white border-transparent` 
                          : `border-current hover:bg-gray-50`
                      }`}
                      style={!visibleAnalysisTypes[result.type] ? {
                        borderColor: getAnalysisTypeBgColor(result.type).replace('bg-', '').replace('-500', ''),
                        color: getAnalysisTypeBgColor(result.type).replace('bg-', '').replace('-500', '')
                      } : {}}
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        visibleAnalysisTypes[result.type] 
                          ? 'bg-white/30' 
                          : getAnalysisTypeBgColor(result.type)
                      }`}></div>
                      {visibleAnalysisTypes[result.type] ? (
                        <EyeIcon className="h-3 w-3" />
                      ) : (
                        <EyeOffIcon className="h-3 w-3" />
                      )}
                      <span>{result.type}</span>
                      <Badge 
                        variant="secondary" 
                        className={`ml-1 text-xs ${
                          visibleAnalysisTypes[result.type] 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-100'
                        }`}
                      >
                        {result.annotations.length}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="h-[70vh] overflow-auto p-0">
            <div className="w-full flex items-center justify-center bg-gray-50">
              <div 
                ref={containerRef}
                className="relative inline-block"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              >
                {imageUrl && (
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Image analysée"
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => {
                      // Marquer l'image comme chargée et forcer un re-render des annotations
                      setImageLoaded(true)
                      if (imageRef.current) {
                        console.log('Image dimensions:', {
                          natural: { width: imageRef.current.naturalWidth, height: imageRef.current.naturalHeight },
                          displayed: { width: imageRef.current.clientWidth, height: imageRef.current.clientHeight }
                        })
                      }
                    }}
                  />
                )}
                
                {/* Annotations superposées avec correction de dimensionnement */}
                {showAnnotations && visibleAnnotations.map((annotation: Annotation) => {
                  const analysisType = getAnnotationAnalysisType(annotation.id)
                  
                  // Utiliser directement les coordonnées de l'annotation (simplification)
                  const coordinates = {
                    left: `${annotation.x}%`,
                    top: `${annotation.y}%`,
                    width: `${annotation.width}%`,
                    height: `${annotation.height}%`,
                  }
                  
                  // Debug logging simplifié
                  if (annotation.id === visibleAnnotations[0]?.id && imageRef.current) {
                    console.log('Simple coordinate debug:', {
                      annotation: { x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height },
                      imageDimensions: { 
                        natural: { width: imageRef.current.naturalWidth, height: imageRef.current.naturalHeight },
                        displayed: { width: imageRef.current.clientWidth, height: imageRef.current.clientHeight }
                      },
                      finalCoords: coordinates
                    })
                  }
                  
                  return (
                    <div
                      key={annotation.id}
                      className={`absolute border-2 cursor-pointer transition-all hover:opacity-80 ${getAnalysisTypeColor(analysisType)}`}
                      style={coordinates}
                      onClick={() => setSelectedAnnotation(annotation)}
                    >
                      <div className={`absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white ${getAnalysisTypeBgColor(analysisType)} whitespace-nowrap`}>
                        <div className="flex items-center space-x-1">
                          {getAnnotationIcon(annotation.type)}
                          <span>{annotation.title}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volet de résumé rétractable */}
      {showSummaryPanel && (
        <div className="absolute top-0 right-0 h-full w-80 animate-in slide-in-from-right duration-300">
          <Card className="h-full flex flex-col shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Résumé d'analyse</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSummaryPanel(false)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex space-x-4 mt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">{totalIssues} Problèmes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm">{totalRecommendations} Recommandations</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {analysisResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{result.type}</h4>
                    <p className="text-sm text-gray-600 mb-3">{result.summary}</p>
                    
                    <div className="space-y-2">
                      {result.annotations.map((annotation) => (
                        <div
                          key={annotation.id}
                          className={`p-2 rounded cursor-pointer transition-colors ${
                            selectedAnnotation?.id === annotation.id ? 'bg-blue-100' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedAnnotation(annotation)}
                        >
                          <div className="flex items-start space-x-2">
                            <div className={`mt-0.5 ${
                              annotation.type === 'issue' ? 'text-red-500' :
                              annotation.type === 'recommendation' ? 'text-yellow-500' : 'text-blue-500'
                            }`}>
                              {getAnnotationIcon(annotation.type)}
                            </div>
                            <div className="flex-1">
                              <h5 className="text-sm font-medium">{annotation.title}</h5>
                              <p className="text-xs text-gray-600">{annotation.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de détail d'annotation */}
      {selectedAnnotation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <div className={`${
                    selectedAnnotation.type === 'issue' ? 'text-red-500' :
                    selectedAnnotation.type === 'recommendation' ? 'text-yellow-500' : 'text-blue-500'
                  }`}>
                    {getAnnotationIcon(selectedAnnotation.type)}
                  </div>
                  <span>{selectedAnnotation.title}</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAnnotation(null)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <FormattedAnnotationContent content={selectedAnnotation.description} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
