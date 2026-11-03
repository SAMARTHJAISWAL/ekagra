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
  // ?mode=files or ?mode=spotify in the URL overrides this, for testing.
  mode : "spotify",

  // Playlist id for the embed — the bit after /playlist/ in the URL.
  //   4xSc9Y0PDgZP2CUck9PXyK  Sitar For Mental Health (Saviour) — 22 tracks
  //   5sgNEknxOyv4I4IpajS6UJ  SITAR FOR MENTAL HEALTH (Abhyuday) — 36 tracks
  spotifyEmbedId : "4xSc9Y0PDgZP2CUck9PXyK",

  // "tracks"   — one song at a time, our own prev/next, no playlist chrome
  // "playlist" — Spotify's playlist card, queue and title row included
  playerStyle : "tracks",

  // Top-right links. Leave a value empty ("") to show the button dimmed.
  spotify : "https://open.spotify.com/playlist/4xSc9Y0PDgZP2CUck9PXyK",
  ytMusic : "https://music.youtube.com/watch?v=yTdUprbLodw",

  // Bottom credit. Set text to "" to hide the line entirely.
  creditText : "@samarthjaiswall",
  creditHref : "https://x.com/samarthjaiswall",

  // Clicking the clock starts a focus session of this many minutes.
  // 0 turns the clock back into just a clock.
  focusMinutes : 25,

  // Anything that answers GET with {"count": 12}. Empty hides "N online".
  presenceEndpoint : "",

  startVolume : 0.8,   // files mode, 0–1
};

/* ───────────────────────── helpers ───────────────────────── */
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mmss = (s) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return m + ":" + String(Math.floor(s % 60)).padStart(2, "0");
};
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html) n.innerHTML = html;
  return n;
};
// localStorage throws in some private modes; nothing here is worth crashing for.
const store = {
  get: (k) => { try { return localStorage.getItem("ekagra:" + k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem("ekagra:" + k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem("ekagra:" + k); } catch {} },
};
const PARAMS = new URLSearchParams(location.search);
const MODE = PARAMS.get("mode") || CONFIG.mode;
const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wallClock = () =>
  new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();

/* ───────────────────────── clock + focus session ─────────────────────────
   The clock is also the timer. Click it and it counts down a session; click
   again to stop. The end time is remembered, so a reload doesn't lose it.
   A soft two-note chime marks the end — synthesised, no audio file. */
(function clock() {
  const btn = $("clock");
  const label = btn.querySelector(".clock-t");
  const MIN = CONFIG.focusMinutes;
  let end = Number(store.get("focus-end")) || 0;
  let doneUntil = 0;
  let ctx = null;

  if (!MIN) { btn.disabled = true; btn.removeAttribute("title"); }
  if (end <= Date.now()) end = 0;

  function chime() {
    if (!ctx) return;
    const t0 = ctx.currentTime;
    [[659.25, 0], [987.77, 0.22]].forEach(([f, at]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + at);
      g.gain.linearRampToValueAtTime(0.18, t0 + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 1.6);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + at); o.stop(t0 + at + 1.7);
    });
  }

  let shown = "";
  function render() {
    const now = Date.now();
    if (end && now >= end) {
      end = 0; store.del("focus-end");
      doneUntil = now + 10000;
      chime();
    }
    const state = end ? "focus" : now < doneUntil ? "done" : "clock";
    label.textContent =
      state === "focus" ? mmss((end - now) / 1000) :
      state === "done"  ? "done · " + wallClock() : wallClock();
    if (state !== shown) {
      shown = state;
      btn.dataset.state = state;
      btn.setAttribute("aria-label", !MIN ? "Current time" :
        state === "focus" ? "Focus session running. Stop it" :
        "Start a " + MIN + "-minute focus session");
      if (MIN) btn.title = state === "focus" ? "Stop the session" : MIN + "-minute focus session";
    }
  }

  btn.addEventListener("click", () => {
    if (!MIN) return;
    if (!ctx && window.AudioContext) ctx = new AudioContext();
    if (ctx && ctx.state === "suspended") ctx.resume();
    if (end) { end = 0; store.del("focus-end"); }
    else { end = Date.now() + MIN * 60000; doneUntil = 0; store.set("focus-end", end); }
    render();
  });

  const tick = () => { render(); setTimeout(tick, 1000 - (Date.now() % 1000)); };
  tick();
})();

/* ───────────────────────── presence ───────────────────────── */
(function presence() {
  const url = CONFIG.presenceEndpoint;
  if (!url) return;
  const box = $("presence"), n = $("online");
  const poll = async () => {
    if (document.hidden) return;
    try {
      const r = await fetch(url, { cache: "no-store" });
      const { count } = await r.json();
      if (Number.isFinite(count) && count > 0) {
        n.textContent = count;
        box.hidden = false;
      }
    } catch { /* stay quiet; the badge just doesn't update */ }
  };
  poll();
  setInterval(poll, 20000);
  document.addEventListener("visibilitychange", poll);
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

/* ───────────────────────── background video ───────────────────────── */
(function background() {
  const v = $("bg");

  /* The frame is 16:9 and the wordmark is painted across its middle. In
     portrait we crop to the left column — lamp, framed print, the boy —
     which is the only title-free part wide enough to use, and the live
     <h1> carries the name instead.

     The zoom is computed, not guessed: whatever the viewport, the slice
     on screen stays at ~30% of the frame's width. That's a shade past
     where the painted wordmark starts (27%), so a sliver of it can reach
     the right edge — the portrait scrim in styles.css shades that away.
     Cropping harder than this loses the boy and leaves a lamp close-up.
     Phone viewports change as the URL bar slides, so this re-runs on
     resize. */
  const fitBackground = () => {
    const vw = innerWidth, vh = innerHeight;
    if (vw >= vh) {                       // landscape: show the whole frame
      v.style.transform = "";
      v.style.objectPosition = "";
      return;
    }
    const visible = (vw / vh) / (16 / 9); // fraction of the frame width on screen
    v.style.objectPosition = "0% center";
    v.style.transformOrigin = "0 50%";
    v.style.transform = "scale(" + Math.max(1, visible / 0.30).toFixed(3) + ")";
  };
  fitBackground();
  addEventListener("resize", fitBackground, { passive: true });
  addEventListener("orientationchange", fitBackground, { passive: true });

  // Reduced motion: the poster frame stands in for the loop, permanently.
  if (REDUCED_MOTION) { v.removeAttribute("autoplay"); v.pause(); return; }

  // Some browsers refuse the autoplay promise until a gesture even when muted.
  const kick = () => v.play().catch(() => {});
  kick();
  document.addEventListener("visibilitychange", () =>
    document.hidden ? v.pause() : kick());
  document.addEventListener("pointerdown", kick, { once: true });
})();

/* ───────────────────────── idle fade ─────────────────────────
   Let the room be the room. The clock, links and player dim away after a
   few seconds of stillness and return on any movement. Never dims while
   the pointer is over the player, or while the Spotify embed has focus
   (clicks inside its iframe never reach this page). */
(function idle() {
  const DELAY = 4000;
  let timer, hovering = false, inFrame = false;
  // Touch devices get no hover, so the chrome just stays up there.
  const touch = matchMedia("(hover: none)").matches;

  const wake = () => {
    document.body.classList.remove("idle");
    clearTimeout(timer);
    if (!hovering && !inFrame && !touch)
      timer = setTimeout(() => document.body.classList.add("idle"), DELAY);
  };

  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"]
    .forEach((e) => addEventListener(e, wake, { passive: true }));

  const dock = document.querySelector(".dock");
  dock.addEventListener("pointerenter", () => { hovering = true; wake(); });
  dock.addEventListener("pointerleave", () => { hovering = false; wake(); });
  addEventListener("blur", () => {
    setTimeout(() => {
      inFrame = document.activeElement && document.activeElement.tagName === "IFRAME";
      wake();
    });
  });
  addEventListener("focus", () => { inFrame = false; wake(); });

  wake();
})();

/* ───────────────────────── tracks ───────────────────────── */
function shuffle(a) {
  a = a.slice();
  for (let n = a.length - 1; n > 0; n--) {
    const j = Math.floor(Math.random() * (n + 1));
    [a[n], a[j]] = [a[j], a[n]];
  }
  return a;
}

// Both modes read the same list; ?shuffle=1 randomises it.
const ALL_TRACKS = (window.PLAYLIST && window.PLAYLIST.tracks) || [];
const ORDERED = PARAMS.get("shuffle") === "1" ? shuffle(ALL_TRACKS) : ALL_TRACKS;

// Pick up where the visitor left off last time.
const trackKey = (t) => t.id || t.src;
function resumeIndex(list) {
  const saved = store.get("track");
  const n = list.findIndex((t) => trackKey(t) === saved);
  return n < 0 ? 0 : n;
}
function nowPlaying(t) {
  store.set("track", trackKey(t));
  document.title = t.title + " — एकाग्र";
}

/* One keyboard map for both players:
   space play/pause · ←/→ seek 5s · shift+←/→ change track · m mute */
function bindKeys(p) {
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    const t = e.target;
    if (t.closest && t.closest("input,textarea,select,[contenteditable],a,button,[role=slider]")) return;
    if (e.code === "Space") { e.preventDefault(); p.toggle(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); e.shiftKey ? p.step(1) : p.seekBy(5); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); e.shiftKey ? p.step(-1) : p.seekBy(-5); }
    else if (e.key.toLowerCase() === "m" && p.mute) p.mute();
  });
}

const ICON = {
  prev : '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M7 6h2v12H7V6Zm10 0v12l-8-6 8-6Z"/></svg>',
  next : '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M15 6h2v12h-2V6ZM7 6l8 6-8 6V6Z"/></svg>',
};

const stage = el("div", "stage");
document.querySelector(".dock").prepend(stage);

/* ───────────────────────── spotify mode ─────────────────────────
   One track at a time through Spotify's IFrame API, with our own
   prev/next around it. If the API can't load, the plain playlist embed
   takes over — whichever answers first wins, never both. */
function spotifyPlayer() {
  $("player").remove();

  const tracks = ORDERED.filter((t) => t.id);
  let idx = resumeIndex(tracks);
  let ctl = null, settled = false, advancing = false, pendingPlay = false;
  let pos = 0, playing = false, titled = -1, endTimer = 0, playTimer = 0;

  const wrap = el("div", "embed-wrap");
  const prev = el("button", "nav", ICON.prev);
  const next = el("button", "nav", ICON.next);
  const host = el("div", "embed-host");
  prev.type = next.type = "button";
  prev.setAttribute("aria-label", "Previous track");
  next.setAttribute("aria-label", "Next track");
  wrap.append(prev, host, next);
  stage.append(wrap);

  function fallback() {
    if (settled) return;
    settled = true;
    if (tracks.length && CONFIG.playerStyle !== "playlist")
      console.warn("[ekagra] Spotify IFrame API unavailable — using the plain " +
                   "playlist embed. Usually a blocked script or a slow network.");
    wrap.classList.add("plain");
    host.innerHTML = "";
    const f = el("iframe", "embed");
    f.src = "https://open.spotify.com/embed/playlist/" + CONFIG.spotifyEmbedId +
            "?utm_source=generator&theme=0";
    f.title = "Spotify player";
    f.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    f.loading = "lazy";
    host.append(f);
  }

  function go(step) {
    if (!ctl || !tracks.length) return;
    idx = (idx + step + tracks.length) % tracks.length;
    advancing = pendingPlay = true;
    clearTimeout(endTimer);
    ctl.loadUri("spotify:track:" + tracks[idx].id);
    store.set("track", trackKey(tracks[idx]));
    // The embed fires "ready" once the new track can take play(); the timer
    // covers the odd load that never says so.
    clearTimeout(playTimer);
    playTimer = setTimeout(startPending, 2000);
  }

  function startPending() {
    clearTimeout(playTimer);
    if (!pendingPlay) return;
    pendingPlay = advancing = false;
    ctl.play();
  }

  if (!tracks.length || CONFIG.playerStyle === "playlist") return fallback();

  window.onSpotifyIframeApiReady = (API) => {
    if (settled) return;
    API.createController(
      host,
      { uri: "spotify:track:" + tracks[idx].id, width: "100%", height: 80 },
      (controller) => {
        if (settled) return;
        settled = true;
        ctl = controller;
        wrap.classList.add("live");
        controller.addListener("ready", startPending);
        controller.addListener("playback_update", (e) => {
          const d = e.data;
          if (!d) return;
          const wasPlaying = playing;
          pos = d.position || 0;
          playing = !d.isPaused;
          document.body.classList.toggle("playing", playing);
          if (playing && titled !== idx) { titled = idx; nowPlaying(tracks[idx]); }

          /* Auto-advance. Updates arrive about once a second and the embed
             stops dead at the end (for logged-out listeners, on a "Get
             Spotify" card after a ~30s preview), so instead of hoping an
             update lands in the last moment, schedule the switch for when
             the track runs out. Each update re-aims the timer; a pause
             cancels it. */
          clearTimeout(endTimer);
          if (!d.duration || advancing) return;
          const left = d.duration - pos;
          if (playing && left < 2500) endTimer = setTimeout(() => go(1), Math.max(0, left - 150));
          else if (!playing && wasPlaying && left < 1500) go(1);
        });
      }
    );
  };
  const script = el("script");
  script.src = "https://open.spotify.com/embed/iframe-api/v1";
  script.async = true;
  script.onerror = fallback;
  document.head.append(script);
  setTimeout(fallback, 8000);

  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  bindKeys({
    toggle: () => ctl && ctl.togglePlay(),
    step: go,
    seekBy: (s) => ctl && ctl.seek(Math.max(0, pos / 1000 + s)),
  });
}

/* ───────────────────────── files mode ─────────────────────────
   Our own glass player, playing files from /audio. Browsers won't
   autoplay audio, so the first press of play is the visitor's own
   gesture, as it has to be. */
function filePlayer() {
  stage.append($("player"));

  const list = ORDERED.filter((t) => t && t.src);
  const audio = new Audio();
  audio.preload = "metadata";
  audio.volume = CONFIG.startVolume;
  let i = 0, touched = false;

  const els = {
    art: $("art"), title: $("track-title"),
    fill: $("bar-fill"), knob: $("bar-knob"), bar: $("bar"),
    cur: $("t-cur"), dur: $("t-dur"),
    play: $("play"), icPlay: $("ic-play"), icPause: $("ic-pause"),
  };

  if (!list.length) { els.title.textContent = "no tracks yet"; return; }

  function paintTrack() {
    const t = list[i];
    els.title.textContent = t.title || "Untitled";
    els.title.title = t.artist ? t.title + " — " + t.artist : t.title;
    if (t.art) els.art.src = t.art;
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title, artist: t.artist || "", album: "एकाग्र",
        artwork: t.art ? [{ src: new URL(t.art, location.href).href, sizes: "320x320", type: "image/jpeg" }] : [],
      });
    }
  }

  function load(n, autoplay) {
    i = (n + list.length) % list.length;
    audio.src = list[i].src;
    paintTrack();
    progress(0, 0);
    if (autoplay) play();
  }

  function play() {
    touched = true;
    audio.play().then(() => nowPlaying(list[i])).catch(fail);
  }

  function progress(cur, dur) {
    const pct = dur ? (cur / dur) * 100 : 0;
    els.fill.style.width = pct + "%";
    els.knob.style.left = pct + "%";
    els.cur.textContent = mmss(cur);
    els.dur.textContent = mmss(dur);
    els.bar.setAttribute("aria-valuenow", Math.round(pct));
    els.bar.setAttribute("aria-valuetext", mmss(cur) + " of " + mmss(dur));
  }

  function setPlaying(on) {
    // NB: `hidden` is an HTMLElement property — SVG elements ignore it, so we
    // drive display directly.
    document.body.classList.toggle("playing", on);
    els.icPlay.style.display = on ? "none" : "";
    els.icPause.style.display = on ? "" : "none";
    els.play.setAttribute("aria-label", on ? "Pause" : "Play");
  }

  function fail(err) {
    if (err && err.name === "AbortError") return;   // a newer load() took over
    els.title.textContent = touched ? "no audio file for this one yet" : list[i].title;
    setPlaying(false);
  }

  const toggle = () => (audio.paused ? play() : audio.pause());
  const step = (d) => load(i + d, true);
  const seekBy = (s) => { if (audio.duration) audio.currentTime = clamp(audio.currentTime + s, 0, audio.duration); };

  /* seek — click, drag and keyboard all land here */
  function seekFromEvent(e) {
    const r = els.bar.getBoundingClientRect();
    if (audio.duration) audio.currentTime = clamp((e.clientX - r.left) / r.width, 0, 1) * audio.duration;
  }
  let dragging = false;
  els.bar.addEventListener("pointerdown", (e) => {
    dragging = true; els.bar.setPointerCapture(e.pointerId); seekFromEvent(e);
  });
  els.bar.addEventListener("pointermove", (e) => dragging && seekFromEvent(e));
  els.bar.addEventListener("pointerup", () => { dragging = false; });
  els.bar.addEventListener("pointercancel", () => { dragging = false; });
  els.bar.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") seekBy(5);
    else if (e.key === "ArrowLeft") seekBy(-5);
    else if (e.key === "Home") seekBy(-Infinity);
    else if (e.key === "End") seekBy(Infinity);
    else return;
    e.preventDefault();
  });

  els.play.addEventListener("click", toggle);
  $("next").addEventListener("click", () => step(1));
  $("prev").addEventListener("click", () => {
    if (audio.currentTime > 3) audio.currentTime = 0;
    else step(-1);
  });

  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("ended", () => step(1));
  audio.addEventListener("error", () => { if (audio.src) fail(); });
  audio.addEventListener("timeupdate", () => progress(audio.currentTime, audio.duration || 0));
  audio.addEventListener("loadedmetadata", () => progress(audio.currentTime, audio.duration || 0));

  bindKeys({ toggle, step, seekBy, mute: () => { audio.muted = !audio.muted; } });

  if ("mediaSession" in navigator) {
    const ms = navigator.mediaSession;
    ms.setActionHandler("play", play);
    ms.setActionHandler("pause", () => audio.pause());
    ms.setActionHandler("nexttrack", () => step(1));
    ms.setActionHandler("previoustrack", () => step(-1));
    try {
      ms.setActionHandler("seekto", (d) => { audio.currentTime = d.seekTime; });
      ms.setActionHandler("seekforward", () => seekBy(10));
      ms.setActionHandler("seekbackward", () => seekBy(-10));
    } catch { /* older browsers don't know these actions */ }
  }

  load(resumeIndex(list), false);
}

/* ───────────────────────── boot ───────────────────────── */
if (MODE === "spotify") spotifyPlayer();
else filePlayer();
