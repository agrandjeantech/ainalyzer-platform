'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  BrainIcon,
  InfoIcon,
  Loader2Icon,
  SettingsIcon,
} from 'lucide-react'
import { useAnalysisTypes } from '@/hooks/useAnalysisTypes'
import { useState } from 'react'

interface AnalysisTypesViewerProps {
  className?: string
  onSelectionChange?: (selectedTypes: string[]) => void
  selectedTypes?: string[]
  showAdminLink?: boolean
}

export function AnalysisTypesViewer({ 
  className, 
  onSelectionChange, 
  selectedTypes = [],
  showAdminLink = false 
}: AnalysisTypesViewerProps) {
  const { analysisTypes, isLoading, error, isAdmin } = useAnalysisTypes()

  const handleTypeToggle = (typeId: string, checked: boolean) => {
    if (!onSelectionChange) return

    let newSelection: string[]
    if (checked) {
      newSelection = [...selectedTypes, typeId]
    } else {
      newSelection = selectedTypes.filter(id => id !== typeId)
    }
    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    if (!onSelectionChange) return
    
    if (selectedTypes.length === analysisTypes.length) {
      // Tout désélectionner
      onSelectionChange([])
    } else {
      // Tout sélectionner
      onSelectionChange(analysisTypes.map(type => type.id))
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des types d'analyses...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BrainIcon className="h-5 w-5" />
                <span>Types d'analyses disponibles</span>
              </CardTitle>
              <CardDescription>
                Sélectionnez les analyses à effectuer sur votre image
              </CardDescription>
            </div>
            {showAdminLink && isAdmin && (
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configuration admin
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Types d'analyses */}
      {analysisTypes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BrainIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun type d'analyse disponible
              </h3>
              <p className="text-gray-600">
                Les types d'analyses seront bientôt disponibles.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Sélectionner les analyses ({selectedTypes.length}/{analysisTypes.length})
              </CardTitle>
              {onSelectionChange && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedTypes.length === analysisTypes.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    id={type.id}
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={(checked: boolean) => handleTypeToggle(type.id, checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={type.id}
                      className="cursor-pointer"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">
                        {type.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {type.description}
                      </p>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information sur l'accessibilité */}
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>À propos des analyses d'accessibilité :</strong> Ces analyses sont spécialement conçues 
              pour évaluer l'accessibilité des interfaces utilisateur et identifier les problèmes potentiels.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
