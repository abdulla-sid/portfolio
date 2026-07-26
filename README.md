```text
{abdullah siddiqui}> software engineer
> occasional artist
> professional button-pusher
```

This is my pixel-art portfolio: part personal website, part tiny desktop environment, and part excuse to have a couple breakdowns trying to create unnecessarily detailed sprites.

You can poke around with the mouse, navigate with the keyboard, inspect my experience on a local map, and send me a message if something catches your eye.

## Asset policy

- `assets-src/` contains the editable artwork, reference images, mockups, and
  retained intermediate exports. The artwork is original and intentionally
  committed with the repository.
- `src/assets/` contains only the optimized images imported by the application.
  Some files intentionally duplicate a final export in `assets-src/` so the
  deployed asset and its editable source have clear, independent roles.
- `public/map/` contains the two generated PMTiles archives required by the
  static deployment. They are intentionally committed for deterministic builds
  and can be regenerated with `scripts/extract-city-tiles.sh`.
- `node_modules/` and `dist/` are generated locally and remain ignored.
