import { createServerFn } from '@tanstack/react-start';
import { LAUNCH_READY } from '~/site/launch';

// Public config the browser needs (reCAPTCHA site key, Google client ID). Values come from wrangler vars or .dev.vars, not the build.
export const getPublicConfig = createServerFn({ method: 'GET' }).handler(async () => {
  if (!LAUNCH_READY) return { recaptchaSiteKey: null, googleClientId: null };
  const { core } = await import('~/core.server');
  const env = core.env;
  return {
    recaptchaSiteKey: env.RECAPTCHA_SITE_KEY || null,
    googleClientId: env.GOOGLE_CLIENT_ID || null,
  };
});
