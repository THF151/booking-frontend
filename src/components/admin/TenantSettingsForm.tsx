import React, { useState, useEffect } from 'react';
import {Box, TextField, Button, Typography, Alert, Stack, InputAdornment, IconButton, Divider} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { Tenant, Dictionary } from '@/types';

interface Props {
    lang: string;
    dict: Dictionary;
}

export default function TenantSettingsForm({ lang, dict }: Props) {
    const { tenantId, setTenantInfo } = useAuthStore();
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [aiKey, setAiKey] = useState('');
    const [showAiKey, setShowAiKey] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const t = dict.admin.settings;

    useEffect(() => {
        if (!tenantId) return;
        api.get<Tenant>(`/tenants`).then(t => {
            setName(t.name);
            setSlug(t.slug);
            setLogoUrl(t.logo_url || '');
        }).catch(console.error);
    }, [tenantId]);

    const updateMutation = useMutation({
        mutationFn: (data: { name: string, logo_url: string | null, ai_api_key?: string | null }) =>
            api.put<Tenant>(`/tenants`, data),
        onSuccess: (data: Tenant) => {
            setTenantInfo(data.name, data.logo_url);
            setMsg({ type: 'success', text: t.success });
            setAiKey('');
        },
        onError: (err: Error) => setMsg({ type: 'error', text: err.message || 'Update failed' })
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate({
            name,
            logo_url: logoUrl || null,
            ai_api_key: aiKey || undefined
        });
    };

    const handleCopy = (text: string) => {
        if (text) {
            navigator.clipboard.writeText(text);
            setMsg({ type: 'success', text: t.copied });
            setTimeout(() => setMsg(null), 2000);
        }
    };

    const loginUrl = typeof window !== 'undefined' && slug
        ? `${window.location.origin}/${lang}/admin/login/${slug}`
        : '';

    return (
        <Box component="form" onSubmit={handleSubmit} maxWidth={600}>
            <Typography variant="h6" gutterBottom>{t.general_title}</Typography>

            {msg && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.text}</Alert>}

            <Stack spacing={3}>
                <TextField
                    label={t.tenant_id}
                    value={tenantId || ''}
                    fullWidth
                    slotProps={{
                        input: {
                            readOnly: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => handleCopy(tenantId || '')} edge="end">
                                        <ContentCopyIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }
                    }}
                    variant="filled"
                />

                {loginUrl && (
                    <TextField
                        label={t.login_url}
                        value={loginUrl}
                        fullWidth
                        slotProps={{
                            input: {
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => window.open(loginUrl, '_blank')} edge="end" sx={{ mr: 1 }}>
                                            <OpenInNewIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleCopy(loginUrl)} edge="end">
                                            <ContentCopyIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                        variant="filled"
                        helperText={t.login_url_helper}
                    />
                )}

                <TextField
                    label={t.tenant_name}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    fullWidth
                    required
                />

                <Stack direction="row" spacing={2} alignItems="flex-start">
                    <TextField
                        label={t.logo_url}
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                        fullWidth
                        helperText={t.logo_helper}
                    />
                    {logoUrl && (
                        <Box sx={{ width: 56, height: 56, flexShrink: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logoUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                        </Box>
                    )}
                </Stack>

                <Divider />
                <Typography variant="h6">{t.ai_title}</Typography>

                <TextField
                    label={t.ai_key}
                    type={showAiKey ? 'text' : 'password'}
                    value={aiKey}
                    onChange={e => setAiKey(e.target.value)}
                    fullWidth
                    placeholder={t.ai_placeholder}
                    helperText={t.ai_helper}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowAiKey(!showAiKey)} edge="end">
                                        {showAiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }
                    }}
                />

                <Box>
                    <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? t.saving : t.save_btn}
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
}