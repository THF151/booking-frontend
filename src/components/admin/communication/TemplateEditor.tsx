'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Tabs, Tab, Button, Stack, Typography, IconButton,
    useTheme, useMediaQuery, Drawer, Alert, Snackbar, TextField, Tooltip
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import HtmlIcon from '@mui/icons-material/Html';
import SaveIcon from '@mui/icons-material/Save';
import HistoryIcon from '@mui/icons-material/History';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { EmailTemplate, Dictionary, TemplatePlaceholder, EmailTemplateVersion } from '@/types';
import VisualEditor from './VisualEditor';
import CodeEditor from './CodeEditor';
import PreviewPanel from './PreviewPanel';
import SendTestEmailModal from './SendTestEmailModal';
import AiAssistDialog from './AiAssistDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface Props {
    template: EmailTemplate;
    lang: string;
    dict: Dictionary;
}

export default function TemplateEditor({ template, dict }: Props) {
    const { tenantId } = useAuthStore();
    const router = useRouter();
    const queryClient = useQueryClient();

    const theme = useTheme();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [activeTab, setActiveTab] = useState<'visual' | 'mjml' | 'html'>('visual');
    const [mjmlContent, setMjmlContent] = useState(template.body_template);
    const [htmlContent, setHtmlContent] = useState('');
    const [subject, setSubject] = useState(template.subject_template);
    const [isDirty, setIsDirty] = useState(false);
    const [testModalOpen, setTestModalOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [aiDialogOpen, setAiDialogOpen] = useState(false);

    const [templateType, setTemplateType] = useState<'mjml' | 'html'>(template.template_type);
    const [testSendSnack, setTestSendSnack] = useState<{open: boolean, msg: string, severity: 'success' | 'error'}>({open: false, msg: '', severity: 'success'});

    const [sampleContext, setSampleContext] = useState<Record<string, string>>({});

    const { data: placeholders = [] } = useQuery({
        queryKey: ['placeholders'],
        queryFn: () => api.get<TemplatePlaceholder[]>('/communication/placeholders')
    });

    const { data: versions = [] } = useQuery({
        queryKey: ['template_versions', tenantId, template.id],
        queryFn: () => api.get<EmailTemplateVersion[]>(`/${tenantId}/templates/${template.id}/versions`),
        enabled: historyOpen
    });

    useEffect(() => {
        if (placeholders.length > 0) {
            const initialContext: Record<string, string> = {};
            placeholders.forEach(p => {
                initialContext[p.key] = p.sample_value;
            });
            setSampleContext(initialContext);
        }
    }, [placeholders]);

    useEffect(() => {
        if (template.template_type === 'html') {
            setHtmlContent(template.body_template);
            setActiveTab('html');
            setTemplateType('html');
        }
    }, [template]);

    const saveMutation = useMutation({
        mutationFn: (data: { subject_template: string, body_template: string, name: string, template_type: 'mjml' | 'html' }) =>
            api.put(`/${tenantId}/templates/${template.id}`, { ...data, id: template.id }),
        onSuccess: () => {
            setIsDirty(false);
            queryClient.invalidateQueries({ queryKey: ['template', tenantId, template.id] });
        }
    });

    const restoreMutation = useMutation({
        mutationFn: (versionId: string) =>
            api.post<EmailTemplate>(`/${tenantId}/templates/${template.id}/versions/${versionId}/restore`, {}),
        onSuccess: (data: EmailTemplate) => {
            setMjmlContent(data.body_template);
            setSubject(data.subject_template);
            setTemplateType(data.template_type);
            if (data.template_type === 'html') {
                setHtmlContent(data.body_template);
                setActiveTab('html');
            } else {
                setHtmlContent('');
                setActiveTab('visual');
            }
            setIsDirty(false);
            setHistoryOpen(false);
            queryClient.invalidateQueries({ queryKey: ['template', tenantId, template.id] });
        }
    });

    const handleSave = () => {
        saveMutation.mutate({
            name: template.name,
            subject_template: subject,
            body_template: templateType === 'mjml' ? mjmlContent : htmlContent,
            template_type: templateType
        });
    };

    const handleConvertToHtml = async () => {
        if (templateType === 'html') return;
        if (!confirm("Converting to HTML will disable visual MJML editing for this version. Are you sure?")) return;

        try {
            const mjml = (await import('mjml-browser')).default;
            const { html } = mjml(mjmlContent, { validationLevel: 'soft' });
            setHtmlContent(html);
            setTemplateType('html');
            setActiveTab('html');
            setIsDirty(true);
        } catch (e) {
            console.error("Conversion failed", e);
            alert("Failed to convert MJML to HTML");
        }
    };

    const handleSendTest = async (email: string, context: Record<string, string>) => {
        try {
            let finalHtml = '';
            if (templateType === 'mjml') {
                const mjml = (await import('mjml-browser')).default;
                const { html } = mjml(mjmlContent, { validationLevel: 'soft' });
                finalHtml = html;
            } else {
                finalHtml = htmlContent;
            }

            let replacedSubject = subject;
            for (const [key, val] of Object.entries(context)) {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                finalHtml = finalHtml.replace(regex, val);
                replacedSubject = replacedSubject.replace(regex, val);
            }

            await api.post(`/${tenantId}/communication/test-send`, {
                recipient: email,
                subject: replacedSubject,
                body: finalHtml
            });
            setTestSendSnack({ open: true, msg: 'Test email sent successfully!', severity: 'success' });
        } catch (e) {
            console.error(e);
            setTestSendSnack({ open: true, msg: 'Failed to send test email.', severity: 'error' });
        }
    };

    const handleAiApply = (content: string) => {
        if (templateType === 'mjml') {
            setMjmlContent(content);
        } else {
            setHtmlContent(content);
        }
        setIsDirty(true);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <Paper elevation={0} square sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <IconButton onClick={() => router.back()} size="small"><ArrowBackIcon /></IconButton>
                    <Typography variant="subtitle1" fontWeight="bold">{template.name}</Typography>
                    {isDirty && <Typography variant="caption" color="warning.main">● {dict.common.unsaved}</Typography>}
                    {templateType === 'html' && <Typography variant="caption" sx={{ bgcolor: 'warning.light', color: 'warning.dark', px: 1, borderRadius: 1 }}>HTML Mode</Typography>}
                </Stack>

                <Stack direction="row" spacing={1}>
                    <Tooltip title="Use AI Assistant">
                        <Button
                            startIcon={<AutoAwesomeIcon />}
                            onClick={() => setAiDialogOpen(true)}
                            size="small"
                            sx={{
                                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                color: 'white',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
                                }
                            }}
                        >
                            AI Assist
                        </Button>
                    </Tooltip>
                    <Button startIcon={<HistoryIcon />} onClick={() => setHistoryOpen(true)} size="small">History</Button>
                    <Button startIcon={<SendIcon />} onClick={() => setTestModalOpen(true)} size="small">Test Send</Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={!isDirty || saveMutation.isPending}
                    >
                        {saveMutation.isPending ? dict.common.saving : dict.common.save}
                    </Button>
                </Stack>
            </Paper>

            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <TextField
                    label={dict.admin.communication.subject_label}
                    value={subject}
                    onChange={(e) => { setSubject(e.target.value); setIsDirty(true); }}
                    fullWidth
                    size="small"
                    variant="outlined"
                />
            </Box>

            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
                        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} textColor="primary" indicatorColor="primary">
                            <Tab icon={<ViewQuiltIcon />} iconPosition="start" label="Visual" value="visual" disabled={templateType === 'html'} />
                            <Tab icon={<CodeIcon />} iconPosition="start" label="MJML" value="mjml" disabled={templateType === 'html'} />
                            <Tab icon={<HtmlIcon />} iconPosition="start" label="HTML" value="html" />
                        </Tabs>
                        {templateType === 'mjml' && (
                            <Button size="small" onClick={handleConvertToHtml} color="warning">
                                Convert to HTML
                            </Button>
                        )}
                    </Box>

                    <Box sx={{ flexGrow: 1, position: 'relative' }}>
                        {activeTab === 'visual' && templateType === 'mjml' && (
                            <VisualEditor
                                mjmlContent={mjmlContent}
                                onMjmlChange={(val) => { setMjmlContent(val); setIsDirty(true); }}
                            />
                        )}
                        {activeTab === 'mjml' && templateType === 'mjml' && (
                            <CodeEditor
                                value={mjmlContent}
                                onChange={(val) => { setMjmlContent(val); setIsDirty(true); }}
                                language="mjml"
                            />
                        )}
                        {activeTab === 'html' && (
                            <CodeEditor
                                value={htmlContent}
                                onChange={(val) => { setHtmlContent(val); setIsDirty(true); }}
                                language="html"
                            />
                        )}
                    </Box>
                </Box>

                <Box sx={{ width: 400, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                    <PreviewPanel
                        templateContent={templateType === 'mjml' ? mjmlContent : htmlContent}
                        templateType={templateType}
                        subjectTemplate={subject}
                        placeholders={placeholders}
                        sampleContext={sampleContext}
                        onContextChange={setSampleContext}
                    />
                </Box>
            </Box>

            <Drawer anchor="right" open={historyOpen} onClose={() => setHistoryOpen(false)}>
                <Box sx={{ width: 300, p: 3 }}>
                    <Typography variant="h6" gutterBottom>Version History</Typography>
                    <Stack spacing={2}>
                        {versions.map((v) => (
                            <Paper key={v.id} variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    {new Date(v.created_at).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" noWrap gutterBottom>
                                    {v.subject_template}
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => restoreMutation.mutate(v.id)}
                                    disabled={restoreMutation.isPending}
                                >
                                    Restore
                                </Button>
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            </Drawer>

            <SendTestEmailModal
                open={testModalOpen}
                onClose={() => setTestModalOpen(false)}
                onSend={handleSendTest}
                placeholders={placeholders}
                initialContext={sampleContext}
            />

            <AiAssistDialog
                open={aiDialogOpen}
                onClose={() => setAiDialogOpen(false)}
                onApply={handleAiApply}
                currentContent={templateType === 'mjml' ? mjmlContent : htmlContent}
                contextType="TEMPLATE"
                variables={placeholders.map(p => p.key)}
            />

            <Snackbar
                open={testSendSnack.open}
                autoHideDuration={4000}
                onClose={() => setTestSendSnack({...testSendSnack, open: false})}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={testSendSnack.severity}>{testSendSnack.msg}</Alert>
            </Snackbar>
        </Box>
    );
}