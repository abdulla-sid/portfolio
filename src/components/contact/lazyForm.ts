import { lazyOnce } from "../../lib/lazyOnce";

export const contactFormModule = lazyOnce(() => import("./ContactForm.svelte"));
