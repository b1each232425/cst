import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Pagination from '../Pagination.svelte';
import Select from '$lib/components/Select/Select.svelte';
import Option from '$lib/components/Select/Option.svelte';

describe('Pagination 组件测试', () => {
  let total_items = 100; // 总数据条数
  let page_size = 10; // 每页显示条数
  let current_page = 1; // 当前页码
  let jump_page = 1; // 跳转页
  let page_size_options = [10, 20, 30, 40, 50]; // 每页条数选项
  let handlePageChange;
  let handlePageSizeChange;

  beforeEach(() => {
    // 在每个测试前，清空所有的模拟
    vi.restoreAllMocks();

    handlePageChange = vi.fn();
    handlePageSizeChange = vi.fn();
  });

  /**
   * 测试 total_items 参数
   */
  it('total_items 参数不是数字时，应输出警告并使用默认值', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Pagination, { props: { total_items: '100' } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Pagination] total_items 应该是一个数字，当前为 string');

    // 检查是否使用默认值
    const totalItemsElement = screen.getByText(/共 0 条/);
    expect(totalItemsElement).toBeInTheDocument();
  });

  /**
   * 测试 page_size 参数
   */
  it('page_size 参数不是数字时，应输出警告并使用默认值', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Pagination, { props: { page_size: '100' } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Pagination] page_size 应该是一个数字，当前为 string');

    // 检查是否使用默认值
    const pageSizeElement = screen.getByText('10条/页');
    expect(pageSizeElement).toBeInTheDocument();
  });

  /**
   * 测试 current_page 参数
   */
  it('current_page 参数不是数字时，应输出警告并使用默认值', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Pagination, { props: { total_items: 100, current_page: '2' } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Pagination] current_page 应该是一个数字，当前为 string');

    // 检查是否使用默认值
    expect(screen.getByText('1')).toHaveClass('active');
  });

  /**
   * 测试 jump_page 参数
   */
  it('jump_page 参数不是数字时，应输出警告并使用默认值', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Pagination, { props: { jump_page: '1' } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Pagination] jump_page 应该是一个数字，当前为 string');

    // 检查是否使用默认值
    const jumpPageElement = screen.getByTestId('jump-to-input');
    expect(jumpPageElement).toHaveValue(1);
  });

  /**
   * 测试 page_size_options 参数
   */
  it('page_size_options 参数不是数组时，应输出警告并使用默认值', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Pagination, { props: { page_size_options: '10, 20, 30' } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Pagination] page_size_options 应该是一个数组，当前为 string');

    // 检查是否使用默认值
    const pageSizeOptionsElements = screen.getByText('10条/页');
    expect(pageSizeOptionsElements).toBeInTheDocument();
  });

  /**
   * 测试 page_size_options 数组项不是数字时，应输出警告并使用默认值
   */
  it('page_size_options 数组项不是数字时，应输出警告并使用默认值', () => {
    const spy = vi.spyOn(console, 'warn');
    render(Pagination, { props: { total_items: 100, page_size_options: ['hhah', 'kshf'] } });

    // 检查警告信息
    expect(spy).toHaveBeenCalledWith('[Pagination] page_size_options[1] 应该是一个数字，当前为 string');

    // 检查是否使用默认值
    const pageSizeOptionsElements = screen.getByText('10条/页');
    expect(pageSizeOptionsElements).toBeInTheDocument();
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

    // 等待并确保总条数显示
    const totalItemsText = await screen.findByText(`共 ${total_items} 条`);
    expect(totalItemsText).toBeInTheDocument(); // 验证总条数
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

  it('Select组件元素应正确渲染', async () => {
    const { component } = render(Pagination, {
      props: {
        total_items: 100,
        page_size: 10,
      },
    });

    expect(screen.getByText('10条/页')).toBeInTheDocument();
    expect(screen.getByText('20条/页')).toBeInTheDocument();
    expect(screen.getByText('30条/页')).toBeInTheDocument();
    expect(screen.getByText('40条/页')).toBeInTheDocument();
    expect(screen.getByText('50条/页')).toBeInTheDocument();
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
        current_page: 10,
        page_size_options,
      },
    });

    // 点击上一页按钮
    const prevButton = screen.getByTestId('left_jt');

    // 第九页
    await fireEvent.click(prevButton);
    expect(screen.getByText('9')).toHaveClass('active');

    // 第八页
    await fireEvent.click(prevButton);
    expect(screen.getByText('8')).toHaveClass('active');

    // 第七页
    await fireEvent.click(prevButton);
    expect(screen.getByText('7')).toHaveClass('active');

    // 第六页
    await fireEvent.click(prevButton);
    expect(screen.getByText('6')).toHaveClass('active');

    // 第五页
    await fireEvent.click(prevButton);
    expect(screen.getByText('5')).toHaveClass('active');

    // 第四页
    await fireEvent.click(prevButton);
    expect(screen.getByText('4')).toHaveClass('active');

    // 第三页
    await fireEvent.click(prevButton);
    expect(screen.getByText('3')).toHaveClass('active');

    // 第二页
    await fireEvent.click(prevButton);
    expect(screen.getByText('2')).toHaveClass('active');

    // 第一页
    await fireEvent.click(prevButton);
    expect(screen.getByText('1')).toHaveClass('active');

    // 第一页
    await fireEvent.click(prevButton);
    expect(prevButton).toBeDisabled();
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

    // 第二页
    await fireEvent.click(nextButton);
    expect(screen.getByText('2')).toHaveClass('active');

    // 第三页
    await fireEvent.click(nextButton);
    expect(screen.getByText('3')).toHaveClass('active');

    // 第四页
    await fireEvent.click(nextButton);
    expect(screen.getByText('4')).toHaveClass('active');

    // 第五页
    await fireEvent.click(nextButton);
    expect(screen.getByText('5')).toHaveClass('active');

    // 第六页
    await fireEvent.click(nextButton);
    expect(screen.getByText('6')).toHaveClass('active');

    // 第七页
    await fireEvent.click(nextButton);
    expect(screen.getByText('7')).toHaveClass('active');

    // 第八页
    await fireEvent.click(nextButton);
    expect(screen.getByText('8')).toHaveClass('active');

    // 第九页
    await fireEvent.click(nextButton);
    expect(screen.getByText('9')).toHaveClass('active');

    // 第10页
    await fireEvent.click(nextButton);
    expect(screen.getByText('10')).toHaveClass('active');

    // 第10页
    await fireEvent.click(nextButton);
    expect(screen.getByText('10')).toHaveClass('active');

    expect(nextButton).toBeDisabled(); // 验证下一页按钮是否禁用
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

  it('应处理无效页码跳转', async () => {
    const { component } = render(Pagination, {
      props: {
        total_items: 100,
        current_page: 3,
      },
    });

    // 尝试跳转到无效页码
    const jumpInput = screen.getByTestId('jump-to-input');
    await fireEvent.input(jumpInput, { target: { value: '0' } });
    await fireEvent.keyDown(jumpInput, { key: 'Enter' });

    // 确认没有跳转
    const pageButton = screen.getByText('3');
    expect(pageButton).toHaveClass('active');

    // 尝试跳转到无效页码
    await fireEvent.input(jumpInput, { target: { value: '11' } });
    await fireEvent.keyDown(jumpInput, { key: 'Enter' });

    // 确认没有跳转
    expect(pageButton).toHaveClass('active');

    // 尝试跳转到有效页码
    await fireEvent.input(jumpInput, { target: { value: '4' } });
    await fireEvent.keyDown(jumpInput, { key: 'Enter' });

    expect(screen.getByText('4')).toHaveClass('active');
  });

  it('应处理跳转输入的非数字值', async () => {
    render(Pagination, {
      props: {
        total_items: 100,
        current_page: 1,
      },
    });

    const input = screen.getByTestId('jump-to-input');
    await fireEvent.input(input, { target: { value: 'abc' } });
    await fireEvent.keyDown(input, { key: 'Enter' });

    // 当前页应保持为1
    expect(screen.getByText('1')).toHaveClass('active');
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

  it('应正确显示中间页码(当前页既不靠前也不靠后)', async () => {
    render(Pagination, {
      props: {
        total_items: 100, // 共10页
        current_page: 6, // 中间页码
        page_size: 10,
      },
    });

    // 应显示: 1 ...  4 5 6 7 8 ... 10
    // 获取所有省略号
    const dots = screen.getAllByText('...');
    expect(dots.length).toBe(2); // 确认有两个省略号

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
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

  it('应正确处理pageSize变化', async () => {
    const { component } = render(Pagination, {
      props: {
        total_items: 100,
        page_size: 10,
      },
    });

    expect(screen.getByText('10条/页')).toBeInTheDocument();
    expect(screen.getByText('20条/页')).toBeInTheDocument();
    expect(screen.getByText('30条/页')).toBeInTheDocument();
    expect(screen.getByText('40条/页')).toBeInTheDocument();
    expect(screen.getByText('50条/页')).toBeInTheDocument();

    // 验证一开始有按钮10
    expect(screen.getByText('10')).toBeInTheDocument();

    fireEvent.click(screen.getByText('20条/页'));

    expect(screen.getByText('5')).toBeInTheDocument();

    // pageSize变大后，按钮10消失
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  it('应正确处理当前页大于总页数的情况', async () => {
    const { component } = render(Pagination, {
      props: {
        total_items: 100,
        page_size: 10,
        current_page: 10,
      },
    });

    expect(screen.getByText('10条/页')).toBeInTheDocument();
    expect(screen.getByText('20条/页')).toBeInTheDocument();
    expect(screen.getByText('30条/页')).toBeInTheDocument();
    expect(screen.getByText('40条/页')).toBeInTheDocument();
    expect(screen.getByText('50条/页')).toBeInTheDocument();

    fireEvent.click(screen.getByText('20条/页'));

    const pageButton = screen.getByText('5');
    expect(pageButton).toHaveClass('active');
  });

  it('应正确处理多次改变pageSize', async () => {
    const { component } = render(Pagination, {
      props: {
        total_items: 100,
        page_size: 10,
        current_page: 10,
      },
    });

    await screen.findByText(`共 ${total_items} 条`);

    expect(screen.getByText('10条/页')).toBeInTheDocument();
    expect(screen.getByText('20条/页')).toBeInTheDocument();
    expect(screen.getByText('30条/页')).toBeInTheDocument();
    expect(screen.getByText('40条/页')).toBeInTheDocument();
    expect(screen.getByText('50条/页')).toBeInTheDocument();

    // 初始第十页为高亮状态
    expect(screen.getByText('10')).toHaveClass('active');

    fireEvent.click(screen.getByText('20条/页'));
    expect(screen.getByText('5')).toHaveClass('active');

    fireEvent.click(screen.getByText('30条/页'));
    expect(screen.getByText('4')).toHaveClass('active');

    fireEvent.click(screen.getByText('40条/页'));
    expect(screen.getByText('3')).toHaveClass('active');

    fireEvent.click(screen.getByText('50条/页'));
    expect(screen.getByText('2')).toHaveClass('active');

    fireEvent.click(screen.getByText('40条/页'));
    expect(screen.getByText('2')).toHaveClass('active');

    fireEvent.click(screen.getByText('30条/页'));
    expect(screen.getByText('2')).toHaveClass('active');

    fireEvent.click(screen.getByText('20条/页'));
    expect(screen.getByText('2')).toHaveClass('active');

    fireEvent.click(screen.getByText('10条/页'));
    expect(screen.getByText('2')).toHaveClass('active');
  });
});
