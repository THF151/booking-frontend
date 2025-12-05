'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Paper, Alert, CircularProgress, Stack, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { api } from '@/lib/api';
import { Dictionary, Booking, Event } from '@/types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/de';
import CalendarSelector from '@/components/booking/CalendarSelector';
import TimeSlotList from '@/components/booking/TimeSlotList';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
    token: string;
    lang: string;
    dict: Dictionary;
}

interface BookingData {
    booking: Booking;
    event: Event;
}

export default function ManageBookingClient({ token, lang, dict }: Props) {
    const [data, setData] = useState<BookingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const t = dict.manage;

    const [cancelOpen, setCancelOpen] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);

    useEffect(() => {
        dayjs.locale(lang);
    }, [lang]);

    const fetchData = useCallback(() => {
        setLoading(true);
        api.get<BookingData>(`/bookings/manage/${token}`)
            .then(setData)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCancel = async () => {
        setActionLoading(true);
        try {
            await api.post(`/bookings/manage/${token}/cancel`, {});
            setSuccessMsg(t.success_cancelled);
            setCancelOpen(false);
            setData(prev => prev ? ({ ...prev, booking: { ...prev.booking, status: 'CANCELLED' } }) : null);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Cancellation failed";
            alert(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRescheduleConfirm = async (newTimeIso: string) => {
        if (!selectedDate) return;
        setActionLoading(true);
        try {
            await api.post<Booking>(`/bookings/manage/${token}/reschedule`, {
                date: selectedDate.format('YYYY-MM-DD'),
                time: newTimeIso
            });
            setSuccessMsg(t.success_rescheduled);
            setRescheduleOpen(false);
            // Reload data to show new time
            fetchData();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Reschedule failed";
            alert(msg);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!data) return null;

    const { booking, event } = data;
    const tz = event.timezone || 'UTC';
    const start = dayjs(booking.start_time).tz(tz);
    const end = dayjs(booking.end_time).tz(tz);
    const isCancelled = booking.status === 'CANCELLED';

    if (successMsg) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>{successMsg}</Typography>
                {isCancelled && (
                    <Typography color="text.secondary" mb={3}>
                        {t.book_again_msg}
                    </Typography>
                )}
                {!isCancelled && (
                    <Box mt={2}>
                        <Typography variant="subtitle1">{t.new_time_label}</Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                            {start.locale(lang).format('dddd, D. MMMM YYYY, HH:mm')}
                        </Typography>
                        <Button onClick={() => setSuccessMsg(null)} sx={{ mt: 3 }}>{t.back_to_details}</Button>
                    </Box>
                )}
            </Paper>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: 'primary.main', p: 3, color: 'primary.contrastText' }}>
                <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>{t.title}</Typography>
                <Typography variant="h5" fontWeight="bold">{lang === 'de' ? event.title_de : event.title_en}</Typography>
            </Box>

            <Box p={4}>
                {isCancelled && <Alert severity="warning" sx={{ mb: 3 }}>{t.cancelled_alert}</Alert>}

                <Stack spacing={2} mb={4}>
                    <Box display="flex" gap={2} alignItems="center">
                        <CalendarMonthIcon color="action" />
                        <Typography variant="body1" fontWeight="500">
                            {start.locale(lang).format('dddd, D. MMMM YYYY')}
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2} alignItems="center">
                        <AccessTimeIcon color="action" />
                        <Typography variant="body1">
                            {start.format('HH:mm')} - {end.format('HH:mm')} ({tz})
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2} alignItems="center">
                        <LocationOnIcon color="action" />
                        <Typography variant="body1">
                            {booking.location || event.location}
                        </Typography>
                    </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                {!isCancelled && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        {event.allow_customer_reschedule && (
                            <Button
                                variant="outlined"
                                fullWidth
                                size="large"
                                onClick={() => setRescheduleOpen(true)}
                            >
                                {t.reschedule_btn}
                            </Button>
                        )}

                        {event.allow_customer_cancel && (
                            <Button
                                variant="outlined"
                                color="error"
                                fullWidth
                                size="large"
                                startIcon={<CancelIcon />}
                                onClick={() => setCancelOpen(true)}
                            >
                                {t.cancel_btn}
                            </Button>
                        )}
                    </Stack>
                )}

                {(!event.allow_customer_cancel && !event.allow_customer_reschedule && !isCancelled) && (
                    <Typography variant="body2" color="text.secondary" align="center">
                        {t.disabled_msg}
                    </Typography>
                )}
            </Box>

            <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)}>
                <DialogTitle>{t.cancel_dialog_title}</DialogTitle>
                <DialogContent>
                    <Typography>{t.cancel_dialog_desc}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelOpen(false)}>{t.keep_btn}</Button>
                    <Button onClick={handleCancel} color="error" variant="contained" disabled={actionLoading}>
                        {actionLoading ? t.cancelling : t.confirm_cancel_btn}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} maxWidth="md" fullWidth scroll="paper">
                <DialogTitle>{t.reschedule_title}</DialogTitle>
                <DialogContent dividers>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ minHeight: { xs: 'auto', md: 450 } }}>
                        <Box flex={1} display="flex" flexDirection="column" alignItems="center">
                            <CalendarSelector
                                date={selectedDate}
                                onChange={setSelectedDate}
                                allowedRange={{ start: dayjs(event.active_start), end: dayjs(event.active_end) }}
                                tenantId={booking.tenant_id}
                                slug={event.slug}
                            />
                        </Box>
                        <Box width={{ xs: '100%', md: 280 }} sx={{ borderLeft: { md: 1 }, borderTop: { xs: 1, md: 0 }, borderColor: 'divider', pl: { md: 2 }, pt: { xs: 2, md: 0 }, overflowY: 'auto', maxHeight: { xs: 300, md: 'none' } }}>
                            <TimeSlotList
                                selectedDate={selectedDate}
                                onSlotConfirm={handleRescheduleConfirm}
                                dict={dict}
                                tenantId={booking.tenant_id}
                                slug={event.slug}
                                userTimezone={tz}
                            />
                            {!selectedDate && <Box p={2} textAlign="center"><Typography variant="body2" color="text.secondary">{dict.booking.calendar_header}</Typography></Box>}
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRescheduleOpen(false)}>{dict.common.cancel}</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}