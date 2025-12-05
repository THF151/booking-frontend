import React, { useState } from 'react';
import {
    Box, Paper, Typography, Chip, Stack, IconButton, Menu, MenuItem, Tooltip, ToggleButton, ToggleButtonGroup,
    Popover, TextField, Button, Snackbar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CommentIcon from '@mui/icons-material/Comment';
import LabelIcon from '@mui/icons-material/Label';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs, { Dayjs } from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Dictionary, Booking, BookingLabel, Event } from '@/types';
import LabelBadge from '@/components/admin/LabelBadge';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface DailyBookingListProps {
    selectedDate: Dayjs | null;
    bookings: Booking[];
    labels: BookingLabel[];
    events: Event[];
    currentTz: string;
    lang: string;
    dict: Dictionary;
    eventSlug?: string;
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
                                             selectedDate, bookings, labels, events, currentTz, lang, dict, eventSlug, onLabelUpdate
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

    const selectedDateStr = selectedDate?.format('YYYY-MM-DD');

    const selectedBookings = bookings
        .filter(b => dayjs(b.start_time).tz(currentTz).format('YYYY-MM-DD') === selectedDateStr)
        .sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf());

    const getEventTitle = (eventId: string) => {
        const evt = events.find(e => e.id === eventId);
        return evt ? (lang === 'de' ? evt.title_de : evt.title_en) : dict.admin.calendar_tab.unknown_event;
    };

    const handleLabelClick = (event: React.MouseEvent<HTMLElement>, id: string) => {
        event.stopPropagation();
        setLabelMenuAnchor(event.currentTarget);
        setActiveBookingId(id);
    };

    const handleLabelSelect = (labelId: string | null) => {
        if (activeBookingId) {
            onLabelUpdate(activeBookingId, labelId);
        }
        setLabelMenuAnchor(null);
        setActiveBookingId(null);
    };

    // Token Handlers
    const handleTokenClick = (event: React.MouseEvent<HTMLElement>, booking: Booking) => {
        event.stopPropagation();
        setTokenAnchorEl(event.currentTarget);
        setActiveTokenBooking(booking);
        setTempToken(booking.token || '');
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

            // Invalidate queries to refresh data
            if (eventSlug) {
                queryClient.invalidateQueries({ queryKey: ['bookings', tenantId, eventSlug] });
            }
            queryClient.invalidateQueries({ queryKey: ['bookings', tenantId] });

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
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

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
                            {selectedBookings.map((booking) => {
                                const start = dayjs(booking.start_time).tz(currentTz);
                                const end = dayjs(booking.end_time).tz(currentTz);
                                const isCancelled = booking.status === 'CANCELLED';
                                const label = labels.find(l => l.id === booking.label_id);

                                if (viewMode === 'compact') {
                                    return (
                                        <Box
                                            component={motion.div}
                                            variants={itemVariants}
                                            key={booking.id}
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: '80px 1fr auto auto auto',
                                                alignItems: 'center',
                                                gap: 2,
                                                p: 1.5,
                                                borderBottom: '1px solid',
                                                borderColor: 'divider',
                                                opacity: isCancelled ? 0.5 : 1,
                                                bgcolor: 'background.paper',
                                                '&:hover': { bgcolor: 'action.hover' },
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <Typography variant="body2" fontFamily="monospace" fontWeight="600" color="text.secondary">
                                                {start.format('HH:mm')}
                                            </Typography>

                                            <Box>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography variant="body2" fontWeight="600" sx={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                                        {booking.customer_name}
                                                    </Typography>
                                                    {isCancelled && <Chip label="CANCELLED" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />}
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {getEventTitle(booking.event_id)}
                                                </Typography>
                                            </Box>

                                            <Box
                                                onClick={(e) => handleTokenClick(e, booking)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    bgcolor: booking.token ? 'action.selected' : 'transparent',
                                                    px: 1, py: 0.5, borderRadius: 1,
                                                    '&:hover': { bgcolor: 'action.hover' }
                                                }}
                                            >
                                                {booking.token ? (
                                                    <Typography variant="caption" fontFamily="monospace" fontWeight="bold" color="primary.main">
                                                        {booking.token}
                                                    </Typography>
                                                ) : (
                                                    <ConfirmationNumberIcon fontSize="small" color="action" sx={{ fontSize: 18, opacity: 0.5 }} />
                                                )}
                                            </Box>

                                            <Box display="flex" alignItems="center" gap={1}>
                                                {booking.customer_note && (
                                                    <Tooltip title={booking.customer_note}>
                                                        <CommentIcon fontSize="small" color="action" sx={{ fontSize: 16 }} />
                                                    </Tooltip>
                                                )}
                                            </Box>

                                            <Box onClick={(e) => handleLabelClick(e, booking.id)} sx={{ cursor: 'pointer', minWidth: 80, display: 'flex', justifyContent: 'flex-end' }}>
                                                {booking.label_id ? (
                                                    <LabelBadge labelId={booking.label_id} labels={labels} size="small" />
                                                ) : (
                                                    <LabelIcon fontSize="small" color="action" sx={{ opacity: 0.3, '&:hover': { opacity: 1 } }} />
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                }

                                return (
                                    <Paper
                                        component={motion.div}
                                        variants={itemVariants}
                                        key={booking.id}
                                        elevation={0}
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderLeft: '4px solid',
                                            borderLeftColor: isCancelled ? 'error.main' : 'primary.main',
                                            opacity: isCancelled ? 0.7 : 1,
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                borderLeftColor: isCancelled ? 'error.main' : 'primary.main',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                transform: 'translateY(-1px)'
                                            },
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                                            <Box>
                                                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                                                    <Typography variant="h6" fontSize="1.1rem" fontWeight="700" sx={{ textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                                        {booking.customer_name}
                                                    </Typography>
                                                    {isCancelled && <Chip label="CANCELLED" size="small" color="error" variant="filled" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }} />}
                                                    {booking.label_id && (
                                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>
                                                            <LabelBadge labelId={booking.label_id} labels={labels} />
                                                            {label?.payout !== undefined && label.payout !== 0 && (
                                                                <Typography variant="caption" color="success.main" fontWeight="800">
                                                                    +{label.payout}€
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    )}
                                                </Stack>

                                                <Stack spacing={0.5}>
                                                    <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                                                        <EventIcon sx={{ fontSize: 16 }} />
                                                        <Typography variant="body2" fontWeight="500">{getEventTitle(booking.event_id)}</Typography>
                                                    </Box>
                                                    <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                                                        <PersonIcon sx={{ fontSize: 16 }} />
                                                        <Typography variant="body2">{booking.customer_email}</Typography>
                                                    </Box>
                                                    <Box
                                                        display="flex"
                                                        alignItems="center"
                                                        gap={1}
                                                        color="text.secondary"
                                                        onClick={(e) => handleTokenClick(e, booking)}
                                                        sx={{ cursor: 'pointer', width: 'fit-content', '&:hover': { color: 'primary.main' } }}
                                                    >
                                                        <ConfirmationNumberIcon sx={{ fontSize: 16 }} />
                                                        <Typography variant="body2" fontFamily="monospace">
                                                            {booking.token || <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Set Token</span>}
                                                        </Typography>
                                                    </Box>
                                                </Stack>

                                                {booking.customer_note && (
                                                    <Box mt={2} sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                                        <CommentIcon fontSize="small" sx={{ color: 'text.secondary', mt: 0.3 }} />
                                                        <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                                                            &quot;{booking.customer_note}&quot;
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>

                                            <Stack alignItems="flex-end" spacing={1}>
                                                <Chip
                                                    icon={<AccessTimeIcon />}
                                                    label={`${start.format('HH:mm')} - ${end.format('HH:mm')}`}
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600, bgcolor: 'background.paper' }}
                                                />

                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleLabelClick(e, booking.id)}
                                                    sx={{
                                                        bgcolor: 'action.hover',
                                                        '&:hover': { bgcolor: 'action.selected' }
                                                    }}
                                                >
                                                    <LabelIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </Stack>
                                    </Paper>
                                );
                            })}
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
                    <Typography color="text.secondary" fontStyle="italic">No Label</Typography>
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
            </Menu>

            {/* Token Popover */}
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