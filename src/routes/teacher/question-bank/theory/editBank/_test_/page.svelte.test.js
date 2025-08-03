import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, getByText, render, screen } from '@testing-library/svelte';
import BankPage from '../+page.svelte';
import { goto } from '$app/navigation';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  preloadCode: vi.fn(),
  invalidate: vi.fn(),
}));



