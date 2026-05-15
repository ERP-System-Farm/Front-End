import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

export default function EmptyState({ 
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي نتائج في الوقت الحالي.',
  actionText,
  onAction,
  icon: Icon = InboxIcon
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        bgcolor: 'background.default',
        borderRadius: 4, // equivalent to 16px
        border: 2,
        borderStyle: 'dashed',
        borderColor: 'border.subtle',
        gap: 2,
        maxWidth: 400,
        mx: 'auto'
      }}
    >
      <Box sx={{ 
        bgcolor: 'background.paper', 
        p: 2, 
        borderRadius: '50%', 
        boxShadow: (theme) => theme.customTokens.shadows.subtle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 1
      }}>
        <Icon sx={{ fontSize: 48, color: 'text.disabled' }} />
      </Box>
      <Box>
        <Typography variant="h6" color="text.primary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      </Box>
      {actionText && onAction && (
        <Button 
          variant="contained" 
          onClick={onAction}
          sx={{ mt: 1 }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
}
