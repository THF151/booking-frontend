import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import AdminAppBar from '@/components/layout/AdminAppBar';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import SettingsContent from './SettingsContent';

interface PageProps {
    params: Promise<{ lang: Locale }>;
}

export default async function SettingsPage({ params }: PageProps) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <Suspense fallback={<Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>}>
            <AdminAppBar lang={lang} dict={dict} />
            <SettingsContent lang={lang} dict={dict} />
        </Suspense>
    );
}