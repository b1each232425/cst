import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import AddUserPage from '../+page.svelte';

// Mock 外部依赖
vi.mock('$lib/utils/validate.js', () => ({
  validMobile: vi.fn(),
  validEmail: vi.fn(),
  validIdCard: vi.fn()
}));

vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
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

describe('提交函数校验逻辑', () => {
  let component;
  let mockValidMobile;
  let mockValidEmail;
  let mockToast;
  let mockGoto;
  let mockMessageBox;

  beforeEach(async () => {
    // 重置所有 mock
    vi.clearAllMocks();
    
    // 获取 mock 函数引用
    const { validMobile, validEmail } = await import('$lib/utils/validate.js');
    const { toast } = await import('$lib/components/Toast/Toast.js');
    const { goto } = await import('$app/navigation');
    const MessageBoxModule = await import('$lib/components/MessageBox/MessageBox.js');
    
    mockValidMobile = validMobile;
    mockValidEmail = validEmail;
    mockToast = toast;
    mockGoto = goto;
    mockMessageBox = MessageBoxModule.default;

    // Mock 成功的 API 响应
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 0, data: 'test_account_123' }),
      text: () => Promise.resolve('')
    });

    // 渲染组件
    component = render(AddUserPage);
    
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

  describe('密码校验', () => {
    it('当密码为空时应显示错误信息', async () => {
      const submitButton = screen.getByText('提交');
      
      // 清空密码字段（模拟用户删除默认密码）
      const passwordInput = screen.getByDisplayValue('abc123456');
      await fireEvent.input(passwordInput, { target: { value: '' } });
      
      await fireEvent.click(submitButton);
      await tick();

      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('请输入密码')).toBeInTheDocument();
    });

    it('当密码不为空时不应显示密码错误', async () => {
      const submitButton = screen.getByText('提交');
      
      // 选择一个角色以通过其他必要校验
      const roleCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(roleCheckbox);
      
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.queryByText('请输入密码')).not.toBeInTheDocument();
    });
  });

  describe('手机号校验', () => {
    it('当手机号格式错误时应显示错误信息', async () => {
      mockValidMobile.mockReturnValue(false);
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      await fireEvent.input(phoneInput, { target: { value: '1234' } });
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidMobile).toHaveBeenCalledWith('1234');
      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('请输入正确的手机号码')).toBeInTheDocument();
    });

    it('当手机号格式正确时不应显示错误', async () => {
      mockValidMobile.mockReturnValue(true);
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      await fireEvent.input(phoneInput, { target: { value: '13812345678' } });
      
      // 选择角色以通过必要校验
      const roleCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(roleCheckbox);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidMobile).toHaveBeenCalledWith('13812345678');
      expect(screen.queryByText('请输入正确的手机号码')).not.toBeInTheDocument();
    });

    it('当手机号为空时不应进行校验', async () => {
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      await fireEvent.input(phoneInput, { target: { value: '' } });
      
      // 选择角色以通过必要校验
      const roleCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(roleCheckbox);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidMobile).not.toHaveBeenCalled();
      expect(screen.queryByText('请输入正确的手机号码')).not.toBeInTheDocument();
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
      expect(screen.getByText('请输入正确的邮箱地址')).toBeInTheDocument();
    });

    it('当邮箱格式正确时不应显示错误', async () => {
      mockValidEmail.mockReturnValue(true);
      
      const emailInput = screen.getByPlaceholderText('请输入邮箱');
      await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
      
      // 选择角色以通过必要校验
      const roleCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(roleCheckbox);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidEmail).toHaveBeenCalledWith('test@example.com');
      expect(screen.queryByText('请输入正确的邮箱地址')).not.toBeInTheDocument();
    });

    it('当邮箱为空时不应进行校验', async () => {
      const emailInput = screen.getByPlaceholderText('请输入邮箱');
      await fireEvent.input(emailInput, { target: { value: '' } });
      
      // 选择角色以通过必要校验
      const roleCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(roleCheckbox);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockValidEmail).not.toHaveBeenCalled();
      expect(screen.queryByText('请输入正确的邮箱地址')).not.toBeInTheDocument();
    });
  });

  describe('姓名长度校验', () => {
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
      
      // 选择角色以通过必要校验
      const roleCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(roleCheckbox);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.queryByText('姓名长度需为1-20个字符')).not.toBeInTheDocument();
    });
  });

  describe('角色校验', () => {
    it('当未选择任何角色时应显示错误信息', async () => {
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
      expect(screen.getByText('请至少选择一个角色')).toBeInTheDocument();
    });

    it('当选择角色后不应显示角色错误', async () => {
      const roleCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(roleCheckbox);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.queryByText('请至少选择一个角色')).not.toBeInTheDocument();
    });

    it('可以选择多个角色', async () => {
      const teacherCheckbox = screen.getByLabelText('教师');
      const studentCheckbox = screen.getByLabelText('学生');
      
      await fireEvent.click(teacherCheckbox);
      await fireEvent.click(studentCheckbox);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.queryByText('请至少选择一个角色')).not.toBeInTheDocument();
    });
  });

  describe('普通管理员权限校验', () => {
  it('当选择普通管理员但未选择权限时应显示错误信息', async () => {
    const adminCheckbox = screen.getByLabelText('普通管理员');
    await fireEvent.click(adminCheckbox);
    await tick();

    await waitFor(() => {
      expect(screen.getByText('普通管理员模块权限')).toBeVisible();
    });

    // 清空所有权限选择
    const permissionLabels = [
      '题库管理', '试卷管理', '练习管理', '考试管理', 
      '试卷批改', '成绩管理', '学生管理', '用户管理', '考点管理'
    ];

    for (const label of permissionLabels) {
      const permCheckbox = screen.getByLabelText(label);
      if (permCheckbox.checked) {
        await fireEvent.click(permCheckbox);
        await tick();
      }
    }

    //验证所有权限都已取消选择
    for (const label of permissionLabels) {
      const permCheckbox = screen.getByLabelText(label);
      expect(permCheckbox.checked).toBe(false);
    }

    //提交表单
    const submitButton = screen.getByText('提交');
    await fireEvent.click(submitButton);
    await tick();

    //验证错误信息
    expect(mockToast.warning).toHaveBeenCalledWith('请检查输入信息是否正确！');
    expect(screen.getByText('请至少选择一个模块权限')).toBeInTheDocument();
  });

    it('当选择普通管理员且选择权限时不应显示错误', async () => {
      const adminCheckbox = screen.getByLabelText('普通管理员');
      await fireEvent.click(adminCheckbox);
      await tick();

      // 默认情况下权限应该是全选的，所以不需要额外操作
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.queryByText('请至少选择一个模块权限')).not.toBeInTheDocument();
    });

    it('当未选择普通管理员时不应校验权限', async () => {
      const teacherCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(teacherCheckbox);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.queryByText('请至少选择一个模块权限')).not.toBeInTheDocument();
    });

    it('当选择普通管理员时权限应默认全选', async () => {
    const adminCheckbox = screen.getByLabelText('普通管理员');
    await fireEvent.click(adminCheckbox);
    await tick();
    
    // 验证所有权限默认选中
    const permLabels = [
      '题库管理', '试卷管理', '练习管理', '考试管理', 
      '试卷批改', '成绩管理', '学生管理', '用户管理', '考点管理'
    ];
    
    permLabels.forEach(label => {
      expect(screen.getByLabelText(label).checked).toBe(true);
    });
  });
  });

  describe('表单提交成功场景', () => {
    beforeEach(() => {
      // Mock 成功的 API 响应
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 0, message: 'success' })
      });
    });

    it('当所有校验通过时应成功提交表单', async () => {
      // 填写表单数据
      const nameInput = screen.getByPlaceholderText('请输入姓名');
      await fireEvent.input(nameInput, { target: { value: '张三' } });
      
      const phoneInput = screen.getByPlaceholderText('请输入手机号');
      await fireEvent.input(phoneInput, { target: { value: '13812345678' } });
      mockValidMobile.mockReturnValue(true);
      
      const emailInput = screen.getByPlaceholderText('请输入邮箱');
      await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
      mockValidEmail.mockReturnValue(true);
      
      // 选择角色
      const teacherCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(teacherCheckbox);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      // 等待 API 调用
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: expect.stringContaining('"OfficialName":"张三"')
        }));
      });

      expect(mockToast.success).toHaveBeenCalledWith('操作成功');
      expect(mockGoto).toHaveBeenCalledWith('/teacher/user-management');
    });

    it('当 API 调用失败时应显示错误信息', async () => {
      // Mock 失败的 API 响应
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      // 选择角色以通过校验
      const teacherCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(teacherCheckbox);
      
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith('创建失败');
      });
    });

    it('当 API 返回非 200 状态时应触发 toast 警告', async () => {
  // 1. 让 /api/user 返回 400 错误
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status: 400,
    statusText: 'Bad Request',
    text: async () => '用户名已存在'
  });

  // 2. 填写最少必要字段，让校验通过
  const teacherCheckbox = screen.getByLabelText('教师');
  await fireEvent.click(teacherCheckbox);

  // 3. 提交
  const submitButton = screen.getByText('提交');
  await fireEvent.click(submitButton);
  await tick();

  // 4. 等待 fetch 调用
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user',
      expect.objectContaining({ method: 'POST' })
    );
  });

  // 5. 断言 toast 提示
  await waitFor(() => {
    expect(mockToast.warning).toHaveBeenCalledWith('创建失败');
  });
});
  });

  describe('错误状态重置', () => {
    it('每次提交时应重置所有错误状态', async () => {
      // 第一次提交 - 触发错误
      const submitButton = screen.getByText('提交');
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.getByText('请至少选择一个角色')).toBeInTheDocument();

      // 修复错误并再次提交
      const teacherCheckbox = screen.getByLabelText('教师');
      await fireEvent.click(teacherCheckbox);
      
      await fireEvent.click(submitButton);
      await tick();

      expect(screen.queryByText('请至少选择一个角色')).not.toBeInTheDocument();
    });
  });
});

describe('取消功能', () => {
  let component;
  let mockMessageBox;
  let mockGoto;

  beforeEach(async () => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 0, data: 'test_account' }),
    });

    const { goto } = await import('$app/navigation');
    const MessageBoxModule = await import('$lib/components/MessageBox/MessageBox.js');
    
    mockGoto = goto;
    mockMessageBox = MessageBoxModule.default;

    component = render(AddUserPage);
    await tick();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  afterEach(() => {
    component.unmount();
  });

  describe('取消按钮行为', () => {
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
      
      expect(mockGoto).toHaveBeenCalledWith('/teacher/user-management');
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
});

describe('获取账号失败', () => {
  let mockToast;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { toast } = await import('$lib/components/Toast/Toast.js');
    mockToast = toast;

    // 让 /api/user/new-account 抛出网络错误
    global.fetch.mockRejectedValue(new Error('Network error'));
  });

  it('当获取账号失败时应显示错误 toast', async () => {
    render(AddUserPage);
    await tick(); // 等待 onMount 内的异步逻辑

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('获取账号失败：Network error')
      );
    });
  });
});
describe('异常分支', () => {
  let mockToast

  beforeEach(async () => {
    const { toast } = await import('$lib/components/Toast/Toast.js')
    mockToast = toast
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('当获取账号API返回非200时应显示错误toast (测试res.ok为false分支)', async () => {
    // 模拟fetch返回ok: false
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve('权限不足')
    })

    render(AddUserPage)
    await tick()

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('获取账号失败：获取账号失败: 401 Unauthorized - 权限不足')
      )
    })
  })

  it('当API返回的json.status非0时应显示错误toast', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 2, msg: '参数错误' }),
      text: () => Promise.resolve('')
    })

    render(AddUserPage)
    await tick()

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('获取账号失败：参数错误')
      )
    })
  })

  it('当API返回的json.data不是string时应显示错误toast', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 0, data: { foo: 1 } }),
      text: () => Promise.resolve('')
    })

    render(AddUserPage)
    await tick()

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('获取账号失败：获取账号失败')
      )
    })
  })
})

