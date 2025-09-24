'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { useAnalysisTypes } from '@/hooks/useAnalysisTypes'
import { Loader2Icon } from 'lucide-react'

interface AnalysisTypesSelectorProps {
  selectedTypes: string[]
  onSelectionChange: (selectedTypes: string[]) => void
}

export function AnalysisTypesSelector({ 
  selectedTypes, 
  onSelectionChange 
}: AnalysisTypesSelectorProps) {
  const { analysisTypes, isLoading, error } = useAnalysisTypes()

  const handleTypeToggle = (typeId: string, checked: boolean) => {
    let newSelection: string[]
    if (checked) {
      newSelection = [...selectedTypes, typeId]
    } else {
      newSelection = selectedTypes.filter(id => id !== typeId)
    }
    onSelectionChange(newSelection)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm text-gray-600">Chargement...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">Erreur: {error}</p>
      </div>
    )
  }

  if (analysisTypes.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-600">Aucun type d'analyse disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {analysisTypes.map((type) => (
        <div
          key={type.id}
          className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Checkbox
            id={type.id}
            checked={selectedTypes.includes(type.id)}
            onCheckedChange={(checked: boolean) => handleTypeToggle(type.id, checked)}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <label 
              htmlFor={type.id}
              className="cursor-pointer block"
            >
              <h4 className="font-medium text-gray-900 text-sm">
                {type.name}
              </h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {type.description}
              </p>
            </label>
          </div>
        </div>
      ))}
      
      {selectedTypes.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">
            {selectedTypes.length} analyse{selectedTypes.length > 1 ? 's' : ''} sélectionnée{selectedTypes.length > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
