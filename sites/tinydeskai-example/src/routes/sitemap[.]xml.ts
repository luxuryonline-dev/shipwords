import { sitemapXml } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import { SUPPORT_CONTENT_UPDATED } from '~/site/content-dates';
import { GUIDES } from '~/site/guide';
import site from '../../site.config';

// Register new indexable pages here.
export const PAGES = ['/', ...GUIDES.map((guide) => guide.path), '/privacy', '/terms', '/refunds', '/dmca'];
const UPDATED_PAGES = new Set([
  '/',
  '/privacy',
  '/terms',
  '/refunds',
  '/dmca',
  '/how-to-make-outstanding-tiny-desk-ai-video',
]);

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        sitemapXml(
          site,
          PAGES.map((path) => ({
            path,
            lastmod: UPDATED_PAGES.has(path) ? SUPPORT_CONTENT_UPDATED : undefined,
          })),
        ),
    },
  },
});
