import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import Register from '../+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';

// mock toast
vi.mock('$lib/components/Toast/Toast.js', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// mock goto
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

describe('Register Page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('应正确显示表单输入框', () => {
    render(Register);
    expect(screen.getByPlaceholderText('请输入邮箱')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请再次输入密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();
  });

  it('校验必填项提示', async () => {
    render(Register);
    const registerBtn = screen.getByText('注册');
    await fireEvent.click(registerBtn);

    expect(screen.getByText('请输入邮箱')).toBeInTheDocument();
    expect(screen.getByText('请输入密码')).toBeInTheDocument();
    expect(screen.getByText('请再次输入密码')).toBeInTheDocument();
    expect(screen.getByText('请输入验证码')).toBeInTheDocument();
  });

  it('点击返回按钮应正确返回登录页面', async () => {
    render(Register);
    const returnBtn = screen.getByText('返回');
    await fireEvent.click(returnBtn);

    expect(goto).toHaveBeenCalledWith('/login');
  });

  it('两次输入密码不一致时提示错误', async () => {
    render(Register);

    await fireEvent.input(screen.getByPlaceholderText('请输入邮箱'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByPlaceholderText('请输入密码'), { target: { value: '123456' } });
    await fireEvent.input(screen.getByPlaceholderText('请再次输入密码'), { target: { value: '654321' } });
    await fireEvent.input(screen.getByPlaceholderText('请输入验证码'), { target: { value: '1234' } });

    await fireEvent.click(screen.getByText('注册'));

    const errors = screen.getAllByText('两次输入的密码不一致');
    expect(errors).toHaveLength(2);
  });

  it('删除邮箱内容时应显示错误提示', async () => {
    render(Register);

    const emailInput = screen.getByPlaceholderText('请输入邮箱');
    // 输入有效值
    await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
    expect(screen.queryByText('请输入邮箱')).not.toBeInTheDocument();

    // 清空
    await fireEvent.input(emailInput, { target: { value: '' } });
    expect(screen.getByText('请输入邮箱')).toBeInTheDocument();
  });

  it('删除密码内容时应显示错误提示', async () => {
    render(Register);

    const pwdInput = screen.getByPlaceholderText('请输入密码');
    await fireEvent.input(pwdInput, { target: { value: '123456' } });
    expect(screen.queryByText('请确认密码')).not.toBeInTheDocument();

    await fireEvent.input(pwdInput, { target: { value: '' } });
    expect(screen.getByText('请确认密码')).toBeInTheDocument();
  });

  it('删除确认密码内容时应显示错误提示', async () => {
    render(Register);

    const confirmInput = screen.getByPlaceholderText('请再次输入密码');
    await fireEvent.input(confirmInput, { target: { value: '123456' } });
    expect(screen.queryByText('请确认密码')).not.toBeInTheDocument();

    await fireEvent.input(confirmInput, { target: { value: '' } });
    expect(screen.getByText('请确认密码')).toBeInTheDocument();
  });

  it('删除验证码内容时应显示错误提示', async () => {
    render(Register);

    const codeInput = screen.getByPlaceholderText('请输入验证码');
    await fireEvent.input(codeInput, { target: { value: '8888' } });
    expect(screen.queryByText('请输入验证码')).not.toBeInTheDocument();

    await fireEvent.input(codeInput, { target: { value: '' } });
    expect(screen.getByText('请输入验证码')).toBeInTheDocument();
  });

  it('点击密码框的眼睛按钮切换输入类型', async () => {
    render(Register);

    const pwdInput = screen.getByPlaceholderText('请输入密码');
    await fireEvent.input(pwdInput, { target: { value: '123456' } });

    // 眼睛按钮应该出现
    const toggleBtn = screen.getByRole('button', { name: '显示密码' });
    expect(pwdInput).toHaveAttribute('type', 'password');

    await fireEvent.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'text');

    await fireEvent.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'password');
  });

  it('点击确认密码框的眼睛按钮切换输入类型', async () => {
    render(Register);

    const confirmInput = screen.getByPlaceholderText('请再次输入密码');
    await fireEvent.input(confirmInput, { target: { value: '123456' } });

    // 眼睛按钮应该出现
    const toggleBtn = screen.getByRole('button', { name: '显示密码' });
    expect(confirmInput).toHaveAttribute('type', 'password');

    await fireEvent.click(toggleBtn);
    expect(confirmInput).toHaveAttribute('type', 'text');

    await fireEvent.click(toggleBtn);
    expect(confirmInput).toHaveAttribute('type', 'password');
  });

  it('获取验证码成功', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0 }),
    });
    global.fetch = mockFetch;

    const { getByText, getByPlaceholderText } = render(Register);
    await fireEvent.input(getByPlaceholderText('请输入邮箱'), { target: { value: 'test@example.com' } });
    await fireEvent.click(getByText('获取验证码'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/user/verification-code/email?recipient=test@example.com',
        expect.any(Object),
      );
    });
  });

  it('接口返回 status 非 0，应提示邮箱错误', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: -1 }),
    });

    render(Register);
    await fireEvent.input(screen.getByPlaceholderText('请输入邮箱'), { target: { value: 'wrong@example.com' } });
    await fireEvent.click(screen.getByText('获取验证码'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('获取验证码失败，请检查邮箱是否正确');
    });
  });

  it('response.ok 为 false，应进入 catch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });

    render(Register);
    await fireEvent.input(screen.getByPlaceholderText('请输入邮箱'), { target: { value: 'test@example.com' } });
    await fireEvent.click(screen.getByText('获取验证码'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('获取验证码失败', '网络错误，请检查网络连接后重试');
    });
  });

  it('fetch 抛异常，应进入 catch', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('网络错误'));

    render(Register);
    await fireEvent.input(screen.getByPlaceholderText('请输入邮箱'), { target: { value: 'test@example.com' } });
    await fireEvent.click(screen.getByText('获取验证码'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('获取验证码失败', '网络错误，请检查网络连接后重试');
    });
  });

  it('注册成功后跳转登录', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0 }),
    });
    global.fetch = mockFetch;

    const { getByText, getByPlaceholderText } = render(Register);

    await fireEvent.input(getByPlaceholderText('请输入邮箱'), { target: { value: 'test@example.com' } });
    await fireEvent.input(getByPlaceholderText('请输入密码'), { target: { value: '123456' } });
    await fireEvent.input(getByPlaceholderText('请再次输入密码'), { target: { value: '123456' } });
    await fireEvent.input(getByPlaceholderText('请输入验证码'), { target: { value: '1234' } });

    await fireEvent.click(getByText('注册'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/user/register/email?verification-code=1234',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });
  });

  it('接口返回 status 非 0 时提示注册失败', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: -1 }),
    });

    render(Register);

    await fireEvent.input(screen.getByPlaceholderText('请输入邮箱'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByPlaceholderText('请输入密码'), { target: { value: '123456' } });
    await fireEvent.input(screen.getByPlaceholderText('请再次输入密码'), { target: { value: '123456' } });
    await fireEvent.input(screen.getByPlaceholderText('请输入验证码'), { target: { value: '1234' } });

    await fireEvent.click(screen.getByText('注册'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('注册失败，请重新注册');
    });
  });

  it('response.ok 为 false 时进入 catch', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    render(Register);

    await fireEvent.input(screen.getByPlaceholderText('请输入邮箱'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByPlaceholderText('请输入密码'), { target: { value: '123456' } });
    await fireEvent.input(screen.getByPlaceholderText('请再次输入密码'), { target: { value: '123456' } });
    await fireEvent.input(screen.getByPlaceholderText('请输入验证码'), { target: { value: '1234' } });

    await fireEvent.click(screen.getByText('注册'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('注册失败', '网络错误，请检查网络连接后重试');
    });
  });

  it('fetch 抛异常时进入 catch', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('网络错误'));

    render(Register);

    await fireEvent.input(screen.getByPlaceholderText('请输入邮箱'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByPlaceholderText('请输入密码'), { target: { value: '123456' } });
    await fireEvent.input(screen.getByPlaceholderText('请再次输入密码'), { target: { value: '123456' } });
    await fireEvent.input(screen.getByPlaceholderText('请输入验证码'), { target: { value: '1234' } });

    await fireEvent.click(screen.getByText('注册'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('注册失败', '网络错误，请检查网络连接后重试');
    });
  });

  it('注册成功应跳转到 /login', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0 }),
    });
    render(Register);

    await fireEvent.input(screen.getByPlaceholderText('请输入邮箱'), { target: { value: 'test@example.com' } });
    await fireEvent.input(screen.getByPlaceholderText('请输入密码'), { target: { value: '123456' } });
    await fireEvent.input(screen.getByPlaceholderText('请再次输入密码'), { target: { value: '123456' } });
    await fireEvent.input(screen.getByPlaceholderText('请输入验证码'), { target: { value: '1234' } });

    await fireEvent.click(screen.getByText('注册'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('注册成功！');
      expect(goto).toHaveBeenCalledWith('/login');
    });
  });
});
