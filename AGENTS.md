<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Brand colors exist only as CSS variables in `src/styles.css` (dark theme on `.dark`, the default; light in `:root`); components use semantic utilities, never raw color values, so the theme toggle and rebrands stay one-file changes.
- Brand visuals are code or static files: logo/symbol/wordmark are SVG React components (`src/components/foodup/Logo.tsx`), the mascot is served from `public/brand/` via `<Mascot />` with webp + png fallback and fixed dimensions to avoid layout shift.
- Pricing and order-simulation rules live in pure modules (`src/lib/pricing.ts`, `src/lib/simulation.ts`) shared by client and server; the server recomputes totals on order placement, so clients never write orders directly.
- Orders, order items and status events are written only by server functions with the admin client after ownership checks; users have read-only access via RLS.
- Leaflet maps are loaded lazily behind `ClientOnly` (`src/components/map/index.tsx`) because Leaflet touches `window` at import time.
- Signed-in screens live under `src/routes/_authenticated/` (client-only gate); cart and selected address persist in zustand stores.
- Bottom-nav tabs are defined once in `NAV_ITEMS` (`BottomNav.tsx`) and covered by `src/test/navigation.test.ts`; pages not in the nav (basket, saved, offers) stay reachable via the floating basket button and Profile shortcuts, so no screen becomes orphaned.
- App icons in `public/` are rasterized from the symbol SVG (full-bleed, maskable-safe) rather than hand-edited, so favicon, manifest and touch icons stay identical.
