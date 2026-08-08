interface ContactEnvironment {
  BREVO_API_KEY: string;
  CONTACT_RECIPIENT: string;
  CONTACT_SENDER: string;
  TURNSTILE_SECRET_KEY: string;
}

interface FunctionContext {
  request: Request;
  env: ContactEnvironment;
}

interface ContactPayload {
  name: string;
  email: string;
  message: string;
  turnstileToken: string;
  website?: string;
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TURNSTILE_VERIFY =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const BREVO_SEND = "https://api.brevo.com/v3/smtp/email";
const BREVO_NAME_LIMIT = 70;

function response(status: number, error?: string): Response {
  return Response.json(error ? { ok: false, error } : { ok: true }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}

function normalizedPayload(value: unknown): ContactPayload | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (
    typeof input.name !== "string" ||
    typeof input.email !== "string" ||
    typeof input.message !== "string" ||
    typeof input.turnstileToken !== "string" ||
    (input.website !== undefined && typeof input.website !== "string")
  )
    return null;

  const payload = {
    name: input.name.trim().replace(/[\r\n]+/g, " "),
    email: input.email.trim(),
    message: input.message.trim(),
    turnstileToken: input.turnstileToken,
    website: input.website?.trim(),
  };

  if (
    !payload.name ||
    payload.name.length > 100 ||
    !EMAIL_SHAPE.test(payload.email) ||
    payload.email.length > 254 ||
    !payload.message ||
    payload.message.length > 5000 ||
    !payload.turnstileToken ||
    payload.turnstileToken.length > 2048
  )
    return null;

  return payload;
}

function configured(env: ContactEnvironment): boolean {
  return [
    env.BREVO_API_KEY,
    env.CONTACT_RECIPIENT,
    env.CONTACT_SENDER,
    env.TURNSTILE_SECRET_KEY,
  ].every((value) => Boolean(value?.trim()));
}

async function verifyTurnstile(
  payload: ContactPayload,
  request: Request,
  env: ContactEnvironment,
): Promise<boolean> {
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY);
  body.set("response", payload.turnstileToken);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.set("remoteip", remoteIp);

  const result = await fetch(TURNSTILE_VERIFY, { method: "POST", body });
  if (!result.ok) return false;
  const verification = (await result.json()) as { success?: unknown };
  return verification.success === true;
}

async function deliver(
  payload: ContactPayload,
  env: ContactEnvironment,
): Promise<boolean> {
  const result = await fetch(BREVO_SEND, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: env.CONTACT_SENDER,
        name: "Tiny Desktop",
      },
      to: [{ email: env.CONTACT_RECIPIENT }],
      replyTo: {
        email: payload.email,
        name: payload.name.slice(0, BREVO_NAME_LIMIT),
      },
      subject: `Portfolio contact from ${payload.name}`,
      textContent: `Name: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`,
    }),
  });
  if (!result.ok) return false;
  const delivery = (await result.json()) as { messageId?: unknown };
  return typeof delivery.messageId === "string";
}

export async function onRequestPost({
  request,
  env,
}: FunctionContext): Promise<Response> {
  if (!configured(env)) return response(503, "CONTACT UNAVAILABLE");

  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin)
    return response(403, "REQUEST REJECTED");

  const contentType = request.headers.get("Content-Type") ?? "";
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (
    !contentType.toLowerCase().startsWith("application/json") ||
    contentLength > 16_384
  )
    return response(400, "INVALID REQUEST");

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return response(400, "INVALID REQUEST");
  }

  const payload = normalizedPayload(value);
  if (!payload) return response(400, "INVALID REQUEST");
  if (payload.website) return response(200);

  try {
    if (!(await verifyTurnstile(payload, request, env)))
      return response(403, "SECURITY CHECK FAILED");
    if (!(await deliver(payload, env))) return response(502, "DELIVERY FAILED");
    return response(200);
  } catch {
    return response(502, "DELIVERY FAILED");
  }
}
