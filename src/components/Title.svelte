<h1 id="title">
  <span class="brace">&#123;</span>abdullah siddiqui<span class="brace"
    >&#125;</span
  >
</h1>

<style>
  #title {
    --brace-scale: 1.5;
    --brace-bearing: calc(var(--brace-scale) * 0.25em);

    position: absolute;
    top: var(--page-margin);
    left: calc(var(--page-margin) - var(--brace-bearing));
    font-size: var(--title-size);
    font-weight: 400;
    letter-spacing: 1px;
    color: var(--ui-accent);
  }

  .brace {
    font-size: calc(var(--brace-scale) * 1em);
    vertical-align: -0.12em;
  }

  @media (max-width: 900px) {
    #title {
      top: calc(32px + var(--safe-top));
      left: 20px;
      font-size: 9px;
      white-space: nowrap;
    }
  }
</style>
