export interface ContactFields {
  name: string;
  email: string;
  message: string;
  website?: string;
}

export const CONTACT_ENDPOINT = "/api/contact";

export const MESSAGE_LIMIT = 1000;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function litSegments(length: number, segments: number): number {
  return Math.min(segments, Math.ceil((length / MESSAGE_LIMIT) * segments));
}

export function validate(fields: ContactFields): string | null {
  if (!fields.name.trim()) return "NAME REQUIRED";
  if (fields.name.trim().length > 100) return "NAME TOO LONG";
  if (!fields.email.trim()) return "EMAIL REQUIRED";
  if (!EMAIL_SHAPE.test(fields.email.trim())) return "EMAIL LOOKS WRONG";
  if (fields.email.trim().length > 254) return "EMAIL TOO LONG";
  if (!fields.message.trim()) return "MESSAGE REQUIRED";
  if (fields.message.trim().length > MESSAGE_LIMIT) return "MESSAGE TOO LONG";
  return null;
}

export async function send(
  fields: ContactFields,
  turnstileToken: string,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(CONTACT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: fields.name,
      email: fields.email,
      message: fields.message,
      website: fields.website,
      turnstileToken,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`contact send failed: ${res.status}`);
}
