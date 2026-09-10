import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://manopunta.com',
  output: 'static',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'zh', 'gn'],
    routing: {
      prefixDefaultLocale: true,
      // 关闭 Astro 自动生成的 / → /es 重定向页。
      // 根路径改由 src/pages/index.astro 直接渲染西语首页（无跳转）。
      redirectToDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
