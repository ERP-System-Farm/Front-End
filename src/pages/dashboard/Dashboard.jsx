import React, { useState, useEffect } from 'react';
import { Card, Typography, Box, Chip, Grid, useTheme, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFinancialSummary } from '../../features/accounting/services';
import { getEquipmentList } from '../../features/equipment/services';
import { getItems } from '../../features/warehouse/services';
import { useAuth } from '../../app/AuthContext';
import PaymentsIcon    from '@mui/icons-material/Payments';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import WarehouseIcon   from '@mui/icons-material/Warehouse';
import GrassIcon from '@mui/icons-material/Grass';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon  from '@mui/icons-material/TrendingUp';
import TrendingDownIcon  from '@mui/icons-material/TrendingDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { reportsApi } from '../../services/reportsApi';
import { AreaChartCard, BarChartCard, PieChartCard } from '../../components/Charts';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const ModuleCard = ({ title, description, icon: Icon, color, bgColor, path, count }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  return (
    <Card
      onClick={() => navigate(path)}
      sx={{
        cursor: 'pointer',
        border: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        borderColor: 'border.subtle',
        boxShadow: theme.customTokens?.shadows?.subtle || 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 4px 20px ${theme.palette[color.split('.')[0]]?.main || theme.palette.primary.main}20`,
          transform: 'translateY(-3px)',
          '& .module-arrow': { transform: 'translateX(-4px)' },
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            width: 52, height: 52, borderRadius: 2.5,
            bgcolor: bgColor, mb: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon sx={{ color, fontSize: 28 }} />
        </Box>

        <Typography variant="h6" color="text.primary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
          {description}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Chip label={count} size="small" sx={{ bgcolor: bgColor, color, fontWeight: 600 }} />
          <ArrowBackIcon
            className="module-arrow"
            sx={{ color, fontSize: 18, transition: 'transform 0.2s' }}
          />
        </Box>
      </Box>
    </Card>
  );
};

const StatCard = ({ title, value, unit, icon: Icon, color, bgColor, trend, trendUp }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        border: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        borderColor: 'border.subtle',
        boxShadow: theme.customTokens?.shadows?.subtle || 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: `0 4px 20px ${theme.palette[color.split('.')[0]]?.main || theme.palette.primary.main}20`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2.5,
              bgcolor: bgColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Icon sx={{ color, fontSize: 22 }} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1, flexGrow: 1 }}>
          <Typography variant="h4" color="text.primary" fontWeight={800}>
            {value}
          </Typography>
          {unit && (
            <Typography variant="body2" color="text.secondary">{unit}</Typography>
          )}
        </Box>

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {trendUp === true && <TrendingUpIcon sx={{ color: 'success.main', fontSize: 14 }} />}
            {trendUp === false && <TrendingDownIcon sx={{ color: 'error.main', fontSize: 14 }} />}
            <Typography
              variant="caption"
              color={trendUp === true ? 'success.main' : trendUp === false ? 'error.main' : 'text.secondary'}
              fontWeight={600}
            >
              {trend}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [finance, setFinance]       = useState(null);
  const [equipCount, setEquipCount] = useState(0);
  const [itemCount, setItemCount]   = useState(0);
  const [loading, setLoading]       = useState(true);
  const [analytics, setAnalytics]   = useState(null);

  const canViewFinance = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'ACCOUNTANT'].includes(user?.role);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const promises = [getEquipmentList(), getItems()];
        if (canViewFinance) promises.push(getFinancialSummary());
        promises.push(reportsApi.getDashboardAnalytics(), reportsApi.getSmartInsights());
        const results = await Promise.all(promises);
        setEquipCount(results[0]?.length ?? 0);
        setItemCount(results[1]?.length ?? 0);
        if (canViewFinance) setFinance(results[2]);
        setAnalytics({
          ...(results[canViewFinance ? 3 : 2]?.data || {}),
          insights: results[canViewFinance ? 4 : 3]?.data || { alerts: [], suggestions: [] },
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [canViewFinance]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, md: 3 },
        boxSizing: 'border-box',
      }}
    >
      {/* Greeting */}
      <Box
        sx={{
          mb: 4,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" color="text.primary" gutterBottom>
          👋 {t('dashboard.welcome', 'مرحبًا بعودتك')}، <Box component="span" sx={{ color: 'primary.main' }}>{user?.name?.split(' ')[0]}</Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.overview', 'إليك نظرة عامة على عمليات مزرعتك اليوم')}
        </Typography>
        <Chip
          label={`📅 ${new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
          size="small"
          sx={{ mt: 2, bgcolor: 'semanticBg.success', color: 'primary.main', fontWeight: 600 }}
        />
      </Box>

      {/* KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: canViewFinance ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'
          },
          gap: 3,
          mb: 4,
          width: '100%',
        }}
      >
        {canViewFinance && (
          <StatCard
            title={t('dashboard.net_margin', 'صافي الأرباح')}
            value={`$${parseFloat(finance?.net || 0).toLocaleString()}`}
            unit=""
            icon={TrendingUpIcon}
            color="success.main"
            bgColor="semanticBg.success"
            trend={t('dashboard.margin_trend', '+15% عن الشهر الماضي')}
            trendUp={true}
          />
        )}

        <StatCard
          title={t('dashboard.fleet_units', 'وحدات الأسطول النشطة')}
          value={equipCount}
          unit={t('dashboard.unit', 'وحدة')}
          icon={AgricultureIcon}
          color="warning.main"
          bgColor="semanticBg.warning"
          trend={t('dashboard.same_last_month', 'نفس الشهر الماضي')}
          trendUp={null}
        />

        <StatCard
          title={t('dashboard.warehouse_items', 'الإنتاجية')}
          value={Number(analytics?.kpi?.avg_productivity || 0).toFixed(2)}
          unit={t('dashboard.type', 'وحدة/عامل')}
          icon={WarehouseIcon}
          color="info.main"
          bgColor="semanticBg.info"
          trend={t('dashboard.items_trend', 'تحليل لحظي')}
          trendUp={true}
        />
      </Box>

      {/* Quick Actions (Module Cards) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3,
          width: '100%',
        }}
      >
        <ModuleCard
          title={t('sidebar.equipment', 'الأسطول والمعدات')}
          description={t('dashboard.module_desc_equipment', 'إدارة آليات المزرعة والمعدات الزراعية')}
          icon={AgricultureIcon}
          color="info.main"
          bgColor="semanticBg.info"
          path="/equipment"
          count={equipCount > 0 ? `${equipCount} ${t('dashboard.active_unit', 'وحدة نشطة')}` : t('dashboard.no_units', 'لا توجد وحدات')}
        />
        <ModuleCard
          title={t('sidebar.production', 'الإنتاج والمحصول')}
          description={t('dashboard.module_desc_production', 'تتبع الإنتاج الزراعي الموسمي')}
          icon={GrassIcon}
          color="success.main"
          bgColor="semanticBg.success"
          path="/production"
          count={t('dashboard.current_season', 'الموسم الحالي')}
        />
        <ModuleCard
          title={t('sidebar.reports', 'التقارير اليومية')}
          description={t('dashboard.module_desc_reports', 'ملخصات يومية وتقارير العمليات')}
          icon={AssessmentIcon}
          color="warning.main"
          bgColor="semanticBg.warning"
          path="/reports"
          count={t('dashboard.last_updated_today', 'آخر تحديث: اليوم')}
        />
      </Box>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <AreaChartCard
            title="Operations Over Time"
            data={(analytics?.operations_over_time || []).map((r) => ({ name: r.day, value: r.total }))}
            dataKey="value"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <BarChartCard
            title="Workers Usage"
            data={(analytics?.workers_usage || []).map((r) => ({ name: r.operation__name, value: Number(r.company_workers || 0) + Number(r.contractor_workers || 0) }))}
            dataKey="value"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PieChartCard
            title="Cost Analysis by Operation"
            data={(analytics?.costs?.per_operation || []).slice(0, 6).map((r) => ({ name: r.report__operation__name || 'N/A', value: Number(r.total_cost || 0) }))}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%', border: 1, borderColor: 'border.subtle' }}>
            <Typography fontWeight={700} mb={2}>Smart Alerts & Suggestions</Typography>
            {(analytics?.insights?.alerts || []).map((alert, idx) => (
              <Chip key={idx} label={alert.message} color="warning" sx={{ mr: 1, mb: 1 }} />
            ))}
            {(analytics?.insights?.suggestions || []).map((tip, idx) => (
              <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>• {tip}</Typography>
            ))}
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3, border: 1, borderColor: 'border.subtle' }}>
        <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'border.subtle' }}>
          <Typography fontWeight={700}>Operation Table (Excel Style)</Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Operation</TableCell>
              <TableCell align="right">Total Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(analytics?.costs?.per_operation || []).map((row, idx) => (
              <TableRow key={`${row.report__operation__name}-${idx}`}>
                <TableCell>{row.report__operation__name || '-'}</TableCell>
                <TableCell align="right">{Number(row.total_cost || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
};

export default Dashboard;
