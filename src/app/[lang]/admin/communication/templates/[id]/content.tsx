'use client';

import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Header from '@/components/layout/Header';
import AdminAppBar from '@/components/layout/AdminAppBar';
import { EmailTemplate, Dictionary } from '@/types';
import TemplateEditor from '@/components/admin/communication/TemplateEditor';

export default function TemplateEditorContent({ lang, dict, id }: { lang: string, dict: Dictionary, id: string }) {
    const { tenantId } = useAuthStore();

    const { data: template, isLoading, error } = useQuery({
        queryKey: ['template', tenantId, id],
        queryFn: () => api.get<EmailTemplate>(`/${tenantId}/templates/${id}`),
        enabled: !!tenantId && !!id
    });

    if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress /></Box>;
    if (error || !template) return <Box p={5}>Error loading template: {error?.message}</Box>;

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Suspense fallback={<Box sx={{ height: 40 }} />}>
                <Header lang={lang} />
            </Suspense>
            <AdminAppBar lang={lang} dict={dict} />
            <TemplateEditor template={template} lang={lang} dict={dict} />
        </Box>
    );
}