'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
    Container, Paper, Typography, TextField, Button, Box, Alert, CircularProgress, Stack
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Header from '@/components/layout/Header';
import { Tenant } from '@/types';

interface LoginResponse {
    csrf_token: string;
    user: {
        id: string;
        username: string;
        role: string;
    };
}

function TenantLoginContent() {
    const params = useParams();
    const router = useRouter();
    const lang = params.lang as string || 'en';
    const slug = params.slug as string;

    const { setAuth, isAuthenticated, _hasHydrated } = useAuthStore();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loadingInfo, setLoadingInfo] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loggingIn, setLoggingIn] = useState(false);

    useEffect(() => {
        if (_hasHydrated && isAuthenticated) {
            router.replace(`/${lang}/admin/dashboard`);
        }
    }, [_hasHydrated, isAuthenticated, router, lang]);

    useEffect(() => {
        if (slug) {
            api.get<Tenant>(`/tenants/by-slug/${slug}`)
                .then(setTenant)
                .catch(() => setError("Tenant not found"))
                .finally(() => setLoadingInfo(false));
        }
    }, [slug]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;
        setLoggingIn(true);
        setError(null);

        try {
            const data = await api.post<LoginResponse>('/auth/login', {
                tenant_id: tenant.id,
                username,
                password
            });
            setAuth(tenant.id, data.user, data.csrf_token, tenant.name, tenant.logo_url);
            router.push(`/${lang}/admin/dashboard`);
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message || "Login failed");
            } else {
                setError("Login failed");
            }
        } finally {
            setLoggingIn(false);
        }
    };

    if (loadingInfo) {
        return <Box display="flex" justifyContent="center" mt={20}><CircularProgress /></Box>;
    }

    if (!tenant) {
        return (
            <Container maxWidth="sm" sx={{ mt: 20, textAlign: 'center' }}>
                <Typography variant="h5" color="error">Tenant not found</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="xs" sx={{ pt: 15 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                {tenant.logo_url && (
                    <Box mb={3} display="flex" justifyContent="center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={tenant.logo_url} alt={tenant.name} style={{ maxHeight: 60, maxWidth: '100%' }} />
                    </Box>
                )}
                <Typography variant="h5" fontWeight="bold" mb={1}>
                    {tenant.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Sign in to your dashboard
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>{error}</Alert>}

                <form onSubmit={handleLogin}>
                    <Stack spacing={2}>
                        <TextField
                            label="Username" fullWidth required
                            value={username} onChange={e => setUsername(e.target.value)}
                        />
                        <TextField
                            label="Password" type="password" fullWidth required
                            value={password} onChange={e => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit" variant="contained" size="large" fullWidth
                            disabled={loggingIn}
                        >
                            {loggingIn ? "Signing in..." : "Sign In"}
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
}

export default function TenantLoginPage() {
    const params = useParams();
    const lang = params?.lang as string || 'en';
    return (
        <>
            <Header lang={lang} />
            <Suspense>
                <TenantLoginContent />
            </Suspense>
        </>
    );
}