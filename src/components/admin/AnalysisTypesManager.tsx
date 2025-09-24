'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  BrainIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XIcon,
  SaveIcon,
  SettingsIcon,
  CodeIcon,
  TargetIcon
} from 'lucide-react'

interface AnalysisType {
  id: string
  name: string
  description: string
  system_prompt: string
  coordination_prompt?: string
  formatting_instructions?: string
  annotation_rules?: string
  category: string
  active: boolean
  created_at: string
}

interface AnalysisTypesManagerProps {
  className?: string
}

export function AnalysisTypesManager({ className }: AnalysisTypesManagerProps) {
  const [analysisTypes, setAnalysisTypes] = useState<AnalysisType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // États pour les modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<AnalysisType | null>(null)
  
  // États pour les formulaires
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    coordination_prompt: '',
    formatting_instructions: '',
    annotation_rules: '',
    category: '',
    active: true
  })
  const [formLoading, setFormLoading] = useState(false)

  // Charger les types d'analyses
  const loadAnalysisTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analysis-types?includeInactive=true')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }
      
      setAnalysisTypes(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalysisTypes()
  }, [])

  // Réinitialiser les messages après 5 secondes
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // Gérer la soumission du formulaire de création
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    
    try {
      const response = await fetch('/api/analysis-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }
      
      setSuccess('Type d\'analyse créé avec succès')
      setIsCreateModalOpen(false)
      resetForm()
      await loadAnalysisTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setFormLoading(false)
    }
  }

  // Gérer la soumission du formulaire de modification
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType) return
    
    setFormLoading(true)
    
    try {
      const response = await fetch(`/api/analysis-types/${selectedType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification')
      }
      
      setSuccess('Type d\'analyse modifié avec succès')
      setIsEditModalOpen(false)
      setSelectedType(null)
      resetForm()
      await loadAnalysisTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setFormLoading(false)
    }
  }

  // Gérer la suppression
  const handleDelete = async () => {
    if (!selectedType) return
    
    setFormLoading(true)
    
    try {
      const response = await fetch(`/api/analysis-types/${selectedType.id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }
      
      setSuccess('Type d\'analyse supprimé avec succès')
      setIsDeleteModalOpen(false)
      setSelectedType(null)
      await loadAnalysisTypes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setFormLoading(false)
    }
  }

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      system_prompt: '',
      coordination_prompt: '',
      formatting_instructions: '',
      annotation_rules: '',
      category: '',
      active: true
    })
  }

  // Ouvrir la modale de modification
  const openEditModal = (type: AnalysisType) => {
    setSelectedType(type)
    setFormData({
      name: type.name,
      description: type.description,
      system_prompt: type.system_prompt,
      coordination_prompt: type.coordination_prompt || '',
      formatting_instructions: type.formatting_instructions || '',
      annotation_rules: type.annotation_rules || '',
      category: type.category,
      active: type.active
    })
    setIsEditModalOpen(true)
  }

  // Ouvrir la modale de suppression
  const openDeleteModal = (type: AnalysisType) => {
    setSelectedType(type)
    setIsDeleteModalOpen(true)
  }

  // Obtenir la couleur du badge selon la catégorie
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'accessibilité': 'bg-blue-100 text-blue-800',
      'design': 'bg-green-100 text-green-800',
      'technique': 'bg-purple-100 text-purple-800',
      'contenu': 'bg-orange-100 text-orange-800',
      'performance': 'bg-red-100 text-red-800',
    }
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <BrainIcon className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-600">Chargement des types d'analyses...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Messages d'état */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BrainIcon className="h-5 w-5" />
                <span>Gestion des Types d'Analyses</span>
              </CardTitle>
              <CardDescription>
                Gérez les types d'analyses disponibles pour les utilisateurs
              </CardDescription>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nouveau type
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau type d'analyse</DialogTitle>
                  <DialogDescription>
                    Configurez un nouveau type d'analyse avec ses prompts spécialisés
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreate} className="space-y-4 overflow-y-auto max-h-[70vh]">
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="general" className="flex items-center space-x-2">
                        <SettingsIcon className="h-4 w-4" />
                        <span>Général</span>
                      </TabsTrigger>
                      <TabsTrigger value="business" className="flex items-center space-x-2">
                        <BrainIcon className="h-4 w-4" />
                        <span>Prompt Métier</span>
                      </TabsTrigger>
                      <TabsTrigger value="coordination" className="flex items-center space-x-2">
                        <TargetIcon className="h-4 w-4" />
                        <span>Coordination</span>
                      </TabsTrigger>
                      <TabsTrigger value="formatting" className="flex items-center space-x-2">
                        <CodeIcon className="h-4 w-4" />
                        <span>Formatage</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nom</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Analyse d'accessibilité"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Catégorie</Label>
                          <Input
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Ex: Accessibilité"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Description courte du type d'analyse"
                          required
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="active"
                          checked={formData.active}
                          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                        />
                        <Label htmlFor="active">Type d'analyse actif</Label>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="business" className="space-y-4">
                      <div>
                        <Label htmlFor="system_prompt">Prompt Métier</Label>
                        <p className="text-sm text-gray-600 mb-2">
                          Instructions principales pour l'analyse (ex: "Analysez l'accessibilité selon WCAG 2.1...")
                        </p>
                        <textarea
                          id="system_prompt"
                          value={formData.system_prompt}
                          onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                          placeholder="Prompt système détaillé pour l'IA..."
                          required
                          className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md resize-y"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="coordination" className="space-y-4">
                      <div>
                        <Label htmlFor="coordination_prompt">Instructions de Coordination</Label>
                        <p className="text-sm text-gray-600 mb-2">
                          Instructions spécifiques pour la précision des coordonnées (ex: "Délimitez précisément chaque élément...")
                        </p>
                        <textarea
                          id="coordination_prompt"
                          value={formData.coordination_prompt}
                          onChange={(e) => setFormData({ ...formData, coordination_prompt: e.target.value })}
                          placeholder="Instructions pour la précision des zones d'annotation..."
                          className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-y"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="annotation_rules">Règles d'Annotation</Label>
                        <p className="text-sm text-gray-600 mb-2">
                          Règles spécifiques pour les coordonnées (ex: "x,y = coin exact de l'élément...")
                        </p>
                        <textarea
                          id="annotation_rules"
                          value={formData.annotation_rules}
                          onChange={(e) => setFormData({ ...formData, annotation_rules: e.target.value })}
                          placeholder="Règles spécifiques pour les annotations..."
                          className="w-full min-h-[150px] p-3 border border-gray-300 rounded-md resize-y"
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="formatting" className="space-y-4">
                      <div>
                        <Label htmlFor="formatting_instructions">Instructions de Formatage</Label>
                        <p className="text-sm text-gray-600 mb-2">
                          Format de structuration des annotations (ex: "Rôle et fonction : [desc] | Position : [pos]...")
                        </p>
                        <textarea
                          id="formatting_instructions"
                          value={formData.formatting_instructions}
                          onChange={(e) => setFormData({ ...formData, formatting_instructions: e.target.value })}
                          placeholder="Format de structuration des annotations..."
                          className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-y"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      disabled={formLoading}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={formLoading}>
                      {formLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Création...
                        </>
                      ) : (
                        <>
                          <SaveIcon className="h-4 w-4 mr-2" />
                          Créer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {analysisTypes.length === 0 ? (
              <div className="text-center py-8">
                <BrainIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun type d'analyse configuré</p>
                <p className="text-sm text-gray-500">Créez votre premier type d'analyse</p>
              </div>
            ) : (
              analysisTypes.map((type) => (
                <div key={type.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{type.name}</h4>
                      <Badge className={getCategoryColor(type.category)}>
                        {type.category}
                      </Badge>
                      <Badge variant={type.active ? "default" : "secondary"}>
                        {type.active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                    <div className="text-xs text-gray-500">
                      <p className="mb-1">
                        <strong>Prompt système:</strong> {type.system_prompt.substring(0, 100)}...
                      </p>
                      <p>Créé le {new Date(type.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(type)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(type)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modale de modification */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Modifier le type d'analyse</DialogTitle>
            <DialogDescription>
              Modifiez tous les paramètres du type d'analyse avec ses prompts spécialisés
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4 overflow-y-auto max-h-[70vh]">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general" className="flex items-center space-x-2">
                  <SettingsIcon className="h-4 w-4" />
                  <span>Général</span>
                </TabsTrigger>
                <TabsTrigger value="business" className="flex items-center space-x-2">
                  <BrainIcon className="h-4 w-4" />
                  <span>Prompt Métier</span>
                </TabsTrigger>
                <TabsTrigger value="coordination" className="flex items-center space-x-2">
                  <TargetIcon className="h-4 w-4" />
                  <span>Coordination</span>
                </TabsTrigger>
                <TabsTrigger value="formatting" className="flex items-center space-x-2">
                  <CodeIcon className="h-4 w-4" />
                  <span>Formatage</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nom</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-category">Catégorie</Label>
                    <Input
                      id="edit-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="edit-active">Type d'analyse actif</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="business" className="space-y-4">
                <div>
                  <Label htmlFor="edit-system_prompt">Prompt Métier</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Instructions principales pour l'analyse (ex: "Analysez l'accessibilité selon WCAG 2.1...")
                  </p>
                  <textarea
                    id="edit-system_prompt"
                    value={formData.system_prompt}
                    onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                    required
                    className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md resize-y"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="coordination" className="space-y-4">
                <div>
                  <Label htmlFor="edit-coordination_prompt">Instructions de Coordination</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Instructions spécifiques pour la précision des coordonnées (ex: "Délimitez précisément chaque élément...")
                  </p>
                  <textarea
                    id="edit-coordination_prompt"
                    value={formData.coordination_prompt}
                    onChange={(e) => setFormData({ ...formData, coordination_prompt: e.target.value })}
                    placeholder="Instructions pour la précision des zones d'annotation..."
                    className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-y"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-annotation_rules">Règles d'Annotation</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Règles spécifiques pour les coordonnées (ex: "x,y = coin exact de l'élément...")
                  </p>
                  <textarea
                    id="edit-annotation_rules"
                    value={formData.annotation_rules}
                    onChange={(e) => setFormData({ ...formData, annotation_rules: e.target.value })}
                    placeholder="Règles spécifiques pour les annotations..."
                    className="w-full min-h-[150px] p-3 border border-gray-300 rounded-md resize-y"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="formatting" className="space-y-4">
                <div>
                  <Label htmlFor="edit-formatting_instructions">Instructions de Formatage</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Format de structuration des annotations (ex: "Rôle et fonction : [desc] | Position : [pos]...")
                  </p>
                  <textarea
                    id="edit-formatting_instructions"
                    value={formData.formatting_instructions}
                    onChange={(e) => setFormData({ ...formData, formatting_instructions: e.target.value })}
                    placeholder="Format de structuration des annotations..."
                    className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-y"
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={formLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Modification...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Modifier
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modale de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le type d'analyse</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le type d'analyse "{selectedType?.name}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={formLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
