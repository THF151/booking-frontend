import React from 'react';
import { Chip } from '@mui/material';
import { BookingLabel } from '@/types';

interface Props {
    labelId?: string;
    labels: BookingLabel[];
    size?: 'small' | 'medium';
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export default function LabelBadge({ labelId, labels, size = 'small', onClick }: Props) {
    const label = labels.find(l => l.id === labelId);

    if (!label) return null;

    return (
        <Chip
            label={label.name}
            size={size}
            onClick={onClick}
            sx={{
                bgcolor: label.color,
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: size === 'small' ? 20 : 24,
                '&:hover': onClick ? { opacity: 0.9 } : {}
            }}
        />
    );
}