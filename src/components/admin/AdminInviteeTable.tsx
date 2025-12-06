import React, { useState } from 'react';
import { DataGrid, GridColDef, GridToolbar, GridActionsCellItem } from '@mui/x-data-grid';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Button, Box, TextField, Stack, Alert, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Snackbar, Typography, Tooltip, Badge
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MailIcon from '@mui/icons-material/Mail';
import SendIcon from '@mui/icons-material/Send';
import { Invitee, Dictionary, MailLog } from '@/types';
import dayjs from 'dayjs';
import AdHocEmailDialog from './AdHocEmailDialog';

interface AdminInviteeTableProps {
    slug: string;
    dict: Dictionary;
    lang: string;
}

export default function AdminInviteeTable({ slug, dict, lang }: AdminInviteeTableProps) {
    const { tenantId } = useAuthStore();
    const queryClient = useQueryClient();

    const { data: rows = [] } = useQuery({
        queryKey: ['invitees', tenantId, slug],
        queryFn: () => api.get<Invitee[]>(`/${tenantId}/events/${slug}/invitees`),
        enabled: !!tenantId
    });

    const { data: mailLogs = [] } = useQuery({
        queryKey: ['mail_logs', tenantId],
        queryFn: () => api.get<MailLog[]>(`/${tenantId}/communication/logs`),
        enabled: !!tenantId
    });

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', msg: string} | null>(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Invitee | null>(null);
    const [editStatus, setEditStatus] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [snackOpen, setSnackOpen] = useState(false);

    const [emailDialog, setEmailDialog] = useState<{open: boolean, invitee: Invitee | null}>({open: false, invitee: null});

    const handleBatchCreate = async () => {
        setLoading(true);
        setStatusMsg(null);
        const rawEmails = input.split(/[\n\s,;]+/);
        const emailsToImport = rawEmails.map(e => e.trim()).filter(e => e.length > 0 && e.includes('@'));

        if (emailsToImport.length === 0) {
            setStatusMsg({ type: 'error', msg: 'No valid emails found.' });
            setLoading(false);
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const email of emailsToImport) {
            try {
                await api.post(`/${tenantId}/events/${slug}/invitees`, { email });
                successCount++;
            } catch {
                failCount++;
            }
        }

        setInput('');
        queryClient.invalidateQueries({ queryKey: ['invitees', tenantId, slug] });
        setStatusMsg({
            type: successCount > 0 ? 'success' : 'error',
            msg: `Imported ${successCount} tokens.${failCount > 0 ? ` Failed: ${failCount}` : ''}`
        });
        setLoading(false);
    };

    const handleCopyLink = (tokenStr: string) => {
        const link = `${window.location.origin}/${lang}/book/${tenantId}/${slug}?accessToken=${tokenStr}`;
        navigator.clipboard.writeText(link);
        setSnackOpen(true);
    };

    const handleExportCsv = () => {
        if (rows.length === 0) return;
        const headers = ["Email", "Status", "Token", "Link"];
        const csvRows = rows.map((row) => {
            const link = `${window.location.origin}/${lang}/book/${tenantId}/${slug}?accessToken=${row.token}`;
            const email = row.email ? `"${row.email.replace(/"/g, '""')}"` : "";
            const status = `"${row.status}"`;
            const tokenStr = `"${row.token}"`;
            const linkStr = `"${link}"`;
            return [email, status, tokenStr, linkStr].join(",");
        });

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invitees_${slug}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openEdit = (row: Invitee) => {
        setEditTarget(row);
        setEditStatus(row.status);
        setEditEmail(row.email || '');
        setEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editTarget) return;
        try {
            await api.put(`/${tenantId}/invitees/${editTarget.id}`, { status: editStatus, email: editEmail || null });
            setEditOpen(false);
            queryClient.invalidateQueries({ queryKey: ['invitees', tenantId, slug] });
        } catch(e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if(!confirm(dict.common.delete + '?')) return;
        await api.delete(`/${tenantId}/invitees/${id}`);
        queryClient.invalidateQueries({ queryKey: ['invitees', tenantId, slug] });
    };

    const columns: GridColDef[] = [
        { field: 'token', headerName: dict.admin.invitee_table.token_header, width: 250 },
        { field: 'email', headerName: dict.admin.invitee_table.email_header, width: 250 },
        { field: 'status', headerName: dict.admin.invitee_table.status_header, width: 120 },
        {
            field: 'communication',
            headerName: 'Emails',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const email = params.row.email;
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
            field: 'actions', type: 'actions', headerName: dict.admin.invitee_table.actions_header, width: 150,
            getActions: (params) => [
                <GridActionsCellItem
                    key="email"
                    icon={<SendIcon />}
                    label="Send Email"
                    onClick={() => params.row.email && setEmailDialog({open: true, invitee: params.row})}
                    showInMenu={false}
                    disabled={!params.row.email}
                />,
                <GridActionsCellItem key="copy" icon={<LinkIcon />} label={dict.common.copy} onClick={() => handleCopyLink(params.row.token)} showInMenu={false} />,
                <GridActionsCellItem key="edit" icon={<EditIcon />} label={dict.common.edit} onClick={() => openEdit(params.row as Invitee)} />,
                <GridActionsCellItem key="del" icon={<DeleteIcon />} label={dict.common.delete} onClick={() => handleDelete(params.id as string)} />,
            ]
        }
    ];

    return (
        <Box>
            <Box mb={3} p={2} border={1} borderColor="divider" borderRadius={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">{dict.admin.invitee_table.title}</Typography>
                    <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExportCsv} disabled={rows.length === 0}>Export CSV</Button>
                </Box>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                    <TextField size="small" label={dict.admin.invitee_table.import_label} placeholder="user@example.com" multiline minRows={1} maxRows={4} fullWidth value={input} onChange={e => setInput(e.target.value)} />
                    <Button variant="contained" onClick={handleBatchCreate} disabled={loading || !input} sx={{ whiteSpace: 'nowrap', mt: 1 }}>
                        {loading ? dict.common.loading : dict.admin.invitee_table.import_btn}
                    </Button>
                </Stack>
                {statusMsg && <Alert severity={statusMsg.type} sx={{ mt: 2 }}>{statusMsg.msg}</Alert>}
            </Box>
            <div style={{ height: 500, width: '100%' }}><DataGrid rows={rows} columns={columns} slots={{ toolbar: GridToolbar }} /></div>
            <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
                <DialogTitle>{dict.admin.invitee_table.edit_title}</DialogTitle>
                <DialogContent sx={{ pt: 2, minWidth: 300 }}>
                    <Stack spacing={2} mt={1}>
                        <TextField select label={dict.admin.invitee_table.status_header} value={editStatus} onChange={(e) => setEditStatus(e.target.value)} fullWidth>
                            <MenuItem value="ACTIVE">ACTIVE</MenuItem><MenuItem value="USED">USED</MenuItem><MenuItem value="REVOKED">REVOKED</MenuItem>
                        </TextField>
                        <TextField label={dict.admin.invitee_table.email_header} value={editEmail} onChange={(e) => setEditEmail(e.target.value)} fullWidth />
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setEditOpen(false)}>{dict.common.cancel}</Button><Button variant="contained" onClick={handleSaveEdit}>{dict.common.save}</Button></DialogActions>
            </Dialog>
            <Snackbar open={snackOpen} autoHideDuration={2000} onClose={() => setSnackOpen(false)} message={dict.common.copied} />

            {emailDialog.invitee && (
                <AdHocEmailDialog
                    open={emailDialog.open}
                    onClose={() => setEmailDialog({open: false, invitee: null})}
                    recipientId={emailDialog.invitee.id}
                    recipientEmail={emailDialog.invitee.email!}
                    targetType="INVITEE"
                    eventId={emailDialog.invitee.event_id}
                    dict={dict}
                />
            )}
        </Box>
    );
}