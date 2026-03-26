// ===== UNIFIED ROLE SYSTEM =====
// Single source of truth for all role logic

export const ROLES = {
  player: { value: "player", label: "Player", title: null, color: "text-gray-400" },
  moderator: { value: "moderator", label: "Moderator", title: "Mod", color: "text-blue-400" },
  admin: { value: "admin", label: "Admin", title: "Admin", color: "text-red-500" },
  superadmin: { value: "superadmin", label: "SuperAdmin", title: "DEV", color: "text-yellow-400" },
};

const ROLE_HIERARCHY = {
  player: 0,
  moderator: 1,
  admin: 2,
  superadmin: 3,
};

/**
 * Check if a role can assign another role
 * SuperAdmin > Admin > Moderator > Player (cannot assign)
 */
export function canAssignRole(assignerRole, targetRole) {
  const assignerLevel = ROLE_HIERARCHY[assignerRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
  
  // Can only assign lower or equal roles
  return assignerLevel > targetLevel && targetLevel > 0;
}

/**
 * Get role display title (for in-game display)
 */
export function getRoleTitle(role) {
  return ROLES[role]?.title || null;
}

/**
 * Get role color for styling
 */
export function getRoleColor(role) {
  return ROLES[role]?.color || "text-gray-400";
}

/**
 * Format player name with role title
 */
export function formatPlayerName(name, role) {
  const title = getRoleTitle(role);
  return title ? `[${title}] ${name}` : name;
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(role) {
  return ROLE_HIERARCHY[role] || 0;
}

/**
 * Check if role has permission
 */
export function hasPermission(role, permission) {
  const level = getRoleLevel(role);
  
  const permissions = {
    kick_player: { minLevel: 1 },
    mute_player: { minLevel: 1 },
    manage_roles: { minLevel: 2 },
    manage_guild: { minLevel: 2 },
    system_config: { minLevel: 3 },
  };

  return level >= (permissions[permission]?.minLevel || 999);
}