import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Avatar, CircularProgress, IconButton, Box, Typography, Grid, Paper, Chip } from '@mui/material';
import { useAuth } from '../../app/AuthContext';
import { useTranslation } from 'react-i18next';
import { injectCMSTranslations } from '../../i18n/index.js';
import SpaIcon      from '@mui/icons-material/Spa';
import ForestIcon   from '@mui/icons-material/Forest';
import LanguageIcon from '@mui/icons-material/Language';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon    from '@mui/icons-material/Email';
import PhoneIcon    from '@mui/icons-material/Phone';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

// ─── Helper: fetch CMS content (unauthenticated) ───────────────────────────
const fetchCMSContent = async () => {
  const response = await fetch('http://localhost:8000/api/auth/public/landing');
  if (!response.ok) throw new Error('CMS fetch failed');
  return response.json();
};

const Landing = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const savedLang = localStorage.getItem('atlas_lang') || 'ar';
    if (i18n.language !== savedLang) i18n.changeLanguage(savedLang);
    document.documentElement.dir  = savedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLang;

    fetchCMSContent()
      .then(data => { if (data) injectCMSTranslations(data); })
      .catch(() => { /* fallback */ })
      .finally(() => setLoading(false));

    return () => window.removeEventListener('scroll', handleScroll);
  }, [i18n]);

  const toggleLanguage = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(next);
    localStorage.setItem('atlas_lang', next);
    document.documentElement.dir  = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'white' }}>
        <CircularProgress sx={{ color: '#16a34a' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'white', color: 'slate.900', overflowX: 'hidden' }}>
      
      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <Box 
        component="nav" 
        sx={{ 
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100,
          transition: 'all 0.3s ease',
          bgcolor: scrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid #f1f5f9' : 'none',
          py: scrolled ? 1.5 : 2.5
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ 
                width: 40, height: 40, bgcolor: '#16a34a', borderRadius: 2, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 16px -4px rgba(22, 163, 74, 0.3)'
              }}>
                <SpaIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: scrolled ? 'slate.800' : 'white' }}>
                Atlas <Box component="span" sx={{ color: '#16a34a' }}>Farm</Box>
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
              {['about', 'palm', 'olive', 'contact'].map((item) => (
                <Typography 
                  key={item} 
                  component="a" 
                  href={`#${item}`}
                  sx={{ 
                    textDecoration: 'none', 
                    color: scrolled ? 'slate.600' : 'rgba(255,255,255,0.8)',
                    fontSize: '0.9rem', 
                    fontWeight: 700,
                    transition: 'color 0.2s',
                    '&:hover': { color: '#16a34a' }
                  }}
                >
                  {t(`nav.${item}`)}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton 
                onClick={toggleLanguage} 
                sx={{ 
                  color: scrolled ? 'slate.600' : 'white', 
                  border: `1px solid ${scrolled ? '#e2e8f0' : 'rgba(255,255,255,0.2)'}`, 
                  borderRadius: 2, px: 1.5 
                }}
              >
                <LanguageIcon fontSize="small" />
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, ml: 1 }}>{isRTL ? 'EN' : 'ع'}</Typography>
              </IconButton>

              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    component={Link} to="/dashboard"
                    sx={{ borderRadius: 2.5, fontWeight: 800, px: 3 }}
                  >
                    {t('nav.dashboard')}
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button 
                    component={Link} to="/login"
                    sx={{ color: scrolled ? 'slate.800' : 'white', fontWeight: 800, px: 2 }}
                  >
                    {t('nav.login')}
                  </Button>
                  <Button 
                    variant="contained" 
                    component={Link} to="/register"
                    sx={{ borderRadius: 2.5, fontWeight: 800, px: 3 }}
                  >
                    {t('nav.register')}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── HERO ────────────────────────────────────────────── */}
      <Box sx={{ 
        position: 'relative', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center',
        bgcolor: '#0f172a',
        overflow: 'hidden'
      }}>
        {/* Hero background with gradient overlays */}
        <Box sx={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(15,23,42,0.90) 30%, rgba(15,23,42,0.80) 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 20% 20%, rgba(22,163,74,0.16), transparent 28%), radial-gradient(circle at 85% 20%, rgba(74,222,128,0.12), transparent 22%), radial-gradient(circle at 50% 80%, rgba(34,197,94,0.15), transparent 20%)',
            opacity: 0.95,
          },
        }} />

        <Container maxWidth="lg" sx={{ relative: 'relative', zIndex: 10, textAlign: 'center', pt: 12 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderRadius: 10, bgcolor: 'rgba(22, 163, 74, 0.15)', border: '1px solid rgba(22, 163, 74, 0.3)', mb: 4 }}>
            <Box sx={{ width: 8, height: 8, bgcolor: '#4ade80', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            <Typography variant="caption" sx={{ color: '#4ade80', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Next-Gen Farm Intelligence
            </Typography>
          </Box>

          <Typography variant="h1" sx={{ 
            fontSize: { xs: '3rem', md: '5rem' }, 
            fontWeight: 900, 
            color: 'white', 
            mb: 3, 
            lineHeight: 1.1,
            letterSpacing: '-0.03em'
          }}>
            {t('landing.hero_title')}
          </Typography>

          <Typography variant="h6" sx={{ 
            color: 'rgba(255,255,255,0.7)', 
            maxWidth: 700, 
            mx: 'auto', 
            mb: 6,
            fontWeight: 500,
            lineHeight: 1.6
          }}>
            {t('landing.hero_text')}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3 }}>
            <Button 
              variant="contained" 
              size="large"
              component={Link} to={user ? '/dashboard' : '/register'}
              endIcon={!isRTL && <ArrowForwardIcon />}
              startIcon={isRTL && <ArrowForwardIcon sx={{ transform: 'rotate(180deg)' }} />}
              sx={{ 
                px: 5, py: 2, borderRadius: 4, fontWeight: 900, fontSize: '1.1rem',
                boxShadow: '0 20px 40px -12px rgba(22, 163, 74, 0.5)'
              }}
            >
              {t('landing.hero_cta')}
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              href="#about"
              sx={{ 
                px: 5, py: 2, borderRadius: 4, fontWeight: 800, fontSize: '1.1rem',
                color: 'white', borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' }
              }}
            >
              {t('nav.about')}
            </Button>
          </Box>
        </Container>

        <Box sx={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', animation: 'bounce 2s infinite', color: 'rgba(255,255,255,0.3)' }}>
          <KeyboardArrowDownIcon fontSize="large" />
        </Box>
      </Box>

      {/* ── ABOUT / STATS ──────────────────────────────────── */}
      <Box id="about" sx={{ py: 15, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="overline" sx={{ color: '#16a34a', fontWeight: 900, letterSpacing: '0.2em' }}>
                {t('landing.about_subtitle')}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, mt: 1, mb: 4, letterSpacing: '-0.02em' }}>
                {t('landing.about_title')}
              </Typography>
              <Typography sx={{ color: 'slate.500', fontSize: '1.1rem', lineHeight: 1.8 }}>
                {t('landing.about_text')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                {[
                  { value: '50+', label: t('landing.about_stat_farms'), color: '#16a34a' },
                  { value: '100K+', label: t('landing.about_stat_trees'), color: '#f59e0b' },
                  { value: '10K+', label: t('landing.about_stat_reports'), color: '#3b82f6' },
                  { value: '24/7', label: 'Monitoring', color: '#8b5cf6' },
                ].map((stat, i) => (
                  <Paper key={i} sx={{ p: 4, borderRadius: 6, border: '1px solid #f1f5f9', boxShadow: 'none', textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: stat.color, mb: 1 }}>{stat.value}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'slate.500' }}>{stat.label}</Typography>
                  </Paper>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── SECTORS ────────────────────────────────────────── */}
      <Box sx={{ py: 15, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={6} id="palm">
              <Paper sx={{ p: 6, borderRadius: 8, height: '100%', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, bgcolor: '#16a34a10', borderRadius: '50%' }} />
                <Chip icon={<SpaIcon />} label={t('landing.palm_label')} sx={{ fontWeight: 900, mb: 3, bgcolor: '#f0fdf4', color: '#16a34a' }} />
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>{t('landing.palm_title')}</Typography>
                <Typography sx={{ color: 'slate.500', mb: 4, lineHeight: 1.7 }}>{t('landing.palm_text')}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {['palm_feature_1','palm_feature_2','palm_feature_3'].map(key => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                      <Typography sx={{ fontWeight: 700, color: 'slate.700' }}>{t(`landing.${key}`)}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6} id="olive">
              <Paper sx={{ p: 6, borderRadius: 8, height: '100%', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, bgcolor: '#f59e0b10', borderRadius: '50%' }} />
                <Chip icon={<ForestIcon />} label={t('landing.olive_label')} sx={{ fontWeight: 900, mb: 3, bgcolor: '#fffbeb', color: '#f59e0b' }} />
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>{t('landing.olive_title')}</Typography>
                <Typography sx={{ color: 'slate.500', mb: 4, lineHeight: 1.7 }}>{t('landing.olive_text')}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {['olive_feature_1','olive_feature_2','olive_feature_3'].map(key => (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CheckCircleIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                      <Typography sx={{ fontWeight: 700, color: 'slate.700' }}>{t(`landing.${key}`)}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── CONTACT ────────────────────────────────────────── */}
      <Box id="contact" sx={{ py: 15, bgcolor: '#0f172a', color: 'white', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2 }}>{t('landing.contact_title')}</Typography>
          <Typography sx={{ color: 'slate.400', mb: 8, fontSize: '1.2rem' }}>{t('landing.contact_subtitle')}</Typography>
          
          <Grid container spacing={3} sx={{ mb: 8 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                <EmailIcon sx={{ fontSize: 40, color: '#16a34a', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>info@atlasfarm.dz</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                <PhoneIcon sx={{ fontSize: 40, color: '#16a34a', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>+213 (0) 5XX XXX XXX</Typography>
              </Box>
            </Grid>
          </Grid>

          <Button 
            variant="contained" 
            size="large"
            component={Link} to="/register"
            sx={{ px: 8, py: 2.5, borderRadius: 4, fontWeight: 900, fontSize: '1.2rem' }}
          >
            {t('landing.contact_cta')}
          </Button>
        </Container>
      </Box>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <Box sx={{ py: 6, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
        <Container>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ width: 32, height: 32, bgcolor: '#16a34a', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SpaIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>Atlas Farm</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'slate.400' }}>
            © {new Date().getFullYear()} Atlas Farm Management. {t('landing.footer_rights')}
          </Typography>
        </Container>
      </Box>

    </Box>
  );
};

export default Landing;
