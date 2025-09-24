'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  BrainIcon, 
  Loader2Icon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  ClockIcon,
  DollarSignIcon
} from 'lucide-react'

interface RealAnalysisButtonProps {
  imageId: string
  analysisTypeId: string
  provider: 'openai' | 'anthropic'
  onAnalysisComplete: (result: any) => void
  disabled?: boolean
}

export function RealAnalysisButton({ 
  imageId, 
  analysisTypeId, 
  provider, 
  onAnalysisComplete,
  disabled = false 
}: RealAnalysisButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          analysisTypeId,
          provider
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse')
      }

      if (!data.success) {
        throw new Error(data.error || 'Analyse échouée')
      }

      setResult(data.data)
      onAnalysisComplete(data.data)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      console.error('Erreur analyse:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getProviderInfo = () => {
    switch (provider) {
      case 'openai':
        return {
          name: 'GPT-4 Vision',
          color: 'bg-green-100 text-green-800',
          icon: '🤖'
        }
      case 'anthropic':
        return {
          name: 'Claude 3 Sonnet',
          color: 'bg-purple-100 text-purple-800',
          icon: '🧠'
        }
      default:
        return {
          name: provider,
          color: 'bg-gray-100 text-gray-800',
          icon: '🔍'
        }
    }
  }

  const providerInfo = getProviderInfo()

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">Analyse terminée</span>
          <Badge className={providerInfo.color}>
            {providerInfo.icon} {providerInfo.name}
          </Badge>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-green-600" />
              <span>Durée: {result.duration}ms</span>
            </div>
            {result.result?.usage && (
              <div className="flex items-center space-x-2">
                <DollarSignIcon className="h-4 w-4 text-green-600" />
                <span>Tokens: {result.result.usage.total_tokens}</span>
              </div>
            )}
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-green-700 font-medium">Résultat:</p>
            <div className="mt-1 text-sm text-green-800 bg-white rounded p-2 max-h-32 overflow-y-auto">
              {result.result?.content || 'Analyse terminée avec succès'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAnalyze}
          disabled={disabled}
        >
          <BrainIcon className="h-4 w-4 mr-2" />
          Réessayer l'analyse
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Analyse IA</span>
          <Badge className={providerInfo.color}>
            {providerInfo.icon} {providerInfo.name}
          </Badge>
        </div>
      </div>

      <Button 
        onClick={handleAnalyze}
        disabled={disabled || isAnalyzing}
        className="w-full"
        size="sm"
      >
        {isAnalyzing ? (
          <>
            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <BrainIcon className="h-4 w-4 mr-2" />
            Analyser avec {providerInfo.name}
          </>
        )}
      </Button>

      {isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Loader2Icon className="h-4 w-4 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-700">
              Envoi de l'image à {providerInfo.name}...
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Cette opération peut prendre quelques secondes et consommera des tokens de votre clé API.
          </p>
        </div>
      )}
    </div>
  )
}
