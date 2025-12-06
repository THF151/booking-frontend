import React, { useState } from 'react';
import {
    Box, Typography, Button, TextField, Stack,
    Paper, Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { DataGrid, GridColDef, GridActionsCellItem, GridToolbar } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
import { Dictionary } from '@/types';

interface User {
    id: string;
    username: string;
    role: string;
    created_at: string;
}

export default function TeamMemberTable({ dict }: { dict: Dictionary }) {
    const { tenantId, user } = useAuthStore();
    const queryClient = useQueryClient();
    const t = dict.admin.team;

    const [openAdd, setOpenAdd] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { data: members = [], isLoading } = useQuery({
        queryKey: ['members', tenantId],
        queryFn: () => api.get<User[]>(`/${tenantId}/members`),
        enabled: !!tenantId
    });

    const createMutation = useMutation({
        mutationFn: (data: unknown) => api.post(`/${tenantId}/members`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['members', tenantId] });
            setOpenAdd(false);
            setNewUsername('');
            setNewPassword('');
            setError(null);
        },
        onError: (err: Error) => setError(err.message || "Failed to create user")
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/${tenantId}/members/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', tenantId] }),
        onError: (err: Error) => alert(err.message || "Failed to delete user")
    });

    const handleAdd = () => {
        if (!newUsername || !newPassword) return;
        createMutation.mutate({ username: newUsername, password: newPassword });
    };

    const handleDelete = (id: string) => {
        if (confirm(t.delete_confirm)) {
            deleteMutation.mutate(id);
        }
    };

    const columns: GridColDef[] = [
        { field: 'username', headerName: t.username, width: 200 },
        { field: 'role', headerName: t.role, width: 120 },
        {
            field: 'created_at', headerName: t.created_at, width: 200,
            valueFormatter: (val) => dayjs(val).format('YYYY-MM-DD HH:mm')
        },
        {
            field: 'actions', type: 'actions', width: 100,
            getActions: (params) => {
                const isSelf = params.row.id === user?.id;
                if (isSelf) return [];
                return [
                    <GridActionsCellItem
                        key="delete"
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={() => handleDelete(params.id as string)}
                        showInMenu={false}
                    />
                ];
            }
        }
    ];

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">{t.title}</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
                    {t.add}
                </Button>
            </Box>

            <Paper sx={{ height: 400, width: '100%' }}>
                <DataGrid
                    rows={members}
                    columns={columns}
                    loading={isLoading}
                    slots={{ toolbar: GridToolbar }}
                />
            </Paper>

            <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t.add}</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label={t.username}
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            fullWidth
                            autoFocus
                        />
                        <TextField
                            label={t.password}
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAdd(false)}>{dict.common.cancel}</Button>
                    <Button onClick={handleAdd} variant="contained">{t.create_btn}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}