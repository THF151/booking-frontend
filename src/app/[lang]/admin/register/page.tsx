'use client';

import React, { useState, Suspense } from 'react';
import { Box, Button, TextField, Typography, Paper, Container, Alert } from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';

interface RegisterResponse {
    tenant_id: string;
    admin_username: string;
    admin_secret: string;
}

function RegisterForm() {
    const params = useParams();
    const lang = params.lang as string || 'en';

    const [form, setForm] = useState({ name: '', slug: '' });
    const [result, setResult] = useState<RegisterResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/proxy/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) throw new Error("Failed to create tenant");

            const data: RegisterResponse = await res.json();
            setResult(data);
        } catch (e) {
            console.error(e);
            setError("Failed to create tenant. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ pt: 10 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" fontWeight="bold" mb={3}>Create Tenant</Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {!result ? (
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth label="Company Name" margin="normal" required
                            value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        />
                        <TextField
                            fullWidth label="Slug (URL identifier)" margin="normal" required
                            value={form.slug} onChange={e => setForm({...form, slug: e.target.value})}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mt: 3 }}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </Button>
                    </form>
                ) : (
                    <Box>
                        <Alert severity="success" sx={{ mb: 3 }}>Tenant Created Successfully!</Alert>
                        <Typography variant="body2" color="text.secondary">Tenant ID:</Typography>
                        <Typography fontFamily="monospace" fontWeight="bold" mb={2}>{result.tenant_id}</Typography>

                        <Typography variant="body2" color="text.secondary">Admin User:</Typography>
                        <Typography fontFamily="monospace" fontWeight="bold" mb={2}>{result.admin_username}</Typography>

                        <Typography variant="body2" color="text.secondary">Password (Save this!):</Typography>
                        <Typography fontFamily="monospace" fontWeight="bold" bgcolor="yellow.100" p={1} borderRadius={1} mb={4}>
                            {result.admin_secret}
                        </Typography>

                        <Link href={`/${lang}/admin`} passHref>
                            <Button variant="outlined" fullWidth>Go to Login</Button>
                        </Link>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default function RegisterTenant() {
    const params = useParams();
    const lang = params?.lang as string || 'en';

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Header lang={lang} />
            <RegisterForm />
        </Suspense>
    );
}