/* v3 */
/*
 * sw-icons.js — Service Worker: intercept solid-ui GitHub icon requests
 *
 * solid-ui loads all icons from two URL patterns on GitHub:
 *
 *   1. iconBase (noun-project SVGs):
 *      https://solidos.github.io/solid-ui/src/icons/<name>.svg
 *      → intercepted and served from /icons/<name>.svg
 *        (mapped via symlinks in custom/icons/: noun_*.svg → ph-*.svg)
 *
 *   2. originalIconBase (legacy PNGs):
 *      https://solidos.github.io/solid-ui/src/icons/originalIcons/<name>.png
 *      → mapped via ORIGINAL_ICONS_MAP below to a Phosphor SVG and
 *        served from /icons/<phosphor-name>.svg with SVG content-type.
 *
 * If our version returns a non-OK response the original GitHub URL is
 * tried as a fallback (graceful degradation for unmapped icons).
 *
 * Icon mapping is maintained via:
 *   - Symlinks in custom/icons/ for the noun-project icons
 *   - ORIGINAL_ICONS_MAP below for the originalIcons/ PNG names
 */

const ICON_ORIGIN      = 'https://solidos.github.io';
const ICON_PATH_PREFIX = '/solid-ui/src/icons/';
const ORIGINAL_PREFIX  = 'originalIcons/';

/*
 * Maps originalIcons/<filename> → /icons/<phosphor-svg>
 *
 * Only the icons that appear in the DataBrowser UI are listed here;
 * any unmapped icon falls back to GitHub gracefully.
 */
const ORIGINAL_ICONS_MAP = {
  // Outliner tree expand / collapse controls
  'tbl-expand-trans.png': 'ph-caret-right.svg',
  'tbl-collapse.png':     'ph-caret-down.svg',
  'tbl-more-trans.png':   'ph-caret-right.svg',  // "View more" (same semantics as expand)
  'tbl-shrink.png':       'ph-caret-up.svg',      // "Shrink list"
  'tbl-rows.png':         'ph-table.svg',          // "Make a table of data like this"
  'tbl-x-small.png':      'ph-x.svg',              // Remove / close

  // Tango / system icons used in pane headers
  'tango/22-folder-open.png':    'ph-folder-open.svg',
  'tango/22-emblem-system.png':  'ph-wrench.svg',
  'tango/22-list-add.png':       'ph-plus.svg',
  'tango/22-list-add-new.png':   'ph-plus.svg',
  'tango/22-text-x-generic.png': 'ph-file-text.svg',
  'tango/22-text-xml4.png':      'ph-file-code.svg',
  'tango/22-help-browser.png':   'ph-warning-circle.svg',
};

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (
    url.origin === ICON_ORIGIN &&
    url.pathname.startsWith(ICON_PATH_PREFIX)
  ) {
    const iconName = url.pathname.slice(ICON_PATH_PREFIX.length);

    // ── originalIcons/ mapping ─────────────────────────────────────────────
    if (iconName.startsWith(ORIGINAL_PREFIX)) {
      const baseName  = iconName.slice(ORIGINAL_PREFIX.length);
      const phosphor  = ORIGINAL_ICONS_MAP[baseName];

      if (phosphor) {
        event.respondWith(
          fetch('/icons/' + phosphor)
            .then(response => {
              if (!response.ok) return fetch(event.request);
              // Fully buffer the body, then re-wrap with explicit
              // image/svg+xml so the browser renders it as vector even
              // though the original request URL ends in .png
              return response.blob().then(blob => new Response(blob, {
                status:  response.status,
                headers: {
                  'Content-Type':  'image/svg+xml',
                  'Cache-Control': 'public, max-age=86400',
                },
              }));
            })
            .catch(() => fetch(event.request))
        );
        return;
      }
    }

    // ── noun-project SVG mapping ───────────────────────────────────────────
    // Simply proxy to /icons/<same-name>; symlinks in custom/icons/ handle
    // the noun_*.svg → ph-*.svg mapping transparently.
    const localUrl = '/icons/' + iconName;

    event.respondWith(
      fetch(localUrl)
        .then(response => {
          if (response.ok) return response;
          return fetch(event.request);
        })
        .catch(() => fetch(event.request))
    );
  }
});
