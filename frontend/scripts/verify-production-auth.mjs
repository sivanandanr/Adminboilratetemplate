import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../dist/smartiam-frontend/browser/', import.meta.url);
const forbidden = ['Demo-only!23', 'admin@example.test', 'reader@example.test', '__SMARTIAM_MOCK_CONFIG__', 'Remove showcase permission', 'Protected development-only previews', 'Protected development examples. No changes are persisted.', 'Demo values accepted locally; nothing was persisted.'];
let files = 0;
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (entry.name.endsWith('.js')) {
      files++;
      const text = await readFile(path, 'utf8');
      if (forbidden.some((marker) => text.includes(marker))) throw new Error(`Development auth code found in production asset: ${entry.name}`);
    }
  }
}
await scan(root.pathname.replace(/^\/([A-Za-z]:)/, '$1'));
if (!files) throw new Error('Build production assets before running this check.');
console.log(`Verified ${files} production JavaScript assets: no development auth credentials, config hook or showcase implementations.`);
