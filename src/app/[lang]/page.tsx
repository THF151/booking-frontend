import { Box, Typography, Container } from "@mui/material";

interface PageProps {
    params: Promise<{ lang: string }>;
}

export default async function Home({ params }: PageProps) {
    await params;

    return (
        <Container maxWidth="md">
            <Box sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                textAlign: 'center'
            }}>
                <Typography variant="h2" component="h1" fontWeight="700">
                    Orsee++
                </Typography>
                <Typography variant="h5" color="text.secondary">
                    Scheduling Appointments.
                </Typography>
            </Box>
        </Container>
    );
}