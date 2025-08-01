import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor} from '@testing-library/svelte';
import LoginPage from '../+page.svelte';
import { goto } from '$app/navigation';

// 模拟导航函数
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

/**
 * 登录页面单元测试
 */
describe('登录页面组件测试', () => {
	/**
	 * 每个测试前的设置
	 */
	beforeEach(() => {
		// 清除所有模拟
		vi.clearAllMocks();
	});

	/**
	 * 测试组件基本渲染
	 */
	it('应该正确渲染登录页面的基本元素', async () => {
		render(LoginPage);

		// 检查标题
		expect(screen.getByText('3min')).toBeInTheDocument();

		// 检查输入框
		expect(screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();

		// 检查登录按钮
		expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();

		// 检查用户协议复选框
		expect(screen.getByRole('checkbox')).toBeInTheDocument();

		// 检查微信扫码区域
		expect(screen.getByText('微信扫码登录')).toBeInTheDocument();
	});

	/**
	 * 测试输入框双向绑定
	 */
	it('应该正确处理输入框的双向绑定', async () => {
		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');

		// 测试凭证输入
		await fireEvent.input(credentialInput, { target: { value: 'testuser' } });
		expect(credentialInput).toHaveValue('testuser');

		// 测试密码输入
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		expect(passwordInput).toHaveValue('testpassword');
	});

	/**
	 * 测试用户协议复选框
	 */
	it('应该正确处理用户协议复选框的状态', async () => {
		render(LoginPage);

		const checkbox = screen.getByRole('checkbox');

		// 初始状态应该是未选中
		expect(checkbox).not.toBeChecked();

		// 点击复选框
		await fireEvent.click(checkbox);
		expect(checkbox).toBeChecked();

		// 再次点击复选框
		await fireEvent.click(checkbox);
		expect(checkbox).not.toBeChecked();
	});

	/**
	 * 测试空字段验证
	 */
	it('当凭证为空时应该显示错误信息', async () => {
		render(LoginPage);

		const loginButton = screen.getByRole('button', { name: '登录' });

		// 点击登录按钮（不填写任何信息）
		await fireEvent.click(loginButton);

		// 验证MessageBox显示
		expect(screen.getByText('提示')).toBeInTheDocument();
		expect(screen.getByText('请输入登录凭证和密码')).toBeInTheDocument();
	});

	/**
	 * 测试密码为空的验证
	 */
	it('当密码为空时应该显示错误信息', async () => {
		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 只填写凭证
		await fireEvent.input(credentialInput, { target: { value: 'testuser' } });

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 验证MessageBox显示
		expect(screen.getByText('提示')).toBeInTheDocument();
		expect(screen.getByText('请输入登录凭证和密码')).toBeInTheDocument();
	});

	/**
	 * 测试未同意用户协议的验证
	 */
	it('当未同意用户协议时应该显示错误信息', async () => {
		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写凭证和密码
		await fireEvent.input(credentialInput, { target: { value: 'testuser' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });

		// 点击登录按钮（不勾选用户协议）
		await fireEvent.click(loginButton);

		// 验证MessageBox显示
		expect(screen.getByText('提示')).toBeInTheDocument();
		expect(screen.getByText('请先同意用户协议')).toBeInTheDocument();
	});

	/**
	 * 测试成功的登录请求
	 */
	it('应该正确发送登录请求', async () => {
		// 模拟fetch
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});
		global.fetch = mockFetch;

		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(credentialInput, { target: { value: 'testuser' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 验证fetch调用
		expect(mockFetch).toHaveBeenCalledWith('/api/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				name: 'testuser',
				cert: 'testpassword'
			})
		});
	});

	/**
	 * 测试登录失败的处理
	 */
	it('应该正确处理登录失败', async () => {
		// 模拟登录失败的响应
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({status: 1, msg: '用户名或密码错误'})
		});

		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(credentialInput, { target: { value: 'wronguser' } });
		await fireEvent.input(passwordInput, { target: { value: 'wrongpassword' } });
		await fireEvent.click(checkbox);

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 等待异步操作完成
		await new Promise(resolve => setTimeout(resolve, 0));

		// 验证MessageBox显示
		expect(screen.getByText('登录失败')).toBeInTheDocument();
		expect(screen.getByText('用户名或密码错误')).toBeInTheDocument();
	});

	/**
	 * 测试网络错误的处理
	 */
	it('应该正确处理网络错误', async () => {
		// 模拟网络错误
		global.fetch = vi.fn().mockRejectedValue(new Error('网络连接失败'));

		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(credentialInput, { target: { value: 'testuser' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 等待异步操作完成
		await new Promise(resolve => setTimeout(resolve, 0));

		// 验证MessageBox显示
		expect(screen.getByText('登录失败')).toBeInTheDocument();
		expect(screen.getByText('网络错误，请检查网络连接后重试')).toBeInTheDocument();
	});

	/**
	 * 测试HTTP错误响应的处理
	 */
	it('应该正确处理HTTP错误响应', async () => {
		// 模拟HTTP错误响应
		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500
		});

		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(credentialInput, { target: { value: 'testuser' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 等待异步操作完成
		await new Promise(resolve => setTimeout(resolve, 0));

		// 验证MessageBox显示
		expect(screen.getByText('登录失败')).toBeInTheDocument();
		expect(screen.getByText('网络错误，请检查网络连接后重试')).toBeInTheDocument();
	});

	/**
	 * 测试MessageBox组件的关闭功能
	 */
	it('应该能够关闭MessageBox提示框', async () => {
		render(LoginPage);

		const loginButton = screen.getByRole('button', { name: '登录' });

		// 触发错误提示
		await fireEvent.click(loginButton);

		// 验证MessageBox显示
		expect(screen.getByText('提示')).toBeInTheDocument();
		expect(screen.getByText('请输入登录凭证和密码')).toBeInTheDocument();

		// 点击确定按钮关闭MessageBox
		const confirmButton = screen.getByRole('button', { name: '确定' });
		await fireEvent.click(confirmButton);

		// 验证MessageBox已关闭
		expect(screen.queryByText('提示')).not.toBeInTheDocument();
		expect(screen.queryByText('请输入登录凭证和密码')).not.toBeInTheDocument();
	});

	/**
	 * 测试用户协议链接
	 */
	it('应该包含用户协议相关链接', async () => {
		render(LoginPage);

		// 检查协议文本
		expect(screen.getByText('用户协议')).toBeInTheDocument();
		expect(screen.getByText('隐私政策')).toBeInTheDocument();
		expect(screen.getByText('产品服务协议')).toBeInTheDocument();
	});

	/**
	 * 测试单角色用户自动确认登录
	 */
	it('应该为单角色用户自动确认登录', async () => {
		// 模拟登录成功响应
		const mockLoginFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});

		// 模拟角色查询响应（单角色）
		const mockRoleFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({
				status: 0,
				data: {
					Domains: ["cst.school^student"]
				}
			})
		});

		// 模拟角色确认响应
		const mockConfirmFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '角色确认成功' })
		});

		global.fetch = vi.fn()
			.mockImplementationOnce(() => mockLoginFetch())
			.mockImplementationOnce(() => mockRoleFetch())
			.mockImplementationOnce(() => mockConfirmFetch());

		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: 'student1' } });
		await fireEvent.input(passwordInput, { target: { value: 'password' } });
		await fireEvent.click(checkbox);
		await fireEvent.click(loginButton);

		// 等待异步操作完成
		await waitFor(() => {
			// 验证角色确认API被调用
			expect(global.fetch).toHaveBeenCalledWith('/api/user/login-domain', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data: 'cst.school^student' })
			});
		});

		// 验证导航被调用
		expect(goto).toHaveBeenCalledWith('/student/practice');
	});

	/**
	 * 测试多角色用户显示角色选择对话框
	 */
	it('应该为多角色用户显示角色选择对话框', async () => {
		// 模拟登录成功响应
		const mockLoginFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});

		// 模拟角色查询响应（多角色）
		const mockRoleFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({
				status: 0,
				data: {
					Domains: ["cst.school^teacher", "cst.school^admin"]
				}
			})
		});

		global.fetch = vi.fn()
			.mockImplementationOnce(() => mockLoginFetch())
			.mockImplementationOnce(() => mockRoleFetch());

		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: 'teacher1' } });
		await fireEvent.input(passwordInput, { target: { value: 'password' } });
		await fireEvent.click(checkbox);
		await fireEvent.click(loginButton);

		// 等待角色选择对话框显示
		await waitFor(() => {
			expect(screen.getByText('选择登录角色')).toBeInTheDocument();
		});

		// 验证角色选项显示
		expect(screen.getByText('教师')).toBeInTheDocument();
		expect(screen.getByText('管理员')).toBeInTheDocument();

		// 验证按钮存在
		expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '确定' })).toBeInTheDocument();
	});

	/**
	 * 测试角色选择确认功能
	 */
	it('应该正确处理角色选择确认', async () => {
		// 模拟登录成功响应
		const mockLoginFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});

		// 模拟角色查询响应（多角色）
		const mockRoleFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({
				status: 0,
				data: {
					Domains: ["cst.school^teacher", "cst.school^admin"]
				}
			})
		});

		// 模拟角色确认响应
		const mockConfirmFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '角色确认成功' })
		});

		global.fetch = vi.fn()
			.mockImplementationOnce(() => mockLoginFetch())
			.mockImplementationOnce(() => mockRoleFetch())
			.mockImplementationOnce(() => mockConfirmFetch());

		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: 'teacher1' } });
		await fireEvent.input(passwordInput, { target: { value: 'password' } });
		await fireEvent.click(checkbox);
		await fireEvent.click(loginButton);

		// 等待角色选择对话框显示
		await waitFor(() => {
			expect(screen.getByText('选择登录角色')).toBeInTheDocument();
		});

		// 选择教师角色
		const teacherRadio = screen.getByRole('radio', { name: /教师/ });
		await fireEvent.click(teacherRadio);

		// 点击确认按钮
		const confirmButton = screen.getByRole('button', { name: '确定' });
		await fireEvent.click(confirmButton);

		// 等待异步操作完成
		await waitFor(() => {
			// 验证角色确认API被调用
			expect(global.fetch).toHaveBeenCalledWith('/api/user/login-domain', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data: 'cst.school^teacher' })
			});
		});

		// 验证导航被调用
		expect(goto).toHaveBeenCalledWith('/teacher/question-bank/theory');
	});

	/**
	 * 测试角色选择取消功能
	 */
	it('应该正确处理角色选择取消', async () => {
		// 模拟登录成功响应
		const mockLoginFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});

		// 模拟角色查询响应（多角色）
		const mockRoleFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({
				status: 0,
				data: {
					Domains: ["cst.school^teacher", "cst.school^admin"]
				}
			})
		});

		global.fetch = vi.fn()
			.mockImplementationOnce(() => mockLoginFetch())
			.mockImplementationOnce(() => mockRoleFetch());

		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: 'teacher1' } });
		await fireEvent.input(passwordInput, { target: { value: 'password' } });
		await fireEvent.click(checkbox);
		await fireEvent.click(loginButton);

		// 等待角色选择对话框显示
		await waitFor(() => {
			expect(screen.getByText('选择登录角色')).toBeInTheDocument();
		});

		// 点击取消按钮
		const cancelButton = screen.getByRole('button', { name: '取消' });
		await fireEvent.click(cancelButton);

		// 验证对话框已关闭
		expect(screen.queryByText('选择登录角色')).not.toBeInTheDocument();

		// 验证没有调用导航
		expect(goto).not.toHaveBeenCalled();
	});

	/**
	 * 测试角色数据格式错误处理
	 */
	it('应该正确处理角色数据格式错误', async () => {
		// 模拟登录成功响应
		const mockLoginFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});

		// 模拟角色查询响应（格式错误）
		const mockRoleFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({
				status: 0,
				data: null // 数据格式错误
			})
		});

		global.fetch = vi.fn()
			.mockImplementationOnce(() => mockLoginFetch())
			.mockImplementationOnce(() => mockRoleFetch());

		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: 'user1' } });
		await fireEvent.input(passwordInput, { target: { value: 'password' } });
		await fireEvent.click(checkbox);
		await fireEvent.click(loginButton);

		// 等待错误消息显示
		await waitFor(() => {
			expect(screen.getByText('获取角色失败')).toBeInTheDocument();
		});
	});

	/**
	 * 测试角色确认失败处理
	 */
	it('应该正确处理角色确认失败', async () => {
		// 模拟登录成功响应
		const mockLoginFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});

		// 模拟角色查询响应（多角色）
		const mockRoleFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({
				status: 0,
				data: {
					Domains: ["cst.school^teacher", "cst.school^admin"]
				}
			})
		});

		// 模拟角色确认失败响应
		const mockConfirmFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 1, msg: '角色确认失败' })
		});

		global.fetch = vi.fn()
			.mockImplementationOnce(() => mockLoginFetch())
			.mockImplementationOnce(() => mockRoleFetch())
			.mockImplementationOnce(() => mockConfirmFetch());

		render(LoginPage);

		const credentialInput = screen.getByPlaceholderText('请输入ID/帐号/手机号/邮箱/姓名');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: 'teacher1' } });
		await fireEvent.input(passwordInput, { target: { value: 'password' } });
		await fireEvent.click(checkbox);
		await fireEvent.click(loginButton);

		// 等待角色选择对话框显示
		await waitFor(() => {
			expect(screen.getByText('选择登录角色')).toBeInTheDocument();
		});

		// 选择教师角色并确认
		const teacherRadio = screen.getByRole('radio', { name: /教师/ });
		await fireEvent.click(teacherRadio);
		const confirmButton = screen.getByRole('button', { name: '确定' });
		await fireEvent.click(confirmButton);

		// 等待错误消息显示
		await waitFor(() => {
			expect(screen.getByText('选择角色失败')).toBeInTheDocument();
			expect(screen.getByText('角色确认失败')).toBeInTheDocument();
		});
	});
});