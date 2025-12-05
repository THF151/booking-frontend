import React from 'react';
import { getDictionary, Locale } from '@/i18n/dictionaries';
import TemplateEditorContent from './content';

export default async function TemplateLayout({
                                                 params
                                             }: {
    params: Promise<{ lang: string, id: string }>
}) {
    const { lang, id } = await params;
    const dict = await getDictionary(lang as Locale);

    return (
        <TemplateEditorContent lang={lang} dict={dict} id={id} />
    );
}