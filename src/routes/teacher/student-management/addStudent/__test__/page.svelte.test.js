import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import AddStudentPage from '../+page.svelte';

// Mock 外部依赖
vi.mock('$lib/utils/validate.js', () => ({
  validMobile: vi.fn(),
  validEmail: vi.fn(),
  validIdCard: vi.fn()
}));

vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('$lib/components/MessageBox/MessageBox.js', () => ({
  default: vi.fn()
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

describe('添加学生页面 - 表单校验逻辑', () => {
  let component;
  let mockValidMobile;
  let mockValidEmail;
  let mockValidIdCard;
  let mockToast;
  let mockGoto;
  let mockMessageBox;

  beforeEach(async () => {
    // 重置所有 mock
    vi.clearAllMocks();
    
    // 获取 mock 函数引用
    const { validMobile, validEmail, validIdCard } = await import('$lib/utils/validate.js');
    const { toast } = await import('$lib/components/Toast/Toast.js');
    const { goto } = await import('$app/navigation');
    const MessageBoxModule = await import('$lib/components/MessageBox/MessageBox.js');
    
    mockValidMobile = validMobile;
    mockValidEmail = validEmail;
    mockValidIdCard = validIdCard;
    mockToast = toast;
    mockGoto = goto;
    mockMessageBox = MessageBoxModule.default;

    // Mock 成功的 API 响应
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 0, data: 'student_123456' }),
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    // 渲染组件
    component = render(AddStudentPage);
    
    // 等待组件完全挂载和初始化
    await tick();
    await waitFor(() => {
      // 等待账号获取完成
      expect(global.fetch).toHaveBeenCalledWith('/api/user/new-account', expect.any(Object));
    });
  });

  afterEach(() => {
    component.unmount();
  });

  it('应该显示初始生成的账号', async () => {
    const accountInput = screen.getByPlaceholderText('请输入账号');
    expect(accountInput).toHaveValue('student_123456');
    expect(accountInput).toHaveAttribute('readonly');
  });

  it('应该显示固定密码', async () => {
    const passwordInput = screen.getByPlaceholderText('请输入密码');
    expect(passwordInput).toHaveValue('abc123456');
    expect(passwordInput).toHaveAttribute('readonly');
  });

  describe('姓名校验', () => {
    it('当姓名为空时应显示错误信息', async () => {
      const nameInput = screen.getByPlaceholderText('请输入姓名');
      await fireEvent.input(nameInput, { target: { value: '' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('姓名不能为空')).toBeInTheDocument();
    });

    it('当姓名长度超过20个字符时应显示错误信息', async () => {
      const nameInput = screen.getByPlaceholderText('请输入姓名');
      const longName = '这是一个超过二十个字符的非常长的姓名用于测试';
      await fireEvent.input(nameInput, { target: { value: longName } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('姓名长度需为1-20个字符')).toBeInTheDocument();
    });

    it('当姓名长度在1-20个字符之间时不应显示错误', async () => {
      const nameInput = screen.getByPlaceholderText('请输入姓名');
      await fireEvent.input(nameInput, { target: { value: '张三' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.queryByText('姓名长度需为1-20个字符')).not.toBeInTheDocument();
    });
  });

  describe('性别校验', () => {
    it('当性别未选择时应显示错误信息', async () => {
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('性别不能为空')).toBeInTheDocument();
    });

    it('当选择性别后不应显示错误', async () => {
      const genderSelect = screen.getByRole('combobox', { name: /请选择性别/ });
      await fireEvent.click(genderSelect);
      
      const maleOption = screen.getByText('男');
      await fireEvent.click(maleOption);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.queryByText('性别不能为空')).not.toBeInTheDocument();
    });
  });

  describe('身份证号校验', () => {
    it('当身份证号为空时应显示错误信息', async () => {
      const idInput = screen.getByPlaceholderText('请输入身份证号');
      await fireEvent.input(idInput, { target: { value: '' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('身份证号不能为空')).toBeInTheDocument();
    });

    it('当身份证号格式错误时应显示错误信息', async () => {
      mockValidIdCard.mockReturnValue(false);
      
      const idInput = screen.getByPlaceholderText('请输入身份证号');
      await fireEvent.input(idInput, { target: { value: '123456789012345' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidIdCard).toHaveBeenCalledWith('123456789012345');
      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('请输入正确的身份证号')).toBeInTheDocument();
    });

    it('当身份证号格式正确时不应显示错误', async () => {
      mockValidIdCard.mockReturnValue(true);
      
      const idInput = screen.getByPlaceholderText('请输入身份证号');
      await fireEvent.input(idInput, { target: { value: '110101199003078888' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidIdCard).toHaveBeenCalledWith('110101199003078888');
      expect(screen.queryByText('请输入正确的身份证号')).not.toBeInTheDocument();
    });
  });

  describe('手机号校验', () => {
    it('当手机号为空时应显示错误信息', async () => {
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      await fireEvent.input(phoneInput, { target: { value: '' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('手机号不能为空')).toBeInTheDocument();
    });

    it('当手机号格式错误时应显示错误信息', async () => {
      mockValidMobile.mockReturnValue(false);
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      await fireEvent.input(phoneInput, { target: { value: '1234' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidMobile).toHaveBeenCalledWith('1234');
      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('请输入正确的手机号')).toBeInTheDocument();
    });

    it('当手机号格式正确时不应显示错误', async () => {
      mockValidMobile.mockReturnValue(true);
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      await fireEvent.input(phoneInput, { target: { value: '13812345678' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidMobile).toHaveBeenCalledWith('13812345678');
      expect(screen.queryByText('请输入正确的手机号')).not.toBeInTheDocument();
    });
  });

  describe('邮箱校验', () => {
    it('当邮箱格式错误时应显示错误信息', async () => {
      mockValidEmail.mockReturnValue(false);
      
      const emailInput = screen.getByPlaceholderText('请输入邮箱');
      await fireEvent.input(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidEmail).toHaveBeenCalledWith('invalid-email');
      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('请输入正确的邮箱')).toBeInTheDocument();
    });

    it('当邮箱格式正确时不应显示错误', async () => {
      mockValidEmail.mockReturnValue(true);
      
      const emailInput = screen.getByPlaceholderText('请输入邮箱');
      await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidEmail).toHaveBeenCalledWith('test@example.com');
      expect(screen.queryByText('请输入正确的邮箱')).not.toBeInTheDocument();
    });

    it('当邮箱为空时不应显示错误', async () => {
      const emailInput = screen.getByPlaceholderText('请输入邮箱');
      await fireEvent.input(emailInput, { target: { value: '' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidEmail).not.toHaveBeenCalled();
      expect(screen.queryByText('请输入正确的邮箱')).not.toBeInTheDocument();
    });
  });

  describe('身份证正反面校验', () => {
    it('当身份证正面未上传时应显示错误信息', async () => {
      // 模拟上传反面
      const backUpload = screen.getAllByText('上传图片')[1];
      await fireEvent.click(backUpload);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('请上传身份证正面')).toBeInTheDocument();
    });

    it('当身份证反面未上传时应显示错误信息', async () => {
      // 模拟上传正面
      const frontUpload = screen.getAllByText('上传图片')[0];
      await fireEvent.click(frontUpload);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('请上传身份证反面')).toBeInTheDocument();
    });
  });

  describe('表单提交', () => {
    it('当所有校验通过时应成功提交表单', async () => {
      // 填写表单数据
      const nameInput = screen.getByPlaceholderText('请输入姓名');
      await fireEvent.input(nameInput, { target: { value: '张三' } });
      
      // 选择性别
      const genderSelect = screen.getByRole('combobox', { name: /请选择性别/ });
      await fireEvent.click(genderSelect);
      const maleOption = screen.getByText('男');
      await fireEvent.click(maleOption);
      
      const idInput = screen.getByPlaceholderText('请输入身份证号');
      await fireEvent.input(idInput, { target: { value: '110101199003078888' } });
      mockValidIdCard.mockReturnValue(true);
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      await fireEvent.input(phoneInput, { target: { value: '13812345678' } });
      mockValidMobile.mockReturnValue(true);
      
      const emailInput = screen.getByPlaceholderText('请输入邮箱');
      await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
      mockValidEmail.mockReturnValue(true);
      
      // 模拟上传身份证正反面
      const [frontUpload, backUpload] = screen.getAllByText('上传图片');
      await fireEvent.click(frontUpload);
      await fireEvent.click(backUpload);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      // 等待 API 调用
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            data: [{
              Account: 'student_123456',
              OfficialName: '张三',
              Gender: '男',
              MobilePhone: '13812345678',
              Email: 'test@example.com',
              IDCardNo: '110101199003078888',
              IDCardType: '居民身份证',
              Domains: ['cst.school^student']
            }]
          })
        }));
      });

      expect(mockGoto).toHaveBeenCalledWith('/teacher/student-management');
    });

    it('当 API 调用失败时应显示错误信息', async () => {
      // Mock 失败的 API 响应
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: 'student_123456' }),
      }).mockRejectedValueOnce(new Error('Network error'));
      
      // 填写表单数据
      const nameInput = screen.getByPlaceholderText('请输入姓名');
      await fireEvent.input(nameInput, { target: { value: '张三' } });
      
      // 选择性别
      const genderSelect = screen.getByRole('combobox', { name: /请选择性别/ });
      await fireEvent.click(genderSelect);
      const maleOption = screen.getByText('男');
      await fireEvent.click(maleOption);
      
      // 模拟上传身份证正反面
      const [frontUpload, backUpload] = screen.getAllByText('上传图片');
      await fireEvent.click(frontUpload);
      await fireEvent.click(backUpload);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('创建用户失败: Network error'));
      });
    });
  });

  describe('错误状态重置', () => {
    it('每次提交时应重置所有错误状态', async () => {
      // 第一次提交 - 触发错误
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.getByText('姓名不能为空')).toBeInTheDocument();
      expect(screen.getByText('性别不能为空')).toBeInTheDocument();

      // 修复错误并再次提交
      const nameInput = screen.getByPlaceholderText('请输入姓名');
      await fireEvent.input(nameInput, { target: { value: '张三' } });
      
      const genderSelect = screen.getByRole('combobox', { name: /请选择性别/ });
      await fireEvent.click(genderSelect);
      const maleOption = screen.getByText('男');
      await fireEvent.click(maleOption);
      
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.queryByText('姓名不能为空')).not.toBeInTheDocument();
      expect(screen.queryByText('性别不能为空')).not.toBeInTheDocument();
    });
  });
});

describe('添加学生页面 - 取消功能', () => {
  let component;
  let mockMessageBox;
  let mockGoto;

  beforeEach(async () => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 0, data: 'student_123456' }),
    });

    const { goto } = await import('$app/navigation');
    const MessageBoxModule = await import('$lib/components/MessageBox/MessageBox.js');
    
    mockGoto = goto;
    mockMessageBox = MessageBoxModule.default;

    component = render(AddStudentPage);
    await tick();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  afterEach(() => {
    component.unmount();
  });

  it('点击取消按钮应触发 MessageBox', async () => {
    const cancelButton = screen.getByText('取消');
    await fireEvent.click(cancelButton);
    await tick();
    
    expect(mockMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '确认退出',
        content: '你还未提交数据，确定要退出吗？',
      })
    );
  });

  it('当用户确认退出时应执行页面跳转', async () => {
    // 设置MessageBox mock在执行时自动触发onConfirm
    mockMessageBox.mockImplementation(({ onConfirm }) => onConfirm());
    
    const cancelButton = screen.getByText('取消');
    await fireEvent.click(cancelButton);
    await tick();
    
    expect(mockGoto).toHaveBeenCalledWith('/teacher/student-management');
  });

  it('当用户取消退出时不应执行跳转', async () => {
    // 设置MessageBox mock不执行任何操作 (模拟点击取消)
    mockMessageBox.mockImplementation(() => {});
    
    const cancelButton = screen.getByText('取消');
    await fireEvent.click(cancelButton);
    await tick();
    
    expect(mockGoto).not.toHaveBeenCalled();
  });
});

describe('添加学生页面 - 初始化逻辑', () => {
  let mockToast;

  beforeEach(async () => {
    const { toast } = await import('$lib/components/Toast/Toast.js');
    mockToast = toast;
    vi.clearAllMocks();
  });

  it('当获取账号成功时应设置账号字段', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 0, data: 'generated_student_123' }),
    });

    render(AddStudentPage);
    await tick();
    
    await waitFor(() => {
      const accountInput = screen.getByPlaceholderText('请输入账号');
      expect(accountInput).toHaveValue('generated_student_123');
    });
  });

  it('当获取账号失败时应显示错误 toast', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    render(AddStudentPage);
    await tick();
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('获取账号失败：Network error'));
    });
  });

  it('当API返回非200状态时应显示错误toast', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('服务器错误')
    });

    render(AddStudentPage);
    await tick();
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('获取账号失败：请求失败: 500 Internal Server Error - 服务器错误')
      );
    });
  });

  it('当API返回无效数据时应显示错误toast', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 1, msg: '生成账号失败' }),
    });

    render(AddStudentPage);
    await tick();
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('获取账号失败：生成账号失败')
      );
    });
  });
});