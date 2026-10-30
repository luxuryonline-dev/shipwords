import { llmsTxt } from '@shipwords/core/seo';
import { createFileRoute } from '@tanstack/react-router';
import { APP_DESCRIPTION, DOG_EXAMPLE, FEATURED_EXAMPLE } from '~/site/discovery';
import { GUIDES } from '~/site/guide';
import site from '../../site.config';

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () => {
        const base = llmsTxt(site, APP_DESCRIPTION, [
          { title: site.name, path: '/', description: 'Photo upload, band roles, current pricing and FAQ.' },
          ...GUIDES.map((guide) => ({ ...guide, title: guide.title(), description: guide.description() })),
          {
            title: 'Refund rules',
            path: '/refunds',
            description: 'Credit returns, unused-pack refunds and technical defects.',
          },
          {
            title: 'Photo privacy',
            path: '/privacy',
            description: 'Photo processing, browser storage and deletion requests.',
          },
          { title: 'Terms', path: '/terms', description: 'Adult-only personal parody and sharing rules.' },
          {
            title: 'Copyright and likeness removal',
            path: '/dmca',
            description: 'Reporting and counter-notice information.',
          },
        ]);
        const priceLines = site.products.map((product) => {
          const amount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: product.price.currency,
          }).format(product.price.amount / 100);
          return `- ${product.name}: ${amount} ${product.price.currency.toUpperCase()}, one-time credit pack.`;
        });
        const facts = [
          '## Product facts',
          '',
          '- Purpose: a specialized Outstanding Tiny Desk-style AI band face-swap tool.',
          '- Input: clear face photos in JPEG, PNG or WebP. Users must add at least one photo of their own.',
          '- Roles: lead vocals, sax, keys, backing vocals left and backing vocals right; replace 1–5 roles per video.',
          '- Default cast: five dogs. Replace a dog with an uploaded face, leave it in place, or remove it to retain the original performer.',
          '- Output: approximately 18 seconds, vertical 9:16 MP4 at 720p, with reference audio and a separate silent copy; no added site watermark.',
          '- Current workflow: Kuaishou Kling 4.0 video-edit mode, with a preset reference performance. Rendering usually takes about 7–10 minutes; queues can make it longer.',
          '- Sign-in: email; Google sign-in is available only when offered on the site.',
          '- Scope: no open-ended text-to-video prompt, user-supplied reference-video upload or standalone image-generation feature.',
          '',
          '## Pricing and policies',
          '',
          ...priceLines,
          '- One video has the same credit cost for 1–5 replaced performers. No subscription, no free renders; credits do not expire.',
          '- Failed or refused generations return their spent credits automatically; this is distinct from refunding a payment.',
          '- Completely unused packs: request a refund within 14 days. Clearly broken completed videos: report within 7 days with the video link. See /refunds for full terms.',
          '- Uploaded photos are deleted from this site’s storage within 2 days. Provider processing and completed-video retention are described in /privacy.',
          '- Personal, non-commercial parody only; everyone in uploaded photos must be 18 or older. Source music and footage remain subject to their owners’ rights.',
          '- Independent of NPR, Tiny Desk Concerts, Charlie Wilson and The Gap Band; not an official or endorsed service.',
          '',
          '## Example evidence',
          '',
          `- ${site.url}/#make and ${site.url}/#fyp contain the existing video demonstrations.`,
          `- Site-supplied full-band demo: /media/${FEATURED_EXAMPLE.clip}.mp4, 720×1280, 17.709 seconds. Its input portraits, render time and generation parameters have not been published.`,
          `- Bundled dog demo: /media/${DOG_EXAMPLE.clip}.mp4, 540×960, 17.709 seconds. Default dog reference portraits appear in the homepage generator.`,
          '- The stage collage is assembled from output frames. Demo file encoding is distinct from the current generator’s advertised output settings.',
          '- Examples illustrate the format and are not guarantees of likeness, rendering time or social performance.',
          '',
        ];
        return new Response(`${await base.text()}\n${facts.join('\n')}`, { headers: base.headers });
      },
    },
  },
});
