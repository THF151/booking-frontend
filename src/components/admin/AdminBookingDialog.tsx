import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, Box, IconButton,
    Stack, TextField, Button, Typography, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarSelector from '@/components/booking/CalendarSelector';
import TimeSlotList from '@/components/booking/TimeSlotList';
import { Dictionary, Invitee } from '@/types';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
    open: boolean;
    onClose: () => void;
    tenantId: string;
    slug: string;
    eventTimezone: string;
    dict: Dictionary;
    initialDate?: Dayjs | null;
    initialTime?: string | null; // UTC ISO string
    accessMode: string;
}

export default function AdminBookingDialog({
                                               open, onClose, tenantId, slug,
                                               eventTimezone, dict, initialDate, initialTime,
                                               accessMode
                                           }: Props) {
    const queryClient = useQueryClient();

    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(initialDate || null);
    const [selectedTime, setSelectedTime] = useState<string | null>(initialTime || null);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleDateChange = (date: Dayjs | null) => {
        setSelectedDate(date);
        setSelectedTime(null);
    };

    const handleBook = async () => {
        if (!selectedDate || !selectedTime || !name || !email) {
            setError("All fields are required");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            let token = null;

            // If event is restricted, generate a token first for the user
            if (accessMode === 'RESTRICTED') {
                const invitee = await api.post<Invitee>(`/${tenantId}/events/${slug}/invitees`, { email });
                token = invitee.token;
            }

            await api.post(`/${tenantId}/events/${slug}/book`, {
                date: selectedDate.format('YYYY-MM-DD'),
                time: selectedTime,
                name,
                email,
                notes,
                token
            });
            queryClient.invalidateQueries({ queryKey: ['bookings', tenantId, slug] });
            // Also invalidate invitees if we created one
            if (accessMode === 'RESTRICTED') {
                queryClient.invalidateQueries({ queryKey: ['invitees', tenantId, slug] });
            }
            onClose();
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message || "Booking failed");
            } else {
                setError("Booking failed");
            }
        } finally {
            setLoading(false);
        }
    };

    // If initialTime is provided but not selectedTime, sync them (e.g. from session row)
    React.useEffect(() => {
        if (open && initialTime) {
            setSelectedTime(initialTime);
        }
        if (open && initialDate) {
            setSelectedDate(initialDate);
        }
    }, [open, initialDate, initialTime]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {dict.admin.sessions.add_booking}
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ minHeight: { xs: 'auto', md: 450 } }}>
                    {/* Left: Calendar */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* If time is pre-selected (via Session Action), lock calendar/slot view or allow back */}
                        {!selectedTime ? (
                            <CalendarSelector
                                date={selectedDate}
                                onChange={handleDateChange}
                                allowedRange={null}
                                tenantId={tenantId}
                                slug={slug}
                            />
                        ) : (
                            <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
                                <Typography variant="h6" color="primary">Selected Slot</Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {dayjs(selectedTime).tz(eventTimezone).format('DD.MM.YYYY HH:mm')}
                                </Typography>
                                <Button onClick={() => setSelectedTime(null)} sx={{ mt: 2 }}>
                                    Change Slot
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {/* Middle: Slot List (if date selected and time not selected) */}
                    <Box sx={{ width: { xs: '100%', md: 280 }, borderLeft: { md: 1 }, borderTop: { xs: 1, md: 0 }, borderColor: 'divider', pl: { md: 2 }, pt: { xs: 2, md: 0 }, overflowY: 'auto', maxHeight: { xs: 300, md: 'none' } }}>
                        {selectedDate && !selectedTime && (
                            <TimeSlotList
                                selectedDate={selectedDate}
                                onSlotConfirm={setSelectedTime}
                                dict={dict}
                                tenantId={tenantId}
                                slug={slug}
                                userTimezone={eventTimezone}
                            />
                        )}

                        {selectedTime && (
                            <Stack spacing={3} mt={2}>
                                <TextField
                                    label={dict.booking.form.name_label} fullWidth size="small" required
                                    value={name} onChange={e => setName(e.target.value)}
                                />
                                <TextField
                                    label={dict.booking.form.email_label} fullWidth size="small" required type="email"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                />
                                <TextField
                                    label={dict.booking.form.notes_label} fullWidth size="small" multiline rows={3}
                                    value={notes} onChange={e => setNotes(e.target.value)}
                                />
                                <Button variant="contained" fullWidth onClick={handleBook} disabled={loading}>
                                    {loading ? dict.common.loading : dict.common.confirm}
                                </Button>
                            </Stack>
                        )}

                        {!selectedDate && (
                            <Box display="flex" alignItems="center" justifyContent="center" height="100%" py={4}>
                                <Typography variant="body2" color="text.secondary">{dict.booking.calendar_header}</Typography>
                            </Box>
                        )}
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}