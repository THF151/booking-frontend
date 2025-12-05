import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import Providers from "@/components/layout/Providers";
import "../globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Orsee++",
    description: "Schedule your meeting",
};

export async function generateStaticParams() {
    return [{ lang: 'en' }, { lang: 'de' }];
}

export default async function RootLayout({
                                             children,
                                             params
                                         }: Readonly<{
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}>) {
    const { lang } = await params;

    return (
        <html lang={lang} suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Init Script must run before hydration */}
        <InitColorSchemeScript attribute="class" />

        <Providers lang={lang}>
            {children}
        </Providers>
        </body>
        </html>
    );
}