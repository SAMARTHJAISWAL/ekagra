# Getting it live on Vercel

This folder is already a git repo with one commit, and `vercel.json` is set up
(long cache on media, no cache on html/js/css). Nothing to build.

## 1. Push to GitHub

Create an empty repo at https://github.com/new — no README, no .gitignore,
nothing, or the first push will conflict. Then, in this folder:

```bash
git remote add origin https://github.com/<you>/ekagra.git
git push -u origin main
```

With the `gh` CLI it's one line instead:

```bash
gh repo create ekagra --public --source=. --push
```

## 2. Import into Vercel

1. https://vercel.com/new → **Import Git Repository** → pick the repo.
2. Framework Preset: **Other**. Leave build command and output directory empty
   — it's a static folder.
3. **Deploy**.

Live at `https://<project>.vercel.app` in about thirty seconds. Every
`git push` after this redeploys on its own.

## 3. A custom domain (optional)

Vercel project → Settings → Domains → add the domain, then point it as Vercel
instructs — an `A` record to `76.76.21.21` for a root domain, or a `CNAME` to
`cname.vercel-dns.com` for a subdomain. HTTPS is issued automatically.

## Checks worth doing once it's up

- Open it on a phone. The background should crop to the lamp and the boy, with
  the wordmark drawn live over it — not letterboxed.
- Confirm the video actually plays and doesn't just sit on the poster frame.
  iOS needs `muted` + `playsinline`; both are set, but worth seeing.
- Watch the network tab: the `.webm` (1.7 MB) should be what loads, with the
  `.mp4` (4.0 MB) only on Safari.
- Share the URL into a chat to see the OG preview card pull `media/poster.jpg`.
