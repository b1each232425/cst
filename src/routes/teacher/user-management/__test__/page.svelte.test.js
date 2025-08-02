import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import UserManagement from '../+page.svelte';

// 模拟外部依赖
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// 模拟 fetch
global.fetch = vi.fn();

