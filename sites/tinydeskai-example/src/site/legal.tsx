import { pageHead } from '@shipwords/core/seo';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { m } from '~/paraglide/messages.js';
import { SUPPORT_CONTENT_UPDATED } from '~/site/content-dates';
import site from '../../site.config';

// Shared layout for the privacy, terms, refund and DMCA pages: long poster-paper card (DESIGN.md "Content pages").
// The contact address forwards to the support inbox via Email Routing (README).
// The policy date is common_legal_policy_date in messages/common; update both en and zh when a policy changes.

export const SUPPORT_EMAIL = 'support@tinydeskaigenerator.org';

export function legalHead({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const url = `${site.url}${path}`;
  return pageHead(site, {
    title,
    description,
    path,
    jsonLd: [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: title,
        description,
        url,
        inLanguage: 'en',
        dateModified: SUPPORT_CONTENT_UPDATED,
        isPartOf: { '@type': 'WebSite', '@id': `${site.url}/#website`, name: site.name, url: site.url },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.name, item: site.url },
          { '@type': 'ListItem', position: 2, name: title, item: url },
        ],
      },
    ],
  });
}

export function LegalPage({
  title,
  intro,
  sections,
  children,
}: {
  title: string;
  intro: string;
  sections?: { id: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <article className="sheet legal">
      <h1>{title}</h1>
      <p className="muted mono">{m.common_legal_updated({ date: m.common_legal_policy_date() })}</p>
      <p className="legal-intro">{intro}</p>
      {sections && (
        <nav aria-label={m.legal_on_this_page()}>
          <strong>{m.legal_on_this_page()}</strong>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {children}
      <p className="legal-contact">
        {m.common_legal_questions()} <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
      <p>{m.legal_request_safety()}</p>
      <nav aria-label={m.legal_navigation_title()}>
        <h2>{m.legal_navigation_title()}</h2>
        <ul>
          <li>
            <Link to="/">{m.legal_generator_link()}</Link>
          </li>
          <li>
            <a href="/#faq">{m.legal_faq_link()}</a>
          </li>
          <li>
            <Link to="/privacy">{m.common_footer_privacy()}</Link>
          </li>
          <li>
            <Link to="/terms">{m.common_footer_terms()}</Link>
          </li>
          <li>
            <Link to="/refunds">{m.common_footer_refunds()}</Link>
          </li>
          <li>
            <Link to="/dmca">{m.common_footer_dmca()}</Link>
          </li>
        </ul>
      </nav>
    </article>
  );
}
