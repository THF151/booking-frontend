'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Stack, MenuItem, Box, Tabs, Tab, IconButton, CircularProgress, Snackbar, Alert, Tooltip
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { EmailTemplate, TemplatePlaceholder, Dictionary } from '@/types';
import CodeIcon from '@mui/icons-material/Code';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisualEditor from '@/components/admin/communication/VisualEditor';
import CodeEditor from '@/components/admin/communication/CodeEditor';
import AiAssistDialog from './communication/AiAssistDialog';

interface Props {
    open: boolean;
    onClose: () => void;
    recipientId: string;
    recipientEmail: string;
    recipientName?: string;
    targetType: 'BOOKING' | 'INVITEE';
    eventId?: string;
    dict: Dictionary;
}

export default function AdHocEmailDialog({ open, onClose, recipientEmail, recipientName, eventId, dict }: Props) {
    const { tenantId } = useAuthStore();

    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [templateType, setTemplateType] = useState<'mjml' | 'html'>('mjml');
    const [activeTab, setActiveTab] = useState<'visual' | 'mjml' | 'html'>('visual');
    const [aiDialogOpen, setAiDialogOpen] = useState(false);

    const [snack, setSnack] = useState<{msg: string, type: 'success'|'error'} | null>(null);

    const { data: templates = [] } = useQuery({
        queryKey: ['templates', tenantId, eventId],
        queryFn: () => api.get<EmailTemplate[]>(`/${tenantId}/templates${eventId ? `?event_id=${eventId}` : ''}`),
        enabled: open && !!tenantId
    });

    const { data: placeholders = [] } = useQuery({
        queryKey: ['placeholders'],
        queryFn: () => api.get<TemplatePlaceholder[]>('/communication/placeholders')
    });

    const sendMutation = useMutation({
        mutationFn: async () => {
            let htmlBody = body;
            if (templateType === 'mjml') {
                const mjml = (await import('mjml-browser')).default;
                const { html } = mjml(body, { validationLevel: 'soft' });
                htmlBody = html;
            }

            return api.post(`/${tenantId}/communication/test-send`, {
                recipient: recipientEmail,
                subject: subject,
                body: htmlBody
            });
        },
        onSuccess: () => {
            setSnack({ msg: 'Email sent successfully', type: 'success' });
            setTimeout(onClose, 1500);
        },
        onError: (e) => setSnack({ msg: 'Failed to send: ' + e.message, type: 'error' })
    });

    const handleTemplateSelect = (tmplId: string) => {
        setSelectedTemplateId(tmplId);
        const tmpl = templates.find(t => t.id === tmplId);
        if (tmpl) {
            setSubject(tmpl.subject_template);
            setBody(tmpl.body_template);
            setTemplateType(tmpl.template_type);
            setActiveTab(tmpl.template_type === 'html' ? 'html' : 'visual');
        }
    };

    const handleAiApply = (content: string) => {
        setBody(content);
    };

    useEffect(() => {
        if (open) {
            setSelectedTemplateId('');
            setSubject(`Message for ${recipientName || recipientEmail}`);
            setBody(`<mjml><mj-body><mj-section><mj-column><mj-text>Hello ${recipientName || 'there'},</mj-text></mj-column></mj-section></mj-body></mjml>`);
            setTemplateType('mjml');
            setActiveTab('visual');
        }
    }, [open, recipientName, recipientEmail]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Send Message to {recipientEmail}
                <Stack direction="row" spacing={1}>
                    <Tooltip title="AI Assistant">
                        <Button
                            size="small"
                            onClick={() => setAiDialogOpen(true)}
                            startIcon={<AutoAwesomeIcon />}
                            sx={{
                                background: 'linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)',
                                color: 'white',
                                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #4f46e5 30%, #7c3aed 90%)',
                                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                                }
                            }}
                        >
                            AI Assist
                        </Button>
                    </Tooltip>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ height: '80vh', display: 'flex', flexDirection: 'column', p: 0 }}>
                <Box p={3} borderBottom={1} borderColor="divider">
                    <Stack direction="row" spacing={2} mb={2}>
                        <TextField
                            select label="Load Template" size="small" sx={{ width: 250 }}
                            value={selectedTemplateId} onChange={(e) => handleTemplateSelect(e.target.value)}
                        >
                            <MenuItem value=""><em>Blank</em></MenuItem>
                            {templates.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                        </TextField>
                        <TextField
                            label="Subject" fullWidth size="small"
                            value={subject} onChange={e => setSubject(e.target.value)}
                        />
                    </Stack>
                    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} textColor="primary" indicatorColor="primary" sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0 } }}>
                        <Tab icon={<ViewQuiltIcon fontSize="small" />} iconPosition="start" label="Visual" value="visual" disabled={templateType === 'html'} />
                        <Tab icon={<CodeIcon fontSize="small" />} iconPosition="start" label="MJML" value="mjml" disabled={templateType === 'html'} />
                        <Tab icon={<CodeIcon fontSize="small" />} iconPosition="start" label="HTML" value="html" disabled={templateType === 'mjml'} />
                    </Tabs>
                </Box>

                <Box flex={1} position="relative" overflow="hidden">
                    {activeTab === 'visual' && templateType === 'mjml' && (
                        <VisualEditor mjmlContent={body} onMjmlChange={setBody} />
                    )}
                    {(activeTab === 'mjml' || activeTab === 'html') && (
                        <CodeEditor value={body} onChange={setBody} language={activeTab} />
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>{dict.common.cancel}</Button>
                <Button
                    variant="contained"
                    startIcon={sendMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    onClick={() => sendMutation.mutate()}
                    disabled={sendMutation.isPending}
                >
                    {dict.admin.communication.send_btn}
                </Button>
            </DialogActions>

            <AiAssistDialog
                open={aiDialogOpen}
                onClose={() => setAiDialogOpen(false)}
                onApply={handleAiApply}
                currentContent={body}
                contextType="ADHOC"
                variables={placeholders.map(p => p.key)}
                dict={dict}
            />

            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}>
                <Alert severity={snack?.type} variant="filled">{snack?.msg}</Alert>
            </Snackbar>
        </Dialog>
    );
}