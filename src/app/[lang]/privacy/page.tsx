import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import Link from 'next/link';
import { getDictionary, Locale } from '@/i18n/dictionaries';

interface PageProps {
    params: Promise<{ lang: Locale }>;
}

export default async function PrivacyPage({ params }: PageProps) {
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    {lang === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy'}
                </Typography>

                <Box sx={{ my: 4, '& h6': { mt: 2, mb: 1, fontWeight: 600 } }}>
                    <Typography variant="body1" paragraph>
                        {lang === 'de'
                            ? 'Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.'
                            : 'We take the protection of your personal data very seriously. We treat your personal data confidentially and in accordance with the statutory data protection regulations and this privacy policy.'}
                    </Typography>

                    <Typography variant="h6">{lang === 'de' ? '1. Datenerfassung' : '1. Data Collection'}</Typography>
                    <Typography variant="body2" paragraph>
                        {lang === 'de'
                            ? 'Die Daten, die Sie im Buchungsformular eingeben (Name, E-Mail-Adresse), werden ausschließlich zur Durchführung des Termins und zur Versendung von Bestätigungs- und Erinnerungs-E-Mails verwendet.'
                            : 'The data you enter in the booking form (name, email address) is used exclusively for conducting the appointment and sending confirmation and reminder emails.'}
                    </Typography>

                    <Typography variant="h6">{lang === 'de' ? '2. Speicherdauer' : '2. Storage Duration'}</Typography>
                    <Typography variant="body2" paragraph>
                        {lang === 'de'
                            ? 'Ihre Daten werden gelöscht, sobald sie für die Erreichung des Zweckes ihrer Erhebung nicht mehr erforderlich sind.'
                            : 'Your data will be deleted as soon as it is no longer necessary to achieve the purpose for which it was collected.'}
                    </Typography>
                </Box>

                <Link href={`/${lang}`} passHref>
                    <Button variant="outlined">
                        {dict.common.back}
                    </Button>
                </Link>
            </Paper>
        </Container>
    );
}