import { describe, test, expect, vi } from 'vitest';
import { debounce } from '../debounce.js';

describe('debounce 防抖函数', () => {
    test('应在delay后执行一次函数', async () => {
        const fn = vi.fn();// 创建一个间谍函数记录调用次数
        const debounced = debounce(fn, 100); // 设置100毫秒的防抖延迟

        debounced('a');
        debounced('b');
        debounced('c');

        expect(fn).not.toHaveBeenCalled(); // 在100毫秒内不应调用
        
        await new Promise((r) => setTimeout(r, 150));// 等待超过防抖延迟
        expect(fn).toHaveBeenCalledTimes(1);// 函数应只被调用一次
        expect(fn).toHaveBeenCalledWith('c'); // 最后一次调用的参数应为'c'
    });

    test('应正确传递this和参数', async () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        const ctx = { foo: 'bar' };
        debounced.call(ctx, 1, 2, 3);

        await new Promise((r) => setTimeout(r, 150));
        expect(fn).toHaveBeenCalledWith(1, 2, 3);
        expect(fn.mock.instances[0]).toBe(ctx); // 确保this指向正确



    });
});
