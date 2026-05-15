import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper,
  useMediaQuery,
  useTheme 
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

export default function BottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  // Only show on mobile
  if (!isMobile) return null;

  // Determine active tab based on path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/warehouse')) return 1;
    if (path.includes('/accounting')) return 2;
    if (path.includes('/hr')) return 3;
    if (path.includes('/profile') || path.includes('/admin')) return 4;
    return 0; // Dashboard
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        display: { sm: 'none' }, 
        borderTop: '1px solid rgba(0,0,0,0.08)',
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={getActiveTab()}
        sx={{ 
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            padding: '6px 0',
            '&.Mui-selected': { color: '#16a34a' }
          }
        }}
      >
        <BottomNavigationAction
          label="الرئيسية"
          icon={<HomeIcon />}
          onClick={() => navigate('/dashboard')}
        />
        <BottomNavigationAction
          label="المخزون"
          icon={<InventoryIcon />}
          onClick={() => navigate('/warehouse')}
        />
        <BottomNavigationAction
          label="المحاسبة"
          icon={<AccountBalanceIcon />}
          onClick={() => navigate('/accounting')}
        />
        <BottomNavigationAction
          label="الموارد"
          icon={<PeopleIcon />}
          onClick={() => navigate('/hr')}
        />
        <BottomNavigationAction
          label="المزيد"
          icon={<MoreHorizIcon />}
          onClick={() => navigate('/profile')}
        />
      </BottomNavigation>
    </Paper>
  );
}
