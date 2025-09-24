import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { user_id } = await request.json()

    // Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== user_id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les informations de la requête
    const ip_address = request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown'
    
    const user_agent = request.headers.get('user-agent') || 'unknown'

    // Trouver la dernière session active (sans logout_at)
    const { data: lastSession } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', user_id)
      .is('logout_at', null)
      .order('login_at', { ascending: false })
      .limit(1)
      .single()

    if (lastSession) {
      // Calculer la durée de session en secondes
      const loginTime = new Date(lastSession.login_at)
      const logoutTime = new Date()
      const sessionDuration = Math.floor((logoutTime.getTime() - loginTime.getTime()) / 1000)

      // Mettre à jour la session avec logout_at et session_duration
      const { error: updateError } = await supabase
        .from('login_history')
        .update({
          logout_at: logoutTime.toISOString(),
          session_duration: sessionDuration,
        })
        .eq('id', lastSession.id)

      if (updateError) {
        console.error('Erreur lors de la mise à jour de la session:', updateError)
      }
    }

    // Enregistrer l'activité de déconnexion
    const { error: activityError } = await supabase
      .from('user_activities')
      .insert({
        user_id,
        action: 'logout',
        details: {
          ip_address,
          user_agent,
          timestamp: new Date().toISOString(),
          session_duration: lastSession ? 
            Math.floor((new Date().getTime() - new Date(lastSession.login_at).getTime()) / 1000) : 
            null,
        },
        ip_address,
        user_agent,
      })

    if (activityError) {
      console.error('Erreur lors de l\'enregistrement de l\'activité de déconnexion:', activityError)
    }

    return NextResponse.json({ 
      success: true,
      sessionDuration: lastSession ? 
        Math.floor((new Date().getTime() - new Date(lastSession.login_at).getTime()) / 1000) : 
        null
    })
  } catch (error) {
    console.error('Erreur dans logout API:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
