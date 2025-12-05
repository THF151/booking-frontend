import 'server-only';

const dictionaries = {
    en: () => import('./locales/en.json').then((module) => module.default),
    de: () => import('./locales/de.json').then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const getDictionary = async (locale: Locale) => {
    if (dictionaries[locale]) {
        return dictionaries[locale]();
    }
    // Fallback
    return dictionaries['en']();
};