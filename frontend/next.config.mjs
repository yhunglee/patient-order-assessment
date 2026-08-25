import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextConfig = { turbopack: { root: projectRoot } };
export default nextConfig;
