'use client';

import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Box, Typography, CircularProgress, Alert,
    Chip, Stack, useTheme
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Dictionary } from '@/types';

interface AiAssistDialogProps {
    open: boolean;
    onClose: () => void;
    onApply: (content: string) => void;
    currentContent: string;
    contextType: 'TEMPLATE' | 'ADHOC';
    variables: string[];
    dict: Dictionary;
}

interface GenerateResponse {
    content: string;
}

export default function AiAssistDialog({ open, onClose, onApply, currentContent, contextType, variables, dict }: AiAssistDialogProps) {
    const { tenantId } = useAuthStore();
    const theme = useTheme();
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [error, setError] = useState<string | null>(null);

    const t = dict.ai_dialog || {
        title: "AI Assistant",
        description: "Describe what you want to change or generate. The AI is aware of the available variables:",
        prompt_label: "Instructions",
        prompt_placeholder: "e.g., 'Rewrite this to be more polite and include a discount code'",
        generating: "Generating content...",
        preview_title: "Preview:",
        apply_btn: "Apply Changes",
        generate_btn: "Generate",
        error_title: "Generation Failed"
    };

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

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent);
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
                exit: { opacity: 0, y: 20 },
                sx: {
                    borderRadius: 3,
                    backgroundImage: 'none',
                    boxShadow: theme.palette.mode === 'dark'
                        ? '0 8px 32px rgba(0, 0, 0, 0.5)'
                        : '0 8px 32px rgba(0, 0, 0, 0.1)',
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderBottom: 1,
                borderColor: 'divider',
                py: 2.5
            }}>
                <Box sx={{
                    p: 1,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    display: 'flex'
                }}>
                    <SmartToyIcon />
                </Box>
                <Typography variant="h6" fontWeight="700">
                    {t.title}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {t.description}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {variables.map(v => (
                                <Chip
                                    key={v}
                                    label={`{{${v}}}`}
                                    size="small"
                                    sx={{
                                        fontFamily: 'monospace',
                                        bgcolor: 'action.hover',
                                        border: 1,
                                        borderColor: 'divider'
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    <TextField
                        autoFocus
                        multiline
                        rows={3}
                        label={t.prompt_label}
                        placeholder={t.prompt_placeholder}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        fullWidth
                        disabled={generateMutation.isPending}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: 'background.paper'
                            }
                        }}
                    />

                    {error && (
                        <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                            <strong>{t.error_title}:</strong> {error}
                        </Alert>
                    )}

                    <AnimatePresence mode="wait">
                        {generateMutation.isPending ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    gap={2}
                                    p={4}
                                    bgcolor="action.hover"
                                    borderRadius={2}
                                    border="1px dashed"
                                    borderColor="divider"
                                >
                                    <CircularProgress size={24} thickness={5} sx={{ color: '#6366f1' }} />
                                    <Typography variant="body2" fontWeight="500" sx={{
                                        background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)',
                                        backgroundSize: '200% auto',
                                        color: 'transparent',
                                        backgroundClip: 'text',
                                        animation: 'shine 2s linear infinite',
                                        '@keyframes shine': {
                                            'to': { backgroundPosition: '200% center' }
                                        }
                                    }}>
                                        {t.generating}
                                    </Typography>
                                </Box>
                            </motion.div>
                        ) : generatedContent ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2" fontWeight="600" color="primary">
                                            {t.preview_title}
                                        </Typography>
                                        <Button
                                            size="small"
                                            startIcon={<ContentCopyIcon fontSize="small" />}
                                            onClick={handleCopy}
                                            sx={{ textTransform: 'none', color: 'text.secondary' }}
                                        >
                                            Copy
                                        </Button>
                                    </Stack>
                                    <Box
                                        component="pre"
                                        sx={{
                                            p: 2.5,
                                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'grey.50',
                                            borderRadius: 2,
                                            overflow: 'auto',
                                            maxHeight: 350,
                                            fontSize: '0.85rem',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            fontFamily: 'monospace',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}
                                    >
                                        {generatedContent}
                                    </Box>
                                </Box>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider', gap: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>
                    {dict.common.cancel}
                </Button>

                {!generatedContent ? (
                    <Button
                        onClick={() => generateMutation.mutate()}
                        variant="contained"
                        disabled={!prompt || generateMutation.isPending}
                        startIcon={<AutoAwesomeIcon />}
                        sx={{
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            transition: 'transform 0.2s',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
                            }
                        }}
                    >
                        {t.generate_btn}
                    </Button>
                ) : (
                    <Stack direction="row" spacing={1}>
                        <Button
                            onClick={() => generateMutation.mutate()}
                            variant="outlined"
                            startIcon={<AutoAwesomeIcon />}
                            sx={{ borderRadius: 2 }}
                        >
                            Regenerate
                        </Button>
                        <Button
                            onClick={handleApply}
                            variant="contained"
                            color="success"
                            sx={{
                                borderRadius: 2,
                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                            }}
                        >
                            {t.apply_btn}
                        </Button>
                    </Stack>
                )}
            </DialogActions>
        </Dialog>
    );
}