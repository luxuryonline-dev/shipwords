# Tiny Desk AI Generator

## Deployment

- Domain: `https://tinydeskaigenerator.org`
- Worker: `tinydeskaigenerator`
- D1: `tinydeskaigenerator-db`
- R2: `tinydeskaigenerator-outputs`; objects under `uploads/` expire after two days.
- Workflow: `tinydeskaigenerator-generation`
- The public preview preserves the site pages. `src/site/launch.ts` keeps uploads, sign-up, generation and checkout unavailable until launch prerequisites are complete.
- `APP_URL` and the sender address are set in `wrangler.jsonc`. The application signing secrets are configured in Cloudflare Secrets; generation, payment and email setup still need completion.
- The local configuration includes the compose container and Durable Object binding. Publishing this configuration requires a running Docker engine to build the image. The live preview has not yet deployed the container. Add the email binding only after Email Sending is verified for the domain.
- Public display media from `https://tinydeskai.io/media/` is stored under `public/media/` with matching filenames. It remains git-ignored, as in the original example. A separate public-only R2 bucket, `tinydeskaigenerator-public-media`, supplies clean builds through `media-manifest.json`; `pnpm build` restores the files and verifies sizes and SHA-256 hashes before bundling. User uploads and generated outputs stay in the separate `tinydeskaigenerator-outputs` bucket.
- The public reference clip from `https://tinydeskai.io/files/assets/tinydesk/full-17s.mp4` is stored at `assets/tinydesk/full-17s.mp4` in R2. `assets/tinydesk/song.m4a` contains its extracted AAC audio, so `site.models.ts` uses `audioStart: 0`.

Before enabling `LAUNCH_READY` in `src/site/launch.ts`, verify the media described below, configure the generation and payment secrets in Cloudflare, verify email delivery and the support inbox, deploy and verify the compose container, and test a complete generation and payment flow.

The compose configuration from the example is:

```json
{
  "containers": [
    {
      "class_name": "ComposeContainer",
      "scheduling_policy": "durable_object",
      "images": { "compose": { "dockerfile": "../../packages/jobs/compose/Dockerfile" } }
    }
  ],
  "durable_objects": { "bindings": [{ "name": "COMPOSE", "class_name": "ComposeContainer" }] },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["ComposeContainer"] }],
  "send_email": [{ "name": "EMAIL" }]
}
```

Deploy from the repository's `main` branch with `pnpm --filter ./sites/tinydeskai-example check`, then `pnpm --filter ./sites/tinydeskai-example run deploy`. Keep real credentials out of the repository.

### Cloudflare Workers Builds

Use the existing Worker `tinydeskaigenerator` and repository `luxuryonline-dev/shipwords`:

- Production branch: `main`.
- Root directory: repository root (`/`), so workspace packages and the compose Dockerfile are included.
- Node version: `24` (also declared in `.nvmrc`); pnpm version comes from `packageManager` in the root `package.json`.
- Build command: `pnpm --filter ./sites/tinydeskai-example check`.
- Deploy command: `pnpm --filter ./sites/tinydeskai-example exec wrangler deploy`.
- Set build variable `NODE_VERSION=24`. Runtime secrets remain under the Worker's Variables and Secrets, not build variables.
- The deployment credential must permit deployment of this Worker's resources, including Workflows, Containers and its R2/D1 bindings. Complete the Cloudflare GitHub connection and verify the first container build before enabling generation.
- Keep non-production branch deployment disabled until a separate staging environment is configured.

Workers Builds supplies Docker for the image build, so the developer's computer does not need Docker installed.

## Original example

- **What it is**: the source of [tinydeskai.io](https://tinydeskai.io/), a live shipwords site for the "Outstanding" Tiny Desk AI trend (put anyone into the band and get a 9:16 clip). Open-sourced as a complete example: fork it and launch your own version of the keyword.
- **Not deployed from here.** tinydeskai.io is deployed from its own private config. Domain, resource names, IDs and the support email in this copy are placeholders.

## How it works

- **Product**: a fixed four-shot template (band, lead close-up, sax solo, band). The stage starts with five dogs; visitors tap a seat and upload a photo (at least one of their own). × on a photo puts the dog back, × on a dog keeps the original coach. Price is per video, 1 to 5 people.
- **Generation** (`site.models.ts`): an effect model. Kling 4.0 in edit mode takes the whole 17.7-second clip plus the uploaded photos and replaces those people in one pass (about $3.06 at 720p); seats still showing a dog are sent as dog photos, cleared seats keep the original coaches. The compose container (`packages/jobs/compose`, ffmpeg) checks that no original face is left in a swapped seat (otherwise the job fails with a refund), re-aligns the output to the original cut points and mixes the song back in, delivering a version with the song and a silent one.
- **Pages**: tool home page, tutorial, template page, meme explainer, free page, pricing, policies; FAQ and structured data on each.
- **Flow**: sign in (Google or email code), buy credits, generate. No guest trial and no signup bonus.

## Scenery and prompt maintenance

- The generator defaults to the original room. Its optional scenery control offers three preset environments, a short custom description and one uploaded background photo with optional scene notes. Custom scenery is experimental; real generation quality must be checked separately from software tests. A background image guides a reconstructed setting; pixel-identical reproduction is not promised.
- Edit generation templates in `src/site/prompts.server.ts`: `originalScenePrompt()` preserves the original room; `customScenePrompt()` changes the environment from text; `photoScenePrompt()` uses an independently bound background image. `performerInstructions()` holds their shared cast and movement constraints. `PROMPT_VERSIONS` identifies the templates; bump the relevant version when changing a template.
- `site.models.ts` selects the template after `src/site/scene.ts` validates the request. It also owns the upstream model, credit price, cost cap, reference clip, cut points and original soundtrack. Scene descriptions are data, not a replacement system prompt; they cannot change those settings.
- `src/site/scene.ts` owns preset environment descriptions, allowed settings and the 240-character limit. `src/site/tool-config.ts` is the public cast/credit metadata shared by the interface and server; it contains no generation templates.
- The frontend control is in `src/site/tool.tsx`; labels live in `messages/common/en.json` and `zh.json`. The server snapshots the resolved generation parts when the job is created, so later changes do not rewrite existing job prompts.
- Photo mode requires `effectReferences.background`, uploaded through the existing image endpoint (JPG/PNG/WebP, up to 10 MB, at least 160 px on the shorter side). Other scenery modes reject an active background reference. The background follows the filled performer images in the model request, so its tag changes with cast size; it is excluded from cast checks and credit pricing. The browser stores its upload path for up to one day through reload and checkout. After expiry, upload it again. The reference clip's original soundtrack is still restored by compose.
- Provider reference-image limits: [Yir Kling 4.0 contract documentation](https://yir.ai/docs/models/klingai/kling-4-0). Five performer images plus one environment image fit the documented reference-mode limits; channel support and output quality still require a real upstream test.
- `pnpm --filter ./sites/tinydeskai-example check` includes scenery validation and legacy-prompt regression tests. These tests make no paid generation calls.

## Media is not in the repo

The reference clips, base clips, song and sample videos are cut from third-party footage and music, so they are not committed:

- `public/media/` (stage photos, sample clips including the dog version) is git-ignored.
- The R2 objects under `assets/tinydesk/` (`full-17s.mp4`, the clip used as reference, base and check original, and `song.m4a`) are keyed in `site.models.ts`.

Use footage and music you have the rights to, or AI-generated base clips, and keep the DMCA page and contact email (both included).

## Run it locally

1. `~/.config/shipwords/tinydeskai-example.dev.vars` from `.dev.vars.example` (Stripe test key, Google OAuth client with `http://localhost:<port>` as an origin), then `pnpm setup:worktree`, which prints the port.
2. Put your media in `public/media/` and your clips into local R2: `pnpm wrangler r2 object put tinydeskai-example-outputs/assets/tinydesk/<file> --local --file <file>`.
3. `pnpm db:migrate:local && pnpm dev`; `node ../../tools/stripe-listen.mjs` forwards Stripe test webhooks.

`UPSTREAM_MOCK=1` (the default in `.dev.vars.example`) runs the whole flow without calling the paid upstream: outputs are the reference clips. Set `UPSTREAM_MOCK_RESULT` / `UPSTREAM_MOCK_RESULT_SILENT` to R2 keys of a finished video to return that instead.

## Launch your own

1. Pick a domain; set `url` in `site.config.ts`, `routes` and `EMAIL_FROM` in `wrangler.jsonc`, `SUPPORT_EMAIL` in `src/site/legal.tsx`, and rename the resources.
2. `pnpm wrangler d1 create <name>`, put the id in `wrangler.jsonc`, `pnpm db:migrate:remote`; create the R2 bucket, upload the assets, add a lifecycle rule deleting `uploads/` after 2 days.
3. Secrets: `YIR_API_KEY`, Stripe keys and webhook secret, `BETTER_AUTH_SECRET`, `GUEST_COOKIE_SECRET`, Google OAuth, `APP_URL`. No `UPSTREAM_MOCK` in production.
4. Follow `docs/site-launch.md`; `pnpm check` blocks until the placeholders above are replaced. Then `pnpm run deploy`.
