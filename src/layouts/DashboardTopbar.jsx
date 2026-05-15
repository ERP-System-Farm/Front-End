import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Avatar, Chip, IconButton, Menu, MenuItem, Divider, ListItemIcon, ListItemText, Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useAuth } from '../app/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationBell from '../components/NotificationBell';

// Maps route paths to their translation keys
const ROUTE_LABELS = {
  '/dashboard': 'sidebar.dashboard',
  '/farm': 'sidebar.farm',
  '/palm': 'sidebar.palm',
  '/olive': 'sidebar.olive',
  '/warehouse': 'sidebar.warehouse',
  '/equipment': 'sidebar.equipment',
  '/reports': 'sidebar.reports',
  '/production': 'sidebar.production',
  '/accounting': 'sidebar.accounting',
  '/admin': 'sidebar.admin',
  '/profile': 'nav.dashboard',
};

const DashboardTopbar = ({ onDrawerToggle, onCollapseToggle, isCollapsed, drawerWidth }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) handleMenuClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const pageTitle = ROUTE_LABELS[location.pathname]
    ? t(ROUTE_LABELS[location.pathname])
    : 'Atlas ERP';

  // We should ideally get this from a theme map or utility, but using standard palette for now
  const ROLE_COLORS = {
    SUPER_ADMIN: theme.palette.info.dark,
    OWNER: theme.palette.info.main,
    MANAGER: theme.palette.info.light,
    ENGINEER: theme.palette.primary.main,
    ACCOUNTANT: theme.palette.warning.dark,
    WAREHOUSE: theme.palette.warning.main,
    HR: theme.palette.secondary.main,
  };

  const roleColor = ROLE_COLORS[user?.role] || theme.palette.primary.main;

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('atlas_lang', next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: '100%',
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'border.subtle',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar sx={{
          minHeight: { xs: 64, sm: 64 },
          px: { xs: 2, md: 4 },
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          {/* Page Title & Hamburger */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onDrawerToggle}
              sx={{ mr: 1, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            {isDesktop && (
              <IconButton
                color="inherit"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={onCollapseToggle}
                sx={{ mr: 1, display: { xs: 'none', md: 'inline-flex' } }}
              >
                {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            )}

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, tracking: '-0.02em', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {pageTitle}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  display: { xs: 'none', sm: 'block' },
                  mt: -0.5
                }}
              >
                Atlas Farm ERP &bull; {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
          </Box>

          {/* Right side: Notifications + User */}
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Box
              onClick={handleMenuClick}
              aria-controls={open ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                p: 0.75,
                borderRadius: 3,
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'background.default'
                }
              }}
            >
              <Box sx={{ textAlign: 'end', display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: 'text.primary' }}>
                  {user?.name}
                </Typography>
                <Chip
                  label={user?.role?.replace('_', ' ')}
                  size="small"
                  sx={{
                    backgroundColor: `${roleColor}15`,
                    color: roleColor,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 20,
                    borderRadius: '6px',
                  }}
                />
              </Box>
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: roleColor,
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Box>
          </div>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ elevation: 3, sx: { minWidth: 240, mt: 1.5, overflow: 'hidden' } }}
      >
        {/* Mini Profile Header */}
        <Box sx={{ px: 2.5, py: 2, bgcolor: 'background.default', borderBottom: 1, borderColor: 'border.subtle' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: roleColor, fontWeight: 800, fontSize: 14 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: 'text.primary' }}>{user?.name}</Typography>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.disabled' }}>{user?.role?.replace('_', ' ')}</Typography>
            </Box>
          </Box>
        </Box>

        <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ py: 1.5, mt: 1 }}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('nav.dashboard', 'ملفي الشخصي')} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ py: 1.5 }}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary={t('nav.account_settings', 'إعدادات الحساب')} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem onClick={() => { handleMenuClose(); toggleLanguage(); }} sx={{ py: 1.5 }}>
          <ListItemIcon><Brightness4Icon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary={i18n.language === 'ar' ? 'English' : 'عربي'}
            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
          />
        </MenuItem>

        <Divider sx={{ my: 0.5, borderColor: 'border.subtle' }} />

        <MenuItem onClick={() => { handleMenuClose(); logout(); }} sx={{ color: 'error.main', py: 1.5 }}>
          <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary={t('sidebar.logout', 'تسجيل الخروج')} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default DashboardTopbar;
