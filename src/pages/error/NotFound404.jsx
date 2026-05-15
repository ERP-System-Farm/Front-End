import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ExploreOffIcon from '@mui/icons-material/ExploreOff';

const NotFound404 = () => {
  const navigate = useNavigate();
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" bgcolor="#f8fafc" p={3}>
      <ExploreOffIcon sx={{ fontSize: 100, color: '#94a3b8', mb: 2 }} />
      <Typography variant="h2" fontWeight="900" color="#334155" mb={1}>
        404
      </Typography>
      <Typography variant="h5" fontWeight="bold" color="textPrimary" mb={2}>
        الصفحة غير موجودة
      </Typography>
      <Typography variant="body1" color="textSecondary" mb={4} textAlign="center">
        يبدو أنك تبحث عن مسار غير موجود.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: '10px' }}>
        العودة للوحة التحكم
      </Button>
    </Box>
  );
};

export default NotFound404;
