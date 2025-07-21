import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen} from '@testing-library/svelte';
import LoginPage from '../+page.svelte';

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
		// 模拟console.log和console.error
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
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

		// 验证错误信息
		expect(console.log).toHaveBeenCalledWith('请输入令牌和密码');
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

		// 验证错误信息
		expect(console.log).toHaveBeenCalledWith('请输入令牌和密码');
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

		// 验证错误信息
		expect(console.log).toHaveBeenCalledWith('请先同意用户协议');
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

		// 验证错误信息
		expect(console.error).toHaveBeenCalledWith('登录失败:', '用户名或密码错误');
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

		// 验证错误信息
		expect(console.error).toHaveBeenCalledWith('登录失败:', expect.any(Error));
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

		// 验证错误信息
		expect(console.error).toHaveBeenCalledWith('登录失败:', expect.any(Error));
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
});