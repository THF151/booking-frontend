'use client';

import React, { useState } from 'react';
import {
    Paper, Typography, Stack, Box, Button, TextField, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { EventEditorState } from './EventEditor';
import { Dictionary, NotificationRule, EmailTemplate } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import PreviewPanel from '@/components/admin/communication/PreviewPanel';

interface Props {
    form: EventEditorState;
    dict: Dictionary;
    eventId?: string;
    lang?: string;
}

export default function NotificationsSection({ dict, eventId, lang = 'en' }: Props) {
    const { tenantId } = useAuthStore();
    const queryClient = useQueryClient();
    const t = dict.admin.communication;

    const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
    const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

    // Template Form State
    const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '' });

    // Rule Form State
    const [ruleTriggerType, setRuleTriggerType] = useState('ON_BOOKING');
    const [customMinutes, setCustomMinutes] = useState<string>('30');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
    const [sampleContext, setSampleContext] = useState<Record<string, string>>({});

    // Fetch Templates filtered by eventId (if available)
    const { data: templates = [] } = useQuery({
        queryKey: ['templates', tenantId, eventId],
        queryFn: () => api.get<EmailTemplate[]>(`/${tenantId}/templates${eventId ? `?event_id=${eventId}` : ''}`),
        enabled: !!tenantId
    });

    const { data: rules = [] } = useQuery({
        queryKey: ['rules', eventId],
        queryFn: () => api.get<NotificationRule[]>(`/${tenantId}/events/${eventId}/rules`),
        enabled: !!eventId
    });

    const createTemplateMutation = useMutation({
        mutationFn: (data: { name: string, subject_template: string, body_template: string }) =>
            // Pass event_id to create template linked to this event
            api.post(`/${tenantId}/templates`, { ...data, template_type: 'mjml', event_id: eventId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates', tenantId, eventId] });
            setTemplateDialogOpen(false);
            setNewTemplate({ name: '', subject: '', body: '' });
        }
    });

    const deleteTemplateMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/${tenantId}/templates/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates', tenantId, eventId] })
    });

    const createRuleMutation = useMutation({
        mutationFn: (data: { trigger_type: string, template_id: string }) =>
            api.post(`/${tenantId}/events/${eventId}/rules`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules', eventId] });
            setRuleDialogOpen(false);
            resetRuleForm();
        }
    });

    const deleteRuleMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/${tenantId}/rules/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules', eventId] })
    });

    const handleCreateOrUpdateRule = async () => {
        let finalTrigger = ruleTriggerType;
        if (ruleTriggerType === 'REMINDER_CUSTOM') {
            finalTrigger = `REMINDER_${customMinutes}M`;
        }

        if (editingRuleId) {
            await api.delete(`/${tenantId}/rules/${editingRuleId}`);
        }

        createRuleMutation.mutate({
            trigger_type: finalTrigger,
            template_id: selectedTemplateId
        });
    };

    const resetRuleForm = () => {
        setEditingRuleId(null);
        setRuleTriggerType('ON_BOOKING');
        setCustomMinutes('30');
        setSelectedTemplateId('');
    };

    const handleEditRule = (rule: NotificationRule) => {
        setEditingRuleId(rule.id);
        setSelectedTemplateId(rule.template_id);

        if (rule.trigger_type.startsWith('REMINDER_') && rule.trigger_type.endsWith('M')) {
            setRuleTriggerType('REMINDER_CUSTOM');
            setCustomMinutes(rule.trigger_type.substring(9, rule.trigger_type.length - 1));
        } else {
            setRuleTriggerType(rule.trigger_type);
        }
        setRuleDialogOpen(true);
    };

    const handleCreateTemplate = () => {
        createTemplateMutation.mutate({
            name: newTemplate.name,
            subject_template: newTemplate.subject,
            body_template: newTemplate.body
        });
    };

    const handlePreview = (tmplId: string) => {
        setPreviewTemplateId(tmplId);
        setPreviewDialogOpen(true);
    };

    const previewTemplate = templates.find(t => t.id === previewTemplateId);

    if (!eventId) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>Please save the event first to configure notifications.</Typography>
            </Paper>
        );
    }

    return (
        <Stack spacing={4}>
            {/* Rules Section */}
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">{t.rules_title}</Typography>
                    <Button startIcon={<AddIcon />} variant="outlined" onClick={() => { resetRuleForm(); setRuleDialogOpen(true); }}>
                        {t.add_rule}
                    </Button>
                </Stack>

                <TableContainer component={Box} sx={{ borderRadius: 1, border: 1, borderColor: 'divider' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t.trigger_label}</TableCell>
                                <TableCell>{t.template_label}</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rules.map(rule => {
                                const tmpl = templates.find(t => t.id === rule.template_id);
                                return (
                                    <TableRow key={rule.id}>
                                        <TableCell>{rule.trigger_type}</TableCell>
                                        <TableCell>
                                            {tmpl ? (
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    {tmpl.name}
                                                    <Tooltip title="Edit Template">
                                                        <Link href={`/${lang}/admin/communication/templates/${tmpl.id}`} passHref>
                                                            <IconButton size="small">
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Link>
                                                    </Tooltip>
                                                    <Tooltip title="Quick Preview">
                                                        <IconButton size="small" onClick={() => handlePreview(tmpl.id)}>
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            ) : rule.template_id}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Edit Rule">
                                                <IconButton size="small" onClick={() => handleEditRule(rule)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton size="small" color="error" onClick={() => deleteRuleMutation.mutate(rule.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {rules.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>
                                        No active rules. No emails will be sent.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Templates Section */}
            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">{t.templates_title} (Event Specific)</Typography>
                    <Button startIcon={<AddIcon />} variant="outlined" onClick={() => { setNewTemplate({name:'', subject:'', body:''}); setTemplateDialogOpen(true); }}>
                        {t.add_template}
                    </Button>
                </Stack>

                <TableContainer component={Box} sx={{ borderRadius: 1, border: 1, borderColor: 'divider' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Subject</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {templates.map(tmpl => (
                                <TableRow key={tmpl.id}>
                                    <TableCell>{tmpl.name}</TableCell>
                                    <TableCell>{tmpl.subject_template}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Preview">
                                            <IconButton size="small" onClick={() => handlePreview(tmpl.id)}>
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Edit">
                                            <Link href={`/${lang}/admin/communication/templates/${tmpl.id}`} passHref>
                                                <IconButton size="small">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Link>
                                        </Tooltip>
                                        <IconButton size="small" color="error" onClick={() => { if (confirm("Delete template?")) deleteTemplateMutation.mutate(tmpl.id) }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {templates.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>No templates found for this event.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Add/Edit Rule Dialog */}
            <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editingRuleId ? 'Edit Rule' : t.add_rule}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            select label={t.trigger_label} fullWidth
                            value={ruleTriggerType}
                            onChange={e => setRuleTriggerType(e.target.value)}
                            helperText="Select when this email should be sent"
                        >
                            <MenuItem value="ON_BOOKING">On Booking (Confirmation)</MenuItem>
                            <MenuItem value="REMINDER_24H">Reminder (24h before)</MenuItem>
                            <MenuItem value="REMINDER_1H">Reminder (1h before)</MenuItem>
                            <MenuItem value="REMINDER_CUSTOM">Reminder (Custom Minutes)</MenuItem>
                            <MenuItem value="ON_CANCEL">On Cancellation</MenuItem>
                            <MenuItem value="ON_RESCHEDULE">On Reschedule</MenuItem>
                        </TextField>

                        {ruleTriggerType === 'REMINDER_CUSTOM' && (
                            <TextField
                                type="number"
                                label="Minutes before start"
                                value={customMinutes}
                                onChange={e => setCustomMinutes(e.target.value)}
                                fullWidth
                                helperText="e.g. 15 for 15 minutes before"
                            />
                        )}

                        <TextField
                            select label={t.template_label} fullWidth
                            value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}
                        >
                            {templates.map(tmpl => (
                                <MenuItem key={tmpl.id} value={tmpl.id}>{tmpl.name}</MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRuleDialogOpen(false)}>{dict.common.cancel}</Button>
                    <Button variant="contained" onClick={handleCreateOrUpdateRule} disabled={createRuleMutation.isPending}>{dict.common.save}</Button>
                </DialogActions>
            </Dialog>

            {/* Add Template Dialog */}
            <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{t.add_template}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="Name" fullWidth value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} />
                        <TextField label={t.subject_label} fullWidth value={newTemplate.subject} onChange={e => setNewTemplate({...newTemplate, subject: e.target.value})} />
                        <TextField
                            label={t.body_label}
                            multiline rows={5} fullWidth
                            value={newTemplate.body}
                            onChange={e => setNewTemplate({...newTemplate, body: e.target.value})}
                            placeholder="<mjml>...</mjml>"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTemplateDialogOpen(false)}>{dict.common.cancel}</Button>
                    <Button variant="contained" onClick={handleCreateTemplate}>{dict.common.save}</Button>
                </DialogActions>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
                <DialogContent dividers sx={{ height: '60vh', p: 0, overflow: 'hidden' }}>
                    {previewTemplate && (
                        <PreviewPanel
                            templateContent={previewTemplate.body_template}
                            templateType={previewTemplate.template_type as 'mjml' | 'html'}
                            subjectTemplate={previewTemplate.subject_template}
                            placeholders={[]}
                            sampleContext={sampleContext}
                            onContextChange={setSampleContext}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialogOpen(false)}>{dict.common.close}</Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}