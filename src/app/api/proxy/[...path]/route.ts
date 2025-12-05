import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8000';

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const pathString = path.join('/');
    const url = `${BACKEND_URL}/api/v1/${pathString}${request.nextUrl.search}`;

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');

    try {
        const body = request.method !== 'GET' && request.method !== 'HEAD'
            ? await request.text()
            : undefined;

        const backendResponse = await fetch(url, {
            method: request.method,
            headers,
            body,
            cache: 'no-store',
            redirect: 'manual'
        });

        const responseHeaders = new Headers(backendResponse.headers);

        const setCookie = responseHeaders.get('set-cookie');
        if (setCookie) {

            const cookies = 'getSetCookie' in backendResponse.headers && typeof backendResponse.headers.getSetCookie === 'function'
                ? backendResponse.headers.getSetCookie()
                : [setCookie];

            responseHeaders.delete('set-cookie');

            cookies.forEach(cookie => {
                const insecureCookie = cookie.replace(/;\s*Secure/gi, '');
                responseHeaders.append('set-cookie', insecureCookie);
            });
        }

        return new NextResponse(backendResponse.body, {
            status: backendResponse.status,
            statusText: backendResponse.statusText,
            headers: responseHeaders
        });

    } catch (e) {
        console.error("Proxy Error:", e);
        return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
    }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
export const HEAD = proxy;