'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Event, Dictionary } from '@/types';
import { Box, CircularProgress, Alert } from '@mui/material';
import EventEditor from '@/components/admin/event-editor/EventEditor';

export default function EditEventFetcher({ slug, dict, lang }: { slug: string, dict: Dictionary, lang: string }) {
    const { tenantId } = useAuthStore();

    const { data, isLoading, error } = useQuery({
        queryKey: ['event', tenantId, slug],
        queryFn: () => api.get<Event>(`/${tenantId}/events/${slug}`),
        enabled: !!tenantId
    });

    if (isLoading) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (error) return <Box p={5}><Alert severity="error">Failed to load event: {error.message}</Alert></Box>;
    if (!data) return null;

    return <EventEditor initialData={data} dict={dict} lang={lang} />;
}