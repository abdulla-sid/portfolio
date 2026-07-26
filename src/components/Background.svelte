<div class="bg" aria-hidden="true"></div>

<style>
  .bg {
    --grid-line-stops:
      var(--grid-line-edge) 0 var(--grid-line-edge-width),
      var(--grid-line-core) var(--grid-line-edge-width)
        calc(var(--grid-line-edge-width) + var(--grid-line-core-width)),
      var(--grid-line-edge)
        calc(var(--grid-line-edge-width) + var(--grid-line-core-width))
        calc(var(--grid-line-edge-width) * 2 + var(--grid-line-core-width)),
      transparent
        calc(var(--grid-line-edge-width) * 2 + var(--grid-line-core-width))
        var(--grid-cell-size);
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      repeating-linear-gradient(to right, var(--grid-line-stops)),
      repeating-linear-gradient(to bottom, var(--grid-line-stops));
  }
</style>
