import { writable } from 'svelte/store';

export const bankId = writable(0);

function createMapStore() {
  const { subscribe, update } = writable(new Map());
  return {
    subscribe,
    // 切换选中状态
    toggle: (id) => 
      update((map) => {
        const newMap = new Map(map);
        if (newMap.has(id)) {
          newMap.delete(id); // 如果已存在，则删除
        } else {
          newMap.set(id, true); // 如果不存在，则添加
        }
        return newMap;
      }),
    // 检查是否存在
    isSelected: (id) => 
      update((map) => map.has(id)),
    // 清空map
    clear: () => update(() => new Map()),
  };
}

export const selection = createMapStore();
export const change=createMapStore();