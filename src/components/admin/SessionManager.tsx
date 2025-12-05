import React, { useState } from 'react';
import {
    Box, Paper, Button, Typography, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Stack, IconButton, Snackbar, Alert, Chip, InputAdornment
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { EventSession, Dictionary, Booking } from '@/types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import AdminBookingDialog from './AdminBookingDialog';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
    eventSlug: string;
    eventTimezone: string;
    dict: Dictionary;
    lang: string;
    bookings: Booking[];
    accessMode: string;
}

interface SessionFormData {
    date: string;
    start_time: string;
    end_time: string;
    max_participants: number;
    location: string;
    host_name: string;
}

interface SessionUpdateData {
    max_participants: number;
    location: string | null;
    host_name: string | null;
}

export default function SessionManager({ eventSlug, eventTimezone, dict, lang, bookings, accessMode }: Props) {
    const { tenantId } = useAuthStore();
    const queryClient = useQueryClient();
    const t = dict.admin.sessions;

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);

    const [selectedSession, setSelectedSession] = useState<EventSession | null>(null);
    const [snack, setSnack] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

    // -- Queries --
    const { data: sessions = [] } = useQuery({
        queryKey: ['sessions', tenantId, eventSlug],
        queryFn: () => api.get<EventSession[]>(`/${tenantId}/events/${eventSlug}/sessions`),
        enabled: !!tenantId
    });

    // -- Mutations --
    const createMutation = useMutation({
        mutationFn: (data: SessionFormData) => api.post(`/${tenantId}/events/${eventSlug}/sessions`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions', tenantId, eventSlug] });
            setCreateOpen(false);
            setSnack({ msg: t.create_success, type: 'success' });
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Creation failed";
            setSnack({ msg, type: 'error' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: SessionUpdateData) => api.put(`/${tenantId}/events/${eventSlug}/sessions/${selectedSession?.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions', tenantId, eventSlug] });
            setEditOpen(false);
            setSnack({ msg: t.update_success, type: 'success' });
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Update failed";
            setSnack({ msg, type: 'error' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/${tenantId}/events/${eventSlug}/sessions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions', tenantId, eventSlug] });
            setSnack({ msg: t.delete_success, type: 'success' });
        },
        onError: (err: unknown) => {
            const msg = err instanceof Error ? err.message : "Deletion failed";
            setSnack({ msg, type: 'error' });
        }
    });

    const [formData, setFormData] = useState<SessionFormData>({
        date: dayjs().format('YYYY-MM-DD'),
        start_time: '10:00',
        end_time: '11:00',
        max_participants: 1,
        location: '',
        host_name: ''
    });

    const handleCreateClick = () => {
        setFormData({
            date: dayjs().format('YYYY-MM-DD'),
            start_time: '10:00',
            end_time: '11:00',
            max_participants: 1,
            location: '',
            host_name: ''
        });
        setCreateOpen(true);
    };

    const handleEditClick = (session: EventSession) => {
        setSelectedSession(session);
        const start = dayjs(session.start_time).tz(eventTimezone);
        const end = dayjs(session.end_time).tz(eventTimezone);
        setFormData({
            date: start.format('YYYY-MM-DD'),
            start_time: start.format('HH:mm'),
            end_time: end.format('HH:mm'),
            max_participants: session.max_participants,
            location: session.location || '',
            host_name: session.host_name || ''
        });
        setEditOpen(true);
    };

    const handleDetailsClick = (session: EventSession) => {
        setSelectedSession(session);
        setDetailsOpen(true);
    };

    const handleBookClick = (session: EventSession) => {
        setSelectedSession(session);
        setBookingOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm(t.delete_confirm)) {
            deleteMutation.mutate(id);
        }
    };

    const handleFormSubmit = (isEdit: boolean) => {
        if (isEdit) {
            updateMutation.mutate({
                max_participants: formData.max_participants,
                location: formData.location || null,
                host_name: formData.host_name || null
            });
        } else {
            createMutation.mutate(formData);
        }
    };

    const publicLink = typeof window !== 'undefined'
        ? `${window.location.origin}/${lang}/book/${tenantId}/${eventSlug}`
        : '';

    const sessionBookings = selectedSession
        ? bookings.filter(b => {
            const sStart = dayjs(selectedSession.start_time);
            const sEnd = dayjs(selectedSession.end_time);
            const bStart = dayjs(b.start_time);
            return bStart.isSame(sStart) || (bStart.isAfter(sStart) && bStart.isBefore(sEnd));
        })
        : [];


    const columns: GridColDef[] = [
        {
            field: 'start_time', headerName: t.date, width: 120,
            valueGetter: (val: string) => dayjs(val).tz(eventTimezone).format('YYYY-MM-DD')
        },
        {
            field: 'time', headerName: t.time, width: 120,
            valueGetter: (_: unknown, row: EventSession) => {
                const start = dayjs(row.start_time).tz(eventTimezone).format('HH:mm');
                const end = dayjs(row.end_time).tz(eventTimezone).format('HH:mm');
                return `${start} - ${end}`;
            }
        },
        {
            field: 'capacity', headerName: t.capacity, width: 100,
            renderCell: (params) => {
                const session = params.row as EventSession;
                const count = bookings.filter(b => dayjs(b.start_time).isSame(dayjs(session.start_time))).length;
                return (
                    <Chip
                        size="small"
                        label={`${count} / ${session.max_participants}`}
                        color={count >= session.max_participants ? "error" : "success"}
                        variant="outlined"
                    />
                );
            }
        },
        { field: 'location', headerName: t.location, width: 150 },
        {
            field: 'actions', type: 'actions', width: 180,
            getActions: (params) => [
                <GridActionsCellItem
                    key="book"
                    icon={<AddIcon />}
                    label={t.add_booking}
                    onClick={() => handleBookClick(params.row as EventSession)}
                    showInMenu={false}
                />,
                <GridActionsCellItem
                    key="view"
                    icon={<ListAltIcon />}
                    label={t.view_bookings}
                    onClick={() => handleDetailsClick(params.row as EventSession)}
                    showInMenu={false}
                />,
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label={dict.common.edit}
                    onClick={() => handleEditClick(params.row as EventSession)}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<DeleteIcon />}
                    label={dict.common.delete}
                    onClick={() => handleDelete(params.id as string)}
                />
            ]
        }
    ];

    return (
        <Box>
            <Box mb={4} sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t.public_link}</Typography>
                <Stack direction="row" spacing={1}>
                    <TextField
                        fullWidth size="small"
                        value={publicLink}
                        InputProps={{
                            readOnly: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => {
                                        navigator.clipboard.writeText(publicLink);
                                        setSnack({ msg: dict.common.copied, type: 'success' });
                                    }} edge="end">
                                        <ContentCopyIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Button variant="outlined" href={publicLink} target="_blank" startIcon={<EventIcon />}>
                        {dict.common.open}
                    </Button>
                </Stack>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">{t.title}</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateClick}>
                    {t.add}
                </Button>
            </Box>

            <Paper sx={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={sessions}
                    columns={columns}
                    slots={{ toolbar: GridToolbar }}
                />
            </Paper>

            <Dialog open={createOpen || editOpen} onClose={() => { setCreateOpen(false); setEditOpen(false); }} maxWidth="sm" fullWidth>
                <DialogTitle>{editOpen ? t.edit : t.add}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        {!editOpen && (
                            <>
                                <TextField
                                    type="date" label={t.date} InputLabelProps={{ shrink: true }}
                                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    fullWidth
                                />
                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        type="time" label="Start" InputLabelProps={{ shrink: true }}
                                        value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        fullWidth
                                    />
                                    <TextField
                                        type="time" label="End" InputLabelProps={{ shrink: true }}
                                        value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        fullWidth
                                    />
                                </Stack>
                            </>
                        )}
                        <TextField
                            type="number" label={t.capacity}
                            value={formData.max_participants}
                            onChange={e => setFormData({ ...formData, max_participants: Number(e.target.value) })}
                            fullWidth
                        />
                        <TextField
                            label={t.location}
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label={t.host}
                            value={formData.host_name}
                            onChange={e => setFormData({ ...formData, host_name: e.target.value })}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setCreateOpen(false); setEditOpen(false); }}>{dict.common.cancel}</Button>
                    <Button onClick={() => handleFormSubmit(editOpen)} variant="contained">{editOpen ? dict.common.save : dict.admin.labels.create}</Button>
                </DialogActions>
            </Dialog>

            {bookingOpen && selectedSession && (
                <AdminBookingDialog
                    open={bookingOpen}
                    onClose={() => setBookingOpen(false)}
                    tenantId={tenantId || ''}
                    slug={eventSlug}
                    eventTimezone={eventTimezone}
                    dict={dict}
                    initialDate={dayjs(selectedSession.start_time).tz(eventTimezone)}
                    initialTime={selectedSession.start_time} // UTC ISO
                    accessMode={accessMode}
                />
            )}

            <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {t.view_bookings} - {selectedSession ? dayjs(selectedSession.start_time).tz(eventTimezone).format('DD.MM.YYYY HH:mm') : ''}
                </DialogTitle>
                <DialogContent>
                    <div style={{ height: 400, width: '100%' }}>
                        <DataGrid
                            rows={sessionBookings}
                            columns={[
                                { field: 'customer_name', headerName: dict.booking.form.name_label, width: 150 },
                                { field: 'customer_email', headerName: dict.booking.form.email_label, width: 200 },
                                { field: 'created_at', headerName: 'Booked At', width: 180, valueGetter: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm') }
                            ]}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsOpen(false)}>{dict.common.close}</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}>
                <Alert severity={snack?.type} variant="filled">{snack?.msg}</Alert>
            </Snackbar>
        </Box>
    );
}