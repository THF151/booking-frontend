import { getDictionary, Locale } from '@/i18n/dictionaries';
import BookingPageClient from '@/components/booking/BookingPageClient';
import ErrorScreen from '@/components/common/ErrorScreen';

interface PageProps {
    params: Promise<{
        lang: Locale;
        tenantId: string;
        slug: string;
    }>;
    searchParams: Promise<{
        accessToken?: string;
    }>;
}

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:8000';

export default async function BookingPage({ params, searchParams }: PageProps) {
    const { lang, tenantId, slug } = await params;
    const { accessToken } = await searchParams;
    const dict = await getDictionary(lang);

    const tokenParam = accessToken ? `?token=${accessToken}` : '';
    const apiUrl = `${BACKEND_URL}/api/v1/${tenantId}/events/${slug}${tokenParam}`;

    let eventDataRaw = null;
    let errorData = null;

    try {
        console.log(`[SSR] Fetching event data from: ${apiUrl}`);
        const res = await fetch(apiUrl, { cache: 'no-store' });

        if (!res.ok) {
            console.error(`[SSR] Error ${res.status}: ${res.statusText}`);
            errorData = {
                status: res.status,
                data: await res.json().catch(() => ({}))
            };
        } else {
            eventDataRaw = await res.json();
        }
    } catch (e) {
        console.error("[SSR] Fetch failed entirely:", e);
        errorData = { status: 500 };
    }

    if (errorData) {
        let title = "Oops!";
        let message = "Something went wrong.";

        if (errorData.status === 404) {
            title = lang === 'de' ? "Event nicht gefunden" : "Event Not Found";
            message = lang === 'de' ? "Das gesuchte Event existiert nicht." : "The event does not exist.";
        } else if (errorData.status === 403) {
            title = lang === 'de' ? "Zugriff verweigert" : "Access Denied";
            message = lang === 'de' ? "Dieses Event ist eingeschränkt oder geschlossen." : "This event is restricted or closed.";
        } else if (errorData.status === 409) {
            title = lang === 'de' ? "Link bereits verwendet" : "Link Already Used";
            message = lang === 'de'
                ? "Dieser Einladungslink wurde bereits für eine Buchung verwendet."
                : "This invitation link has already been used for a booking.";
        }

        return <ErrorScreen title={title} message={message} lang={lang} />;
    }

    const isDe = lang === 'de';
    const eventData = {
        id: eventDataRaw.id,
        slug: eventDataRaw.slug,
        title: isDe ? eventDataRaw.title_de : eventDataRaw.title_en,
        description: isDe ? eventDataRaw.desc_de : eventDataRaw.desc_en,
        duration: `${eventDataRaw.duration_min} min`,
        hostName: eventDataRaw.host_name || "Dr. Privacy",
        imageUrl: eventDataRaw.image_url,
        price: eventDataRaw.payout,
        location: eventDataRaw.location,
        active_start: eventDataRaw.active_start,
        active_end: eventDataRaw.active_end,
    };

    const prefilledEmail = eventDataRaw.invitee_email || '';

    return (
        <BookingPageClient
            lang={lang}
            dict={dict}
            tenantId={tenantId}
            slug={slug}
            accessToken={accessToken || ''}
            eventData={eventData}
            prefilledEmail={prefilledEmail}
        />
    );
}