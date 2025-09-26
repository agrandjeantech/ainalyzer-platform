import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserStatus } from '@/types'

// PUT /api/admin/users/[id]/status - Modifier le statut d'un utilisateur (superadmin uniquement)
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
    const { status } = await request.json()

    // Valider le nouveau statut
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide. Utilisez: active, inactive, ou suspended' },
        { status: 400 }
      )
    }

    const { id: targetUserId } = await params

    // Vérifier que l'utilisateur cible existe avec le client admin
    const { data: targetUser, error: targetError } = await adminClient
      .from('users')
      .select('id, role, status, email')
      .eq('id', targetUserId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Empêcher la suspension du dernier superadmin actif
    if (targetUser.role === 'superadmin' && status !== 'active') {
      const { count: activeSuperadminCount } = await adminClient
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'superadmin')
        .eq('status', 'active')

      if (activeSuperadminCount && activeSuperadminCount <= 1) {
        return NextResponse.json(
          { error: 'Impossible de suspendre le dernier superadmin actif' },
          { status: 400 }
        )
      }
    }

    // Mettre à jour le statut avec le client admin
    const { error: statusError } = await adminClient
      .from('users')
      .update({ 
        status: status as UserStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)

    if (statusError) {
      console.error('Erreur changement de statut:', statusError)
      return NextResponse.json(
        { error: statusError.message || 'Erreur lors du changement de statut' },
        { status: 500 }
      )
    }

    // Enregistrer l'activité avec le client admin
    await adminClient
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'status_change',
        details: {
          target_user_id: targetUserId,
          target_user_email: targetUser.email,
          previous_status: targetUser.status,
          new_status: status,
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
      message: `Statut de ${targetUser.email} changé vers ${status}`,
      data: {
        user: updatedUser,
        previous_status: targetUser.status,
        new_status: status
      }
    })

  } catch (error) {
    console.error('Erreur API admin/users/status:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
