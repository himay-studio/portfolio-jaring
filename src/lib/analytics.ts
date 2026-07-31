// R36 (amended) tracking plumbing, client half: Meta Pixel (browser) + Meta CAPI
// (server, via functions/api/meta-events.ts). GTM/GA4 already live elsewhere
// (this repo's existing GTM head/noscript component) and are untouched here.
//
// No-op-safe: when NEXT_PUBLIC_META_PIXEL_ID is unset the client pixel never
// mounts and this file's calls are all silent no-ops. The build/deploy never
// fails either way.
//
// Every Meta event uses one shared event_id for both the browser pixel hit and
// the server CAPI hit, so Meta deduplicates them into a single event.
//
// HIM-360 fast-follow of HIM-356: every visit carries the site's category
// (open string, e.g. "ecommerce") on the Pixel params, CAPI custom_data, and
// the GTM dataLayer push under the identical key `portfolio_category`. When
// the category is absent this contributes nothing to any channel (no empty
// string, no `undefined` key), per R36's no-op-safe contract.
//
// Pattern frozen on the portfolio-kirana pilot (HIM-360), copied verbatim from
// the portfolio-bersihara reference (src/lib/analytics.ts, HIM-356).
//
// ADAPT ONLY: the import at the top pulling in this repo's own GTM-id/category
// source (name it may be `TRACKING` from "@/data/site", or `siteConfig`, or
// something else — match whatever this specific repo already uses). Every
// other line below, including the `portfolio_category` field name, is
// COPY VERBATIM, do not rename or restructure anything else.

import { TRACKING } from "@/data/site";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: unknown;
  loaded: boolean;
  version: string;
};

export type QueuedLeadClick = { href: string; label: string };

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
    dataLayer?: unknown[];
  }
}

let metaInitDone = false;

// Builds the fbq stub queue exactly like the official Meta snippet, then calls
// fbq('init') exactly once. init is guaranteed to enter the queue before the
// first event regardless of the order of React effects and fbevents.js loading.
function ensureMetaBootstrap(): FbqFn | null {
  if (typeof window === "undefined" || !META_PIXEL_ID) return null;
  if (!window.fbq) {
    const stub = function (...args: unknown[]) {
      if (stub.callMethod) {
        stub.callMethod(...args);
      } else {
        stub.queue.push(args);
      }
    } as FbqFn;
    stub.queue = [];
    stub.push = stub;
    stub.loaded = true;
    stub.version = "2.0";
    window.fbq = stub;
    if (!window._fbq) window._fbq = stub;
  }
  if (!metaInitDone) {
    metaInitDone = true;
    window.fbq("init", META_PIXEL_ID);
  }
  return window.fbq;
}

function fbq(...args: unknown[]) {
  const fn = ensureMetaBootstrap();
  if (!fn) return;
  const command = args[0];
  if (command === "track" || command === "trackCustom") {
    const name = args[1];
    if (typeof name !== "string" || name.trim() === "") return;
  }
  fn(...args);
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ev.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function readFbc(): string {
  const cookie = readCookie("_fbc");
  if (cookie) return cookie;
  const fbclid =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("fbclid")
      : null;
  if (!fbclid) return "";
  return `fb.1.${Date.now()}.${fbclid}`;
}

function resolveFbp(deadlineMs = 1000): Promise<string> {
  const immediate = readCookie("_fbp");
  if (immediate) return Promise.resolve(immediate);
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const value = readCookie("_fbp");
      if (value || Date.now() - start >= deadlineMs) {
        resolve(value);
      } else {
        setTimeout(tick, 150);
      }
    };
    setTimeout(tick, 150);
  });
}

function sendServerEvent(
  eventName: string,
  eventId: string,
  customData?: Record<string, string | undefined>
) {
  if (typeof window === "undefined" || !META_PIXEL_ID) return;
  const fbc = readFbc() || undefined;
  const eventSourceUrl = window.location.href;
  resolveFbp().then((fbp) => {
    try {
      fetch("/api/meta-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          event_name: eventName,
          event_id: eventId,
          event_source_url: eventSourceUrl,
          fbp: fbp || undefined,
          fbc,
          custom_data: customData,
        }),
      }).catch(() => {});
    } catch {
      // fetch can throw synchronously in old browsers; ignore.
    }
  });
}

function pushDataLayer(payload: Record<string, unknown>) {
  if (typeof window === "undefined" || !TRACKING.gtmId) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

function currentPagePath(): string {
  return typeof window !== "undefined" ? window.location.pathname : "";
}

function categoryData(): { portfolio_category: string } | undefined {
  const category = TRACKING.category as string | null | undefined;
  return category ? { portfolio_category: category } : undefined;
}

export type LeadMethod = "whatsapp" | "email" | "phone";

export function trackPageView() {
  const eventId = newEventId();
  const cat = categoryData();
  fbq("track", "PageView", cat ?? {}, { eventID: eventId });
  sendServerEvent("PageView", eventId, cat);
  pushDataLayer({
    event: "himay_page_view",
    page_path: currentPagePath(),
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    page_title: typeof document !== "undefined" ? document.title : undefined,
    ...cat,
  });
}

let lastLeadKey = "";
let lastLeadAt = 0;

export function trackLead(method: LeadMethod, sourceLabel: string) {
  const key = `${method}|${sourceLabel}`;
  const now = Date.now();
  if (key === lastLeadKey && now - lastLeadAt < 1500) return;
  lastLeadKey = key;
  lastLeadAt = now;

  const cat = categoryData();
  const params = {
    content_name: sourceLabel,
    content_category: method,
    ...cat,
  };
  const eventId = newEventId();
  const path = currentPagePath();
  if (method === "whatsapp") {
    fbq("track", "Lead", params, { eventID: eventId });
    sendServerEvent("Lead", eventId, params);
    pushDataLayer({
      event: "generate_lead",
      lead_method: "whatsapp",
      content_name: sourceLabel,
      content_category: method,
      source: sourceLabel,
      page_path: path,
      ...cat,
    });
  } else {
    fbq("track", "Contact", params, { eventID: eventId });
    sendServerEvent("Contact", eventId, params);
    pushDataLayer({
      event: "contact",
      contact_method: method,
      content_name: sourceLabel,
      content_category: method,
      source: sourceLabel,
      page_path: path,
      ...cat,
    });
  }
}
