import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "./contact";

const env = {
  CLOUDFLARE_ACCOUNT_ID: "account-id",
  CLOUDFLARE_EMAIL_API_TOKEN: "api-token",
  CONTACT_RECIPIENT: "private@example.com",
  CONTACT_SENDER: "contact@tinydesktop.me",
  TURNSTILE_SECRET_KEY: "turnstile-secret",
};

function request(
  body: Record<string, unknown> = {
    name: "Ada",
    email: "ada@example.com",
    message: "Hello there",
    turnstileToken: "challenge-token",
  },
) {
  return new Request("https://tinydesktop.me/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://tinydesktop.me",
    },
    body: JSON.stringify(body),
  });
}

describe("contact Pages Function", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("verifies Turnstile before delivering to the private recipient", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await onRequestPost({ request: request(), env });

    expect(result.status).toBe(200);
    expect(result.headers.get("Cache-Control")).toBe("no-store");
    expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    const [emailUrl, emailInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(emailUrl).toContain("/accounts/account-id/email/sending/send");
    expect(emailInit.headers).toMatchObject({
      Authorization: "Bearer api-token",
    });
    expect(JSON.parse(emailInit.body as string)).toMatchObject({
      to: "private@example.com",
      from: {
        address: "contact@tinydesktop.me",
        name: "Tiny Desktop",
      },
      reply_to: { address: "ada@example.com", name: "Ada" },
    });
  });

  it("rejects invalid input before making external requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await onRequestPost({
      request: request({ name: "", email: "wrong", message: "" }),
      env,
    });

    expect(result.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not send mail when Turnstile rejects the submission", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: false }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await onRequestPost({ request: request(), env });

    expect(result.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("silently accepts a filled honeypot without sending mail", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await onRequestPost({
      request: request({
        name: "Ada",
        email: "ada@example.com",
        message: "Hello",
        turnstileToken: "challenge-token",
        website: "https://spam.example",
      }),
      env,
    });

    expect(result.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
