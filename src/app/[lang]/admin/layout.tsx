import Providers from "@/components/layout/Providers";
import "@/app/globals.css";
import { Box } from "@mui/material";

export default async function AdminLayout({
                                              children,
                                              params
                                          }: {
    children: React.ReactNode,
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params;

    return (
        <Providers lang={lang}>
            <Box sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                color: 'text.primary',
                transition: 'background-color 0.3s ease'
            }}>
                {children}
            </Box>
        </Providers>
    );
}