import { execFileSync } from 'node:child_process';
import { defineConfig, type Plugin } from 'vite';

function buildSha() {
  if (process.env.VITE_BUILD_SHA) return process.env.VITE_BUILD_SHA;
  try { return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding:'utf8' }).trim(); }
  catch { return 'dev'; }
}

function static404BuildLabel(build:string):Plugin {
  const script = `document.getElementById('build-id')?.replaceChildren('Build ${build}');`;
  return {
    name: 'closing-bell-static-404-build-label',
    configureServer(server) {
      server.middlewares.use('/404-build.js', (_request, response) => {
        response.setHeader('Content-Type','application/javascript; charset=utf-8');
        response.end(script);
      });
    },
    generateBundle() {
      this.emitFile({type:'asset',fileName:'404-build.js',source:script});
    }
  };
}

const currentBuildSha = buildSha();

export default defineConfig({
  build: { target: 'es2022', sourcemap: false },
  server: { host: '127.0.0.1' },
  plugins: [static404BuildLabel(currentBuildSha)],
  define: { __BUILD_SHA__: JSON.stringify(currentBuildSha) }
});
