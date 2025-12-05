'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dictionary, Event, Booking, BookingLabel } from '@/types';
import LabelManagerDialog from '@/components/admin/LabelManagerDialog';

import CalendarSidebar from './calendar/CalendarSidebar';
import DailyBookingList from './calendar/DailyBookingList';
import { downloadCSV, downloadExcel, downloadICS, generateExportData, downloadBellaExcel } from '@/lib/exportUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

interface TenantBigCalendarProps {
    dict: Dictionary;
    lang: string;
    events: Event[];
    eventSlug?: string;
}

export default function TenantBigCalendar({ dict, lang, events, eventSlug }: TenantBigCalendarProps) {
    const { tenantId } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [currentTz, setCurrentTz] = useState<string>(dayjs.tz.guess());
    const [labelManagerOpen, setLabelManagerOpen] = useState(false);

    useEffect(() => {
        dayjs.locale(lang);
    }, [lang]);

    const queryKey = eventSlug ? ['bookings', tenantId, eventSlug] : ['bookings', tenantId];
    const apiPath = eventSlug
        ? `/${tenantId}/events/${eventSlug}/bookings`
        : `/${tenantId}/bookings`;

    const { data: bookings = [], isLoading: loading, refetch } = useQuery({
        queryKey: queryKey,
        queryFn: () => api.get<Booking[]>(apiPath),
        enabled: !!tenantId
    });

    const { data: labels = [] } = useQuery({
        queryKey: ['labels', tenantId],
        queryFn: () => api.get<BookingLabel[]>(`/${tenantId}/labels`),
        enabled: !!tenantId
    });

    const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');

    const handleLabelUpdate = async (bookingId: string, labelId: string | null) => {
        try {
            await api.put(`/${tenantId}/bookings/${bookingId}`, { label_id: labelId || "" });
            refetch();
        } catch (e) {
            console.error(e);
        }
    };

    const handleExportICS = () => downloadICS(activeBookings, events, eventSlug);

    const handleExportCSV = () => {
        const exportData = generateExportData(activeBookings, labels, events, currentTz, dict.admin.calendar_tab.unknown_event);
        downloadCSV(exportData);
    };

    const handleExportExcel = () => {
        const exportData = generateExportData(activeBookings, labels, events, currentTz, dict.admin.calendar_tab.unknown_event);
        downloadExcel(exportData);
    };

    const handleExportBella = () => {
        downloadBellaExcel(activeBookings, labels, currentTz);
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            height: { xs: 'auto', md: '100%' },
            minHeight: { xs: 'auto', md: 600 },
            overflow: 'hidden'
        }}>
            <Box sx={{
                width: { xs: '100%', md: 340 },
                flexShrink: 0,
                height: { xs: 'auto', md: '100%' },
                overflowY: { xs: 'visible', md: 'auto' }
            }}>
                <CalendarSidebar
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    currentTz={currentTz}
                    onTzChange={setCurrentTz}
                    activeBookings={activeBookings}
                    loading={loading}
                    onRefresh={() => refetch()}
                    onOpenLabelManager={() => setLabelManagerOpen(true)}
                    onExportICS={handleExportICS}
                    onExportCSV={handleExportCSV}
                    onExportExcel={handleExportExcel}
                    onExportBella={handleExportBella}
                    lang={lang}
                    dict={dict}
                />
            </Box>

            <Box sx={{
                flex: 1,
                minWidth: 0,
                height: { xs: '600px', md: '100%' },
                display: 'flex',
                flexDirection: 'column'
            }}>
                <DailyBookingList
                    selectedDate={selectedDate}
                    bookings={bookings}
                    labels={labels}
                    events={events}
                    currentTz={currentTz}
                    lang={lang}
                    dict={dict}
                    eventSlug={eventSlug}
                    onLabelUpdate={handleLabelUpdate}
                />
            </Box>

            <LabelManagerDialog
                open={labelManagerOpen}
                onClose={() => setLabelManagerOpen(false)}
                labels={labels}
                dict={dict}
            />
        </Box>
    );
}