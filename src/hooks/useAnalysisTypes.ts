'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AnalysisType {
  id: string
  name: string
  description: string
  system_prompt: string
  category: string
  active: boolean
  created_at: string
}

interface AnalysisTypeFormData {
  name: string
  description: string
  system_prompt: string
  category: string
}

export function useAnalysisTypes(includeInactive = false) {
  const [analysisTypes, setAnalysisTypes] = useState<AnalysisType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const supabase = createClient()

  // Charger les types d'analyses
  const loadAnalysisTypes = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const url = `/api/analysis-types${includeInactive ? '?includeInactive=true' : ''}`
      const response = await fetch(url)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du chargement des types d\'analyses')
      }

      setAnalysisTypes(result.data || [])
      setIsAdmin(result.isAdmin || false)
    } catch (err) {
      console.error('Erreur lors du chargement des types d\'analyses:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  // Ajouter un nouveau type d'analyse (admin seulement)
  const addAnalysisType = async (formData: AnalysisTypeFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/analysis-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Erreur lors de l\'ajout du type d\'analyse' }
      }

      // Recharger les types après ajout
      await loadAnalysisTypes()
      return { success: true }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du type d\'analyse:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur inconnue' 
      }
    }
  }

  // Mettre à jour un type d'analyse (admin seulement)
  const updateAnalysisType = async (
    id: string, 
    updates: Partial<AnalysisTypeFormData & { active: boolean }>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/analysis-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Erreur lors de la mise à jour' }
      }

      // Mettre à jour localement
      setAnalysisTypes(prev => prev.map(type => 
        type.id === id ? { ...type, ...updates } : type
      ))

      return { success: true }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du type d\'analyse:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur inconnue' 
      }
    }
  }

  // Supprimer un type d'analyse (admin seulement)
  const deleteAnalysisType = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/analysis-types/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Erreur lors de la suppression' }
      }

      // Supprimer localement
      setAnalysisTypes(prev => prev.filter(type => type.id !== id))
      return { success: true }
    } catch (err) {
      console.error('Erreur lors de la suppression du type d\'analyse:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur inconnue' 
      }
    }
  }

  // Récupérer un type d'analyse spécifique
  const getAnalysisType = async (id: string): Promise<{ success: boolean; data?: AnalysisType; error?: string }> => {
    try {
      const response = await fetch(`/api/analysis-types/${id}`)
      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Erreur lors de la récupération' }
      }

      return { success: true, data: result.data }
    } catch (err) {
      console.error('Erreur lors de la récupération du type d\'analyse:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur inconnue' 
      }
    }
  }

  // Charger les types au montage du composant
  useEffect(() => {
    loadAnalysisTypes()
  }, [includeInactive])

  // Écouter les changements d'authentification
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setAnalysisTypes([])
        setIsAdmin(false)
        setError(null)
      } else if (event === 'SIGNED_IN') {
        loadAnalysisTypes()
      }
    })

    return () => subscription.unsubscribe()
  }, [includeInactive])

  return {
    analysisTypes,
    isLoading,
    error,
    isAdmin,
    addAnalysisType,
    updateAnalysisType,
    deleteAnalysisType,
    getAnalysisType,
    refreshAnalysisTypes: loadAnalysisTypes,
  }
}

// Hook pour les statistiques des types d'analyses
export function useAnalysisTypeStats() {
  const [stats, setStats] = useState({
    totalTypes: 0,
    activeTypes: 0,
    categoriesCount: 0,
    categories: [] as { name: string; count: number }[],
    isLoading: true,
  })

  const { analysisTypes, isLoading } = useAnalysisTypes(true)

  useEffect(() => {
    if (!isLoading) {
      const totalTypes = analysisTypes.length
      const activeTypes = analysisTypes.filter(type => type.active).length
      
      // Compter par catégorie
      const categoryMap = new Map<string, number>()
      analysisTypes.forEach(type => {
        const count = categoryMap.get(type.category) || 0
        categoryMap.set(type.category, count + 1)
      })

      const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count
      }))

      setStats({
        totalTypes,
        activeTypes,
        categoriesCount: categories.length,
        categories,
        isLoading: false,
      })
    }
  }, [analysisTypes, isLoading])

  return stats
}

// Hook pour grouper les types d'analyses par catégorie
export function useAnalysisTypesByCategory(includeInactive = false) {
  const { analysisTypes, isLoading, error, isAdmin } = useAnalysisTypes(includeInactive)
  const [groupedTypes, setGroupedTypes] = useState<Record<string, AnalysisType[]>>({})

  useEffect(() => {
    const grouped = analysisTypes.reduce((acc, type) => {
      if (!acc[type.category]) {
        acc[type.category] = []
      }
      acc[type.category].push(type)
      return acc
    }, {} as Record<string, AnalysisType[]>)

    setGroupedTypes(grouped)
  }, [analysisTypes])

  return {
    groupedTypes,
    categories: Object.keys(groupedTypes),
    isLoading,
    error,
    isAdmin,
  }
}
