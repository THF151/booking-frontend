import React from 'react';
import {
    Paper, Typography, Stack, Box, Switch, TextField, ToggleButtonGroup, ToggleButton, IconButton, Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { EventEditorState } from './EventEditor';
import { Dictionary } from '@/types';

interface Props {
    form: EventEditorState;
    onChange: (field: keyof EventEditorState, value: unknown) => void;
    dict: Dictionary;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AvailabilitySection({ form, onChange, dict }: Props) {
    const t = dict.admin.event_form;

    const toggleDay = (day: string) => {
        const newConfig = { ...form.config };
        if (newConfig[day]) {
            delete newConfig[day];
        } else {
            newConfig[day] = [{ start: "09:00", end: "17:00" }];
        }
        onChange('config', newConfig);
    };

    const updateTimeSlot = (day: string, index: number, field: string, val: string | number) => {
        const newConfig = { ...form.config };
        if (newConfig[day] && newConfig[day][index]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (newConfig[day][index] as any)[field] = val;
        }
        onChange('config', newConfig);
    };

    const addTimeSlot = (day: string) => {
        const newConfig = { ...form.config };
        if (newConfig[day]) {
            newConfig[day].push({ start: "13:00", end: "17:00" });
        }
        onChange('config', newConfig);
    };

    const removeTimeSlot = (day: string, index: number) => {
        const newConfig = { ...form.config };
        if (newConfig[day]) {
            newConfig[day] = newConfig[day].filter((_, i) => i !== index);
            if (newConfig[day].length === 0) delete newConfig[day];
        }
        onChange('config', newConfig);
    };

    return (
        <Stack spacing={4}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={1}>Schedule Type</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Choose how availability is determined for this event.
                </Typography>

                <ToggleButtonGroup
                    value={form.schedule_type}
                    exclusive
                    onChange={(_, val) => val && onChange('schedule_type', val)}
                    fullWidth
                    color="primary"
                    sx={{ mb: 2 }}
                >
                    <ToggleButton value="RECURRING" sx={{ py: 2 }}>
                        <Box textAlign="center">
                            <Typography fontWeight="bold" display="block">{t.recurring_weekly}</Typography>
                            <Typography variant="caption" display="block">{t.recurring_desc}</Typography>
                        </Box>
                    </ToggleButton>
                    <ToggleButton value="MANUAL" sx={{ py: 2 }}>
                        <Box textAlign="center">
                            <Typography fontWeight="bold" display="block">{t.manual_sessions}</Typography>
                            <Typography variant="caption" display="block">{t.manual_desc}</Typography>
                        </Box>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Paper>

            {form.schedule_type === 'RECURRING' && (
                <Paper sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight="bold" mb={1}>{t.schedule}</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>{t.schedule_helper}</Typography>

                    <Stack spacing={2}>
                        {DAYS.map(day => {
                            const isEnabled = !!form.config[day];
                            return (
                                <Box key={day} sx={{ p: 2, border: '1px solid', borderColor: isEnabled ? 'primary.main' : 'divider', borderRadius: 2, bgcolor: isEnabled ? 'action.selected' : 'transparent' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ textTransform: 'capitalize', fontWeight: 600, width: 100 }}>{day}</Typography>
                                        <Switch checked={isEnabled} onChange={() => toggleDay(day)} />
                                    </Box>

                                    {isEnabled && (
                                        <Box mt={2}>
                                            {form.config[day].map((slot, idx) => (
                                                <Box key={idx} display="flex" gap={1} alignItems="center" mb={1} flexWrap="nowrap">
                                                    <TextField
                                                        type="time" size="small"
                                                        value={slot.start}
                                                        onChange={e => updateTimeSlot(day, idx, 'start', e.target.value)}
                                                        sx={{ flex: 1 }}
                                                    />
                                                    <Typography>-</Typography>
                                                    <TextField
                                                        type="time" size="small"
                                                        value={slot.end}
                                                        onChange={e => updateTimeSlot(day, idx, 'end', e.target.value)}
                                                        sx={{ flex: 1 }}
                                                    />
                                                    <TextField
                                                        type="number" size="small" label="Cap"
                                                        value={slot.max_participants || ''}
                                                        placeholder="Default"
                                                        sx={{ width: 100 }}
                                                        onChange={e => updateTimeSlot(day, idx, 'max_participants', Number(e.target.value))}
                                                    />
                                                    <IconButton size="small" color="error" onClick={() => removeTimeSlot(day, idx)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            ))}
                                            <Button startIcon={<AddIcon />} size="small" onClick={() => addTimeSlot(day)}>{t.add_slot}</Button>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                </Paper>
            )}

            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>{t.duration_limits}</Typography>
                <Stack direction="row" spacing={3}>
                    <TextField type="number" label={t.duration_min} value={form.duration_min} onChange={e => onChange('duration_min', Number(e.target.value))} fullWidth />
                    <TextField type="number" label={t.interval_min} value={form.interval_min} onChange={e => onChange('interval_min', Number(e.target.value))} fullWidth />
                </Stack>
                <Box mt={3}>
                    <TextField type="number" label={t.global_capacity} value={form.max_participants} onChange={e => onChange('max_participants', Number(e.target.value))} fullWidth />
                    <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        {t.global_capacity_helper}
                    </Typography>
                </Box>
            </Paper>
        </Stack>
    );
}