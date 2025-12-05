import React, { Suspense } from 'react';
import { Box, CircularProgress, Container } from '@mui/material';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import ManageBookingClient from '@/components/manage/ManageBookingClient';
import Header from '@/components/layout/Header';

interface PageProps {
    params: Promise<{ lang: Locale, token: string }>;
}

export default async function ManagePage({ params }: PageProps) {
    const { lang, token } = await params;
    const dict = await getDictionary(lang);

    return (
        <>
            <Header lang={lang} />
            <Container maxWidth="sm" sx={{ pt: 12, pb: 4 }}>
                <Suspense fallback={<Box display="flex" justifyContent="center"><CircularProgress /></Box>}>
                    <ManageBookingClient token={token} lang={lang} dict={dict} />
                </Suspense>
            </Container>
        </>
    );
}
