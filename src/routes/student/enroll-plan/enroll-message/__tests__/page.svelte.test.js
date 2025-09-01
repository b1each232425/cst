import { render, screen, fireEvent } from '@testing-library/svelte';
import StudentDetail from '../+page@.svelte';
import { goto } from '$app/navigation';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

describe('StudentDetail Form', () => {
  test('renders input fields correctly', () => {
    render(StudentDetail);

    // 基础输入框
    expect(screen.getByPlaceholderText('请输入姓名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入证件号码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入邮箱')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入电话')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入详细地址（如街道、门牌号）')).toBeInTheDocument();
  });

  test('renders select options', () => {
    render(StudentDetail);

    // 性别、证件类型、地址选择器
    expect(screen.getByText('男')).toBeInTheDocument();
    expect(screen.getByText('女')).toBeInTheDocument();
    expect(screen.getByText('居民身份证')).toBeInTheDocument();
    expect(screen.getByText('临时居民身份证')).toBeInTheDocument();
    expect(screen.getByText('请选择省')).toBeInTheDocument();
    expect(screen.getByText('请选择市')).toBeInTheDocument();
    expect(screen.getByText('请选择区')).toBeInTheDocument();
  });

  test('renders upload components', () => {
    render(StudentDetail);

    // 上传身份证图片组件
    expect(screen.getByText('身份证人像面')).toBeInTheDocument();
    expect(screen.getByText('身份证国徽面')).toBeInTheDocument();
  });

  test('renders action buttons', () => {
    render(StudentDetail);

    expect(screen.getByText('取消')).toBeInTheDocument();
    expect(screen.getByText('保存')).toBeInTheDocument();
    expect(screen.getByText('提交')).toBeInTheDocument();
  });

  test('shows validation errors when submitting empty form', async () => {
    render(StudentDetail);

    const submitBtn = screen.getByText('提交');
    await fireEvent.click(submitBtn);

    // 提交后应该出现校验提示
    expect(await screen.findByText('请输入姓名')).toBeInTheDocument();
    expect(await screen.findByText('请选择性别')).toBeInTheDocument();
    expect(await screen.findByText('请选择证件类型')).toBeInTheDocument();
    expect(await screen.findByText('请选择出生日期')).toBeInTheDocument();
    expect(await screen.findByText('请输入证件号码')).toBeInTheDocument();
    expect(await screen.findByText('请输入邮箱')).toBeInTheDocument();
    expect(await screen.findByText('请输入电话')).toBeInTheDocument();
    expect(await screen.findByText('请上传身份证人像面')).toBeInTheDocument();
    expect(await screen.findByText('请上传身份证国徽面')).toBeInTheDocument();
  });
});
