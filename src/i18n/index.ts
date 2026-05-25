import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ruTranslations from './locales/ru.json';
import enTranslations from './locales/en.json';

const getTranslation = (module: any) => {
  if (!module) return {};
  return module.default || module;
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ru: {
        translation: getTranslation(ruTranslations)
      },
      en: {
        translation: getTranslation(enTranslations)
      }
    },
    lng: 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;