import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { installBrowserMocks, resetBrowserMocks } from "./test/mocks/browser";

installBrowserMocks();
afterEach(resetBrowserMocks);
