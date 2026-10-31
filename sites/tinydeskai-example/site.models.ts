import { defineModels } from '@shipwords/jobs/models';
import { customScenePrompt, originalScenePrompt } from './src/site/prompts.server';
import { parseSceneParameters } from './src/site/scene';
import { TOOL_MODEL } from './src/site/tool-config';

// One effect: 1.375–19.063 s of the viral TikTok Tiny Desk clip (skips the opening side view of the singer; 17.688 s, 4 shots). Same price for 1–5 people.
// The whole clip renders in one run: Kling 4.0 edit mode (Edit @video_1) replaces every person who has a photo entirely (face, hair and clothes from the photo);
// empty seats keep the original coaches. Tested: all 5 swapped 5/5, scene and cuts match the original, $3.06 at 720p, about 6 minutes.
// An earlier per-shot Seedance 2.0 mini pipeline (outfit photo edits, eye masks, 4 segments, a check per segment) was structurally fragile and was dropped.
// Assets live in R2 under assets/tinydesk/: full-17s.mp4 is that span of the viral clip as is (720×1280, 24 fps, with the song),
// used as the reference video, the original for the face check and the base clip.

const CLIP = 'assets/tinydesk/full-17s.mp4';

export default defineModels([
  {
    id: TOOL_MODEL.id,
    name: 'Tiny Desk video',
    kind: 'video',
    upstream: 'yir',
    upstreamModel: 'klingai/kling-4.0',
    credits: TOOL_MODEL.credits,
    guest: false,
    allowedParameters: [],
    maxReferences: 0,
    // Quoted at $3.06 (billed as 18 s), capped at 3.40. A missed swap is not rerun: the job fails with a full refund.
    maxCost: '3.40',
    // Usually about 8 minutes (6 to generate, 2 for the face check and compose), with room for upstream queues.
    timeoutMinutes: 30,
    effect: {
      parseParameters: parseSceneParameters,
      slots: TOOL_MODEL.slots,
      segments: [
        {
          id: 'full',
          referenceVideo: CLIP,
          slots: ['lead', 'sax', 'keys', 'backLeft', 'backRight'],
          prompt: (images, settings = { sceneMode: 'original' }) =>
            settings.sceneMode === 'original'
              ? originalScenePrompt(images)
              : customScenePrompt(images, settings.sceneDescription!),
          // duration must be a whole number: the 17.688 s reference asks for 18 s, which comes back as 18.04 s with each cut 1–3 frames late; compose re-aligns shot by shot.
          // generate_audio can only be on with Yir; compose swaps the original song back in.
          parameters: { duration: 18, resolution: '720p', aspect_ratio: 'auto' },
          maxCost: '3.40',
          target: 17.688,
          cuts: [5.333, 11.625, 15.0],
          base: CLIP,
          // Original face centers, taken at the start of each one's shot (band 0 s, lead 5.4 s, sax 11.67 s).
          // Threshold 0.45: swapped faces score at most 0.28; the original person present scores 0.78–0.94, and a 2-second leftover side view of the original lead 0.52.
          check: {
            original: CLIP,
            faces: {
              keys: [0.395, 0.496, 0],
              backLeft: [0.073, 0.204, 0],
              backRight: [0.859, 0.224, 0],
              lead: [0.793, 0.323, 5.4],
              sax: [0.186, 0.287, 11.67],
            },
            maxSimilarity: 0.45,
          },
        },
      ],
      // Output: the original song from 1.375–19.063 s of the viral clip, 720×1280, 24 fps.
      compose: {
        audio: 'assets/tinydesk/song.m4a',
        // song.m4a is extracted from full-17s.mp4, which already starts at the selected cut.
        audioStart: 0,
        audioDuration: 17.688,
        width: 720,
        height: 1280,
        fps: 24,
      },
    },
  },
]);
