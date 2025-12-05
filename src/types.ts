export interface Booking {
    id: string;
    tenant_id: string;
    event_id: string;
    invitee_id?: string;
    start_time: string;
    end_time: string;
    customer_name: string;
    customer_email: string;
    customer_note?: string;
    location?: string;
    label_id?: string;
    status: string;
    management_token: string;
    token?: string;
    created_at: string;
}

export interface BookingLabel {
    id: string;
    tenant_id: string;
    name: string;
    color: string;
    payout: number;
    created_at: string;
}

export interface TimeWindow {
    start: string;
    end: string;
    max_participants?: number;
}

export interface Event {
    id: string;
    tenant_id: string;
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
    config_json: string;
    access_mode: 'OPEN' | 'RESTRICTED' | 'CLOSED';
    schedule_type: 'RECURRING' | 'MANUAL';
    allow_customer_cancel: boolean;
    allow_customer_reschedule: boolean;
    created_at: string;
    invitee_email?: string;
}

export interface EventSession {
    id: string;
    event_id: string;
    start_time: string;
    end_time: string;
    max_participants: number;
    location?: string;
    host_name?: string;
    created_at: string;
}

export interface Override {
    date: string;
    is_unavailable: boolean;
    location?: string;
    override_max_participants?: number;
    override_config_json?: string;
}

export interface Invitee {
    id: string;
    token: string;
    email?: string;
    status: string;
    event_id: string;
    created_at: string;
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
}

export interface Job {
    id: string;
    job_type: string;
    execute_at: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    error_message?: string;
    created_at: string;
}

export interface EmailTemplate {
    id: string;
    tenant_id: string;
    name: string;
    subject_template: string;
    body_template: string;
    template_type: 'mjml' | 'html';
    created_at: string;
    updated_at: string;
}

export interface EmailTemplateVersion {
    id: string;
    template_id: string;
    subject_template: string;
    body_template: string;
    created_at: string;
}

export interface NotificationRule {
    id: string;
    tenant_id: string;
    event_id?: string;
    trigger_type: 'ON_BOOKING' | 'REMINDER_24H' | 'REMINDER_1H' | 'ON_CANCEL';
    template_id: string;
    is_active: boolean;
    created_at: string;
}

export interface MailLog {
    id: string;
    job_id: string;
    recipient: string;
    template_id: string;
    context_hash: string;
    sent_at: string;
    status: string;
}

export interface TemplatePlaceholder {
    key: string;
    description: string;
    sample_value: string;
}

export interface Dictionary {
    common: {
        back: string;
        confirm: string;
        close: string;
        loading: string;
        edit: string;
        save: string;
        cancel: string;
        delete: string;
        copy: string;
        copied: string;
        open: string;
        unsaved_changes: string;
        saving: string;
        saved: string;
        unsaved: string;
    };
    admin: {
        login_title: string;
        register_title: string;
        dashboard: string;
        logout: string;
        events: string;
        create_event: string;
        manage: string;
        global_calendar_label: string;
        global_calendar_desc: string;
        jobs: {
            tooltip: string;
            title: string;
            status_header: string;
            type_header: string;
            time_header: string;
            refresh: string;
        };
        communication: {
            notifications_tab: string;
            templates_title: string;
            rules_title: string;
            add_rule: string;
            add_template: string;
            trigger_label: string;
            template_label: string;
            subject_label: string;
            body_label: string;
            campaign_title: string;
            send_btn: string;
            recipients_label: string;
        };
        labels: {
            title: string;
            create: string;
            name: string;
            color: string;
            actions: string;
            manage_btn: string;
        };
        sessions: {
            title: string;
            add: string;
            edit: string;
            date: string;
            time: string;
            capacity: string;
            location: string;
            host: string;
            delete_confirm: string;
            create_success: string;
            update_success: string;
            delete_success: string;
            public_link: string;
            view_bookings: string;
            add_booking: string;
        };
        event_form: {
            edit_title: string;
            create_title: string;
            general: string;
            slug: string;
            slug_helper: string;
            access_mode: string;
            schedule: string;
            schedule_helper: string;
            content: string;
            details: string;
            host_name: string;
            constraints: string;
            save_btn: string;
            recurring_weekly: string;
            recurring_desc: string;
            manual_sessions: string;
            manual_desc: string;
            duration_limits: string;
            duration_min: string;
            interval_min: string;
            global_capacity: string;
            global_capacity_helper: string;
            price_payout: string;
            image_url: string;
            valid_from: string;
            valid_until: string;
            notice_period: string;
            min_notice_general: string;
            min_notice_general_helper: string;
            min_notice_first: string;
            min_notice_first_helper: string;
            add_slot: string;
            event_timezone: string;
            timezone_helper: string;
            title_en: string;
            desc_en: string;
            title_de: string;
            desc_de: string;
            section_general_desc: string;
            section_schedule_desc: string;
            section_details_desc: string;
            section_notifications_desc: string;
        };
        event_detail: {
            tabs: { overview: string; bookings: string; invitees: string };
            calendar: { title: string; override_blocked: string; override_modified: string; helper: string };
            stats: { title: string; total: string; price: string; host: string; link_label: string };
            override_dialog: {
                title: string;
                date_label: string;
                unavailable_switch: string;
                location_label: string;
                config_title: string;
                add_slot: string;
                reset_btn: string;
            };
        };
        invitee_table: {
            title: string;
            import_label: string;
            import_btn: string;
            token_header: string;
            email_header: string;
            status_header: string;
            actions_header: string;
            edit_title: string;
        };
        calendar_tab: {
            appointments_label: string;
            busy: string;
            free: string;
            no_bookings: string;
            unknown_event: string;
            total_bookings: string;
            export_title: string;
            export_desc: string;
            download_btn: string;
        };
    };
    booking: {
        available_times: string;
        calendar_header: string;
        host_title: string;
        event_name: string;
        conferencing: string;
        enter_details: string;
        booking_label: string;
        location_label: string;
        success_title: string;
        success_msg: string;
        form: {
            name_label: string; name_placeholder: string;
            email_label: string; email_placeholder: string; email_helper: string;
            notes_label: string; notes_placeholder: string;
            submit_btn: string;
            privacy_note: string; privacy_link: string;
        };
    };
    manage: {
        title: string;
        cancelled_alert: string;
        reschedule_btn: string;
        cancel_btn: string;
        disabled_msg: string;
        cancel_dialog_title: string;
        cancel_dialog_desc: string;
        keep_btn: string;
        confirm_cancel_btn: string;
        cancelling: string;
        reschedule_title: string;
        success_cancelled: string;
        success_rescheduled: string;
        book_again_msg: string;
        new_time_label: string;
        back_to_details: string;
    };
}