'use client';

import React, { useState } from 'react';
import {
    Box, Container, Typography, Tabs, Tab, Paper, Breadcrumbs, Chip, Stack, Button,
    TextField, IconButton, InputAdornment, Dialog, DialogTitle, DialogContent, Grid
} from '@mui/material';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { Badge } from '@mui/material';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BlockIcon from '@mui/icons-material/Block';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MailIcon from '@mui/icons-material/Mail';
import EditIcon from '@mui/icons-material/Edit';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AssessmentIcon from '@mui/icons-material/Assessment';

import AdminBookingTable from '@/components/admin/AdminBookingTable';
import AdminInviteeTable from '@/components/admin/AdminInviteeTable';
import OverrideDialog from '@/components/admin/OverrideDialog';
import SessionManager from '@/components/admin/SessionManager';
import AdminBookingDialog from '@/components/admin/AdminBookingDialog';
import CampaignManager from '@/components/admin/CampaignManager';
import Header from '@/components/layout/Header';
import AdminAppBar from '@/components/layout/AdminAppBar';
import TenantBigCalendar from '@/components/admin/TenantBigCalendar';
import { Event, Booking, Dictionary, Override } from '@/types';

export default function EventDetailClient({ lang, slug, dict }: { lang: string, slug: string, dict: Dictionary }) {
    const { tenantId } = useAuthStore();
    const queryClient = useQueryClient();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const t = dict.admin.event_detail;

    // --- Tab State Management ---
    const tabMap = ['overview', 'bookings', 'invitees'];
    const initialTab = tabMap.indexOf(searchParams.get('view') || 'overview');
    const [tab, setTab] = useState(initialTab !== -1 ? initialTab : 0);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
        const params = new URLSearchParams(searchParams.toString());
        params.set('view', tabMap[newValue]);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const [overrideOpen, setOverrideOpen] = useState(false);
    const [adminBookOpen, setAdminBookOpen] = useState(false);
    const [campaignOpen, setCampaignOpen] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState<Dayjs>(dayjs());
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

    const { data: event, isLoading: eventLoading } = useQuery({
        queryKey: ['event', tenantId, slug],
        queryFn: () => api.get<Event>(`/${tenantId}/events/${slug}`),
        enabled: !!tenantId
    });

    const { data: bookings = [] } = useQuery({
        queryKey: ['bookings', tenantId, slug],
        queryFn: () => api.get<Booking[]>(`/${tenantId}/events/${slug}/bookings`),
        enabled: !!tenantId
    });

    const { data: overrides = [] } = useQuery({
        queryKey: ['overrides', tenantId, slug, calendarMonth.format('YYYY-MM')],
        queryFn: () => {
            const start = calendarMonth.startOf('month').subtract(7, 'day').format('YYYY-MM-DD');
            const end = calendarMonth.endOf('month').add(7, 'day').format('YYYY-MM-DD');
            return api.get<Override[]>(`/${tenantId}/events/${slug}/overrides?start=${start}&end=${end}`);
        },
        enabled: !!tenantId && event?.schedule_type === 'RECURRING'
    });

    const refreshAll = () => {
        queryClient.invalidateQueries({ queryKey: ['event', tenantId, slug] });
        queryClient.invalidateQueries({ queryKey: ['overrides', tenantId, slug] });
        queryClient.invalidateQueries({ queryKey: ['bookings', tenantId, slug] });
    };

    if (eventLoading || !event) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <Typography>{dict.common.loading}</Typography>
        </Box>
    );

    const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');
    const isManual = event.schedule_type === 'MANUAL';
    const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/${lang}/book/${tenantId}/${slug}` : '';
    const eventConfig = event.config_json ? JSON.parse(event.config_json) : {};

    function ServerDay(props: PickersDayProps & { highlightedDays?: string[] }) {
        const { day, outsideCurrentMonth, ...other } = props;
        const dateStr = (day as unknown as Dayjs).format('YYYY-MM-DD');

        const count = activeBookings.filter(b => dayjs(b.start_time).format('YYYY-MM-DD') === dateStr).length;
        const override = overrides.find(o => o.date === dateStr);
        const isBlocked = override?.is_unavailable;
        const isModified = override && !isBlocked;

        let badgeContent = undefined;
        let badgeColor: "primary" | "error" | "warning" | "default" = "primary";

        if (isBlocked) {
            badgeContent = <BlockIcon sx={{ fontSize: 12 }} />;
            badgeColor = "error";
        } else if (isModified) {
            badgeContent = <EditLocationIcon sx={{ fontSize: 12 }} />;
            badgeColor = "warning";
        } else if (count > 0 && !outsideCurrentMonth) {
            badgeContent = count;
            badgeColor = "primary";
        }

        return (
            <Badge key={day.toString()} overlap="circular" badgeContent={badgeContent} color={badgeColor}>
                <PickersDay
                    {...other}
                    outsideCurrentMonth={outsideCurrentMonth}
                    day={day}
                    onClick={() => { setSelectedDate(day); setOverrideOpen(true); }}
                    sx={{
                        bgcolor: isBlocked ? 'action.hover' : 'inherit',
                        opacity: isBlocked ? 0.6 : 1,
                        textDecoration: isBlocked ? 'line-through' : 'none',
                        '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
                    }}
                />
            </Badge>
        );
    }

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header lang={lang} />
            <AdminAppBar lang={lang} dict={dict} />

            <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', pt: 3, pb: 0 }}>
                <Container maxWidth="xl">
                    {/* Breadcrumbs */}
                    <Breadcrumbs sx={{ mb: 3 }}>
                        <Link href={`/${lang}/admin/dashboard`} passHref style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
                            <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                            {dict.admin.dashboard}
                        </Link>
                        <Typography color="text.primary" fontWeight="500" sx={{ display: 'flex', alignItems: 'center' }}>
                            {lang === 'de' ? event.title_de : event.title_en}
                        </Typography>
                    </Breadcrumbs>

                    {/* Header Actions */}
                    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-start' }} gap={3} mb={4}>
                        <Box>
                            <Typography variant="h4" fontWeight="800" sx={{ mb: 1 }}>
                                {lang === 'de' ? event.title_de : event.title_en}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label={event.access_mode} color={event.access_mode === 'OPEN' ? 'success' : 'default'} size="small" sx={{ fontWeight: 600 }} />
                                <Chip label={isManual ? "Sessions" : "Recurring"} variant="outlined" size="small" />
                                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', ml: 1 }}>
                                    /{event.slug}
                                </Typography>
                            </Stack>
                        </Box>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={<MailIcon />}
                                onClick={() => setCampaignOpen(true)}
                                sx={{ bgcolor: 'background.paper' }}
                            >
                                {dict.admin.communication.send_btn}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() => setAdminBookOpen(true)}
                                sx={{ bgcolor: 'background.paper' }}
                            >
                                {dict.admin.sessions.add_booking}
                            </Button>
                            <Link href={`/${lang}/admin/events/${slug}/edit`} passHref>
                                <Button variant="contained" startIcon={<EditIcon />}>
                                    {dict.common.edit}
                                </Button>
                            </Link>
                        </Stack>
                    </Box>

                    {/* Tabs */}
                    <Tabs
                        value={tab}
                        onChange={handleTabChange}
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                minHeight: 48
                            }
                        }}
                    >
                        <Tab icon={<AssessmentIcon fontSize="small" />} iconPosition="start" label={t.tabs.overview} />
                        <Tab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label={t.tabs.bookings} />
                        <Tab icon={<ConfirmationNumberIcon fontSize="small" />} iconPosition="start" label={t.tabs.invitees} />
                    </Tabs>
                </Container>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 4 }}>
                <Container maxWidth="xl">
                    {tab === 0 && (
                        isManual ? (
                            <SessionManager
                                eventSlug={slug}
                                eventTimezone={event.timezone}
                                dict={dict}
                                lang={lang}
                                bookings={activeBookings}
                                accessMode={event.access_mode}
                            />
                        ) : (
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, lg: 4 }}>
                                    <Paper variant="outlined" sx={{ p: 3, height: '100%', borderRadius: 3 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                            <Typography variant="h6" fontWeight="bold">{t.calendar.title}</Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Chip size="small" label="Blocked" color="error" variant="outlined" icon={<BlockIcon />} />
                                                <Chip size="small" label="Modified" color="warning" variant="outlined" icon={<EditLocationIcon />} />
                                            </Stack>
                                        </Box>
                                        <DateCalendar
                                            onMonthChange={setCalendarMonth}
                                            slots={{ day: ServerDay }}
                                            sx={{
                                                width: '100%',
                                                '& .MuiPickersDay-root': { borderRadius: 2 }
                                            }}
                                        />
                                        <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 2 }}>
                                            {t.calendar.helper}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid size={{ xs: 12, lg: 8 }}>
                                    <Stack spacing={3}>
                                        {/* Quick Stats */}
                                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" mb={3}>{t.stats.title}</Typography>
                                            <Grid container spacing={4}>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <Typography variant="caption" color="text.secondary">{t.stats.total}</Typography>
                                                    <Typography variant="h4" fontWeight="bold">{activeBookings.length}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 6, md: 3 }}>
                                                    <Typography variant="caption" color="text.secondary">{t.stats.price}</Typography>
                                                    <Typography variant="h4" fontWeight="bold">{event.payout}</Typography>
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>{t.stats.link_label}</Typography>
                                                    <Stack direction="row" spacing={1}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            value={publicLink}
                                                            slotProps={{
                                                                input: {
                                                                    readOnly: true,
                                                                    endAdornment: (
                                                                        <InputAdornment position="end">
                                                                            <IconButton onClick={() => navigator.clipboard.writeText(publicLink)} edge="end">
                                                                                <ContentCopyIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    )
                                                                }
                                                            }}
                                                        />
                                                        <Button variant="outlined" href={publicLink} target="_blank" startIcon={<OpenInNewIcon />}>
                                                            {dict.common.open}
                                                        </Button>
                                                    </Stack>
                                                </Grid>
                                            </Grid>
                                        </Paper>

                                        {/* Big Calendar Preview */}
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" mb={2}>
                                                {lang === 'de' ? 'Kalender Übersicht' : 'Event Calendar'}
                                            </Typography>
                                            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                                <TenantBigCalendar dict={dict} lang={lang} events={[event]} eventSlug={slug} />
                                            </Paper>
                                        </Box>
                                    </Stack>
                                </Grid>
                            </Grid>
                        )
                    )}

                    {tab === 1 && (
                        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: '70vh' }}>
                            <AdminBookingTable slug={slug} eventTimezone={event.timezone} />
                        </Paper>
                    )}

                    {tab === 2 && (
                        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: '70vh', p: 2 }}>
                            <AdminInviteeTable slug={slug} dict={dict} lang={lang} />
                        </Paper>
                    )}
                </Container>
            </Box>

            {/* --- Dialogs --- */}

            {overrideOpen && !isManual && (
                <OverrideDialog
                    key={`override-${selectedDate?.toString()}`}
                    open={overrideOpen}
                    onClose={() => setOverrideOpen(false)}
                    date={selectedDate}
                    slug={slug}
                    dict={dict}
                    existingOverride={selectedDate ? overrides.find(o => o.date === selectedDate.format('YYYY-MM-DD')) || null : null}
                    eventConfig={eventConfig}
                    onSuccess={refreshAll}
                />
            )}

            {adminBookOpen && (
                <AdminBookingDialog
                    open={adminBookOpen}
                    onClose={() => setAdminBookOpen(false)}
                    tenantId={tenantId || ''}
                    slug={slug}
                    eventTimezone={event.timezone}
                    dict={dict}
                    accessMode={event.access_mode}
                />
            )}

            <Dialog open={campaignOpen} onClose={() => setCampaignOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>Send Email Campaign</DialogTitle>
                <DialogContent sx={{ p: 0 }}>
                    <CampaignManager dict={dict} preselectedEventId={event.id} />
                </DialogContent>
            </Dialog>
        </Box>
    );
}