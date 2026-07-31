'use client';

// R36 (amended) / HIM-360 Meta Pixel client half. This repo (Jaring) has no
// dedicated GTM component file — GTM is wired inline as a server component in
// src/app/layout.tsx — so the pixel client ships as its own client component
// here rather than forcing layout.tsx into a client component. Mounted in
// layout.tsx immediately after the existing GTM noscript block.

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { META_PIXEL_ID, trackPageView, trackLead, type LeadMethod } from '@/lib/analytics';

const WA_PATTERN = /wa\.me|api\.whatsapp\.com|^whatsapp:/i;

function leadMethodFromHref(href: string): LeadMethod | null {
  if (WA_PATTERN.test(href)) return 'whatsapp';
  if (href.startsWith('mailto:')) return 'email';
  if (href.startsWith('tel:')) return 'phone';
  return null;
}

function labelFromAnchor(anchor: Element): string {
  const explicit =
    anchor.getAttribute('data-track') || anchor.getAttribute('aria-label');
  if (explicit) return explicit;
  const text = (anchor.textContent || '').replace(/\s+/g, ' ').trim();
  if (text) return text.slice(0, 80);
  return 'cta';
}

// R36/HIM-360 Meta Pixel client. Loads the Meta Pixel only when META_PIXEL_ID
// is set (no-op otherwise), fires PageView on every route change, and listens
// globally for WhatsApp/email/phone clicks to fire Lead/Contact.
export function MetaPixelClient() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView();
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.type === 'auxclick' && event.button !== 1) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!anchor) return;
      const method = leadMethodFromHref(anchor.getAttribute('href') || '');
      if (!method) return;
      trackLead(method, `${labelFromAnchor(anchor)} (${window.location.pathname})`);
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('auxclick', onClick, true);
    };
  }, []);

  if (!META_PIXEL_ID) return null;

  return (
    <>
      {/* Creates the stub (if not present) and loads fbevents.js. fbq('init')
          is called from src/lib/analytics.ts so the init queue always precedes
          the first event. */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(!f.fbq){n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
