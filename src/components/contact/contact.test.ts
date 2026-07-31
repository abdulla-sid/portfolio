import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CONTACT_EMAIL,
  CONTACT_ENDPOINT,
  emailFallback,
  send,
  validate,
} from "./contact";

describe("validate", () => {
  it("rejects each invalid field and accepts clean input", () => {
    expect(validate({ name: "  ", email: "a@b.co", message: "hi" })).toBe(
      "NAME REQUIRED",
    );
    expect(validate({ name: "Ada", email: "", message: "hi" })).toBe(
      "EMAIL REQUIRED",
    );
    expect(
      validate({ name: "Ada", email: "not-an-email", message: "hi" }),
    ).toBe("EMAIL LOOKS WRONG");
    expect(validate({ name: "Ada", email: "a@b.co", message: " " })).toBe(
      "MESSAGE REQUIRED",
    );
    expect(
      validate({ name: "Ada", email: "ada@lovelace.dev", message: "hello" }),
    ).toBeNull();
  });
});

describe("emailFallback", () => {
  it("builds an encoded email link with the typed contact details", () => {
    const href = emailFallback({
      name: " Ada ",
      email: " ada@example.com ",
      message: "Hello & goodbye",
    });

    expect(href).toContain(`mailto:${CONTACT_EMAIL}?`);
    expect(href).toContain("subject=Portfolio%20contact%20from%20Ada");
    expect(href).toContain("Hello%20%26%20goodbye");
  });
});

describe("send", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("POSTs the fields and Turnstile token to the same-origin endpoint", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await send(
      { name: "Ada", email: "ada@lovelace.dev", message: "hello" },
      "turnstile-token",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(CONTACT_ENDPOINT);
    expect(init.method).toBe("POST");
    expect(init.signal).toBeUndefined();
    const body = JSON.parse(init.body as string);
    expect(body.name).toBe("Ada");
    expect(body.email).toBe("ada@lovelace.dev");
    expect(body.message).toBe("hello");
    expect(body.turnstileToken).toBe("turnstile-token");
  });

  it("throws when the endpoint answers non-2xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 500 })),
    );
    await expect(
      send(
        { name: "Ada", email: "ada@lovelace.dev", message: "hello" },
        "turnstile-token",
      ),
    ).rejects.toThrow();
  });

  it("forwards an AbortSignal to fetch", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    await send(
      { name: "Ada", email: "ada@lovelace.dev", message: "hello" },
      "turnstile-token",
      controller.signal,
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(init).toHaveProperty("signal", controller.signal);
  });
});
