'use client';
import { createTheme } from '@mui/material/styles';
import { enUS, deDE } from '@mui/material/locale';

export const saasTheme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'class',
    },
    colorSchemes: {
        light: {
            palette: {
                primary: { main: '#111827' },
                text: { primary: '#111827', secondary: '#6B7280' },
                background: { default: '#F3F4F6', paper: '#FFFFFF' },
                divider: '#E5E7EB',
            }
        },
        dark: {
            palette: {
                primary: { main: '#60a5fa' },
                text: { primary: '#F9FAFB', secondary: '#9CA3AF' },
                background: { default: '#0a0a0a', paper: '#171717' },
                divider: '#262626',
            }
        }
    },
    typography: {
        fontFamily: '"Inter", "Plus Jakarta Sans", sans-serif',
        h5: { fontWeight: 700 },
        h6: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                '*::-webkit-scrollbar': {
                    width: '6px',
                    height: '6px',
                },
                '*::-webkit-scrollbar-track': {
                    background: 'transparent',
                },
                '*::-webkit-scrollbar-thumb': {
                    background: '#D1D5DB',
                    borderRadius: '10px',
                },
                '*::-webkit-scrollbar-thumb:hover': {
                    background: '#9CA3AF',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: { boxShadow: 'none' },
            },
        },
    },
}, enUS, deDE);