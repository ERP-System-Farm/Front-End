export const roleMap = {
  SUPER_ADMIN: 'all',
  OWNER:       'all',
  MANAGER:     'all',
  ENGINEER:    ['reports', 'farm', 'palm', 'olive', 'equipment', 'production'],
  ACCOUNTANT:  ['accounting', 'farm', 'reports'],
  WAREHOUSE:   ['warehouse', 'farm', 'reports'],
  HR:          ['farm', 'reports'],
};

export const hasAccess = (user, module) => {
  if (!user || !user.role) return false;
  const allowed = roleMap[user.role] || [];
  return allowed === 'all' || allowed.includes(module);
};
