import { createFileRoute } from '@tanstack/react-router';
import { m } from '~/paraglide/messages.js';
import { LegalPage, legalHead, SUPPORT_EMAIL } from '~/site/legal';
import site from '../../site.config';

export const Route = createFileRoute('/refunds')({
  head: () =>
    legalHead({
      title: m.legal_refunds_meta_title({ siteName: site.name }),
      description: m.legal_refunds_meta_description({ siteName: site.name }),
      path: '/refunds',
    }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <LegalPage
      title={m.legal_refunds_title()}
      intro={m.legal_refunds_intro()}
      sections={[
        { id: 'failed-renders', label: m.legal_refunds_failed_heading() },
        { id: 'unused-packs', label: m.legal_refunds_unused_heading() },
        { id: 'broken-results', label: m.legal_refunds_broken_heading() },
        { id: 'request', label: m.legal_refunds_ask_heading() },
      ]}
    >
      <h2 id="failed-renders">{m.legal_refunds_failed_heading()}</h2>
      <p>{m.legal_refunds_failed_body()}</p>

      <h2 id="unused-packs">{m.legal_refunds_unused_heading()}</h2>
      <p>{m.legal_refunds_unused_body()}</p>

      <h2 id="broken-results">{m.legal_refunds_broken_heading()}</h2>
      <p>{m.legal_refunds_broken_body()}</p>
      <p>{m.legal_refunds_broken_likeness()}</p>

      <h2 id="request">{m.legal_refunds_ask_heading()}</h2>
      <p>
        {m.legal_refunds_ask_body_before()} <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{' '}
        {m.legal_refunds_ask_body_after()}
      </p>
      <p>{m.legal_refunds_no_subscription({ siteName: site.name })}</p>
    </LegalPage>
  );
}
