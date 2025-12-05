'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Box, Typography, CircularProgress, Alert
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface AiAssistDialogProps {
    open: boolean;
    onClose: () => void;
    onApply: (content: string) => void;
    currentContent: string;
    contextType: 'TEMPLATE' | 'ADHOC';
    variables: string[];
}

interface GenerateResponse {
    content: string;
}

export default function AiAssistDialog({ open, onClose, onApply, currentContent, contextType, variables }: AiAssistDialogProps) {
    const { tenantId } = useAuthStore();
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [error, setError] = useState<string | null>(null);

    const generateMutation = useMutation({
        mutationFn: async () => {
            return api.post<GenerateResponse>(`/${tenantId}/ai/generate`, {
                prompt,
                current_content: currentContent,
                context_type: contextType,
                variables
            });
        },
        onSuccess: (data) => {
            setGeneratedContent(data.content);
            setError(null);
        },
        onError: (err: Error) => {
            setError(err.message || "Failed to generate content");
        }
    });

    const handleApply = () => {
        onApply(generatedContent);
        onClose();
        setPrompt('');
        setGeneratedContent('');
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                component: motion.div,
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: 20 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <AutoAwesomeIcon /> AI Assistant
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        Describe what you want to change or generate. The AI is aware of the available variables:
                        {variables.map(v => <code key={v} style={{ margin: '0 4px', background: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>{v}</code>)}
                    </Typography>

                    <TextField
                        autoFocus
                        multiline
                        rows={2}
                        label="Instructions"
                        placeholder="e.g., 'Rewrite this to be more polite and include a discount code', or 'Create a reminder email'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        fullWidth
                        disabled={generateMutation.isPending}
                    />

                    {error && <Alert severity="error">{error}</Alert>}

                    <AnimatePresence>
                        {generateMutation.isPending && (
                            <Box display="flex" alignItems="center" gap={2} p={2} bgcolor="action.hover" borderRadius={2}>
                                <CircularProgress size={20} />
                                <Typography variant="body2" className="animate-pulse">Generating content...</Typography>
                            </Box>
                        )}
                    </AnimatePresence>

                    {generatedContent && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>Preview:</Typography>
                            <Box
                                component="pre"
                                sx={{
                                    p: 2,
                                    bgcolor: 'grey.50',
                                    borderRadius: 1,
                                    overflow: 'auto',
                                    maxHeight: 300,
                                    fontSize: '0.85rem',
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}
                            >
                                {generatedContent}
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                {!generatedContent ? (
                    <Button
                        onClick={() => generateMutation.mutate()}
                        variant="contained"
                        disabled={!prompt || generateMutation.isPending}
                        startIcon={<AutoAwesomeIcon />}
                    >
                        Generate
                    </Button>
                ) : (
                    <Button
                        onClick={handleApply}
                        variant="contained"
                        color="success"
                    >
                        Apply Changes
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}