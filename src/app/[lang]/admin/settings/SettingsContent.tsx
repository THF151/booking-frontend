'use client';

import React, { useEffect } from 'react';
import { Container, Typography, Paper, Box, Breadcrumbs, CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import TeamMemberTable from '@/components/admin/TeamMemberTable';
import TenantSettingsForm from '@/components/admin/TenantSettingsForm';

export default function SettingsContent({ lang }: { lang: string }) {
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
                <Link href={`/${lang}/admin/dashboard`} style={{ textDecoration: 'none', color: 'inherit' }}>Dashboard</Link>
                <Typography color="text.primary">Settings</Typography>
            </Breadcrumbs>

            <Typography variant="h4" fontWeight="bold" mb={4}>Settings & Team</Typography>

            <Paper sx={{ p: 4, mb: 4 }}>
                <TenantSettingsForm lang={lang} />
            </Paper>

            <Paper sx={{ p: 4 }}>
                <TeamMemberTable />
            </Paper>
        </Container>
    );
}