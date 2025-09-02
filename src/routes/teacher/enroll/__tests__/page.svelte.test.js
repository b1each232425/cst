import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import Title from '$lib/components/Title/Title.svelte';
import InputBox from '$lib/components/Input/InputBox.svelte';
import Empty from '$lib/components/Table/Empty.svelte';
import Pagination from '$lib/components/Pagination/Pagination.svelte';
import Select from '$lib/components/Select/Select.svelte';
import Option from '$lib/components/Select/Option.svelte';
import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
import EnrollManagement from '../+page.svelte';
import { goto } from '$app/navigation';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

describe('报名管理计划展示页面测试', () => {
  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    render(EnrollManagement);
    expect(screen.getByText('报名列表')).toBeInTheDocument();
  });

  it('renders search input and filters', () => {
    render(EnrollManagement);

    // 输入框
    expect(screen.getByPlaceholderText('请输入关键词')).toBeInTheDocument();

    // 下拉框 label
    expect(screen.getByText('计划状态')).toBeInTheDocument();
    expect(screen.getAllByText('考试科目').length).toBeGreaterThan(0);
  });

  it('renders action buttons', () => {
    render(EnrollManagement);

    expect(screen.getByText('新增')).toBeInTheDocument();
    expect(screen.getAllByText('删除').length).toBeGreaterThan(0);
    expect(screen.getAllByText('作废').length).toBeGreaterThan(0);
  });

  it('renders table headers', () => {
    render(EnrollManagement);

    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getAllByText('考试科目').length).toBeGreaterThan(0);
    expect(screen.getByText('当前人数/计划人数')).toBeInTheDocument();
    expect(screen.getByText('审核截止时间')).toBeInTheDocument();
    expect(screen.getByText('开始时间 ~ 结束时间')).toBeInTheDocument();
    expect(screen.getByText('绑定练习')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  it('renders row action buttons depending on status', () => {
    render(EnrollManagement);

    // 未发布 -> 应该有 发布、编辑、删除
    expect(screen.getAllByText('发布')[0]).toBeInTheDocument();
    expect(screen.getAllByText('编辑')[0]).toBeInTheDocument();
    expect(screen.getAllByText('删除')[0]).toBeInTheDocument();

    // 已发布 -> 应该有 查看考生、编辑、作废
    expect(screen.getAllByText('查看考生').length).toBeGreaterThan(0);
    expect(screen.getAllByText('作废').length).toBeGreaterThan(0);

    // 审核截止 -> 只显示 查看考生
    expect(screen.getAllByText('查看考生').length).toBeGreaterThan(0);
  });
});
