export const siteConfig = {
  name: 'The Fingers of Punta del Este',
  baseUrl: 'https://manopunta.com',
  locales: ['es', 'en', 'zh', 'gn'] as const,
};

export const ogLocale: Record<string, string> = {
  es: 'es_ES',
  en: 'en_US',
  zh: 'zh_CN',
  gn: 'gn',
};
