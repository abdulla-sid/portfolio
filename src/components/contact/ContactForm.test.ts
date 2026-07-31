import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/svelte";

const turnstileApi = vi.hoisted(() => ({
  render: vi.fn(
    (
      _container: HTMLElement,
      options: { callback: (token: string) => void },
    ) => {
      options.callback("turnstile-token");
      return "widget-id";
    },
  ),
  remove: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("./contact", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./contact")>();
  return { ...mod, send: vi.fn(async () => {}) };
});

vi.mock("./turnstile", () => ({
  loadTurnstile: vi.fn(async () => turnstileApi),
  turnstileSiteKey: vi.fn(() => "test-site-key"),
}));

import { send } from "./contact";
import { turnstileSiteKey } from "./turnstile";
import ContactForm from "./ContactForm.svelte";

const sendMock = vi.mocked(send);
const turnstileSiteKeyMock = vi.mocked(turnstileSiteKey);

async function fill(
  getByLabelText: (name: string) => Element,
  fields = { NAME: "Ada", EMAIL: "ada@lovelace.dev", MESSAGE: "hello there" },
) {
  for (const [label, value] of Object.entries(fields)) {
    await fireEvent.input(getByLabelText(label), { target: { value } });
  }
}

describe("ContactForm", () => {
  beforeEach(() => {
    sendMock.mockReset().mockResolvedValue();
    turnstileSiteKeyMock.mockReset().mockReturnValue("test-site-key");
    turnstileApi.render.mockClear();
    turnstileApi.remove.mockClear();
    turnstileApi.reset.mockClear();
  });

  it("shows the validation error and does not send on bad input", async () => {
    const { getByRole, getByText } = render(ContactForm);
    await fireEvent.click(getByRole("button", { name: "SEND" }));
    expect(getByText("NAME REQUIRED")).toBeInTheDocument();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("falls back to email when the security check is unavailable", async () => {
    turnstileSiteKeyMock.mockReturnValue("");
    const { getByRole } = render(ContactForm);

    await waitFor(() =>
      expect(getByRole("link", { name: "SEND" })).toHaveAttribute(
        "href",
        expect.stringContaining("mailto:contact@tinydesktop.me"),
      ),
    );

    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends the typed fields and shows the sent confirmation", async () => {
    const { container, getByLabelText, getByRole, getByText } =
      render(ContactForm);
    await fill(getByLabelText);
    await waitFor(() =>
      expect(container.querySelector(".challenge")).toHaveAttribute(
        "data-ready",
        "true",
      ),
    );
    await fireEvent.click(getByRole("button", { name: "SEND" }));

    await waitFor(() => expect(getByText("MESSAGE SENT!")).toBeInTheDocument());
    expect(sendMock).toHaveBeenCalledWith(
      {
        name: "Ada",
        email: "ada@lovelace.dev",
        message: "hello there",
        website: "",
      },
      "turnstile-token",
      expect.any(AbortSignal),
    );
  });

  it("keeps the typed values and re-enables SEND after a failure", async () => {
    sendMock.mockImplementation(async () => {
      throw new Error("boom");
    });
    const { container, getByLabelText, getByRole, getByText } =
      render(ContactForm);
    await fill(getByLabelText);
    await waitFor(() =>
      expect(container.querySelector(".challenge")).toHaveAttribute(
        "data-ready",
        "true",
      ),
    );
    await fireEvent.click(getByRole("button", { name: "SEND" }));

    await waitFor(() =>
      expect(getByText("SEND FAILED — TRY AGAIN")).toBeInTheDocument(),
    );
    expect((getByLabelText("MESSAGE") as HTMLTextAreaElement).value).toBe(
      "hello there",
    );
    expect(
      (getByRole("button", { name: "SEND" }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("keeps programmatic duplicate submissions single-flight", async () => {
    sendMock.mockReturnValue(new Promise(() => {}));
    const { container, getByLabelText } = render(ContactForm);
    await fill(getByLabelText);
    await waitFor(() =>
      expect(container.querySelector(".challenge")).toHaveAttribute(
        "data-ready",
        "true",
      ),
    );
    const form = container.querySelector("form")!;
    await fireEvent.submit(form);
    await fireEvent.submit(form);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("aborts the active request when unmounted", async () => {
    let requestSignal: AbortSignal | undefined;
    sendMock.mockImplementation(
      (_fields, _turnstileToken, signal) =>
        new Promise((_resolve, reject) => {
          requestSignal = signal;
          signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const { container, getByLabelText, getByRole, unmount } =
      render(ContactForm);
    await fill(getByLabelText);
    await waitFor(() =>
      expect(container.querySelector(".challenge")).toHaveAttribute(
        "data-ready",
        "true",
      ),
    );
    await fireEvent.click(getByRole("button", { name: "SEND" }));
    unmount();
    expect(requestSignal?.aborted).toBe(true);
  });
});
