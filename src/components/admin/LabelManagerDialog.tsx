import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    List, ListItem, ListItemText, IconButton, TextField, Stack, Box, Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#2196f3');
    const [newPayout, setNewPayout] = useState('');

    const createMutation = useMutation({
        mutationFn: () => api.post(`/${tenantId}/labels`, {
            name: newName,
            color: newColor,
            payout: newPayout ? parseInt(newPayout, 10) : 0
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labels', tenantId] });
            setNewName('');
            setNewPayout('');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/${tenantId}/labels/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['labels', tenantId] })
    });

    const t = dict.admin.labels || { title: "Manage Labels", create: "Add", name: "Name", color: "Color" };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t.title}</DialogTitle>
            <DialogContent dividers>
                <Box mb={3}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                            size="small"
                            label={t.name}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            size="small"
                            label="Payout (e.g. 15)"
                            value={newPayout}
                            type="number"
                            onChange={(e) => setNewPayout(e.target.value)}
                            sx={{ width: 150 }}
                            InputProps={{
                                endAdornment: <Typography color="text.secondary" ml={1}>€</Typography>
                            }}
                        />
                        <input
                            type="color"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            style={{ width: 50, height: 40, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                        />
                        <Button
                            variant="contained"
                            onClick={() => createMutation.mutate()}
                            disabled={!newName}
                        >
                            {t.create}
                        </Button>
                    </Stack>
                </Box>
                <List>
                    {labels.map((label) => (
                        <ListItem
                            key={label.id}
                            secondaryAction={
                                <IconButton edge="end" onClick={() => deleteMutation.mutate(label.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
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
                                secondary={label.payout ? `Payout: ${label.payout}€` : null}
                            />
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