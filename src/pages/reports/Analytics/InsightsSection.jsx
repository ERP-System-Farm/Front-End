import React from 'react';
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, ListItemIcon, Divider } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

const InsightsSection = ({ data, t }) => {
  if (!data) return null;

  const insights = [
    {
      title: t('analytics.best_productivity', 'أعلى إنتاجية'),
      value: data.best_productivity?.operation__name || '-',
      subValue: `${data.best_productivity?.productivity?.toFixed(2) || 0} unit/worker`,
      icon: <TrendingUpIcon sx={{ color: '#10b981' }} />,
      color: '#10b981'
    },
    {
      title: t('analytics.worst_productivity', 'أقل إنتاجية'),
      value: data.worst_productivity?.operation__name || '-',
      subValue: `${data.worst_productivity?.productivity?.toFixed(2) || 0} unit/worker`,
      icon: <TrendingDownIcon sx={{ color: '#ef4444' }} />,
      color: '#ef4444'
    },
    {
      title: t('analytics.highest_cost', 'أعلى عملية تكلفة'),
      value: data.highest_cost_operation?.operation__name || '-',
      subValue: `${data.highest_cost_operation?.total_cost?.toLocaleString() || 0} EGP`,
      icon: <MonetizationOnIcon sx={{ color: '#f59e0b' }} />,
      color: '#f59e0b'
    }
  ];

  return (
    <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
          {t('analytics.insights_title', 'رؤى وتحليلات')}
        </Typography>
        <List disablePadding>
          {insights.map((insight, index) => (
            <React.Fragment key={index}>
              <ListItem sx={{ px: 0, py: 2 }}>
                <ListItemIcon sx={{ minWidth: 48 }}>
                  <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: `${insight.color}15`,
                    display: 'flex'
                  }}>
                    {insight.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" color="text.secondary" fontWeight="600">{insight.title}</Typography>}
                  secondary={
                    <Box>
                      <Typography variant="h6" fontWeight="700" color="text.primary">{insight.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{insight.subValue}</Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < insights.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default InsightsSection;
