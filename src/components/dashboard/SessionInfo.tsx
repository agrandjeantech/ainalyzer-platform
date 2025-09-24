'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ClockIcon, 
  MapPinIcon, 
  MonitorIcon, 
  RefreshCwIcon,
  HistoryIcon,
  ShieldCheckIcon
} from 'lucide-react'
import { useSession, useSessionStats } from '@/hooks/useSession'

interface SessionInfoProps {
  className?: string
}

export function SessionInfo({ className }: SessionInfoProps) {
  const { user, lastLogin, sessionDuration, signOut, refreshSession, loginHistory } = useSession()
  const stats = useSessionStats()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleRefreshSession = async () => {
    setIsRefreshing(true)
    try {
      await refreshSession()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Inconnu'
    
    // Détection basique du navigateur et OS
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Navigateur inconnu'
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Aucune session active
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Session actuelle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                <span>Session active</span>
              </CardTitle>
              <CardDescription>
                Informations sur votre session actuelle
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              Connecté
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Durée de session</div>
                <div className="text-sm text-gray-600">
                  {formatDuration(sessionDuration)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <HistoryIcon className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium">Dernière connexion</div>
                <div className="text-sm text-gray-600">
                  {formatDate(lastLogin)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSession}
              disabled={isRefreshing}
            >
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser la session
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={signOut}
            >
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques de session */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques de session</CardTitle>
          <CardDescription>
            Aperçu de votre activité de connexion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.isLoading ? (
            <div className="text-center text-gray-500">Chargement...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalSessions}
                </div>
                <div className="text-sm text-gray-600">Sessions totales</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.averageSessionDuration}min
                </div>
                <div className="text-sm text-gray-600">Durée moyenne</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium text-purple-600">
                  {stats.lastLoginLocation || 'Inconnu'}
                </div>
                <div className="text-sm text-gray-600">Dernière IP</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique récent */}
      <Card>
        <CardHeader>
          <CardTitle>Historique récent</CardTitle>
          <CardDescription>
            Vos dernières connexions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              Aucun historique disponible
            </div>
          ) : (
            <div className="space-y-3">
              {loginHistory.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <MonitorIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">
                        {formatDate(session.login_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getDeviceInfo(session.user_agent)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {session.ip_address || 'IP inconnue'}
                      </span>
                    </div>
                    {session.session_duration && (
                      <div className="text-xs text-gray-500 mt-1">
                        Durée: {Math.round(session.session_duration / 60)}min
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
