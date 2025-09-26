import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est superadmin
    const { data: currentUser, error: currentUserError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (currentUserError || !currentUser || currentUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé. Vous n\'avez pas les autorisations nécessaires.' }, { status: 403 })
    }

    const { id: userId } = await params

    // Vérifier que l'utilisateur à supprimer existe
    const { data: targetUser, error: targetUserError } = await adminClient
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Empêcher la suppression de soi-même
    if (userId === user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous supprimer vous-même' }, { status: 400 })
    }

    // Empêcher la suppression d'un autre superadmin
    if (targetUser.role === 'superadmin') {
      return NextResponse.json({ error: 'Impossible de supprimer un autre superadmin' }, { status: 400 })
    }

    // Supprimer toutes les données liées à l'utilisateur dans l'ordre correct
    // (en respectant les contraintes de clés étrangères)
    
    // 1. Supprimer les analyses
    await adminClient
      .from('analyses')
      .delete()
      .eq('user_id', userId)

    // 2. Supprimer les images
    await adminClient
      .from('images')
      .delete()
      .eq('user_id', userId)

    // 3. Supprimer les clés API
    await adminClient
      .from('api_keys')
      .delete()
      .eq('user_id', userId)

    // 4. Supprimer les activités utilisateur
    await adminClient
      .from('user_activities')
      .delete()
      .eq('user_id', userId)

    // 5. Supprimer l'historique de connexion
    await adminClient
      .from('login_history')
      .delete()
      .eq('user_id', userId)

    // 6. Supprimer le profil utilisateur
    await adminClient
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    // 7. Supprimer l'utilisateur de la table users
    const { error: deleteUserError } = await adminClient
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteUserError) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', deleteUserError)
      return NextResponse.json({ error: 'Erreur lors de la suppression de l\'utilisateur' }, { status: 500 })
    }

    // 8. Supprimer l'utilisateur de l'authentification Supabase
    // Note: Ceci nécessite le service role et peut échouer silencieusement
    try {
      await adminClient.auth.admin.deleteUser(userId)
    } catch (authDeleteError) {
      console.warn('Impossible de supprimer l\'utilisateur de l\'auth Supabase:', authDeleteError)
      // On continue même si cette étape échoue
    }

    // Enregistrer l'action dans les logs d'activité
    await adminClient
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'delete_user',
        details: {
          deleted_user_id: userId,
          deleted_user_email: targetUser.email,
          deleted_user_role: targetUser.role
        }
      })

    return NextResponse.json({ 
      message: 'Utilisateur supprimé avec succès',
      deleted_user: {
        id: userId,
        email: targetUser.email,
        role: targetUser.role
      }
    })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
