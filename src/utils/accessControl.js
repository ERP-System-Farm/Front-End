export const roleMap = {
  SUPER_ADMIN: 'all',
  OWNER:       'all',
  MANAGER:     'all',
  ENGINEER:    ['reports', 'farm', 'palm', 'olive', 'production'],
  ACCOUNTANT:  ['accounting', 'farm', 'reports'],
  WAREHOUSE:   ['warehouse', 'farm', 'reports', 'equipment'],
  HR:          ['farm', 'reports'],
};

export const hasAccess = (user, module) => {
  if (!user || !user.role) return false;
  if (user.role === 'SUPER_ADMIN') return true;
  
  // Check user's assigned custom permissions override
  if (user.permissions && Array.isArray(user.permissions)) {
    if (user.permissions.includes(module)) return true;
  }
  if (user.custom_permissions && Array.isArray(user.custom_permissions)) {
    if (user.custom_permissions.includes(module)) return true;
  }

  const allowed = roleMap[user.role] || [];
  return allowed === 'all' || allowed.includes(module);
};
