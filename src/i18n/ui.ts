import en from './en.json';
import es from './es.json';
import zh from './zh.json';
import gn from './gn.json';

export const defaultLang = 'es';
export const languagesList = ['es', 'en', 'zh', 'gn'] as const;

export const languages: Record<string, string> = {
  es: 'Español',
  en: 'English',
  zh: '中文',
  gn: "Avañe'ẽ",
};

const ui: Record<string, any> = { en, es, zh, gn };

export function getLangFromUrl(url: URL): string {
  const seg = url.pathname.split('/').filter(Boolean);
  const lang = seg[0];
  return (languagesList as readonly string[]).includes(lang) ? lang : defaultLang;
}

export function getI18n(url: URL) {
  const lang = getLangFromUrl(url);
  const messages = ui[lang];
  const t = (key: string): string => {
    const found = key
      .split('.')
      .reduce<any>((o, i) => (o == null ? undefined : o[i]), messages);
    return found ?? '';
  };
  return { lang, messages, t };
}

export function buildAlternates(
  path: string | Record<string, string> = '',
): Record<string, string> {
  const base = 'https://manopunta.com';
  const mk = (l: string, p: string) => {
    const clean = p.replace(/^\/+/, '').replace(/\/+$/, '');
    return `${base}/${l}/${clean ? clean + '/' : ''}`;
  };
  if (typeof path === 'string') {
    const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
    return {
      es: mk('es', clean),
      en: mk('en', clean),
      zh: mk('zh', clean),
      gn: mk('gn', clean),
      xDefault: mk('es', clean),
    };
  }
  const esSlug = path.es ?? '';
  return {
    es: mk('es', path.es ?? ''),
    en: mk('en', path.en ?? ''),
    zh: mk('zh', path.zh ?? ''),
    gn: mk('gn', path.gn ?? ''),
    xDefault: mk('es', esSlug),
  };
}

// 各语言版本的专题页 URL slug 映射；JSON 内容键沿用西语 slug 作为逻辑 id
export const topicSlugs = {
  'significado-la-mano-punta-del-este': {
    es: 'significado-la-mano-punta-del-este',
    en: 'meaning-of-la-mano-punta-del-este',
    zh: 'wu-zhi-diao-su-han-yi',
    gn: 'mbaepa-heis-va-la-mano',
  },
  'como-llegar-la-mano': {
    es: 'como-llegar-la-mano',
    en: 'how-to-get-to-la-mano',
    zh: 'qian-wang-wu-zhi-diao-su',
    gn: 'mbaechapa-eho-la-mano-pe',
  },
} as const;

export function htmlLangAttr(lang: string): string {
  return lang === 'zh' ? 'zh-CN' : lang;
}
