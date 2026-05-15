import React, { useState } from 'react'

import {
  AttachFile as AttachIcon,
  History as HistoryIcon,
  KeyboardArrowDown as ArrowDownIcon,
  NoteAdd as NoteIcon,
  PestControl as PestIcon,
  PostAdd as OtherOpIcon,
  Settings as SettingsIcon,
  Spa as FertilizerIcon,
  WaterDrop as WaterIcon,
} from '@mui/icons-material'
import {
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

import QuickNoteModal from './QuickNoteModal'

const OperationActionBar = ({ enclosureId, currentNotes, onAction }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const open = Boolean(anchorEl)

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)

  const handleNavigate = (type) => {
    handleMenuClose()
    // Redirect to the existing Daily Task form, passing enclosure and operation type as query params
    navigate(`/reports/tasks/new?enclosure=${enclosureId}&type=${type}`)
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        bgcolor: '#f8fafc',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0,
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        zIndex: 1,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent={isMobile ? 'space-between' : 'flex-start'}
      >
        {/* Primary Action: Scalable Dropdown */}
        <Button
          variant="contained"
          disableElevation
          fullWidth={isMobile}
          endIcon={<ArrowDownIcon />}
          onClick={handleMenuClick}
          sx={{
            borderRadius: '6px',
            fontWeight: 700,
            bgcolor: '#0f172a',
            '&:hover': { bgcolor: '#1e293b' },
            px: 3,
            py: isMobile ? 1.2 : 0.8,
          }}
        >
          تسجيل عملية جديدة
        </Button>

        {!isMobile && <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.5 }} />}

        {/* Quick Secondary Actions */}
        <Stack direction="row" spacing={0.5}>
          <Button
            variant="text"
            startIcon={<NoteIcon />}
            onClick={() => setNoteModalOpen(true)}
            sx={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}
          >
            {!isMobile && 'ملاحظة'}
          </Button>
          <Button
            variant="text"
            startIcon={<AttachIcon />}
            sx={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}
          >
            {!isMobile && 'مرفق'}
          </Button>
        </Stack>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              width: 220,
              mt: 0.5,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            },
          }}
        >
          <MenuItem onClick={() => handleNavigate('irrigation')}>
            <ListItemIcon>
              <WaterIcon fontSize="small" sx={{ color: '#3b82f6' }} />
            </ListItemIcon>
            <ListItemText
              primary="عملية ري"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
            />
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('fertilization')}>
            <ListItemIcon>
              <FertilizerIcon fontSize="small" sx={{ color: '#10b981' }} />
            </ListItemIcon>
            <ListItemText
              primary="عملية تسميد"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
            />
          </MenuItem>
          <MenuItem onClick={() => handleNavigate('spraying')}>
            <ListItemIcon>
              <PestIcon fontSize="small" sx={{ color: '#ef4444' }} />
            </ListItemIcon>
            <ListItemText
              primary="مكافحة آفات"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
            />
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleNavigate('other')}>
            <ListItemIcon>
              <OtherOpIcon fontSize="small" sx={{ color: '#64748b' }} />
            </ListItemIcon>
            <ListItemText
              primary="عملية أخرى..."
              primaryTypographyProps={{ fontSize: '0.85rem' }}
            />
          </MenuItem>
        </Menu>

        <QuickNoteModal
          open={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          enclosureId={enclosureId}
          currentNotes={currentNotes}
          onSaveSuccess={onAction}
        />
      </Stack>

      {/* Trailing Tools */}
      <Stack direction="row" spacing={1} justifyContent={isMobile ? 'flex-end' : 'flex-start'}>
        <Tooltip title="تعديل إعدادات الأصل">
          <Button
            variant="outlined"
            sx={{ minWidth: 40, p: 0.5, borderColor: '#cbd5e1', color: '#64748b' }}
          >
            <SettingsIcon fontSize="small" />
          </Button>
        </Tooltip>
        <Tooltip title="سجل التعديلات (Audit Log)">
          <Button
            variant="outlined"
            sx={{ minWidth: 40, p: 0.5, borderColor: '#cbd5e1', color: '#64748b' }}
          >
            <HistoryIcon fontSize="small" />
          </Button>
        </Tooltip>
      </Stack>
    </Paper>
  )
}

export default OperationActionBar
