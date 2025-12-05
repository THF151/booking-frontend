import React from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';

interface EventInfoProps {
    hostName: string;
    eventName: string;
    description?: string;
    duration: string;
    conferencingText: string;
    imageUrl: string;
    price: string;
    location: string;
}

export default function EventInfoSidebar({
                                             hostName,
                                             eventName,
                                             description,
                                             duration,
                                             price,
                                             location,
                                             conferencingText,
                                             imageUrl
                                         }: EventInfoProps) {
    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                component="img"
                src={imageUrl}
                alt={eventName}
                sx={{
                    width: '100%',
                    height: 140,
                    objectFit: 'contain',
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 1
                }}
            />

            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 1, lineHeight: 1.2 }}>
                    {eventName}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <PersonOutlineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {hostName}
                    </Typography>
                </Stack>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                    <Typography variant="body2" color="text.primary" fontWeight={500}>
                        {duration}
                    </Typography>
                </Stack>

                <Stack direction="row" alignItems="flex-start" spacing={2}>
                    <LocationOnOutlinedIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                    <Box>
                        <Typography variant="body2" color="text.primary" fontWeight={500}>
                            {location}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {conferencingText}
                        </Typography>
                    </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={2}>
                    <PaymentsOutlinedIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                    <Typography variant="body2" color="text.primary" fontWeight={600}>
                        {price}
                    </Typography>
                </Stack>

                {description && (
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            {description}
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Box>
    );
}