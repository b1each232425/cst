// EnrollManagement.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import EnrollManagement from '../+page.svelte';
import { goto } from '$app/navigation';
import { page } from '$app/state';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// 模拟 page
vi.mock('$app/state', () => ({
  page: {
    url: new URL('http://localhost/teacher/enroll/see-enroll/1'),
  },
}));

describe('EnrollManagement', () => {
  it('渲染页面标题', () => {
    render(EnrollManagement);
    expect(screen.getByText('报名列表')).toBeInTheDocument();
  });

  it('渲染搜索框', () => {
    render(EnrollManagement);
    // 根据 label 获取输入框，避免 placeholder 重复
    expect(screen.getByLabelText('查找人员')).toBeInTheDocument();
  });

  it('渲染表格头部', () => {
    render(EnrollManagement);

    expect(screen.getAllByRole('columnheader', { name: '姓名' }).length).toBeGreaterThan(0);

    expect(screen.getAllByRole('columnheader', { name: '性别' }).length).toBeGreaterThan(0);

    expect(screen.getAllByRole('columnheader', { name: '出生日期' }).length).toBeGreaterThan(0);

    expect(screen.getAllByRole('columnheader', { name: '电话' }).length).toBeGreaterThan(0);

    expect(screen.getAllByRole('columnheader', { name: '证件类型' }).length).toBeGreaterThan(0);

    expect(screen.getAllByRole('columnheader', { name: '证件号' }).length).toBeGreaterThan(0);
  });
});
