import { pageHead } from '@shipwords/core/seo';
import { createFileRoute, Link } from '@tanstack/react-router';
import { m } from '~/paraglide/messages.js';
import { FEATURED_EXAMPLE } from '~/site/discovery';
import { Faq, type FaqItem, faqJsonLd, GuidePage } from '~/site/guide';
import { formatPrice, packName, perVideo } from '~/site/pricing';
import site from '../../site.config';

// Explain this site’s paid credits and free-workflow distinctions without unverified competitor claims.
// Pack names and prices use the same product configuration as the checkout.

const PATH = '/tiny-desk-ai-free';

const freeOptions = () => [
  {
    name: m.guides_free_capcut_name(),
    can: m.guides_free_capcut_can(),
    cannot: m.guides_free_capcut_cannot(),
  },
  {
    name: m.guides_free_credits_name(),
    can: m.guides_free_credits_can(),
    cannot: m.guides_free_credits_cannot(),
  },
  { name: m.guides_free_diy_name(), can: m.guides_free_diy_can(), cannot: m.guides_free_diy_cannot() },
];

const packs = () =>
  site.products.map((product) => ({
    name: packName(product),
    people: m.guides_free_gen_us_people(),
    quality: '720p',
    price: formatPrice(product),
    free: m.guides_free_gen_no(),
    song: m.guides_free_gen_song_silent(),
  }));

const faq = (): FaqItem[] => [
  {
    q: m.guides_free_faq1_q(),
    a: m.guides_free_faq1_a({ site: site.name, price: formatPrice(site.products[0]) }),
  },
  { q: m.guides_free_faq2_q(), a: m.guides_free_faq2_a() },
  { q: m.guides_free_faq3_q(), a: m.guides_free_faq3_a() },
  {
    q: m.guides_free_faq4_q(),
    a: m.guides_free_faq4_a({ site: site.name, price: formatPrice(site.products[0]) }),
  },
  {
    q: m.guides_free_faq5_q(),
    a: m.guides_free_faq5_a({
      packs: site.products
        .slice(1)
        .map((p) => m.guides_free_faq5_pack({ name: packName(p), price: formatPrice(p) }))
        .join(m.guides_free_faq5_pack_or()),
    }),
  },
];

export const Route = createFileRoute('/tiny-desk-ai-free')({
  head: () =>
    pageHead(site, {
      title: m.guides_free_meta_title(),
      description: m.guides_free_meta_description(),
      path: PATH,
      image: `${site.url}/media/${FEATURED_EXAMPLE.clip}.jpg`,
      jsonLd: [faqJsonLd(faq())],
    }),
  component: FreePage,
});

function FreePage() {
  const checked = m.guides_free_checked();
  return (
    <GuidePage
      path={PATH}
      title={m.guides_free_title()}
      updated={checked}
      intro={<p>{m.guides_free_intro()}</p>}
    >
      <h2>{m.guides_free_options_heading()}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{m.guides_free_options_col_option()}</th>
              <th>{m.guides_free_options_col_can()}</th>
              <th>{m.guides_free_options_col_cannot()}</th>
            </tr>
          </thead>
          <tbody>
            {freeOptions().map((option) => (
              <tr key={option.name}>
                <td>{option.name}</td>
                <td>{option.can}</td>
                <td>{option.cannot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        {m.guides_free_diy_before()}{' '}
        <Link to="/how-to-make-outstanding-tiny-desk-ai-video">{m.guides_free_diy_link()}</Link>
        {m.guides_free_diy_after()}
      </p>

      <h2>{m.guides_free_compare_heading()}</h2>
      <p className="muted mono">{m.guides_free_compare_checked({ date: checked })}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{m.guides_free_compare_col_generator()}</th>
              <th>{m.guides_free_compare_col_people()}</th>
              <th>{m.guides_free_compare_col_quality()}</th>
              <th>{m.guides_free_compare_col_price()}</th>
              <th>{m.guides_free_compare_col_free()}</th>
              <th>{m.guides_free_compare_col_audio()}</th>
            </tr>
          </thead>
          <tbody>
            {packs().map((g) => (
              <tr key={g.name}>
                <td>
                  <strong>{g.name}</strong>
                </td>
                <td>{g.people}</td>
                <td>{g.quality}</td>
                <td className="mono">{g.price}</td>
                <td>{g.free}</td>
                <td>{g.song}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{m.guides_free_cheaper_heading()}</h2>
      <ul>
        <li>{m.guides_free_cheaper_people({ price: formatPrice(site.products[0]) })}</li>
        <li>{m.guides_free_cheaper_packs({ price: perVideo(site.products[1]) })}</li>
        <li>{m.guides_free_cheaper_not()}</li>
      </ul>
      <p>
        {m.guides_free_pricing_before()}
        <a href="/#pricing">{m.guides_free_pricing_link()}</a>
        {m.guides_free_pricing_after()}
      </p>

      <p>
        <Link to="/refunds">{m.guides_free_refund_link()}</Link>
      </p>
      <Faq title={m.guides_free_faq_title()} items={faq()} />
    </GuidePage>
  );
}
