import React, { useCallback, useEffect, useMemo, useState } from 'react'

import {
  AccountTreeOutlined as FarmIcon,
  AddCircleOutlined as AddIcon,
  ArrowBackIosNew as ArrowIcon,
  ChevronLeft as CollapseIcon,
  DeleteOutlineOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  ExpandMore as ExpandIcon,
  FolderOpenOutlined as EmptyIcon,
  GridViewOutlined as SectorIcon,
  LayersOutlined as StageIcon,
  SearchOutlined as SearchIcon,
  TerrainOutlined as EnclosureIcon,
  VisibilityOutlined as VisibilityIcon,
} from '@mui/icons-material'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import ConfirmDialog from '../../components/ConfirmDialog'
import { useSnackbar } from '../../contexts/SnackbarContext'
import {
  createLocationNode,
  deleteLocationNode,
  getLocationTree,
  updateLocationNode,
} from '../../features/farm/services'

import './FarmStructure.css'

// ─── Constants ───────────────────────────────────────────────────────────────
const NT = { SECTOR: 'SECTOR', STAGE: 'STAGE', ENCLOSURE: 'ENCLOSURE' }

// Allowed children per node type (Context-aware hierarchy)
const UI_ALLOWED_CHILDREN = {
  [NT.SECTOR]: [NT.STAGE, NT.ENCLOSURE],
  [NT.STAGE]: [NT.ENCLOSURE],
  [NT.ENCLOSURE]: [],
}

// ─── NodeIcon ────────────────────────────────────────────────────────────────
const NodeIcon = ({ type, level }) => {
  const sx = { fontSize: level === 0 ? 20 : level === 1 ? 18 : 16 }
  if (type === NT.SECTOR) return <SectorIcon sx={sx} />
  if (type === NT.STAGE) return <StageIcon sx={sx} />
  if (type === NT.ENCLOSURE) return <EnclosureIcon sx={sx} />
  return <FarmIcon sx={sx} />
}

// ─── TreeNode (Recursive) ────────────────────────────────────────────────────
const TreeNode = ({ node, level = 0, onAdd, onEdit, onDelete, searchQuery }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false) // Collapsed by default
  const children = node.children || []
  const hasChildren = children.length > 0

  const isMatched = useMemo(() => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const walk = (n) => n.name.toLowerCase().includes(q) || (n.children || []).some(walk)
    return walk(node)
  }, [node, searchQuery])

  const isSelfMatched = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase())

  // Auto-expand if children match search query
  useEffect(() => {
    if (searchQuery && isMatched && !isSelfMatched) {
      setExpanded(true)
    }
  }, [searchQuery, isMatched, isSelfMatched])

  if (!isMatched) return null

  return (
    <div className={`tree-node-wrapper level-${level}`}>
      <div
        className={`tree-node node-${node.type.toLowerCase()} ${isSelfMatched ? 'node-highlighted' : ''}`}
      >
        {/* Expand/Collapse Toggle */}
        <div className="tree-node-prefix">
          {node.type !== NT.ENCLOSURE ? (
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ p: '2px', color: '#64748b' }}
            >
              {expanded ? (
                <ExpandIcon sx={{ fontSize: 16 }} />
              ) : (
                <CollapseIcon sx={{ fontSize: 16, transform: 'rotate(180deg)' }} />
              )}
            </IconButton>
          ) : (
            <div style={{ width: 24 }} />
          )}
        </div>

        {/* Icon & Name */}
        <div className={`tree-node-icon tree-node-icon-${node.type.toLowerCase()}`}>
          <NodeIcon type={node.type} level={level} />
        </div>

        <div className="tree-node-content">
          <Typography
            className="node-name"
            variant="body2"
            sx={{ fontWeight: 700, color: '#1e293b' }}
          >
            {node.name}
          </Typography>
          <Typography
            className="node-type-label"
            variant="caption"
            sx={{ color: '#94a3b8', fontWeight: 800 }}
          >
            {node.type === NT.SECTOR
              ? t('farm.sector', 'قطاع')
              : node.type === NT.STAGE
                ? t('farm.stage', 'مرحلة')
                : t('farm.enclosure', 'حوشة')}
          </Typography>
        </div>

        {/* Badge & Actions */}
        <div className="tree-node-suffix">
          {hasChildren && <span className="child-count-badge">{children.length}</span>}
          <div className="tree-node-actions">
            {node.type === NT.ENCLOSURE && (
              <Tooltip title={t('farm.view_profile', 'الملف التشغيلي')}>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/farm/enclosure/${node.id}`)}
                  sx={{ color: '#3b82f6' }}
                >
                  <VisibilityIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {UI_ALLOWED_CHILDREN[node.type].length > 0 && (
              <Tooltip title={t('common.add', 'إضافة')}>
                <IconButton size="small" onClick={() => onAdd(node)} sx={{ color: '#16a34a' }}>
                  <AddIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={t('common.edit', 'تعديل')}>
              <IconButton size="small" onClick={() => onEdit(node)} sx={{ color: '#64748b' }}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.delete', 'حذف')}>
              <IconButton size="small" onClick={() => onDelete(node)} sx={{ color: '#ef4444' }}>
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Recursive Children Rendering */}
      {expanded && (
        <div className={`children-container level-${level}`}>
          {hasChildren ? (
            <div className={`children-grid grid-level-${level}`}>
              {children.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onAdd={onAdd}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          ) : (
            node.type !== NT.ENCLOSURE && (
              <div className="empty-indicator">
                <EmptyIcon sx={{ fontSize: 24, opacity: 0.2, mb: 1 }} />
                <Typography variant="caption">
                  {t('farm.no_children', 'لا توجد عناصر تابعة')}
                </Typography>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const FarmStructure = () => {
  const { t } = useTranslation()
  const { showSnackbar } = useSnackbar()
  const [tree, setTree] = useState([])
  const [farmInfo, setFarmInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState(NT.SECTOR)
  const [editMode, setEditMode] = useState(false)
  const [currentNode, setCurrentNode] = useState(null)
  const [form, setForm] = useState({ name: '', parentId: '', type: NT.SECTOR })
  const [formLoading, setFormLoading] = useState(false)

  // Confirm Dialog state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteNode, setPendingDeleteNode] = useState(null)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLocationTree()
      setTree(data.tree || [])
      setFarmInfo(data.farm)
    } catch {
      setError(t('farm.error_fetch', 'فشل تحميل هيكل المزرعة'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleOpenAdd = (parent) => {
    setEditMode(false)
    setCurrentNode(parent)
    // Default to the first allowed child type from UI rules
    const defaultType = parent ? UI_ALLOWED_CHILDREN[parent.type][0] : NT.SECTOR
    setModalType(defaultType)
    setForm({ name: '', parentId: parent ? String(parent.id) : '', type: defaultType })
    setModalOpen(true)
  }

  const handleOpenEdit = (node) => {
    setEditMode(true)
    setCurrentNode(node)
    setModalType(node.type)
    setForm({ name: node.name, parentId: '', type: node.type })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setFormLoading(true)
    try {
      if (editMode) {
        await updateLocationNode(currentNode.id, { name: form.name })
      } else {
        const parentId = form.parentId ? Number(form.parentId) : null
        await createLocationNode({ name: form.name, type: form.type, parent: parentId })
      }
      setModalOpen(false)
      showSnackbar(
        editMode
          ? t('farm.updated_success', 'تم التعديل بنجاح')
          : t('farm.created_success', 'تمت الإضافة بنجاح'),
        'success'
      )
      fetchData()
    } catch (err) {
      const data = err.response?.data || {}
      const msg = data.parent || data.name || data.detail || t('common.error_save', 'فشل الحفظ')
      showSnackbar(Array.isArray(msg) ? msg[0] : msg, 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteClick = (node) => {
    setPendingDeleteNode(node)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDeleteNode) return
    try {
      await deleteLocationNode(pendingDeleteNode.id)
      showSnackbar(t('farm.deleted_success', 'تم الحذف بنجاح'), 'success')
      fetchData()
    } catch {
      showSnackbar(t('common.error_delete', 'فشل الحذف'), 'error')
    } finally {
      setConfirmOpen(false)
      setPendingDeleteNode(null)
    }
  }

  if (loading && !tree.length)
    return (
      <Box sx={{ p: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#16a34a' }} />
      </Box>
    )

  return (
    <div className="p-6 w-full max-w-7xl mx-auto" dir="rtl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <Breadcrumbs separator={<ArrowIcon sx={{ fontSize: 10, mx: 0.5, color: '#94a3b8' }} />}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <FarmIcon sx={{ fontSize: 14 }} /> {farmInfo?.name || t('farm.farm', 'المزرعة')}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b' }}>
              {t('farm.structure_title', 'الهيكل التنظيمي')}
            </Typography>
          </Breadcrumbs>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1">
            {t('farm.manage_hierarchy', 'إدارة الهيكل الهرمي')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t(
              'farm.hierarchy_desc',
              'قم بتنظيم القطاعات، المراحل، والحوشات بشكل ديناميكي (بحد أقصى 3 مستويات)'
            )}
          </p>
        </div>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenAdd(null)}
          sx={{
            borderRadius: 3,
            px: 2.5,
            py: 1.2,
            fontWeight: 800,
            bgcolor: '#16a34a',
            '&:hover': { bgcolor: '#15803d' },
            boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
          }}
        >
          {t('farm.add_root_node', 'إضافة عنصر رئيسي')}
        </Button>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      {/* ── Search ── */}
      <TextField
        fullWidth
        size="small"
        placeholder={t('farm.search_placeholder', 'ابحث في الهيكل...')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
            </InputAdornment>
          ),
          sx: { borderRadius: 3, bgcolor: '#f8fafc', fontSize: '0.875rem' },
        }}
        sx={{ mb: 4 }}
      />

      {/* ── Tree Roots ── */}
      <Card
        sx={{
          borderRadius: 4,
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
          bgcolor: '#fdfdfd',
        }}
      >
        <div className="farm-tree-root p-6">
          {tree.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
              <FarmIcon sx={{ fontSize: 64, mb: 2, opacity: 0.1 }} />
              <p className="font-bold text-sm">
                {t('farm.no_structure', 'لا يوجد هيكل معرف حالياً.')}
              </p>
            </div>
          ) : (
            <div className="children-grid grid-level-root">
              {tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  onAdd={handleOpenAdd}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteClick}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ── Modal ── */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: '#1e293b' }}>
          {editMode ? t('farm.edit_node', 'تعديل العنصر') : t('farm.add_node', 'إضافة عنصر جديد')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {!editMode && UI_ALLOWED_CHILDREN[currentNode?.type || 'ROOT']?.length !== 1 && (
            <TextField
              select
              fullWidth
              label={t('farm.node_type', 'نوع العنصر')}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              InputProps={{ sx: { borderRadius: 2.5 } }}
            >
              {(currentNode ? UI_ALLOWED_CHILDREN[currentNode.type] : [NT.SECTOR, NT.STAGE]).map(
                (type) => (
                  <MenuItem key={type} value={type}>
                    {type === NT.SECTOR
                      ? t('farm.sector', 'قطاع')
                      : type === NT.STAGE
                        ? t('farm.stage', 'مرحلة')
                        : t('farm.enclosure', 'حوشة')}
                  </MenuItem>
                )
              )}
            </TextField>
          )}
          <TextField
            fullWidth
            autoFocus
            label={t('farm.name', 'الاسم')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && form.name && handleSave()}
            InputProps={{ sx: { borderRadius: 2.5 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ fontWeight: 700, color: '#64748b' }}>
            {t('common.cancel', 'إلغاء')}
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={formLoading || !form.name}
            sx={{
              borderRadius: 2.5,
              px: 4,
              fontWeight: 800,
              bgcolor: '#16a34a',
              '&:hover': { bgcolor: '#15803d' },
            }}
          >
            {formLoading ? <CircularProgress size={20} color="inherit" /> : t('common.save', 'حفظ')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        open={confirmOpen}
        title={t('farm.confirm_delete_title', 'تأكيد الحذف')}
        message={t('farm.confirm_delete_node', 'هل أنت متأكد؟ سيتم حذف جميع العناصر التابعة.')}
        confirmText={t('common.delete', 'حذف')}
        cancelText={t('common.cancel', 'إلغاء')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

export default FarmStructure
