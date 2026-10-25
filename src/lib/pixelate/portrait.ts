import { quantiseToRamp, toRgb } from '../canvas/quantise';
import { getSkin, onSkinChange, token } from '../skin';

const SIZE = 40;
// the head: a square from 29% across and 10% down, 40% of the photo wide
const CROP = { x: 0.29, y: 0.1, size: 0.4 };
// four flat shades, darkest first: two of the board's, then the accent and the text colour (pixel's two colours);
// the thresholds put the background in the darkest
const SHADES = ['--card', '--edge', '--accent', '--ink'] as const;
const STEPS = [0.28, 0.55, 0.86];

/** In pixel mode, draws the photo `img` into `canvas` as a 40px portrait in four flat shades. */
export function mountPortrait(img: HTMLImageElement, canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  canvas.width = SIZE;
  canvas.height = SIZE;

  const draw = async () => {
    if (getSkin().mode !== 'pixel') return;
    if (!img.complete || !img.naturalWidth) {
      img.addEventListener('load', draw, { once: true });
      return;
    }
    // Crop from a fresh copy of the file srcset chose, scaled to the photo's CSS size. On 2x screens the <img>
    // holds twice naturalWidth in pixels, and Chrome then reads the wrong region of it; the copy has no density,
    // and the scaling gives every screen the same portrait.
    const { naturalWidth: w, naturalHeight: h } = img;
    const copy = new Image();
    copy.src = img.currentSrc || img.src;
    const photo = await copy
      .decode()
      .then(() => createImageBitmap(copy, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' }))
      .catch(() => null);
    if (!photo) return; // a photo that cannot be decoded leaves the frame empty
    const side = Math.min(w, h) * CROP.size;
    ctx.drawImage(photo, w * CROP.x, h * CROP.y, side, side, 0, 0, SIZE, SIZE);
    photo.close();
    const data = ctx.getImageData(0, 0, SIZE, SIZE);
    quantiseToRamp(
      data.data,
      SHADES.map((s) => toRgb(token(s))),
      STEPS,
    );
    ctx.putImageData(data, 0, 0);
  };

  onSkinChange(draw);
  draw();
}
