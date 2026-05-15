import React, { useEffect, useState } from 'react'

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import SyncAltIcon from '@mui/icons-material/SyncAlt'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import {
  createItem,
  createMovement,
  deleteItem,
  getItems,
  getMovements,
  updateItem,
} from '../../features/warehouse/services'

const InventoryLedger = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [tabValue, setTabValue] = useState(0)

  const [openItemModal, setOpenItemModal] = useState(false)
  const [openMovementModal, setOpenMovementModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [itemForm, setItemForm] = useState({ name: '', category: 'tools' })
  const [editForm, setEditForm] = useState({ id: null, name: '', category: '' })
  const [movementForm, setMovementForm] = useState({ item: '', movement_type: 'IN', quantity: '' })
  const [itemToDelete, setItemToDelete] = useState(null)

  const CATEGORIES = ['tools', 'pesticides', 'fertilizers']

  const fetchData = async () => {
    setLoading(true)
    try {
      const [i, m] = await Promise.all([getItems(), getMovements()])
      setItems(i)
      setMovements(m)
    } catch {
      setError(t('warehouse.error_fetch', 'حدث خطأ أثناء جلب البيانات'))
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateItem = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      await createItem(itemForm)
      setOpenItemModal(false)
      fetchData()
      setItemForm({ name: '', category: 'tools' })
    } catch (err) {
      setFormError(
        Object.values(err.response?.data || {})
          .flat()
          .join(', ') || t('common.error', 'حدث خطأ غير متوقع')
      )
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateItem = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      await updateItem(editForm.id, { name: editForm.name, category: editForm.category })
      setOpenEditModal(false)
      fetchData()
    } catch (err) {
      setFormError(
        Object.values(err.response?.data || {})
          .flat()
          .join(', ') || t('common.error', 'حدث خطأ غير متوقع')
      )
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteItem = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      await deleteItem(itemToDelete.id)
      setOpenDeleteModal(false)
      fetchData()
      setItemToDelete(null)
    } catch (err) {
      setFormError(t('warehouse.error_delete', 'لا يمكن حذف الصنف لوجود حركات مرتبطة به.'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleCreateMovement = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      await createMovement(movementForm)
      setOpenMovementModal(false)
      fetchData()
      setMovementForm({ item: '', movement_type: 'IN', quantity: '' })
    } catch (err) {
      setFormError(
        err.response?.data
          ? Object.values(err.response.data).flat().join(', ')
          : t('common.error', 'حدث خطأ غير متوقع')
      )
    } finally {
      setFormLoading(false)
    }
  }

  const openEdit = (item) => {
    setEditForm({ id: item.id, name: item.name, category: item.category })
    setOpenEditModal(true)
  }

  const openDelete = (item) => {
    setItemToDelete(item)
    setOpenDeleteModal(true)
  }

  const CAT_COLORS = {
    pesticides: { bg: '#fecdd3', color: '#9f1239' },
    fertilizers: { bg: '#dcfce7', color: '#166534' },
    tools: { bg: '#e0f2fe', color: '#075985' },
  }

  const filteredItems = items.filter((item) => item.category === CATEGORIES[tabValue])

  return (
    <div className="p-4 sm:p-8 w-full">
      {/* Header Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 4,
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#f0fdf4',
                borderRadius: 2,
                display: 'flex',
                color: '#16a34a',
              }}
            >
              <Inventory2OutlinedIcon fontSize="medium" />
            </Box>
            {t('warehouse.title', 'إدارة المستودع')}
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mt: 1, fontWeight: 500 }}>
            {t('warehouse.subtitle', 'لوحة التحكم الشاملة للمخزون وحركات السحب والإضافة')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <Button
            fullWidth={isMobile}
            variant="outlined"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setOpenItemModal(true)}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 700,
              borderWidth: 2,
              borderColor: '#e2e8f0',
              color: '#334155',
              '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc', borderWidth: 2 },
            }}
          >
            {t('warehouse.register_item', 'تسجيل صنف جديد')}
          </Button>
          <Button
            fullWidth={isMobile}
            variant="contained"
            startIcon={<SyncAltIcon />}
            onClick={() => setOpenMovementModal(true)}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              fontWeight: 700,
              bgcolor: '#16a34a',
              '&:hover': { bgcolor: '#15803d' },
              boxShadow: '0 4px 14px 0 rgba(22, 163, 74, 0.39)',
            }}
          >
            {t('warehouse.add_movement', 'تسجيل حركة')}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4} sx={{ maxWidth: '1600px', mx: 'auto' }}>
        {/* Stock Matrix with Tabs */}
        <Grid item xs={12}>
          <Card
            sx={{
              p: 0,
              bgcolor: 'white',
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
              <Tabs
                value={tabValue}
                onChange={(e, val) => setTabValue(val)}
                variant="fullWidth"
                TabIndicatorProps={{
                  sx: { height: 3, borderRadius: '3px 3px 0 0', bgcolor: '#16a34a' },
                }}
              >
                <Tab
                  label={t('warehouse.cat_tools', 'المعدات والأدوات')}
                  sx={{ fontWeight: 700, py: 3 }}
                />
                <Tab
                  label={t('warehouse.cat_pesticides', 'المبيدات')}
                  sx={{ fontWeight: 700, py: 3 }}
                />
                <Tab
                  label={t('warehouse.cat_fertilizers', 'الأسمدة')}
                  sx={{ fontWeight: 700, py: 3 }}
                />
              </Tabs>
            </Box>

            {loading ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <CircularProgress sx={{ color: '#16a34a' }} />
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto', minHeight: 400 }}>
                <TableContainer elevation={0}>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'white' }}>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            color: '#64748b',
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            py: 2,
                          }}
                        >
                          {t('warehouse.col_item', 'الصنف')}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            color: '#64748b',
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            py: 2,
                          }}
                        >
                          {t('warehouse.updated_by', 'آخر تعديل')}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 800,
                            color: '#64748b',
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            py: 2,
                          }}
                        >
                          {t('warehouse.col_stock', 'الرصيد')}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 800,
                            color: '#64748b',
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            py: 2,
                          }}
                        >
                          {t('common.actions', 'إجراءات')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 12 }}>
                            <Inventory2OutlinedIcon
                              sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }}
                            />
                            <Typography sx={{ fontWeight: 600, color: '#94a3b8' }}>
                              {t('warehouse.empty_catalog', 'لا توجد أصناف مسجلة في هذا القسم')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((idx) => (
                          <TableRow
                            key={idx.id}
                            hover
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                              transition: 'background-color 0.2s',
                              '&:hover': { bgcolor: '#f8fafc' },
                            }}
                          >
                            <TableCell
                              sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}
                            >
                              {idx.name}
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  color: '#64748b',
                                }}
                              >
                                <PersonOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {idx.updated_by_name || t('warehouse.system', 'النظام')}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={parseFloat(idx.quantity).toLocaleString()}
                                sx={{
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                  bgcolor: '#f0fdf4',
                                  color: '#16a34a',
                                  borderRadius: 2,
                                  px: 1,
                                  border: '1px solid #dcfce7',
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                onClick={() => openEdit(idx)}
                                size="small"
                                sx={{
                                  color: '#64748b',
                                  '&:hover': { color: '#0ea5e9', bgcolor: '#f0f9ff' },
                                }}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                onClick={() => openDelete(idx)}
                                size="small"
                                sx={{
                                  color: '#64748b',
                                  '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' },
                                }}
                              >
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Movements Ledger */}
        <Grid item xs={12}>
          <Card
            sx={{
              p: 0,
              bgcolor: 'white',
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 460,
            }}
          >
            <Box
              sx={{
                p: 3,
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: '#f8fafc',
              }}
            >
              <ReceiptLongOutlinedIcon sx={{ color: '#64748b' }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {t('warehouse.movements_log', 'سجل الحركات')}
              </Typography>
            </Box>
            {loading ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <CircularProgress sx={{ color: '#16a34a' }} />
              </Box>
            ) : (
              <Box
                sx={{
                  overflowX: 'auto',
                  flexGrow: 1,
                  maxHeight: { xs: 400, lg: '600px' },
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '3px' },
                }}
              >
                <TableContainer elevation={0}>
                  <Table stickyHeader size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            color: '#64748b',
                            fontSize: '0.85rem',
                            py: 2.5,
                            bgcolor: 'white',
                            minWidth: 200,
                          }}
                        >
                          {t('warehouse.col_target', 'الصنف')}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 800,
                            color: '#64748b',
                            fontSize: '0.85rem',
                            py: 2.5,
                            bgcolor: 'white',
                            minWidth: 150,
                          }}
                        >
                          {t('warehouse.movement_user', 'بواسطة')}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            color: '#64748b',
                            fontSize: '0.85rem',
                            py: 2.5,
                            bgcolor: 'white',
                            minWidth: 120,
                          }}
                        >
                          {t('warehouse.col_qty', 'الكمية')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {movements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                            <Typography sx={{ fontWeight: 600, color: '#94a3b8' }}>
                              {t('warehouse.no_movements', 'لا توجد حركات مسجلة')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        movements.map((mov, i) => (
                          <TableRow key={mov.id || i} hover>
                            <TableCell>
                              <Typography
                                sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}
                              >
                                {mov.item_name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  color: mov.movement_type === 'IN' ? '#16a34a' : '#ef4444',
                                }}
                              >
                                {mov.movement_type === 'IN'
                                  ? t('warehouse.movement_in', 'وارد')
                                  : t('warehouse.movement_out', 'منصرف')}
                              </Typography>
                            </TableCell>
                            <TableCell
                              sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}
                            >
                              {mov.user_name || t('warehouse.system', 'النظام')}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 900,
                                fontSize: '0.9rem',
                                color: mov.movement_type === 'IN' ? '#16a34a' : '#ef4444',
                              }}
                            >
                              {mov.movement_type === 'IN' ? '+' : '-'}
                              {parseFloat(mov.quantity).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* CREATE ITEM MODAL */}
      <Dialog
        open={openItemModal}
        onClose={() => setOpenItemModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t('warehouse.item_modal_title', 'تسجيل صنف جديد')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            fullWidth
            label={t('warehouse.item_name', 'اسم الصنف')}
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
          />
          <TextField
            select
            fullWidth
            label={t('warehouse.item_category', 'تصنيف الصنف')}
            value={itemForm.category}
            onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
          >
            <MenuItem value="tools">{t('warehouse.cat_tools', 'المعدات والأدوات')}</MenuItem>
            <MenuItem value="pesticides">{t('warehouse.cat_pesticides', 'المبيدات')}</MenuItem>
            <MenuItem value="fertilizers">{t('warehouse.cat_fertilizers', 'الأسمدة')}</MenuItem>
          </TextField>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {t('warehouse.item_note', 'ملاحظة: يتم إضافة الرصيد من خلال شاشة الحركات الواردة.')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenItemModal(false)} sx={{ fontWeight: 700 }}>
            {t('warehouse.cancel', 'إلغاء')}
          </Button>
          <Button
            onClick={handleCreateItem}
            variant="contained"
            disabled={formLoading || !itemForm.name}
            sx={{ borderRadius: 2, px: 4, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}
          >
            {t('warehouse.save', 'حفظ الصنف')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT ITEM MODAL */}
      <Dialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t('warehouse.edit_modal_title', 'تعديل بيانات الصنف')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            fullWidth
            label={t('warehouse.item_name', 'اسم الصنف')}
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextField
            select
            fullWidth
            label={t('warehouse.item_category', 'تصنيف الصنف')}
            value={editForm.category}
            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
          >
            <MenuItem value="tools">{t('warehouse.cat_tools', 'المعدات والأدوات')}</MenuItem>
            <MenuItem value="pesticides">{t('warehouse.cat_pesticides', 'المبيدات')}</MenuItem>
            <MenuItem value="fertilizers">{t('warehouse.cat_fertilizers', 'الأسمدة')}</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenEditModal(false)} sx={{ fontWeight: 700 }}>
            {t('warehouse.cancel', 'إلغاء')}
          </Button>
          <Button
            onClick={handleUpdateItem}
            variant="contained"
            disabled={formLoading || !editForm.name}
            sx={{ borderRadius: 2, px: 4, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}
          >
            {t('warehouse.update', 'تحديث البيانات')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE ITEM MODAL */}
      <Dialog
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ef4444' }}>
          {t('warehouse.delete_modal_title', 'تأكيد الحذف')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Typography sx={{ fontWeight: 600, color: '#334155' }}>
            {t('warehouse.delete_confirm', 'هل أنت متأكد من رغبتك في حذف هذا الصنف النهائي؟')}
          </Typography>
          {itemToDelete && (
            <Typography sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, fontWeight: 700 }}>
              {itemToDelete.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDeleteModal(false)} sx={{ fontWeight: 700 }}>
            {t('warehouse.cancel', 'تراجع')}
          </Button>
          <Button
            onClick={handleDeleteItem}
            variant="contained"
            disabled={formLoading}
            sx={{ borderRadius: 2, px: 4, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
          >
            {t('warehouse.delete', 'حذف نهائي')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MOVEMENT MODAL */}
      <Dialog
        open={openMovementModal}
        onClose={() => setOpenMovementModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {t('warehouse.movement_modal_title', 'تسجيل حركة مستودع')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            select
            fullWidth
            label={t('warehouse.movement_item', 'الصنف المستهدف')}
            value={movementForm.item}
            onChange={(e) => setMovementForm({ ...movementForm, item: e.target.value })}
          >
            {items.map((i) => (
              <MenuItem key={i.id} value={i.id}>
                {i.name} (المتاح: {i.quantity})
              </MenuItem>
            ))}
          </TextField>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label={t('warehouse.movement_type', 'نوع الحركة')}
                value={movementForm.movement_type}
                onChange={(e) =>
                  setMovementForm({ ...movementForm, movement_type: e.target.value })
                }
                sx={{
                  '& .MuiInputBase-input': {
                    color: movementForm.movement_type === 'OUT' ? '#ef4444' : '#16a34a',
                    fontWeight: 800,
                  },
                }}
              >
                <MenuItem value="IN">{t('warehouse.movement_in', 'إضافة وارد (+)')}</MenuItem>
                <MenuItem value="OUT">{t('warehouse.movement_out', 'سحب منصرف (-)')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label={t('warehouse.movement_qty', 'الكمية')}
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenMovementModal(false)} sx={{ fontWeight: 700 }}>
            {t('warehouse.cancel', 'إلغاء')}
          </Button>
          <Button
            onClick={handleCreateMovement}
            variant="contained"
            disabled={formLoading || !movementForm.item || !movementForm.quantity}
            sx={{
              borderRadius: 2,
              px: 4,
              background: movementForm.movement_type === 'IN' ? '#16a34a' : '#ef4444',
            }}
          >
            {t('warehouse.commit_btn', 'تنفيذ الحركة')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
export default InventoryLedger
