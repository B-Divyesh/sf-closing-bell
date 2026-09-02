import { verifyRealtimeIdentity } from '../server/release-identity.mjs';

const expectedBuild = process.env.EXPECTED_BUILD_SHA;
const url = process.env.REALTIME_URL || 'https://closing-bell-realtime.sociobot.in/health';

try {
  const identity = await verifyRealtimeIdentity({ expectedBuild, url });
  console.log(`Verified ${identity.service} build ${identity.build} at ${url}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
