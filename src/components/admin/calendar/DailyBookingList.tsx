import React, { useState } from 'react';
import {
    Box, Paper, Typography, Chip, Stack, ToggleButton, ToggleButtonGroup,
    Popover, TextField, Button, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions,
    Menu, MenuItem, Tooltip, IconButton
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs, { Dayjs } from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Dictionary, Booking, BookingLabel, Event } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import BookingListItem from './BookingListItem';

interface DailyBookingListProps {
    selectedDate: Dayjs | null;
    bookings: Booking[];
    labels: BookingLabel[];
    events: Event[];
    currentTz: string;
    lang: string;
    dict: Dictionary;
    eventSlug?: string;
    stampLabelId: string | null;
    onLabelUpdate: (bookingId: string, labelId: string | null) => Promise<void>;
}

const TOKEN_ALPHABET = '12345789ACDEFGHKMNPQSTWXYZ';
const TOKEN_LENGTH = 5;

const generateToken = (existingTokens: Set<string>): string => {
    let token = '';
    let attempts = 0;
    do {
        token = '';
        for (let i = 0; i < TOKEN_LENGTH; i++) {
            token += TOKEN_ALPHABET.charAt(Math.floor(Math.random() * TOKEN_ALPHABET.length));
        }
        attempts++;
    } while (existingTokens.has(token) && attempts < 100);
    return token;
};

export default function DailyBookingList({
                                             selectedDate, bookings, labels, events, currentTz, lang, dict, eventSlug, stampLabelId
                                         }: DailyBookingListProps) {
    const { tenantId } = useAuthStore();
    const queryClient = useQueryClient();

    const [labelMenuAnchor, setLabelMenuAnchor] = useState<null | HTMLElement>(null);
    const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'comfortable' | 'compact'>('comfortable');

    // Token management state
    const [tokenAnchorEl, setTokenAnchorEl] = useState<null | HTMLElement>(null);
    const [activeTokenBooking, setActiveTokenBooking] = useState<Booking | null>(null);
    const [tempToken, setTempToken] = useState('');
    const [snackMsg, setSnackMsg] = useState<string | null>(null);

    // Custom Payout State
    const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
    const [customPayout, setCustomPayout] = useState('');

    const selectedDateStr = selectedDate?.format('YYYY-MM-DD');

    const selectedBookings = bookings
        .filter(b => dayjs(b.start_time).tz(currentTz).format('YYYY-MM-DD') === selectedDateStr)
        .sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf());

    const getEventTitle = (eventId: string) => {
        const evt = events.find(e => e.id === eventId);
        return evt ? (lang === 'de' ? evt.title_de : evt.title_en) : dict.admin.calendar_tab.unknown_event;
    };

    const handleBookingAction = (e: React.MouseEvent, type: 'label' | 'token' | 'delete', booking: Booking) => {
        e.stopPropagation();
        if (type === 'label') {
            setLabelMenuAnchor(e.currentTarget as HTMLElement);
            setActiveBookingId(booking.id);
        } else if (type === 'token') {
            setTokenAnchorEl(e.currentTarget as HTMLElement);
            setActiveTokenBooking(booking);
            setTempToken(booking.token || '');
        } else if (type === 'delete') {
            // Placeholder, actual delete in admin table
        }
    };

    const handleStamp = async (booking: Booking) => {
        if (!stampLabelId) return;
        try {
            await api.put(`/${tenantId}/bookings/${booking.id}`, { label_id: stampLabelId, payout: null });
            if (eventSlug) queryClient.invalidateQueries({ queryKey: ['bookings', tenantId, eventSlug] });
            else queryClient.invalidateQueries({ queryKey: ['bookings', tenantId] });
            setSnackMsg('Label stamped!');
        } catch (e) {
            console.error(e);
            setSnackMsg('Failed to stamp label');
        }
    };

    const handleLabelSelect = (labelId: string | null) => {
        if (activeBookingId) {
            api.put(`/${tenantId}/bookings/${activeBookingId}`, { label_id: labelId || "", payout: null })
                .then(() => {
                    if (eventSlug) queryClient.invalidateQueries({ queryKey: ['bookings', tenantId, eventSlug] });
                    else queryClient.invalidateQueries({ queryKey: ['bookings', tenantId] });
                })
                .catch(console.error);
        }
        setLabelMenuAnchor(null);
        setActiveBookingId(null);
    };

    const handleCustomPayoutOpen = () => {
        setLabelMenuAnchor(null);
        setPayoutDialogOpen(true);
        const booking = bookings.find(b => b.id === activeBookingId);
        if (booking) {
            if (booking.payout !== null && booking.payout !== undefined) {
                setCustomPayout(booking.payout.toString());
            } else if (booking.label_id) {
                const l = labels.find(lb => lb.id === booking.label_id);
                setCustomPayout(l ? l.payout.toString() : '');
            } else {
                setCustomPayout('');
            }
        }
    };

    const handleCustomPayoutSave = async () => {
        if (activeBookingId) {
            try {
                const val = customPayout ? parseInt(customPayout, 10) : null;
                await api.put(`/${tenantId}/bookings/${activeBookingId}`, { payout: val });
                if (eventSlug) queryClient.invalidateQueries({ queryKey: ['bookings', tenantId, eventSlug] });
                else queryClient.invalidateQueries({ queryKey: ['bookings', tenantId] });
            } catch (e) { console.error(e); }
        }
        setPayoutDialogOpen(false);
        setActiveBookingId(null);
        setCustomPayout('');
    };

    const handleTokenClose = () => {
        setTokenAnchorEl(null);
        setActiveTokenBooking(null);
        setTempToken('');
    };

    const handleTokenUpdate = async () => {
        if (!activeTokenBooking || !tenantId) return;
        try {
            await api.put(`/${tenantId}/bookings/${activeTokenBooking.id}`, { token: tempToken || "" });
            if (eventSlug) queryClient.invalidateQueries({ queryKey: ['bookings', tenantId, eventSlug] });
            else queryClient.invalidateQueries({ queryKey: ['bookings', tenantId] });
            handleTokenClose();
            setSnackMsg('Token updated');
        } catch (e) {
            console.error(e);
            setSnackMsg('Failed to update token');
        }
    };

    const handleGenerateToken = () => {
        const existingTokens = new Set(bookings.map(r => r.token).filter(Boolean) as string[]);
        const newToken = generateToken(existingTokens);
        setTempToken(newToken);
    };

    const handleCopyToken = () => {
        navigator.clipboard.writeText(tempToken);
        setSnackMsg('Token copied');
    };

    const activeCount = selectedBookings.filter(b => b.status !== 'CANCELLED').length;

    const listVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    labels.find(l => l.id === stampLabelId)?.color;
    return (
        <Paper
            elevation={0}
            variant="outlined"
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                borderRadius: 3,
                overflow: 'hidden'
            }}
        >
            <Box sx={{
                p: 3,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'background.paper',
                zIndex: 10
            }}>
                <Box>
                    <Typography variant="h5" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
                        {selectedDate?.locale(lang).format('dddd, D. MMMM')}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                        <Chip
                            label={activeCount > 0 ? dict.admin.calendar_tab.busy : dict.admin.calendar_tab.free}
                            color={activeCount > 0 ? "primary" : "default"}
                            size="small"
                            variant={activeCount > 0 ? "filled" : "outlined"}
                            sx={{ fontWeight: 600 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {activeCount} {dict.admin.calendar_tab.appointments_label}
                        </Typography>
                    </Stack>
                </Box>

                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, v) => v && setViewMode(v)}
                    size="small"
                    aria-label="view mode"
                >
                    <ToggleButton value="comfortable" aria-label="comfortable list">
                        <ViewStreamIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="compact" aria-label="compact list">
                        <ViewListIcon fontSize="small" />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: viewMode === 'comfortable' ? 3 : 0, bgcolor: viewMode === 'comfortable' ? 'background.default' : 'background.paper' }}>
                {selectedBookings.length === 0 ? (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        <EventIcon sx={{ fontSize: 64, mb: 2, color: 'text.disabled' }} />
                        <Typography variant="h6" color="text.secondary">{dict.admin.calendar_tab.no_bookings}</Typography>
                    </Box>
                ) : (
                    <Box
                        component={motion.div}
                        variants={listVariants}
                        initial="hidden"
                        animate="show"
                        key={selectedDateStr}
                        sx={{ display: 'flex', flexDirection: 'column', gap: viewMode === 'comfortable' ? 2 : 0 }}
                    >
                        <AnimatePresence mode="wait">
                            {selectedBookings.map((booking) => (
                                <BookingListItem
                                    key={booking.id}
                                    booking={booking}
                                    start={dayjs(booking.start_time).tz(currentTz)}
                                    end={dayjs(booking.end_time).tz(currentTz)}
                                    eventTitle={getEventTitle(booking.event_id)}
                                    labels={labels}
                                    viewMode={viewMode}
                                    isStampMode={!!stampLabelId}
                                    onStamp={handleStamp}
                                    onAction={handleBookingAction}
                                />
                            ))}
                        </AnimatePresence>
                    </Box>
                )}
            </Box>

            <Menu
                anchorEl={labelMenuAnchor}
                open={Boolean(labelMenuAnchor)}
                onClose={() => setLabelMenuAnchor(null)}
                PaperProps={{
                    elevation: 3,
                    sx: { mt: 1, borderRadius: 2, minWidth: 180 }
                }}
            >
                <MenuItem onClick={() => handleLabelSelect(null)}>
                    <Typography color="text.secondary" fontStyle="italic">No Label (Clear)</Typography>
                </MenuItem>
                {labels.map(l => (
                    <MenuItem key={l.id} onClick={() => handleLabelSelect(l.id)} sx={{ gap: 1.5 }}>
                        <Box width={12} height={12} borderRadius="50%" bgcolor={l.color} sx={{ boxShadow: 1 }} />
                        <Box flex={1}>
                            <Typography variant="body2" fontWeight="500">{l.name}</Typography>
                        </Box>
                        {l.payout !== 0 && (
                            <Typography variant="caption" color="success.main" fontWeight="bold">+{l.payout}€</Typography>
                        )}
                    </MenuItem>
                ))}
                <MenuItem onClick={handleCustomPayoutOpen}>
                    <Typography color="primary" fontWeight="bold">Set Custom Payout...</Typography>
                </MenuItem>
            </Menu>

            <Dialog open={payoutDialogOpen} onClose={() => setPayoutDialogOpen(false)}>
                <DialogTitle>Set Custom Payout</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Payout Amount (€)"
                        type="number"
                        fullWidth
                        value={customPayout}
                        onChange={(e) => setCustomPayout(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPayoutDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCustomPayoutSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            <Popover
                open={Boolean(tokenAnchorEl)}
                anchorEl={tokenAnchorEl}
                onClose={handleTokenClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Box p={2} width={280}>
                    <Typography variant="subtitle2" gutterBottom>Manage Token</Typography>
                    <Stack direction="row" spacing={1} mb={2}>
                        <TextField
                            size="small"
                            fullWidth
                            value={tempToken}
                            onChange={(e) => setTempToken(e.target.value)}
                            placeholder="Token"
                        />
                        <Tooltip title="Generate New">
                            <IconButton onClick={handleGenerateToken} size="small" sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                <AutorenewIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                    <Stack direction="row" spacing={1} justifyContent="space-between">
                        <Box>
                            {tempToken && (
                                <Tooltip title="Copy">
                                    <IconButton size="small" onClick={handleCopyToken}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Tooltip title="Clear">
                                <IconButton size="small" color="error" onClick={() => setTempToken('')}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={handleTokenUpdate}
                        >
                            Save
                        </Button>
                    </Stack>
                </Box>
            </Popover>

            <Snackbar
                open={!!snackMsg}
                autoHideDuration={3000}
                onClose={() => setSnackMsg(null)}
                message={snackMsg}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Paper>
    );
}