import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Stack, Switch, FormControlLabel, Box, IconButton, Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Dayjs } from 'dayjs';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Dictionary, TimeWindow, Override } from '@/types';

interface OverrideDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    date: Dayjs | null;
    slug: string;
    dict: Dictionary;
    existingOverride: Override | null;
    eventConfig: Record<string, TimeWindow[]>;
}

const ENGLISH_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function OverrideDialog({ open, onClose, onSuccess, date, slug, dict, existingOverride, eventConfig }: OverrideDialogProps) {
    const { tenantId } = useAuthStore();
    const t = dict?.admin?.event_detail?.override_dialog;

    const [isUnavailable, setIsUnavailable] = useState(() =>
        existingOverride ? existingOverride.is_unavailable : false
    );

    const [location, setLocation] = useState(() =>
        existingOverride?.location || ''
    );

    const [overrideMax, setOverrideMax] = useState<string>(() =>
        existingOverride?.override_max_participants?.toString() || ''
    );

    const [slots, setSlots] = useState<TimeWindow[]>(() => {
        if (!date) return [{ start: '09:00', end: '17:00' }];

        const dayIndex = date.day();
        const dayKey = ENGLISH_DAYS[dayIndex];

        if (existingOverride?.override_config_json) {
            try {
                const cfg = JSON.parse(existingOverride.override_config_json);
                if (cfg && cfg[dayKey]) {
                    return cfg[dayKey];
                }
            } catch (e) {
                console.error(e);
            }
        }

        if (eventConfig && eventConfig[dayKey]) {
            return eventConfig[dayKey];
        }
        return [{ start: '09:00', end: '17:00' }];
    });

    const handleSave = async () => {
        if (!date || !tenantId) return;

        const dateStr = date.format('YYYY-MM-DD');
        const dayIndex = date.day();
        const dayName = ENGLISH_DAYS[dayIndex];

        const config = {
            [dayName]: slots
        };

        const payload = {
            date: dateStr,
            is_unavailable: isUnavailable,
            config: isUnavailable ? null : config,
            location: location || null,
            override_max_participants: isUnavailable || !overrideMax ? null : Number(overrideMax),
            host_name: null
        };

        try {
            await api.post(`/${tenantId}/events/${slug}/overrides`, payload);
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error saving override");
        }
    };

    const handleDelete = async () => {
        if (!date || !tenantId) return;
        if (!confirm(dict.common.delete + "?")) return;

        const dateStr = date.format('YYYY-MM-DD');
        try {
            await api.delete(`/${tenantId}/events/${slug}/overrides/${dateStr}`);
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error deleting override");
        }
    };

    const handleSlotChange = (index: number, field: 'start' | 'end' | 'max_participants', value: string | number) => {
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        setSlots(newSlots);
    };

    const addSlot = () => setSlots([...slots, { start: '09:00', end: '12:00' }]);
    const removeSlot = (index: number) => setSlots(slots.filter((_, i) => i !== index));

    if (!date) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {t.title} - {date.format('DD.MM.YYYY')}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    <FormControlLabel
                        control={<Switch checked={isUnavailable} onChange={e => setIsUnavailable(e.target.checked)} />}
                        label={t.unavailable_switch}
                    />

                    {!isUnavailable && (
                        <>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label={t.location_label}
                                    fullWidth
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="e.g. Home Office"
                                />
                                <TextField
                                    label="Day Cap"
                                    type="number"
                                    sx={{ width: 120 }}
                                    value={overrideMax}
                                    onChange={e => setOverrideMax(e.target.value)}
                                    placeholder="Default"
                                />
                            </Stack>

                            <Box>
                                <Typography variant="subtitle2" gutterBottom>{t.config_title}</Typography>
                                {slots.map((slot, idx) => (
                                    <Stack key={idx} direction="row" spacing={1} alignItems="center" mb={1}>
                                        <TextField
                                            type="time"
                                            size="small"
                                            value={slot.start}
                                            onChange={e => handleSlotChange(idx, 'start', e.target.value)}
                                        />
                                        <Typography>-</Typography>
                                        <TextField
                                            type="time"
                                            size="small"
                                            value={slot.end}
                                            onChange={e => handleSlotChange(idx, 'end', e.target.value)}
                                        />
                                        <TextField
                                            type="number"
                                            size="small"
                                            placeholder="Cap"
                                            sx={{ width: 70 }}
                                            value={slot.max_participants || ''}
                                            onChange={(e) => handleSlotChange(idx, 'max_participants', Number(e.target.value))}
                                        />
                                        <IconButton size="small" onClick={() => removeSlot(idx)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </Stack>
                                ))}
                                <Button startIcon={<AddIcon />} size="small" onClick={addSlot}>
                                    {t.add_slot}
                                </Button>
                            </Box>
                        </>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                {existingOverride && (
                    <Button onClick={handleDelete} color="error" sx={{ mr: 'auto' }}>
                        {t.reset_btn}
                    </Button>
                )}
                <Button onClick={onClose}>{dict.common.cancel}</Button>
                <Button onClick={handleSave} variant="contained">{dict.common.save}</Button>
            </DialogActions>
        </Dialog>
    );
}