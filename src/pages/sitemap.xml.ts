import type { APIRoute } from 'astro';
import { topicSlugs } from '../i18n/ui';

const base = 'https://manopunta.com';
const locales = ['es', 'en', 'zh', 'gn'];
const pages = ['', 'privacy-policy', 'terms-of-service', 'cookie-settings'];

export const GET: APIRoute = () => {
  const entries: string[] = [];
  // 构建日期即内容发布日期：静态站点每次部署都会重新生成全部页面
  const lastmod = new Date().toISOString().slice(0, 10);

  for (const page of pages) {
    const path = page ? `${page}/` : '';
    for (const lang of locales) {
      const loc = `${base}/${lang}/${path}`;
      const alternates = locales
        .map(
          (l) =>
            `    <xhtml:link rel="alternate" hreflang="${l}" href="${base}/${l}/${path}"/>`,
        )
        .join('\n');
      entries.push(
        [
          '  <url>',
          `    <loc>${loc}</loc>`,
          `    <lastmod>${lastmod}</lastmod>`,
          alternates,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${base}/es/${path}"/>`,
          '    <changefreq>weekly</changefreq>',
          '  </url>',
        ].join('\n'),
      );
    }
  }

  // 专题页：每语言使用各自 slug，输出四语互链 + x-default（指向 es）
  for (const [, slugs] of Object.entries(topicSlugs)) {
    for (const lang of locales) {
      const slug = slugs[lang as keyof typeof slugs];
      const loc = `${base}/${lang}/${slug}/`;
      const alternates = locales
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${base}/${l}/${slugs[l as keyof typeof slugs]}/"/>`)
        .join('\n');
      entries.push(
        [
          '  <url>',
          `    <loc>${loc}</loc>`,
          `    <lastmod>${lastmod}</lastmod>`,
          alternates,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${base}/es/${slugs.es}/"/>`,
          '    <changefreq>weekly</changefreq>',
          '  </url>',
        ].join('\n'),
      );
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
