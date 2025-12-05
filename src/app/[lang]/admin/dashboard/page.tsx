import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import DashboardClient from '@/components/admin/DashboardClient';

interface PageProps {
    params: Promise<{ lang: Locale }>;
}

export default async function Dashboard({ params }: PageProps) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        }>
            <DashboardClient lang={lang} dict={dict} />
        </Suspense>
    );
}