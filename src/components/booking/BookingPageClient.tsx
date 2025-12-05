'use client';

import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import React, { useState, useEffect } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Box, Paper, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/de';
import { motion, AnimatePresence } from 'framer-motion';

import EventInfoSidebar from '@/components/booking/EventInfoSidebar';
import CalendarSelector from '@/components/booking/CalendarSelector';
import TimeSlotList from '@/components/booking/TimeSlotList';
import UserDetailsForm, { UserDetails } from '@/components/booking/UserDetailsForm';
import TimezoneSelector from '@/components/booking/TimezoneSelector';
import Header from '@/components/layout/Header';
import { Dictionary } from '@/types';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface EventData {
    id: string;
    slug: string;
    title: string;
    description: string;
    duration: string;
    hostName: string;
    imageUrl: string;
    price: string;
    location: string;
    active_start: string;
    active_end: string;
}

interface BookingPageClientProps {
    lang: string;
    dict: Dictionary;
    tenantId: string;
    slug: string;
    accessToken: string;
    eventData: EventData;
    prefilledEmail: string;
}

interface FinalBooking {
    start_time: string;
    end_time: string;
    location?: string;
}

export default function BookingPageClient({
                                              lang, dict, tenantId, slug, accessToken, eventData, prefilledEmail
                                          }: BookingPageClientProps) {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [userTimezone, setUserTimezone] = useState<string>(dayjs.tz.guess());

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successOpen, setSuccessOpen] = useState(false);
    const [finalBooking, setFinalBooking] = useState<FinalBooking | null>(null);

    const allowedRange = {
        start: dayjs(eventData.active_start),
        end: dayjs(eventData.active_end)
    };

    useEffect(() => {
        dayjs.locale(lang);
    }, [lang]);

    const handleDateChange = (newDate: Dayjs | null) => {
        setSelectedDate(newDate);
        setSelectedTime(null);
    };

    const handleSubmission = async (userDetails: UserDetails) => {
        try {
            const payload = {
                date: selectedDate?.format('YYYY-MM-DD'),
                time: selectedTime,
                name: userDetails.name,
                email: userDetails.email,
                notes: userDetails.notes,
                token: accessToken || null
            };

            const res = await fetch(`/api/proxy/${tenantId}/events/${slug}/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Booking failed');
            }

            setFinalBooking(data);
            setSuccessOpen(true);
        } catch (e) {
            if (e instanceof Error) {
                setErrorMsg(e.message);
            } else {
                setErrorMsg('An unknown error occurred');
            }
        }
    };

    const handleCloseSuccess = () => {
        window.open('', '_self', '');
        window.close();
        setSuccessOpen(false);
        window.location.reload();
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang}>
            <CssBaseline />
            <Header lang={lang} />

            <Dialog open={successOpen} maxWidth="sm" fullWidth>
                <Box sx={{ textAlign: 'center', p: 3 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                    <DialogTitle sx={{ p: 0, mb: 1, fontWeight: 'bold' }}>
                        {dict.booking.success_title}
                    </DialogTitle>
                    <DialogContent sx={{ p: 2, mb: 1 }}>
                        <DialogContentText sx={{ mb: 2 }}>
                            {dict.booking.success_msg}
                        </DialogContentText>

                        {finalBooking && (
                            <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 2, textAlign: 'left', display: 'inline-block', width: '100%' }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {dayjs(finalBooking.start_time).tz(userTimezone).format('dddd, D. MMMM YYYY')}
                                </Typography>
                                <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                                    {dayjs(finalBooking.start_time).tz(userTimezone).format('HH:mm')} - {dayjs(finalBooking.end_time).tz(userTimezone).format('HH:mm')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ({userTimezone})
                                </Typography>

                                {finalBooking.location && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        <strong>{dict.booking.location_label}</strong> {finalBooking.location}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: 'center', p: 2 }}>
                        <Button onClick={handleCloseSuccess} variant="contained" size="large" fullWidth>
                            {dict.common.close}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Snackbar
                open={!!errorMsg}
                autoHideDuration={6000}
                onClose={() => setErrorMsg(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setErrorMsg(null)} severity="error" variant="filled">
                    {errorMsg}
                </Alert>
            </Snackbar>

            <Box sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: { xs: 2, md: 4 }
            }}>
                <Paper elevation={0} sx={{
                    width: '100%',
                    maxWidth: 1100,
                    height: { xs: 'auto', md: 730 },
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    boxShadow: '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    bgcolor: 'background.paper'
                }}>
                    <Box sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0, borderRight: { md: '1px solid' }, borderColor: 'divider', p: 3 }}>
                        <EventInfoSidebar
                            hostName={eventData.hostName}
                            eventName={eventData.title}
                            description={eventData.description}
                            duration={eventData.duration}
                            price={eventData.price}
                            location={eventData.location}
                            imageUrl={eventData.imageUrl}
                            conferencingText={dict.booking.conferencing}
                        />
                    </Box>

                    <Box sx={{
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        overflow: 'hidden',
                        bgcolor: 'background.paper'
                    }}>

                        <AnimatePresence mode="wait" initial={false}>
                            {!selectedTime ? (
                                <motion.div
                                    key="calendar-view"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    style={{ width: '100%', height: '100%', display: 'flex' }}
                                >
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: { xs: 'column', md: 'row' },
                                        width: '100%',
                                        height: '100%'
                                    }}>
                                        <Box sx={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            p: { xs: 2, md: 4 },
                                            height: '100%',
                                        }}>
                                            <CalendarSelector
                                                date={selectedDate}
                                                onChange={handleDateChange}
                                                allowedRange={allowedRange}
                                                tenantId={tenantId}
                                                slug={slug}
                                            />

                                            <TimezoneSelector
                                                value={userTimezone}
                                                onChange={setUserTimezone}
                                            />
                                        </Box>
                                        <Box sx={{ width: { xs: '100%', md: selectedDate ? 300 : 0 }, opacity: selectedDate ? 1 : 0, borderLeft: { md: '1px solid' }, borderColor: 'divider', transition: 'all 0.4s' }}>
                                            <Box sx={{ width: { xs: '100%', md: 300 }, height: '100%', p: 3 }}>
                                                <TimeSlotList
                                                    selectedDate={selectedDate}
                                                    onSlotConfirm={setSelectedTime}
                                                    dict={dict}
                                                    tenantId={tenantId}
                                                    slug={slug}
                                                    userTimezone={userTimezone}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form-view"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    style={{ width: '100%', height: '100%' }}
                                >
                                    <Box sx={{ p: 4, height: '100%', overflowY: 'auto' }}>
                                        <UserDetailsForm
                                            selectedIsoTime={selectedTime}
                                            userTimezone={userTimezone}
                                            onBack={() => setSelectedTime(null)}
                                            onSubmit={handleSubmission}
                                            dict={dict}
                                            locale={lang}
                                            initialEmail={prefilledEmail}
                                        />
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </Box>
                </Paper>
            </Box>
        </LocalizationProvider>
    );
}