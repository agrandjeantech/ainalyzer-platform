import { NextRequest, NextResponse } from 'next/server'

// Version de test simplifiée pour diagnostiquer le problème 405
export async function POST(request: NextRequest) {
  try {
    console.log('Route POST /api/images/upload appelée')
    
    return NextResponse.json({
      success: true,
      message: 'Route API fonctionnelle - test réussi',
      timestamp: new Date().toISOString(),
      method: 'POST'
    })

  } catch (error) {
    console.error('Erreur dans route upload:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Route GET /api/images/upload appelée')
    
    return NextResponse.json({
      success: true,
      message: 'Route API fonctionnelle - GET test réussi',
      timestamp: new Date().toISOString(),
      method: 'GET'
    })

  } catch (error) {
    console.error('Erreur dans route upload GET:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
