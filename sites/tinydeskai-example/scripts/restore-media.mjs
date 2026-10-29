import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

// Keep the original public/media layout while restoring ignored media in clean CI checkouts.
export async function restoreMedia({ manifest, publicDir, fetchFile = fetch }) {
  const base = new URL(manifest.baseUrl);
  if (base.protocol !== 'https:' || base.search || base.hash) throw new Error('Invalid media base URL');
  const files = manifest.files;
  if (!Array.isArray(files) || files.length === 0) throw new Error('Empty media manifest');
  const seen = new Set();
  for (const entry of files) {
    if (
      !/^media\/(?:dogs\/)?[a-z0-9][a-z0-9-]*\.(jpg|mp4)$/.test(entry.path) ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) ||
      !Number.isSafeInteger(entry.bytes) ||
      entry.bytes <= 0 ||
      seen.has(entry.path)
    )
      throw new Error(`Invalid media entry: ${entry.path}`);
    seen.add(entry.path);
  }

  let next = 0;
  let cached = 0;
  let downloaded = 0;
  const errors = [];
  await Promise.all(
    Array.from({ length: Math.min(4, files.length) }, async () => {
      while (next < files.length) {
        const entry = files[next++];
        const destination = path.join(publicDir, entry.path);
        const temporary = `${destination}.download-${randomUUID()}`;
        try {
          const current = await readFile(destination).catch((error) => {
            if (error.code === 'ENOENT') return null;
            throw error;
          });
          if (current?.length === entry.bytes && digest(current) === entry.sha256) {
            cached++;
            continue;
          }
          const response = await fetchFile(new URL(entry.path, `${base.href.replace(/\/$/, '')}/`), {
            signal: AbortSignal.timeout(120_000),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const bytes = Buffer.from(await response.arrayBuffer());
          if (bytes.length !== entry.bytes || digest(bytes) !== entry.sha256) {
            throw new Error('Size or SHA-256 mismatch');
          }
          await mkdir(path.dirname(destination), { recursive: true });
          await writeFile(temporary, bytes);
          await rename(temporary, destination);
          downloaded++;
        } catch (error) {
          await unlink(temporary).catch(() => undefined);
          errors.push(`${entry.path}: ${error.message}`);
        }
      }
    }),
  );
  if (errors.length) throw new Error(`Media restoration failed:\n${errors.join('\n')}`);
  return { cached, downloaded, total: files.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const siteDir = fileURLToPath(new URL('../', import.meta.url));
  try {
    const manifest = JSON.parse(await readFile(path.join(siteDir, 'media-manifest.json'), 'utf8'));
    const result = await restoreMedia({ manifest, publicDir: path.join(siteDir, 'public') });
    console.log(
      `Media verified: ${result.total} files (${result.cached} cached, ${result.downloaded} downloaded)`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
