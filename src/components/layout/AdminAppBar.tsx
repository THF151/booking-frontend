'use client';

import React, { useState } from 'react';
import {
    AppBar, Toolbar, Box, Typography, Button, Tooltip, IconButton,
    Avatar, Badge, Select, MenuItem, useColorScheme, SelectChangeEvent, Divider,
    Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import TaskIcon from '@mui/icons-material/Task';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import JobMonitorDialog from '@/components/admin/JobMonitorDialog';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Dictionary } from '@/types';

export default function AdminAppBar({ lang, dict }: { lang: string, dict: Dictionary }) {
    const { tenantName, tenantId, tenantLogo, logout } = useAuthStore();
    const [jobMonitorOpen, setJobMonitorOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { mode, setMode } = useColorScheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try { await api.post('/auth/logout', {}); } catch {}
        logout();
        router.push(`/${lang}/admin`);
    };

    const handleLangChange = (event: SelectChangeEvent) => {
        const newLang = event.target.value;
        const newPath = pathname.replace(`/${lang}`, `/${newLang}`);
        const paramsString = searchParams.toString();
        const finalUrl = paramsString ? `${newPath}?${paramsString}` : newPath;
        router.push(finalUrl);
    };

    return (
        <>
            <AppBar
                position="sticky"
                color="inherit"
                elevation={0}
                sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    zIndex: 1100
                }}
            >
                <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
                    {/* Left: Logo & Tenant Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden' }}>
                        <Link href={`/${lang}/admin/dashboard`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit', maxWidth: '100%' }}>
                            <Avatar
                                src={tenantLogo || "/logo-placeholder.png"}
                                variant="rounded"
                                sx={{ mr: 2, width: 32, height: 32, bgcolor: 'primary.main', flexShrink: 0 }}
                            >
                                {tenantName ? tenantName.charAt(0).toUpperCase() : 'A'}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: '700', lineHeight: 1.1, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {tenantName || dict.admin.dashboard}
                                </Typography>
                                <Tooltip title="Tenant ID">
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', opacity: 0.8, display: { xs: 'none', sm: 'block' } }}>
                                        {tenantId?.substring(0, 8)}...
                                    </Typography>
                                </Tooltip>
                            </Box>
                        </Link>
                    </Box>

                    {/* Desktop Menu */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                        <Select
                            value={lang}
                            onChange={handleLangChange}
                            size="small"
                            variant="outlined"
                            sx={{
                                height: 32,
                                fontSize: '0.875rem',
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { border: '1px solid', borderColor: 'divider' }
                            }}
                        >
                            <MenuItem value="en">🇺🇸 EN</MenuItem>
                            <MenuItem value="de">🇩🇪 DE</MenuItem>
                        </Select>

                        <Tooltip title="Toggle Theme">
                            <IconButton
                                onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                                size="small"
                            >
                                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>

                        <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto', mx: 1 }} />

                        <Tooltip title={dict.admin.jobs.tooltip}>
                            <IconButton onClick={() => setJobMonitorOpen(true)} color="default">
                                <Badge color="warning" variant="dot" invisible={true}>
                                    <TaskIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        <Link href={`/${lang}/admin/settings`} passHref>
                            <IconButton title="Settings" color="default">
                                <SettingsIcon />
                            </IconButton>
                        </Link>

                        <Button
                            color="inherit"
                            startIcon={<LogoutIcon />}
                            onClick={handleLogout}
                            sx={{ ml: 1, textTransform: 'none', color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
                        >
                            {dict.admin.logout}
                        </Button>
                    </Box>

                    <IconButton
                        sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            >
                <Box sx={{ width: 250, pt: 2 }} role="presentation">
                    <List>
                        <ListItem>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 2 }}>
                                Language
                            </Typography>
                            <Select
                                value={lang}
                                onChange={(e) => { handleLangChange(e); setMobileMenuOpen(false); }}
                                size="small"
                                fullWidth
                                sx={{ mx: 2 }}
                            >
                                <MenuItem value="en">🇺🇸 English</MenuItem>
                                <MenuItem value="de">🇩🇪 Deutsch</MenuItem>
                            </Select>
                        </ListItem>

                        <ListItem disablePadding>
                            <ListItemButton onClick={() => { setMode(mode === 'dark' ? 'light' : 'dark'); setMobileMenuOpen(false); }}>
                                <ListItemIcon>
                                    {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                                </ListItemIcon>
                                <ListItemText primary={mode === 'dark' ? "Light Mode" : "Dark Mode"} />
                            </ListItemButton>
                        </ListItem>

                        <Divider sx={{ my: 1 }} />

                        <ListItem disablePadding>
                            <ListItemButton onClick={() => { setJobMonitorOpen(true); setMobileMenuOpen(false); }}>
                                <ListItemIcon><TaskIcon /></ListItemIcon>
                                <ListItemText primary={dict.admin.jobs.title} />
                            </ListItemButton>
                        </ListItem>

                        <Link href={`/${lang}/admin/settings`} passHref style={{ textDecoration: 'none', color: 'inherit' }}>
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => setMobileMenuOpen(false)}>
                                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                                    <ListItemText primary="Settings" />
                                </ListItemButton>
                            </ListItem>
                        </Link>

                        <ListItem disablePadding>
                            <ListItemButton onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                                <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
                                <ListItemText primary={dict.admin.logout} sx={{ color: 'error.main' }} />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            <JobMonitorDialog open={jobMonitorOpen} onClose={() => setJobMonitorOpen(false)} dict={dict} />
        </>
    );
}