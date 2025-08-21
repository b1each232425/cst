import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import PracticeCorrectList from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn() } }));

const MOCK_PRACTICES = [
  {
    id: 1,
    name: '基础语法练习',
    respondent_count: 15,
    unmarked_student_count: 5,
    mark_mode: '10', // 手动批改
  },
  {
    id: 2,
    name: '数据结构练习',
    respondent_count: 20,
    unmarked_student_count: 0, // 没有待批改
    mark_mode: '10',
  },
  {
    id: 3,
    name: '算法练习',
    respondent_count: 10,
    unmarked_student_count: 3,
    mark_mode: '00', // 自动批改
  },
  {
    id: 4,
    name: '未知批改方式练习',
    respondent_count: 8,
    unmarked_student_count: 2,
    mark_mode: '99', // 未知状态
  },
];

function mockFetch(data) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}

describe('教师端练习批改列表测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch({
      status: 0,
      data: {
        practice_list: MOCK_PRACTICES,
      },
      rowCount: MOCK_PRACTICES.length,
    });
  });

  it('应渲染页面核心元素', async () => {
    render(PracticeCorrectList);

    expect(screen.getByText('练习批改')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入信息')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();

    // 验证表头
    const tableHeaders = screen.getAllByRole('columnheader');
    expect(tableHeaders).toHaveLength(5);
    expect(tableHeaders[0]).toHaveTextContent('练习名称');
    expect(tableHeaders[1]).toHaveTextContent('作答人数');
    expect(tableHeaders[2]).toHaveTextContent('待批改人数');
    expect(tableHeaders[3]).toHaveTextContent('批阅方式');
    expect(tableHeaders[4]).toHaveTextContent('操作');
  });

  it('应正确显示练习数据', async () => {
    render(PracticeCorrectList);

    await waitFor(() => {
      // 验证第一条练习数据
      const row1 = screen.getByText('基础语法练习').closest('tr');
      expect(within(row1).getByText('15')).toBeInTheDocument();
      expect(within(row1).getByText('5')).toBeInTheDocument();
      expect(within(row1).getByText('手动')).toBeInTheDocument();
      expect(within(row1).getByRole('button', { name: '进入批改' })).toBeInTheDocument();

      // 验证自动批改的练习
      const row3 = screen.getByText('算法练习').closest('tr');
      expect(within(row3).getByText('自动 (AI)')).toBeInTheDocument();

      // 验证未知批改方式
      const row4 = screen.getByText('未知批改方式练习').closest('tr');
      expect(within(row4).getByText('未知状态')).toBeInTheDocument();
      expect(within(row4).getByText('未知状态')).toHaveClass('unknown');
    });
  });

  describe('搜索功能', () => {
    it('输入练习名称应触发搜索', async () => {
      render(PracticeCorrectList);

      const input = screen.getByPlaceholderText('请输入信息');
      await fireEvent.input(input, { target: { value: '测试' } });

      // 等待防抖
      await new Promise((resolve) => setTimeout(resolve, 600));

      await waitFor(() => {
        // 修改断言，只检查URL字符串
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('practice_name=测试'));
      });
    });

    it('快速输入应只触发一次搜索(防抖)', async () => {
      render(PracticeCorrectList);

      const input = screen.getByPlaceholderText('请输入信息');

      // 快速输入多个字符
      await fireEvent.input(input, { target: { value: '测' } });
      await fireEvent.input(input, { target: { value: '测试' } });
      await fireEvent.input(input, { target: { value: '测试练' } });
      await fireEvent.input(input, { target: { value: '测试练习' } });

      // 等待防抖时间
      await new Promise((resolve) => setTimeout(resolve, 600));

      await waitFor(() => {
        // 初始加载一次 + 防抖后一次
        expect(global.fetch).toHaveBeenCalledTimes(2);
        // 修改断言，只检查URL字符串
        expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('practice_name=测试练习'));
      });
    });
  });

  describe('分页功能', () => {
    beforeEach(() => {
      mockFetch({
        status: 0,
        data: {
          practice_list: [...Array(15)].map((_, i) => ({
            ...MOCK_PRACTICES[0],
            id: i + 1,
            name: `练习 ${i + 1}`,
          })),
        },
        rowCount: 15,
      });
    });

    it('改变页码应触发新的请求', async () => {
      render(PracticeCorrectList);

      const input = screen.getByRole('spinbutton');
      await fireEvent.input(input, { target: { value: 2 } });
      await fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
      });
    });

    it('改变每页数量应触发新的请求', async () => {
      render(PracticeCorrectList);

      await fireEvent.click(screen.getByRole('button', { name: 'Toggle dropdown' }));
      await fireEvent.click(screen.getByText('20条/页'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page_size=20'));
      });
    });
  });

  describe('操作按钮', () => {
    it('有待批改且手动批改的练习应显示可点击的"进入批改"按钮', async () => {
      render(PracticeCorrectList);

      await waitFor(() => {
        const button = screen.getAllByRole('button', { name: '进入批改' })[0];
        expect(button).not.toHaveAttribute('disabled');
        expect(button).not.toHaveClass('disabled');
      });
    });

    it('没有待批改的练习应显示禁用的"进入批改"按钮', async () => {
      render(PracticeCorrectList);

      await waitFor(() => {
        const row = screen.getByText('数据结构练习').closest('tr');
        const button = within(row).getByRole('button', { name: '进入批改' });
        expect(button).toHaveAttribute('disabled');
        expect(button).toHaveClass('disabled');
      });
    });

    it('自动批改的练习应显示禁用的"进入批改"按钮', async () => {
      render(PracticeCorrectList);

      await waitFor(() => {
        const row = screen.getByText('算法练习').closest('tr');
        const button = within(row).getByRole('button', { name: '进入批改' });
        expect(button).toHaveAttribute('disabled');
        expect(button).toHaveClass('disabled');
      });
    });

    it('点击"进入批改"应跳转到批改页面', async () => {
      render(PracticeCorrectList);

      await waitFor(() => {
        const button = screen.getAllByRole('button', { name: '进入批改' })[0];
        fireEvent.click(button);
        expect(goto).toHaveBeenCalledWith('/teacher/correct/correct?name=基础语法练习&practice_id=1');
      });
    });
  });

  describe('错误处理', () => {
    it('请求失败应显示错误提示', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('服务器错误'),
        }),
      );

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error-服务器错误');
      });
    });

    it('后端返回错误状态应显示错误消息', async () => {
      mockFetch({
        status: -1,
        msg: '数据库连接失败',
      });

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('数据库连接失败');
      });
    });

    it('无数据时应显示空状态提示', async () => {
      mockFetch({
        status: 0,
        data: {
          practice_list: [],
        },
        rowCount: 0,
      });

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
      });
    });

    it('响应非 2xx 应提示错误（有error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve('具体错误信息'),
        }),
      );

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：400 Bad Request-具体错误信息');
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
      });
    });

    it('响应非 2xx 应提示错误（无error_text）', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve(),
        }),
      );

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败：500 Internal Server Error');
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
      });
    });

    it('practice_list 为 0，应提示错误数据类型错误', async () => {
      mockFetch({
        status: 0,
        data: {
          practice_list: 0, // 错误的数据类型
        },
        rowCount: 0,
      });

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('practice_list 数据类型错误');
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
      });
    });

    it('practice_list 为 null 不会显示错误', async () => {
      mockFetch({
        status: 0,
        data: {
          practice_list: null, // 允许为null
        },
        rowCount: 0,
      });

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(toast.error).not.toHaveBeenCalled();
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
      });
    });

    it('rowCount 没有返回，应默认为0', async () => {
      mockFetch({
        status: 0,
        data: {
          practice_list: null,
        },
      });

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
      });
    });

    it('后端返回错误状态应显示错误消息', async () => {
      mockFetch({
        status: -1,
        msg: '数据库连接失败',
      });

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('数据库连接失败');
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
      });
    });

    it('请求失败但无 msg，使用默认错误提示', async () => {
      mockFetch({
        status: -1,
      });

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('获取练习列表失败');
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
      });
    });

    it('网络错误应捕获并提示', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('网络断开')));

      render(PracticeCorrectList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('网络断开');
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
      });
    });
  });
});
