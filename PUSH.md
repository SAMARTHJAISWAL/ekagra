# Push this to GitHub

This folder is the complete site, already a git repo with all eleven
commits and the remote pointing at your repo. Nothing to install.

## 1. Open a terminal here

```bash
cd ~/Downloads/ekagra
git log --oneline | head -3
```

Expect "Back to the custom player, simpler audio filenames" at the top. If
you get *not a git repository*, you're outside the folder.

## 2. (Optional but this is the moment) add the audio

Copy 22 files into `audio/`, named by position:

```
audio/01.mp3   The Burning Ghat
audio/02.mp3   Shankara
audio/03.mp3   Kautilya (The Echo Project)
...
audio/22.mp3   Mera Satguru Pyaara
```

Full order is in `playlist.js`. Then:

```bash
git add -A
git commit -m "Add audio"
```

Skip this and the site still deploys — it just says "no audio file for
this one yet" until the files arrive.

## 3. Push

```bash
git push --force -u origin main
```

**`--force` is deliberate.** This history and the one currently on GitHub
were written separately, so a normal push is rejected. Force makes GitHub
match this folder exactly. Safe here — nothing else depends on that repo.

Username `SAMARTHJAISWAL`, and a personal access token as the password
(github.com/settings/tokens/new, tick `public_repo`). Nothing shows on
screen while you paste it — that's normal.

Vercel redeploys on its own, about thirty seconds. No dashboard needed.

## Afterwards

Every later change is just:

```bash
git add -A && git commit -m "what changed" && git push
```

(no `--force` from then on)
