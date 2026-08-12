import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CONTACT_ENDPOINT,
  litSegments,
  MESSAGE_LIMIT,
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
      validate({
        name: "Ada",
        email: "a@b.co",
        message: "x".repeat(MESSAGE_LIMIT + 1),
      }),
    ).toBe("MESSAGE TOO LONG");
    expect(
      validate({
        name: "Ada",
        email: "a@b.co",
        message: "x".repeat(MESSAGE_LIMIT),
      }),
    ).toBeNull();
    expect(
      validate({ name: "Ada", email: "ada@lovelace.dev", message: "hello" }),
    ).toBeNull();
  });
});

describe("litSegments", () => {
  it("lights a segment as soon as anything is typed and never overruns", () => {
    expect(litSegments(0, 14)).toBe(0);
    expect(litSegments(1, 14)).toBe(1);
    expect(litSegments(MESSAGE_LIMIT / 2, 14)).toBe(7);
    expect(litSegments(MESSAGE_LIMIT, 14)).toBe(14);
    expect(litSegments(MESSAGE_LIMIT * 2, 14)).toBe(14);
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
