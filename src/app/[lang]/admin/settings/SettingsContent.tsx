'use client';

import React, { useEffect } from 'react';
import { Container, Typography, Paper, Box, Breadcrumbs, CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import TeamMemberTable from '@/components/admin/TeamMemberTable';
import TenantSettingsForm from '@/components/admin/TenantSettingsForm';
import { Dictionary } from '@/types';

export default function SettingsContent({ lang, dict }: { lang: string, dict: Dictionary }) {
    const { isAuthenticated, _hasHydrated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (_hasHydrated && !isAuthenticated) {
            router.replace(`/${lang}/admin`);
        }
    }, [_hasHydrated, isAuthenticated, router, lang]);

    if (!_hasHydrated || !isAuthenticated) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 10 }}>
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link href={`/${lang}/admin/dashboard`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {dict.admin.dashboard}
                </Link>
                <Typography color="text.primary">{dict.admin.header.settings}</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" mb={4}>{dict.admin.settings.title}</Typography>

            <Paper sx={{ p: 4, mb: 4 }}>
                <TenantSettingsForm lang={lang} dict={dict} />
            </Paper>

            <Paper sx={{ p: 4 }}>
                <TeamMemberTable dict={dict} />
            </Paper>
        </Container>
    );
}