import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import EnrollPlanCreate from '../+page.svelte';
import { goto } from '$app/navigation';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

describe('报名计划创建页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应渲染核心表单元素', () => {
    render(EnrollPlanCreate);

    // 标题
    expect(screen.getByRole('heading', { name: '创建报名计划' })).toBeInTheDocument();

    // 计划名称输入框
    expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();

    // 报名时段（DatePicker）
    expect(screen.getByText('计划报名时段：')).toBeInTheDocument();
    expect(screen.getByText('审核截止时间：')).toBeInTheDocument();

    // 审核员按钮
    expect(screen.getByRole('button', { name: '选择审核员' })).toBeInTheDocument();

    // 计划人数
    expect(screen.getByLabelText('不限人数')).toBeInTheDocument();
    expect(screen.getByLabelText('限制人数')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入人数')).toBeInTheDocument();

    // 科目选择
    expect(screen.getByLabelText('理论')).toBeInTheDocument();
    expect(screen.getByLabelText('实践')).toBeInTheDocument();

    // 练习配置按钮
    expect(screen.getByRole('button', { name: '选择练习' })).toBeInTheDocument();

    // 底部操作按钮
    expect(screen.getByTestId('btn-cancel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });
});
