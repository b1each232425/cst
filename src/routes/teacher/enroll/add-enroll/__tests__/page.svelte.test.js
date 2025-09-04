import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
import EnrollPlanCreate from '../+page.svelte';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

describe('报名计划创建页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应渲染核心表单元素', () => {
    render(EnrollPlanCreate);

    // 标题
    expect(screen.getByRole('heading', { name: '创建报名计划' })).toBeInTheDocument();

    // 计划名称输入框
    expect(screen.getByPlaceholderText('请输入计划名称')).toBeInTheDocument();

    // 报名时段（DatePicker）
    expect(screen.getByText('计划报名时段：')).toBeInTheDocument();
    expect(screen.getByText('审核截止时间：')).toBeInTheDocument();

    // 审核员按钮
    expect(screen.getByRole('button', { name: '选择审核员' })).toBeInTheDocument();

    // 计划人数
    expect(screen.getByLabelText('不限人数')).toBeInTheDocument();
    expect(screen.getByLabelText('限制人数')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入人数')).toBeInTheDocument();

    // 科目选择
    expect(screen.getByLabelText('理论')).toBeInTheDocument();
    expect(screen.getByLabelText('实践')).toBeInTheDocument();

    // 练习配置按钮
    expect(screen.getByRole('button', { name: '选择练习' })).toBeInTheDocument();

    // 底部操作按钮
    expect(screen.getByTestId('btn-cancel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
  });

  it('点击保存但未填写必填项时，应显示校验错误', async () => {
    render(EnrollPlanCreate);

    await fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(screen.getByText('计划名称不能为空')).toBeInTheDocument();
      expect(screen.getByText('请选择计划报名时段')).toBeInTheDocument();
      expect(screen.getByText('请选择截止日期')).toBeInTheDocument();
      expect(screen.getByText('请选择审核员')).toBeInTheDocument();
      expect(screen.getByText('请输入考试地点')).toBeInTheDocument();
      expect(screen.getByText('请选择练习')).toBeInTheDocument();
    });
  });

  it('点击取消应跳转回列表页', async () => {
    render(EnrollPlanCreate);

    await fireEvent.click(screen.getByTestId('btn-cancel'));
    expect(goto).toHaveBeenCalledWith('/teacher/enroll');
  });

  it('切换为限制人数，出现人数输入框并可输入', async () => {
    render(EnrollPlanCreate);

    const limitRadio = screen.getByLabelText('限制人数');
    await fireEvent.click(limitRadio);

    const numberInput = screen.getByPlaceholderText('请输入人数');
    expect(numberInput).toBeInTheDocument();

    await fireEvent.input(numberInput, { target: { value: '30' } });
    expect(numberInput.value).toBe('30');
  });

  it('填写表单大部分信息后，仅剩审核员与练习报错（使用 DatePicker 实际点击交互）', async () => {
    render(EnrollPlanCreate);

    // 计划名称
    const nameInput = screen.getByPlaceholderText('请输入计划名称');
    await fireEvent.input(nameInput, { target: { value: '软件工程报名计划' } });

    // 获取两个 DatePicker 的只读输入框（第一个：报名时段；第二个：审核截止）
    const dpInputs = document.querySelectorAll('.date-picker-container input.date-picker');
    expect(dpInputs.length).toBeGreaterThanOrEqual(2);

    // 打开第一个（报名时段：范围 + 时间）
    await fireEvent.click(dpInputs[0]);

    // 等待面板渲染（出现头部年月）
    await waitFor(() => {
      expect(screen.getByTestId('start-current-date')).toBeInTheDocument();
    });

    // 选择开始日期（取第一个可见开始日期按钮即可，避免固定某天不存在）
    const startBtns = document.querySelectorAll('[data-testid^="start-date-button-"]');
    expect(startBtns.length).toBeGreaterThan(0);
    await fireEvent.click(startBtns[0]);

    // 选择开始时间（小时、分钟）
    await fireEvent.click(screen.getByTestId('start-hour-10'));
    await fireEvent.click(screen.getByTestId('start-minute-00'));

    // 选择结束日期（范围模式才有 end- 按钮）
    const endBtns = document.querySelectorAll('[data-testid^="end-date-button-"]');
    expect(endBtns.length).toBeGreaterThan(0);
    await fireEvent.click(endBtns[0]);

    // 选择结束时间
    await fireEvent.click(screen.getByTestId('end-hour-12'));
    await fireEvent.click(screen.getByTestId('end-minute-30'));

    // 确定关闭
    await fireEvent.click(screen.getByText('确定'));

    // 打开第二个（审核截止：单日 + 时间）
    await fireEvent.click(dpInputs[1]);

    await waitFor(() => {
      expect(screen.getByTestId('start-current-date')).toBeInTheDocument();
    });

    // 单日期模式只需要 start- 按钮与时间
    const singleStartBtns = document.querySelectorAll('[data-testid^="start-date-button-"]');
    expect(singleStartBtns.length).toBeGreaterThan(0);
    await fireEvent.click(singleStartBtns[0]);

    await fireEvent.click(screen.getByTestId('start-hour-18'));
    await fireEvent.click(screen.getByTestId('start-minute-00'));

    // 确定关闭
    await fireEvent.click(screen.getByText('确定'));

    // 考试地点：填详细地址
    const detailAddr = screen.getByPlaceholderText('请输入详细地址（如街道、门牌号）');
    await fireEvent.input(detailAddr, { target: { value: '教学楼A-101' } });

    // 人数限制：选择限制并输入
    await fireEvent.click(screen.getByLabelText('限制人数'));
    const numberInput = screen.getByPlaceholderText('请输入人数');
    await fireEvent.input(numberInput, { target: { value: '50' } });

    // 提交
    await fireEvent.click(screen.getByRole('button', { name: '保存' }));

    // 仅剩审核员、练习两项仍为必填错误
    await waitFor(() => {
      expect(screen.queryByText('计划名称不能为空')).not.toBeInTheDocument();
      expect(screen.queryByText('请选择计划报名时段')).not.toBeInTheDocument();
      expect(screen.queryByText('请选择截止日期')).not.toBeInTheDocument();
      expect(screen.queryByText('请输入考试地点')).not.toBeInTheDocument();
      expect(screen.queryByText('请输入限制人数')).not.toBeInTheDocument();
      expect(screen.getByText('请选择审核员')).toBeInTheDocument();
      expect(screen.getByText('请选择练习')).toBeInTheDocument();
    });
  });

  it('addEnrollReq 成功：POST 正确并跳转', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 0 }) }));
    vi.stubGlobal('fetch', fetchSpy);

    render(EnrollPlanCreate);

    // 计划名称
    await fireEvent.input(screen.getByPlaceholderText('请输入计划名称'), { target: { value: '软工报名' } });

    // 打开报名时段 DatePicker（范围+时间）
    const dpInputs = document.querySelectorAll('.date-picker-container input.date-picker');
    await fireEvent.click(dpInputs[0]);
    await waitFor(() => expect(screen.getByTestId('start-current-date')).toBeInTheDocument());

    // 任意选择开始/结束日期+时间
    const startBtns = document.querySelectorAll('[data-testid^="start-date-button-"]');
    const endBtns = document.querySelectorAll('[data-testid^="end-date-button-"]');
    await fireEvent.click(startBtns[0]);
    await fireEvent.click(screen.getByTestId('start-hour-09'));
    await fireEvent.click(screen.getByTestId('start-minute-00'));
    await fireEvent.click(endBtns[0]);
    await fireEvent.click(screen.getByTestId('end-hour-10'));
    await fireEvent.click(screen.getByTestId('end-minute-00'));
    await fireEvent.click(screen.getByText('确定'));

    // 审核截止时间（单日+时间）
    await fireEvent.click(dpInputs[1]);
    await waitFor(() => expect(screen.getByTestId('start-current-date')).toBeInTheDocument());
    const singleStart = document.querySelectorAll('[data-testid^="start-date-button-"]')[0];
    await fireEvent.click(singleStart);
    await fireEvent.click(screen.getByTestId('start-hour-18'));
    await fireEvent.click(screen.getByTestId('start-minute-00'));
    await fireEvent.click(screen.getByText('确定'));

    // 地点：填详细地址
    await fireEvent.input(screen.getByPlaceholderText('请输入详细地址（如街道、门牌号）'), {
      target: { value: '教学楼A-101' },
    });

    // 通过派发事件注入审核员与练习
    // 1) 点击按钮让面板渲染出来
    await fireEvent.click(screen.getByRole('button', { name: '选择练习' }));
    await fireEvent.click(screen.getByRole('button', { name: '选择审核员' }));

    // 2) 等待面板挂载
    await waitFor(() => {
      expect(screen.getByTestId('practice-select-panel')).toBeInTheDocument();
      expect(screen.getByTestId('audit-select-panel')).toBeInTheDocument();
    });

    // 3) 直接对面板根元素派发 select 事件，注入测试数据
    screen
      .getByTestId('practice-select-panel')
      .dispatchEvent(new CustomEvent('select', { detail: [{ id: 101, name: '操作系统练习', assembly_type: '综合' }] }));
    screen
      .getByTestId('audit-select-panel')
      .dispatchEvent(new CustomEvent('select', { detail: [{ ID: 1, OfficialName: '张三' }] }));

    // 保存
    await fireEvent.click(screen.getByRole('button', { name: '保存' }));

    // 等待 fetch 被调用
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    // 验证 fetch 调用
    const postCall = fetchSpy.mock.calls.find(
      ([url, init]) => typeof url === 'string' && url.includes('/api/registration') && init && init.method === 'POST',
    );

    expect(postCall).toBeTruthy();

    const [url, init] = postCall;
    expect(url).toBe('/api/registration');
    expect(init.method).toBe('POST');
    expect(init.headers?.['Content-Type']).toBe('application/json');

    // 验证请求体数据
    const payload = JSON.parse(init.body);
    expect(payload.data.registration.Name).toBe('软工报名');
    expect(Array.isArray(payload.data.practice_ids)).toBe(true);
    expect(payload.data.practice_ids.length).toBeGreaterThan(0);

    // 验证页面跳转
    expect(goto).toHaveBeenCalledWith('/teacher/enroll');
  });

  it('addEnrollReq 失败：POST 非 ok，不跳转', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve({ ok: false }));
    vi.stubGlobal('fetch', fetchSpy);

    render(EnrollPlanCreate);

    // 填名称 + 日期（略，同上）
    await fireEvent.input(screen.getByPlaceholderText('请输入计划名称'), { target: { value: '软工报名' } });

    const dpInputs = document.querySelectorAll('.date-picker-container input.date-picker');
    await fireEvent.click(dpInputs[0]);
    await waitFor(() => expect(screen.getByTestId('start-current-date')).toBeInTheDocument());
    const startBtns = document.querySelectorAll('[data-testid^="start-date-button-"]');
    const endBtns = document.querySelectorAll('[data-testid^="end-date-button-"]');
    await fireEvent.click(startBtns[0]);
    await fireEvent.click(screen.getByTestId('start-hour-09'));
    await fireEvent.click(screen.getByTestId('start-minute-00'));
    await fireEvent.click(endBtns[0]);
    await fireEvent.click(screen.getByTestId('end-hour-10'));
    await fireEvent.click(screen.getByTestId('end-minute-00'));
    await fireEvent.click(screen.getByText('确定'));

    await fireEvent.click(dpInputs[1]);
    await waitFor(() => expect(screen.getByTestId('start-current-date')).toBeInTheDocument());
    const singleStart = document.querySelectorAll('[data-testid^="start-date-button-"]')[0];
    await fireEvent.click(singleStart);
    await fireEvent.click(screen.getByTestId('start-hour-18'));
    await fireEvent.click(screen.getByTestId('start-minute-00'));
    await fireEvent.click(screen.getByText('确定'));

    await fireEvent.input(screen.getByPlaceholderText('请输入详细地址（如街道、门牌号）'), {
      target: { value: '教学楼A-101' },
    });

    // 注入审核员与练习（需先打开面板使其渲染）
    await fireEvent.click(screen.getByRole('button', { name: '选择练习' }));
    await fireEvent.click(screen.getByRole('button', { name: '选择审核员' }));

    await waitFor(() => {
      expect(screen.getByTestId('practice-select-panel')).toBeInTheDocument();
      expect(screen.getByTestId('audit-select-panel')).toBeInTheDocument();
    });

    screen
      .getByTestId('practice-select-panel')
      .dispatchEvent(new CustomEvent('select', { detail: [{ id: 101, name: '操作系统练习', assembly_type: '综合' }] }));
    screen
      .getByTestId('audit-select-panel')
      .dispatchEvent(new CustomEvent('select', { detail: [{ ID: 1, OfficialName: '张三' }] }));

    await fireEvent.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(goto).not.toHaveBeenCalled();
  });
});
