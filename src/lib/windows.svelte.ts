export interface WindowManager {
  register(id: string): void;
  unregister(id: string): void;
  bringToFront(id: string): void;
  zIndexOf(id: string): number;
}

export function createWindowManager(): WindowManager {
  const order = $state<string[]>([]);

  return {
    register(id) {
      if (order.includes(id))
        throw new Error(`Window already registered: ${id}`);
      order.push(id);
    },
    unregister(id) {
      const index = order.indexOf(id);
      if (index !== -1) order.splice(index, 1);
    },
    bringToFront(id) {
      const index = order.indexOf(id);
      if (index === -1 || index === order.length - 1) return;
      order.splice(index, 1);
      order.push(id);
    },
    zIndexOf(id) {
      const index = order.indexOf(id);
      return index === -1 ? 0 : index + 2;
    },
  };
}

export const windows = createWindowManager();
