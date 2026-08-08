import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "./contact";

const env = {
  BREVO_API_KEY: "brevo-key",
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
      .mockResolvedValueOnce(
        Response.json({ messageId: "brevo-message-id" }, { status: 201 }),
      );
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
    expect(emailUrl).toBe("https://api.brevo.com/v3/smtp/email");
    expect(emailInit.headers).toMatchObject({ "api-key": "brevo-key" });

    const body = JSON.parse(emailInit.body as string);
    expect(Object.keys(body).sort()).toEqual([
      "replyTo",
      "sender",
      "subject",
      "textContent",
      "to",
    ]);
    expect(body.sender).toEqual({
      email: "contact@tinydesktop.me",
      name: "Tiny Desktop",
    });
    expect(body.to).toEqual([{ email: "private@example.com" }]);
    expect(body.replyTo).toEqual({ email: "ada@example.com", name: "Ada" });
  });

  it("treats a delivery response carrying no message id as a failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(Response.json({}, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await onRequestPost({ request: request(), env });

    expect(result.status).toBe(502);
  });

  it("keeps the reply-to name inside the provider limit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ success: true }))
      .mockResolvedValueOnce(
        Response.json({ messageId: "brevo-message-id" }, { status: 201 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await onRequestPost({
      request: request({
        name: "A".repeat(100),
        email: "ada@example.com",
        message: "Hello there",
        turnstileToken: "challenge-token",
      }),
      env,
    });

    const [, emailInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(emailInit.body as string).replyTo.name).toHaveLength(70);
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
