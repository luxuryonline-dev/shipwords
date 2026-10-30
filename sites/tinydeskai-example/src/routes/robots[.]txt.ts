import { robotsTxt } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import site from '../../site.config';

const PRIVATE_PATHS = ['/api/', '/account', '/login', '/billing/', '/phone/'];

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        const base = robotsTxt(site, PRIVATE_PATHS);
        // Specific crawler groups do not inherit the wildcard group's restrictions.
        // Preserve the same private paths in every group; authentication remains enforced by the app.
        const searchGroups = ['OAI-SearchBot', 'ChatGPT-User'].flatMap((agent) => [
          `User-agent: ${agent}`,
          'Allow: /',
          ...PRIVATE_PATHS.map((path) => `Disallow: ${path}`),
          '',
        ]);
        return new Response(`${searchGroups.join('\n')}\n${await base.text()}`, { headers: base.headers });
      },
    },
  },
});
