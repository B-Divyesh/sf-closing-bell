import { execFileSync } from 'node:child_process';
import { defineConfig } from 'vite';

function buildSha() {
  if (process.env.VITE_BUILD_SHA) return process.env.VITE_BUILD_SHA;
  try { return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding:'utf8' }).trim(); }
  catch { return 'dev'; }
}

export default defineConfig({
  build: { target: 'es2022', sourcemap: false },
  server: { host: '127.0.0.1' },
  define: { __BUILD_SHA__: JSON.stringify(buildSha()) }
});
