'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AnalysisTypesViewer } from '@/components/dashboard/AnalysisTypesViewer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftIcon, BrainIcon } from 'lucide-react'
import Link from 'next/link'

export default function AnalysesPage() {
  const [user, setUser] = useState<any>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const handleSelectionChange = (newSelection: string[]) => {
    setSelectedTypes(newSelection)
    console.log('Types sélectionnés:', newSelection)
  }

  if (!user) {
    return <div>Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Retour au dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Types d'analyses</h1>
                <p className="text-gray-600">Sélectionnez les analyses d'accessibilité à effectuer</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              <BrainIcon className="h-4 w-4 mr-1" />
              Analyses
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AnalysisTypesViewer 
          showAdminLink={true}
          onSelectionChange={handleSelectionChange}
          selectedTypes={selectedTypes}
        />
        
        {/* Actions */}
        {selectedTypes.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button size="lg" className="px-8">
              Analyser avec {selectedTypes.length} type{selectedTypes.length > 1 ? 's' : ''} sélectionné{selectedTypes.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
