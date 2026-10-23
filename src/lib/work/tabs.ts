import { layoutChanged } from '../layout';
import { tabAfterKey } from './keys';
import { selection } from './selection';

/** Roving-tabindex tabs (WAI-ARIA tabs pattern, automatic activation) driven by the shared selection. */
export function initTabs(list: HTMLElement): void {
  const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const select = (tab: HTMLButtonElement) => {
    if (tab.dataset.id) selection.set({ id: tab.dataset.id });
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      const next = tabs[tabAfterKey(e.key, i, tabs.length) ?? -1];
      if (!next) return;
      e.preventDefault();
      next.focus();
      select(next);
    });
  });

  selection.subscribe(({ id }) => {
    for (const tab of tabs) {
      const on = tab.dataset.id === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '');
      if (panel) panel.hidden = !on;
    }
    layoutChanged();
  });
}
