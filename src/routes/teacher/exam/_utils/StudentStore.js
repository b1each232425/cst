import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = '_app_cache_data';

// 创建简化的学生store
function createStudentStore() {
  // 从sessionStorage恢复数据
  const getInitialData = () => {
    if (!browser) return [];
    try {
      const stored = sessionStorage.getItem(KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const { subscribe, update } = writable(getInitialData());

  return {
    subscribe,
    // 添加学生数据
    addStudents: (students) => {
      update(current => {
        const newData = [...current, ...students];
        if (browser) {
          try {
            sessionStorage.setItem(KEY, JSON.stringify(newData));
          } catch (e) {
            console.warn('Storage failed:', e);
          }
        }
        return newData;
      });
    },
    // 获取所有数据
    getData: () => {
      if (!browser) return [];
      try {
        const stored = sessionStorage.getItem(KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  };
}

export const studentStore = createStudentStore();