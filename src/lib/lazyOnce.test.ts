import { describe, expect, it, vi } from "vitest";
import { lazyOnce } from "./lazyOnce";

describe("lazyOnce", () => {
  it("loads once however many callers ask", async () => {
    const load = vi.fn(async () => "module");
    const get = lazyOnce(load);

    const [a, b] = await Promise.all([get(), get()]);
    await get();

    expect(load).toHaveBeenCalledTimes(1);
    expect(a).toBe("module");
    expect(b).toBe("module");
  });

  it("lets a later caller retry after a failure instead of caching it forever", async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue("module");
    const get = lazyOnce(load);

    await expect(get()).rejects.toThrow("offline");
    await expect(get()).resolves.toBe("module");
    expect(load).toHaveBeenCalledTimes(2);
  });
});
