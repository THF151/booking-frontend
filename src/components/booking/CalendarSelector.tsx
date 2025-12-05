import React, { useState } from 'react';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface CalendarSelectorProps {
    date: Dayjs | null;
    onChange: (date: Dayjs | null) => void;
    allowedRange: { start: Dayjs, end: Dayjs } | null;
    tenantId: string;
    slug: string;
}

export default function CalendarSelector({ date, onChange, allowedRange, tenantId, slug }: CalendarSelectorProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [currentMonth, setCurrentMonth] = useState<Dayjs>(date || dayjs());

    const startOfMonth = currentMonth.clone().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
    const endOfMonth = currentMonth.clone().add(1, 'month').endOf('month').format('YYYY-MM-DD');

    const { data: availableDates = [], isLoading } = useQuery({
        queryKey: ['availableDates', tenantId, slug, startOfMonth, endOfMonth],
        queryFn: () => api.get<string[]>(`/${tenantId}/events/${slug}/dates?start=${startOfMonth}&end=${endOfMonth}`),
    });

    const shouldDisableDate = (day: Dayjs) => {
        if (allowedRange) {
            if (day.isBefore(allowedRange.start, 'day') || day.isAfter(allowedRange.end, 'day')) {
                return true;
            }
        }
        const dateStr = day.format('YYYY-MM-DD');
        return !availableDates.includes(dateStr);
    };

    return (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', '& .MuiDateCalendar-root': { width: '100%', height: 'auto', maxHeight: 'none' }, '& .MuiDayCalendar-monthContainer': { position: 'relative', minHeight: isMobile ? 240 : 320 }, '& .MuiDayCalendar-slideTransition': { minHeight: isMobile ? 240 : 320, height: isMobile ? 240 : 320 } }}>
            <DateCalendar
                value={date}
                onChange={onChange}
                onMonthChange={setCurrentMonth}
                disablePast
                shouldDisableDate={shouldDisableDate}
                loading={isLoading}
                views={['day']}
                showDaysOutsideCurrentMonth={false}
            />
        </Box>
    );
}