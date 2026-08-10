/* ═══════════════ एकाग्र / Ekāgra ═══════════════
   Everything you'd normally want to change lives in CONFIG.        */

const CONFIG = {
  // How sound gets made.
  //   "spotify" — the official Spotify embed. Licensed, works immediately,
  //               full tracks for logged-in listeners, 30s previews for
  //               everyone else. Spotify draws its own controls.
  //   "files"   — the custom glass player, playing audio you host yourself
  //               from /audio (see playlist.js). Your design, your rights
  //               problem: a public page playing commercial recordings needs
  //               a licence.
  mode : "spotify",

  // Playlist id for the embed — the bit after /playlist/ in the URL.
  //   4xSc9Y0PDgZP2CUck9PXyK  Sitar For Mental Health (Saviour) — 22 tracks
  //   5sgNEknxOyv4I4IpajS6UJ  SITAR FOR MENTAL HEALTH (Abhyuday) — 36 tracks
  spotifyEmbedId : "4xSc9Y0PDgZP2CUck9PXyK",

  // Top-right links. Leave a value empty ("") to hide that button.
  spotify : "https://open.spotify.com/playlist/4xSc9Y0PDgZP2CUck9PXyK",
  ytMusic : "https://music.youtube.com/watch?v=yTdUprbLodw",

  // Bottom credit. Set text to "" to hide the line entirely.
  creditText : "@samarthjaiswall",
  creditHref : "https://x.com/samarthjaiswall",

  // "N online". Point this at an endpoint returning {"count": 42} to make it
  // real. Left empty, the counter reports only this visitor — which is honest,
  // if lonely. See README for a 20-line version on any edge runtime.
  presenceEndpoint : "",
  presencePollMs   : 20000,

  startVolume : 0.8,
};

/* ───────────────────────── helpers ───────────────────────── */
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mmss = (s) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return m + ":" + String(Math.floor(s % 60)).padStart(2, "0");
};

/* ───────────────────────── clock ───────────────────────── */
(function clock() {
  const el = $("clock");
  const tick = () => {
    el.textContent = new Date()
      .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      .toLowerCase();
    setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  tick();
})();

/* ───────────────────────── links ───────────────────────── */
(function links() {
  const set = (id, url) => {
    const a = $(id);
    if (url) { a.href = url; return; }
    // Not configured yet: keep the button in the layout but make it inert.
    a.removeAttribute("href");
    a.removeAttribute("target");
    a.classList.add("todo");
    a.title = "Add your playlist URL in app.js → CONFIG";
  };
  set("link-spotify", CONFIG.spotify);
  set("link-ytm", CONFIG.ytMusic);

  const c = document.querySelector(".credit");
  if (!CONFIG.creditText) c.remove();
  else {
    const a = $("credit-link");
    a.textContent = CONFIG.creditText;
    if (CONFIG.creditHref) a.href = CONFIG.creditHref;
    else a.replaceWith(document.createTextNode(CONFIG.creditText));
  }
})();

/* ───────────────────────── presence ───────────────────────── */
(async function presence() {
  const wrap = $("presence"), num = $("online");
  wrap.hidden = false;
  if (!CONFIG.presenceEndpoint) { num.textContent = "1"; return; }
  const poll = async () => {
    try {
      const r = await fetch(CONFIG.presenceEndpoint, { cache: "no-store" });
      const d = await r.json();
      if (typeof d.count === "number") num.textContent = d.count;
    } catch { /* keep the last known value */ }
    setTimeout(poll, CONFIG.presencePollMs);
  };
  poll();
})();

/* ───────────────────────── background video ───────────────────────── */
(function background() {
  const v = $("bg");
  // Some browsers refuse the autoplay promise until a gesture even when muted.
  const kick = () => v.play().catch(() => {});
  kick();
  document.addEventListener("visibilitychange", () =>
    document.hidden ? v.pause() : kick());
  document.addEventListener("pointerdown", kick, { once: true });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) v.pause();
})();

/* ───────────────────────── spotify embed mode ───────────────────────── */
if (CONFIG.mode === "spotify") {
  const dock = document.querySelector(".dock");
  $("player").remove();
  const frame = document.createElement("iframe");
  frame.className = "embed";
  frame.src = "https://open.spotify.com/embed/playlist/" + CONFIG.spotifyEmbedId +
              "?utm_source=generator&theme=0";
  frame.title = "Spotify player";
  frame.loading = "lazy";
  frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
  frame.setAttribute("frameborder", "0");
  const wrap = document.createElement("div");
  wrap.className = "embed-wrap";
  wrap.appendChild(frame);
  dock.prepend(wrap);
  document.body.classList.add("embed-mode");
}

/* ───────────────────────── idle fade ─────────────────────────
   Let the room be the room. The clock, links and player dim away after a
   few seconds of stillness and return on any movement. Never dims while
   the pointer is over the player itself. */
(function idle() {
  const DELAY = 4000;
  let timer, held = false;

  const wake = () => {
    document.body.classList.remove("idle");
    clearTimeout(timer);
    if (!held) timer = setTimeout(() => document.body.classList.add("idle"), DELAY);
  };

  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"]
    .forEach((e) => addEventListener(e, wake, { passive: true }));

  const dock = document.querySelector(".dock");
  dock.addEventListener("pointerenter", () => { held = true; wake(); });
  dock.addEventListener("pointerleave", () => { held = false; wake(); });

  // Touch devices get no hover, so keep the chrome up for longer there.
  if (matchMedia("(hover: none)").matches) held = true;

  wake();
})();

/* ───────────────────────── player ───────────────────────── */
const audio = new Audio();
audio.preload = "metadata";
audio.volume = CONFIG.startVolume;

let list = [];
let i = 0;
let ready = false;

const els = {
  art: $("art"), title: $("track-title"), artist: $("track-artist"),
  fill: $("bar-fill"), knob: $("bar-knob"), bar: $("bar"),
  cur: $("t-cur"), dur: $("t-dur"),
  play: $("play"), icPlay: $("ic-play"), icPause: $("ic-pause"),
};

const HAS_PLAYER = !!els.play;   // false once the embed has replaced it

function paintTrack() {
  const t = list[i];
  if (!t) return;
  els.title.textContent = t.title || "Untitled";
  els.artist.textContent = t.artist || "";
  if (t.art) els.art.src = t.art;
  els.dur.textContent = mmss(t.duration || 0);
  document.title = `${t.title} — एकाग्र`;

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title, artist: t.artist, album: "एकाग्र",
      artwork: t.art ? [{ src: new URL(t.art, location.href).href, sizes: "320x320", type: "image/jpeg" }] : [],
    });
  }
}

function load(n, autoplay) {
  if (!list.length) return;
  i = (n + list.length) % list.length;
  audio.src = list[i].src;
  paintTrack();
  progress(0, 0);
  if (autoplay) audio.play().catch(fail);
}

function progress(cur, dur) {
  const pct = dur ? (cur / dur) * 100 : 0;
  els.fill.style.width = pct + "%";
  els.knob.style.left = pct + "%";
  els.cur.textContent = mmss(cur);
  els.dur.textContent = mmss(dur);
  els.bar.setAttribute("aria-valuenow", Math.round(pct));
}

function setPlaying(on) {
  // NB: `hidden` is an HTMLElement property — SVG elements ignore it, so we
  // drive display directly.
  document.body.classList.toggle("playing", on);
  els.icPlay.style.display = on ? "none" : "";
  els.icPause.style.display = on ? "" : "none";
  els.play.setAttribute("aria-label", on ? "Pause" : "Play");
}

let touched = false;   // has the visitor actually asked for sound yet?

function fail() {
  if (touched) {
    els.title.textContent = "Couldn't play that track";
    els.artist.textContent = "check the file path in playlist.js";
  } else {
    els.title.textContent = list[i] ? list[i].title : "No tracks yet";
    els.artist.textContent = "add your files to /audio";
  }
  setPlaying(false);
}

function toggle() {
  if (!ready || !list.length) return;
  touched = true;
  if (audio.paused) { if (!audio.src) load(0, false); audio.play().catch(fail); }
  else audio.pause();
}

/* Everything past here drives the custom player, which doesn't exist in
   embed mode. */
if (HAS_PLAYER) {

/* seek — click, drag and keyboard all land here */
function seekFromEvent(e) {
  const r = els.bar.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
  if (audio.duration) audio.currentTime = clamp(x / r.width, 0, 1) * audio.duration;
}
let dragging = false;
els.bar.addEventListener("pointerdown", (e) => {
  dragging = true; els.bar.setPointerCapture(e.pointerId); seekFromEvent(e);
});
els.bar.addEventListener("pointermove", (e) => dragging && seekFromEvent(e));
els.bar.addEventListener("pointerup", () => { dragging = false; });
els.bar.addEventListener("keydown", (e) => {
  if (!audio.duration) return;
  if (e.key === "ArrowRight") audio.currentTime += 5;
  else if (e.key === "ArrowLeft") audio.currentTime -= 5;
  else return;
  e.preventDefault();
});

els.play.addEventListener("click", toggle);
$("next").addEventListener("click", () => load(i + 1, true));
$("prev").addEventListener("click", () => {
  if (audio.currentTime > 3) audio.currentTime = 0;
  else load(i - 1, true);
});

audio.addEventListener("play", () => setPlaying(true));
audio.addEventListener("pause", () => setPlaying(false));
audio.addEventListener("ended", () => load(i + 1, true));
audio.addEventListener("error", () => { if (audio.src) fail(); });
audio.addEventListener("timeupdate", () => progress(audio.currentTime, audio.duration || 0));
audio.addEventListener("loadedmetadata", () => progress(audio.currentTime, audio.duration || 0));

/* keyboard: space toggles, ←/→ seek, shift+←/→ change track */
addEventListener("keydown", (e) => {
  if (e.target.closest("input,textarea,a,button")) return;
  if (e.code === "Space") { e.preventDefault(); toggle(); }
  else if (e.key === "ArrowRight") e.shiftKey ? load(i + 1, true) : (audio.currentTime += 5);
  else if (e.key === "ArrowLeft") e.shiftKey ? load(i - 1, true) : (audio.currentTime -= 5);
  else if (e.key.toLowerCase() === "m") audio.muted = !audio.muted;
});

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", toggle);
  navigator.mediaSession.setActionHandler("pause", toggle);
  navigator.mediaSession.setActionHandler("nexttrack", () => load(i + 1, true));
  navigator.mediaSession.setActionHandler("previoustrack", () => load(i - 1, true));
}

} /* end HAS_PLAYER */

/* ───────────────────────── boot ───────────────────────── */
(function boot() {
  if (!HAS_PLAYER) return;
  list = ((window.PLAYLIST && window.PLAYLIST.tracks) || []).filter((t) => t && t.src);

  if (!list.length) {
    els.title.textContent = "No tracks yet";
    els.artist.textContent = "add files to /audio and list them in playlist.js";
    return;
  }

  // ?shuffle=1 in the URL randomises the order
  if (new URLSearchParams(location.search).get("shuffle") === "1") list = shuffle(list);
  ready = true;
  load(0, false);
})();
function shuffle(a) {
  a = a.slice();
  for (let n = a.length - 1; n > 0; n--) {
    const j = Math.floor(Math.random() * (n + 1));
    [a[n], a[j]] = [a[j], a[n]];
  }
  return a;
}
