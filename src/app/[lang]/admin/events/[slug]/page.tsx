import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import EventDetailClient from '@/components/admin/EventDetailClient';

interface PageProps {
    params: Promise<{
        lang: Locale;
        slug: string;
    }>;
}

export default async function EventDetail({ params }: PageProps) {
    const { lang, slug } = await params;
    const dict = await getDictionary(lang);

    return (
        <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        }>
            <EventDetailClient lang={lang} slug={slug} dict={dict} />
        </Suspense>
    );
}