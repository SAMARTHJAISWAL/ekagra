# Deploying

The site is live on Vercel at https://ekagra-mocha.vercel.app, connected to
`github.com/SAMARTHJAISWAL/ekagra`. Every push to `main` redeploys in about
thirty seconds:

```bash
git add -A && git commit -m "what changed" && git push
```

Never `--force` — the GitHub copy is the source of truth, and edits made in the
GitHub web editor live only there until you `git pull`.

## Setting it up from scratch

1. https://vercel.com/new → **Import Git Repository** → pick the repo.
2. Framework Preset: **Other**. Leave build command and output directory empty
   — it's a static folder.
3. **Deploy**.

`vercel.json` sets the cache headers (a week on media, always-revalidate on
html/js/css) and a handful of security headers.

## A custom domain (optional)

Vercel project → Settings → Domains → add the domain, then point DNS as Vercel
instructs. HTTPS is issued automatically. Then update the absolute URLs in
`index.html` (`og:url`, `og:image`, `twitter:image`, `canonical`) — link
previews ignore relative paths.

## Checks worth doing after a change

- Open it on a phone. The background should crop to the lamp and the boy, with
  the wordmark drawn live over it, and both arrows either side of the Spotify
  card should be on screen.
- Confirm the video actually plays and doesn't just sit on the poster frame.
- Watch the network tab: the `.webm` (1.7 MB) should be what loads, with the
  `.mp4` (4.0 MB) only on Safari.
- Share the URL into a chat to see the preview card pull `media/og.jpg`.
