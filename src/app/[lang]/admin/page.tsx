'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { Button, TextField, Typography, Paper, Container, Stack, Alert, Box, CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface LoginResponse {
    csrf_token: string;
    user: {
        id: string;
        username: string;
        role: string;
    };
}

function AdminLoginForm() {
    const router = useRouter();
    const params = useParams();
    const lang = params?.lang as string || 'en';

    const setAuth = useAuthStore((state) => state.setAuth);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasHydrated = useAuthStore((state) => state._hasHydrated);

    const [form, setForm] = useState({ tenantId: '', username: 'admin', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (hasHydrated && isAuthenticated) {
            router.replace(`/${lang}/admin/dashboard`);
        }
    }, [hasHydrated, isAuthenticated, router, lang]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await api.post<LoginResponse>('/auth/login', {
                tenant_id: form.tenantId,
                username: form.username,
                password: form.password
            });

            setAuth(form.tenantId, data.user, data.csrf_token);
            router.push(`/${lang}/admin/dashboard`);
        } catch (err) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Login failed. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Show a loading spinner while checking authentication state
    if (!hasHydrated || isAuthenticated) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xs" sx={{ pt: 15 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
                    Admin Login
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Tenant ID" fullWidth required
                            value={form.tenantId}
                            onChange={e => setForm({...form, tenantId: e.target.value})}
                        />
                        <TextField
                            label="Username" fullWidth required
                            value={form.username}
                            onChange={e => setForm({...form, username: e.target.value})}
                        />
                        <TextField
                            label="Password" type="password" fullWidth required
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Login"}
                        </Button>
                    </Stack>
                </form>
                <Box mt={3} textAlign="center">
                    <Link href={`/${lang}/admin/register`} className="text-blue-600 text-sm hover:underline">
                        Register new Tenant
                    </Link>
                </Box>
            </Paper>
        </Container>
    );
}

export default function AdminLogin() {
    const params = useParams();
    const lang = params?.lang as string || 'en';

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Header lang={lang} />
            <AdminLoginForm />
        </Suspense>
    );
}