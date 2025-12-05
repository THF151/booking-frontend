'use client';

import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Link from 'next/link';

interface ErrorScreenProps {
    title: string;
    message: string;
    lang: string;
}

export default function ErrorScreen({ title, message, lang }: ErrorScreenProps) {
    return (
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper
                elevation={3}
                sx={{
                    p: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'error.light',
                    color: 'error.main',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    opacity: 0.2
                }}>
                    <ErrorOutlineIcon sx={{ fontSize: 40, opacity: 1, color: 'error.main' }} />
                </Box>

                <Typography variant="h4" fontWeight="700" gutterBottom>
                    {title}
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    {message}
                </Typography>

                <Link href={`/${lang}`} passHref>
                    <Button variant="outlined" size="large">
                        {lang === 'de' ? 'Zur Startseite' : 'Go to Home'}
                    </Button>
                </Link>
            </Paper>
        </Container>
    );
}