<div class="rotate-notice">
  <p>ROTATE TO PORTRAIT</p>
  <p class="sub">this desktop needs a taller screen</p>
</div>

<style>
  .rotate-notice {
    display: none;
  }

  @media (pointer: coarse) and (orientation: landscape) and (max-height: 500px) {
    .rotate-notice {
      position: fixed;
      inset: 0;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
      background: var(--surface-page);
      text-align: center;
    }

    .rotate-notice p {
      margin: 0;
      font-size: 10px;
      letter-spacing: 1px;
      color: var(--ui-accent);
    }

    .rotate-notice .sub {
      font-size: 8px;
      line-height: 1.8;
      color: var(--text-muted);
    }
  }
</style>
