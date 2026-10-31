/** Public scenery choices; model and generation instructions remain server-owned. */
export const SCENE_PRESETS = [
  {
    id: 'living-room',
    description: 'A warm, spacious living room with tasteful furnishings and soft natural window light',
  },
  {
    id: 'seaside',
    description: 'A sheltered seaside terrace at golden hour, with an ocean view beyond the performance area',
  },
  {
    id: 'rooftop',
    description: 'A spacious rooftop terrace at dusk, with a distant city skyline and warm practical lights',
  },
] as const;

export const MAX_SCENE_DESCRIPTION = 240;
export type SceneParameters = Readonly<Record<string, string>> & {
  sceneMode: 'original' | 'preset' | 'custom' | 'photo';
  scenePreset?: string;
  sceneDescription?: string;
};

/** Accept scenery data only; never accept caller-provided model, pricing or generation instructions. */
export function parseSceneParameters(
  input: unknown,
  referenceImages: Readonly<Record<string, string>> = {},
): SceneParameters | null {
  if (Object.keys(referenceImages).some((key) => key !== 'background')) return null;
  if (referenceImages.background && (input as SceneParameters | null)?.sceneMode !== 'photo') return null;
  if (input === undefined) return { sceneMode: 'original' };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const values = input as Record<string, unknown>;
  if (Object.keys(values).some((key) => !['sceneMode', 'scenePreset', 'sceneDescription'].includes(key)))
    return null;
  if (Object.keys(values).length === 0) return { sceneMode: 'original' };
  if (values.sceneMode === 'original') {
    if (values.scenePreset !== undefined || values.sceneDescription !== undefined) return null;
    return { sceneMode: 'original' };
  }
  if (values.sceneMode === 'preset') {
    if (values.sceneDescription !== undefined) return null;
    const preset = SCENE_PRESETS.find((option) => option.id === values.scenePreset);
    return preset
      ? { sceneMode: 'preset', scenePreset: preset.id, sceneDescription: preset.description }
      : null;
  }
  if (
    (values.sceneMode !== 'custom' && values.sceneMode !== 'photo') ||
    values.scenePreset !== undefined ||
    (values.sceneDescription !== undefined && typeof values.sceneDescription !== 'string')
  )
    return null;
  const photo = values.sceneMode === 'photo';
  if (photo && !referenceImages.background) return null;
  const description = ((values.sceneDescription as string | undefined) ?? '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ');
  if ((!photo && !description) || description.length > MAX_SCENE_DESCRIPTION) return null;
  const hiddenControls = Array.from(description).some((character) => {
    const code = character.codePointAt(0)!;
    return (
      code < 32 || code === 127 || (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069)
    );
  });
  if (hiddenControls || /[<>@`]/.test(description) || /https?:\/\/|www\./i.test(description)) return null;
  return { sceneMode: photo ? 'photo' : 'custom', sceneDescription: description };
}

/** Build the small request shape; preset descriptions are resolved by the server, not sent by the browser. */
export function sceneParametersForSelection(
  choice: string,
  description: string,
  background?: string,
): Record<string, string> | null {
  const input: Record<string, string> =
    choice === 'original'
      ? { sceneMode: 'original' }
      : choice === 'custom' || choice === 'photo'
        ? { sceneMode: choice, sceneDescription: description }
        : { sceneMode: 'preset', scenePreset: choice };
  return parseSceneParameters(input, choice === 'photo' && background ? { background } : {}) ? input : null;
}

export interface ScenePhoto {
  path: string;
  uploadedAt: number;
}

/** Uploads are temporary; do not restore stale paths or arbitrary preview URLs from session storage. */
export function restoreScenePhoto(value: unknown, now = Date.now()): ScenePhoto | null {
  if (!value || typeof value !== 'object') return null;
  const { path, uploadedAt } = value as Partial<ScenePhoto>;
  return typeof path === 'string' &&
    /^\/files\/uploads\/up_[a-z0-9]+\.(png|jpg|webp)$/.test(path) &&
    typeof uploadedAt === 'number' &&
    Number.isFinite(uploadedAt) &&
    uploadedAt <= now &&
    now - uploadedAt < 24 * 60 * 60_000
    ? { path, uploadedAt }
    : null;
}
