import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserManagement, UserRole, UserStatus } from '@/types'

// GET /api/admin/users - Récupérer tous les utilisateurs (superadmin uniquement)
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
        { error: 'Accès refusé. Seuls les superadmins peuvent accéder à cette ressource.' },
        { status: 403 }
      )
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || ''
    const statusFilter = searchParams.get('status') || ''

    // Construire la requête avec jointures manuelles
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        status,
        created_at,
        updated_at,
        last_login,
        user_profiles!inner(display_name, preferences),
        images(id),
        analyses(id),
        api_keys(id)
      `)

    // Appliquer les filtres
    if (search) {
      query = query.or(`email.ilike.%${search}%,user_profiles.display_name.ilike.%${search}%`)
    }
    
    if (roleFilter) {
      query = query.eq('role', roleFilter)
    }
    
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    // Appliquer la pagination et l'ordre
    const { data: rawUsers, error: usersError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (usersError) {
      console.error('Erreur récupération utilisateurs:', usersError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      )
    }

    // Transformer les données pour correspondre à UserManagement
    const users: UserManagement[] = rawUsers?.map((user: any) => ({
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
      display_name: user.user_profiles?.display_name || '',
      preferences: (user.user_profiles?.preferences as Record<string, unknown>) || {},
      total_images: user.images?.length || 0,
      total_analyses: user.analyses?.length || 0,
      total_api_keys: user.api_keys?.length || 0,
      last_activity: user.updated_at, // Approximation
      recently_active: user.last_login ? 
        new Date(user.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000) : 
        false
    })) || []

    // Compter le total pour la pagination
    let countQuery = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`email.ilike.%${search}%`)
    }
    if (roleFilter) {
      countQuery = countQuery.eq('role', roleFilter)
    }
    if (statusFilter) {
      countQuery = countQuery.eq('status', statusFilter)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      data: {
        users: users as UserManagement[],
        total: count || 0,
        limit,
        offset,
        filters: {
          search,
          role: roleFilter,
          status: statusFilter
        }
      }
    })

  } catch (error) {
    console.error('Erreur API admin/users:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
