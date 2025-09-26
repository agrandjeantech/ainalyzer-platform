import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImageIcon, KeyIcon, BarChart3Icon, LogOutIcon, UserIcon, ShieldIcon, BrainIcon, HistoryIcon } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Ainalyzer - Accueil",
  description: "Tableau de bord principal pour gérer vos analyses d'images avec l'IA",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer le profil utilisateur
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Récupérer les statistiques utilisateur
  const { data: userStats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('id', user.id)
    .single()

  // Vérifier si l'utilisateur est admin ou superadmin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin'
  const isSuperAdmin = userData?.role === 'superadmin'

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Ainalyzer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {profile?.display_name || user.email}
                </span>
              </div>
              <form action={handleSignOut}>
                <Button variant="outline" size="sm">
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue, {profile?.display_name || 'Utilisateur'} !
          </h2>
          <p className="text-gray-600">
            Voici votre tableau de bord pour gérer vos analyses d'images.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Images analysées</CardTitle>
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.total_images || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total des images uploadées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analyses effectuées</CardTitle>
              <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.total_analyses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Analyses complétées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clés API</CardTitle>
              <KeyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.total_api_keys || 0}</div>
              <p className="text-xs text-muted-foreground">
                Clés configurées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className={`grid gap-6 ${isAdmin ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
          <Card>
            <CardHeader>
              <CardTitle>Analyser une image</CardTitle>
              <CardDescription>
                Uploadez une image et analysez son accessibilité avec l'IA
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex-1"></div>
              <Link href="/analyse">
                <Button className="w-full">
                  <BrainIcon className="h-4 w-4 mr-2" />
                  Analyser votre image
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique des analyses</CardTitle>
              <CardDescription>
                Consultez et gérez toutes vos analyses précédentes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex-1"></div>
              <Link href="/historique">
                <Button variant="outline" className="w-full">
                  <HistoryIcon className="h-4 w-4 mr-2" />
                  Voir l'historique
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gérer les clés API</CardTitle>
              <CardDescription>
                Configurez vos clés OpenAI et Anthropic pour les analyses
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex-1"></div>
              <Link href="/api-keys">
                <Button variant="outline" className="w-full">
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Configurer les clés
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestion des sessions</CardTitle>
              <CardDescription>
                Surveillez et gérez vos sessions de connexion
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex-1"></div>
              <Link href="/sessions">
                <Button variant="outline" className="w-full">
                  <ShieldIcon className="h-4 w-4 mr-2" />
                  Voir les sessions
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Card - Only visible for admins and superadmins */}
          {isAdmin && (
            <Card className={`${isSuperAdmin ? 'border-red-600 bg-gradient-to-br from-red-900 to-black' : 'border-gray-800 bg-black'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    {isSuperAdmin ? 'Super Administration' : 'Administration'}
                  </CardTitle>
                  {isSuperAdmin && (
                    <Badge variant="destructive" className="bg-red-600 text-white">
                      SUPERADMIN
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-gray-300">
                  {isSuperAdmin 
                    ? 'Contrôle total de la plateforme et gestion des administrateurs'
                    : 'Gérez la plateforme et surveillez les utilisateurs'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col h-full">
                <div className="flex-1"></div>
                <Link href="/admin">
                  <Button 
                    variant="outline" 
                    className={`w-full ${
                      isSuperAdmin 
                        ? 'border-red-400 text-white bg-transparent hover:bg-red-900/50' 
                        : 'border-gray-300 text-white bg-transparent hover:bg-gray-800'
                    }`}
                  >
                    <ShieldIcon className="h-4 w-4 mr-2" />
                    {isSuperAdmin ? 'Panel Super Admin' : 'Panel Admin'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

      </main>
    </div>
  )
}
