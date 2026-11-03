# एकाग्र / Ekāgra

A single-page listening room: an illustrated loop plays behind everything, a
glass player sits at the bottom, a clock that doubles as a focus timer sits up
top. Static files only — no build step, no framework, no dependencies.

**Live:** https://ekagra-mocha.vercel.app

```
index.html            markup + social preview tags
styles.css            all styling
app.js                clock/timer, background, idle fade, both players — CONFIG at the top
playlist.js           the tracks (both modes read this)
media/                background loop (webm + mp4), poster frame, og.jpg
art/                  six square crops of the illustration, used as cover art
icons/, favicon.ico   favicons and the home-screen icon
manifest.webmanifest  "Add to Home Screen" metadata
audio/                your audio files, for files mode
vercel.json           cache + security headers
```

## Run it

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Double-clicking `index.html` mostly works too, but the Spotify embed is happier
served over http.

Deploying is `git push` — Vercel redeploys `main` on its own. See
[DEPLOY.md](DEPLOY.md) for a fresh setup.

## Using it

- **Clock → focus timer.** Click the clock to start a 25-minute session; it
  counts down with a breathing amber dot, chimes softly at the end, and shows
  "done" for a few seconds. Click again to cancel. Survives a reload.
- **Remembers your place.** The last track you played is where it picks up
  next visit.
- **Idle fade.** After four seconds of stillness the clock, links and player
  dim so the room is the room. Any movement brings them back. They never fade
  while you're hovering the player or using the Spotify embed.
- **Keyboard:** `space` play/pause · `←` `→` seek 5s · `shift`+`←` `→`
  previous/next track · `m` mute (files mode).
- **URL options:** `?shuffle=1` randomises the order, `?mode=files` or
  `?mode=spotify` overrides `CONFIG.mode`.

## Two ways to make sound

`CONFIG.mode` in `app.js` picks one.

### `"spotify"` — the default

One track at a time through Spotify's official IFrame API, with Ekāgra's own
previous/next buttons either side and auto-advance at the end of each track.
Spotify serves full tracks to listeners who are logged in and 30-second
previews to everyone else. Nothing to host, nothing to license.

If the API script can't load (blocked, slow network), the plain playlist embed
takes over after 8 seconds. Set `playerStyle: "playlist"` to always use that.

### `"files"` — the custom player

The glass pill — your typography, progress bar and controls — playing audio
you host in `/audio`. Files are named by position, matching `playlist.js`:

```
audio/01.mp3   The Burning Ghat
audio/02.mp3   Shankara
...
audio/22.mp3   Mera Satguru Pyaara
```

Or edit the `src` values to match your files. Keep the audio compressed —
128–192 kbps is plenty. Lock-screen and headphone controls (including
seeking) work through the Media Session API.

The catch is rights: publishing a page that streams commercial recordings you
host yourself is a public performance and needs a licence. The embed exists so
you don't need one, which is why it's the default.

## Configure

Everything tweakable lives in the `CONFIG` block at the top of `app.js`:

| key | what it does |
|---|---|
| `mode` | `"spotify"` or `"files"` — see above |
| `spotifyEmbedId` | playlist id for the fallback playlist embed |
| `playerStyle` | `"tracks"` (one at a time) or `"playlist"` (Spotify's playlist card) |
| `spotify`, `ytMusic` | URLs for the top-right buttons. Left empty, they render dimmed and inert. |
| `creditText`, `creditHref` | the line under the player. Empty text removes it. |
| `focusMinutes` | length of a focus session. `0` makes the clock just a clock. |
| `presenceEndpoint` | see below |
| `startVolume` | 0–1, files mode |

To change the playlist, edit `playlist.js`: `id` is the Spotify track id (the
bit after `/track/` in a share link), `src` and `art` are for files mode.

## Making "N online" real

With `presenceEndpoint` empty the badge stays hidden. Point it at anything that
answers `GET` with `{"count": 12}` and it polls every 20 seconds while the tab
is visible. A Cloudflare Worker with KV, for example:

```js
export default {
  async fetch(req, env) {
    const now = Date.now();
    const ip = req.headers.get("cf-connecting-ip") ?? "anon";
    await env.KV.put(`seen:${ip}`, String(now), { expirationTtl: 60 });
    const { keys } = await env.KV.list({ prefix: "seen:" });
    return Response.json({ count: keys.length },
      { headers: { "access-control-allow-origin": "*" } });
  },
};
```

## The background

`media/ekagra-desk-bg.webm` (1.7 MB) is served first, `.mp4` (4.0 MB) is the
fallback. It's a 12-second seamless loop: the lamp breathes, the monitor drifts,
the streetlamp pulses, dust floats through the lamplight. `poster.jpg` shows on
first paint, behind the letterbox, and in place of the loop for visitors who
ask their OS for reduced motion.

Media files are cached for a week, not forever, so replacing one shows up
without renaming it. Swapping in a different loop means replacing the webm,
mp4 and poster. If the new artwork has no wordmark painted into it, delete the
`@media (orientation:portrait)` block in `styles.css` and the portrait branch
of `fitBackground()` in `app.js`, and let `.bg` cover everywhere — the crop
logic exists only to keep the painted title from being sliced in half on
phones.

## Layout notes

- **Landscape** — the frame covers the viewport; the painted wordmark is the title.
- **Portrait** (phones) — crops to the left column of the room (lamp, framed
  print, the boy), which contains none of the painted title, and the live
  `<h1>` carries the name.

Video autoplay needs `muted` + `playsinline`; both are set. Audio can't autoplay
anywhere, by design — the first play always costs one tap.
