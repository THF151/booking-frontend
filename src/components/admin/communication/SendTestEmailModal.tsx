'use client';
import { useState, FormEvent, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, CircularProgress, Typography, Divider, Box
} from '@mui/material';
import { TemplatePlaceholder } from '@/types';

interface SendTestEmailModalProps {
    open: boolean;
    onClose: () => void;
    onSend: (recipientEmail: string, context: Record<string, string>) => Promise<void>;
    placeholders: TemplatePlaceholder[];
    initialContext: Record<string, string>;
}

export default function SendTestEmailModal({ open, onClose, onSend, placeholders, initialContext }: SendTestEmailModalProps) {
    const [email, setEmail] = useState('');
    const [context, setContext] = useState<Record<string, string>>({});
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (open) {
            setEmail('');
            setContext(initialContext);
            setIsSending(false);
        }
    }, [open, initialContext]);

    const handleContextChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setContext(prev => ({ ...prev, [key]: event.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsSending(true);
        try {
            await onSend(email, context);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to send test email");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Send Test Email</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            autoFocus
                            required
                            type="email"
                            label="Recipient Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            fullWidth
                        />
                        <Divider sx={{ pt: 1 }} />
                        <Typography variant="h6">Personalization Data</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Confirm or edit the sample data for this test email.
                        </Typography>
                        {placeholders.length > 0 ? (
                            <Box sx={{ maxHeight: '30vh', overflowY: 'auto', pr: 1 }}>
                                <Stack spacing={2}>
                                    {placeholders.map(p => (
                                        <TextField
                                            key={p.key}
                                            label={p.key}
                                            value={context[p.key] || ''}
                                            onChange={handleContextChange(p.key)}
                                            variant="outlined"
                                            size="small"
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">No variables to configure.</Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="inherit">Cancel</Button>
                    <Button type="submit" variant="contained" disabled={isSending || !email}>
                        {isSending ? <CircularProgress size={24} /> : 'Send Test'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}