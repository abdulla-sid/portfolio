/**
 * What the rest of the site may ask of the hero device. Device.astro's script registers the real implementation;
 * until then (or if the device is not on the page) calls do nothing.
 */
interface LcdController {
  /** Redraw the screen from the top with a scanline, as after a power cycle. */
  reboot(): void;
}

let current: LcdController = { reboot() {} };

export const lcd: LcdController = { reboot: () => current.reboot() };

export function registerLcd(impl: LcdController): void {
  current = impl;
}
