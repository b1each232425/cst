import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Signup from '../+page.svelte';
import { goto } from '$app/navigation';
import { vi } from 'vitest';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// 模拟fetch API
global.fetch = vi.fn();

describe('报名管理页面', () => {
  beforeEach(() => {
    // 在每个测试前重置模拟
    vi.clearAllMocks();

    // 设置fetch模拟
    global.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            registers: [],
            total: 0,
          },
        }),
    });
  });

  it('渲染筛选条件输入框和下拉框', () => {
    render(Signup);

    expect(screen.getByPlaceholderText('计划名称 / 知识点')).toBeInTheDocument();
    expect(screen.getByText('考试科目：')).toBeInTheDocument();
    expect(screen.getByText('报名状态：')).toBeInTheDocument();
  });

  it('渲染表格表头', () => {
    render(Signup);

    expect(screen.getByText('报名计划名称')).toBeInTheDocument();
    expect(screen.getByText('开始时间-结束时间')).toBeInTheDocument();
    expect(screen.getByText('计划人数')).toBeInTheDocument();
    expect(screen.getByText('考试科目')).toBeInTheDocument();
    expect(screen.getByText('考试类型')).toBeInTheDocument();
    expect(screen.getByText('考试地点')).toBeInTheDocument();
    expect(screen.getByText('报名状态')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  it('测试API调用', async () => {
    // 设置fetch模拟
    global.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            registers: [],
            total: 0,
          },
        }),
    });

    render(Signup);

    // 验证fetch被调用
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/registration'), expect.any(Object));
    });
  });

  it('测试输入框筛选功能', async () => {
    // 设置fetch模拟
    global.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            registers: [],
            total: 0,
          },
        }),
    });

    render(Signup);

    // 等待初始渲染
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // 测试输入框筛选
    const input = screen.getByPlaceholderText('计划名称 / 知识点');
    await fireEvent.input(input, { target: { value: '技能提升' } });

    // 验证API被调用
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('name=技能提升'), expect.any(Object));
  });

  it('测试考试科目下拉框选择功能', async () => {
    // 设置fetch模拟
    global.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            registers: [],
            total: 0,
          },
        }),
    });

    render(Signup);

    // 等待初始渲染
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // 点击考试科目下拉框
    const subjectSelect = screen.getByText('考试科目：').parentElement.querySelector('[data-testid="select"]');
    const dropdownButton = subjectSelect.querySelector('button[aria-label="Toggle dropdown"]');
    await fireEvent.click(dropdownButton);

    // 选择"理论"选项
    const theoryOption = screen.getByText('理论');
    await fireEvent.click(theoryOption);

    // 验证API被调用，包含course参数
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('course=02'), expect.any(Object));
  });

  it('测试报名状态下拉框选择功能', async () => {
    // 设置fetch模拟
    global.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            registers: [],
            total: 0,
          },
        }),
    });

    render(Signup);

    // 等待初始渲染
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // 点击报名状态下拉框
    const statusSelect = screen.getByText('报名状态：').parentElement.querySelector('[data-testid="select"]');
    const dropdownButton = statusSelect.querySelector('button[aria-label="Toggle dropdown"]');
    await fireEvent.click(dropdownButton);

    // 选择"报名中"选项
    const enrollingOption = screen.getByText('报名中');
    await fireEvent.click(enrollingOption);

    // 验证API被调用，包含status参数
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('status=00'), expect.any(Object));
  });

  it('测试下拉框组合筛选功能', async () => {
    // 设置fetch模拟
    global.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            registers: [],
            total: 0,
          },
        }),
    });

    render(Signup);

    // 等待初始渲染
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // 先选择考试科目
    const subjectSelect = screen.getByText('考试科目：').parentElement.querySelector('[data-testid="select"]');
    const subjectDropdownButton = subjectSelect.querySelector('button[aria-label="Toggle dropdown"]');
    await fireEvent.click(subjectDropdownButton);
    await fireEvent.click(screen.getByText('理论'));

    // 再选择报名状态
    const statusSelect = screen.getByText('报名状态：').parentElement.querySelector('[data-testid="select"]');
    const statusDropdownButton = statusSelect.querySelector('button[aria-label="Toggle dropdown"]');
    await fireEvent.click(statusDropdownButton);
    await fireEvent.click(screen.getByText('报名中'));

    // 验证API被调用，包含两个参数
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('course=02'), expect.any(Object));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('status=00'), expect.any(Object));
  });

  it('测试空数据状态', async () => {
    // 模拟空数据响应
    global.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            registers: [],
            total: 0,
          },
        }),
    });

    render(Signup);

    await waitFor(() => {
      expect(screen.getByText('暂无报名数据')).toBeInTheDocument();
    });
  });

  it('测试有数据时的渲染', async () => {
    // 模拟有数据的响应
    const mockApiResponse = {
      data: {
        registers: [
          {
            register: {
              ID: 1,
              Name: '2025年上半年技能提升计划',
              StartTime: 1704067200000,
              EndTime: 1706745600000,
              MaxNumber: 100,
              Course: '00',
              ExamPlanLocation: '教学楼A101',
            },
            student: {
              Status: '00', // 报名中
            },
          },
        ],
        total: 1,
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });

    render(Signup);

    // 等待数据加载完成
    await waitFor(
      () => {
        expect(screen.getByText('2025年上半年技能提升计划')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // 校验数据渲染
    expect(screen.getByText('2025年上半年技能提升计划')).toBeInTheDocument();
    expect(screen.getByText('教学楼A101')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '继续报名' })).toBeInTheDocument();
  });

  it('测试不通过状态的按钮', async () => {
    // 模拟不通过状态的响应
    const mockApiResponse = {
      data: {
        registers: [
          {
            register: {
              ID: 2,
              Name: '2025年下半年技能提升计划',
              StartTime: 1706745600000,
              EndTime: 1709424000000,
              MaxNumber: 50,
              Course: '02',
              ExamPlanLocation: '教学楼B201',
            },
            student: {
              Status: '06', // 不通过
            },
          },
        ],
        total: 1,
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });

    render(Signup);

    // 等待数据加载完成
    await waitFor(
      () => {
        expect(screen.getByText('2025年下半年技能提升计划')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // 校验不通过状态的按钮
    expect(screen.getByRole('button', { name: '重新提交' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '查看原因' })).toBeInTheDocument();
  });

  it('测试通过状态的按钮', async () => {
    // 模拟不通过状态的响应
    const mockApiResponse = {
      data: {
        registers: [
          {
            register: {
              ID: 2,
              Name: '2025年下半年技能提升计划',
              StartTime: 1706745600000,
              EndTime: 1709424000000,
              MaxNumber: 50,
              Course: '02',
              ExamPlanLocation: '教学楼B201',
            },
            student: {
              Status: '04', // 通过
            },
          },
        ],
        total: 1,
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });

    render(Signup);

    // 等待数据加载完成
    await waitFor(
      () => {
        expect(screen.getByText('2025年下半年技能提升计划')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // 校验不通过状态的按钮
    expect(screen.getByRole('button', { name: '请到达考试列表等待考试开始' })).toBeInTheDocument();
  });

  it('测试待审核状态的按钮', async () => {
    // 模拟不通过状态的响应
    const mockApiResponse = {
      data: {
        registers: [
          {
            register: {
              ID: 2,
              Name: '2025年下半年技能提升计划',
              StartTime: 1706745600000,
              EndTime: 1709424000000,
              MaxNumber: 50,
              Course: '02',
              ExamPlanLocation: '教学楼B201',
            },
            student: {
              Status: '02', // 待审核
            },
          },
        ],
        total: 1,
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });

    render(Signup);

    // 等待数据加载完成
    await waitFor(
      () => {
        expect(screen.getByText('2025年下半年技能提升计划')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // 校验不通过状态的按钮
    expect(screen.getByRole('button', { name: '查看报名信息' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看报名信息' }));

    expect(goto).toHaveBeenCalledWith('/student/enroll-plan/2');
  });

  it('测试查看原因按钮功能', async () => {
    // 模拟不通过状态的响应
    const mockApiResponse = {
      data: {
        registers: [
          {
            register: {
              ID: 2,
              Name: '2025年下半年技能提升计划',
              StartTime: 1706745600000,
              EndTime: 1709424000000,
              MaxNumber: 50,
              Course: '02',
              ExamPlanLocation: '教学楼B201',
            },
            student: {
              Status: '06', // 不通过
            },
          },
        ],
        total: 1,
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });

    render(Signup);

    // 等待数据加载完成
    await waitFor(
      () => {
        expect(screen.getByText('2025年下半年技能提升计划')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // 点击查看原因按钮
    const reasonBtn = screen.getByRole('button', { name: '查看原因' });
    await fireEvent.click(reasonBtn);

    // 弹框显示
    expect(screen.getByText('不通过原因')).toBeInTheDocument();
    expect(screen.getByText('身份证模糊')).toBeInTheDocument();

    // 点击确定按钮关闭
    const confirmBtn = screen.getByRole('button', { name: '确定' });
    await fireEvent.click(confirmBtn);

    // 关闭后不再可见
    expect(screen.queryByText('身份证模糊')).toBeNull();
  });

  it('测试分页器', async () => {
    const mockApiResponse = {
      data: {
        registers: [
          {
            register: {
              ID: 2,
              Name: '2025年下半年技能提升计划',
              StartTime: 1706745600000,
              EndTime: 1709424000000,
              MaxNumber: 50,
              Course: '02',
              ExamPlanLocation: '教学楼B201',
            },
            student: {
              Status: '06', // 不通过
            },
          },
        ],
        total: 1,
      },
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse),
    });

    render(Signup);

    // 等待数据加载完成
    await waitFor(
      () => {
        expect(screen.getByText('2025年下半年技能提升计划')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // 点击分页器
    const page1Btn = screen.getByRole('button', { name: '1' });
    fireEvent.click(page1Btn);

    // 改变每页大小
    const pageSizeSelect = screen.getByRole('button', { name: '50条/页' });
    fireEvent.click(pageSizeSelect);
  });
});
