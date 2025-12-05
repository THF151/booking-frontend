import React, { useState } from 'react';
import {
    Box, Paper, Typography, Stack, IconButton, Tooltip, Button, Divider, Menu, MenuItem
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';
import LabelIcon from '@mui/icons-material/Label';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import TableViewIcon from '@mui/icons-material/TableView';
import { Badge } from '@mui/material';
import TimezoneSelector from '@/components/booking/TimezoneSelector';
import { Booking, Dictionary } from '@/types';

interface CalendarSidebarProps {
    selectedDate: Dayjs | null;
    onDateChange: (date: Dayjs | null) => void;
    currentTz: string;
    onTzChange: (tz: string) => void;
    activeBookings: Booking[];
    loading: boolean;
    onRefresh: () => void;
    onOpenLabelManager: () => void;
    onExportICS: () => void;
    onExportCSV: () => void;
    onExportExcel: () => void;
    lang: string;
    dict: Dictionary;
}

export default function CalendarSidebar({
                                            selectedDate, onDateChange, currentTz, onTzChange, activeBookings,
                                            loading, onRefresh, onOpenLabelManager, onExportICS, onExportCSV, onExportExcel,
                                            lang, dict
                                        }: CalendarSidebarProps) {
    const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

    function ServerDay(props: PickersDayProps & { highlightedDays?: number[] }) {
        const { day, outsideCurrentMonth, ...other } = props;
        const dateStr = day.format('YYYY-MM-DD');
        const dayBookings = activeBookings.filter(b => {
            return dayjs(b.start_time).tz(currentTz).format('YYYY-MM-DD') === dateStr;
        });

        const count = dayBookings.length;
        const isSelected = !props.outsideCurrentMonth && count > 0;

        return (
            <Badge
                key={day.toString()}
                overlap="circular"
                badgeContent={isSelected ? count : undefined}
                color={count > 5 ? "error" : "primary"}
                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16, fontWeight: 'bold' } }}
            >
                <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
            </Badge>
        );
    }

    return (
        <Stack spacing={3} sx={{ height: '100%' }}>
            <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', borderRadius: 3 }}>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
                    <Typography variant="subtitle1" fontWeight="800" color="text.primary">
                        {dayjs(selectedDate).locale(lang).format('MMMM YYYY')}
                    </Typography>
                    <Stack direction="row">
                        <Tooltip title="Manage Labels">
                            <IconButton size="small" onClick={onOpenLabelManager}>
                                <LabelIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Refresh">
                            <IconButton size="small" onClick={onRefresh} disabled={loading}>
                                <RefreshIcon fontSize="small" sx={{ animation: loading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                <DateCalendar
                    value={selectedDate}
                    onChange={onDateChange}
                    loading={loading}
                    slots={{ day: ServerDay }}
                    sx={{
                        width: '100%',
                        '& .MuiPickersDay-root': { width: 36, height: 36, fontSize: '0.9rem', borderRadius: 2 },
                        '& .MuiDayCalendar-weekDayLabel': { fontWeight: 'bold', color: 'text.primary' }
                    }}
                />

                <Box sx={{ px: 1, width: '100%', mt: 2 }}>
                    <TimezoneSelector value={currentTz} onChange={onTzChange} />
                </Box>

                <Divider sx={{ width: '100%', my: 2 }} />

                <Box sx={{ width: '100%', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="500">
                        {dict.admin.calendar_tab.total_bookings}: <Box component="span" color="primary.main" fontWeight="bold" fontSize="1rem">{activeBookings.length}</Box>
                    </Typography>
                </Box>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 3 }}>
                <DownloadIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                <Box textAlign="center">
                    <Typography variant="subtitle1" fontWeight="bold">{dict.admin.calendar_tab.export_title}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>{dict.admin.calendar_tab.export_desc}</Typography>
                </Box>

                <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                    disabled={activeBookings.length === 0}
                    endIcon={<ExpandMoreIcon />}
                    sx={{
                        mt: 1,
                        bgcolor: 'background.paper',
                        color: 'primary.main',
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: 'grey.100' }
                    }}
                >
                    {dict.admin.calendar_tab.download_btn}
                </Button>

                <Menu
                    anchorEl={exportMenuAnchor}
                    open={Boolean(exportMenuAnchor)}
                    onClose={() => setExportMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    PaperProps={{ sx: { borderRadius: 2, minWidth: 200, mt: 1 } }}
                >
                    <MenuItem onClick={() => { onExportICS(); setExportMenuAnchor(null); }}>
                        <EventIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} /> iCal (.ics)
                    </MenuItem>
                    <MenuItem onClick={() => { onExportCSV(); setExportMenuAnchor(null); }}>
                        <TableViewIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} /> CSV
                    </MenuItem>
                    <MenuItem onClick={() => { onExportExcel(); setExportMenuAnchor(null); }}>
                        <TableViewIcon fontSize="small" sx={{ mr: 1.5, color: 'success.main' }} /> Excel (.xlsx)
                    </MenuItem>
                </Menu>
            </Paper>
        </Stack>
    );
}