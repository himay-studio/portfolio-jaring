/* R36 (amended) / HIM-360 tracking config source.

   This repo (Jaring) had no dedicated site-config file: GTM_ID and
   PORTFOLIO_CATEGORY previously lived only as local consts inline in
   src/app/layout.tsx (see history). src/lib/analytics.ts (the new Meta
   Pixel + CAPI client half) needs a shared import for both values, so this
   file exists purely to mirror layout.tsx's existing hardcoded values —
   it does not replace or restructure layout.tsx's own GTM script wiring.

   Keep these two values byte-identical to the consts in layout.tsx
   (GTM_ID and PORTFOLIO_CATEGORY) if either ever changes. */

export const TRACKING = {
  gtmId: 'GTM-WZJZTSKG',
  category: 'b2b-saas',
} as const;
