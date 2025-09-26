import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Ainalyzer - Administration",
  description: "Panel d'administration pour gérer la plateforme Ainalyzer",
}
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TopBar } from '@/components/ui/TopBar'
import { BackButton } from '@/components/ui/BackButton'
import { 
  UsersIcon, 
  ImageIcon, 
  BrainIcon,
  BarChart3Icon,
  ShieldIcon,
  DatabaseIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { AnalysisTypesManager } from '@/components/admin/AnalysisTypesManager'
import { UserManagement } from '@/components/admin/UserManagement'
import { getRoleColor, getRoleLabel, getRoleIcon } from '@/lib/permissions'
import { UserRole } from '@/types'

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

async function getAdminData() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Vérifier le rôle admin/superadmin avec le client admin
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
    redirect('/dashboard')
  }

  // Charger les statistiques de base avec le client admin
  const [
    { count: usersCount },
    { count: imagesCount },
    { count: analysesCount },
    { data: storageData }
  ] = await Promise.all([
    adminClient.from('users').select('*', { count: 'exact', head: true }),
    adminClient.from('images').select('*', { count: 'exact', head: true }),
    adminClient.from('analyses').select('*', { count: 'exact', head: true }),
    adminClient.from('images').select('size_bytes')
  ])

  const totalStorageBytes = storageData?.reduce((sum, img) => sum + (img.size_bytes || 0), 0) || 0
  const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024)

  const stats: AdminStats = {
    totalUsers: usersCount || 0,
    totalImages: imagesCount || 0,
    totalAnalyses: analysesCount || 0,
    totalStorageGB: Math.round(totalStorageGB * 100) / 100,
    avgImagesPerUser: usersCount ? Math.round((imagesCount || 0) / usersCount * 10) / 10 : 0,
    avgSizePerUserMB: usersCount ? Math.round(totalStorageBytes / (1024 * 1024) / usersCount) : 0,
    activeUsers24h: 0, // À implémenter plus tard
    recentUploads24h: 0 // À implémenter plus tard
  }

  // Charger les données utilisateurs détaillées avec le client admin
  const { data: usersData } = await adminClient
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

  let userStats: UserStats[] = []

  if (usersData) {
    // Pour chaque utilisateur, compter ses images et analyses avec le client admin
    const enrichedUsers = await Promise.all(
      usersData.map(async (user) => {
        const [
          { count: imagesCount },
          { count: analysesCount },
          { count: apiKeysCount },
          { data: userImages }
        ] = await Promise.all([
          adminClient.from('images').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          adminClient.from('analyses').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          adminClient.from('api_keys').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          adminClient.from('images').select('size_bytes').eq('user_id', user.id)
        ])

        const userStorageBytes = userImages?.reduce((sum, img) => sum + (img.size_bytes || 0), 0) || 0
        const userStorageMB = userStorageBytes / (1024 * 1024)

        return {
          id: user.id,
          email: user.email || '',
          display_name: (user.user_profiles as { display_name?: string } | null)?.display_name || 'Utilisateur',
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

    userStats = enrichedUsers
  }

  return { stats, userStats, currentUser: userData, currentUserId: user.id }
}

function formatDate(dateString: string) {
  if (!dateString) return 'Jamais'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusColor(status: string) {
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

export default async function AdminPage() {
  const { stats, userStats, currentUser, currentUserId } = await getAdminData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <TopBar />
      
      <BackButton href="/dashboard" label="Retour au dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
            <p className="text-gray-600">
              Gestion de la plateforme Ainalyzer
            </p>
          </div>
          <Badge variant="secondary" className="bg-red-50 text-red-700">
            <ShieldIcon className="h-4 w-4 mr-1" />
            {currentUser.role === 'superadmin' ? 'Super Admin' : 'Admin'}
          </Badge>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
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
              <div className="text-2xl font-bold">{stats.totalImages}</div>
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
              <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
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
              <div className="text-2xl font-bold">{stats.totalStorageGB} GB</div>
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
                <span className="font-medium">{stats.avgImagesPerUser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Stockage par utilisateur</span>
                <span className="font-medium">{stats.avgSizePerUserMB} MB</span>
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
        <UserManagement 
          users={userStats} 
          currentUserId={currentUserId} 
          currentUserRole={currentUser.role} 
        />
      </main>
    </div>
  )
}
