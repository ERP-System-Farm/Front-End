import React, { useState } from 'react'

import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AgricultureIcon from '@mui/icons-material/Agriculture'
import AutoGraphIcon from '@mui/icons-material/AutoGraph'
import CloseIcon from '@mui/icons-material/Close'
import DashboardIcon from '@mui/icons-material/Dashboard'
import DynamicFeedIcon from '@mui/icons-material/DynamicFeed'
import ForestIcon from '@mui/icons-material/Forest'
import LanguageIcon from '@mui/icons-material/Language'
import LogoutIcon from '@mui/icons-material/Logout'
import PaymentsIcon from '@mui/icons-material/Payments'
import SpaIcon from '@mui/icons-material/Spa'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import {
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../app/AuthContext'
import BottomNav from '../components/BottomNav'
import { hasAccess } from '../utils/accessControl'

import DashboardTopbar from './DashboardTopbar'

const DRAWER_WIDTH = 264

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)
  const handleCollapseToggle = () => setCollapsed(!collapsed)

  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const drawerWidth = collapsed ? 80 : 264
  const activeEdge = isRTL ? 'left' : 'right'

  // Wrapper so nav items can call hasAccessCheck('farm') etc.
  const hasAccessCheck = (module) => hasAccess(user, module)

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(next)
    localStorage.setItem('atlas_lang', next)
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = next
  }

  const SectionLabel = ({ label }) =>
    !collapsed && (
      <Typography
        variant="caption"
        sx={{
          px: 2.5,
          mt: 2,
          mb: 0.5,
          display: 'block',
          color: 'text.disabled', // mapped to text.muted in theme
          fontWeight: 700,
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
    )

  const NavItem = ({ to, icon, labelKey, color }) => {
    const isActive = location.pathname === to
    return (
      <ListItem disablePadding sx={{ mb: 0.25 }}>
        <ListItemButton
          component={Link}
          to={to}
          onClick={() => {
            if (!isDesktop) setMobileOpen(false)
          }}
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 1.5,
            px: collapsed ? 1 : 1.5,
            py: 1,
            mx: 1,
            borderRadius: 2,
            justifyContent: collapsed ? 'center' : 'flex-start',
            bgcolor: isActive ? 'semanticBg.success' : 'transparent',
            color: isActive ? 'primary.main' : 'text.secondary',
            fontWeight: isActive ? 700 : 500,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: isActive ? 'semanticBg.success' : 'background.default',
              color: isActive ? 'primary.main' : 'text.primary',
            },
            position: 'relative',
            '&::before':
              isActive && !collapsed
                ? {
                    content: '""',
                    position: 'absolute',
                    [activeEdge]: 0,
                    top: '20%',
                    height: '60%',
                    width: 3,
                    bgcolor: 'primary.main',
                    borderRadius: isRTL ? '0 3px 3px 0' : '3px 0 0 3px',
                  }
                : {},
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              color: isActive ? 'primary.main' : color || 'text.disabled',
              flexShrink: 0,
              justifyContent: 'center',
            }}
          >
            {icon}
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary={t(labelKey)}
              slotProps={{
                primary: {
                  sx: { fontSize: '0.875rem', fontWeight: 'inherit', color: 'inherit' },
                  noWrap: true,
                },
              }}
            />
          )}
        </ListItemButton>
      </ListItem>
    )
  }

  const sidebarContent = (
    <>
      {/* Spacer for full-width Topbar */}
      <Toolbar sx={{ minHeight: { xs: 64, sm: 64 } }} />
      {/* Header */}
      <Box
        sx={{
          px: collapsed ? 1 : 2.5,
          py: 2.5,
          borderBottom: 1,
          borderColor: 'border.subtle',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AgricultureIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          {!collapsed && (
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                color="text.primary"
                sx={{ lineHeight: 1.2 }}
              >
                Atlas ERP
              </Typography>
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                أطلس سيوة الزراعية
              </Typography>
            </Box>
          )}
        </Box>
        {!isDesktop && (
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, p: 1.5, pt: 2, overflowY: 'auto' }}>
        <SectionLabel label={t('sidebar.operations')} />
        <NavItem
          to="/dashboard"
          icon={<DashboardIcon fontSize="small" />}
          labelKey="sidebar.dashboard"
        />
        {hasAccessCheck('farm') && (
          <NavItem
            to="/farm"
            icon={<AccountTreeIcon fontSize="small" />}
            labelKey="sidebar.farm"
            color="primary.main"
          />
        )}
        {/* {hasAccessCheck('palm') && <NavItem to="/palm" icon={<SpaIcon fontSize="small" />} labelKey="sidebar.palm" color="primary.dark" />}
        {hasAccessCheck('olive') && <NavItem to="/olive" icon={<ForestIcon fontSize="small" />} labelKey="sidebar.olive" color="success.main" />} */}
        {hasAccessCheck('warehouse') && (
          <NavItem
            to="/warehouse"
            icon={<WarehouseIcon fontSize="small" />}
            labelKey="sidebar.warehouse"
            color="warning.main"
          />
        )}
        {hasAccessCheck('equipment') && (
          <NavItem
            to="/equipment"
            icon={<AgricultureIcon fontSize="small" />}
            labelKey="sidebar.equipment"
            color="info.main"
          />
        )}

        <SectionLabel label={t('sidebar.business')} />
        {hasAccessCheck('reports') && (
          <NavItem
            to="/reports"
            icon={<DynamicFeedIcon fontSize="small" />}
            labelKey="sidebar.reports"
            color="info.dark"
          />
        )}
        {hasAccessCheck('production') && (
          <NavItem
            to="/production"
            icon={<AutoGraphIcon fontSize="small" />}
            labelKey="sidebar.production"
            color="secondary.main"
          />
        )}
        {hasAccessCheck('accounting') && (
          <NavItem
            to="/accounting"
            icon={<PaymentsIcon fontSize="small" />}
            labelKey="sidebar.accounting"
            color="warning.dark"
          />
        )}

        {user?.role && ['SUPER_ADMIN', 'OWNER', 'MANAGER'].includes(user.role) && (
          <>
            <SectionLabel label={t('sidebar.security')} />
            <NavItem
              to="/admin"
              icon={<VerifiedUserIcon fontSize="small" />}
              labelKey="sidebar.admin"
              color="info.light"
            />
          </>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'border.subtle',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexDirection: collapsed ? 'column' : 'row',
        }}
      >
        <Avatar
          sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14, flexShrink: 0 }}
        >
          {user?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
        {!collapsed && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role?.replace('_', ' ')}
            </Typography>
          </Box>
        )}
        {!collapsed && (
          <Tooltip title={t('sidebar.logout', 'تسجيل الخروج') || 'Logout'}>
            <IconButton size="small" onClick={logout} sx={{ color: 'text.disabled' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {collapsed && (
          <IconButton size="small" onClick={logout} sx={{ color: 'error.main', mt: 1 }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {/* Sidebar (Permanent on Desktop) */}
      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop || mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: mobileOpen ? 'block' : 'none', md: 'block' },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            border: 'none',
            borderRight: !isRTL && isDesktop ? 1 : 0,
            borderLeft: isRTL && isDesktop ? 1 : 0,
            borderColor: 'border.subtle',
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          pb: { xs: 8, md: 0 },
        }}
      >
        <DashboardTopbar
          onDrawerToggle={handleDrawerToggle}
          onCollapseToggle={handleCollapseToggle}
          isCollapsed={collapsed}
          drawerWidth={drawerWidth}
        />
        {/* Spacer for fixed AppBar */}
        <Box sx={{ minHeight: { xs: 64, sm: 64 } }} />
        <Box sx={{ flex: 1, overflow: 'auto', width: '100%' }}>{children}</Box>
        <BottomNav />
      </Box>
    </Box>
  )
}

export default DashboardLayout
