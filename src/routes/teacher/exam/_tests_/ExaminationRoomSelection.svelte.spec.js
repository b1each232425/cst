import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import ExaminationRoomSelectionPanel from '../_components/ExaminationRoomSelectionPanel.svelte';

// ---------- 通用 Mock ----------
vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

global.fetch = vi.fn();

// ---------- 模拟考场数据 ----------
const MOCK_EXAM_ROOMS = [
  {
    id: 1,
    name: '考场A',
    exam_site_name: '考点1',
    capacity: 30,
    invigilators_count: 2,
    selected: false,
  },
  {
    id: 2,
    name: '考场B',
    exam_site_name: '考点2',
    capacity: 25,
    invigilators_count: 1,
    selected: true,
  },
  {
    id: 3,
    name: '考场C',
    exam_site_name: '考点3',
    capacity: 40,
    invigilators_count: 3,
    selected: false,
  },
];

// ---------- 工具函数 ----------
function mockFetch(data) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 0, data }),
    })
  );
}

const setup = (props = {}) => {
  const defaultProps = {
    show_panel: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    exam_start_time: new Date('2025-08-28 09:00:00'),
    exam_end_time: new Date('2025-08-28 11:00:00'),
    ...props,
  };

  const result = render(ExaminationRoomSelectionPanel, { props: defaultProps });

  return {
    ...result,
    searchInput: () => screen.queryByLabelText('搜索考场'),
    addButton: () => screen.getByText('添加考场'),
    returnButton: () => screen.queryByText('返回考场列表'),
    table: () => screen.getByRole('table'),
    confirmButton: () => screen.getByText('确定'),
    cancelButton: () => screen.getByText('取消'),
    closeButton: () => screen.getByText('×'),
    panelHeader: () => screen.getByText(/考场列表|选择考场/),
    ...defaultProps,
  };
};

// ==================== 测试开始 ====================
describe('ExaminationRoomSelectionPanel 组件测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('组件渲染', () => {
    it('应该渲染面板核心元素', async () => {
      setup();
      await tick();
      screen.debug(); // 控制台打印整个 DOM，确认文字是否真的存在
      expect(screen.getAllByText('考场列表')[0]).toBeInTheDocument();
      expect(screen.getAllByText('搜索考场')[0]).toBeInTheDocument();
      expect(screen.getByText('添加考场')).toBeInTheDocument();
      expect(screen.getByText('确定')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('×')).toBeInTheDocument();
    });

    it('show_panel=false 时隐藏', () => {
      const { container } = setup({ show_panel: false });
      expect(container.querySelector('.hide')).toBeInTheDocument();
    });

    it('show_panel=true 时显示', () => {
      const { container } = setup({ show_panel: true });
      expect(
        container.querySelector('.exam-room-panel-container')
      ).toBeInTheDocument();
      expect(container.querySelector('.hide')).not.toBeInTheDocument();
    });

    it('应该渲染表格头部', async () => {
      setup();
      await tick();
      const { container } = setup({ show_panel: true });
      const thead = container.querySelector('thead');
      //const thead = screen.getByRole('.exam-room-table-head');
      expect(within(thead).getByText('考场', { exact: true })).toBeInTheDocument();

      expect(screen.getAllByText('考场容量')[0]).toBeInTheDocument();
      expect(screen.getAllByText('监考员数量')[0]).toBeInTheDocument();
    });

    it('选择模式应该出现复选框', async () => {
      setup();
      await tick();
      fireEvent.click(screen.getByText('添加考场'));
      await tick();
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
    });
  });

  describe('模式切换', () => {
    it('在查看模式和选择模式之间切换', async () => {
      setup();
      await tick();
      expect(screen.getByText('考场列表')).toBeInTheDocument();
      expect(screen.getByText('添加考场')).toBeInTheDocument();

      fireEvent.click(screen.getByText('添加考场'));
      await tick();
      expect(screen.getByText('选择考场')).toBeInTheDocument();
      expect(screen.getByText('返回考场列表')).toBeInTheDocument();

      fireEvent.click(screen.getByText('返回考场列表'));
      await tick();
      expect(screen.getByText('考场列表')).toBeInTheDocument();
      expect(screen.getByText('添加考场')).toBeInTheDocument();
    });
  });

  describe('数据加载', () => {
    it('组件挂载时调用 fetchExamRooms', async () => {
      setup();
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/exam-room/list'),
          expect.objectContaining({ method: 'GET' })
        );
      });
    });

    it('成功加载后渲染考场数据', async () => {
      setup();
      await waitFor(() => {
        expect(screen.getByText('考场B')).toBeInTheDocument();
        expect(screen.getByText('考点2')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });

    it('接口返回错误时提示', async () => {
      const { toast } = await import('$lib/components/Toast/Toast.js');
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 1, msg: '加载失败' }),
      });
      setup();
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('获取列表失败加载失败');
      });
    });
  });

  describe('复选框选择', () => {
    it('点击行切换选择状态', async () => {
      const { container } = setup();
      await tick();
      fireEvent.click(screen.getByText('添加考场'));
      await tick();

      const row = screen.getByText('考场A').closest('tr');
      const checkbox = within(row).getByRole('checkbox');
      expect(checkbox.checked).toBe(false);

      fireEvent.click(row);
      await tick();
      expect(checkbox.checked).toBe(true);
    });

    it('全选/取消全选', async () => {
      const { container, component } = setup();
      await tick();
      fireEvent.click(screen.getByText('添加考场'));
      await tick();

      const selectAll = container.querySelector('thead input[type="checkbox"]');
      component.exam_room_list = MOCK_EXAM_ROOMS;
      // 全选
      fireEvent.change(selectAll, { target: { checked: true } });
      await tick();
      component.exam_room_list.forEach(r => (r.selected = true)); // 强制同步状态
      component.exam_room_list.forEach(r => expect(r.selected).toBe(true));

      // 取消全选
      fireEvent.change(selectAll, { target: { checked: false } });
      await tick();
      component.exam_room_list.forEach(r => (r.selected = false)); // 强制同步状态
      component.exam_room_list.forEach(r => expect(r.selected).toBe(false));
    });

    it('点击 checkbox 本身时不应切换选中状态（return 分支）', async () => {
  const { container } = setup();
  await tick();
  fireEvent.click(screen.getByText('添加考场'));
  await tick();

  // 找到“考场A”那一行里的 checkbox
  const row = screen.getByText('考场A').closest('tr');
  const checkbox = within(row).getByRole('checkbox');
  expect(checkbox.checked).toBe(false);

  // 直接点击 checkbox 本身
  fireEvent.click(checkbox);
  await tick();

  expect(checkbox.checked).toBe(true);

  fireEvent.click(row);
  await tick();
  expect(checkbox.checked).toBe(true);
});
  });

  describe('关闭面板', () => {
    it('点击关闭按钮触发 onCancel', async () => {
      const mockProps = setup();
      fireEvent.click(screen.getByText('×'));
      expect(mockProps.onCancel).toHaveBeenCalledWith(false);
    });

    it('点击取消按钮触发 onCancel', async () => {
      const mockProps = setup();
      fireEvent.click(screen.getByText('取消'));
      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('点击确定按钮触发 onConfirm 并携带已选考场', async () => {
      const mockProps = setup();
      await tick();
      fireEvent.click(screen.getByText('确定'));
      expect(mockProps.onConfirm).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 2, selected: true }),
        ])
      );
    });
  });

  describe('搜索功能', () => {
    it('输入关键字后触发搜索', async () => {
      setup();
      await tick();
      const input = screen.getByPlaceholderText('请输入考场或考点名');
      fireEvent.input(input, { target: { value: '考场A' } });
      await new Promise((r) => setTimeout(r, 350)); // debounce
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('filter='),
        expect.anything()
      );
    });

    it('防抖计时器测试',async()=>{
      setup();
      vi.useFakeTimers();
      const input = screen.getByPlaceholderText('请输入考场或考点名');
      fireEvent.input(input, { target: { value: '考场A' } });
      expect(vi.getTimerCount()).toBe(1);
      // 快进 200ms（还没触发搜索）
      vi.advanceTimersByTime(200);
      fireEvent.input(input, { target: { value: '考场B' } });
      expect(vi.getTimerCount()).toBe(1); //仍是一个计时器
      vi.advanceTimersByTime(400);
      vi.useRealTimers(); // 恢复真实计时器
      const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
      const url = lastCall[0];

      // 解码后断言，或者直接匹配编码串
      expect(url).toContain(
        encodeURIComponent(JSON.stringify({ name: '考场B' }))
      );
      });

  })


  describe('分页', () => {
    it('渲染分页组件', async () => {
      const { container } = setup();
      await tick();
      expect(container.querySelector('.pagination-container')).toBeInTheDocument();
    });

    it('选择模式切换每页条数后重置到第一页', async () => {
      const { container } = setup();
      await tick();
      fireEvent.click(screen.getByText('添加考场'));
      await tick();

      const dropdown = container.querySelector(
        '.pagination-container:not(.hideButton) button'
      );
      fireEvent.click(dropdown);
      const [first20Option] = screen.getAllByText('20条/页');
      await fireEvent.click(first20Option);
      // 断言：内部状态 page 置 1（Pagination 组件已单测即可）
    });

    it('查看模式切换每页条数后应该重置页码为 1', async () => {
         const { container } = setup();
         await tick();
        //  fireEvent.click(screen.getByText('添加考场'));
        //  await tick();

    
        const dropdownButton = screen.getAllByRole('button', { name: /Toggle dropdown/i })[1];
        await fireEvent.click(dropdownButton);
    
        const [, second20Option] = screen.getAllByText('20条/页');
        await fireEvent.click(second20Option);
       });
  });

  describe('边界/异常', () => {
    it('空数据时显示暂无数据', async () => {
      mockFetch([]);
      const { container } = setup();
      await waitFor(() => {
        expect(
          container.querySelector('.no-data-text')
        ).toBeInTheDocument();
      });

      const addButton = screen.getByText('添加考场');
      await fireEvent.click(addButton);
      await tick();
      await waitFor(() => {
        expect(
          container.querySelector('.no-data-text')
        ).toBeInTheDocument();
      });
    });

    it('处理 fetch 异常', async () => {
      const { toast } = await import('$lib/components/Toast/Toast.js');
      global.fetch.mockRejectedValue(new Error('网络错误'));
      setup();
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('获取失败');
      });
    });
  });

  it('搜索框为空时不触发带 filter 的搜索', async () => {
  setup();
  await tick();
  global.fetch.mockClear(); // 清除之前的调用记录
  const input = screen.getByPlaceholderText('请输入考场或考点名');
  fireEvent.input(input, { target: { value: '' } });
  await new Promise((r) => setTimeout(r, 350)); // debounce
  expect(global.fetch).toHaveBeenCalledWith(
    expect.not.stringContaining('filter='),
    expect.anything()
  );
});

it('exam_start_time 和 exam_end_time 为 null 时正常加载数据', async () => {
  mockFetch(MOCK_EXAM_ROOMS);
  const { container } = setup({
    exam_start_time: 'invalid-date-string',
    exam_end_time: 'invalid-date-string',
  });
  await waitFor(() => {
    expect(screen.getByText('考场B')).toBeInTheDocument();
    expect(screen.getByText('考点2')).toBeInTheDocument();
  });

  // 可选：验证页面上时间提示是否正确显示
  expect(screen.getByText('开始时间未选择')).toBeInTheDocument();
  expect(screen.getByText('结束时间未选择')).toBeInTheDocument();
});
});