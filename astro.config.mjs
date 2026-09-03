import { defineConfig } from 'astro/config';

// Static output is Astro's default and what we want: this site is diagrams and
// prose, with no request-time work to do. That means no @astrojs/cloudflare
// adapter and no Worker script - `assets` in wrangler.jsonc serves dist/
// straight from Cloudflare's edge.
export default defineConfig({
  site: 'https://superblock.dev',
  build: { format: 'directory' },
});
