'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ApiKey {
  id: string
  provider: 'openai' | 'anthropic'
  name: string
  created_at: string
  last_used: string | null
  active: boolean
}

interface ApiKeyFormData {
  provider: 'openai' | 'anthropic'
  name: string
  apiKey: string
}

interface TestResult {
  valid: boolean
  error: string | null
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Charger les clés API
  const loadApiKeys = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/api-keys')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du chargement des clés API')
      }

      setApiKeys(result.data || [])
    } catch (err) {
      console.error('Erreur lors du chargement des clés API:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  // Ajouter une nouvelle clé API
  const addApiKey = async (formData: ApiKeyFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Erreur lors de l\'ajout de la clé' }
      }

      // Recharger les clés après ajout
      await loadApiKeys()
      return { success: true }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la clé API:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur inconnue' 
      }
    }
  }

  // Mettre à jour une clé API
  const updateApiKey = async (
    id: string, 
    updates: { name?: string; active?: boolean }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
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
      setApiKeys(prev => prev.map(key => 
        key.id === id ? { ...key, ...updates } : key
      ))

      return { success: true }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la clé API:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur inconnue' 
      }
    }
  }

  // Supprimer une clé API
  const deleteApiKey = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Erreur lors de la suppression' }
      }

      // Supprimer localement
      setApiKeys(prev => prev.filter(key => key.id !== id))
      return { success: true }
    } catch (err) {
      console.error('Erreur lors de la suppression de la clé API:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur inconnue' 
      }
    }
  }

  // Tester une clé API
  const testApiKey = async (id: string): Promise<{ success: boolean; result?: TestResult; error?: string }> => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Erreur lors du test' }
      }

      // Mettre à jour last_used si le test est réussi
      if (result.data.valid) {
        setApiKeys(prev => prev.map(key => 
          key.id === id ? { ...key, last_used: new Date().toISOString() } : key
        ))
      }

      return { success: true, result: result.data }
    } catch (err) {
      console.error('Erreur lors du test de la clé API:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erreur inconnue' 
      }
    }
  }

  // Charger les clés au montage du composant
  useEffect(() => {
    loadApiKeys()
  }, [])

  // Écouter les changements d'authentification
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setApiKeys([])
        setError(null)
      } else if (event === 'SIGNED_IN') {
        loadApiKeys()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    apiKeys,
    isLoading,
    error,
    addApiKey,
    updateApiKey,
    deleteApiKey,
    testApiKey,
    refreshApiKeys: loadApiKeys,
  }
}

// Hook pour les statistiques des clés API
export function useApiKeyStats() {
  const [stats, setStats] = useState({
    totalKeys: 0,
    activeKeys: 0,
    openaiKeys: 0,
    anthropicKeys: 0,
    recentlyUsed: 0,
    isLoading: true,
  })

  const { apiKeys, isLoading } = useApiKeys()

  useEffect(() => {
    if (!isLoading) {
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const totalKeys = apiKeys.length
      const activeKeys = apiKeys.filter(key => key.active).length
      const openaiKeys = apiKeys.filter(key => key.provider === 'openai').length
      const anthropicKeys = apiKeys.filter(key => key.provider === 'anthropic').length
      const recentlyUsed = apiKeys.filter(key => 
        key.last_used && new Date(key.last_used) > oneWeekAgo
      ).length

      setStats({
        totalKeys,
        activeKeys,
        openaiKeys,
        anthropicKeys,
        recentlyUsed,
        isLoading: false,
      })
    }
  }, [apiKeys, isLoading])

  return stats
}
