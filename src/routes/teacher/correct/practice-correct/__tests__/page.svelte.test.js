import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import PracticeList from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn() } }));

function mockFetch(data) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    }),
  );
}

describe('练习列表组件测试', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应渲染页面核心元素', () => {
    render(PracticeList);

    expect(screen.getByPlaceholderText('请输入信息')).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('练习名称');
    // expect(screen.getByRole('table')).toHaveTextContent('练习类型');
    expect(screen.getByRole('table')).toHaveTextContent('作答人数');
    expect(screen.getByRole('table')).toHaveTextContent('待批改人数');
    expect(screen.getByRole('table')).toHaveTextContent('批阅方式');
    expect(screen.getByRole('table')).toHaveTextContent('操作');
  });

  it('练习批阅方式映射测试', () => {});

  it('输入框输入练习名称筛选练习功能测试', async () => {
    mockFetch({
      status: 0,
      data: {
        practice_list: [
          {
            id: 20,
            name: '练习1',
            respondent_count: 10,
            unmarked_student_count: 7,
            mark_mode: '00',
          },
        ],
      },
      rowCount: 1,
    });

    render(PracticeList);

    const input = screen.getByPlaceholderText('请输入信息');
    await fireEvent.input(input, { target: { value: '测试练习' } });
    await expect(input).toHaveValue('测试练习');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2); // onMount中会发送一次请求
    });
  });

  it('输入练习名称防抖搜索功能测试', async () => {
    mockFetch({
      status: 0,
      data: {
        practice_list: [],
        rowCount: 0,
      },
    });

    render(PracticeList);

    const input = screen.getByPlaceholderText('请输入信息');

    // 快速输入多个字符
    await fireEvent.input(input, { target: { value: '测' } });
    await fireEvent.input(input, { target: { value: '测试' } });
    await fireEvent.input(input, { target: { value: '测试练' } });
    await fireEvent.input(input, { target: { value: '测试练习' } });

    // 等待防抖时间过去
    await new Promise((resolve) => setTimeout(resolve, 600));

    await waitFor(() => {
      // 应该发送两次请求（onMount + 防抖后的请求）
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('practice_name=测试练习'));
    });
  });

  describe('fetch功能测试', () => {
    it('接收到正常的响应', async () => {
      const mockData = {
        status: 0,
        data: {
          practice_list: [
            {
              id: 20,
              name: '练习1',
              respondent_count: 10,
              unmarked_student_count: 7,
              mark_mode: '00',
            },
          ],
        },
        rowCount: 1,
      };

      mockFetch(mockData);

      render(PracticeList);

      await waitFor(() => {
        expect(screen.getByText('练习1')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('自动 (AI)')).toBeInTheDocument();
      });
    });

    it('接收到的响应码不是 2xx', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('服务器出错啦'),
        }),
      );

      render(PracticeList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('请求失败：500 Internal Server Error-服务器出错啦'),
        );
      });
    });

    it('请求失败显示后端返回的 msg', async () => {
      mockFetch({
        status: -1,
        msg: '数据库操作失败',
      });

      render(PracticeList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('数据库操作失败'));
      });
    });

    it('请求失败但无 msg，使用默认错误提示', async () => {
      mockFetch({
        status: -1,
      });

      render(PracticeList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('获取练习列表失败'));
      });
    });
  });

  it('输入页号和页大小发送请求获取数据', async () => {
    mockFetch({
      status: 0,
      data: {
        practice_list: [...Array(15)].map((_, i) => ({
          id: i + 1,
          name: `练习 ${i + 1}`,
          respondent_count: 10,
          unmarked_student_count: 7,
          mark_mode: '00',
        })),
      },
      rowCount: 15,
    });

    render(PracticeList);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1); // onMount中会发送一次请求
    });

    await screen.findByText('共 15 条');

    const input = screen.getByRole('spinbutton');
    await fireEvent.input(input, { target: { value: 2 } });
    await fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 }); // 发送一次请求

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    await fireEvent.click(screen.getByRole('button', { name: 'Toggle dropdown' }));
    await fireEvent.click(screen.getByText('20条/页')); // 发送一次请求

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  it('自动批改的练习无法进入批改的功能测试', () => {});

  it('点击进入批改跳转到批改页面的测试', async () => {
    mockFetch({
      status: 0,
      data: {
        practice_list: [
          {
            id: 20,
            name: '练习1',
            respondent_count: 10,
            unmarked_student_count: 7,
            mark_mode: '10',
          },
        ],
      },
      rowCount: 1,
    });

    render(PracticeList);

    await fireEvent.click(screen.getByRole('button', { name: '进入批改' }));

    expect(goto).toHaveBeenCalledWith(expect.stringContaining('/teacher/correct/correct'));
  });

  // it('点击查看详情跳转到详情页面的测试', () => {});
});
