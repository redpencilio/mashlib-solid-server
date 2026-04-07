# Mashlib / SolidOS Theming — redpencil.io

This document records every intentional decision made while theming the
Community Solid Server + Mashlib DataBrowser to match the redpencil.io brand.

---

## File Map

| File | Purpose |
|------|---------|
| `custom/redpencil-theme.css` | DataBrowser (mashlib) brand overrides — loaded after `mash.css` |
| `custom/idp-theme.css` | IDP page brand overrides — served as `/.well-known/css/styles/main.css` |
| `custom/databrowser.html` | Custom shell page (marketing landing + DataBrowser toggle) |
| `custom/sw-icons.js` | Service Worker that replaces noun-project icons with Phosphor icons |
| `custom/icons/` | Phosphor SVGs + symlinks mapping noun-project filenames → Phosphor |

---

## Design Tokens

Defined in `redpencil-theme.css` as CSS custom properties on `:root`:

```css
--color-primary:          #FB5353;   /* redpencil red */
--color-primary-dark:     #e03c3c;
--color-text:             #18181b;   /* zinc-900 */
--color-text-secondary:   #52525b;   /* zinc-600 */
--color-border:           #d4d4d8;   /* zinc-300 */
--color-border-light:     #e4e4e7;   /* zinc-200 */
--color-nav-block-bg:     #f4f4f5;   /* zinc-100 */
--color-section-bg:       #f9f9fb;
--color-hover-bg:         #f4f4f5;
--font-family-base:       'Lexend Deca', -apple-system, sans-serif;
--border-radius-base:     0.375rem;
```

The IDP theme (`idp-theme.css`) duplicates these as `--red`, `--text`, etc. to
keep the two files independent (IDP loads without `redpencil-theme.css`).

---

## CSS Override Strategy

### Why `!important` throughout

Mashlib (`mash.css`) and solid-ui set many rules at high specificity or with
`!important`. Our overrides are loaded *after* `mash.css`, so `!important` is
needed to guarantee our rules win.

### Inline style overrides

solid-ui mutates element style attributes at runtime via `onmouseover` /
`onmouseout` event handlers (e.g., setting `background-image:
linear-gradient(#7C4DFF …)` on menu-item hover). CSS `!important` still wins
over inline styles, so the pattern works:

```css
/* Matches any element that currently has this substring in its style attr */
button:not(.btn-primary)[style*="background-color: #7c4dff"] {
  background-color: var(--color-primary) !important;
}
```

**Important nuance — specificity with `!important`:** when two `!important`
rules conflict the one with *higher specificity* wins, not the later one.
An attribute selector (`[style*="…"]`) gives specificity 0-1-0 (one attribute),
raising a `button[style*="…"]` rule to 0-1-1. A class selector `.btn-primary`
is also 0-1-0. So `button[style*="…"]` (0-1-1) beats `.btn-primary` (0-1-0).

Fix: guard all text-color attribute selectors with `:not(.btn-primary)` and add
a dedicated `.btn-primary[style]` rule at 0-1-1 to lock in white text:

```css
button.btn-primary[style] {
  background-color: var(--color-primary) !important;
  color: #ffffff !important;
  border-color: var(--color-primary) !important;
}
```

### Tab selected-state detection

solid-ui's `tabs.js` sets `opacity: 50%` as an inline style on *unselected*
tabs; selected tabs have no `opacity` in their style attribute.

```css
/* Selected tab */
#outline nav ul li button:not([style*="opacity"]) { … }

/* Unselected tab (after a click) */
#outline nav ul li button[style*="opacity"] { … }
```

### Purple gradient kill

solid-ui's `headerUserMenuButtonHover` sets a full inline `background-image:
linear-gradient(…#7C4DFF…)` on menu items. Killing it requires both:

1. A baseline `background-image: none !important` on the element in its normal state.
2. An attribute-selector rule that targets the element *while the JS has injected
   the inline gradient*:

```css
#loggedInNav [style*="linear-gradient"],
#helperNav  [style*="linear-gradient"] {
  background-image: none !important;
  background-color: var(--color-hover-bg) !important;
}
```

### White-on-white widget buttons

solid-ui's `buttonStyle` uses `border: .01em solid white`. On a white page
these buttons are invisible. Fix:

```css
button[style*="border: .01em solid white"] {
  border-color: var(--color-border) !important;
}
```

---

## Icon Replacement System

### The problem

solid-ui hard-codes icon URLs to `https://solidos.github.io/solid-ui/src/icons/<name>.svg`
at module initialisation time (before `DOMContentLoaded`). A runtime JS override
of `iconBase` cannot change URLs already embedded in pane descriptors.

### The solution — Service Worker intercept

`sw-icons.js` intercepts every request to `solidos.github.io/solid-ui/src/icons/*`
and serves our local `/icons/<name>` instead. If the local version returns a
non-OK response, the original GitHub URL is fetched as a fallback.

Registration is in `databrowser.html` (before `mashlib.min.js` defers):

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw-icons.js', { scope: '/' })
      .catch(err => console.warn('[sw-icons] registration failed:', err));
  }
</script>
```

**First-load caveat:** the SW must install before it can intercept. On the very
first visit the browser still fetches icons from GitHub. Every subsequent load
uses local Phosphor icons.

### Icon palette — Phosphor Icons

Chosen over alternatives (Heroicons, Lucide, Tabler, Feather) because:

- **MIT license** — no attribution requirement in CSS/HTML
- **Friendly, rounded aesthetic** — approachable rather than sharp/corporate
- **`fill="currentColor"`** — SVG color is controlled by the CSS `color`
  property, no CSS `filter` hacks required
- **Large catalogue** — 1300+ icons, every noun-project icon has a reasonable match
- **Multiple weights** — "Regular" weight used throughout for consistency

Source: `@phosphor-icons/core@2.1.1`, regular weight SVGs.

### File organisation

```
custom/icons/
  ph-squares-four.svg          ← actual Phosphor SVG
  noun_547570.svg -> ph-squares-four.svg   ← symlink (noun-project alias)
  …
```

Symlinks serve as living documentation: `ls -la custom/icons/` immediately shows
which Phosphor icon each noun-project filename resolves to.

### originalIcons/ → Phosphor mapping

`originalIconBase` resolves to `https://solidos.github.io/solid-ui/src/icons/originalIcons/`.
These are legacy PNGs (Tango, custom sprites) also intercepted by the SW.
The SW re-wraps the fetched SVG in a synthetic `Response` with
`Content-Type: image/svg+xml` so the browser renders it as vector
regardless of the `.png` filename in the URL.

Mapping is in `sw-icons.js` under `ORIGINAL_ICONS_MAP`:

| originalIcons filename | Phosphor target | Context |
|------------------------|-----------------|---------|
| `tbl-expand-trans.png` | `ph-caret-right.svg` | Outliner expand (collapsed) |
| `tbl-collapse.png` | `ph-caret-down.svg` | Outliner collapse (expanded) |
| `tbl-more-trans.png` | `ph-caret-right.svg` | View more |
| `tbl-shrink.png` | `ph-caret-up.svg` | Shrink list |
| `tbl-rows.png` | `ph-table.svg` | Make table view |
| `tbl-x-small.png` | `ph-x.svg` | Remove |
| `tango/22-folder-open.png` | `ph-folder-open.svg` | Folder pane |
| `tango/22-emblem-system.png` | `ph-wrench.svg` | System / settings |
| `tango/22-list-add.png` | `ph-plus.svg` | Add item |
| `tango/22-list-add-new.png` | `ph-plus.svg` | Add new |
| `tango/22-text-x-generic.png` | `ph-file-text.svg` | Generic file |
| `tango/22-text-xml4.png` | `ph-file-code.svg` | XML / code file |
| `tango/22-help-browser.png` | `ph-warning-circle.svg` | Help |

### Noun-project → Phosphor mapping

| Noun-project filename | Phosphor target | Context |
|----------------------|-----------------|---------|
| `noun_547570.svg` | `ph-squares-four.svg` | Dashboard |
| `noun_973694_expanded.svg` | `ph-folder-open.svg` | Contents (open) |
| `noun_973694.svg` | `ph-folder.svg` | Contents (closed) |
| `noun_109873.svg` | `ph-code.svg` | Source / raw data |
| `padlock-timbl.svg` | `ph-lock-simple.svg` | Sharing / access |
| `noun_1689339.svg` | `ph-chats.svg` | Long chat |
| `noun_344563.svg` | `ph-wrench.svg` | Settings |
| `noun_243787.svg` | `ph-dots-three.svg` | More / tools |
| `noun_1180156.svg` | `ph-x.svg` | Cancel / close |
| `noun_1180158.svg` | `ph-check.svg` | Confirm / continue |
| `noun_383448.svg` | `ph-paper-plane-right.svg` | Send |
| `noun_339237.svg` | `ph-users.svg` | Participants |
| `noun_253504.svg` | `ph-pencil-simple.svg` | Edit |
| `noun_25830.svg` | `ph-paperclip.svg` | Attachment |
| `noun_748003.svg` | `ph-upload-simple.svg` | Upload |
| `noun_925021.svg` | `ph-trash.svg` | Delete |
| `noun_15695.svg` | `ph-pulse.svg` | Activity streams |
| `noun_Sliders_341315_000000.svg` | `ph-sliders.svg` | Preferences |

*(See `custom/icons/` for the complete list.)*

### CSS static asset registration

CSS v7's `StaticAssetHandler` requires one `StaticAssetEntry` per file — no
directory-level serving. Every icon (real SVG + every symlink) is registered
individually in `app-solid/config/solid/file_based/mashlib-files.json`.

### Icon colour

Phosphor SVGs use `fill="currentColor"`. Set icon colour via the CSS `color`
property (no `filter` needed):

```css
img[src^="/icons/"],
img[src*="solidos.github.io/solid-ui/src/icons/"] {
  color: var(--color-text-secondary);
}
```

---

## Marketing Landing Page

`databrowser.html` shows two views:

- **`#marketing-page`** — shown when the user is not logged in *and* is at `/`
- **`#databrowser-page`** — shown when logged in, or at any non-root path

`authn.checkUser()` resolves after `DOMContentLoaded` (mashlib deferred); the
script switches `display` accordingly.

The "Sign in" buttons call `doLogin()` which reads `loginIssuer` from
`localStorage` (pre-seeded to `window.location.origin + '/'`) and calls
`SolidLogic.authSession.login(…)`.

A `window.open` override redirects the solid-ui "get a pod" link to this
server's own `/idp/register/` page.

---

## IDP Page Theming (`idp-theme.css`)

Served as `/.well-known/css/styles/main.css` (configured in CSS v7 IDP
template config). Completely replaces the default CSS v7 stylesheet.

Key decisions:

- **Header logo hidden**, replaced with `::before` (red dot) + `::after`
  (`solid.redpencil.io` text) pseudo-elements on `header h1`
- **Account dashboard** detected via `main:has(#logout)` — wider, top-aligned layout
- **Form cards** scoped to `#authenticating`, `#not-authenticating`,
  `#input-partial`, `#response-partial`
- **Consent page** `dl#client` uses CSS grid for term/definition alignment
- **Breadcrumbs** styled as inline list with `>` separators; last item red

---

## Known Limitations

1. **SW first-load**: icons show from GitHub on first visit; Phosphor on reload.
2. **New solid-ui icons**: if solid-ui adds new icon names, they fall back to
   GitHub gracefully, but won't receive Phosphor styling until a symlink + SVG
   + `StaticAssetEntry` is added.
3. **Inline style overrides are brittle**: attribute selectors like
   `[style*="background-color: #7c4dff"]` break if solid-ui changes the exact
   colour string. Check `solid-ui.esm.js` after upgrades.
4. **Tab selected-state selector**: relies on solid-ui injecting `opacity: 50%`
   on unselected tabs. Verify after solid-ui upgrades.
