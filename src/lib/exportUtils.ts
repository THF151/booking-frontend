import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import * as XLSX from 'xlsx';
import { Booking, BookingLabel, Event } from '@/types';

dayjs.extend(utc);
dayjs.extend(timezone);

export const generateExportData = (
    bookings: Booking[],
    labels: BookingLabel[],
    events: Event[],
    timezone: string,
    dictUnknownEvent: string
) => {
    return bookings.map(booking => {
        const label = labels.find(l => l.id === booking.label_id);
        const start = dayjs(booking.start_time).tz(timezone);
        const end = dayjs(booking.end_time).tz(timezone);

        const event = events.find(e => e.id === booking.event_id);
        const eventTitle = event
            ? (navigator.language.startsWith('de') ? event.title_de : event.title_en)
            : dictUnknownEvent;

        return {
            'Booking ID': booking.id,
            'Event ID': booking.event_id,
            'Event Title': eventTitle,
            'Customer Name': booking.customer_name,
            'Customer Email': booking.customer_email,
            'Status': booking.status,
            'Start Date': start.format('YYYY-MM-DD'),
            'Start Time': start.format('HH:mm'),
            'End Date': end.format('YYYY-MM-DD'),
            'End Time': end.format('HH:mm'),
            'Label': label ? label.name : '',
            'Payout': label ? label.payout : 0,
            'Currency': 'EUR',
            'Note': booking.customer_note || '',
            'Created At': dayjs(booking.created_at).tz(timezone).format('YYYY-MM-DD HH:mm')
        };
    });
};

export const downloadICS = (bookings: Booking[], events: Event[], eventSlug: string | undefined) => {
    const icsContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BookingApp//TenantCalendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'
    ];

    bookings.forEach(booking => {
        if (booking.status === 'CANCELLED') return;

        const start = dayjs(booking.start_time).utc().format('YYYYMMDDTHHmmss[Z]');
        const end = dayjs(booking.end_time).utc().format('YYYYMMDDTHHmmss[Z]');

        const event = events.find(e => e.id === booking.event_id);
        const title = event ? event.title_en : 'Unknown Event';
        const noteStr = booking.customer_note ? `\\nNote: ${booking.customer_note}` : '';

        icsContent.push(
            'BEGIN:VEVENT',
            `UID:${booking.id}`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:${title} - ${booking.customer_name}`,
            `DESCRIPTION:Client: ${booking.customer_name}\\nEmail: ${booking.customer_email}${noteStr}`,
            'END:VEVENT'
        );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    saveFile(blob, `bookings_${eventSlug || 'all'}_${dayjs().format('YYYY-MM-DD')}.ics`);
};

export const downloadCSV = (data: Record<string, unknown>[]) => {
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    saveFile(blob, `bookings_export_${dayjs().format('YYYY-MM-DD')}.csv`);
};

export const downloadExcel = (data: Record<string, unknown>[]) => {
    if (data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);

    const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length, ...data.map(row => (row[key] ? String(row[key]).length : 0))) + 2
    }));
    worksheet['!cols'] = colWidths;

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    saveFile(blob, `bookings_export_${dayjs().format('YYYY-MM-DD')}.xlsx`);
};

const saveFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};