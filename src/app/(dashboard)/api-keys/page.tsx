import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiKeysManager } from '@/components/dashboard/ApiKeysManager'
import { TopBar } from '@/components/ui/TopBar'
import { BackButton } from '@/components/ui/BackButton'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Ainalyzer - Gestion des clés API",
  description: "Configurez vos clés OpenAI et Anthropic pour les analyses",
}

export default async function ApiKeysPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <TopBar />
      
      <BackButton href="/dashboard" label="Retour au dashboard" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des clés API</h1>
          <p className="text-gray-600">
            Configurez vos clés OpenAI et Anthropic pour les analyses
          </p>
        </div>
        <ApiKeysManager />
      </main>
    </div>
  )
}
