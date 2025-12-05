import { NextResponse } from 'next/server';
import dayjs from 'dayjs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const slug = searchParams.get('slug');

    if (!tenantId || !slug) {
        return NextResponse.json({ error: 'Missing tenant or slug' }, { status: 400 });
    }

    const today = dayjs();

    const start = today.add(1, 'day');
    const end = start.add(13, 'day');

    return NextResponse.json({
        allowedStart: start.format('YYYY-MM-DD'),
        allowedEnd: end.format('YYYY-MM-DD')
    });
}