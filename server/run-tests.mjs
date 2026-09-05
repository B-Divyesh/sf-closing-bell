import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.execPath,
  [
    '--test',
    ...process.argv.slice(2),
    'server/game.test.mjs',
    'server/release-identity.test.mjs',
    'server/server.test.mjs'
  ],
  { stdio: 'inherit' }
);

process.exitCode = result.status ?? 1;
