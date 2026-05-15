import { createTheme } from '@mui/material/styles';

// --- Design Tokens ---
const tokens = {
  spacing: 4, // Multiplier for theme.spacing
  radius: {
    sm: 8,
    md: 10,
    lg: 12,
    xl: 16,
    xxl: 24,
  },
  shadows: {
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    colored: '0 8px 16px rgba(22, 163, 74, 0.25)', // Primary color glow
  },
  motion: {
    hover: 'translateY(-2px)',
    press: 'scale(0.98)',
    duration: '0.2s',
    easing: 'ease-in-out',
  },
  colors: {
    primary: '#16a34a',
    primaryLight: '#4ade80',
    primaryDark: '#15803d',
    secondary: '#78350f',
    secondaryLight: '#b45309',
    secondaryDark: '#451a03',
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    surface: {
      card: '#ffffff',
    },
    border: {
      subtle: '#e2e8f0',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
    },
    semantic: {
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
      info: '#3b82f6',
      successBg: '#f0fdf4',
      warningBg: '#fffbeb',
      errorBg: '#fef2f2',
      infoBg: '#eff6ff',
    }
  },
  typography: {
    fontFamily: '"Cairo", "Outfit", "Inter", "Segoe UI", sans-serif',
    weights: {
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
      extraBold: 800,
    }
  }
};

const baseTheme = createTheme({
  direction: 'rtl', // Default to RTL for Arabic
  spacing: tokens.spacing,
  palette: {
    primary: {
      main: tokens.colors.primary,
      light: tokens.colors.primaryLight,
      dark: tokens.colors.primaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: tokens.colors.secondary,
      light: tokens.colors.secondaryLight,
      dark: tokens.colors.secondaryDark,
      contrastText: '#ffffff',
    },
    success: { main: tokens.colors.semantic.success },
    warning: { main: tokens.colors.semantic.warning },
    error: { main: tokens.colors.semantic.error },
    info: { main: tokens.colors.semantic.info },
    background: {
      default: tokens.colors.background.default,
      paper: tokens.colors.background.paper,
    },
    text: {
      primary: tokens.colors.text.primary,
      secondary: tokens.colors.text.secondary,
      disabled: tokens.colors.text.muted,
    },
    divider: tokens.colors.border.subtle,
    // Custom properties to use in overrides
    surface: tokens.colors.surface,
    border: tokens.colors.border,
    semanticBg: {
      success: tokens.colors.semantic.successBg,
      warning: tokens.colors.semantic.warningBg,
      error: tokens.colors.semantic.errorBg,
      info: tokens.colors.semantic.infoBg,
    }
  },
  typography: {
    fontFamily: tokens.typography.fontFamily,
    h1: { fontWeight: tokens.typography.weights.extraBold, fontSize: '3rem', lineHeight: 1.2 },
    h2: { fontWeight: tokens.typography.weights.extraBold, fontSize: '2.25rem', lineHeight: 1.2 },
    h3: { fontWeight: tokens.typography.weights.bold, fontSize: '1.875rem', lineHeight: 1.3 },
    h4: { fontWeight: tokens.typography.weights.bold, fontSize: '1.5rem', lineHeight: 1.3 },
    h5: { fontWeight: tokens.typography.weights.semiBold, fontSize: '1.25rem', lineHeight: 1.4 },
    h6: { fontWeight: tokens.typography.weights.semiBold, fontSize: '1.125rem', lineHeight: 1.4 },
    body1: { fontWeight: tokens.typography.weights.regular, fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontWeight: tokens.typography.weights.medium, fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontWeight: tokens.typography.weights.medium, fontSize: '0.75rem', lineHeight: 1.5, color: tokens.colors.text.muted },
    button: { textTransform: 'none', fontWeight: tokens.typography.weights.semiBold },
  },
  shape: {
    borderRadius: tokens.radius.lg, // Default radius
  },
  shadows: [
    'none',
    tokens.shadows.subtle,
    tokens.shadows.card,
    tokens.shadows.elevated,
    // Filling the rest of MUI's 25 shadow slots with subtle variants or repeats to avoid breaking standard MUI behavior if explicitly requested.
    ...Array(21).fill(tokens.shadows.card)
  ],
  transitions: {
    duration: {
      standard: 200, // Matching 0.2s
      short: 150,
      shorter: 100,
    },
    easing: {
      easeInOut: tokens.motion.easing,
    }
  },
  customTokens: tokens, // Export tokens for generic use
});

// --- Component Overrides ---
const theme = createTheme(baseTheme, {
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.md,
          padding: `${baseTheme.spacing(2)} ${baseTheme.spacing(4)}`, // 8px 16px
          transition: `all ${tokens.motion.duration} ${tokens.motion.easing}`,
          '&:active': {
            transform: tokens.motion.press,
          },
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: tokens.shadows.colored,
            transform: tokens.motion.hover,
          },
        },
        outlined: {
          borderColor: tokens.colors.border.subtle,
          '&:hover': {
            backgroundColor: tokens.colors.background.default,
            transform: tokens.motion.hover,
          }
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.xl,
          boxShadow: tokens.shadows.card,
          border: `1px solid ${tokens.colors.border.subtle}`,
          backgroundColor: tokens.colors.surface.card,
          transition: `box-shadow ${tokens.motion.duration} ${tokens.motion.easing}, transform ${tokens.motion.duration} ${tokens.motion.easing}`,
          '&:hover': {
             // Optional lift for cards if needed, handled globally via utility or specifically here
          }
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.radius.md,
            backgroundColor: tokens.colors.background.paper,
            transition: `all ${tokens.motion.duration} ${tokens.motion.easing}`,
            '& fieldset': {
              borderColor: tokens.colors.border.subtle,
            },
            '&:hover fieldset': {
              borderColor: tokens.colors.text.muted,
            },
            '&.Mui-focused fieldset': {
              borderColor: tokens.colors.primary,
              borderWidth: '2px',
            },
            '&.Mui-focused': {
              boxShadow: tokens.shadows.subtle,
            }
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.colors.surface.card,
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${tokens.colors.border.subtle}`,
          padding: `${baseTheme.spacing(3)} ${baseTheme.spacing(4)}`, // 12px 16px
          color: tokens.colors.text.primary,
          fontSize: '0.875rem',
        },
        head: {
          fontWeight: tokens.typography.weights.semiBold,
          color: tokens.colors.text.secondary,
          backgroundColor: tokens.colors.background.default,
          borderBottom: `2px solid ${tokens.colors.border.subtle}`,
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: `background-color ${tokens.motion.duration} ${tokens.motion.easing}`,
          '&:hover': {
            backgroundColor: tokens.colors.background.default,
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.sm,
          fontWeight: tokens.typography.weights.semiBold,
        },
        filled: {
          border: 'none',
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.lg,
          padding: `${baseTheme.spacing(3)} ${baseTheme.spacing(4)}`, // 12px 16px
          border: `1px solid ${tokens.colors.border.subtle}`,
        },
        standardSuccess: {
          backgroundColor: tokens.colors.semantic.successBg,
          color: tokens.colors.semantic.success,
          borderColor: `${tokens.colors.semantic.success}40`,
        },
        standardError: {
          backgroundColor: tokens.colors.semantic.errorBg,
          color: tokens.colors.semantic.error,
          borderColor: `${tokens.colors.semantic.error}40`,
        },
        standardWarning: {
          backgroundColor: tokens.colors.semantic.warningBg,
          color: tokens.colors.semantic.warning,
          borderColor: `${tokens.colors.semantic.warning}40`,
        },
        standardInfo: {
          backgroundColor: tokens.colors.semantic.infoBg,
          color: tokens.colors.semantic.info,
          borderColor: `${tokens.colors.semantic.info}40`,
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.radius.xl,
          boxShadow: tokens.shadows.elevated,
          padding: baseTheme.spacing(6), // 24px
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: tokens.colors.text.primary,
          color: tokens.colors.background.paper,
          borderRadius: tokens.radius.sm,
          padding: `${baseTheme.spacing(1)} ${baseTheme.spacing(2)}`, // 4px 8px
          fontSize: '0.75rem',
          fontWeight: tokens.typography.weights.medium,
          boxShadow: tokens.shadows.subtle,
        },
        arrow: {
          color: tokens.colors.text.primary,
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.radius.lg,
          boxShadow: tokens.shadows.elevated,
          border: `1px solid ${tokens.colors.border.subtle}`,
          padding: baseTheme.spacing(1), // 4px padding inside menu
        },
        list: {
          padding: 0,
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.sm,
          padding: `${baseTheme.spacing(2)} ${baseTheme.spacing(3)}`, // 8px 12px
          margin: `0 ${baseTheme.spacing(1)} ${baseTheme.spacing(0.5)} ${baseTheme.spacing(1)}`, // 0 4px 2px 4px
          transition: `all ${tokens.motion.duration} ${tokens.motion.easing}`,
          '&:hover': {
            backgroundColor: tokens.colors.background.default,
          }
        }
      }
    }
  },
});

export default theme;
