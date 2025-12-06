import React from 'react';
import {
    Box, Paper, Typography, Chip, Stack, IconButton, Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CommentIcon from '@mui/icons-material/Comment';
import LabelIcon from '@mui/icons-material/Label';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import { motion } from 'framer-motion';
import { Dayjs } from 'dayjs';
import { Booking, BookingLabel } from '@/types';
import LabelBadge from '@/components/admin/LabelBadge';

interface BookingListItemProps {
    booking: Booking;
    start: Dayjs;
    end: Dayjs;
    eventTitle: string;
    labels: BookingLabel[];
    viewMode: 'comfortable' | 'compact';
    isStampMode: boolean;
    stampLabelColor?: string;
    onStamp: (booking: Booking) => void;
    onAction: (e: React.MouseEvent, type: 'label' | 'token' | 'delete', booking: Booking) => void;
}

export default function BookingListItem({
                                            booking, start, end, eventTitle, labels, viewMode, isStampMode, onStamp, onAction
                                        }: BookingListItemProps) {
    const isCancelled = booking.status === 'CANCELLED';
    const label = labels.find(l => l.id === booking.label_id);
    const payout = booking.payout !== null && booking.payout !== undefined ? booking.payout : (label?.payout || 0);
    const isCustom = booking.payout !== null && booking.payout !== undefined;

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        if (isStampMode) {
            e.stopPropagation();
            onStamp(booking);
        }
    };

    const effectiveCursor = isStampMode ? 'alias' : 'default';

    if (viewMode === 'compact') {
        return (
            <Box
                component={motion.div}
                variants={itemVariants}
                onClick={handleContainerClick}
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
                    cursor: effectiveCursor,
                    '&:hover': { bgcolor: isStampMode ? 'action.hover' : 'action.hover' },
                    transition: 'background-color 0.2s',
                    position: 'relative'
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
                        {eventTitle}
                    </Typography>
                </Box>

                <Box
                    onClick={(e) => !isStampMode && onAction(e, 'token', booking)}
                    sx={{
                        cursor: isStampMode ? 'inherit' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: booking.token ? 'action.selected' : 'transparent',
                        px: 1, py: 0.5, borderRadius: 1,
                        '&:hover': { bgcolor: !isStampMode ? 'action.hover' : 'transparent' }
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

                <Box
                    onClick={(e) => !isStampMode && onAction(e, 'label', booking)}
                    sx={{
                        cursor: isStampMode ? 'inherit' : 'pointer',
                        minWidth: 80,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                        alignItems: 'center'
                    }}
                >
                    {booking.label_id ? (
                        <LabelBadge labelId={booking.label_id} labels={labels} size="small" />
                    ) : (
                        <LabelIcon fontSize="small" color="action" sx={{ opacity: 0.3, '&:hover': { opacity: 1 } }} />
                    )}
                    {payout !== 0 && (
                        <Typography variant="caption" color="success.main" fontWeight="bold" sx={{ textDecoration: isCustom ? 'underline' : 'none' }}>
                            {payout}€
                        </Typography>
                    )}
                </Box>
            </Box>
        );
    }

    return (
        <Paper
            component={motion.div}
            variants={itemVariants}
            onClick={handleContainerClick}
            elevation={0}
            variant="outlined"
            sx={{
                p: 2,
                borderLeft: '4px solid',
                borderLeftColor: isCancelled ? 'error.main' : 'primary.main',
                opacity: isCancelled ? 0.7 : 1,
                cursor: effectiveCursor,
                '&:hover': {
                    borderColor: 'primary.main',
                    borderLeftColor: isCancelled ? 'error.main' : 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transform: isStampMode ? 'none' : 'translateY(-1px)',
                    bgcolor: isStampMode ? 'action.hover' : undefined
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
                        {(booking.label_id || payout !== 0) && (
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>
                                {booking.label_id && <LabelBadge labelId={booking.label_id} labels={labels} />}
                                {payout !== 0 && (
                                    <Typography variant="caption" color="success.main" fontWeight="800" sx={{ textDecoration: isCustom ? 'underline' : 'none' }}>
                                        +{payout}€
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Stack>

                    <Stack spacing={0.5}>
                        <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                            <EventIcon sx={{ fontSize: 16 }} />
                            <Typography variant="body2" fontWeight="500">{eventTitle}</Typography>
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
                            onClick={(e) => !isStampMode && onAction(e, 'token', booking)}
                            sx={{ cursor: isStampMode ? 'inherit' : 'pointer', width: 'fit-content', '&:hover': { color: 'primary.main' } }}
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
                        onClick={(e) => !isStampMode && onAction(e, 'label', booking)}
                        sx={{
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'action.selected' },
                            opacity: isStampMode ? 0.5 : 1
                        }}
                        disabled={isStampMode}
                    >
                        <LabelIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Stack>
        </Paper>
    );
}