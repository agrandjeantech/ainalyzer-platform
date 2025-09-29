import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PUT - Mettre à jour un type d'analyse (admin seulement)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      active 
    } = await request.json()
    const { id: typeId } = await params

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

    // Vérifier que le type d'analyse existe
    const { data: existingType, error: fetchError } = await supabase
      .from('analysis_types')
      .select('*')
      .eq('id', typeId)
      .single()

    if (fetchError || !existingType) {
      return NextResponse.json(
        { error: 'Type d\'analyse non trouvé' },
        { status: 404 }
      )
    }

    // Préparer les données à mettre à jour
    const updateData: {
      name?: string
      description?: string
      system_prompt?: string
      coordination_prompt?: string | null
      formatting_instructions?: string | null
      annotation_rules?: string | null
      category?: string
      active?: boolean
    } = {}

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (system_prompt !== undefined) updateData.system_prompt = system_prompt
    if (category !== undefined) updateData.category = category
    if (active !== undefined) updateData.active = active

    // Gérer les nouveaux champs optionnels (permettre la suppression avec null)
    if (coordination_prompt !== undefined) {
      updateData.coordination_prompt = coordination_prompt && coordination_prompt.trim() 
        ? coordination_prompt.trim() 
        : null
    }
    if (formatting_instructions !== undefined) {
      updateData.formatting_instructions = formatting_instructions && formatting_instructions.trim() 
        ? formatting_instructions.trim() 
        : null
    }
    if (annotation_rules !== undefined) {
      updateData.annotation_rules = annotation_rules && annotation_rules.trim() 
        ? annotation_rules.trim() 
        : null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      )
    }

    // Vérifier l'unicité du nom si modifié
    if (name && name !== existingType.name) {
      const { data: duplicateType } = await supabase
        .from('analysis_types')
        .select('id')
        .eq('name', name)
        .neq('id', typeId)
        .single()

      if (duplicateType) {
        return NextResponse.json(
          { error: 'Un type d\'analyse avec ce nom existe déjà' },
          { status: 409 }
        )
      }
    }

    // Mettre à jour le type d'analyse
    const { data: updatedType, error: updateError } = await supabase
      .from('analysis_types')
      .update(updateData)
      .eq('id', typeId)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur lors de la mise à jour:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du type d\'analyse' },
        { status: 500 }
      )
    }

    // Enregistrer l'activité avec les nouveaux champs
    await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'analysis_type_updated',
        details: {
          analysis_type_id: typeId,
          name: existingType.name,
          changes: updateData,
          has_coordination_prompt: !!updateData.coordination_prompt,
          has_formatting_instructions: !!updateData.formatting_instructions,
          has_annotation_rules: !!updateData.annotation_rules,
          timestamp: new Date().toISOString(),
        },
      })

    return NextResponse.json({ 
      data: updatedType,
      message: 'Type d\'analyse mis à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur dans PUT /api/analysis-types/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un type d'analyse (admin seulement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: typeId } = await params

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

    // Vérifier que le type d'analyse existe
    const { data: existingType, error: fetchError } = await supabase
      .from('analysis_types')
      .select('*')
      .eq('id', typeId)
      .single()

    if (fetchError || !existingType) {
      return NextResponse.json(
        { error: 'Type d\'analyse non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier s'il y a des analyses utilisant ce type
    const { data: existingAnalyses, error: analysesError } = await supabase
      .from('analyses')
      .select('id')
      .eq('analysis_type_id', typeId)
      .limit(1)

    if (analysesError) {
      console.error('Erreur lors de la vérification des analyses:', analysesError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des dépendances' },
        { status: 500 }
      )
    }

    if (existingAnalyses && existingAnalyses.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer ce type d\'analyse car il est utilisé par des analyses existantes' },
        { status: 409 }
      )
    }

    // Supprimer le type d'analyse
    const { error: deleteError } = await supabase
      .from('analysis_types')
      .delete()
      .eq('id', typeId)

    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError)
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du type d\'analyse' },
        { status: 500 }
      )
    }

    // Enregistrer l'activité
    await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'analysis_type_deleted',
        details: {
          analysis_type_id: typeId,
          name: existingType.name,
          category: existingType.category,
          timestamp: new Date().toISOString(),
        },
      })

    return NextResponse.json({ 
      message: 'Type d\'analyse supprimé avec succès'
    })
  } catch (error) {
    console.error('Erreur dans DELETE /api/analysis-types/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// GET - Récupérer un type d'analyse spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: typeId } = await params

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

    // Récupérer le type d'analyse
    const { data: analysisType, error } = await supabase
      .from('analysis_types')
      .select('*')
      .eq('id', typeId)
      .single()

    if (error || !analysisType) {
      return NextResponse.json(
        { error: 'Type d\'analyse non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier les permissions (admin peut voir tous, utilisateur seulement les actifs)
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'superadmin'

    if (!isAdmin && !analysisType.active) {
      return NextResponse.json(
        { error: 'Type d\'analyse non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      data: analysisType,
      isAdmin
    })
  } catch (error) {
    console.error('Erreur dans GET /api/analysis-types/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
