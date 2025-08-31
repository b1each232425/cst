import { render, screen, fireEvent } from '@testing-library/svelte';
import Signup from '../+page.svelte';
import { goto } from '$app/navigation';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

describe('报名管理页面', () => {
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
    expect(screen.getByText('报名状态')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  it('渲染报名计划列表', () => {
    render(Signup);

    // 校验其中一个计划名称和状态
    expect(screen.getByText('2025年上半年技能提升计划')).toBeInTheDocument();
    expect(screen.getAllByText('报名中').length).toBeGreaterThan(0);

    // 操作按钮是否出现
    expect(screen.getByRole('button', { name: '继续报名' })).toBeInTheDocument();
  });

  it('点击查看原因按钮时显示消息框', async () => {
    render(Signup);

    // 找到审核不通过行的 "查看原因" 按钮
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

  it('分页组件存在', () => {
    render(Signup);

    expect(screen.getByText(/共/)).toBeInTheDocument(); // 具体要看 Pagination 组件怎么渲染
  });
});
