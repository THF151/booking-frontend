import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import EditEventFetcher from './EditEventFetcher';

interface PageProps {
    params: Promise<{ lang: Locale, slug: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
    const { lang, slug } = await params;
    const dict = await getDictionary(lang);

    return (
        <Suspense fallback={<Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>}>
            <EditEventFetcher slug={slug} dict={dict} lang={lang} />
        </Suspense>
    );
}