/* R36 (amended), server side half of the Meta tracking pair (Cloudflare Pages Function).

   The client Pixel and this endpoint send the SAME event id so Meta deduplicates the pair.
   META_PIXEL_ID stays a per-project Pages environment variable. The CAPI access token is no
   longer read here: it is centralized in the `himay-meta-capi` Worker and reached through the
   TRACKING_CORE service binding, so no per-project secret exists to leak or rotate. When either
   META_PIXEL_ID or the TRACKING_CORE binding is absent this returns 204 and does nothing: the
   deploy never fails, nothing throws, and no request is made upstream. That is the required
   no op safe behaviour, unchanged from before the migration.

   Request contract to the Worker: POST JSON `{ pixel_id, ...capiEventPayload }` where
   capiEventPayload is the Meta CAPI body shape (`{ data: [...] }`). The Worker forwards to
   `graph.facebook.com/{pixel_id}/events` and returns Meta's status/body as is. The Worker's
   response status is surfaced back here on an `x-tracking-core-status` response header only,
   purely so the binding hop can be verified from the served response without changing the
   always 204 contract real visitors get.

   Incoming body key names vary per site (this rolled out to 24 repos built at different times):
   some clients send `eventID`, some `eventId`, some the raw Meta `event_id` snake_case shape,
   plus assorted extra top level fields (value, currency, fbp, fbc). Rather than force every
   site's client back in sync one by one, this endpoint accepts the common aliases and folds
   anything unrecognized into custom_data, so real client traffic keeps working exactly as each
   site already wired it AND the camelCase QA probe shape from this rollout's own ticket
   (eventName/eventID/eventSourceUrl/customData) both land on the same code path.

   This file is deliberately dependency free so it works on the Pages Functions runtime as is. */

interface Fetcher {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}

interface Env {
  META_PIXEL_ID?: string;
  TRACKING_CORE?: Fetcher;
}

type Ctx = {
  request: Request;
  env: Env;
};

type Incoming = Record<string, unknown>;

function pick(body: Incoming, ...keys: string[]): unknown {
  for (const key of keys) {
    if (body[key] !== undefined && body[key] !== null) return body[key];
  }
  return undefined;
}

const RESERVED_KEYS = new Set([
  "eventName",
  "event_name",
  "eventID",
  "eventId",
  "event_id",
  "eventSourceUrl",
  "event_source_url",
  "customData",
  "custom_data",
  "fbp",
  "fbc",
]);

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  const pixelId = env.META_PIXEL_ID;
  const tracking = env.TRACKING_CORE;

  /* no op path: tracking is not configured on this project, or the shared Worker isn't bound */
  if (!pixelId || !tracking) return new Response(null, { status: 204 });

  let body: Incoming = {};
  try {
    body = (await request.json()) as Incoming;
  } catch {
    return new Response(null, { status: 204 });
  }

  const eventName = (pick(body, "eventName", "event_name") as string) || "PageView";
  const eventID = pick(body, "eventID", "eventId", "event_id") as string | undefined;
  if (!eventID) return new Response(null, { status: 204 });

  const eventSourceUrl =
    (pick(body, "eventSourceUrl", "event_source_url") as string | undefined) ||
    request.headers.get("referer") ||
    undefined;

  const customDataInput = (pick(body, "customData", "custom_data") as Record<string, unknown>) || {};
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (RESERVED_KEYS.has(key) || value === undefined) continue;
    extra[key] = value;
  }
  const customData = { ...customDataInput, ...extra };

  const fbp = pick(body, "fbp") as string | undefined;
  const fbc = pick(body, "fbc") as string | undefined;

  const ip = request.headers.get("cf-connecting-ip") || undefined;
  const ua = request.headers.get("user-agent") || undefined;
  const ipHash = ip ? await sha256Hex(ip) : undefined;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventID,
        event_source_url: eventSourceUrl,
        action_source: "website",
        user_data: {
          client_ip_address: ip,
          client_user_agent: ua,
          external_id: ipHash,
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
        },
        custom_data: customData,
      },
    ],
  };

  let workerStatus: number | undefined;
  try {
    const capiRes = await tracking.fetch("https://himay-meta-capi.internal/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pixel_id: pixelId, ...payload }),
    });
    workerStatus = capiRes.status;
  } catch {
    /* never let a tracking failure surface to the visitor */
  }

  return new Response(null, {
    status: 204,
    headers: workerStatus !== undefined ? { "x-tracking-core-status": String(workerStatus) } : {},
  });
};
