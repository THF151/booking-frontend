import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Stack, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { Dictionary } from '@/types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface UserDetails {
    name: string;
    email: string;
    notes: string;
}

interface UserDetailsFormProps {
    selectedIsoTime: string;
    userTimezone: string;
    onBack: () => void;
    onSubmit: (data: UserDetails) => void;
    dict: Dictionary;
    locale: string;
    initialEmail?: string;
}

export default function UserDetailsForm({ selectedIsoTime, userTimezone, onBack, onSubmit, dict, locale, initialEmail }: UserDetailsFormProps) {
    const [formData, setFormData] = useState<UserDetails>({ name: '', email: initialEmail || '', notes: '' });

    const localDate = dayjs(selectedIsoTime).tz(userTimezone);

    const displayDate = localDate.locale(locale === 'de' ? 'de' : 'en').format('dddd, D. MMMM');
    const displayTime = localDate.format('HH:mm');

    const formattedDate = locale === 'de'
        ? `${displayDate} um ${displayTime}`
        : `${displayDate} at ${displayTime}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 480, mx: 'auto', p: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <IconButton onClick={onBack} size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <ArrowBackIcon fontSize="small" sx={{ color: 'text.primary' }} />
                </IconButton>
                <Typography variant="h6" color="text.primary">{dict.booking.enter_details}</Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {dict.booking.booking_label} <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{formattedDate}</Box>
            </Typography>

            <Stack spacing={3}>
                <TextField
                    name="name"
                    label={dict.booking.form.name_label}
                    variant="outlined"
                    fullWidth
                    required
                    placeholder={dict.booking.form.name_placeholder}
                    value={formData.name}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    name="email"
                    label={dict.booking.form.email_label}
                    type="email"
                    variant="outlined"
                    fullWidth
                    required
                    placeholder={dict.booking.form.email_placeholder}
                    helperText={dict.booking.form.email_helper}
                    value={formData.email}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    name="notes"
                    label={dict.booking.form.notes_label}
                    multiline
                    rows={3}
                    variant="outlined"
                    fullWidth
                    placeholder={dict.booking.form.notes_placeholder}
                    value={formData.notes}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                />

                <Box sx={{ pt: 2 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        sx={{ py: 1.5, fontSize: '1rem' }}
                    >
                        {dict.booking.form.submit_btn}
                    </Button>
                </Box>

                <Box textAlign="center" mt={2} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                        {dict.booking.form.privacy_note}{' '}
                        <Link
                            href="https://bwsyncandshare.kit.edu/s/QcCCMagbBjoBcN6"
                            target="_blank"
                            style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                            {dict.booking.form.privacy_link}
                        </Link>
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                        <Link
                            href="https://www.win.kit.edu/deutsch/impressum.php"
                            target="_blank"
                            style={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                            Impressum
                        </Link>
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}