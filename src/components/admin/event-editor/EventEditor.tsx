'use client';

import React, { useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import EventEditorLayout from './EventEditorLayout';
import GeneralSection from './GeneralSection';
import AvailabilitySection from './AvailabilitySection';
import SettingsSection from './SettingsSection';
import NotificationsSection from './NotificationsSection';
import { Event, Dictionary, TimeWindow } from '@/types';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
    initialData?: Event;
    dict: Dictionary;
    lang: string;
}

export interface EventEditorState {
    slug: string;
    title_en: string;
    title_de: string;
    desc_en: string;
    desc_de: string;
    location: string;
    payout: string;
    host_name: string;
    timezone: string;
    min_notice_general: number;
    min_notice_first: number;
    active_start: string;
    active_end: string;
    duration_min: number;
    interval_min: number;
    max_participants: number;
    image_url: string;
    access_mode: string;
    schedule_type: 'RECURRING' | 'MANUAL';
    allow_customer_cancel: boolean;
    allow_customer_reschedule: boolean;
    config: Record<string, TimeWindow[]>;
}

export default function EventEditor({ initialData, dict, lang }: Props) {
    const router = useRouter();
    const { tenantId, tenantLogo } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fmtDate = (d: string) => d ? dayjs(d).format('YYYY-MM-DDTHH:mm') : '';

    const [form, setForm] = useState<EventEditorState>(() => {
        if (initialData) {
            return {
                slug: initialData.slug,
                title_en: initialData.title_en,
                title_de: initialData.title_de,
                desc_en: initialData.desc_en,
                desc_de: initialData.desc_de,
                location: initialData.location,
                payout: initialData.payout,
                host_name: initialData.host_name,
                timezone: initialData.timezone || dayjs.tz.guess(),
                min_notice_general: initialData.min_notice_general || 0,
                min_notice_first: initialData.min_notice_first || 0,
                active_start: fmtDate(initialData.active_start),
                active_end: fmtDate(initialData.active_end),
                duration_min: initialData.duration_min,
                interval_min: initialData.interval_min,
                max_participants: initialData.max_participants,
                image_url: initialData.image_url,
                access_mode: initialData.access_mode,
                schedule_type: initialData.schedule_type || 'RECURRING',
                allow_customer_cancel: initialData.allow_customer_cancel ?? true,
                allow_customer_reschedule: initialData.allow_customer_reschedule ?? true,
                config: typeof initialData.config_json === 'string'
                    ? JSON.parse(initialData.config_json)
                    : {}
            };
        }
        return {
            slug: '',
            title_en: '', title_de: '',
            desc_en: '', desc_de: '',
            location: 'Zoom',
            payout: '0',
            host_name: 'Dr. Privacy',
            timezone: dayjs.tz.guess(),
            min_notice_general: 60,
            min_notice_first: 240,
            active_start: fmtDate(dayjs().toISOString()),
            active_end: fmtDate(dayjs().add(1, 'year').toISOString()),
            duration_min: 30,
            interval_min: 30,
            max_participants: 1,
            image_url: tenantLogo || "https://via.placeholder.com/150",
            access_mode: 'OPEN',
            schedule_type: 'RECURRING',
            allow_customer_cancel: true,
            allow_customer_reschedule: true,
            config: {
                monday: [{start: "09:00", end: "17:00"}],
                tuesday: [{start: "09:00", end: "17:00"}],
                wednesday: [{start: "09:00", end: "17:00"}],
                thursday: [{start: "09:00", end: "17:00"}],
                friday: [{start: "09:00", end: "17:00"}]
            }
        };
    });

    const handleChange = (field: keyof EventEditorState, value: unknown) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!tenantId) return;

        if (!form.slug || form.slug.trim() === '') {
            setErrorMsg("Slug is required.");
            return;
        }

        setIsSaving(true);

        const payload = {
            ...form,
            active_start: dayjs(form.active_start).toISOString(),
            active_end: dayjs(form.active_end).toISOString(),
            duration_min: Number(form.duration_min),
            interval_min: Number(form.interval_min),
            max_participants: Number(form.max_participants),
            min_notice_general: Number(form.min_notice_general),
            min_notice_first: Number(form.min_notice_first),
        };

        try {
            if (initialData) {
                await api.put(`/${tenantId}/events/${initialData.slug}`, payload);
                setIsDirty(false);
            } else {
                await api.post(`/${tenantId}/events`, payload);
                router.push(`/${lang}/admin/events/${form.slug}`);
            }
        } catch (e) {
            console.error(e);
            if (e instanceof Error) {
                setErrorMsg(e.message || "Save failed");
            } else {
                setErrorMsg("Save failed");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        if (isDirty) {
            if (!confirm(dict.common.unsaved_changes)) return;
        }
        router.back();
    };

    return (
        <>
            <EventEditorLayout
                title={initialData ? (lang === 'de' ? form.title_de : form.title_en) : dict.admin.create_event}
                lang={lang}
                dict={dict}
                onSave={handleSave}
                isSaving={isSaving}
                isDirty={isDirty}
                onBack={handleBack}
            >
                {(section) => (
                    <>
                        {section === 'general' && (
                            <GeneralSection form={form} onChange={handleChange} dict={dict} isEdit={!!initialData} />
                        )}
                        {section === 'availability' && (
                            <AvailabilitySection form={form} onChange={handleChange} dict={dict} />
                        )}
                        {section === 'settings' && (
                            <SettingsSection form={form} onChange={handleChange} dict={dict} />
                        )}
                        {section === 'notifications' && (
                            <NotificationsSection form={form} dict={dict} eventId={initialData?.id} lang={lang} />
                        )}
                    </>
                )}
            </EventEditorLayout>

            <Snackbar
                open={!!errorMsg}
                autoHideDuration={6000}
                onClose={() => setErrorMsg(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setErrorMsg(null)} variant="filled">
                    {errorMsg}
                </Alert>
            </Snackbar>
        </>
    );
}