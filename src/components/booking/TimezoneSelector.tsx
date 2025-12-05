import React from 'react';
import { Autocomplete, TextField, Box } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';

const allTimezones = Intl.supportedValuesOf('timeZone');

interface Props {
    value: string;
    onChange: (tz: string) => void;
}

export default function TimezoneSelector({ value, onChange }: Props) {
    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            width: '100%',
            maxWidth: 300,
            mt: 2,
            opacity: 0.8,
            '&:hover': { opacity: 1 },
            transition: 'opacity 0.2s'
        }}>
            <PublicIcon color="action" fontSize="small" />
            <Autocomplete
                disableClearable
                options={allTimezones}
                value={value}
                onChange={(_, newValue) => onChange(newValue)}
                fullWidth
                size="small"
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="standard"
                        placeholder="Select Timezone"
                        sx={{
                            '& .MuiInput-root': {
                                fontSize: '0.875rem',
                                '&:before': { borderBottomStyle: 'dashed' }
                            }
                        }}
                    />
                )}
                ListboxProps={{
                    style: { maxHeight: 200, fontSize: '0.875rem' }
                }}
            />
        </Box>
    );
}