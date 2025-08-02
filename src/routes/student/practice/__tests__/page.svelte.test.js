import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import PracticeList from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn() } }));

const MOCK_PRACTICES = [
  // 00: 没有作答过 → 进入练习
  {
    ID: 1,
    Name: '练习一',
    Type: '00',
    AttemptCount: 0,
    Difficulty: '00',
    AllowedAttempts: 5,
    QuestionCount: 10,
    WrongCount: 0,
    TotalScore: null,
    HighestScore: null,
    PaperTotalScore: 100,
    PaperID: 101,
    LatestUnsubmittedID: 0,
    LatestSubmittedID: null,
  },
  // 02: 正常可重新作答 → 重新作答、查看上次作答
  {
    ID: 2,
    Name: '练习二',
    Type: '00',
    AttemptCount: 2,
    Difficulty: '00',
    AllowedAttempts: 5,
    QuestionCount: 8,
    WrongCount: 1,
    TotalScore: 80,
    HighestScore: 90,
    PaperTotalScore: 100,
    PaperID: 102,
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 12,
  },
  // 04: 存在未提交记录且不是第一次答题 → 继续作答、查看上次作答
  {
    ID: 3,
    Name: '练习三',
    Type: '00',
    AttemptCount: 2,
    Difficulty: '05',
    AllowedAttempts: 5,
    QuestionCount: 12,
    WrongCount: 2,
    TotalScore: 70,
    HighestScore: 85,
    PaperTotalScore: 100,
    PaperID: 103,
    LatestUnsubmittedID: 33,
    LatestSubmittedID: 22,
  },
  // 06: 已提交但未批改（本次作答未批改，不能进行下一次作答）→ 等待批改完成
  {
    ID: 4,
    Name: '练习四',
    Type: '00',
    AttemptCount: 1,
    Difficulty: '02',
    AllowedAttempts: 5,
    QuestionCount: 15,
    WrongCount: 3,
    TotalScore: null,
    HighestScore: 92,
    PaperTotalScore: 100,
    PaperID: 104,
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 44,
  },
  // 08: 达到最大尝试次数 → 查看上次作答
  {
    ID: 5,
    Name: '练习五',
    Type: '00',
    AttemptCount: 5,
    Difficulty: '02',
    AllowedAttempts: 5,
    QuestionCount: 10,
    WrongCount: 5,
    TotalScore: 75,
    HighestScore: 90,
    PaperTotalScore: 100,
    PaperID: 105,
    LatestUnsubmittedID: 0,
    LatestSubmittedID: 55,
  },
  // 10: 存在未提交记录且是第一次答题 → 继续作答
  {
    ID: 6,
    Name: '练习六',
    Type: '00',
    AttemptCount: 1,
    Difficulty: '04',
    AllowedAttempts: 0,
    QuestionCount: 20,
    WrongCount: 10,
    TotalScore: null,
    HighestScore: 88,
    PaperTotalScore: 100,
    PaperID: 106,
    LatestUnsubmittedID: 66,
    LatestSubmittedID: null,
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
  render(PracticeList);
  return {
    search: () => fireEvent.click(screen.getByRole('button', { name: '搜索' })),

    reset: () => fireEvent.click(screen.getByRole('button', { name: '重置' })),

    nameInput: () => screen.getByPlaceholderText('练习名称 / 知识点'),

    toggleDropdown: () => fireEvent.click(screen.getByRole('button', { name: 'Toggle dropdown' })),
    selectOption: async (text) => {
      await within(screen.getByTestId('difficult-select')).findByText(text).then(fireEvent.click);
    },

    tab0: () => fireEvent.click(screen.getByRole('button', { name: '经典巩固' })),
    tab1: () => fireEvent.click(screen.getByRole('button', { name: '常练常新' })),
    tab2: () => fireEvent.click(screen.getByRole('button', { name: '智能提升' })),

    paginationSelect: () => screen.getByRole('combobox'),
    paginationOption: async (select, text) => {
      const option = Array.from(select.options).find((opt) => opt.text === text);
      await fireEvent.change(select, { target: { value: option.value } });
    },
    paginationInput: () => screen.getByRole('spinbutton'),
  };
};

describe('练习列表组件测试', () => {
  beforeEach(() => vi.clearAllMocks());

  it('支持输入练习名称/知识点和选择练习难度', async () => {
    const { nameInput, toggleDropdown, selectOption } = setup();

    await fireEvent.input(nameInput(), { target: { value: '测试练习' } });
    expect(nameInput()).toHaveValue('测试练习');

    await toggleDropdown();
    await selectOption('中等');
    expect(screen.getByTestId('difficult-select')).toHaveTextContent('中等');
  });

  describe('搜索功能', () => {
    it('成功加载练习数据', async () => {
      mockFetch({
        status: 0,
        data: {
          practices: [MOCK_PRACTICES[0]],
          total: 1,
        },
      });
      const { search } = setup();
      await search();

      await waitFor(() => {
        expect(screen.getByText('练习一')).toBeInTheDocument();
      });
    });

    it('无数据时展示暂无信息', async () => {
      mockFetch({ status: 0 });
      const { search } = setup();
      await search();

      await waitFor(() => {
        expect(screen.getByText('暂无练习数据')).toBeInTheDocument();
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
        expect(toast.error).toHaveBeenCalledWith('获取练习列表失败');
      });
    });
  });

  it('输入页号和页大小发送请求获取数据', async () => {
    mockFetch({
      status: 0,
      data: {
        practices: [...Array(15)].map((_, i) => ({
          ...MOCK_PRACTICES[0],
          ID: i + 1,
          Name: `练习 ${i + 1}`,
        })),
        total: 15,
      },
    });

    const { paginationSelect, paginationOption, paginationInput, search } = setup();

    const input = paginationInput();
    await fireEvent.input(input, { target: { value: 2 } });
    await fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 }); // 发送一次请求

    await paginationOption(paginationSelect(), '20条/页'); // 发送一次请求

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3); // onMount中会发送一次请求
    });
  });

  //TODO 路径补全
  it('点击不同情况的练习的操作按钮跳转不同的页面', async () => {
    mockFetch({
      status: 0,
      data: {
        practices: MOCK_PRACTICES,
        total: 6,
      },
    });

    render(PracticeList);

    // 等待表格渲染出练习数据
    await waitFor(() => {
      expect(screen.getByText('练习一')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getAllByRole('button', { name: '进入练习' })[0]);
    expect(goto).toHaveBeenCalledWith(expect.stringContaining('/student/answer/practice'));

    await fireEvent.click(screen.getAllByRole('button', { name: '重新作答' })[0]);
    expect(goto).toHaveBeenCalledWith(expect.stringContaining('/student/answer/practice?practice-id='));

    await fireEvent.click(screen.getAllByRole('button', { name: '查看上次作答' })[0]);
    // expect(goto).toHaveBeenCalledWith(expect.stringContaining('/student'));

    await fireEvent.click(screen.getAllByRole('button', { name: '继续作答' })[0]);
    expect(goto).toHaveBeenCalledWith(expect.stringContaining('/student/answer/practice?practice-id='));

    await fireEvent.click(screen.getAllByRole('button', { name: '查看上次作答' })[1]);
    // expect(goto).toHaveBeenCalledWith(expect.stringContaining('/student'));

    await fireEvent.click(screen.getAllByRole('button', { name: '等待批改完成' })[0]);
  });

  it('重置按钮清空所有筛选条件', async () => {
    const { nameInput, toggleDropdown, selectOption, reset } = setup();

    await fireEvent.input(nameInput(), { target: { value: '测试练习' } });
    expect(nameInput()).toHaveValue('测试练习');

    await toggleDropdown();
    await selectOption('困难');
    expect(screen.getByTestId('difficult-select')).toHaveTextContent('困难');

    await reset();

    const dropdownInput = within(screen.getByTestId('difficult-select')).getByRole('textbox');
    expect(nameInput()).toHaveValue('');
    expect(dropdownInput).toHaveValue('全部');
  });

  // TODO 目前阶段是考虑第一种练习类型
  it('切换练习类型获取不同的练习', async () => {
    mockFetch({
      status: 0,
      data: {
        practices: [MOCK_PRACTICES[0]],
        total: 1,
      },
    });
    const { tab0, tab1, tab2 } = setup();
    await tab0();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await tab1();
    await tab2();
  });
});
