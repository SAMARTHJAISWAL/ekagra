एकाग्र / Ekāgra

A single-page listening room: the illustrated loop plays behind everything, a glass player sits at the bottom, clock and links up top. Static files only — no build step, no framework, no dependencies.

index.html      markup
styles.css      all styling
app.js          player + clock + presence, CONFIG block at the top
playlist.js     your tracks (edit this)
media/          the background loop (webm + mp4) and its poster frame
art/            cover art (three crops of the illustration, as placeholders)
audio/          put your audio files here


Run it

Double-clicking index.html works. To be closer to production:

python3 -m http.server 8000     # then open http://localhost:8000


To deploy, drag this folder onto Netlify Drop, or vercel deploy, or push it to a repo and point GitHub Pages at it. There is nothing to build.

Two ways to make sound

CONFIG.mode in app.js picks one.

"spotify" — the default

Renders Spotify's official embed for Sitar For Mental Health, sitting in a glass rim at the bottom of the page. Nothing to host, nothing to license: Spotify serves full tracks to listeners who are logged in and 30-second previews to everyone else, and draws its own controls. Swap spotifyEmbedId to change the playlist — the other one you sent is 5sgNEknxOyv4I4IpajS6UJ.

"files" — the custom player

Brings back the glass pill — your typography, your progress bar, your controls — playing audio you host in /audio.

playlist.js is already filled in with all 22 tracks from your playlist, and with the filenames it expects:

audio/01-the-burning-ghat.mp3
audio/02-shankara.mp3
audio/03-kautilya-the-echo-project.mp3
...


Match those names, or edit the src values to match your files. Keep the audio compressed — 128-192 kbps is plenty behind a video. art is optional; square images around 320x320 look right. The six in art/ are crops of the illustration, cycling through the list.

The catch is rights: publishing a page that streams commercial recordings you host yourself is a public performance and needs a licence. The embed exists so you don't need one, which is why it's the default. Worth settling before the site goes public.

Add ?shuffle=1 to the URL to randomise the order (files mode only).

Configure

Everything tweakable lives in the CONFIG block at the top of app.js:

key

what it does

mode

"spotify" or "files" — see above

spotifyEmbedId

playlist id for the embed

spotify, ytMusic

URLs for the top-right buttons. Left empty, they render dimmed and inert as a reminder.

creditText, creditHref

the line under the player. Empty text removes it.

presenceEndpoint

see below

startVolume

0–1

The "N online" counter

api/online.js is a Vercel serverless function. Each visitor pings it every 20 seconds with a random per-page-load id; the function records that id against a timestamp in a Redis sorted set, drops entries older than 45 seconds, and returns how many are left. No cookies, no IP addresses, nothing that identifies anyone.

It needs a Redis database. In the Vercel dashboard: your project → Storage → Marketplace → Upstash / Serverless DB (Redis) → create a free one and connect it to the project. Vercel injects the credentials as environment variables; the function reads either Upstash's names (UPSTASH_REDIS_REST_*) or Vercel's (KV_REST_API_*). Redeploy after connecting so the running function can see them.

Until a database is attached the function returns {"count": 1} — the page never breaks over a counter. To hide the counter entirely, set presenceEndpoint: "" in app.js.

Free-tier limits are far beyond what this uses: one small write and one read per visitor per 20 seconds.

Keyboard

space play/pause · ← → seek 5s · shift+← → change track · m mute. Lock-screen and headphone controls work through the Media Session API.

The background

media/ekagra-desk-bg.webm (1.7 MB) is served first, .mp4 (4.0 MB) is the fallback. It's a 12-second seamless loop: the lamp breathes, the monitor drifts, the streetlamp pulses, dust floats through the lamplight. poster.jpg shows on first paint and behind the letterbox on wide portrait screens.

Swapping in a different loop means replacing those three files. If your new artwork has no wordmark painted into it, delete the two @media (orientation:portrait) blocks in styles.css and let .bg cover everywhere — the crop gymnastics in there exist only to keep the painted title from being sliced in half on phones.

Layout notes

Landscape — the frame covers the viewport; the painted wordmark is the title.

Narrow portrait (most phones) — crops to the left column of the room, which contains none of the painted title, and the live <h1> carries the name.

Wide portrait (older 16:9 phones, tablets) — no title-free slice is wide enough, so the whole frame is letterboxed as a card over a blurred still.

Video autoplay needs muted + playsinline; both are set. Audio can't autoplay anywhere, by design — the first play always costs one tap.
