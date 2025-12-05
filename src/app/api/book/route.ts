import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();

    console.log("==========================================");
    console.log("BACKEND MOCK: Booking Received");
    console.log("------------------------------------------");
    console.log("Tenant ID:   ", body.tenantId);
    console.log("Event Slug:  ", body.slug);
    console.log("Access Token:", body.accessToken);
    console.log("------------------------------------------");
    console.log("Date:        ", body.date);
    console.log("Time:        ", body.time);
    console.log("Locale:      ", body.locale);
    console.log("User Details:", JSON.stringify(body.userDetails, null, 2));
    console.log("==========================================");

    if (!body.accessToken || body.accessToken !== 'valid-token') {
        console.warn("WARNING: Invalid or missing access token");
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ success: true, bookingId: 'SAAS-BOOK-999' });
}