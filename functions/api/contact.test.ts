import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from './contact';

const env = {
  RESEND_API_KEY: 'resend-key',
  CONTACT_RECIPIENT: 'private@example.com',
  CONTACT_SENDER: 'contact@tinydesktop.me',
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
};

function request(
  body: Record<string, unknown> = {
    name: 'Ada',
    email: 'ada@example.com',
    message: 'Hello there',
    turnstileToken: 'challenge-token',
  },
) {
  return new Request('https://tinydesktop.me/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://tinydesktop.me',
    },
    body: JSON.stringify(body),
  });
}

describe('contact Pages Function', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('verifies Turnstile before delivering to the private recipient', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json({ id: 'resend-email-id' }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequestPost({ request: request(), env });

    expect(result.status).toBe(200);
    expect(result.headers.get('Cache-Control')).toBe('no-store');
    expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const [emailUrl, emailInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(emailUrl).toBe('https://api.resend.com/emails');
    expect(emailInit.method).toBe('POST');
    expect(emailInit.headers).toMatchObject({
      Authorization: 'Bearer resend-key',
      'Content-Type': 'application/json',
    });

    const body = JSON.parse(emailInit.body as string);
    expect(body).toEqual({
      from: 'Tiny Desktop <contact@tinydesktop.me>',
      to: ['private@example.com'],
      reply_to: 'ada@example.com',
      subject: 'Portfolio contact from Ada',
      text: 'Name: Ada\nEmail: ada@example.com\n\nHello there',
    });
  });

  it('treats a delivery response carrying no message id as a failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json({}, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequestPost({ request: request(), env });

    expect(result.status).toBe(502);
  });

  it('treats a provider error status as a failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json({ statusCode: 403, name: 'validation_error' }, { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequestPost({ request: request(), env });

    expect(result.status).toBe(502);
  });

  it('passes a sender that already carries a display name through unchanged', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json({ id: 'resend-email-id' }));
    vi.stubGlobal('fetch', fetchMock);

    await onRequestPost({
      request: request(),
      env: { ...env, CONTACT_SENDER: 'Postbox <onboarding@resend.dev>' },
    });

    const [, emailInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(emailInit.body as string).from).toBe('Postbox <onboarding@resend.dev>');
  });

  it('closes the postbox when the provider key is missing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequestPost({ request: request(), env: { ...env, RESEND_API_KEY: '' } });

    expect(result.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid input before making external requests', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequestPost({
      request: request({ name: '', email: 'wrong', message: '' }),
      env,
    });

    expect(result.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not send mail when Turnstile rejects the submission', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ success: false }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequestPost({ request: request(), env });

    expect(result.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('silently accepts a filled honeypot without sending mail', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await onRequestPost({
      request: request({
        name: 'Ada',
        email: 'ada@example.com',
        message: 'Hello',
        turnstileToken: 'challenge-token',
        website: 'https://spam.example',
      }),
      env,
    });

    expect(result.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
