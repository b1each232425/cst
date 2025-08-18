/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-18 18:52:56
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-18 19:13:53
 * @FilePath: \exam\src\routes\teacher\paper\_components\ImportQuestion\_test_\ImportQuestion.svelte.test.js
 * @Description: 导入题目组件的测试
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, afterEach, cleanup } from 'vitest';
import ImportQuestion from '../ImportQuestion.svelte';

describe('导入题目组件', () => {
    beforeEach(() => {
        cleanup();
    });

    afterEach(() => {
        cleanup();
    });
});