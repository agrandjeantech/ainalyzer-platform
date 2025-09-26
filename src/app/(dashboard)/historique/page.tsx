'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TopBar } from '@/components/ui/TopBar'
import { BackButton } from '@/components/ui/BackButton'
import { AnalysisHistoryItem, AnalysisHistoryFilters } from '@/types'
import { generateAnalysisPdf, downloadPdf } from '@/lib/pdf-generator'
import { 
  Search, 
  Calendar, 
  Eye, 
  Download, 
  Heart, 
  HeartOff, 
  Filter,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Clock,
  Zap,
  Tag,
  Loader2
} from 'lucide-react'

export default function AnalysesHistoryPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Définir le titre de la page
  useEffect(() => {
    document.title = "Ainalyzer - Historique des analyses"
  }, [])
  
  // États pour les filtres
  const [filters, setFilters] = useState<AnalysisHistoryFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // État pour la génération PDF
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)

  // Charger les analyses
  const loadAnalyses = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true)
      setError(null)

      // Construire les paramètres de requête
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })

      // Ajouter les filtres
      if (currentFilters.search) params.append('search', currentFilters.search)
      if (currentFilters.analysis_type) params.append('analysis_type', currentFilters.analysis_type)
      if (currentFilters.category) params.append('category', currentFilters.category)
      if (currentFilters.provider) params.append('provider', currentFilters.provider)
      if (currentFilters.is_favorite !== undefined) params.append('is_favorite', currentFilters.is_favorite.toString())
      if (currentFilters.date_from) params.append('date_from', currentFilters.date_from)
      if (currentFilters.date_to) params.append('date_to', currentFilters.date_to)
      if (currentFilters.status) params.append('status', currentFilters.status)
      if (currentFilters.tags && currentFilters.tags.length > 0) {
        params.append('tags', currentFilters.tags.join(','))
      }

      const response = await fetch(`/api/analyses/history?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des analyses')
      }

      setAnalyses(data.data || [])
      setCurrentPage(data.pagination.page)
      setTotalPages(data.pagination.totalPages)
      setTotalCount(data.pagination.total)

    } catch (err) {
      console.error('Erreur lors du chargement des analyses:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // Charger les analyses au montage du composant
  useEffect(() => {
    loadAnalyses()
  }, [])

  // Gérer la recherche
  const handleSearch = () => {
    const newFilters = { ...filters, search: searchTerm || undefined }
    setFilters(newFilters)
    setCurrentPage(1)
    loadAnalyses(1, newFilters)
  }

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadAnalyses(page)
  }

  // Basculer le statut favori
  const toggleFavorite = async (analysisId: string, currentFavorite: boolean) => {
    try {
      const response = await fetch('/api/analyses/history', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          is_favorite: !currentFavorite
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      // Recharger les analyses
      loadAnalyses(currentPage)
    } catch (err) {
      console.error('Erreur lors de la mise à jour du favori:', err)
    }
  }

  // Formater la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Formater la durée
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  // Générer et télécharger le PDF
  const handleGeneratePdf = async (analysis: AnalysisHistoryItem) => {
    try {
      setGeneratingPdf(analysis.id)
      
      // Générer le PDF
      const pdfBlob = await generateAnalysisPdf(analysis, {
        includeAnnotations: true,
        includeOriginalImage: true
      })
      
      // Créer le nom du fichier
      const fileName = `${analysis.analysis_type}_${analysis.image_name}_${new Date(analysis.created_at).toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`
      
      // Télécharger le PDF
      downloadPdf(pdfBlob, fileName)
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      // Vous pourriez ajouter une notification d'erreur ici
    } finally {
      setGeneratingPdf(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      
      <BackButton href="/dashboard" label="Retour au dashboard" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Historique des analyses</h1>
          <p className="text-gray-600 mt-2">
            Consultez et gérez toutes vos analyses d&apos;images précédentes
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Recherche et filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher dans les analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Rechercher
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total analyses</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Favoris</p>
                  <p className="text-2xl font-bold">
                    {analyses.filter(a => a.is_favorite).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">PDF générés</p>
                  <p className="text-2xl font-bold">
                    {analyses.filter(a => a.pdf_generated).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Cette semaine</p>
                  <p className="text-2xl font-bold">
                    {analyses.filter(a => {
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return new Date(a.created_at) > weekAgo
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des analyses */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement des analyses...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => loadAnalyses()} variant="outline">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        ) : analyses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune analyse trouvée
              </h3>
              <p className="text-gray-600 mb-4">
                Vous n'avez pas encore d'analyses terminées ou aucune ne correspond à vos critères de recherche.
              </p>
              <Button onClick={() => router.push('/analyze')}>
                Créer une nouvelle analyse
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Grille des analyses */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {analysis.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(analysis.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(analysis.id, analysis.is_favorite)}
                        className="ml-2"
                      >
                        {analysis.is_favorite ? (
                          <Heart className="h-4 w-4 text-red-500 fill-current" />
                        ) : (
                          <HeartOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Image miniature */}
                    {analysis.original_image_url && (
                      <div className="mb-4">
                        <img
                          src={analysis.original_image_url}
                          alt={analysis.image_name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">
                        {analysis.analysis_type}
                      </Badge>
                      <Badge variant="outline">
                        {analysis.provider}
                      </Badge>
                      {analysis.pdf_generated && (
                        <Badge variant="default" className="bg-green-500">
                          PDF
                        </Badge>
                      )}
                    </div>

                    {/* Aperçu du texte */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {analysis.preview_text}
                    </p>

                    {/* Métadonnées */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(analysis.duration_ms)}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileImage className="h-3 w-3" />
                        {formatFileSize(analysis.image_size_bytes)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {analysis.annotations_count} annotations
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {analysis.tokens_used || 0} tokens
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/analyse?analysis_id=${analysis.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleGeneratePdf(analysis)}
                        disabled={generatingPdf === analysis.id}
                      >
                        {generatingPdf === analysis.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
