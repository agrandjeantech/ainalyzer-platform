import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types'

/**
 * Vérifie si un rôle a une permission spécifique
 */
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  // Récupérer toutes les permissions pour ce rôle (avec héritage)
  const permissions = getAllPermissions(userRole)
  
  return permissions.some(
    permission => 
      permission.resource === resource && 
      permission.action === action
  )
}

/**
 * Récupère toutes les permissions d'un rôle avec héritage
 */
export function getAllPermissions(userRole: UserRole): Permission[] {
  const permissions: Permission[] = []
  
  // Ajouter les permissions de base (user)
  if (userRole === 'user' || userRole === 'admin' || userRole === 'superadmin') {
    permissions.push(...ROLE_PERMISSIONS.user)
  }
  
  // Ajouter les permissions admin
  if (userRole === 'admin' || userRole === 'superadmin') {
    permissions.push(...ROLE_PERMISSIONS.admin)
  }
  
  // Ajouter les permissions superadmin
  if (userRole === 'superadmin') {
    permissions.push(...ROLE_PERMISSIONS.superadmin)
  }
  
  return permissions
}

/**
 * Vérifie si un utilisateur peut accéder à une ressource
 */
export function canAccess(
  userRole: UserRole,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' = 'read'
): boolean {
  return hasPermission(userRole, resource, action)
}

/**
 * Vérifie si un utilisateur est admin ou superadmin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin' || userRole === 'superadmin'
}

/**
 * Vérifie si un utilisateur est superadmin
 */
export function isSuperAdmin(userRole: UserRole): boolean {
  return userRole === 'superadmin'
}

/**
 * Vérifie si un rôle peut modifier un autre rôle
 */
export function canModifyRole(
  currentUserRole: UserRole,
  targetUserRole: UserRole,
  newRole: UserRole
): boolean {
  // Seuls les superadmins peuvent modifier les rôles
  if (currentUserRole !== 'superadmin') {
    return false
  }
  
  // Un superadmin peut modifier n'importe quel rôle
  // mais ne peut pas se rétrograder s'il est le dernier superadmin
  // (cette vérification est faite côté serveur)
  return true
}

/**
 * Vérifie si un rôle peut modifier le statut d'un utilisateur
 */
export function canModifyStatus(
  currentUserRole: UserRole,
  targetUserRole: UserRole
): boolean {
  // Seuls les superadmins peuvent modifier les statuts
  if (currentUserRole !== 'superadmin') {
    return false
  }
  
  // Un superadmin peut modifier le statut de n'importe qui
  // mais ne peut pas se suspendre s'il est le dernier superadmin actif
  // (cette vérification est faite côté serveur)
  return true
}

/**
 * Obtient la hiérarchie des rôles
 */
export function getRoleHierarchy(): UserRole[] {
  return ['user', 'admin', 'superadmin']
}

/**
 * Compare deux rôles et retourne le niveau de hiérarchie
 */
export function compareRoles(role1: UserRole, role2: UserRole): number {
  const hierarchy = getRoleHierarchy()
  const level1 = hierarchy.indexOf(role1)
  const level2 = hierarchy.indexOf(role2)
  
  return level1 - level2
}

/**
 * Vérifie si un rôle est supérieur à un autre
 */
export function isRoleHigher(role1: UserRole, role2: UserRole): boolean {
  return compareRoles(role1, role2) > 0
}

/**
 * Obtient les rôles disponibles pour promotion par un utilisateur
 */
export function getAvailableRoles(currentUserRole: UserRole): UserRole[] {
  if (currentUserRole === 'superadmin') {
    return ['user', 'admin', 'superadmin']
  }
  
  // Les admins ne peuvent pas promouvoir (seuls les superadmins le peuvent)
  return []
}

/**
 * Obtient le label d'affichage d'un rôle
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    user: 'Utilisateur',
    admin: 'Administrateur',
    superadmin: 'Super Administrateur'
  }
  
  return labels[role]
}

/**
 * Obtient la couleur d'affichage d'un rôle
 */
export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    user: 'bg-gray-100 text-gray-800',
    admin: 'bg-blue-100 text-blue-800',
    superadmin: 'bg-purple-100 text-purple-800'
  }
  
  return colors[role]
}

/**
 * Obtient l'icône d'un rôle
 */
export function getRoleIcon(role: UserRole): string {
  const icons: Record<UserRole, string> = {
    user: '👤',
    admin: '🛡️',
    superadmin: '👑'
  }
  
  return icons[role]
}

/**
 * Middleware pour vérifier les permissions côté client
 */
export function requirePermission(
  userRole: UserRole | undefined,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' = 'read'
): boolean {
  if (!userRole) {
    return false
  }
  
  return hasPermission(userRole, resource, action)
}

/**
 * Hook pour vérifier les permissions dans les composants React
 */
export function usePermissions(userRole: UserRole | undefined) {
  return {
    canRead: (resource: string) => requirePermission(userRole, resource, 'read'),
    canCreate: (resource: string) => requirePermission(userRole, resource, 'create'),
    canUpdate: (resource: string) => requirePermission(userRole, resource, 'update'),
    canDelete: (resource: string) => requirePermission(userRole, resource, 'delete'),
    isAdmin: userRole ? isAdmin(userRole) : false,
    isSuperAdmin: userRole ? isSuperAdmin(userRole) : false,
    canModifyRoles: userRole === 'superadmin',
    canModifyStatus: userRole === 'superadmin',
    getAllPermissions: () => userRole ? getAllPermissions(userRole) : [],
  }
}
