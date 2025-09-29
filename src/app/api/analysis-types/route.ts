import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Récupérer les types d'analyses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

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

    // Construire la requête selon les permissions
    let query = supabase
      .from('analysis_types')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    // Si l'utilisateur n'est pas admin, ne montrer que les types actifs
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superadmin'

    if (!isAdmin || !includeInactive) {
      query = query.eq('active', true)
    }

    const { data: analysisTypes, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des types d\'analyses:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des types d\'analyses' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      data: analysisTypes,
      isAdmin 
    })
  } catch (error) {
    console.error('Erreur dans GET /api/analysis-types:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau type d'analyse (admin seulement)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { 
      name, 
      description, 
      system_prompt, 
      coordination_prompt,
      formatting_instructions,
      annotation_rules,
      category,
      active = true
    } = await request.json()

    // Vérifier que l'utilisateur est authentifié et admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Vérifier le rôle admin ou superadmin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'superadmin')) {
      return NextResponse.json(
        { error: 'Accès refusé - Droits administrateur requis' },
        { status: 403 }
      )
    }

    // Validation des données (seuls les champs essentiels sont requis)
    if (!name || !description || !system_prompt || !category) {
      return NextResponse.json(
        { error: 'Les champs nom, description, prompt système et catégorie sont requis' },
        { status: 400 }
      )
    }

    // Vérifier que le nom n'existe pas déjà
    const { data: existingType } = await supabase
      .from('analysis_types')
      .select('id')
      .eq('name', name)
      .single()

    if (existingType) {
      return NextResponse.json(
        { error: 'Un type d\'analyse avec ce nom existe déjà' },
        { status: 409 }
      )
    }

    // Préparer les données à insérer
    const insertData: {
      name: string
      description: string
      system_prompt: string
      category: string
      active: boolean
      coordination_prompt?: string
      formatting_instructions?: string
      annotation_rules?: string
    } = {
      name,
      description,
      system_prompt,
      category,
      active,
    }

    // Ajouter les nouveaux champs optionnels s'ils sont fournis
    if (coordination_prompt && coordination_prompt.trim()) {
      insertData.coordination_prompt = coordination_prompt.trim()
    }
    if (formatting_instructions && formatting_instructions.trim()) {
      insertData.formatting_instructions = formatting_instructions.trim()
    }
    if (annotation_rules && annotation_rules.trim()) {
      insertData.annotation_rules = annotation_rules.trim()
    }

    // Créer le nouveau type d'analyse
    const { data: newAnalysisType, error: insertError } = await supabase
      .from('analysis_types')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Erreur lors de la création:', insertError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du type d\'analyse' },
        { status: 500 }
      )
    }

    // Enregistrer l'activité
    await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'analysis_type_created',
        details: {
          analysis_type_id: newAnalysisType.id,
          name,
          category,
          has_coordination_prompt: !!coordination_prompt,
          has_formatting_instructions: !!formatting_instructions,
          has_annotation_rules: !!annotation_rules,
          timestamp: new Date().toISOString(),
        },
      })

    return NextResponse.json({ 
      data: newAnalysisType,
      message: 'Type d\'analyse créé avec succès'
    })
  } catch (error) {
    console.error('Erreur dans POST /api/analysis-types:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
