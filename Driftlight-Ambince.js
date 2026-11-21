/*
 * Listening Room — a liquid-glass visual refresh for Spotify desktop.
 * Install with Spicetify. Presentation only; playback is untouched.
 *
 * Unslop workflow adapted from Unslop by Damir Sokolovsky
 * (https://heydamir.design/unslop), licensed under CC BY 4.0.
 */
(function listeningRoom() {
  if (
    !window.Spicetify ||
    !Spicetify.Player ||
    !Spicetify.Topbar?.Button ||
    !Spicetify.LocalStorage
  ) {
    window.setTimeout(listeningRoom, 250);
    return;
  }

  // New storage key resets a stale "off" value from earlier non-working builds.
  const STORAGE_KEY = "listening-room:enabled-v2";
  const STYLE_ID = "listening-room-style";
  const saved = Spicetify.LocalStorage.get(STORAGE_KEY);
  let enabled = saved !== "false";
  let libraryAmbience = null;

  const css = `
    :root {
      --lr-glass: rgba(28, 30, 35, .3);
      --lr-glass-strong: rgba(25, 27, 32, .43);
      --lr-glass-hover: rgba(55, 57, 63, .42);
      --lr-edge: rgba(255, 255, 255, .2);
      --lr-edge-soft: rgba(255, 255, 255, .1);
      --lr-sheen: rgba(255, 255, 255, .16);
      --lr-glass-sheen: linear-gradient(145deg, rgba(255,255,255,.12), rgba(255,255,255,.018) 52%, rgba(255,255,255,.055));
      --lr-radius: 20px;
      --lr-inset: 8px;
      --lr-inner-radius: calc(var(--lr-radius) - var(--lr-inset));
      --lr-player-artwork: none;
      --lr-player-color-a: #24312a;
      --lr-player-color-b: #18211d;
      --lr-text: #f4f4f5;
      --lr-secondary: #b8b8bd;
      --lr-accent: #1ed760;
    }

    @property --lr-player-color-a {
      syntax: "<color>";
      inherits: true;
      initial-value: #24312a;
    }

    @property --lr-player-color-b {
      syntax: "<color>";
      inherits: true;
      initial-value: #18211d;
    }

    @keyframes lr-player-ambient-drift {
      from { background-position: 0% 50%, 100% 50%, center; }
      to { background-position: 100% 50%, 0% 50%, center; }
    }

    /* The media and page canvas remain the visual focus under the controls. */
    .Root__top-container,
    .Root__main-view,
    .main-view-container,
    .main-view-container__scroll-node,
    [data-testid="main-view-container"],
    .playlist-playlist-page,
    .playlist-playlist-playlistContent {
      background-color: transparent !important;
    }

    /* Navigation glass floats above the page instead of replacing its color. */
    .Root__top-bar,
    .main-topBar-container,
    .main-topBar-background,
    [class*="topBar-container"],
    [data-testid="top-bar"],
    [data-testid="topbar"],
    .Root__nav-bar,
    #Desktop_LeftSidebar_Id,
    .main-yourLibraryX-library,
    [data-testid="left-sidebar"] {
      background-color: var(--lr-glass-strong) !important;
      background-image: var(--lr-glass-sheen) !important;
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      backdrop-filter: blur(28px) saturate(180%);
      border-color: var(--lr-edge-soft) !important;
      box-shadow: inset 0 1px 0 var(--lr-sheen), 0 8px 26px rgba(0,0,0,.18) !important;
    }

    .Root__top-bar,
    .main-topBar-container,
    .main-topBar-background,
    [class*="topBar-container"],
    [data-testid="top-bar"],
    [data-testid="topbar"] {
      background-image: linear-gradient(180deg, rgba(255,255,255,.07), transparent 85%) !important;
      border-bottom: 1px solid var(--lr-edge-soft) !important;
    }

    .Root__nav-bar,
    #Desktop_LeftSidebar_Id,
    .main-yourLibraryX-library,
    [data-testid="left-sidebar"] {
      background-image: linear-gradient(rgba(12,14,18,.34), rgba(12,14,18,.42)), var(--lr-glass-sheen) !important; /* lower .34/.42 = more glow */
      background-size: cover !important;
      background-position: center !important;
      border: 1px solid var(--lr-edge-soft) !important;
      border-radius: var(--lr-radius) !important;
    }

    /* Search and filter controls share the same small, nested glass shape. */
    .main-topBar-searchBar,
    [data-testid="top-bar-search-input"],
    .main-home-filterChip,
    .main-home-filterChipsSection button {
      background-color: rgba(255,255,255,.075) !important;
      -webkit-backdrop-filter: blur(18px) saturate(165%);
      backdrop-filter: blur(18px) saturate(165%);
      border: 1px solid rgba(255,255,255,.13) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.14) !important;
      border-radius: 999px !important;
    }

    .main-topBar-searchBar:hover,
    [data-testid="top-bar-search-input"]:hover,
    .main-home-filterChip:hover,
    .main-home-filterChipsSection button:hover {
      background-color: rgba(255,255,255,.13) !important;
      border-color: var(--lr-edge) !important;
    }

    /* Inspector and player are separate floating control surfaces. */
    .main-yourLibraryX-library,
    [data-testid="now-playing-widget"],
    .main-nowPlayingView-nowPlayingWidget,
    .main-nowPlayingBar-container,
    [data-testid="now-playing-bar"],
    .Root__now-playing-bar,
    .Root__right-sidebar,
    [data-testid="right-sidebar"] {
      background-color: var(--lr-glass) !important;
      background-image: var(--lr-glass-sheen) !important;
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      backdrop-filter: blur(30px) saturate(180%);
      border: 1px solid var(--lr-edge-soft) !important;
      box-shadow: inset 0 1px 0 var(--lr-sheen), inset 0 -1px 0 rgba(255,255,255,.045), 0 12px 30px rgba(0,0,0,.2) !important;
      border-radius: var(--lr-radius) !important;
    }

    .main-nowPlayingBar-container,
    .Root__now-playing-bar,
    [data-testid="now-playing-bar"],
    [class*="nowPlayingBar-container"],
    .lr-playerbar-dynamic {
      background-color: rgba(12, 15, 15, .28) !important;
      background-image: none !important;
      transition: --lr-player-color-a 900ms ease, --lr-player-color-b 1100ms ease !important;
      position: relative !important;
      isolation: isolate;
      overflow: hidden !important;
      border-radius: var(--lr-radius) !important;
    }

    /* Player bar glow: same colors and breathing as the page glow. The bar is
       long and thin, so the layer sways sideways instead of orbiting.
       Transform only (no blur filter, no repaint). Speed: change 22s below. */
    @keyframes lr-bar-sway {
      from { translate: -14% 0; }
      to { translate: 14% 0; }
    }

    .main-nowPlayingBar-container::before,
    .Root__now-playing-bar::before,
    [data-testid="now-playing-bar"]::before,
    [class*="nowPlayingBar-container"]::before,
    .lr-playerbar-dynamic::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 -50% !important;
      z-index: 0 !important;
      pointer-events: none !important;
      will-change: translate, scale;
      background-image:
        radial-gradient(ellipse 26% 150% at 30% 50%, color-mix(in srgb, var(--lr-player-color-a) 80%, transparent), transparent),
        radial-gradient(ellipse 26% 150% at 70% 50%, color-mix(in srgb, var(--lr-player-color-b) 76%, transparent), transparent),
        linear-gradient(rgba(10, 12, 14, .5), rgba(10, 12, 14, .55)) !important;
      animation:
        lr-bar-sway 22s ease-in-out infinite alternate,
        lr-glow-breathe 28s ease-in-out infinite alternate !important;
    }

    /* Hard-clip the bar (and its moving glow layer) to the same rounded border,
       so the glow can never poke out at the corners. */
    .main-nowPlayingBar-container,
    .Root__now-playing-bar,
    [data-testid="now-playing-bar"],
    [class*="nowPlayingBar-container"],
    .lr-playerbar-dynamic {
      border-radius: var(--lr-radius) !important;
      clip-path: inset(0 round var(--lr-radius));
    }

    /* The outer wrapper is a bigger box around the real bar. Only the inner bar
       should draw, otherwise two rounded shapes overlap at the corners. */
    .Root__now-playing-bar {
      background: transparent !important;
      background-image: none !important;
      border: 0 !important;
      box-shadow: none !important;
      clip-path: none !important;
      overflow: visible !important;
    }

    .Root__now-playing-bar::before,
    .Root__now-playing-bar::after {
      display: none !important;
    }

    .main-nowPlayingBar-container > *,
    .Root__now-playing-bar > *,
    [data-testid="now-playing-bar"] > *,
    [class*="nowPlayingBar-container"] > *,
    .lr-playerbar-dynamic > * {
      position: relative;
      z-index: 1;
    }

    .lr-player-ambience-canvas {
      position: absolute !important;
      inset: -18px !important;
      z-index: 1 !important;
      display: block !important;
      width: calc(100% + 36px) !important;
      height: calc(100% + 36px) !important;
      border-radius: inherit !important;
      filter: blur(20px) saturate(2.2) brightness(.62);
      opacity: .22;
      pointer-events: none !important;
    }

    .lr-playerbar-dynamic-surface {
      background-color: transparent !important;
      background-image: none !important;
      box-shadow: none !important;
    }

    @media (prefers-reduced-motion: reduce) {
      .main-nowPlayingBar-container,
      .Root__now-playing-bar,
      [data-testid="now-playing-bar"],
      [class*="nowPlayingBar-container"],
      .lr-playerbar-dynamic {
        transition: none !important;
      }
      .main-nowPlayingBar-container::before,
      .Root__now-playing-bar::before,
      [data-testid="now-playing-bar"]::before,
      [class*="nowPlayingBar-container"]::before,
      .lr-playerbar-dynamic::before { animation: none !important; }
      .Root::before { animation: none !important; }
      .lr-player-ambience-canvas { display: none !important; }
    }

    /* Moving ambient glow. Two soft color blobs sit on an oversized layer that
       slowly orbits and breathes. Only transforms animate (GPU only, no blur
       filter, no repaint), so it stays light. Speed: change 90s / 28s below. */
    @keyframes lr-glow-orbit {
      from { rotate: 0deg; }
      to { rotate: 360deg; }
    }

    @keyframes lr-glow-breathe {
      from { scale: 1; }
      to { scale: 1.18; }
    }

    /* One glow behind the whole window (top bar, page, sidebars) so it all
       reads as a single connected surface. */
    .Root {
      position: relative !important;
      isolation: isolate !important;
      overflow: clip !important;
    }

    .Root::before {
      content: "" !important;
      position: absolute !important;
      inset: -80% !important;
      z-index: -1 !important;
      pointer-events: none !important;
      will-change: rotate, scale;
      background-image:
        radial-gradient(circle 40vmax at 30% 38%, color-mix(in srgb, var(--lr-player-color-a) 72%, transparent), transparent),
        radial-gradient(circle 44vmax at 70% 64%, color-mix(in srgb, var(--lr-player-color-b) 68%, transparent), transparent),
        linear-gradient(rgba(10, 12, 14, .78), rgba(10, 12, 14, .82)) !important;
      animation:
        lr-glow-orbit 90s linear infinite,
        lr-glow-breathe 28s ease-in-out infinite alternate !important;
    }

    /* Let the glow show through the layers that used to be solid. */
    .Root,
    .Root__globalNav,
    .main-globalNav-root,
    .main-globalNav-barContainer,
    .Root__right-sidebar aside {
      background-color: transparent !important;
      background-image: none !important;
    }

    /* A blur over a smooth glow looks the same as no blur, but over a moving
       background it must be redone every frame. Off keeps Spotify light. */
    .Root__top-bar,
    .main-topBar-container,
    .main-topBar-background,
    [class*="topBar-container"],
    [data-testid="top-bar"],
    [data-testid="topbar"],
    .Root__nav-bar,
    #Desktop_LeftSidebar_Id,
    .main-yourLibraryX-library,
    [data-testid="left-sidebar"],
    .Root__right-sidebar,
    [data-testid="right-sidebar"],
    .main-nowPlayingView-nowPlayingWidget,
    [data-testid="now-playing-widget"],
    .main-card-card,
    [data-testid="playlist-card"],
    [data-testid="card"] {
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
    }

    /* Library sidebar: its glow is a separate canvas built from the playlist
       covers inside it (see the JS below). The sidebar clips and holds it. */
    #Desktop_LeftSidebar_Id,
    .Root__nav-bar,
    .main-yourLibraryX-library {
      position: relative !important;
      isolation: isolate !important;
      overflow: clip !important;
    }

    /* The page content sits on top of the glow with no tint of its own. */
    .main-view-container__scroll-node-child:has(.main-trackList-trackList),
    .main-view-container__scroll-node-child:has([data-testid="playlist-tracklist"]) {
      background: transparent !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
      border: 0 !important;
      box-shadow: none !important;
      padding-bottom: 24px !important;
    }

    /* The track list itself is plain black, with a feathered edge so it melts
       into the ambient glow instead of ending in a hard rectangle. */
    .main-trackList-trackList,
    [data-testid="playlist-tracklist"] {
      background-color: #0b0b0b !important;
      background-image: none !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
      border: 0 !important;
      border-radius: 28px !important;
      box-shadow: 0 0 32px 14px #0b0b0b !important;
    }

    /* Let the one page-level glass surface show through the header. */
    .main-entityHeader-container,
    .main-entityHeader-background,
    [data-testid="entity-header"] {
      background-color: transparent !important;
      background-image: none !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
      border-color: transparent !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }

    /* Table column labels stay a solid surface for clear, stable contrast. */
    .main-trackList-trackListHeader,
    .main-trackList-trackListHeaderRow,
    .main-trackList-trackListHeaderCell,
    [data-testid="tracklist-header"],
    [data-testid="tracklist-header"] [role="columnheader"],
    [data-testid="playlist-tracklist"] [role="columnheader"] {
      background-color: #292a2c !important;
      background-image: none !important;
      -webkit-backdrop-filter: none !important;
      backdrop-filter: none !important;
      border-bottom: 1px solid var(--lr-edge-soft) !important;
    }

    .main-trackList-trackListRow:hover,
    .main-trackList-row:hover,
    [data-testid="tracklist-row"]:hover {
      background-color: rgba(255,255,255,.075) !important;
      border-radius: 10px !important;
    }

    /* Playlist cards get a clear frame; keep the cover image itself crisp. */
    .main-card-card,
    [data-testid="playlist-card"],
    [data-testid="card"] {
      background-color: var(--lr-glass) !important;
      background-image: var(--lr-glass-sheen) !important;
      -webkit-backdrop-filter: blur(20px) saturate(165%);
      backdrop-filter: blur(20px) saturate(165%);
      border: 1px solid var(--lr-edge-soft) !important;
      border-radius: var(--lr-radius) !important;
      box-shadow: inset 0 1px 0 var(--lr-sheen), 0 8px 22px rgba(0,0,0,.15) !important;
      transition: background-color 140ms ease, border-color 140ms ease !important;
    }

    .main-card-card:hover,
    [data-testid="playlist-card"]:hover,
    [data-testid="card"]:hover {
      background-color: var(--lr-glass-hover) !important;
      border-color: var(--lr-edge) !important;
    }

    .main-card-card img,
    [data-testid="playlist-card"] img,
    [data-testid="card"] img,
    .main-nowPlayingView-nowPlayingWidget img,
    [data-testid="now-playing-widget"] img {
      border-radius: var(--lr-inner-radius) !important;
    }

    .main-nowPlayingView-nowPlayingWidget,
    [data-testid="now-playing-widget"] {
      color: var(--lr-text) !important;
      overflow: hidden;
      border-radius: var(--lr-radius) !important;
    }

    /* Spotify green marks the listening position as the single accent. */
    .playbackProgressbar-current,
    [data-testid="progress-bar"] [class*="progressBarProgress"] {
      background-color: var(--lr-accent) !important;
      box-shadow: 0 0 8px color-mix(in srgb, var(--lr-accent), transparent 58%);
    }

    @media (prefers-reduced-transparency: reduce) {
      .Root__top-bar,
      .main-topBar-container,
      [class*="topBar-container"],
      .Root__nav-bar,
      #Desktop_LeftSidebar_Id,
      .main-yourLibraryX-library,
      [data-testid="now-playing-widget"],
      .main-nowPlayingView-nowPlayingWidget,
      .main-nowPlayingBar-container,
      [class*="nowPlayingBar-container"],
      [data-testid="now-playing-bar"],
      .Root__right-sidebar,
      [data-testid="right-sidebar"],
      .main-card-card,
      [data-testid="playlist-card"],
      [data-testid="card"],
      .main-entityHeader-container,
      .main-trackList-trackList,
      [data-testid="playlist-tracklist"],
      .main-view-container__scroll-node-child:has(.main-trackList-trackList),
      .main-view-container__scroll-node-child:has([data-testid="playlist-tracklist"]) {
        background-color: rgba(24,25,28,.92) !important;
        background-image: none !important;
        -webkit-backdrop-filter: none;
        backdrop-filter: none;
      }
    }

    @media (prefers-contrast: more) {
      .Root__top-bar,
      .main-topBar-container,
      [class*="topBar-container"],
      .Root__nav-bar,
      #Desktop_LeftSidebar_Id,
      .main-yourLibraryX-library,
      [data-testid="now-playing-widget"],
      .main-nowPlayingView-nowPlayingWidget,
      .main-nowPlayingBar-container,
      [data-testid="now-playing-bar"],
      .Root__right-sidebar,
      [data-testid="right-sidebar"],
      .main-card-card,
      [data-testid="playlist-card"],
      [data-testid="card"] {
        border-color: rgba(255,255,255,.32) !important;
      }
    }
  `;

  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Disabling the sheet avoids adding/removing a class across Spotify's whole DOM.
  style.disabled = !enabled;

  const setEnabled = (value) => {
    enabled = value;
    style.disabled = !enabled;
    Spicetify.LocalStorage.set(STORAGE_KEY, String(enabled));
    libraryAmbience?.refresh();
    if (ambienceCanvas) ambienceCanvas.hidden = !enabled;
    if (enabled) {
      updateArtworkAmbience();
      updateCanvasSource();
    } else {
      stopCanvasLoop();
    }
    Spicetify.showNotification?.(`Liquid Glass ${enabled ? "on" : "off"}`);
  };

  const PLAYER_BAR_SELECTOR =
    '.main-nowPlayingBar-container, .Root__now-playing-bar, [data-testid="now-playing-bar"], [class*="nowPlayingBar-container"]';
  const SPOTIFY_CANVAS_SELECTOR =
    '.canvasVideoContainerNPV video, [data-npv-root] [data-canvas-surface] video';
  const paletteCache = new Map();
  let paletteRequest = 0;
  let ambienceCanvas = null;
  let ambienceContext = null;
  let ambienceVideo = null;
  let ambienceFrame = 0;
  let lastCanvasLookup = -Infinity;
  let lastCanvasDraw = -Infinity;
  let lastVideoTime = -1;

  const decoratePlayerBar = (bar) => {
    if (!bar) return null;
    bar.classList.add("lr-playerbar-dynamic");
    for (const child of bar.querySelectorAll("div")) {
      const rect = child.getBoundingClientRect();
      if (
        rect.width >= window.innerWidth * 0.72 &&
        rect.height >= 48 &&
        rect.height <= 150 &&
        rect.bottom >= window.innerHeight - 20 &&
        rect.top >= window.innerHeight - 180
      ) {
        child.classList.add("lr-playerbar-dynamic-surface");
      }
    }
    return bar;
  };

  const getPlayerBar = () => {
    const direct = document.querySelector(PLAYER_BAR_SELECTOR);
    if (direct) return decoratePlayerBar(direct);

    // Spotify has changed the player's class names several times. Find the
    // bottom playback bar from its visible cover image and its screen geometry.
    const height = window.innerHeight;
    const covers = [...document.querySelectorAll("img")]
      .map((image) => ({ image, rect: image.getBoundingClientRect() }))
      .filter(({ rect }) =>
        rect.width >= 36 &&
        rect.width <= 100 &&
        rect.height >= 36 &&
        rect.height <= 100 &&
        rect.top > height - 150 &&
        rect.bottom <= height + 2
      )
      .sort((a, b) => b.rect.bottom - a.rect.bottom);

    const cover = covers[0]?.image;
    if (!cover) return null;
    let node = cover.parentElement;
    while (node && node !== document.body) {
      const rect = node.getBoundingClientRect();
      if (
        rect.width >= window.innerWidth * 0.72 &&
        rect.height >= 48 &&
        rect.height <= 150 &&
        rect.bottom >= height - 20 &&
        rect.top >= height - 180
      ) {
        return decoratePlayerBar(node);
      }
      node = node.parentElement;
    }
    return null;
  };

  const ensureAmbienceCanvas = () => {
    const bar = getPlayerBar();
    if (!bar) return null;
    if (!ambienceCanvas || ambienceCanvas.parentElement !== bar) {
      ambienceCanvas?.remove();
      ambienceCanvas = document.createElement("canvas");
      ambienceCanvas.className = "lr-player-ambience-canvas";
      ambienceCanvas.width = 80;
      ambienceCanvas.height = 45;
      ambienceCanvas.setAttribute("aria-hidden", "true");
      ambienceCanvas.hidden = !enabled;
      ambienceContext = ambienceCanvas.getContext("2d", { alpha: false });
      bar.prepend(ambienceCanvas);
    }
    ambienceCanvas.hidden = !enabled;
    return ambienceCanvas;
  };

  const findCoverUrl = () => {
    const cover = getPlayerBar()?.querySelector("img");
    const item = Spicetify.Player.data?.item;
    const candidates = [
      cover?.currentSrc,
      cover?.src,
      item?.images?.find((image) => image.label === "large")?.url,
      item?.images?.[0]?.url,
      item?.album?.images?.[0]?.url,
      item?.metadata?.image_xlarge_url,
      item?.metadata?.image_url,
    ];
    return candidates.find((value) => {
      if (!value) return false;
      try {
        const url = new URL(value, window.location.href);
        return url.protocol === "https:" && url.hostname === "i.scdn.co";
      } catch (_) {
        return false;
      }
    }) ?? null;
  };

  const imageUriFor = (coverUrl) => {
    try {
      const url = new URL(coverUrl, window.location.href);
      const id = url.pathname.match(/\/image\/([^/]+)/)?.[1];
      return id ? `spotify:image:${id}` : null;
    } catch (_) {
      return null;
    }
  };

  const asRgb = (color) => {
    if (!color) return null;
    const red = Math.max(0, Math.min(255, Math.round(color.red)));
    const green = Math.max(0, Math.min(255, Math.round(color.green)));
    const blue = Math.max(0, Math.min(255, Math.round(color.blue)));
    return `rgb(${red} ${green} ${blue})`;
  };

  const setPlayerPalette = (first, second) => {
    const bar = getPlayerBar();
    const targets = [document.documentElement, bar].filter(Boolean);
    for (const target of targets) {
      target.style.setProperty("--lr-player-color-a", first);
      target.style.setProperty("--lr-player-color-b", second);
    }
  };

  const updatePlayerPalette = async (coverUrl) => {
    const requestId = ++paletteRequest;
    const imageUri = imageUriFor(coverUrl);
    if (!imageUri) return;
    const cached = paletteCache.get(imageUri);
    if (cached) {
      setPlayerPalette(cached[0], cached[1]);
      return;
    }

    const graphQL = Spicetify.GraphQL;
    const definition = graphQL?.Definitions?.getDynamicColorsByUris;
    if (!definition || typeof graphQL.Request !== "function") return;

    try {
      const response = await graphQL.Request(definition, { imageUris: [imageUri] });
      if (requestId !== paletteRequest) return;
      const colors = response?.data?.dynamicColors?.[0];
      const bestFit = colors?.[colors.bestFit === "LIGHT" ? "light" : "dark"];
      const primary = asRgb(bestFit?.highContrast?.backgroundBase ?? colors?.dark?.highContrast?.backgroundBase);
      const secondary = asRgb(colors?.dark?.higherContrast?.backgroundBase ?? bestFit?.minContrast?.backgroundBase);
      if (!primary || !secondary) return;
      paletteCache.set(imageUri, [primary, secondary]);
      if (paletteCache.size > 32) paletteCache.delete(paletteCache.keys().next().value);
      setPlayerPalette(primary, secondary);
    } catch (_) {
      // Keep the moving fallback gradient when Spotify has no dynamic-color result.
    }
  };

  let artworkUpdateQueued = false;
  const updateArtworkAmbience = () => {
    if (!enabled) return;
    if (artworkUpdateQueued) return;
    artworkUpdateQueued = true;
    window.requestAnimationFrame(() => {
      artworkUpdateQueued = false;
      const coverUrl = findCoverUrl();
      if (!coverUrl) return;
      const safeUrl = new URL(coverUrl, window.location.href).href;
      const cssUrl = `url("${safeUrl.replace(/["\\\n\r]/g, "")}")`;
      document.documentElement.style.setProperty("--lr-player-artwork", cssUrl);
      ensureAmbienceCanvas();
      void updatePlayerPalette(safeUrl);
      lastVideoTime = -1;
      drawCanvasAmbience(performance.now());
    });
  };

  const drawCanvasAmbience = (timestamp) => {
    if (!enabled || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!ambienceCanvas?.isConnected) ensureAmbienceCanvas();
    if (timestamp - lastCanvasLookup > 500 || !ambienceVideo?.isConnected) {
      lastCanvasLookup = timestamp;
      ambienceVideo = document.querySelector(SPOTIFY_CANVAS_SELECTOR);
    }

    const video = ambienceVideo;
    if (video && ambienceContext && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      if (timestamp - lastCanvasDraw >= 1000 / 30 && video.currentTime !== lastVideoTime) {
        try {
          ambienceContext.drawImage(video, 0, 0, ambienceCanvas.width, ambienceCanvas.height);
          lastCanvasDraw = timestamp;
          lastVideoTime = video.currentTime;
        } catch (_) {
          // Leave the palette animation visible if a Canvas frame cannot be drawn.
        }
      }
      if (!video.paused) ambienceFrame = window.requestAnimationFrame(drawCanvasAmbience);
    }
  };

  const stopCanvasLoop = () => {
    if (ambienceFrame) window.cancelAnimationFrame(ambienceFrame);
    ambienceFrame = 0;
  };

  const startCanvasLoop = () => {
    if (!ambienceFrame && enabled && !document.hidden) {
      ambienceFrame = window.requestAnimationFrame(drawCanvasAmbience);
    }
  };

  const updateCanvasSource = () => {
    if (!enabled) return;
    ambienceVideo = document.querySelector(SPOTIFY_CANVAS_SELECTOR);
    if (ambienceVideo && !ambienceVideo.paused) startCanvasLoop();
  };

  const retryCanvasLookup = () => {
    window.setTimeout(updateCanvasSource, 350);
    window.setTimeout(updateCanvasSource, 1000);
    window.setTimeout(updateCanvasSource, 2000);
  };

  const observedPlayerBars = new WeakSet();
  const observePlayerArtwork = () => {
    const bar = getPlayerBar();
    if (!bar || observedPlayerBars.has(bar)) return;
    observedPlayerBars.add(bar);
    const observer = new MutationObserver(updateArtworkAmbience);
    observer.observe(bar, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });
  };

  updateArtworkAmbience();
  updateCanvasSource();
  observePlayerArtwork();
  Spicetify.Player.addEventListener("songchange", () => {
    updateArtworkAmbience();
    observePlayerArtwork();
    updateCanvasSource();
    retryCanvasLookup();
  });
  Spicetify.Player.addEventListener("onplaypause", updateCanvasSource);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCanvasLoop();
    else updateCanvasSource();
  });

  // Library glow: a tiny canvas behind the Your Library list. Each playlist cover
  // is drawn small at its own position; CSS blur turns that into soft color.
  // (Drawing cross-origin images is allowed; only reading pixels back is not.)
  libraryAmbience = (() => {
    const HOSTS = ["#Desktop_LeftSidebar_Id", ".Root__nav-bar", ".main-yourLibraryX-library"];
    const SCALE = 0.25;
    const PAD = 5;
    const canvas = document.createElement("canvas");
    canvas.className = "lr-library-ambience";
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      zIndex: "-1",
      pointerEvents: "none",
      filter: "blur(14px) saturate(1.7)", // blur strength
      opacity: ".6", // overall strength
    });
    const ctx = canvas.getContext("2d");
    let host = null;
    let queued = false;

    const draw = () => {
      queued = false;
      if (!host?.isConnected) return;
      canvas.hidden = !enabled;
      if (!enabled) return;
      const hr = host.getBoundingClientRect();
      if (!hr.width || !hr.height) return;
      const w = Math.max(1, Math.round(hr.width * SCALE));
      const h = Math.max(1, Math.round(hr.height * SCALE));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      for (const img of host.querySelectorAll("img")) {
        if (!img.complete || !img.naturalWidth) continue;
        const r = img.getBoundingClientRect();
        if (r.width < 24 || r.bottom < hr.top || r.top > hr.bottom) continue;
        try {
          ctx.drawImage(
            img,
            (r.left - hr.left) * SCALE - PAD,
            (r.top - hr.top) * SCALE - PAD,
            r.width * SCALE + PAD * 2,
            r.height * SCALE + PAD * 2
          );
        } catch (_) {
          // Skip an image that can't be drawn.
        }
      }
    };

    const schedule = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(draw);
    };

    const observer = new MutationObserver(schedule);
    const resizer = new ResizeObserver(schedule);

    const attach = () => {
      const found = HOSTS.map((selector) => document.querySelector(selector)).find(Boolean);
      if (!found) return;
      if (found !== host) {
        observer.disconnect();
        resizer.disconnect();
        host = found;
        observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset"] });
        resizer.observe(host);
        host.addEventListener("scroll", schedule, true);
        host.addEventListener("load", schedule, true);
      }
      if (canvas.parentElement !== host) host.prepend(canvas);
      schedule();
    };

    attach();
    window.setInterval(attach, 1500); // the sidebar can re-render; re-attach if so
    return { refresh: schedule };
  })();

  const icon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
    <path d="M4 8.2c5.3-1.6 10.7-.9 15.7 2M5.2 12c4.2-1.2 8.8-.6 12.7 1.7M6.3 15.6c3.2-.8 6.6-.3 9.6 1.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  </svg>`;

  new Spicetify.Topbar.Button(
    "Listening Room · toggle Liquid Glass",
    icon,
    () => setEnabled(!enabled)
  );
})();
