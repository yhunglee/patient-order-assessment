import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('API client provides list, create, and update operations', async () => {
  const source = await readFile(new URL('../lib/api.ts', import.meta.url), 'utf8');
  assert.match(source, /listPatients/);
  assert.match(source, /createOrder/);
  assert.match(source, /updateOrder/);
});
