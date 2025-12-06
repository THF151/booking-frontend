'use client';
import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    InputAdornment
} from '@mui/material';
import DesktopMacIcon from '@mui/icons-material/DesktopMac';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import WarningIcon from '@mui/icons-material/Warning';
import CheckIcon from '@mui/icons-material/Check';
import { TemplatePlaceholder, Event, Tenant } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface PreviewPanelProps {
    templateContent: string;
    templateType: 'mjml' | 'html';
    subjectTemplate: string;
    placeholders: TemplatePlaceholder[];
    sampleContext: Record<string, string>;
    onContextChange: (newContext: Record<string, string>) => void;
}

function PreviewPanel({ templateContent, templateType, subjectTemplate, placeholders, sampleContext, onContextChange }: PreviewPanelProps) {
    const { tenantId, tenantLogo, tenantName } = useAuthStore();
    const [html, setHtml] = useState('');
    const [view, setView] = useState<'desktop' | 'mobile'>('desktop');
    const [selectedEventId, setSelectedEventId] = useState<string>('');

    const { data: events = [] } = useQuery({
        queryKey: ['events', tenantId],
        queryFn: () => api.get<Event[]>(`/${tenantId}/events`),
        enabled: !!tenantId
    });

    const { data: tenant } = useQuery({
        queryKey: ['tenant', tenantId],
        queryFn: () => api.get<Tenant>(`/tenants`),
        enabled: !!tenantId
    });

    useEffect(() => {
        if (events.length > 0 && !selectedEventId) {
            setSelectedEventId(events[0].id);
        }
    }, [events, selectedEventId]);

    useEffect(() => {
        if (selectedEventId) {
            const event = events.find(e => e.id === selectedEventId);
            if (event) {
                const newContext = { ...sampleContext };

                newContext['event_title'] = event.title_en;
                newContext['location'] = event.location;
                newContext['duration'] = event.duration_min.toString();
                newContext['timezone'] = event.timezone;
                newContext['payout'] = event.payout;
                newContext['event_description'] = event.desc_en;

                // Ensure tenant details are populated
                const logo = tenant?.logo_url || tenantLogo || 'https://via.placeholder.com/150';
                const name = tenant?.name || tenantName || 'Tenant Name';

                newContext['logo_url'] = logo;
                newContext['tenant_name'] = name;

                const nextSlot = dayjs().add(2, 'day').hour(10).minute(0).second(0);
                newContext['start_time'] = nextSlot.format('YYYY-MM-DD HH:mm');

                onContextChange(newContext);
            }
        } else {
            const newContext = { ...sampleContext };
            const logo = tenant?.logo_url || tenantLogo || 'https://via.placeholder.com/150';
            const name = tenant?.name || tenantName || 'Tenant Name';

            if (!newContext['logo_url']) newContext['logo_url'] = logo;
            if (!newContext['tenant_name']) newContext['tenant_name'] = name;

            onContextChange(newContext);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEventId, events, tenant, tenantLogo, tenantName]);

    const usedVariables = useMemo(() => {
        const combined = subjectTemplate + templateContent;
        const used = new Set<string>();
        placeholders.forEach(p => {
            if (combined.includes(`{{${p.key}}}`) || combined.includes(`{{ ${p.key} }}`)) {
                used.add(p.key);
            }
        });
        // Check for specific commonly used variables if not in placeholders list explicitly but used in template
        if (combined.includes('{{logo_url}}') || combined.includes('{{ logo_url }}')) used.add('logo_url');
        if (combined.includes('{{tenant_name}}') || combined.includes('{{ tenant_name }}')) used.add('tenant_name');

        return used;
    }, [subjectTemplate, templateContent, placeholders]);

    const renderedSubject = useMemo(() => {
        let currentSubject = subjectTemplate;
        for (const [key, value] of Object.entries(sampleContext)) {
            currentSubject = currentSubject.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value || '');
        }
        return currentSubject;
    }, [subjectTemplate, sampleContext]);

    const renderedHtml = useMemo(() => {
        let currentHtml = html;
        for (const [key, value] of Object.entries(sampleContext)) {
            currentHtml = currentHtml.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value || '');
        }
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>body { margin: 0; padding: 0; background-color: #ffffff; color: #000000; }</style>
                </head>
                <body>${currentHtml}</body>
            </html>
        `;
    }, [html, sampleContext]);

    useEffect(() => {
        const convertMjml = async () => {
            if (!templateContent || templateContent.trim() === '') {
                setHtml('');
                return;
            }
            if (templateType === 'html') {
                setHtml(templateContent);
                return;
            }
            try {
                const mjml = (await import('mjml-browser')).default;
                const { html: convertedHtml, errors } = mjml(templateContent, { validationLevel: 'soft' });
                if (errors.length > 0) {
                    console.warn("MJML Warnings/Errors:", errors);
                }
                setHtml(convertedHtml);
            } catch (e) {
                console.error("MJML conversion error:", e);
                setHtml('<p style="color: red; font-family: sans-serif;">Error rendering MJML preview.</p>');
            }
        };
        convertMjml();
    }, [templateContent, templateType]);

    return (
        <Stack sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Live Preview</Typography>
                    <Stack direction="row" spacing={1}>
                        {events.length > 0 && (
                            <TextField
                                select
                                size="small"
                                label="Use Event Data"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                SelectProps={{ native: true }}
                                sx={{ minWidth: 150 }}
                            >
                                {events.map(ev => (
                                    <option key={ev.id} value={ev.id}>{ev.slug}</option>
                                ))}
                            </TextField>
                        )}
                        <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
                            <ToggleButton value="desktop"><DesktopMacIcon /></ToggleButton>
                            <ToggleButton value="mobile"><PhoneIphoneIcon /></ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                </Stack>
            </Box>

            <Box sx={{ p: 2, flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="overline">Subject</Typography>
                <Typography sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1, wordBreak: 'break-all' }}>{renderedSubject}</Typography>
            </Box>

            <Box sx={{ p: 2, flexShrink: 0, overflowY: 'auto', maxHeight: 200 }}>
                <Typography variant="overline">Variables & Data</Typography>
                <Stack spacing={1} mt={1}>
                    {placeholders.map(p => {
                        const isUsed = usedVariables.has(p.key);
                        return (
                            <Tooltip key={p.key} title={p.description} placement="left">
                                <TextField
                                    label={p.key}
                                    value={sampleContext[p.key] || ''}
                                    onChange={(e) => onContextChange({ ...sampleContext, [p.key]: e.target.value })}
                                    size="small"
                                    color={isUsed ? 'success' : 'warning'}
                                    focused={!isUsed}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {isUsed ? <CheckIcon color="success" fontSize="small" /> : <Tooltip title="Variable not used in template"><WarningIcon color="warning" fontSize="small" /></Tooltip>}
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Tooltip>
                        );
                    })}
                    {!placeholders.some(p => p.key === 'logo_url') && (
                        <TextField
                            label="logo_url"
                            value={sampleContext['logo_url'] || ''}
                            onChange={(e) => onContextChange({ ...sampleContext, 'logo_url': e.target.value })}
                            size="small"
                            color={usedVariables.has('logo_url') ? 'success' : 'warning'}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {usedVariables.has('logo_url') ? <CheckIcon color="success" fontSize="small" /> : <WarningIcon color="warning" fontSize="small" />}
                                    </InputAdornment>
                                )
                            }}
                        />
                    )}
                    {!placeholders.some(p => p.key === 'tenant_name') && (
                        <TextField
                            label="tenant_name"
                            value={sampleContext['tenant_name'] || ''}
                            onChange={(e) => onContextChange({ ...sampleContext, 'tenant_name': e.target.value })}
                            size="small"
                            color={usedVariables.has('tenant_name') ? 'success' : 'warning'}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {usedVariables.has('tenant_name') ? <CheckIcon color="success" fontSize="small" /> : <WarningIcon color="warning" fontSize="small" />}
                                    </InputAdornment>
                                )
                            }}
                        />
                    )}
                </Stack>
            </Box>

            <Box sx={{ flexGrow: 1, p: 2, bgcolor: 'grey.300', overflow: 'auto' }}>
                <Paper
                    component="iframe"
                    title="Email Preview"
                    srcDoc={renderedHtml}
                    sx={{
                        width: view === 'desktop' ? '100%' : '375px',
                        maxWidth: '100%',
                        height: '100%',
                        border: 'none',
                        mx: 'auto',
                        display: 'block',
                        transition: 'width 0.3s ease-in-out',
                        bgcolor: '#ffffff',
                    }}
                />
            </Box>
        </Stack>
    );
}

export default React.memo(PreviewPanel);