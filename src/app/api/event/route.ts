import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const slug = searchParams.get('slug');
    const accessToken = searchParams.get('accessToken');
    const locale = searchParams.get('locale') || 'en';

    if (!tenantId || !slug) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!accessToken || accessToken !== 'valid-token') {
        return NextResponse.json({ error: 'Invalid or missing Access Token' }, { status: 403 });
    }

    if (tenantId === 'acme-corp' && slug === 'strategy-session') {

        const isDe = locale === 'de';

        const data = {
            title: isDe ? 'Strategieplanung Q4' : 'Strategy Planning Q4',
            description: isDe
                ? 'Eine intensive Sitzung zur Planung des nächsten Quartals. Wir besprechen Ziele, Budget und Personal.'
                : 'An intensive session to plan the upcoming quarter. We will discuss goals, budget, and staffing.',
            duration: '45 min',
            hostName: isDe ? 'Dr. Datenschutz' : 'Dr. Privacy',
            imageUrl: "https://www.win.kit.edu/img/win_logo_en.jpg",

            price: isDe ? '150,00 €' : '$150.00',
            location: isDe ? 'Berlin Hauptquartier (Raum A)' : 'Berlin HQ (Room A)'
        };

        await new Promise(resolve => setTimeout(resolve, 200));

        return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
}