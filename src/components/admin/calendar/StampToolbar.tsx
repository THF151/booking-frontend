import React, { useState } from 'react';
import {
    Box,
    ToggleButton,
    Typography,
    Menu,
    MenuItem,
    Paper,
    Fade,
    IconButton,
    Tooltip
} from '@mui/material';
import ApprovalIcon from '@mui/icons-material/Approval';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';
import { BookingLabel } from '@/types';

interface StampToolbarProps {
    labels: BookingLabel[];
    activeLabelId: string | null;
    onToggle: (labelId: string | null) => void;
}

export default function StampToolbar({ labels, activeLabelId, onToggle }: StampToolbarProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const activeLabel = labels.find(l => l.id === activeLabelId);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (activeLabelId) {
            onToggle(null);
        } else {
            setAnchorEl(event.currentTarget);
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleSelect = (labelId: string) => {
        onToggle(labelId);
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Paper
                elevation={0}
                sx={{
                    border: '1px solid',
                    borderColor: activeLabelId ? activeLabel?.color : 'divider',
                    bgcolor: activeLabelId ? `${activeLabel?.color}15` : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    p: 0.5,
                    borderRadius: 2,
                    transition: 'all 0.2s'
                }}
            >
                <ToggleButton
                    value="check"
                    selected={!!activeLabelId}
                    onChange={() => {}}
                    onClick={handleClick}
                    sx={{
                        border: 'none',
                        borderRadius: 1.5,
                        py: 0.5,
                        px: 2,
                        textTransform: 'none',
                        color: activeLabelId ? 'text.primary' : 'text.secondary',
                        '&.Mui-selected': {
                            bgcolor: 'transparent',
                            '&:hover': { bgcolor: 'transparent' }
                        }
                    }}
                >
                    <ApprovalIcon
                        sx={{
                            mr: 1,
                            color: activeLabelId ? activeLabel?.color : 'inherit',
                            animation: activeLabelId ? 'pulse 2s infinite' : 'none',
                            '@keyframes pulse': {
                                '0%': { transform: 'scale(1)' },
                                '50%': { transform: 'scale(1.1)' },
                                '100%': { transform: 'scale(1)' }
                            }
                        }}
                    />
                    <Typography fontWeight="600" variant="body2">
                        {activeLabelId ? `Stamping: ${activeLabel?.name}` : "Stamp Mode"}
                    </Typography>
                </ToggleButton>

                {activeLabelId ? (
                    <Tooltip title="Exit Stamp Mode">
                        <IconButton
                            size="small"
                            onClick={() => onToggle(null)}
                            sx={{ ml: 0.5 }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                ) : (
                    <IconButton
                        size="small"
                        onClick={handleMenuClick}
                        sx={{ ml: 0.5 }}
                    >
                        <ArrowDropDownIcon />
                    </IconButton>
                )}
            </Paper>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
                PaperProps={{
                    sx: { mt: 1, minWidth: 200, borderRadius: 2 }
                }}
            >
                <Box px={2} py={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                        SELECT LABEL TO STAMP
                    </Typography>
                </Box>
                {labels.map(l => (
                    <MenuItem
                        key={l.id}
                        onClick={() => handleSelect(l.id)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                        <Box
                            sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                bgcolor: l.color
                            }}
                        />
                        <Typography variant="body2">{l.name}</Typography>
                        {l.payout > 0 && (
                            <Typography variant="caption" color="success.main" fontWeight="bold">
                                {l.payout}€
                            </Typography>
                        )}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}