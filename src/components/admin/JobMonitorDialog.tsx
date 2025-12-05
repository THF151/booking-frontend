import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Chip,
    IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Job, Dictionary } from '@/types';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';

interface Props {
    open: boolean;
    onClose: () => void;
    dict: Dictionary;
}

export default function JobMonitorDialog({ open, onClose, dict }: Props) {
    const { tenantId } = useAuthStore();
    const t = dict.admin.jobs;

    const { data: jobs = [], refetch, isLoading } = useQuery({
        queryKey: ['jobs', tenantId],
        queryFn: () => api.get<Job[]>(`/${tenantId}/jobs`),
        enabled: open && !!tenantId,
        refetchInterval: open ? 5000 : false
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {t.title}
                <Box>
                    <IconButton onClick={() => refetch()} disabled={isLoading}>
                        <RefreshIcon />
                    </IconButton>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>{t.type_header}</TableCell>
                                <TableCell>{t.status_header}</TableCell>
                                <TableCell>{t.time_header}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {jobs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No active jobs
                                    </TableCell>
                                </TableRow>
                            ) : (
                                jobs.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {job.id.substring(0, 8)}
                                        </TableCell>
                                        <TableCell>{job.job_type}</TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Chip
                                                    label={job.status}
                                                    size="small"
                                                    color={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'error' : job.status === 'PROCESSING' ? 'warning' : 'default'}
                                                    variant="outlined"
                                                />
                                                {job.error_message && (
                                                    <Tooltip title={job.error_message}>
                                                        <InfoIcon color="error" fontSize="small" />
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {dayjs(job.execute_at).format('DD.MM HH:mm:ss')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{dict.common.close}</Button>
            </DialogActions>
        </Dialog>
    );
}