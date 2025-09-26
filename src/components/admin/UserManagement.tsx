'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  BanIcon, 
  TrashIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  AlertTriangleIcon
} from 'lucide-react'
import { getRoleColor, getRoleLabel, getRoleIcon } from '@/lib/permissions'
import { UserRole } from '@/types'

interface UserStats {
  id: string
  email: string
  display_name: string
  role: string
  status: string
  created_at: string
  last_login: string
  total_images: number
  total_analyses: number
  total_api_keys: number
  total_storage_mb: number
}

interface UserManagementProps {
  users: UserStats[]
  currentUserId: string
  currentUserRole: string
}

function formatDate(dateString: string) {
  if (!dateString) return 'Jamais'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800'
    case 'suspended':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function UserManagement({ users, currentUserId, currentUserRole }: UserManagementProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [userList, setUserList] = useState(users)

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (loading) return
    
    // Confirmation pour les actions critiques
    const confirmMessage = newRole === 'user' 
      ? 'Êtes-vous sûr de vouloir révoquer les droits administrateur de cet utilisateur ?'
      : `Êtes-vous sûr de vouloir promouvoir cet utilisateur au rôle ${newRole} ?`
    
    if (!confirm(confirmMessage)) return

    setLoading(userId)
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la modification du rôle')
      }

      // Mettre à jour la liste locale
      setUserList(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))

      alert(`Rôle modifié avec succès vers ${newRole}`)
    } catch (error) {
      console.error('Erreur:', error)
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(null)
    }
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (loading) return
    
    const confirmMessage = newStatus === 'suspended' 
      ? 'Êtes-vous sûr de vouloir suspendre cet utilisateur ?'
      : 'Êtes-vous sûr de vouloir réactiver cet utilisateur ?'
    
    if (!confirm(confirmMessage)) return

    setLoading(userId)
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la modification du statut')
      }

      // Mettre à jour la liste locale
      setUserList(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ))

      alert(`Statut modifié avec succès vers ${newStatus}`)
    } catch (error) {
      console.error('Erreur:', error)
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (loading) return
    
    if (!confirm('⚠️ ATTENTION: Cette action est irréversible !\n\nÊtes-vous sûr de vouloir supprimer définitivement cet utilisateur et toutes ses données ?')) {
      return
    }

    // Double confirmation pour la suppression
    if (!confirm('Confirmez-vous la suppression définitive ? Toutes les images, analyses et données de cet utilisateur seront perdues.')) {
      return
    }

    setLoading(userId)
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      // Retirer l'utilisateur de la liste locale
      setUserList(prev => prev.filter(user => user.id !== userId))

      alert('Utilisateur supprimé avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      alert(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(null)
    }
  }

  const canModifyUser = (user: UserStats) => {
    // Seuls les superadmins peuvent modifier les autres utilisateurs
    if (currentUserRole !== 'superadmin') return false
    
    // Ne peut pas se modifier soi-même
    if (user.id === currentUserId) return false
    
    // Ne peut pas modifier un autre superadmin
    if (user.role === 'superadmin') return false
    
    return true
  }

  const canDeleteUser = (user: UserStats) => {
    // Seuls les superadmins peuvent supprimer
    if (currentUserRole !== 'superadmin') return false
    
    // Ne peut pas se supprimer soi-même
    if (user.id === currentUserId) return false
    
    // Ne peut pas supprimer un autre superadmin
    if (user.role === 'superadmin') return false
    
    return true
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des utilisateurs</CardTitle>
        <CardDescription>
          Liste de tous les utilisateurs de la plateforme avec actions de gestion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userList.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div>
                    <h4 className="font-medium">{user.display_name}</h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <Badge className={getRoleColor(user.role as UserRole)}>
                    {getRoleIcon(user.role as UserRole)} {getRoleLabel(user.role as UserRole)}
                  </Badge>
                  <Badge className={getStatusColor(user.status)}>
                    {user.status}
                  </Badge>
                  {user.id === currentUserId && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Vous
                    </Badge>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">{user.total_images}</span> images
                  </div>
                  <div>
                    <span className="font-medium">{user.total_analyses}</span> analyses
                  </div>
                  <div>
                    <span className="font-medium">{user.total_api_keys}</span> clés API
                  </div>
                  <div>
                    <span className="font-medium">{user.total_storage_mb.toFixed(1)} MB</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <div>Créé: {formatDate(user.created_at)}</div>
                  <div>Dernière connexion: {formatDate(user.last_login)}</div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {canModifyUser(user) && (
                  <>
                    {/* Boutons de rôle */}
                    {user.role === 'user' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRoleChange(user.id, 'admin')}
                        disabled={loading === user.id}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <UserPlusIcon className="h-4 w-4 mr-1" />
                        Promouvoir Admin
                      </Button>
                    )}
                    
                    {user.role === 'admin' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleChange(user.id, 'user')}
                          disabled={loading === user.id}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <UserMinusIcon className="h-4 w-4 mr-1" />
                          Révoquer Admin
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleChange(user.id, 'superadmin')}
                          disabled={loading === user.id}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <ShieldCheckIcon className="h-4 w-4 mr-1" />
                          Promouvoir SuperAdmin
                        </Button>
                      </>
                    )}
                    
                    {/* Boutons de statut */}
                    {user.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(user.id, 'suspended')}
                        disabled={loading === user.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <BanIcon className="h-4 w-4 mr-1" />
                        Suspendre
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(user.id, 'active')}
                        disabled={loading === user.id}
                        className="text-green-600 hover:text-green-700"
                      >
                        <ShieldXIcon className="h-4 w-4 mr-1" />
                        Réactiver
                      </Button>
                    )}
                  </>
                )}
                
                {/* Bouton de suppression */}
                {canDeleteUser(user) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={loading === user.id}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                )}
                
                {loading === user.id && (
                  <div className="text-sm text-gray-500">Chargement...</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {currentUserRole !== 'superadmin' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertTriangleIcon className="h-4 w-4" />
              <span className="text-sm">
                Seuls les Super Administrateurs peuvent modifier les utilisateurs.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
