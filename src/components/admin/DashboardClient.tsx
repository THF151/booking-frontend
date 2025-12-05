'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Container, Typography, Button, Card, CardContent, Chip, CircularProgress,
    Grid, Paper, Tabs, Tab, InputAdornment, TextField, Divider, SvgIconTypeMap, Collapse
} from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import HistoryIcon from '@mui/icons-material/History';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import dayjs from 'dayjs';

import AdminAppBar from '@/components/layout/AdminAppBar';
import TenantBigCalendar from '@/components/admin/TenantBigCalendar';
import EventFormDialog from '@/components/admin/EventFormDialog';
import { Event, Dictionary, Tenant, Booking } from '@/types';

// --- Components for the Dashboard ---

interface StatCardProps {
    title: string;
    value: string | number;
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    icon: OverridableComponent<SvgIconTypeMap<{}, "svg">>;
    color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
    return (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15`, color: color }}>
                <Icon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
                <Typography variant="body2" color="text.secondary" fontWeight="600">
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                    {value}
                </Typography>
            </Box>
        </Paper>
    );
}

function EventCard({ ev, lang, dict }: { ev: Event, lang: string, dict: Dictionary }) {
    const isManual = ev.schedule_type === 'MANUAL';
    const isPast = dayjs(ev.active_end).isBefore(dayjs());

    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                opacity: isPast ? 0.7 : 1,
                bgcolor: isPast ? 'action.hover' : 'background.paper',
                '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    opacity: 1
                }
            }}
        >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Chip
                        label={ev.access_mode}
                        size="small"
                        color={ev.access_mode === 'OPEN' ? 'success' : ev.access_mode === 'RESTRICTED' ? 'warning' : 'default'}
                        sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                    />
                    <Chip
                        label={isManual ? "Sessions" : "Recurring"}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                </Box>

                <Typography variant="h6" gutterBottom fontWeight="bold" noWrap title={lang === 'de' ? ev.title_de : ev.title_en}>
                    {lang === 'de' ? ev.title_de : ev.title_en}
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 2, display: 'block' }}>
                    /{ev.slug}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {lang === 'de' ? ev.desc_de : ev.desc_en}
                </Typography>

                {isPast && (
                    <Chip
                        icon={<HistoryIcon fontSize="small"/>}
                        label="Ended"
                        size="small"
                        color="default"
                        sx={{ alignSelf: 'flex-start', mb: 2 }}
                    />
                )}

                <Divider sx={{ my: 2 }} />

                <Link href={`/${lang}/admin/events/${ev.slug}`} passHref style={{ width: '100%' }}>
                    <Button variant="outlined" fullWidth sx={{ justifyContent: 'space-between' }}>
                        {dict.admin.manage}
                        <ArrowForwardIcon fontSize="small" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}

export default function DashboardClient({ lang, dict }: { lang: string, dict: Dictionary }) {
    const { tenantId, isAuthenticated, _hasHydrated, setTenantInfo } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const queryClient = useQueryClient();

    const [openCreate, setOpenCreate] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPastEvents, setShowPastEvents] = useState(false);

    // --- Auth & Setup ---
    useEffect(() => {
        if (tenantId && isAuthenticated) {
            api.get<Tenant>(`/tenants`).then(t => {
                setTenantInfo(t.name, t.logo_url);
            }).catch(() => {});
        }
    }, [tenantId, isAuthenticated, setTenantInfo]);

    useEffect(() => {
        if (_hasHydrated && !isAuthenticated) {
            router.replace(`/${lang}/admin`);
        }
    }, [_hasHydrated, isAuthenticated, router, lang]);

    // --- Tabs Handling ---
    const tabParam = searchParams.get('tab');
    const currentTab = tabParam === 'calendar' ? 1 : 0;

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newValue === 1) params.set('tab', 'calendar');
        else params.delete('tab');
        router.replace(`${pathname}?${params.toString()}`);
    };

    // --- Data Fetching ---
    const { data: events = [], isLoading: eventsLoading } = useQuery({
        queryKey: ['events', tenantId],
        queryFn: () => api.get<Event[]>(`/${tenantId}/events`),
        enabled: !!tenantId
    });

    const { data: allBookings = [] } = useQuery({
        queryKey: ['bookings', tenantId],
        queryFn: () => api.get<Booking[]>(`/${tenantId}/bookings`),
        enabled: !!tenantId
    });

    const handleCreateSuccess = () => {
        setOpenCreate(false);
        queryClient.invalidateQueries({ queryKey: ['events', tenantId] });
    };

    // --- Derived State (Stats & Filtering) ---
    const { activeEvents, pastEvents } = useMemo(() => {
        const now = dayjs();
        const all = events.filter(e =>
            e.title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.title_de.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.slug.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const active = all.filter(e => dayjs(e.active_end).isAfter(now));
        const past = all.filter(e => dayjs(e.active_end).isBefore(now));

        return { activeEvents: active, pastEvents: past };
    }, [events, searchTerm]);

    const stats = useMemo(() => {
        const activeCount = events.filter(e => dayjs(e.active_end).isAfter(dayjs())).length;
        const totalBookings = allBookings.filter(b => b.status !== 'CANCELLED').length;
        const today = dayjs().format('YYYY-MM-DD');
        const bookingsToday = allBookings.filter(b => b.status !== 'CANCELLED' && b.start_time.startsWith(today)).length;

        return { activeCount, totalBookings, bookingsToday };
    }, [events, allBookings]);

    if (!_hasHydrated || !isAuthenticated) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            <AdminAppBar lang={lang} dict={dict} />

            <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', pt: 4, pb: 0 }}>
                <Container maxWidth="xl">
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
                        <Box>
                            <Typography variant="h4" fontWeight="800" color="text.primary" gutterBottom>
                                {dict.admin.dashboard}
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Welcome back. Here is what&apos;s happening today.
                            </Typography>
                        </Box>
                        <Link href={`/${lang}/admin/events/create`} passHref>
                            <Button variant="contained" startIcon={<AddIcon />} size="large" sx={{ px: 3, py: 1, borderRadius: 2 }}>
                                {dict.admin.create_event}
                            </Button>
                        </Link>
                    </Box>

                    <Grid container spacing={3} mb={4}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <StatCard title="Bookings Today" value={stats.bookingsToday} icon={TrendingUpIcon} color="#10B981" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <StatCard title="Total Active Bookings" value={stats.totalBookings} icon={PeopleIcon} color="#3B82F6" />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <StatCard title="Active Events" value={stats.activeCount} icon={EventAvailableIcon} color="#8B5CF6" />
                        </Grid>
                    </Grid>

                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{ minHeight: 48, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', minHeight: 48 } }}
                    >
                        <Tab icon={<DashboardIcon fontSize="small" />} iconPosition="start" label={dict.admin.events} />
                        <Tab icon={<CalendarMonthIcon fontSize="small" />} iconPosition="start" label={dict.admin.global_calendar_label} />
                    </Tabs>
                </Container>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Container maxWidth="xl" sx={{ mt: 4, pb: 8, height: '100%' }}>
                    {currentTab === 0 && (
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <TextField
                                    placeholder="Search events..."
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{ width: 300, bgcolor: 'background.paper' }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {activeEvents.length} Active / {pastEvents.length} Past
                                </Typography>
                            </Box>

                            {eventsLoading ? (
                                <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
                            ) : (
                                <>
                                    {/* Active Events Grid */}
                                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }} gap={3} mb={4}>
                                        {activeEvents.map((ev) => (
                                            <EventCard key={ev.id} ev={ev} lang={lang} dict={dict} />
                                        ))}
                                    </Box>

                                    {activeEvents.length === 0 && (
                                        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'transparent' }} variant="outlined">
                                            <Typography color="text.secondary">No active events found.</Typography>
                                        </Paper>
                                    )}

                                    {/* Past Events Section */}
                                    {pastEvents.length > 0 && (
                                        <Box mt={6}>
                                            <Button
                                                onClick={() => setShowPastEvents(!showPastEvents)}
                                                endIcon={showPastEvents ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                color="inherit"
                                                sx={{ mb: 2 }}
                                            >
                                                {showPastEvents ? "Hide Past Events" : `Show Past Events (${pastEvents.length})`}
                                            </Button>

                                            <Collapse in={showPastEvents}>
                                                <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }} gap={3}>
                                                    {pastEvents.map((ev) => (
                                                        <EventCard key={ev.id} ev={ev} lang={lang} dict={dict} />
                                                    ))}
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    )}

                    {currentTab === 1 && (
                        <Paper elevation={0} variant="outlined" sx={{ p: 0 }}>
                            <Box p={3} borderBottom={1} borderColor="divider" flexShrink={0}>
                                <Typography variant="h5" fontWeight="bold">{dict.admin.global_calendar_label}</Typography>
                                <Typography variant="body2" color="text.secondary">{dict.admin.global_calendar_desc}</Typography>
                            </Box>
                            <Box p={0} sx={{ height: 'calc(100% - 81px)' }}>
                                <TenantBigCalendar dict={dict} lang={lang} events={events || []} />
                            </Box>
                        </Paper>
                    )}

                    {openCreate && (
                        <EventFormDialog
                            key="create-dialog"
                            open={openCreate}
                            onClose={() => setOpenCreate(false)}
                            dict={dict}
                            initialData={null}
                            onSuccess={handleCreateSuccess}
                        />
                    )}
                </Container>
            </Box>
        </Box>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ArrowForwardIcon(props: any) {
    return (
        <svg {...props} width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg>
    );
}