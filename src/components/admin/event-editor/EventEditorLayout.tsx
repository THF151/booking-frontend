'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, AppBar, Toolbar, Typography, Button, Container,
    Paper, List, ListItemButton, ListItemText, ListItemIcon,
    Divider, Stack, IconButton, Alert, CircularProgress, Drawer, useTheme, useMediaQuery, Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TaskIcon from '@mui/icons-material/Task';
import { Dictionary } from '@/types';
import JobMonitorDialog from '@/components/admin/JobMonitorDialog';

type Section = 'general' | 'availability' | 'settings' | 'notifications';

interface Props {
    title: string;
    lang: string;
    dict: Dictionary;
    onSave: () => Promise<void>;
    isSaving: boolean;
    isDirty: boolean;
    onBack: () => void;
    children: (activeSection: Section) => React.ReactNode;
}

export default function EventEditorLayout({
                                              title, dict, onSave, isSaving, isDirty, onBack, children
                                          }: Props) {
    const [activeSection, setActiveSection] = useState<Section>('general');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [jobMonitorOpen, setJobMonitorOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleSave = async () => {
        await onSave();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const navContent = (
        <List component="nav" disablePadding>
            <ListItemButton
                selected={activeSection === 'general'}
                onClick={() => { setActiveSection('general'); setMobileOpen(false); }}
                sx={{ borderLeft: 4, borderColor: activeSection === 'general' ? 'primary.main' : 'transparent' }}
            >
                <ListItemIcon><InfoIcon color={activeSection === 'general' ? 'primary' : 'inherit'} /></ListItemIcon>
                <ListItemText primary={dict.admin.event_form.general} secondary={dict.admin.event_form.section_general_desc} />
            </ListItemButton>
            <Divider />
            <ListItemButton
                selected={activeSection === 'availability'}
                onClick={() => { setActiveSection('availability'); setMobileOpen(false); }}
                sx={{ borderLeft: 4, borderColor: activeSection === 'availability' ? 'primary.main' : 'transparent' }}
            >
                <ListItemIcon><CalendarMonthIcon color={activeSection === 'availability' ? 'primary' : 'inherit'} /></ListItemIcon>
                <ListItemText primary={dict.admin.event_form.schedule} secondary={dict.admin.event_form.section_schedule_desc} />
            </ListItemButton>
            <Divider />
            <ListItemButton
                selected={activeSection === 'settings'}
                onClick={() => { setActiveSection('settings'); setMobileOpen(false); }}
                sx={{ borderLeft: 4, borderColor: activeSection === 'settings' ? 'primary.main' : 'transparent' }}
            >
                <ListItemIcon><SettingsIcon color={activeSection === 'settings' ? 'primary' : 'inherit'} /></ListItemIcon>
                <ListItemText primary={dict.admin.event_form.details} secondary={dict.admin.event_form.section_details_desc} />
            </ListItemButton>
            <Divider />
            <ListItemButton
                selected={activeSection === 'notifications'}
                onClick={() => { setActiveSection('notifications'); setMobileOpen(false); }}
                sx={{ borderLeft: 4, borderColor: activeSection === 'notifications' ? 'primary.main' : 'transparent' }}
            >
                <ListItemIcon><NotificationsIcon color={activeSection === 'notifications' ? 'primary' : 'inherit'} /></ListItemIcon>
                <ListItemText primary={dict.admin.communication.notifications_tab} secondary="Rules & Templates" />
            </ListItemButton>
        </List>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
            <AppBar position="fixed" color="default" elevation={1} sx={{ bgcolor: 'background.paper', zIndex: 1200 }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton onClick={onBack} edge="start">
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2, display: { xs: 'none', sm: 'block' } }}>
                            {title}
                        </Typography>
                        {isDirty && <Typography component="span" color="warning.main" sx={{ ml: 1, fontSize: '0.8rem', display: { xs: 'none', sm: 'block' } }}>● {dict.common.unsaved}</Typography>}
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title={dict.admin.jobs.tooltip}>
                            <IconButton onClick={() => setJobMonitorOpen(true)}>
                                <TaskIcon />
                            </IconButton>
                        </Tooltip>

                        {saveSuccess && <Alert severity="success" sx={{ py: 0, px: 2, display: { xs: 'none', sm: 'flex' } }}>{dict.common.saved}</Alert>}
                        <Button
                            variant="contained"
                            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={!isDirty || isSaving}
                            size={isMobile ? "small" : "medium"}
                        >
                            {isSaving ? dict.common.saving : dict.common.save}
                        </Button>
                        {isMobile && (
                            <IconButton onClick={() => setMobileOpen(true)} edge="end">
                                <MenuIcon />
                            </IconButton>
                        )}
                    </Stack>
                </Toolbar>
            </AppBar>

            <Toolbar />

            <Container maxWidth="xl" sx={{ flex: 1, display: 'flex', py: 4, gap: 4, height: 'calc(100vh - 64px)' }}>
                {!isMobile ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            width: 280,
                            flexShrink: 0,
                            height: 'fit-content',
                            position: 'sticky',
                            top: 80,
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}
                    >
                        {navContent}
                    </Paper>
                ) : (
                    <Drawer
                        anchor="left"
                        open={mobileOpen}
                        onClose={() => setMobileOpen(false)}
                    >
                        <Box width={280} pt={2}>
                            {navContent}
                        </Box>
                    </Drawer>
                )}

                <Box sx={{ flex: 1, minWidth: 0, pb: 4 }}>
                    {children(activeSection)}
                </Box>
            </Container>

            <JobMonitorDialog open={jobMonitorOpen} onClose={() => setJobMonitorOpen(false)} dict={dict} />
        </Box>
    );
}