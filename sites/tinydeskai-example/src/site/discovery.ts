import site from '../../site.config';

export const FEATURED_EXAMPLE = {
  id: 'full-band',
  clip: 'sample-full-band-n',
  title: 'Five-role AI band video example',
  description:
    'Site-supplied AI-edited Outstanding band demonstration with a replacement cast in all five roles.',
  width: 720,
  height: 1280,
  duration: 'PT17.709S',
  published: '2026-10-29',
} as const;

export const DOG_EXAMPLE = {
  id: 'dog-band',
  clip: 'sample-dogs',
  title: 'Default dog-cast band demonstration',
  description: 'Bundled AI demonstration showing the five default dog characters in the band performance.',
  width: 540,
  height: 960,
  duration: 'PT17.709S',
  published: '2026-10-29',
} as const;

export const APP_DESCRIPTION =
  'Create a preset Outstanding Tiny Desk-style band video from face photos. Replace one to five performers and download a vertical MP4 with audio plus a silent copy.';

export const APP_FEATURES = [
  'Photo-based face replacement in a preset Outstanding band performance',
  'Five roles: lead vocals, sax, keys and two backing singers',
  'Approximately 18-second vertical 9:16 video at 720p',
  'Downloads with reference audio and a silent copy',
  'One-time credit packs; no subscription or free renders',
];

export function applicationJsonLd() {
  return {
    '@type': ['SoftwareApplication', 'WebApplication'],
    '@id': `${site.url}/#application`,
    name: site.name,
    url: site.url,
    description: APP_DESCRIPTION,
    image: `${site.url}/logo.png`,
    applicationCategory: 'MultimediaApplication',
    applicationSubCategory: 'Photo-based AI band video generator',
    operatingSystem: 'Web',
    featureList: APP_FEATURES,
    offers: site.products.map((product) => ({
      '@type': 'Offer',
      name: product.name,
      url: `${site.url}/#pricing`,
      price: (product.price.amount / 100).toFixed(2),
      priceCurrency: product.price.currency.toUpperCase(),
    })),
  };
}

export function exampleJsonLd(example: typeof FEATURED_EXAMPLE | typeof DOG_EXAMPLE) {
  return {
    '@type': 'VideoObject',
    '@id': `${site.url}/#${example.id}-video`,
    name: example.title,
    description: example.description,
    thumbnailUrl: `${site.url}/media/${example.clip}.jpg`,
    contentUrl: `${site.url}/media/${example.clip}.mp4`,
    uploadDate: example.published,
    duration: example.duration,
    width: { '@type': 'QuantitativeValue', value: example.width, unitText: 'px' },
    height: { '@type': 'QuantitativeValue', value: example.height, unitText: 'px' },
    encodingFormat: 'video/mp4',
  };
}
