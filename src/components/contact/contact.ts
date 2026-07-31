export interface ContactFields {
  name: string;
  email: string;
  message: string;
  website?: string;
}

export const CONTACT_ENDPOINT = "/api/contact";
export const CONTACT_EMAIL = "contact@tinydesktop.me";

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(fields: ContactFields): string | null {
  if (!fields.name.trim()) return "NAME REQUIRED";
  if (fields.name.trim().length > 100) return "NAME TOO LONG";
  if (!fields.email.trim()) return "EMAIL REQUIRED";
  if (!EMAIL_SHAPE.test(fields.email.trim())) return "EMAIL LOOKS WRONG";
  if (fields.email.trim().length > 254) return "EMAIL TOO LONG";
  if (!fields.message.trim()) return "MESSAGE REQUIRED";
  if (fields.message.trim().length > 5000) return "MESSAGE TOO LONG";
  return null;
}

export function emailFallback(fields: ContactFields): string {
  const subject = `Portfolio contact from ${fields.name.trim()}`;
  const body = `Name: ${fields.name.trim()}\nEmail: ${fields.email.trim()}\n\n${fields.message.trim()}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
