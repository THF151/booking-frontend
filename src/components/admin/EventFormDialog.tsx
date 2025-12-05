import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Stack, MenuItem, Box, Typography, Switch, Autocomplete,
    ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Event, Dictionary, TimeWindow } from '@/types';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const allTimezones = Intl.supportedValuesOf('timeZone');

interface EventFormState {
    slug: string;
    title_en: string;
    title_de: string;
    desc_en: string;
    desc_de: string;
    location: string;
    payout: string;
    host_name: string;
    timezone: string;
    min_notice_general: number;
    min_notice_first: number;
    active_start: string;
    active_end: string;
    duration_min: number;
    interval_min: number;
    max_participants: number;
    image_url: string;
    access_mode: string;
    schedule_type: 'RECURRING' | 'MANUAL';
    config: Record<string, TimeWindow[]>;
}

interface EventFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData: Event | null;
    dict: Dictionary;
}

export default function EventFormDialog({ open, onClose, onSuccess, initialData, dict }: EventFormDialogProps) {
    const { tenantId, tenantLogo } = useAuthStore();
    const t = dict?.admin?.event_form || {};
    const common = dict?.common || {};

    const fmtDate = (d: string) => d ? dayjs(d).format('YYYY-MM-DDTHH:mm') : '';

    const [form, setForm] = useState<EventFormState>(() => {
        if (initialData) {
            return {
                slug: initialData.slug,
                title_en: initialData.title_en,
                title_de: initialData.title_de,
                desc_en: initialData.desc_en,
                desc_de: initialData.desc_de,
                location: initialData.location,
                payout: initialData.payout,
                host_name: initialData.host_name,
                timezone: initialData.timezone || dayjs.tz.guess(),
                min_notice_general: initialData.min_notice_general || 0,
                min_notice_first: initialData.min_notice_first || 0,
                active_start: fmtDate(initialData.active_start),
                active_end: fmtDate(initialData.active_end),
                duration_min: initialData.duration_min,
                interval_min: initialData.interval_min,
                max_participants: initialData.max_participants,
                image_url: initialData.image_url,
                access_mode: initialData.access_mode,
                schedule_type: initialData.schedule_type || 'RECURRING',
                config: typeof initialData.config_json === 'string'
                    ? JSON.parse(initialData.config_json)
                    : {}
            };
        }
        return {
            slug: '',
            title_en: '', title_de: '',
            desc_en: '', desc_de: '',
            location: 'Zoom',
            payout: '0',
            host_name: 'Dr. Privacy',
            timezone: dayjs.tz.guess(),
            min_notice_general: 60,
            min_notice_first: 240,
            active_start: fmtDate(dayjs().toISOString()),
            active_end: fmtDate(dayjs().add(1, 'year').toISOString()),
            duration_min: 30,
            interval_min: 30,
            max_participants: 1,
            image_url: tenantLogo || "https://via.placeholder.com/150",
            access_mode: 'OPEN',
            schedule_type: 'RECURRING',
            config: {
                monday: [{start: "09:00", end: "17:00"}],
                tuesday: [{start: "09:00", end: "17:00"}],
                wednesday: [{start: "09:00", end: "17:00"}],
                thursday: [{start: "09:00", end: "17:00"}],
                friday: [{start: "09:00", end: "17:00"}]
            }
        };
    });

    const handleChange = (field: keyof EventFormState, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const toggleDay = (day: string) => {
        setForm(prev => {
            const newConfig = { ...prev.config };
            if (newConfig[day]) {
                delete newConfig[day];
            } else {
                newConfig[day] = [{ start: "09:00", end: "17:00" }];
            }
            return { ...prev, config: newConfig };
        });
    };

    const changeTime = (day: string, index: number, field: 'start' | 'end' | 'max_participants', value: string | number) => {
        setForm(prev => {
            const newConfig = { ...prev.config };
            if (newConfig[day] && newConfig[day][index]) {
                newConfig[day][index] = { ...newConfig[day][index], [field]: value };
            }
            return { ...prev, config: newConfig };
        });
    };

    const handleSubmit = async () => {
        const url = initialData
            ? `/${tenantId}/events/${initialData.slug}`
            : `/${tenantId}/events`;

        const payload = {
            ...form,
            active_start: dayjs(form.active_start).toISOString(),
            active_end: dayjs(form.active_end).toISOString(),
            duration_min: Number(form.duration_min),
            interval_min: Number(form.interval_min),
            max_participants: Number(form.max_participants),
            min_notice_general: Number(form.min_notice_general),
            min_notice_first: Number(form.min_notice_first),
        };

        try {
            if (initialData) {
                await api.put(url, payload);
            } else {
                await api.post(url, payload);
            }
            onSuccess();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
            <DialogTitle sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                {initialData ? t.edit_title || 'Edit Event' : t.create_title || 'Create Event'}
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Stack spacing={4}>
                    <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight="bold">{t.general || 'General'}</Typography>
                        <Stack direction="row" spacing={2} mt={1}>
                            <TextField
                                fullWidth label={t.slug || 'Slug'}
                                value={form.slug}
                                onChange={e => handleChange('slug', e.target.value)}
                                disabled={!!initialData}
                                helperText={t.slug_helper}
                            />
                            <TextField select fullWidth label={t.access_mode || 'Access Mode'} value={form.access_mode} onChange={e => handleChange('access_mode', e.target.value)}>
                                <MenuItem value="OPEN">Open (Public)</MenuItem>
                                <MenuItem value="RESTRICTED">Restricted (Token)</MenuItem>
                                <MenuItem value="CLOSED">Closed</MenuItem>
                            </TextField>
                        </Stack>
                        <Stack direction="row" spacing={2} mt={2} alignItems="center">
                            <Box flex={1}>
                                <Typography variant="caption" display="block" mb={0.5}>Schedule Type</Typography>
                                <ToggleButtonGroup
                                    value={form.schedule_type}
                                    exclusive
                                    onChange={(_, val) => val && setForm(prev => ({ ...prev, schedule_type: val }))}
                                    size="small"
                                    disabled={!!initialData}
                                    fullWidth
                                >
                                    <ToggleButton value="RECURRING" sx={{ flex: 1 }}>Recurring (Weekly)</ToggleButton>
                                    <ToggleButton value="MANUAL" sx={{ flex: 1 }}>Manual (Sessions)</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                            <Box flex={1}>
                                <Autocomplete
                                    options={allTimezones}
                                    value={form.timezone}
                                    onChange={(_, val) => handleChange('timezone', val || 'UTC')}
                                    renderInput={(params) => <TextField {...params} label="Event Timezone" />}
                                    fullWidth
                                />
                            </Box>
                        </Stack>
                    </Box>

                    {form.schedule_type === 'RECURRING' && (
                        <Box>
                            <Typography variant="overline" color="text.secondary" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                <AccessTimeIcon fontSize="small" /> {t.schedule || 'Schedule'}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary" mb={2}>
                                {t.schedule_helper}
                            </Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                {DAYS.map(day => {
                                    const isEnabled = !!form.config[day];
                                    return (
                                        <Box
                                            key={day}
                                            sx={{
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: isEnabled ? 'primary.main' : 'divider',
                                                borderRadius: 2,
                                                bgcolor: isEnabled ? 'action.selected' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={isEnabled ? 2 : 0}>
                                                <Typography sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{day}</Typography>
                                                <Switch size="small" checked={isEnabled} onChange={() => toggleDay(day)} />
                                            </Box>

                                            {isEnabled && form.config[day].map((slot, idx) => (
                                                <Stack key={idx} direction="row" spacing={1} alignItems="center" mb={1}>
                                                    <TextField
                                                        type="time"
                                                        size="small"
                                                        fullWidth
                                                        value={slot.start}
                                                        onChange={(e) => changeTime(day, idx, 'start', e.target.value)}
                                                    />
                                                    <Typography>-</Typography>
                                                    <TextField
                                                        type="time"
                                                        size="small"
                                                        fullWidth
                                                        value={slot.end}
                                                        onChange={(e) => changeTime(day, idx, 'end', e.target.value)}
                                                    />
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        label="Capacity"
                                                        sx={{ width: 100 }}
                                                        value={slot.max_participants || ''}
                                                        onChange={(e) => changeTime(day, idx, 'max_participants', Number(e.target.value))}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </Stack>
                                            ))}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    )}

                    <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight="bold">{t.content || 'Content'}</Typography>
                        <Stack spacing={2} mt={1}>
                            <Stack direction="row" spacing={2}>
                                <TextField fullWidth label="Title (English)" value={form.title_en} onChange={e => handleChange('title_en', e.target.value)} />
                                <TextField fullWidth label="Title (German)" value={form.title_de} onChange={e => handleChange('title_de', e.target.value)} />
                            </Stack>
                            <Stack direction="row" spacing={2}>
                                <TextField fullWidth multiline rows={2} label="Description (EN)" value={form.desc_en} onChange={e => handleChange('desc_en', e.target.value)} />
                                <TextField fullWidth multiline rows={2} label="Description (DE)" value={form.desc_de} onChange={e => handleChange('desc_de', e.target.value)} />
                            </Stack>
                        </Stack>
                    </Box>

                    <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight="bold">{t.details || 'Details'}</Typography>
                        <Stack direction="row" spacing={2} mt={1}>
                            <TextField fullWidth label={t.host_name || "Host Name"} value={form.host_name} onChange={e => handleChange('host_name', e.target.value)} />
                            <TextField fullWidth label="Location" value={form.location} onChange={e => handleChange('location', e.target.value)} />
                        </Stack>
                        <Stack direction="row" spacing={2} mt={2}>
                            <TextField fullWidth label="Price/Payout" value={form.payout} onChange={e => handleChange('payout', e.target.value)} />
                            <TextField fullWidth label="Image URL" value={form.image_url} onChange={e => handleChange('image_url', e.target.value)} />
                        </Stack>
                    </Box>

                    <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight="bold">{t.constraints || 'Constraints'}</Typography>
                        <Stack direction="row" spacing={2} mt={1}>
                            <TextField type="datetime-local" fullWidth label="Valid From" InputLabelProps={{ shrink: true }} value={form.active_start} onChange={e => handleChange('active_start', e.target.value)} />
                            <TextField type="datetime-local" fullWidth label="Valid Until" InputLabelProps={{ shrink: true }} value={form.active_end} onChange={e => handleChange('active_end', e.target.value)} />
                        </Stack>
                        {form.schedule_type === 'RECURRING' && (
                            <Stack direction="row" spacing={2} mt={2}>
                                <TextField type="number" fullWidth label="Duration (min)" value={form.duration_min} onChange={e => Number(e.target.value) >= 0 && handleChange('duration_min', e.target.value)} />
                                <TextField type="number" fullWidth label="Interval (min)" value={form.interval_min} onChange={e => Number(e.target.value) >= 0 && handleChange('interval_min', e.target.value)} />
                                <TextField type="number" fullWidth label="Max Guests" value={form.max_participants} onChange={e => Number(e.target.value) >= 0 && handleChange('max_participants', e.target.value)} />
                            </Stack>
                        )}
                        <Stack direction="row" spacing={2} mt={2}>
                            <TextField type="number" fullWidth label="General Notice (min)" value={form.min_notice_general} onChange={e => Number(e.target.value) >= 0 && handleChange('min_notice_general', e.target.value)} />
                            <TextField type="number" fullWidth label="First Session Notice (min)" value={form.min_notice_first} onChange={e => Number(e.target.value) >= 0 && handleChange('min_notice_first', e.target.value)} />
                        </Stack>
                    </Box>

                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                <Button onClick={onClose} color="inherit">{common.cancel || 'Cancel'}</Button>
                <Button onClick={handleSubmit} variant="contained" size="large">{t.save_btn || 'Save'}</Button>
            </DialogActions>
        </Dialog>
    );
}