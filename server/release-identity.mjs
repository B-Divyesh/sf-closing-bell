const DEFAULT_URL = 'https://closing-bell-realtime.sociobot.in/health';

export function assertRealtimeIdentity(response, expectedBuild) {
  if (!expectedBuild || typeof expectedBuild !== 'string') {
    throw new Error('EXPECTED_BUILD_SHA is required to verify the realtime release.');
  }
  if (!response || response.ok !== true || response.service !== 'closing-bell-realtime') {
    throw new Error('Realtime health response is not a Closing Bell service identity.');
  }
  if (response.build !== expectedBuild) {
    throw new Error(`Realtime release mismatch: expected ${expectedBuild}, received ${String(response.build)}.`);
  }
  return response;
}

export async function verifyRealtimeIdentity({
  expectedBuild,
  url = DEFAULT_URL,
  fetchImpl = fetch
} = {}) {
  const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Realtime health request failed with HTTP ${response.status}.`);
  const cacheControl = response.headers?.get?.('cache-control') || '';
  if (!/no-store/i.test(cacheControl)) throw new Error('Realtime health response must use Cache-Control: no-store.');
  return assertRealtimeIdentity(await response.json(), expectedBuild);
}
