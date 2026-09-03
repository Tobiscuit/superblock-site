# superblock.dev

Public architecture site for a self-hosted Kubernetes platform.

Static Astro build deployed to Cloudflare Workers Static Assets. No adapter, no
server, no JavaScript shipped to the browser — the pages are diagrams and prose,
so there is nothing to render at request time.

## Content

Diagrams are SVGs rendered from D2 sources in a separate repository. They are
copied in and **sanitised at copy time**, not at source: the private reference
site keeps real addresses because they are useful there, and only the public
copy is scrubbed. CI re-checks this on every build and fails rather than publish
an internal address.

Metadata lives in `src/data/diagrams.json`, validated by a Zod schema in
`src/content.config.ts`. The `status` field is an enum so a diagram cannot ship
labelled `current` when it was only ever designed.

## Local

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run deploy   # build + wrangler deploy
```
