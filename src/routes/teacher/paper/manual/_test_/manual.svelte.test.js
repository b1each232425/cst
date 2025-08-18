/*
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-18 20:02:57
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-18 20:03:03
 * @FilePath: \exam\src\routes\teacher\paper\manual\_test_\manual.svelte.test.js
 * @Description: 自定义组卷页面测试
 * Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi, afterEach, cleanup } from 'vitest';
import Manual from '../+page@.svelte';

describe('自定义组卷页面', () => {
    beforeEach(() => {
        cleanup();
    });

    afterEach(() => {
        cleanup();
    });
});