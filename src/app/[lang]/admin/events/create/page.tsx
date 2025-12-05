import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import EventEditor from '@/components/admin/event-editor/EventEditor';

interface PageProps {
    params: Promise<{ lang: Locale }>;
}

export default async function CreateEventPage({ params }: PageProps) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <Suspense fallback={<Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>}>
            <EventEditor dict={dict} lang={lang} />
        </Suspense>
    );
}