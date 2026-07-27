export const MENU_ITEMS = [
  { id: "about", label: "ABOUT ME" },
  { id: "projects", label: "PROJECTS" },
  { id: "experience", label: "EXPERIENCE" },
  { id: "contact", label: "CONTACT ME" },
] as const;

export type MenuId = (typeof MENU_ITEMS)[number]["id"];
export type MenuLabel = (typeof MENU_ITEMS)[number]["label"];

const MENU_LABELS = Object.fromEntries(
  MENU_ITEMS.map(({ id, label }) => [id, label]),
) as Record<MenuId, MenuLabel>;

export function menuLabel(id: MenuId): MenuLabel {
  return MENU_LABELS[id];
}
