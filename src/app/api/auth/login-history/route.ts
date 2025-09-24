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
    const ip_address = request.ip || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown'
    
    const user_agent = request.headers.get('user-agent') || 'unknown'

    // Enregistrer la connexion
    const { error: loginError } = await supabase
      .from('login_history')
      .insert({
        user_id,
        ip_address,
        user_agent,
        login_at: new Date().toISOString(),
      })

    if (loginError) {
      console.error('Erreur lors de l\'enregistrement de la connexion:', loginError)
    }

    // Mettre à jour last_login dans users
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user_id)

    if (updateError) {
      console.error('Erreur lors de la mise à jour de last_login:', updateError)
    }

    // Enregistrer l'activité
    const { error: activityError } = await supabase
      .from('user_activities')
      .insert({
        user_id,
        action: 'login',
        details: {
          ip_address,
          user_agent,
          timestamp: new Date().toISOString(),
        },
        ip_address,
        user_agent,
      })

    if (activityError) {
      console.error('Erreur lors de l\'enregistrement de l\'activité:', activityError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur dans login-history API:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer l'historique des connexions
    const { data: loginHistory, error } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', user.id)
      .order('login_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'historique' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: loginHistory })
  } catch (error) {
    console.error('Erreur dans login-history GET API:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
