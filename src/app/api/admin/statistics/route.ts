import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PlatformStatistics } from '@/types'

// GET /api/admin/statistics - Récupérer les statistiques de la plateforme (superadmin uniquement)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est superadmin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Accès refusé. Seuls les superadmins peuvent accéder aux statistiques.' },
        { status: 403 }
      )
    }

    // Calculer les statistiques en parallèle
    const [
      usersStats,
      imagesStats,
      analysesStats,
      apiKeysStats,
      recentActivity
    ] = await Promise.all([
      // Statistiques utilisateurs
      Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'superadmin'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('last_login', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]),
      
      // Statistiques images
      Promise.all([
        supabase.from('images').select('id', { count: 'exact', head: true }),
        supabase.from('images').select('id', { count: 'exact', head: true }).gte('uploaded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]),
      
      // Statistiques analyses
      Promise.all([
        supabase.from('analyses').select('id', { count: 'exact', head: true }),
        supabase.from('analyses').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]),
      
      // Statistiques clés API
      supabase.from('api_keys').select('id', { count: 'exact', head: true }).eq('active', true),
      
      // Activité récente (dernières 24h)
      supabase
        .from('user_activities')
        .select('action, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100)
    ])

    // Calculer les moyennes
    const { data: userImageCounts } = await supabase
      .from('images')
      .select('user_id')
    
    const { data: userAnalysisCounts } = await supabase
      .from('analyses')
      .select('user_id')

    const totalUsers = (usersStats[0].count || 0) + (usersStats[1].count || 0) + (usersStats[2].count || 0)
    
    // Calculer les moyennes par utilisateur
    const userImageMap = new Map<string, number>()
    const userAnalysisMap = new Map<string, number>()
    
    userImageCounts?.forEach(img => {
      userImageMap.set(img.user_id, (userImageMap.get(img.user_id) || 0) + 1)
    })
    
    userAnalysisCounts?.forEach(analysis => {
      userAnalysisMap.set(analysis.user_id, (userAnalysisMap.get(analysis.user_id) || 0) + 1)
    })

    const avgImagesPerUser = totalUsers > 0 ? 
      Array.from(userImageMap.values()).reduce((sum, count) => sum + count, 0) / totalUsers : 0
    
    const avgAnalysesPerUser = totalUsers > 0 ? 
      Array.from(userAnalysisMap.values()).reduce((sum, count) => sum + count, 0) / totalUsers : 0

    // Construire l'objet statistiques
    const statistics: PlatformStatistics = {
      // Statistiques utilisateurs
      total_users: usersStats[0].count || 0,
      total_admins: usersStats[1].count || 0,
      total_superadmins: usersStats[2].count || 0,
      active_users: usersStats[3].count || 0,
      users_last_24h: usersStats[4].count || 0,
      users_last_7d: usersStats[5].count || 0,
      
      // Statistiques d'utilisation
      total_images: imagesStats[0].count || 0,
      total_analyses: analysesStats[0].count || 0,
      total_api_keys: apiKeysStats.count || 0,
      
      // Statistiques temporelles
      images_last_24h: imagesStats[1].count || 0,
      analyses_last_24h: analysesStats[1].count || 0,
      
      // Moyennes
      avg_images_per_user: Math.round(avgImagesPerUser * 100) / 100,
      avg_analyses_per_user: Math.round(avgAnalysesPerUser * 100) / 100
    }

    // Ajouter des métriques supplémentaires
    const additionalMetrics = {
      // Taux d'activité
      activity_rate_24h: totalUsers > 0 ? Math.round((statistics.users_last_24h / totalUsers) * 100) : 0,
      activity_rate_7d: totalUsers > 0 ? Math.round((statistics.users_last_7d / totalUsers) * 100) : 0,
      
      // Répartition des rôles
      role_distribution: {
        users: statistics.total_users,
        admins: statistics.total_admins,
        superadmins: statistics.total_superadmins
      },
      
      // Activité récente par type
      recent_activities: recentActivity.data?.reduce((acc: Record<string, number>, activity) => {
        acc[activity.action] = (acc[activity.action] || 0) + 1
        return acc
      }, {}) || {},
      
      // Métriques de croissance (approximatives)
      growth_metrics: {
        total_users_growth: statistics.total_users,
        images_growth_24h: statistics.images_last_24h,
        analyses_growth_24h: statistics.analyses_last_24h
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        statistics,
        additional_metrics: additionalMetrics,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erreur API admin/statistics:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
