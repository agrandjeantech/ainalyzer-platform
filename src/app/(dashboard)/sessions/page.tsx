import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SessionInfo } from '@/components/dashboard/SessionInfo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeftIcon,
  ShieldIcon,
  ActivityIcon,
  ClockIcon,
  MapPinIcon
} from 'lucide-react'
import Link from 'next/link'

export default async function SessionsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer l'historique complet des sessions
  const { data: loginHistory } = await supabase
    .from('login_history')
    .select('*')
    .eq('user_id', user.id)
    .order('login_at', { ascending: false })

  // Récupérer les activités récentes
  const { data: recentActivities } = await supabase
    .from('user_activities')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'En cours'
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`
    }
    return `${minutes}min`
  }

  const getDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Inconnu'
    
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Navigateur inconnu'
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
        return '🔓'
      case 'logout':
        return '🔒'
      default:
        return '📝'
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'text-green-600 bg-green-50'
      case 'logout':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Retour au dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestion des sessions</h1>
                <p className="text-gray-600">Surveillez et gérez vos sessions de connexion</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              <ShieldIcon className="h-4 w-4 mr-1" />
              Sécurité
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale - Informations de session */}
          <div className="lg:col-span-2">
            <SessionInfo />
          </div>

          {/* Colonne latérale - Activités récentes */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ActivityIcon className="h-5 w-5" />
                  <span>Activités récentes</span>
                </CardTitle>
                <CardDescription>
                  Journal de vos dernières actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!recentActivities || recentActivities.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    Aucune activité récente
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityColor(activity.action)}`}>
                          {getActivityIcon(activity.action)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium capitalize">
                            {activity.action}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(activity.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Historique complet des sessions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Historique complet des sessions</CardTitle>
              <CardDescription>
                Toutes vos connexions et déconnexions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!loginHistory || loginHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Aucun historique de session disponible
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Date de connexion
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Navigateur
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Adresse IP
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Durée
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginHistory.map((session: any) => (
                        <tr key={session.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">
                                {formatDate(session.login_at)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">
                              {getDeviceInfo(session.user_agent)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <MapPinIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-mono">
                                {session.ip_address || 'Inconnue'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">
                              {formatDuration(session.session_duration)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {session.logout_at ? (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                Terminée
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Active
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
