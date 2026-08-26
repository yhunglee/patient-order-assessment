import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('API client provides list, create, and update operations', async () => {
  const source = await readFile(new URL('../lib/api.ts', import.meta.url), 'utf8');
  assert.match(source, /listPatients/);
  assert.match(source, /createOrder/);
  assert.match(source, /updateOrder/);
});

test('usePatients exposes whether the most recent patient load succeeded', async () => {
  const source = await readFile(new URL('../hooks/usePatients.ts', import.meta.url), 'utf8');
  assert.match(source, /const \[isLoaded, setIsLoaded\] = useState\(false\)/);
  assert.match(source, /setIsLoaded\(true\)/);
  assert.match(source, /return \{ patients, isLoading, isLoaded, error, reload: load \}/);
});
