import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import ExamList from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';

// 单元测试：不依赖整个应用的上下文环境（比如路由、网络、后端接口等），
// mock（模拟） 替代依赖，比如模拟 store、模拟 API 数据、模拟子组件等。

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn() } }));

const MOCK_EXAMS = [
  {
    id: 1,
    name: '考试一',
    exam_sessions: [
      {
        paper_name: '试卷A',
        start_time: new Date('2025-08-01T09:00').getTime(),
        end_time: new Date('2025-08-01T11:00').getTime(),
        status: '12',
        examinee_status: '10',
        student_score: 85,
        total_score: 100,
      },
      {
        paper_name: '试卷C',
        start_time: new Date('2025-08-02T09:00').getTime(),
        end_time: new Date('2025-08-02T11:00').getTime(),
        status: '10',
        examinee_status: '10',
        student_score: 66,
        total_score: 100,
      },
    ],
  },
  {
    id: 2,
    name: '考试二',
    exam_sessions: [
      {
        paper_name: '试卷B',
        start_time: new Date('2025-08-02T09:00').getTime(),
        end_time: new Date('2025-08-02T11:00').getTime(),
        status: '22',
        examinee_status: '22',
        student_score: 50,
        total_score: 100,
      },
    ],
  },
  {
    id: 3,
    name: '考试三',
    exam_sessions: [
      {
        paper_name: '试卷B',
        start_time: new Date('2025-08-02T09:00').getTime(),
        end_time: new Date('2025-08-02T11:00').getTime(),
        status: '06',
        examinee_status: '10',
        student_score: 50,
        total_score: 100,
      },
    ],
  },
  {
    id: 5,
    name: '考试四',
    exam_sessions: [
      {
        paper_name: '试卷B',
        start_time: new Date('2025-08-02T09:00').getTime(),
        end_time: new Date('2025-08-02T11:00').getTime(),
        status: '12',
        examinee_status: '10',
        student_score: 50,
        total_score: 100,
      },
    ],
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

const setup = () => {
  render(ExamList);
  return {
    search: () => fireEvent.click(screen.getByRole('button', { name: '搜索' })),

    reset: () => fireEvent.click(screen.getByRole('button', { name: '重置' })),

    nameInput: () => screen.getByPlaceholderText('请输入信息'),

    toggleDropdown: () => fireEvent.click(screen.getByRole('button', { name: 'Toggle dropdown' })),
    selectOption: async (text) => {
      await within(screen.getByTestId('exam-status-select')).findByText(text).then(fireEvent.click);
    },

    paginationSelect: () => screen.getByRole('combobox'),
    paginationOption: async (select, text) => {
      const option = Array.from(select.options).find((opt) => opt.text === text);
      await fireEvent.change(select, { target: { value: option.value } });
    },
    paginationInput: () => screen.getByRole('spinbutton'),

    datePickerOpen: () => fireEvent.click(within(screen.getByTestId('datePicker')).getByRole('textbox')),
    datePickerSelect0: () => fireEvent.click(screen.getAllByRole('button', { name: '28' })[0]),
    datePickerSelect2: () => fireEvent.click(screen.getAllByRole('button', { name: '28' })[2]),
    datePickerClose: () => fireEvent.click(screen.getByRole('button', { name: '确定' })),
  };
};

describe('考试列表组件测试', () => {
  beforeEach(() => vi.clearAllMocks());

  it('应渲染页面核心元素', () => {
    render(ExamList);
    expect(screen.getByPlaceholderText('请输入信息')).toBeInTheDocument();
    expect(screen.getByTestId('datePicker')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请选择')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '搜索' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('支持输入考试名称和选择考试状态', async () => {
    const { nameInput, toggleDropdown, selectOption } = setup();

    await fireEvent.input(nameInput(), { target: { value: '测试考试' } });
    expect(nameInput()).toHaveValue('测试考试');

    await toggleDropdown();
    await selectOption('进行中');
    expect(screen.getByTestId('exam-status-select')).toHaveTextContent('进行中');
  });

  describe('搜索功能', () => {
    it('成功加载考试数据', async () => {
      mockFetch({ status: 0, data: [...MOCK_EXAMS, { id: 55, name: '无场次考试' }], rowCount: 1 });
      const { search } = setup();
      await search();

      await waitFor(() => {
        expect(screen.getByText('考试一')).toBeInTheDocument();
        expect(screen.getByText('试卷A')).toBeInTheDocument();
        expect(screen.getByText('2025-08-01 09:00 ~ 2025-08-01 11:00')).toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
      });
    });

    it('无数据时展示暂无信息', async () => {
      mockFetch({ status: 0 });
      const { search } = setup();
      await search();

      await waitFor(() => {
        expect(screen.getByText('暂无考试数据')).toBeInTheDocument();
      });
    });

    it('响应非 2xx 应提示错误', async () => {
      global.fetch = vi.fn(() => Promise.resolve({ ok: false }));
      const { search } = setup();
      await search();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('请求失败');
      });
    });

    it('请求失败显示后端返回的 msg', async () => {
      mockFetch({ status: -1, msg: '模拟失败消息' });
      const { search } = setup();
      await search();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('模拟失败消息');
      });
    });

    it('请求失败但无 msg，使用默认错误提示', async () => {
      mockFetch({ status: -1 });
      const { search } = setup();
      await search();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('获取考试列表失败');
      });
    });
  });

  it('输入页号和页大小发送请求获取数据', async () => {
    mockFetch({
      status: 0,
      data: [...Array(15)].map((_, i) => ({
        ...MOCK_EXAMS[0],
        id: i + 1,
        name: `考试 ${i + 1}`,
      })),
      rowCount: 15,
    });

    const { paginationSelect, paginationOption, paginationInput, search } = setup();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1); // onMount中会发送一次请求
    });

    const input = paginationInput();
    await fireEvent.input(input, { target: { value: 2 } });
    await fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 }); // 发送一次请求

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2); // onMount中会发送一次请求
    });

    await paginationOption(paginationSelect(), '20条/页'); // 发送一次请求

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3); // onMount中会发送一次请求
    });
  });

  it('选择开始和结束日期发送请求获取数据', async () => {
    mockFetch({
      status: 1,
      data: MOCK_EXAMS,
    });

    const { search, datePickerOpen, datePickerSelect0, datePickerSelect2, datePickerClose } = setup();
    await datePickerOpen();
    await datePickerSelect0();
    await datePickerSelect2();
    await datePickerClose();

    await search();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  //TODO 路径补全
  it('点击“进入考试”按钮跳转考试页', async () => {
    mockFetch({
      status: 0,
      data: MOCK_EXAMS.map((e) => ({ ...e, exam_sessions: [{ ...e.exam_sessions[0], status: '04' }] })),
    });

    const { search } = setup();
    await search();

    await waitFor(() => fireEvent.click(screen.getAllByText('进入考试')[0]));
    expect(goto).toHaveBeenCalledWith(expect.stringContaining('/student/answer/exam-detail'));
  });

  it('点击“查看试卷”按钮跳转详情页', async () => {
    mockFetch({ status: 0, data: MOCK_EXAMS });
    const { search } = setup();
    await search();

    await waitFor(() => fireEvent.click(screen.getAllByText('查看试卷')[0]));
    // expect(goto).toHaveBeenCalledWith('/student/');
  });

  it('重置按钮清空所有筛选条件', async () => {
    const {
      nameInput,
      toggleDropdown,
      selectOption,
      datePickerOpen,
      datePickerSelect0,
      datePickerSelect2,
      datePickerClose,
      reset,
    } = setup();

    // 考试名称
    await fireEvent.input(nameInput(), { target: { value: '测试考试' } });
    expect(nameInput()).toHaveValue('测试考试');

    // 考试状态
    await toggleDropdown();
    await selectOption('进行中');
    expect(screen.getByTestId('exam-status-select')).toHaveTextContent('进行中');

    // 日期选择
    await datePickerOpen();
    await datePickerSelect0();
    await datePickerSelect2();
    await datePickerClose();

    await reset();

    const dropdownInput = within(screen.getByTestId('exam-status-select')).getByRole('textbox');
    expect(nameInput()).toHaveValue('');
    expect(dropdownInput).toHaveValue('全部');
    expect(screen.getByDisplayValue(/开始日期/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/结束日期/)).toBeInTheDocument(); // 内部变量无法测试？
  });
});
