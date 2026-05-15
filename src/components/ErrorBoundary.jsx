import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isProd = import.meta.env.PROD;

      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: 'background.default',
          p: 5
        }}>
          <WarningAmberIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" color="text.primary" gutterBottom>
            عذراً، حدث خطأ غير متوقع
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center', maxWidth: 480 }}>
            نواجه مشكلة فنية حالياً. المرجو المحاولة مرة أخرى أو العودة للرئيسية.
            {!isProd && this.state.error && (
              <>
                <br />
                <Typography component="span" variant="caption" sx={{ color: 'error.main' }}>
                  {this.state.error.toString()}
                </Typography>
              </>
            )}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" color="primary" onClick={() => this.setState({ hasError: false, error: null })}>
              إعادة المحاولة
            </Button>
            <Button variant="contained" color="primary" onClick={() => window.location.href = '/'}>
              العودة للرئيسية
            </Button>
          </Box>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
