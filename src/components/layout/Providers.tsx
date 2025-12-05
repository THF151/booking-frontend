'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from "@mui/material/styles";
import { saasTheme } from "@/theme/saasTheme";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

interface ProvidersProps {
    children: React.ReactNode;
    lang: string;
}

export default function Providers({ children, lang }: ProvidersProps) {
    useEffect(() => {
        useAuthStore.persist.rehydrate();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={saasTheme}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang}>
                    <CssBaseline />
                    <InitColorSchemeScript attribute="class" />
                    {children}
                </LocalizationProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}