import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyRealtimeIdentity } from './release-identity.mjs';

const candidate = '020b0f1af4bea51ed0daafb14527361406b5c2da';
const staleBuild = '165a64c2158821296bd796efc53eec52ce0f4cd9';

function health(build, cacheControl = 'no-store') {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'cache-control': cacheControl }),
    json: async () => ({ ok: true, service: 'closing-bell-realtime', build })
  };
}

test('release identity accepts the requested realtime candidate build', async () => {
  const identity = await verifyRealtimeIdentity({
    expectedBuild: candidate,
    url: 'https://example.test/health',
    fetchImpl: async () => health(candidate)
  });
  assert.equal(identity.build, candidate);
});

test('regression: release identity rejects the verifier\'s stale realtime build', async () => {
  await assert.rejects(
    verifyRealtimeIdentity({
      expectedBuild: candidate,
      url: 'https://example.test/health',
      fetchImpl: async () => health(staleBuild)
    }),
    new RegExp(`expected ${candidate}, received ${staleBuild}`)
  );
});

test('release identity requires no-store health responses', async () => {
  await assert.rejects(
    verifyRealtimeIdentity({ expectedBuild: candidate, fetchImpl: async () => health(candidate, 'max-age=60') }),
    /Cache-Control: no-store/
  );
});
