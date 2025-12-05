import React from 'react';
import { Box, Button, Typography, Stack, Fade, CircularProgress } from '@mui/material';
import { Dayjs } from 'dayjs';
import { Dictionary } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface TimeSlotListProps {
    selectedDate: Dayjs | null;
    onSlotConfirm: (time: string) => void;
    dict: Dictionary;
    tenantId: string;
    slug: string;
    userTimezone: string;
}

interface SlotsResponse {
    date: string;
    slots: string[];
}

export default function TimeSlotList({ selectedDate, onSlotConfirm, dict, tenantId, slug, userTimezone }: TimeSlotListProps) {
    const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

    const dateStr = selectedDate ? selectedDate.format('YYYY-MM-DD') : '';

    const { data, isLoading, isError } = useQuery({
        queryKey: ['slots', tenantId, slug, dateStr],
        queryFn: () => api.get<SlotsResponse>(`/${tenantId}/events/${slug}/slots?date=${dateStr}`),
        enabled: !!selectedDate,
    });

    const slots = data?.slots || [];

    if (!selectedDate) return null;

    const displayDateStr = selectedDate.format('dddd, MMMM D');

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Box sx={{ mb: 2, px: 1, flexShrink: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>{dict.booking.available_times}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>{displayDateStr}</Typography>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', px: 1, pb: 2, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { background: '#D1D5DB', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb:hover': { background: '#9CA3AF' } }}>
                {isLoading ? (
                    <Box display="flex" justifyContent="center" mt={4}><CircularProgress size={24} /></Box>
                ) : isError ? (
                    <Typography variant="body2" color="error" align="center" sx={{ mt: 4 }}>Could not load slots.</Typography>
                ) : (
                    <Stack spacing={1.5}>
                        {slots.length === 0 && <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>No slots available.</Typography>}
                        {slots.map((utcIsoString) => {
                            const isSelected = selectedTime === utcIsoString;
                            const localTime = dayjs(utcIsoString).tz(userTimezone);
                            const timeLabel = localTime.format('HH:mm');

                            return (
                                <Box key={utcIsoString}>
                                    {isSelected ? (
                                        <Fade in={true} timeout={300}>
                                            <Stack direction="row" spacing={1}>
                                                <Button variant="outlined" fullWidth onClick={() => setSelectedTime(null)} sx={{ py: 1.5, bgcolor: 'background.paper', border: 'none', color: 'text.secondary', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', '&:hover': { bgcolor: 'action.hover', border: 'none' } }}>{dict.common.back}</Button>
                                                <Button variant="contained" fullWidth onClick={() => onSlotConfirm(utcIsoString)} sx={{ py: 1.5 }}>{dict.common.confirm}</Button>
                                            </Stack>
                                        </Fade>
                                    ) : (
                                        <Button variant="outlined" fullWidth onClick={() => setSelectedTime(utcIsoString)} sx={{ py: 1.5, fontWeight: 600, color: 'primary.main', borderColor: 'divider', backgroundColor: 'background.paper', '&:hover': { borderColor: 'primary.main', borderWidth: 1, bgcolor: 'action.hover' } }}>{timeLabel}</Button>
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}