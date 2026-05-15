import { Box, CircularProgress, Typography, Skeleton } from '@mui/material';

export default function LoadingSpinner({ message = 'جاري التحميل...' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        gap: 3,
      }}
    >
      <CircularProgress 
        size={56} 
        thickness={4}
        sx={{ 
          color: '#16a34a',
          '& .MuiCircularProgress-circle': { strokeLinecap: 'round' }
        }} 
      />
      <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {message}
      </Typography>
    </Box>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {[...Array(rows)].map((_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {[...Array(cols)].map((_, j) => (
            <Skeleton 
              key={j} 
              variant="rounded" 
              height={48} 
              sx={{ flexGrow: 1, borderRadius: 2 }} 
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}

export function CardSkeleton() {
  return (
    <Box sx={{ p: 3, border: '1px solid #f1f5f9', borderRadius: 4, bgcolor: 'white' }}>
      <Skeleton variant="circular" width={40} height={40} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={20} />
    </Box>
  );
}
