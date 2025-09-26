import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserRole } from '@/types'

// PUT /api/admin/users/[id]/role - Modifier le rôle d'un utilisateur (superadmin uniquement)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est superadmin avec le client admin
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Accès refusé. Vous n\'avez pas les autorisations nécessaires.' },
        { status: 403 }
      )
    }

    // Récupérer les données de la requête
    const { role } = await request.json()

    // Valider le nouveau rôle
    if (!role || !['user', 'admin', 'superadmin'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide. Utilisez: user, admin, ou superadmin' },
        { status: 400 }
      )
    }

    const { id: targetUserId } = await params

    // Vérifier que l'utilisateur cible existe avec le client admin
    const { data: targetUser, error: targetError } = await adminClient
      .from('users')
      .select('id, role, email')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Empêcher la rétrogradation du dernier superadmin
    if (targetUser.role === 'superadmin' && role !== 'superadmin') {
      const { count: superadminCount } = await adminClient
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'superadmin')
        .eq('status', 'active')

      if (superadminCount && superadminCount <= 1) {
        return NextResponse.json(
          { error: 'Impossible de rétrograder le dernier superadmin actif' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour le rôle avec le client admin
    const { error: roleError } = await adminClient
      .from('users')
      .update({ 
        role: role as UserRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)

    if (roleError) {
      console.error('Erreur changement de rôle:', roleError)
      return NextResponse.json(
        { error: roleError.message || 'Erreur lors du changement de rôle' },
        { status: 500 }
      )
    }

    // Enregistrer l'activité avec le client admin
    await adminClient
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'role_change',
        details: {
          target_user_id: targetUserId,
          target_user_email: targetUser.email,
          previous_role: targetUser.role,
          new_role: role,
          timestamp: new Date().toISOString()
        }
      })

    // Récupérer les données mises à jour avec le client admin
    const { data: updatedUser, error: fetchError } = await adminClient
      .from('users')
      .select('id, email, role, status, updated_at')
      .eq('id', targetUserId)
      .single()

    if (fetchError) {
      console.error('Erreur récupération utilisateur mis à jour:', fetchError)
    }

    return NextResponse.json({
      success: true,
      message: `Rôle de ${targetUser.email} changé vers ${role}`,
      data: {
        user: updatedUser,
        previous_role: targetUser.role,
        new_role: role
      }
    })

  } catch (error) {
    console.error('Erreur API admin/users/role:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
