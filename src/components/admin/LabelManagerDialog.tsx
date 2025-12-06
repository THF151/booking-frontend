import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    List, ListItem, ListItemText, IconButton, TextField, Stack, Box, Typography,
    ListItemSecondaryAction
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { BookingLabel, Dictionary } from '@/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
    open: boolean;
    onClose: () => void;
    labels: BookingLabel[];
    dict: Dictionary;
}

export default function LabelManagerDialog({ open, onClose, labels, dict }: Props) {
    const { tenantId } = useAuthStore();
    const queryClient = useQueryClient();

    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState('#2196f3');
    const [payout, setPayout] = useState('');

    const createMutation = useMutation({
        mutationFn: () => api.post(`/${tenantId}/labels`, {
            name: name,
            color: color,
            payout: payout ? parseInt(payout, 10) : 0
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labels', tenantId] });
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: () => api.put(`/${tenantId}/labels/${editId}`, {
            name: name,
            color: color,
            payout: payout ? parseInt(payout, 10) : 0
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labels', tenantId] });
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/${tenantId}/labels/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['labels', tenantId] })
    });

    const resetForm = () => {
        setEditId(null);
        setName('');
        setColor('#2196f3');
        setPayout('');
    };

    const handleEdit = (label: BookingLabel) => {
        setEditId(label.id);
        setName(label.name);
        setColor(label.color);
        setPayout(label.payout.toString());
    };

    const handleSave = () => {
        if (editId) {
            updateMutation.mutate();
        } else {
            createMutation.mutate();
        }
    };

    const t = dict.admin.labels || { title: "Manage Labels", create: "Add", name: "Name", color: "Color" };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editId ? "Edit Label" : t.title}</DialogTitle>
            <DialogContent dividers>
                <Box mb={3}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                            size="small"
                            label={t.name}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            sx={{ flex: 2 }}
                        />
                        <TextField
                            size="small"
                            label="Payout"
                            value={payout}
                            type="number"
                            onChange={(e) => setPayout(e.target.value)}
                            sx={{ flex: 1, minWidth: 100 }}
                            InputProps={{
                                endAdornment: <Typography color="text.secondary" ml={1}>€</Typography>
                            }}
                        />
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            style={{ width: 50, height: 40, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={!name || createMutation.isPending || updateMutation.isPending}
                        >
                            {editId ? "Update" : t.create}
                        </Button>
                        {editId && (
                            <Button onClick={resetForm}>Cancel</Button>
                        )}
                    </Stack>
                </Box>
                <List>
                    {labels.map((label) => (
                        <ListItem key={label.id}>
                            <Box
                                sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    bgcolor: label.color,
                                    mr: 2
                                }}
                            />
                            <ListItemText
                                primary={label.name}
                                secondary={label.payout !== 0 ? `Payout: ${label.payout}€` : "No Payout"}
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" onClick={() => handleEdit(label)} sx={{ mr: 1 }}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton edge="end" onClick={() => deleteMutation.mutate(label.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{dict.common.close}</Button>
            </DialogActions>
        </Dialog>
    );
}