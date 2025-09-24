'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeftIcon, 
  UsersIcon, 
  ImageIcon, 
  BrainIcon,
  BarChart3Icon,
  ShieldIcon,
  DatabaseIcon,
  ActivityIcon,
  TrendingUpIcon,
  AlertTriangleIcon
} from 'lucide-react'
import Link from 'next/link'
import { AnalysisTypesManager } from '@/components/admin/AnalysisTypesManager'

interface AdminStats {
  totalUsers: number
  totalImages: number
  totalAnalyses: number
  totalStorageGB: number
  avgImagesPerUser: number
  avgSizePerUserMB: number
  activeUsers24h: number
  recentUploads24h: number
}

interface UserStats {
  id: string
  email: string
  display_name: string
  role: string
  status: string
  created_at: string
  last_login: string
  total_images: number
  total_analyses: number
  total_api_keys: number
  total_storage_mb: number
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Vérifier le rôle admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userData || userData.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser(user)
      setIsAdmin(true)
      await loadAdminData()
      setLoading(false)
    }

    checkAdminAccess()
  }, [router, supabase])

  const loadAdminData = async () => {
    try {
      // Charger les statistiques de base
      const { data: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { data: imagesCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })

      const { data: analysesCount } = await supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })

      // Calculer le stockage total
      const { data: storageData } = await supabase
        .from('images')
        .select('size_bytes')

      const totalStorageBytes = storageData?.reduce((sum, img) => sum + (img.size_bytes || 0), 0) || 0
      const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024)

      setStats({
        totalUsers: usersCount?.length || 0,
        totalImages: imagesCount?.length || 0,
        totalAnalyses: analysesCount?.length || 0,
        totalStorageGB: Math.round(totalStorageGB * 100) / 100,
        avgImagesPerUser: usersCount?.length ? Math.round((imagesCount?.length || 0) / usersCount.length * 10) / 10 : 0,
        avgSizePerUserMB: usersCount?.length ? Math.round(totalStorageBytes / (1024 * 1024) / usersCount.length) : 0,
        activeUsers24h: 0, // À implémenter plus tard
        recentUploads24h: 0 // À implémenter plus tard
      })

      // Charger les données utilisateurs détaillées
      const { data: usersData } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          status,
          created_at,
          last_login,
          user_profiles(display_name)
        `)
        .order('created_at', { ascending: false })

      if (usersData) {
        // Pour chaque utilisateur, compter ses images et analyses
        const enrichedUsers = await Promise.all(
          usersData.map(async (user) => {
            const { count: imagesCount } = await supabase
              .from('images')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)

            const { count: analysesCount } = await supabase
              .from('analyses')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)

            const { count: apiKeysCount } = await supabase
              .from('api_keys')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)

            const { data: userImages } = await supabase
              .from('images')
              .select('size_bytes')
              .eq('user_id', user.id)

            const userStorageBytes = userImages?.reduce((sum, img) => sum + (img.size_bytes || 0), 0) || 0
            const userStorageMB = userStorageBytes / (1024 * 1024)

            return {
              id: user.id,
              email: user.email || '',
              display_name: (user.user_profiles as any)?.display_name || 'Utilisateur',
              role: user.role || 'user',
              status: user.status || 'active',
              created_at: user.created_at || '',
              last_login: user.last_login || '',
              total_images: imagesCount || 0,
              total_analyses: analysesCount || 0,
              total_api_keys: apiKeysCount || 0,
              total_storage_mb: Math.round(userStorageMB * 100) / 100
            }
          })
        )

        setUserStats(enrichedUsers)
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données admin:', error)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 MB'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'user':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800'
      case 'suspended':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p>Vérification des permissions admin...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p>Accès non autorisé</p>
        </div>
      </div>
    )
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
                <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
                <p className="text-gray-600">Gestion de la plateforme Ainalyzer</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-red-50 text-red-700">
              <ShieldIcon className="h-4 w-4 mr-1" />
              Admin
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total des comptes créés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Images</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalImages || 0}</div>
              <p className="text-xs text-muted-foreground">
                Images uploadées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analyses</CardTitle>
              <BrainIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAnalyses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Analyses effectuées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stockage</CardTitle>
              <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStorageGB || 0} GB</div>
              <p className="text-xs text-muted-foreground">
                Espace utilisé
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUpIcon className="h-5 w-5" />
                <span>Moyennes par utilisateur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Images par utilisateur</span>
                <span className="font-medium">{stats?.avgImagesPerUser || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Stockage par utilisateur</span>
                <span className="font-medium">{stats?.avgSizePerUserMB || 0} MB</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3Icon className="h-5 w-5" />
                <span>Top utilisateurs (stockage)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userStats
                  .sort((a, b) => b.total_storage_mb - a.total_storage_mb)
                  .slice(0, 5)
                  .map((user) => (
                    <div key={user.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{user.display_name}</div>
                        <div className="text-sm text-gray-600">{user.total_images} images</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {user.total_storage_mb.toFixed(1)} MB
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Types Management */}
        <AnalysisTypesManager />

        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion des utilisateurs</CardTitle>
            <CardDescription>
              Liste de tous les utilisateurs de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userStats.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium">{user.display_name}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{user.total_images}</span> images
                      </div>
                      <div>
                        <span className="font-medium">{user.total_analyses}</span> analyses
                      </div>
                      <div>
                        <span className="font-medium">{user.total_api_keys}</span> clés API
                      </div>
                      <div>
                        <span className="font-medium">{user.total_storage_mb.toFixed(1)} MB</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Créé: {formatDate(user.created_at)}</div>
                    <div>Dernière connexion: {formatDate(user.last_login)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
