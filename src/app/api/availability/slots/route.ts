import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const tenantId = searchParams.get('tenantId');
    const slug = searchParams.get('slug');

    if (!date || !tenantId || !slug) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const dayOfMonth = parseInt(date.split('-')[2], 10);
    let slots = [];

    if (dayOfMonth % 2 === 0) {
        slots = ['09:00', '09:30', '10:00', '10:45', '11:15'];
    } else {
        slots = ['13:00', '13:30', '14:15', '15:00', '16:45'];
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({ slots });
}