'use client';

import React, { useState } from 'react';
import {
    Paper, Typography, Button, TextField, MenuItem, Stack, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Dictionary, EmailTemplate, BookingLabel, Event } from '@/types';

interface Props {
    dict: Dictionary;
    preselectedEventId?: string;
}

interface Recipient {
    id: string;
    email: string;
    name?: string;
    status: string;
}

interface PreviewPayload {
    event_id: string;
    target_type: string;
    label_id: string | null;
    status_filter: string | null;
    template_id: string;
}

interface SendPayload {
    template_id: string;
    target_type: string;
    recipients: string[];
}

export default function CampaignManager({ dict, preselectedEventId }: Props) {
    const { tenantId } = useAuthStore();
    const t = dict.admin.communication;

    const [selectedEvent, setSelectedEvent] = useState(preselectedEventId || '');
    const [targetType, setTargetType] = useState('BOOKING');
    const [selectedLabel, setSelectedLabel] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [previewOpen, setPreviewOpen] = useState(false);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { data: events = [] } = useQuery({
        queryKey: ['events', tenantId],
        queryFn: () => api.get<Event[]>(`/${tenantId}/events`),
        enabled: !!tenantId
    });

    const { data: labels = [] } = useQuery({
        queryKey: ['labels', tenantId],
        queryFn: () => api.get<BookingLabel[]>(`/${tenantId}/labels`),
        enabled: !!tenantId
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['templates', tenantId, selectedEvent],
        queryFn: () => api.get<EmailTemplate[]>(`/${tenantId}/templates${selectedEvent ? `?event_id=${selectedEvent}` : ''}`),
        enabled: !!tenantId
    });

    const previewMutation = useMutation({
        mutationFn: (data: PreviewPayload) => api.post<Recipient[]>(`/${tenantId}/campaigns/preview`, data),
        onSuccess: (data) => {
            setRecipients(data);
            setSelectedRecipientIds(new Set(data.map(r => r.id)));
            setPreviewOpen(true);
            setMsg(null);
        },
        onError: (err: Error) => setMsg({ type: 'error', text: err.message })
    });

    const sendMutation = useMutation({
        mutationFn: (data: SendPayload) => api.post(`/${tenantId}/campaigns/send`, data),
        onSuccess: () => {
            setMsg({ type: 'success', text: `Campaign started.` });
            setPreviewOpen(false);
        },
        onError: (err: Error) => setMsg({ type: 'error', text: err.message })
    });

    const handlePreview = () => {
        if (!selectedEvent || !selectedTemplate) {
            setMsg({ type: 'error', text: "Event and Template are required" });
            return;
        }
        previewMutation.mutate({
            event_id: selectedEvent,
            target_type: targetType,
            label_id: selectedLabel || null,
            status_filter: statusFilter || null,
            template_id: selectedTemplate
        });
    };

    const handleSend = () => {
        sendMutation.mutate({
            template_id: selectedTemplate,
            target_type: targetType,
            recipients: Array.from(selectedRecipientIds)
        });
    };

    const toggleRecipient = (id: string) => {
        const newSet = new Set(selectedRecipientIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRecipientIds(newSet);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={3} fontWeight="bold">{t.campaign_title}</Typography>

            {msg && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.text}</Alert>}

            <Stack spacing={3}>
                <TextField
                    select label="Event" fullWidth
                    value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
                    disabled={!!preselectedEventId}
                >
                    {events.map(ev => (
                        <MenuItem key={ev.id} value={ev.id}>{ev.slug}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    select label="Target" fullWidth
                    value={targetType} onChange={e => { setTargetType(e.target.value); setStatusFilter(''); }}
                >
                    <MenuItem value="BOOKING">Bookings</MenuItem>
                    <MenuItem value="INVITEE">Invitees (Tokens)</MenuItem>
                </TextField>

                <TextField
                    select label="Status Filter (Optional)" fullWidth
                    value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                >
                    <MenuItem value=""><em>All</em></MenuItem>
                    {targetType === 'BOOKING' ? [
                        <MenuItem key="conf" value="CONFIRMED">Confirmed</MenuItem>,
                        <MenuItem key="canc" value="CANCELLED">Cancelled</MenuItem>
                    ] : [
                        <MenuItem key="act" value="ACTIVE">Active (Unused)</MenuItem>,
                        <MenuItem key="used" value="USED">Used</MenuItem>,
                        <MenuItem key="rev" value="REVOKED">Revoked</MenuItem>
                    ]}
                </TextField>

                {targetType === 'BOOKING' && (
                    <TextField
                        select label="Filter by Label (Optional)" fullWidth
                        value={selectedLabel} onChange={e => setSelectedLabel(e.target.value)}
                    >
                        <MenuItem value=""><em>All Bookings</em></MenuItem>
                        {labels.map(l => (
                            <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                        ))}
                    </TextField>
                )}

                <TextField
                    select label={t.template_label} fullWidth
                    value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
                >
                    {templates.map(tmpl => (
                        <MenuItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</MenuItem>
                    ))}
                </TextField>

                <Button
                    variant="contained"
                    startIcon={<VisibilityIcon />}
                    onClick={handlePreview}
                    disabled={previewMutation.isPending}
                >
                    Preview Recipients
                </Button>
            </Stack>

            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Confirm Recipients ({selectedRecipientIds.size} selected)
                </DialogTitle>
                <DialogContent dividers>
                    <TableContainer sx={{ maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedRecipientIds.size === recipients.length && recipients.length > 0}
                                            indeterminate={selectedRecipientIds.size > 0 && selectedRecipientIds.size < recipients.length}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedRecipientIds(new Set(recipients.map(r => r.id)));
                                                else setSelectedRecipientIds(new Set());
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {recipients.map(r => (
                                    <TableRow key={r.id} selected={selectedRecipientIds.has(r.id)}>
                                        <TableCell padding="checkbox">
                                            <Checkbox checked={selectedRecipientIds.has(r.id)} onChange={() => toggleRecipient(r.id)} />
                                        </TableCell>
                                        <TableCell>{r.email}</TableCell>
                                        <TableCell>{r.name || '-'}</TableCell>
                                        <TableCell>{r.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>{dict.common.cancel}</Button>
                    <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        onClick={handleSend}
                        disabled={sendMutation.isPending || selectedRecipientIds.size === 0}
                    >
                        {sendMutation.isPending ? "Sending..." : t.send_btn}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}