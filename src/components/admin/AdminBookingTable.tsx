import React, { useState } from 'react';
import {
    DataGrid,
    GridColDef,
    GridActionsCellItem,
    Toolbar,
    ToolbarButton,
    ExportCsv,
    ExportPrint,
    QuickFilter,
    QuickFilterControl,
    QuickFilterClear,
    QuickFilterTrigger
} from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import DeleteIcon from '@mui/icons-material/Delete';
import CommentIcon from '@mui/icons-material/Comment';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import MailIcon from '@mui/icons-material/Mail';
import SendIcon from '@mui/icons-material/Send';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Tooltip, Box, Typography, Menu, MenuItem, TextField, InputAdornment, Chip, Badge } from '@mui/material';
import { Booking, BookingLabel, MailLog } from '@/types';
import LabelBadge from './LabelBadge';
import AdHocEmailDialog from './AdHocEmailDialog';

dayjs.extend(utc);
dayjs.extend(timezone);

interface AdminBookingTableProps {
    slug: string;
    eventTimezone?: string;
}

type OwnerState = {
    expanded: boolean;
};

const StyledQuickFilter = styled(QuickFilter)({
    display: 'grid',
    alignItems: 'center',
});

const StyledToolbarButton = styled(ToolbarButton)<{ ownerState: OwnerState }>(
    ({ theme, ownerState }) => ({
        gridArea: '1 / 1',
        width: 'min-content',
        height: 'min-content',
        zIndex: 1,
        opacity: ownerState.expanded ? 0 : 1,
        pointerEvents: ownerState.expanded ? 'none' : 'auto',
        transition: theme.transitions.create(['opacity']),
    }),
);

const StyledTextField = styled(TextField)<{
    ownerState: OwnerState;
}>(({ theme, ownerState }) => ({
    gridArea: '1 / 1',
    overflowX: 'clip',
    width: ownerState.expanded ? 260 : 'var(--trigger-width)',
    opacity: ownerState.expanded ? 1 : 0,
    transition: theme.transitions.create(['width', 'opacity']),
}));

function CustomToolbar() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Toolbar>
            <Box sx={{ flex: 1 }} />

            <StyledQuickFilter>
                <QuickFilterTrigger
                    render={(triggerProps, state) => (
                        <Tooltip title="Search" enterDelay={0}>
                            <StyledToolbarButton
                                {...triggerProps}
                                ownerState={{ expanded: state.expanded }}
                                color="default"
                                aria-disabled={state.expanded}
                            >
                                <SearchIcon fontSize="small" />
                            </StyledToolbarButton>
                        </Tooltip>
                    )}
                />
                <QuickFilterControl
                    render={({ ref, ...controlProps }, state) => (
                        <StyledTextField
                            {...controlProps}
                            ownerState={{ expanded: state.expanded }}
                            inputRef={ref}
                            aria-label="Search"
                            placeholder="Search..."
                            size="small"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: state.value ? (
                                        <InputAdornment position="end" sx={{ mr: -0.75 }}>
                                            <QuickFilterClear
                                                edge="end"
                                                size="small"
                                                aria-label="Clear search"
                                            >
                                                <CancelIcon fontSize="small" />
                                            </QuickFilterClear>
                                        </InputAdornment>
                                    ) : null,
                                    ...controlProps.slotProps?.input,
                                },
                                ...controlProps.slotProps,
                            }}
                        />
                    )}
                />
            </StyledQuickFilter>

            <Box sx={{ mx: 1 }} />

            <Tooltip title="Export">
                <ToolbarButton
                    id="export-menu-trigger"
                    aria-controls="export-menu"
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}
                >
                    <FileDownloadIcon fontSize="small" sx={{ mr: 1 }} />
                </ToolbarButton>
            </Tooltip>

            <Menu
                id="export-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <ExportCsv
                    render={<MenuItem />}
                    onClick={handleClose}
                    options={{
                        fileName: 'bookings_export',
                        delimiter: ',',
                        utf8WithBom: true,
                    }}
                >
                    Download as CSV
                </ExportCsv>
                <ExportPrint render={<MenuItem />} onClick={handleClose}>
                    Print
                </ExportPrint>
            </Menu>
        </Toolbar>
    );
}

export default function AdminBookingTable({ slug, eventTimezone }: AdminBookingTableProps) {
    const { tenantId } = useAuthStore();
    const queryClient = useQueryClient();
    const tz = eventTimezone || 'UTC';

    const [labelMenuAnchor, setLabelMenuAnchor] = useState<null | HTMLElement>(null);
    const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

    const [emailDialog, setEmailDialog] = useState<{open: boolean, booking: Booking | null}>({open: false, booking: null});

    const { data: rows = [] } = useQuery({
        queryKey: ['bookings', tenantId, slug],
        queryFn: () => api.get<Booking[]>(`/${tenantId}/events/${slug}/bookings`),
        enabled: !!tenantId
    });

    const { data: labels = [] } = useQuery({
        queryKey: ['labels', tenantId],
        queryFn: () => api.get<BookingLabel[]>(`/${tenantId}/labels`),
        enabled: !!tenantId
    });

    const { data: mailLogs = [] } = useQuery({
        queryKey: ['mail_logs', tenantId],
        queryFn: () => api.get<MailLog[]>(`/${tenantId}/communication/logs`),
        enabled: !!tenantId
    });

    const handleDelete = async (id: string) => {
        if(!confirm('Cancel this booking?')) return;
        try {
            await api.delete(`/${tenantId}/bookings/${id}`);
            queryClient.invalidateQueries({ queryKey: ['bookings', tenantId, slug] });
        } catch (error) {
            console.error(error);
        }
    };

    const handleLabelClick = (event: React.MouseEvent<HTMLDivElement>, id: string) => {
        setLabelMenuAnchor(event.currentTarget);
        setActiveBookingId(id);
    };

    const handleLabelSelect = async (labelId: string | null) => {
        if (activeBookingId) {
            try {
                await api.put(`/${tenantId}/bookings/${activeBookingId}`, { label_id: labelId || "" });
                queryClient.invalidateQueries({ queryKey: ['bookings', tenantId, slug] });
            } catch (e) { console.error(e); }
        }
        setLabelMenuAnchor(null);
        setActiveBookingId(null);
    };

    const columns: GridColDef[] = [
        { field: 'customer_name', headerName: 'Name', width: 150 },
        { field: 'customer_email', headerName: 'Email', width: 200 },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => {
                const status = params.value || 'CONFIRMED';
                return (
                    <Chip
                        label={status}
                        size="small"
                        color={status === 'CANCELLED' ? 'error' : 'success'}
                        variant={status === 'CANCELLED' ? 'outlined' : 'filled'}
                    />
                );
            }
        },
        {
            field: 'label_id',
            headerName: 'Label',
            width: 120,
            valueFormatter: (value) => {
                if (!value) return '';
                const label = labels.find(l => l.id === value);
                return label ? label.name : '';
            },
            renderCell: (params) => (
                <Box onClick={(e) => handleLabelClick(e, params.id as string)} sx={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                    {params.value ? (
                        <LabelBadge labelId={params.value as string} labels={labels} />
                    ) : (
                        <Typography variant="caption" color="text.disabled">Add Label</Typography>
                    )}
                </Box>
            )
        },
        {
            field: 'communication',
            headerName: 'Emails',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const email = params.row.customer_email;
                if (!email) return null;
                const sentLogs = mailLogs.filter(log => log.recipient === email && log.status === 'SENT');

                if (sentLogs.length === 0) return null;

                const tooltipText = (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {sentLogs.map(log => (
                            <div key={log.id}>
                                <strong>{log.template_id}</strong>: {dayjs(log.sent_at).format('YYYY-MM-DD HH:mm')}
                            </div>
                        ))}
                    </Box>
                );

                return (
                    <Tooltip title={tooltipText} arrow>
                        <Box display="flex" alignItems="center" justifyContent="center" width="100%" height="100%">
                            <Badge badgeContent={sentLogs.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 14, minWidth: 14 } }}>
                                <MailIcon color="action" fontSize="small" />
                            </Badge>
                        </Box>
                    </Tooltip>
                );
            }
        },
        {
            field: 'customer_note',
            headerName: 'Notes',
            width: 200,
            valueFormatter: (value) => {
                if (!value) return '';
                return String(value).replace(/(\r\n|\n|\r)/gm, " ");
            },
            renderCell: (params) => {
                if (!params.value) return <span style={{ color: '#ccc' }}>-</span>;
                return (
                    <Tooltip title={params.value as string}>
                        <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                            <CommentIcon fontSize="small" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{params.value as string}</span>
                        </Box>
                    </Tooltip>
                );
            }
        },
        {
            field: 'start_time',
            headerName: `Date (${tz})`,
            width: 180,
            valueGetter: (value: string) => dayjs(value).utc().tz(tz).format('DD.MM.YYYY HH:mm')
        },
        {
            field: 'actions', type: 'actions', width: 100,
            getActions: (params) => [
                <GridActionsCellItem
                    key="email"
                    icon={<SendIcon />}
                    label="Send Email"
                    onClick={() => setEmailDialog({open: true, booking: params.row})}
                    showInMenu={false}
                />,
                <GridActionsCellItem
                    key="del"
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={() => handleDelete(params.id as string)}
                />,
            ]
        }
    ];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Menu
                anchorEl={labelMenuAnchor}
                open={Boolean(labelMenuAnchor)}
                onClose={() => setLabelMenuAnchor(null)}
            >
                <MenuItem onClick={() => handleLabelSelect(null)}><em>None</em></MenuItem>
                {labels.map(l => (
                    <MenuItem key={l.id} onClick={() => handleLabelSelect(l.id)}>
                        <Box width={12} height={12} borderRadius="50%" bgcolor={l.color} mr={1} />
                        {l.name}
                    </MenuItem>
                ))}
            </Menu>

            {eventTimezone && (
                <Box p={1} px={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Times displayed in event timezone: <strong>{eventTimezone}</strong>
                    </Typography>
                </Box>
            )}

            <Box sx={{ flex: 1, width: '100%' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    slots={{ toolbar: CustomToolbar }}
                    showToolbar
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                        },
                    }}
                    sx={{ border: 'none' }}
                />
            </Box>

            {emailDialog.booking && (
                <AdHocEmailDialog
                    open={emailDialog.open}
                    onClose={() => setEmailDialog({open: false, booking: null})}
                    recipientId={emailDialog.booking.id}
                    recipientEmail={emailDialog.booking.customer_email}
                    recipientName={emailDialog.booking.customer_name}
                    targetType="BOOKING"
                    eventId={emailDialog.booking.event_id}
                />
            )}
        </Box>
    );
}