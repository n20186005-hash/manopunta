import type { APIRoute } from 'astro';

const base = 'https://manopunta.com';
const locales = ['es', 'en', 'zh', 'gn'];
const pages = ['', 'privacy-policy', 'terms-of-service', 'cookie-settings'];

export const GET: APIRoute = () => {
  const entries: string[] = [];
  // 构建日期即内容发布日期：静态站点每次部署都会重新生成全部页面
  const lastmod = new Date().toISOString().slice(0, 10);

  for (const page of pages) {
    const suffix = page ? `/${page}` : '';
    for (const lang of locales) {
      const loc = `${base}/${lang}${suffix}`;
      const alternates = locales
        .map(
          (l) =>
            `    <xhtml:link rel="alternate" hreflang="${l}" href="${base}/${l}${suffix}"/>`,
        )
        .join('\n');
      entries.push(
        [
          '  <url>',
          `    <loc>${loc}</loc>`,
          `    <lastmod>${lastmod}</lastmod>`,
          alternates,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${base}/es${suffix}"/>`,
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
