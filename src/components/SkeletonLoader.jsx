import React from 'react';
import { Box, Skeleton } from '@mui/material';

export default function SkeletonLoader({ 
  type = 'card', // 'card', 'table', 'list', 'text'
  count = 1,
  height,
  width,
  sx = {}
}) {
  const renderCardSkeleton = () => (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 4, border: 1, borderColor: 'border.subtle', ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Box>
      <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2, mb: 2 }} />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Skeleton variant="rounded" width={100} height={36} />
        <Skeleton variant="rounded" width={100} height={36} />
      </Box>
    </Box>
  );

  const renderTableSkeleton = () => (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, overflow: 'hidden', border: 1, borderColor: 'border.subtle', ...sx }}>
      <Box sx={{ display: 'flex', p: 2, borderBottom: 1, borderColor: 'border.subtle', bgcolor: 'background.default' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={`th-${i}`} variant="text" width="15%" sx={{ mx: 1 }} />
        ))}
      </Box>
      {[1, 2, 3, 4, 5].map((row) => (
        <Box key={`tr-${row}`} sx={{ display: 'flex', p: 2, borderBottom: 1, borderColor: 'border.subtle' }}>
          {[1, 2, 3, 4, 5].map((cell) => (
            <Skeleton key={`td-${row}-${cell}`} variant="text" width="15%" sx={{ mx: 1 }} />
          ))}
        </Box>
      ))}
    </Box>
  );

  const renderListSkeleton = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ...sx }}>
      {Array.from(new Array(count)).map((_, i) => (
        <Box key={`list-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'border.subtle' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="20%" />
          </Box>
        </Box>
      ))}
    </Box>
  );

  const renderTextSkeleton = () => (
    <Box sx={{ ...sx }}>
      {Array.from(new Array(count)).map((_, i) => (
        <Skeleton key={`text-${i}`} variant="text" width={width || (i % 2 === 0 ? '100%' : '80%')} height={height || 24} />
      ))}
    </Box>
  );

  switch (type) {
    case 'card':
      return <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {Array.from(new Array(count)).map((_, i) => <React.Fragment key={i}>{renderCardSkeleton()}</React.Fragment>)}
      </Box>;
    case 'table':
      return renderTableSkeleton();
    case 'list':
      return renderListSkeleton();
    case 'text':
    default:
      return renderTextSkeleton();
  }
}
