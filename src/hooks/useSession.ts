'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface SessionInfo {
  user: User | null
  isLoading: boolean
  lastLogin: string | null
  sessionDuration: number // en minutes
}

interface LoginHistoryEntry {
  id: string
  user_id: string
  ip_address: string | null
  user_agent: string | null
  login_at: string
  logout_at: string | null
  session_duration: number | null
}

export function useSession() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    user: null,
    isLoading: true,
    lastLogin: null,
    sessionDuration: 0,
  })
  
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Récupérer la session initiale
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        await updateSessionInfo(session.user)
      } else {
        setSessionInfo(prev => ({ ...prev, isLoading: false }))
      }
    }

    getInitialSession()

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await updateSessionInfo(session.user)
        await loadLoginHistory()
      } else if (event === 'SIGNED_OUT') {
        setSessionInfo({
          user: null,
          isLoading: false,
          lastLogin: null,
          sessionDuration: 0,
        })
        setLoginHistory([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const updateSessionInfo = async (user: User) => {
    try {
      // Récupérer les informations utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('last_login')
        .eq('id', user.id)
        .single()

      // Calculer la durée de session
      const sessionStart = new Date(user.created_at || Date.now())
      const now = new Date()
      const sessionDuration = Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60))

      setSessionInfo({
        user,
        isLoading: false,
        lastLogin: userData?.last_login || null,
        sessionDuration,
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour des informations de session:', error)
      setSessionInfo({
        user,
        isLoading: false,
        lastLogin: null,
        sessionDuration: 0,
      })
    }
  }

  const loadLoginHistory = async () => {
    try {
      const response = await fetch('/api/auth/login-history')
      if (response.ok) {
        const { data } = await response.json()
        setLoginHistory(data || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
    }
  }

  const signOut = async () => {
    try {
      // Enregistrer la déconnexion
      if (sessionInfo.user) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: sessionInfo.user.id,
          }),
        })
      }

      // Déconnexion Supabase
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Forcer la déconnexion même en cas d'erreur
      await supabase.auth.signOut()
    }
  }

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Erreur lors du rafraîchissement de la session:', error)
    }
    return { data, error }
  }

  return {
    ...sessionInfo,
    loginHistory,
    signOut,
    refreshSession,
    loadLoginHistory,
  }
}

// Hook pour les statistiques de session
export function useSessionStats() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageSessionDuration: 0,
    lastLoginLocation: null as string | null,
    isLoading: true,
  })

  const supabase = createClient()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Récupérer les statistiques de session
        const { data: loginHistory } = await supabase
          .from('login_history')
          .select('*')
          .eq('user_id', user.id)

        if (loginHistory) {
          const totalSessions = loginHistory.length
          const completedSessions = loginHistory.filter(session => session.session_duration)
          const averageSessionDuration = completedSessions.length > 0
            ? completedSessions.reduce((sum, session) => sum + (session.session_duration || 0), 0) / completedSessions.length
            : 0

          const lastSession = loginHistory[0]
          const lastLoginLocation = lastSession?.ip_address || null

          setStats({
            totalSessions,
            averageSessionDuration: Math.round(averageSessionDuration / 60), // en minutes
            lastLoginLocation,
            isLoading: false,
          })
        }
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
        setStats(prev => ({ ...prev, isLoading: false }))
      }
    }

    loadStats()
  }, [])

  return stats
}
