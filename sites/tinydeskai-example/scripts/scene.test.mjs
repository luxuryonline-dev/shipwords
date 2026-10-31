import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { customScenePrompt, originalScenePrompt, photoScenePrompt } from '../src/site/prompts.server.ts';
import {
  MAX_SCENE_DESCRIPTION,
  parseSceneParameters,
  restoreScenePhoto,
  SCENE_PRESETS,
  sceneParametersForSelection,
} from '../src/site/scene.ts';

// Captured from the pre-change editPrompt implementation, not from the new template.
const legacyPrompts = [
  { images: { lead: '@image1' }, sha256: 'a8dfc713b0afe50250076359f530d94839cfc1ebe2ee69fd05de7fd5bc65b374' },
  {
    images: { lead: '@image1', sax: '@image2', keys: '@image3', backLeft: '@image4', backRight: '@image5' },
    sha256: '303a23a67dc9ce7276f1cb4948e4527de5ec70b58f2b4aef9a6f5ae9e257a8e5',
  },
  {
    images: { keys: '@image1', backLeft: '@image2' },
    sha256: 'b54ef414a6e9f083a81ead5af02087541d976967c59951194e6f1e07682892bc',
  },
];

test('original scenery preserves the pre-change prompt for single, full and partial casts', () => {
  for (const { images, sha256 } of legacyPrompts) {
    assert.equal(createHash('sha256').update(originalScenePrompt(images)).digest('hex'), sha256);
  }
});

test('old requests default to original scenery; explicit original mode ignores no hidden options', () => {
  for (const value of [undefined, {}, { sceneMode: 'original' }])
    assert.deepEqual(parseSceneParameters(value), { sceneMode: 'original' });
  assert.equal(parseSceneParameters({ sceneMode: 'original', sceneDescription: 'rooftop' }), null);
});

test('preset descriptions are resolved server-side and cannot be replaced by the request', () => {
  for (const preset of SCENE_PRESETS) {
    assert.deepEqual(parseSceneParameters({ sceneMode: 'preset', scenePreset: preset.id }), {
      sceneMode: 'preset',
      scenePreset: preset.id,
      sceneDescription: preset.description,
    });
  }
  assert.equal(parseSceneParameters({ sceneMode: 'preset', scenePreset: 'unknown' }), null);
  assert.equal(
    parseSceneParameters({ sceneMode: 'preset', scenePreset: 'rooftop', sceneDescription: 'different' }),
    null,
  );
});

test('custom scenery accepts short English and Chinese descriptions and normalizes whitespace', () => {
  assert.deepEqual(
    parseSceneParameters({ sceneMode: 'custom', sceneDescription: '  A cozy\n jazz lounge  ' }),
    {
      sceneMode: 'custom',
      sceneDescription: 'A cozy jazz lounge',
    },
  );
  assert.equal(
    parseSceneParameters({ sceneMode: 'custom', sceneDescription: '温暖的客厅，窗外是黄昏的海边' })
      ?.sceneMode,
    'custom',
  );
});

test('invalid shapes, modes, empty or oversized descriptions are rejected', () => {
  for (const input of [
    null,
    [],
    'custom',
    3,
    { sceneMode: 'image' },
    { sceneMode: 'custom' },
    { sceneMode: 'custom', sceneDescription: ' ' },
    { sceneMode: 'custom', sceneDescription: 'x'.repeat(MAX_SCENE_DESCRIPTION + 1) },
    { sceneMode: 'custom', sceneDescription: 'room', scenePreset: 'rooftop' },
  ])
    assert.equal(parseSceneParameters(input), null);
});

test('scene settings cannot supply vendor parameters, references, prices or a replacement prompt', () => {
  for (const key of [
    'duration',
    'resolution',
    'credits',
    'max_cost',
    'model',
    'references',
    'prompt',
    '__proto__',
  ]) {
    const input = JSON.parse(
      JSON.stringify({ sceneMode: 'custom', sceneDescription: 'room', [key]: 'override' }),
    );
    assert.equal(parseSceneParameters(input), null);
  }
});

test('reference tags, links, hidden controls and equivalent full-width delimiters are rejected', () => {
  for (const sceneDescription of [
    '@image_1',
    '<<<video_1>>>',
    'https://example.com/scene',
    'www.example.com',
    'room\u0000outside',
    'room\u202eoutside',
    '＠video_1',
    '`instructions`',
  ])
    assert.equal(parseSceneParameters({ sceneMode: 'custom', sceneDescription }), null);
});

test('browser request construction keeps inactive text out of original and preset modes', () => {
  assert.deepEqual(sceneParametersForSelection('original', 'old custom text'), { sceneMode: 'original' });
  assert.deepEqual(sceneParametersForSelection('rooftop', 'old custom text'), {
    sceneMode: 'preset',
    scenePreset: 'rooftop',
  });
  assert.equal(sceneParametersForSelection('custom', ''), null);
  assert.equal(sceneParametersForSelection('unknown', 'room'), null);
});

test('custom template quotes scenery as data and keeps identity, equipment, timing and audio constraints', () => {
  const description = 'A "cozy" jazz lounge';
  const prompt = customScenePrompt({ lead: '@image1', sax: '@image2' }, description);
  assert.ok(prompt.includes(JSON.stringify(description)));
  assert.ok(prompt.includes('person or animal in @image_1'));
  assert.ok(prompt.includes('person or animal in @image_2'));
  assert.ok(prompt.includes('one coherent location throughout all four shots'));
  assert.ok(prompt.includes('Preserve hand-to-instrument contact'));
  assert.ok(prompt.includes('All unselected performers retain their original identities'));
  assert.ok(
    prompt.endsWith('Keep the audio exactly identical to the original video. Do not add any new sounds.'),
  );
  assert.ok(!prompt.includes('Keep everything else unchanged: the room, the shelves'));
});

test('photo scenery requires a separately bound background and permits optional scene notes', () => {
  const background = { background: 'https://site/files/uploads/up_bg.jpg' };
  assert.equal(parseSceneParameters({ sceneMode: 'photo' }), null);
  assert.deepEqual(parseSceneParameters({ sceneMode: 'photo' }, background), {
    sceneMode: 'photo',
    sceneDescription: '',
  });
  assert.deepEqual(
    parseSceneParameters({ sceneMode: 'photo', sceneDescription: '  golden\n hour  ' }, background),
    { sceneMode: 'photo', sceneDescription: 'golden hour' },
  );
  for (const input of [
    undefined,
    {},
    { sceneMode: 'original' },
    { sceneMode: 'custom', sceneDescription: 'room' },
    { sceneMode: 'preset', scenePreset: 'rooftop' },
    { sceneMode: 'photo', scenePreset: 'rooftop' },
    { sceneMode: 'photo', sceneDescription: null },
    { sceneMode: 'photo', sceneDescription: '@image_1' },
    { sceneMode: { toString: null } },
  ])
    assert.equal(parseSceneParameters(input, background), null);
  assert.equal(parseSceneParameters({ sceneMode: 'photo' }, { unknown: 'image' }), null);
});

test('photo selection keeps the image separate from parameters and ignores it in inactive modes', () => {
  const path = '/files/uploads/up_bg.jpg';
  assert.equal(sceneParametersForSelection('photo', ''), null);
  assert.deepEqual(sceneParametersForSelection('photo', '', path), {
    sceneMode: 'photo',
    sceneDescription: '',
  });
  assert.deepEqual(sceneParametersForSelection('original', 'old notes', path), { sceneMode: 'original' });
  assert.deepEqual(sceneParametersForSelection('seaside', 'old notes', path), {
    sceneMode: 'preset',
    scenePreset: 'seaside',
  });
});

test('restoring a background accepts only recent site upload paths', () => {
  const now = 1_800_000_000_000;
  const photo = { path: '/files/uploads/up_abc123.webp', uploadedAt: now - 1000 };
  assert.deepEqual(restoreScenePhoto(photo, now), photo);
  for (const value of [
    null,
    [],
    'photo',
    { ...photo, path: 'https://evil.example/photo.jpg' },
    { ...photo, path: '/files/uploads/../assets/photo.jpg' },
    { ...photo, path: 'data:image/png;base64,anything' },
    { ...photo, path: '/files/uploads/up_abc123.jpg?url=external' },
    { ...photo, uploadedAt: now + 1 },
    { ...photo, uploadedAt: now - 24 * 60 * 60_000 },
    { ...photo, uploadedAt: Number.NaN },
    { path: photo.path },
  ])
    assert.equal(restoreScenePhoto(value, now), null);
});

test('photo template distinguishes environment and identities for single and full casts', () => {
  for (const [images, background] of [
    [{ lead: '@image1' }, '@image2'],
    [
      { lead: '@image1', sax: '@image2', keys: '@image3', backLeft: '@image4', backRight: '@image5' },
      '@image6',
    ],
  ]) {
    const prompt = photoScenePrompt(images, background, 'A "warm" room');
    const tag = background.replace('@image', '@image_');
    assert.ok(prompt.includes(`Use ${tag} only as the environment reference`));
    assert.ok(!prompt.includes(`person or animal in ${tag}.`));
    assert.ok(prompt.includes('Any people in that photograph are not cast members'));
    assert.ok(prompt.includes('Preserve hand-to-instrument contact'));
    assert.ok(prompt.includes('one coherent location throughout all four shots'));
    assert.ok(prompt.includes(JSON.stringify('A "warm" room')));
    assert.ok(
      prompt.endsWith('Keep the audio exactly identical to the original video. Do not add any new sounds.'),
    );
  }
});
