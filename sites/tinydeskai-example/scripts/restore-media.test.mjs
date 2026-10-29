import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { restoreMedia } from './restore-media.mjs';

const bytes = Buffer.from('verified media fixture');
const manifest = {
  baseUrl: 'https://media.example.com',
  files: [
    {
      path: 'media/stage.jpg',
      bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
  ],
};

async function temporary(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'tinydesk-media-test-'));
  t.after(async () => {
    if (
      !path.resolve(dir).startsWith(`${path.resolve(tmpdir())}${path.sep}`) ||
      !path.basename(dir).startsWith('tinydesk-media-test-')
    ) {
      throw new Error('Unexpected test cleanup path');
    }
    await rm(dir, { recursive: true, force: true });
  });
  return dir;
}

test('a clean checkout restores media and verified cache needs no network', async (t) => {
  const publicDir = await temporary(t);
  const result = await restoreMedia({ manifest, publicDir, fetchFile: async () => new Response(bytes) });
  assert.equal(result.downloaded, 1);
  assert.deepEqual(await readFile(path.join(publicDir, 'media/stage.jpg')), bytes);
  const cached = await restoreMedia({
    manifest,
    publicDir,
    fetchFile: () => {
      throw new Error('Unexpected network request');
    },
  });
  assert.equal(cached.cached, 1);
});

test('a corrupt remote file fails the build without replacing an existing file', async (t) => {
  const publicDir = await temporary(t);
  await mkdir(path.join(publicDir, 'media'));
  const existing = Buffer.from('previous content');
  await writeFile(path.join(publicDir, 'media/stage.jpg'), existing);
  await assert.rejects(
    restoreMedia({ manifest, publicDir, fetchFile: async () => new Response('corrupt') }),
    /SHA-256 mismatch/,
  );
  assert.deepEqual(await readFile(path.join(publicDir, 'media/stage.jpg')), existing);
});

test('manifest paths cannot write outside public media', async (t) => {
  const publicDir = await temporary(t);
  const unsafe = { ...manifest, files: [{ ...manifest.files[0], path: '../secret.txt' }] };
  await assert.rejects(
    restoreMedia({
      manifest: unsafe,
      publicDir,
      fetchFile: () => {
        throw new Error('Unexpected network request');
      },
    }),
    /Invalid media entry/,
  );
});
