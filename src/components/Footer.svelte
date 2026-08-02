<footer>
  <a href="https://github.com/abdulla-sid" target="_blank" rel="noopener"
    >GITHUB</a
  >
  <span>SUBSTACK</span>
  <a
    href="https://www.linkedin.com/in/abdullah-siddiqui-dev/"
    target="_blank"
    rel="noopener">LINKEDIN</a
  >
</footer>

<style>
  footer {
    position: absolute;
    left: var(--page-margin);
    right: var(--page-margin);
    bottom: var(--page-margin);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    font-size: 11px;
    letter-spacing: 1px;
  }
  a,
  span {
    color: var(--ui-accent);
    text-decoration: none;
  }
  @media (hover: hover) and (pointer: fine) {
    a:hover {
      color: var(--ui-highlight);
    }
  }
  span {
    justify-self: center;
  }
  a:last-child {
    justify-self: end;
  }

  @media (max-width: 900px) {
    footer {
      display: none;
    }
  }
</style>
