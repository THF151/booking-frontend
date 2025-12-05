import React from 'react';
import { Paper, Typography, Stack, TextField, Box, MenuItem, Autocomplete } from '@mui/material';
import { EventEditorState } from './EventEditor';
import { Dictionary } from '@/types';

const allTimezones = Intl.supportedValuesOf('timeZone');

interface Props {
    form: EventEditorState;
    onChange: (field: keyof EventEditorState, value: unknown) => void;
    dict: Dictionary;
    isEdit: boolean;
}

export default function GeneralSection({ form, onChange, dict, isEdit }: Props) {
    const t = dict.admin.event_form;

    return (
        <Stack spacing={4}>
            {/* Basic Info Card */}
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>{t.general}</Typography>

                <Stack spacing={3}>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            fullWidth
                            label={t.slug}
                            value={form.slug}
                            onChange={e => onChange('slug', e.target.value)}
                            disabled={isEdit}
                            helperText={t.slug_helper}
                            variant="outlined"
                        />
                        <TextField
                            select
                            fullWidth
                            label={t.access_mode}
                            value={form.access_mode}
                            onChange={e => onChange('access_mode', e.target.value)}
                        >
                            <MenuItem value="OPEN">Open (Public)</MenuItem>
                            <MenuItem value="RESTRICTED">Restricted (Token)</MenuItem>
                            <MenuItem value="CLOSED">Closed</MenuItem>
                        </TextField>
                    </Stack>

                    <Autocomplete
                        options={allTimezones}
                        value={form.timezone}
                        onChange={(_, val) => onChange('timezone', val || 'UTC')}
                        renderInput={(params) => <TextField {...params} label={t.event_timezone} helperText={t.timezone_helper} />}
                    />
                </Stack>
            </Paper>

            {/* Content Card */}
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>{t.content}</Typography>

                <Stack spacing={3}>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" mb={1}>English</Typography>
                        <Stack spacing={2}>
                            <TextField label={t.title_en} value={form.title_en} onChange={e => onChange('title_en', e.target.value)} fullWidth />
                            <TextField label={t.desc_en} multiline rows={3} value={form.desc_en} onChange={e => onChange('desc_en', e.target.value)} fullWidth />
                        </Stack>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" mb={1}>German</Typography>
                        <Stack spacing={2}>
                            <TextField label={t.title_de} value={form.title_de} onChange={e => onChange('title_de', e.target.value)} fullWidth />
                            <TextField label={t.desc_de} multiline rows={3} value={form.desc_de} onChange={e => onChange('desc_de', e.target.value)} fullWidth />
                        </Stack>
                    </Box>
                </Stack>
            </Paper>
        </Stack>
    );
}