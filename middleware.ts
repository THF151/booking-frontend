import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ['en', 'de'];
const defaultLocale = 'en';

function getLocale(request: NextRequest) {
    const acceptLanguage = request.headers.get('accept-language');
    if (!acceptLanguage) return defaultLocale;
    const preferred = acceptLanguage.split(',')[0].split('-')[0];
    if (locales.includes(preferred)) return preferred;
    return defaultLocale;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) return;

    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
}

export const config = {
    matcher: [
        '/((?!_next|api|favicon.ico|.*\\..*).*)',
    ],
};