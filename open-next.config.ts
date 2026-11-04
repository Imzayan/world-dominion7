/* World Dominion — OpenNext Cloudflare adapter config (host migration only).
   Game shell/API code untouched; the app has no ISR/cacheable server routes
   (all APIs are force-dynamic), so the default (no cache) is correct here. */
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
