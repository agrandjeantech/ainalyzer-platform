'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  KeyIcon,
  PlusIcon,
  TestTubeIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  Loader2Icon,
} from 'lucide-react'
import { useApiKeys, useApiKeyStats } from '@/hooks/useApiKeys'

interface ApiKeysManagerProps {
  className?: string
}

export function ApiKeysManager({ className }: ApiKeysManagerProps) {
  const { apiKeys, isLoading, error, addApiKey, updateApiKey, deleteApiKey, testApiKey } = useApiKeys()
  const stats = useApiKeyStats()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<any>(null)
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; error: string | null }>>({})

  // Formulaire d'ajout
  const [addForm, setAddForm] = useState({
    provider: '' as 'openai' | 'anthropic' | '',
    name: '',
    apiKey: '',
  })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  // Formulaire d'édition
  const [editForm, setEditForm] = useState({
    name: '',
    active: true,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return '🤖'
      case 'anthropic':
        return '🧠'
      default:
        return '🔑'
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'bg-green-100 text-green-800'
      case 'anthropic':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.provider || !addForm.name || !addForm.apiKey) {
      setAddError('Tous les champs sont requis')
      return
    }

    setAddLoading(true)
    setAddError('')

    const result = await addApiKey({
      provider: addForm.provider,
      name: addForm.name,
      apiKey: addForm.apiKey,
    })

    if (result.success) {
      setIsAddDialogOpen(false)
      setAddForm({ provider: '', name: '', apiKey: '' })
    } else {
      setAddError(result.error || 'Erreur lors de l\'ajout')
    }

    setAddLoading(false)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingKey) return

    const result = await updateApiKey(editingKey.id, {
      name: editForm.name,
      active: editForm.active,
    })

    if (result.success) {
      setIsEditDialogOpen(false)
      setEditingKey(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé API ?')) return

    await deleteApiKey(id)
  }

  const handleTest = async (id: string) => {
    setTestingKeys(prev => ({ ...prev, [id]: true }))
    
    const result = await testApiKey(id)
    
    if (result.success && result.result) {
      setTestResults(prev => ({ ...prev, [id]: result.result! }))
    }
    
    setTestingKeys(prev => ({ ...prev, [id]: false }))
  }

  const openEditDialog = (key: any) => {
    setEditingKey(key)
    setEditForm({
      name: key.name,
      active: key.active,
    })
    setIsEditDialogOpen(true)
  }

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des clés API...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistiques */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalKeys}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeKeys}</div>
              <div className="text-sm text-gray-600">Actives</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.openaiKeys}</div>
              <div className="text-sm text-gray-600">OpenAI</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.anthropicKeys}</div>
              <div className="text-sm text-gray-600">Anthropic</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des clés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <KeyIcon className="h-5 w-5" />
                <span>Clés API</span>
              </CardTitle>
              <CardDescription>
                Gérez vos clés OpenAI et Anthropic pour les analyses d'images
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Ajouter une clé
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une clé API</DialogTitle>
                  <DialogDescription>
                    Ajoutez votre clé OpenAI ou Anthropic pour commencer les analyses
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddSubmit}>
                  <div className="space-y-4">
                    {addError && (
                      <Alert>
                        <AlertCircleIcon className="h-4 w-4" />
                        <AlertDescription>{addError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="provider">Provider</Label>
                      <Select
                        value={addForm.provider}
                        onValueChange={(value: 'openai' | 'anthropic') => 
                          setAddForm(prev => ({ ...prev, provider: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nom de la clé</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Ma clé OpenAI"
                        value={addForm.name}
                        onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="apiKey">Clé API</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="sk-..."
                        value={addForm.apiKey}
                        onChange={(e) => setAddForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={addLoading}>
                      {addLoading ? (
                        <>
                          <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                          Ajout...
                        </>
                      ) : (
                        'Ajouter'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <KeyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune clé API configurée
              </h3>
              <p className="text-gray-600 mb-4">
                Ajoutez vos clés OpenAI ou Anthropic pour commencer les analyses
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getProviderIcon(key.provider)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{key.name}</h4>
                        <Badge className={getProviderColor(key.provider)}>
                          {key.provider}
                        </Badge>
                        {key.active ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Créée le {formatDate(key.created_at)}
                        {key.last_used && (
                          <span> • Dernière utilisation: {formatDate(key.last_used)}</span>
                        )}
                      </div>
                      {testResults[key.id] && (
                        <div className="flex items-center space-x-2 mt-1">
                          {testResults[key.id].valid ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ${testResults[key.id].valid ? 'text-green-600' : 'text-red-600'}`}>
                            {testResults[key.id].valid ? 'Clé valide' : testResults[key.id].error}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(key.id)}
                      disabled={testingKeys[key.id]}
                    >
                      {testingKeys[key.id] ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTubeIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(key)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(key.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la clé API</DialogTitle>
            <DialogDescription>
              Modifiez le nom ou le statut de votre clé API
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Nom de la clé</Label>
                <Input
                  id="editName"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="editActive"
                  checked={editForm.active}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="editActive">Clé active</Label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                Sauvegarder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
