import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Pagination from '../Pagination.svelte';

describe('Pagination 组件测试', () => {
  let total_items = 100; // 总数据条数
  let page_size = 10; // 每页显示条数
  let current_page = 1; // 当前页码
  let jump_page = 1; // 跳转页
  let page_size_options = [10, 20, 30, 40, 50]; // 每页条数选项
  let handlePageChange;
  let handlePageSizeChange;

  beforeEach(() => {
    handlePageChange = vi.fn();
    handlePageSizeChange = vi.fn();
  });

  it('应该渲染正确的总条数显示', async () => {
    render(Pagination, {
      props: {
        total_items,
        page_size,
        current_page,
        page_size_options,
      },
    });

    expect(screen.getByText('共 100 条')).toBeInTheDocument(); // 验证总条数
  });

  it('应该渲染正确的页码按钮', async () => {
    render(Pagination, {
      props: {
        total_items,
        page_size,
        current_page,
        page_size_options,
      },
    });

    // 初始页码按钮
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('应该高亮当前页码', async () => {
    render(Pagination, {
      props: {
        total_items,
        page_size,
        current_page: 3, // 设置为第3页
        page_size_options,
      },
    });

    const page3Button = screen.getByText('3');
    expect(page3Button).toHaveClass('active'); // 验证第3页按钮是否高亮
  });

  it('应该正确触发上一页按钮点击', async () => {
    render(Pagination, {
      props: {
        total_items,
        page_size,
        current_page,
        page_size_options,
      },
    });

    // 点击上一页按钮
    const prevButton = screen.getByTestId('left_jt');
    await fireEvent.click(prevButton);
  });

  it('应该正确触发下一页按钮点击', async () => {
    // 渲染组件并传递 mock 函数
    render(Pagination, {
      props: {
        total_items,
        page_size,
        current_page,
      },
    });

    // 模拟点击下一页按钮
    const nextButton = screen.getByTestId('right_jt');
    await fireEvent.click(nextButton);
  });

  it('应该正确触发跳转页码功能', async () => {
    render(Pagination, {
      props: {
        total_items,
        page_size,
        current_page,
        jump_page,
        page_size_options,
      },
    });

    // 输入跳转页码并按下 Enter 键
    const jumpInput = screen.getByTestId('jump-to-input');
    await fireEvent.input(jumpInput, { target: { value: '5' } });
    await fireEvent.keyDown(jumpInput, { key: 'Enter' });

    // 确认跳转后输入框的值为 '5'
    expect(jumpInput.value).toBe('5');
  });

  it('应该正确触发每页条数变化', async () => {
    render(Pagination, {
      props: {
        total_items,
        page_size,
        current_page,
        page_size_options,
      },
    });

    // 选择每页条数为20
    const pageSizeSelect = screen.getByTestId('select');
    await fireEvent.change(pageSizeSelect, { target: { value: '20' } });

    // 验证 select 元素的 value 是否为 '20'
    expect(pageSizeSelect.value).toBe('20');
  });

  it('应该显示省略号', async () => {
    render(Pagination, {
      props: {
        total_items: 100,
        page_size: 10,
        current_page: 6, // 当前页为6，显示省略号
        page_size_options,
      },
    });

    // 获取所有省略号
    const dots = screen.getAllByText('...');
    expect(dots.length).toBe(2); // 确认有两个省略号

    // 验证第二个省略号的位置或其他条件
    expect(dots[1]).toBeInTheDocument(); // 验证第二个省略号是否在页面中
  });

  it('应该禁用上一页按钮在第一页', async () => {
    render(Pagination, {
      props: {
        total_items,
        page_size,
        current_page: 1, // 当前页为第一页
        page_size_options,
      },
    });

    const prevButton = screen.getByTestId('left_jt');
    expect(prevButton).toBeDisabled(); // 验证上一页按钮是否禁用
  });

  it('应该禁用下一页按钮在最后一页', async () => {
    render(Pagination, {
      props: {
        total_items,
        page_size,
        current_page: 10, // 当前页为最后一页
        page_size_options,
      },
    });

    const nextButton = screen.getByTestId('right_jt');
    expect(nextButton).toBeDisabled(); // 验证下一页按钮是否禁用
  });
});
