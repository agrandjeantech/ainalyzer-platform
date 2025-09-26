import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnalysisHistoryFilters, AnalysisHistoryItem } from '@/types'

// GET /api/analyses/history - Récupérer l'historique des analyses de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Extraire les paramètres de filtrage
    const filters: AnalysisHistoryFilters = {
      search: searchParams.get('search') || undefined,
      analysis_type: searchParams.get('analysis_type') || undefined,
      category: searchParams.get('category') || undefined,
      provider: searchParams.get('provider') as 'openai' | 'anthropic' || undefined,
      is_favorite: searchParams.get('is_favorite') === 'true' ? true : undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      status: searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'error' || undefined,
    }

    // Gestion des tags (format: tag1,tag2,tag3)
    const tagsParam = searchParams.get('tags')
    if (tagsParam) {
      filters.tags = tagsParam.split(',').filter(tag => tag.trim())
    }

    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 par page
    const offset = (page - 1) * limit

    // Construire la requête de base avec jointures (colonnes existantes seulement)
    let query = supabase
      .from('analyses')
      .select(`
        id,
        user_id,
        created_at,
        status,
        provider,
        duration_ms,
        tokens_used,
        result_json,
        annotations,
        images!inner(
          original_name,
          public_url,
          size_bytes,
          format
        ),
        analysis_types!inner(
          name,
          category
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'completed')

    // Appliquer les filtres
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%,image_name.ilike.%${filters.search}%`)
    }

    if (filters.analysis_type) {
      query = query.eq('analysis_type', filters.analysis_type)
    }

    if (filters.category) {
      query = query.eq('analysis_category', filters.category)
    }

    if (filters.provider) {
      query = query.eq('provider', filters.provider)
    }

    if (filters.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    // Filtrage par tags (PostgreSQL array contains)
    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    // Appliquer la pagination et l'ordre
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: analyses, error, count } = await query

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'historique des analyses' },
        { status: 500 }
      )
    }


    // Transformer les données pour correspondre au type AnalysisHistoryItem
    const transformedAnalyses: AnalysisHistoryItem[] = (analyses || []).map((analysis: Record<string, unknown>) => {
      // Extraire le texte d'aperçu du result_json.content
      let previewText = 'Analyse terminée'
      let tokensUsed = 0
      
      if (analysis.result_json && typeof analysis.result_json === 'object') {
        const resultObj = analysis.result_json as Record<string, unknown>
        
        // Extraire le contenu depuis result_json.content
        if (resultObj.content && typeof resultObj.content === 'string') {
          const fullText = String(resultObj.content)
          previewText = fullText.length > 200 ? fullText.substring(0, 200) + '...' : fullText
        }
        
        // Extraire les tokens depuis result_json.usage.output_tokens
        if (resultObj.usage && typeof resultObj.usage === 'object') {
          const usage = resultObj.usage as Record<string, unknown>
          if (typeof usage.output_tokens === 'number') {
            tokensUsed = usage.output_tokens
          }
        }
      }

      // Compter les annotations depuis result_json.annotations
      let annotationsCount = 0
      if (analysis.result_json && typeof analysis.result_json === 'object') {
        const resultObj = analysis.result_json as Record<string, unknown>
        if (resultObj.annotations && Array.isArray(resultObj.annotations)) {
          annotationsCount = resultObj.annotations.length
        }
      }

      // Générer un titre automatique basé sur les données existantes
      const imageData = analysis.images as Record<string, unknown>
      const analysisTypeData = analysis.analysis_types as Record<string, unknown>
      
      const title = `${analysisTypeData.name} - ${imageData.original_name} (${new Date(analysis.created_at as string).toLocaleDateString('fr-FR')})`

      return {
        id: analysis.id as string,
        user_id: analysis.user_id as string,
        created_at: analysis.created_at as string,
        title: title,
        description: undefined, // Pas encore en base
        summary: previewText,
        is_favorite: false, // Pas encore en base
        tags: [], // Pas encore en base
        status: analysis.status as 'pending' | 'processing' | 'completed' | 'error',
        pdf_generated: false, // Pas encore en base
        annotated_image_url: undefined, // Pas encore en base
        pdf_url: undefined, // Pas encore en base
        // Informations de l'image
        image_name: imageData.original_name as string,
        original_image_url: imageData.public_url as string,
        image_size_bytes: imageData.size_bytes as number,
        image_format: imageData.format as string,
        // Informations du type d'analyse
        analysis_type: analysisTypeData.name as string,
        analysis_category: analysisTypeData.category as string,
        // Métadonnées de performance
        provider: analysis.provider as 'openai' | 'anthropic',
        duration_ms: analysis.duration_ms as number,
        tokens_used: tokensUsed,
        // Aperçu du contenu
        preview_text: previewText,
        annotations_count: annotationsCount
      }
    })

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: transformedAnalyses,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: filters
    })

  } catch (error) {
    console.error('Erreur dans GET /api/analyses/history:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/analyses/history - Mettre à jour les métadonnées d'une analyse (favoris, tags, etc.)
export async function PUT(request: NextRequest) {
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

    const { 
      analysis_id, 
      is_favorite, 
      tags, 
      title, 
      description 
    } = await request.json()

    if (!analysis_id) {
      return NextResponse.json(
        { error: 'ID d\'analyse requis' },
        { status: 400 }
      )
    }

    // Préparer les données à mettre à jour
    const updateData: Record<string, unknown> = {}
    
    if (is_favorite !== undefined) {
      updateData.is_favorite = is_favorite
    }
    
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : []
    }
    
    if (title !== undefined) {
      updateData.title = title
    }
    
    if (description !== undefined) {
      updateData.description = description
    }

    // Mettre à jour l'analyse (seulement si elle appartient à l'utilisateur)
    const { data: updatedAnalysis, error: updateError } = await supabase
      .from('analyses')
      .update(updateData)
      .eq('id', analysis_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur lors de la mise à jour:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'analyse' },
        { status: 500 }
      )
    }

    if (!updatedAnalysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée ou accès refusé' },
        { status: 404 }
      )
    }

    // Enregistrer l'activité
    await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: 'analysis_updated',
        details: {
          analysis_id,
          updated_fields: Object.keys(updateData),
          timestamp: new Date().toISOString()
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Analyse mise à jour avec succès',
      data: updatedAnalysis
    })

  } catch (error) {
    console.error('Erreur dans PUT /api/analyses/history:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
