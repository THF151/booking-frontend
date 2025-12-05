import React from 'react';
import { Paper, Typography, Stack, TextField, Box, FormControlLabel, Switch } from '@mui/material';
import { EventEditorState } from './EventEditor';
import { Dictionary } from '@/types';

interface Props {
    form: EventEditorState;
    onChange: (field: keyof EventEditorState, value: unknown) => void;
    dict: Dictionary;
}

export default function SettingsSection({ form, onChange, dict }: Props) {
    const t = dict.admin.event_form;

    return (
        <Stack spacing={4}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>{t.details}</Typography>
                <Stack spacing={3}>
                    <Stack direction="row" spacing={2}>
                        <TextField fullWidth label={t.host_name} value={form.host_name} onChange={e => onChange('host_name', e.target.value)} />
                        <TextField fullWidth label={dict.booking.location_label} value={form.location} onChange={e => onChange('location', e.target.value)} />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <TextField fullWidth label={t.price_payout} value={form.payout} onChange={e => onChange('payout', e.target.value)} />
                        <TextField fullWidth label={t.image_url} value={form.image_url} onChange={e => onChange('image_url', e.target.value)} />
                    </Stack>
                </Stack>
            </Paper>

            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>Booking Rules</Typography>

                <Stack spacing={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={form.access_mode !== 'CLOSED' && form.allow_customer_cancel !== false}
                                onChange={e => onChange('allow_customer_cancel', e.target.checked)}
                            />
                        }
                        label="Allow Customers to Cancel"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={form.access_mode !== 'CLOSED' && form.allow_customer_reschedule !== false}
                                onChange={e => onChange('allow_customer_reschedule', e.target.checked)}
                            />
                        }
                        label="Allow Customers to Reschedule"
                    />
                </Stack>
            </Paper>

            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" mb={3}>{t.constraints}</Typography>

                <Stack spacing={3}>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            type="datetime-local"
                            fullWidth
                            label={t.valid_from}
                            InputLabelProps={{ shrink: true }}
                            value={form.active_start}
                            onChange={e => onChange('active_start', e.target.value)}
                        />
                        <TextField
                            type="datetime-local"
                            fullWidth
                            label={t.valid_until}
                            InputLabelProps={{ shrink: true }}
                            value={form.active_end}
                            onChange={e => onChange('active_end', e.target.value)}
                        />
                    </Stack>

                    <Box>
                        <Typography variant="subtitle2" mb={1}>{t.notice_period}</Typography>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                type="number"
                                fullWidth
                                label={t.min_notice_general}
                                value={form.min_notice_general}
                                onChange={e => onChange('min_notice_general', Number((e.target as HTMLInputElement).value))}
                                helperText={t.min_notice_general_helper}
                            />
                            <TextField
                                type="number"
                                fullWidth
                                label={t.min_notice_first}
                                value={form.min_notice_first}
                                onChange={e => onChange('min_notice_first', Number((e.target as HTMLInputElement).value))}
                                helperText={t.min_notice_first_helper}
                            />
                        </Stack>
                    </Box>
                </Stack>
            </Paper>
        </Stack>
    );
}