import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import ExamList from '../+page.svelte';
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

describe('考试列表组件测试', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应渲染页面核心元素', () => {
    render(ExamList);

    expect(screen.getByPlaceholderText('请输入信息')).toBeInTheDocument();
    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('考试名称');
    expect(screen.getByRole('table')).toHaveTextContent('考试类型');
    expect(screen.getByRole('table')).toHaveTextContent('考试场次');
    expect(screen.getByRole('table')).toHaveTextContent('考试时间');
    expect(screen.getByRole('table')).toHaveTextContent('考试状态');
    expect(screen.getByRole('table')).toHaveTextContent('作答人数');
    expect(screen.getByRole('table')).toHaveTextContent('待批改数');
    expect(screen.getByRole('table')).toHaveTextContent('批阅方式');
    expect(screen.getByRole('table')).toHaveTextContent('批改状态');
    expect(screen.getByRole('table')).toHaveTextContent('操作');
  });

  it('考试批阅方式映射测试', () => {});
  it('考试批阅方式映射测试', () => {});
  it('考试批阅方式映射测试', () => {});

  it('输入框输入考试名称筛选考试功能测试', async () => {
    mockFetch({
      status: 0,
      data: {
        exam_list: [
          {
            id: 6,
            name: 'H34',
            type: '00',
            exam_sessions: [
              {
                id: 11,
                name: 'session_name',
                start_time: new Date('2025-08-01T09:00').getTime(),
                end_time: new Date('2025-08-01T11:00').getTime(),
                mark_mode: '02',
                respondent_count: 12,
                unmarked_student_count: 10,
                status: '06',
                mark_status: '00',
              },
            ],
          },
        ],
      },
      rowCount: 1,
    });

    render(ExamList);

    const input = screen.getByPlaceholderText('请输入信息');
    await fireEvent.input(input, { target: { value: '测试考试' } });
    await expect(input).toHaveValue('测试考试');

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2); // onMount中会发送一次请求
    });
  });

  it('输入考试名称防抖搜索功能测试', async () => {
    mockFetch({
      status: 0,
      data: {
        exam_list: [],
      },
      rowCount: 0,
    });

    render(ExamList);

    const input = screen.getByPlaceholderText('请输入信息');

    // 快速输入多个字符
    await fireEvent.input(input, { target: { value: '测' } });
    await fireEvent.input(input, { target: { value: '测试' } });
    await fireEvent.input(input, { target: { value: '测试考' } });
    await fireEvent.input(input, { target: { value: '测试考试' } });

    // 等待防抖时间过去
    await new Promise((resolve) => setTimeout(resolve, 600));

    await waitFor(() => {
      // 应该发送两次请求（onMount + 防抖后的请求）
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining('exam_name=测试考试'));
    });
  });

  it('选择日期后可以筛选考试功能测试', () => {});

  describe('fetch功能测试', () => {
    it('接收到正常的响应', async () => {
      const mockData = {
        status: 0,
        data: {
          exam_list: [
            {
              id: 1,
              name: '测试考试',
              type: '00',
              exam_sessions: [
                {
                  id: 1,
                  name: '第一场',
                  start_time: new Date('2025-08-01T09:00').getTime(),
                  end_time: new Date('2025-08-01T11:00').getTime(),
                  mark_mode: '02',
                  respondent_count: 10,
                  unmarked_student_count: 5,
                  status: '06',
                  mark_status: '00',
                },
              ],
            },
          ],
          rowCount: 1,
        },
      };

      mockFetch(mockData);

      render(ExamList);

      await waitFor(() => {
        expect(screen.getByText('测试考试')).toBeInTheDocument();
        expect(screen.getByText('平时考试')).toBeInTheDocument();
        expect(screen.getByText('第一场')).toBeInTheDocument();
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

      render(ExamList);

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

      render(ExamList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('数据库操作失败'));
      });
    });

    it('请求失败但无 msg，使用默认错误提示', async () => {
      mockFetch({
        status: -1,
      });

      render(ExamList);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('获取考试列表失败'));
      });
    });
  });

  it('输入页号和页大小发送请求获取数据', async () => {
    mockFetch({
      status: 0,
      data: {
        exam_list: [...Array(15)].map((_, i) => ({
          id: i + 1,
          name: `考试 ${i + 1}`,
          type: '00',
          exam_sessions: [
            {
              id: 11,
              name: 'session_name',
              start_time: new Date('2025-08-01T09:00').getTime(),
              end_time: new Date('2025-08-01T11:00').getTime(),
              mark_mode: '02',
              respondent_count: 12,
              unmarked_student_count: 10,
              status: '06',
              mark_status: '00',
            },
          ],
        })),
      },
      rowCount: 15,
    });

    render(ExamList);

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

  it('点击进入批改跳转到批改页面的测试', async () => {
    mockFetch({
      status: 0,
      data: {
        exam_list: [
          {
            id: 6,
            name: '数学期末',
            type: '00',
            exam_sessions: [
              {
                id: 11,
                name: '数学考试',
                start_time: new Date('2025-08-01T09:00').getTime(),
                end_time: new Date('2025-08-01T11:00').getTime(),
                mark_mode: '02',
                respondent_count: 12,
                unmarked_student_count: 10,
                status: '06',
                mark_status: '00',
              },
            ],
          },
        ],
      },
      rowCount: 1,
    });

    render(ExamList);

    await fireEvent.click(screen.getByRole('button', { name: '进入批改' }));

    expect(goto).toHaveBeenCalledWith(expect.stringContaining('/teacher/correct/correct'));
  });

  it('点击查看详情跳转到详情页面的测试', () => {});

  it('点击提交按钮提交对应批改功能测试', () => {});
});
