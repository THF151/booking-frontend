'use client';

import React, { useState } from 'react';
import {
    AppBar, Toolbar, Box, Typography, Button, Tooltip, IconButton,
    Avatar, Badge, Select, MenuItem, useColorScheme, SelectChangeEvent, Divider
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import TaskIcon from '@mui/icons-material/Task';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
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
                <Toolbar sx={{ minHeight: 64 }}>
                    {/* Left: Logo & Tenant Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <Link href={`/${lang}/admin/dashboard`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit' }}>
                            <Avatar
                                src={tenantLogo || "/logo-placeholder.png"}
                                variant="rounded"
                                sx={{ mr: 2, width: 32, height: 32, bgcolor: 'primary.main' }}
                            >
                                {tenantName ? tenantName.charAt(0).toUpperCase() : 'A'}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: '700', lineHeight: 1.1, color: 'text.primary' }}>
                                    {tenantName || dict.admin.dashboard}
                                </Typography>
                                <Tooltip title="Tenant ID">
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', opacity: 0.8 }}>
                                        {tenantId?.substring(0, 8)}...
                                    </Typography>
                                </Tooltip>
                            </Box>
                        </Link>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                </Toolbar>
            </AppBar>
            <JobMonitorDialog open={jobMonitorOpen} onClose={() => setJobMonitorOpen(false)} dict={dict} />
        </>
    );
}