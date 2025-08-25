import {beforeEach, describe, expect, it, vi} from 'vitest';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/svelte';
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
	 * 测试标签页切换功能
	 */
	it('应该正确切换登录标签页', async () => {
		render(LoginPage);

		// 检查默认标签页（账号登录）
		expect(screen.getByText('帐号/邮箱登录')).toBeInTheDocument();
		expect(screen.getByText('手机号登录')).toBeInTheDocument();
		expect(screen.getByText('证件号登录')).toBeInTheDocument();

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));
		expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();

		// 切换到证件号登录
		await fireEvent.click(screen.getByText('证件号登录'));
		expect(screen.getByPlaceholderText('请输入证件号')).toBeInTheDocument();

		// 切换回账号登录
		await fireEvent.click(screen.getByText('帐号/邮箱登录'));
		expect(screen.getByPlaceholderText('请输入帐号/邮箱')).toBeInTheDocument();
	});

	/**
	 * 测试手机号登录功能
	 */
	it('应该正确处理手机号登录', async () => {
		// 模拟成功的登录响应
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});
		global.fetch = mockFetch;

		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 验证fetch调用
		expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: '+8613800138000',
				cert: 'testpassword'
			})
		});
	});

	/**
	 * 测试证件号登录功能
	 */
	it('应该正确处理证件号登录', async () => {
		// 模拟成功的登录响应
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});
		global.fetch = mockFetch;

		render(LoginPage);

		// 切换到证件号登录
		await fireEvent.click(screen.getByText('证件号登录'));

		const idInput = screen.getByPlaceholderText('请输入证件号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(idInput, { target: { value: '110101199001011234' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 验证fetch调用
		expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: '110101199001011234',
				cert: 'testpassword'
			})
		});
	});

	/**
	 * 测试手机号格式验证
	 */
	it('应该验证手机号格式', async () => {
		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 输入无效手机号
		await fireEvent.input(phoneInput, { target: { value: '123456' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 验证错误提示
		expect(screen.getByText('提示')).toBeInTheDocument();
        const modal = await screen.findByRole('dialog');
        expect(within(modal).getByText('请输入有效手机号')).toBeInTheDocument();
	});

	/**
	 * 测试手机号实时验证
	 */
	it('应该在输入时实时验证手机号格式', async () => {
		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');

		// 输入无效的手机号
		await fireEvent.input(phoneInput, { target: { value: '123' } });
		
		// 等待验证完成
		await waitFor(() => {
			expect(screen.getByText('请输入有效手机号')).toBeInTheDocument();
		});

		// 输入有效的手机号
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		
		// 错误信息应该消失
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});
	});

	/**
	 * 测试不同国家代码的手机号验证
	 */
	it('应该根据不同国家代码验证手机号', async () => {
		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const countrySelect = screen.getByDisplayValue('+86中国大陆');

		// 切换到美国号码
		await fireEvent.change(countrySelect, { target: { value: '+1' } });

		// 输入中国格式的手机号（对美国来说是无效的）
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		
		// 应该显示美国手机号格式错误
		await waitFor(() => {
			expect(screen.getByText('请输入有效手机号')).toBeInTheDocument();
		});

		// 输入有效的美国手机号
		await fireEvent.input(phoneInput, { target: { value: '2025551234' } });
		
		// 错误信息应该消失
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});
	});

	/**
	 * 测试空手机号输入的处理
	 */
	it('应该正确处理空手机号输入', async () => {
		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');

		// 先输入一个无效手机号显示错误
		await fireEvent.input(phoneInput, { target: { value: '123' } });
		await waitFor(() => {
			expect(screen.getByText('请输入有效手机号')).toBeInTheDocument();
		});

		// 清空输入框
		await fireEvent.input(phoneInput, { target: { value: '' } });
		
		// 错误信息应该消失（空输入被认为是有效的）
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});
	});

	/**
	 * 测试只包含空格的手机号输入
	 */
	it('应该正确处理只包含空格的手机号输入', async () => {
		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');

		// 先输入一个无效手机号显示错误
		await fireEvent.input(phoneInput, { target: { value: '123' } });
		await waitFor(() => {
			expect(screen.getByText('请输入有效手机号')).toBeInTheDocument();
		});

		// 输入只包含空格的字符串
		await fireEvent.input(phoneInput, { target: { value: '   ' } });
		
		// 错误信息应该消失（空格被trim后为空，被认为是有效的）
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});
	});

	/**
	 * 测试国家代码变更时的手机号重新验证
	 */
	it('应该在国家代码变更时重新验证手机号', async () => {
		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const countrySelect = screen.getByDisplayValue('+86中国大陆');

		// 输入中国有效手机号
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});

		// 切换到韩国号码（中国手机号对韩国来说是无效的）
		await fireEvent.change(countrySelect, { target: { value: '+82' } });
		
		// 应该显示韩国手机号格式错误
		await waitFor(() => {
			expect(screen.getByText('请输入有效手机号')).toBeInTheDocument();
		});

		// 输入有效的韩国手机号
		await fireEvent.input(phoneInput, { target: { value: '1012345678' } });
		
		// 错误信息应该消失
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});
	});

	/**
	 * 测试各种边界情况的手机号格式
	 */
	it('应该正确验证各种边界情况的手机号格式', async () => {
		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');

		// 测试过短的手机号
		await fireEvent.input(phoneInput, { target: { value: '1' } });
		await waitFor(() => {
			expect(screen.getByText('请输入有效手机号')).toBeInTheDocument();
		});

		// 测试包含字母的手机号
		await fireEvent.input(phoneInput, { target: { value: '138abc38000' } });
		await waitFor(() => {
			expect(screen.getByText('请输入有效手机号')).toBeInTheDocument();
		});

		// 测试过长的手机号
		await fireEvent.input(phoneInput, { target: { value: '138001380001234567890' } });
		await waitFor(() => {
			expect(screen.getByText('请输入有效手机号')).toBeInTheDocument();
		});

		// 最后输入有效手机号确认验证正常
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});
	});

	/**
	 * 测试多个国家的有效手机号格式
	 */
	it('应该正确验证多个国家的有效手机号格式', async () => {
		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const countrySelect = screen.getByDisplayValue('+86中国大陆');

		// 测试中国手机号
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});

		// 测试香港手机号
		await fireEvent.change(countrySelect, { target: { value: '+852' } });
		await fireEvent.input(phoneInput, { target: { value: '98765432' } });
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});

		// 测试美国手机号
		await fireEvent.change(countrySelect, { target: { value: '+1' } });
		await fireEvent.input(phoneInput, { target: { value: '2025551234' } });
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});

		// 测试日本手机号
		await fireEvent.change(countrySelect, { target: { value: '+81' } });
		await fireEvent.input(phoneInput, { target: { value: '9012345678' } });
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});
	});

	/**
	 * 测试组件基本渲染
	 */
	it('应该正确渲染登录页面的基本元素', async () => {
		render(LoginPage);

		// 检查标题
		expect(screen.getByText('3min')).toBeInTheDocument();

		// 检查标签页按钮
		expect(screen.getByText('手机号登录')).toBeInTheDocument();
		expect(screen.getByText('帐号/邮箱登录')).toBeInTheDocument();
		expect(screen.getByText('证件号登录')).toBeInTheDocument();

		// 检查默认显示手机号登录输入框
		expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();

		// 检查登录按钮
		expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();

		// 检查用户协议复选框
		expect(screen.getByRole('checkbox')).toBeInTheDocument();
	});

	/**
	 * 测试输入框双向绑定
	 */
	it('应该正确处理输入框的双向绑定', async () => {
		render(LoginPage);

		// 测试手机号输入
		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');

		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		expect(phoneInput).toHaveValue('13800138000');

		// 测试密码输入
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		expect(passwordInput).toHaveValue('testpassword');

		// 切换到账号登录测试
		await fireEvent.click(screen.getByText('帐号/邮箱登录'));
		const accountInput = screen.getByPlaceholderText('请输入帐号/邮箱');
		await fireEvent.input(accountInput, { target: { value: 'test@example.com' } });
		expect(accountInput).toHaveValue('test@example.com');
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

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 只填写手机号
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });

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

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写手机号和密码
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
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

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
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
			body: JSON.stringify({
				name: '+8613800138000',
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

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
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

		const credentialInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(credentialInput, { target: { value: '16283748263' } });
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

		const credentialInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(credentialInput, { target: { value: '17238476528' } });
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

		const credentialInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: '17238476528' } });
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

		const credentialInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: '17238476528' } });
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

		const credentialInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: '17238476528' } });
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

		const credentialInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: '17238476528' } });
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

		const credentialInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: '17238476528' } });
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

		const credentialInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(credentialInput, { target: { value: '17238476528' } });
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

	/**
	 * 测试使用帐号登录
	 */
	it('应该正确处理帐号登录', async () => {
		// 模拟成功的登录响应
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});
		global.fetch = mockFetch;

		render(LoginPage);

		// 切换到帐号/邮箱登录
		await fireEvent.click(screen.getByText('帐号/邮箱登录'));

		const accountInput = screen.getByPlaceholderText('请输入帐号/邮箱');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(accountInput, { target: { value: 'testuser' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 验证fetch调用
		expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: 'testuser',
				cert: 'testpassword'
			})
		});
	});

	/**
	 * 测试使用邮箱登录
	 */
	it('应该正确处理邮箱登录', async () => {
		// 模拟成功的登录响应
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});
		global.fetch = mockFetch;

		render(LoginPage);

		// 切换到帐号/邮箱登录
		await fireEvent.click(screen.getByText('帐号/邮箱登录'));

		const emailInput = screen.getByPlaceholderText('请输入帐号/邮箱');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 验证fetch调用
		expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: 'test@example.com',
				cert: 'testpassword'
			})
		});
	});

	/**
	 * 测试手机号地区切换验证
	 */
	it('应该在切换地区时重新验证手机号格式', async () => {
		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const countrySelect = screen.getByDisplayValue('+86中国大陆');

		// 输入中国格式的手机号
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });

		// 验证没有错误信息
		await waitFor(() => {
			expect(screen.queryByText('请输入有效手机号')).not.toBeInTheDocument();
		});

		// 切换到韩国
		await fireEvent.change(countrySelect, { target: { value: '+82' } });

		// 应该显示韩国手机号格式错误
		await waitFor(() => {
			expect(screen.getByText('请输入有效手机号')).toBeInTheDocument();
		});
	});

	/**
	 * 测试获取登录角色请求网络错误
	 */
	it('应该正确处理获取登录角色时的网络错误', async () => {
		// 模拟登录成功响应
		const mockLoginFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});

		// 模拟角色查询网络错误
		const mockRoleFetch = vi.fn().mockRejectedValue(new Error('网络错误'));

		global.fetch = vi.fn()
			.mockImplementationOnce(() => mockLoginFetch())
			.mockImplementationOnce(() => mockRoleFetch());

		render(LoginPage);

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);
		await fireEvent.click(loginButton);

		// 等待错误消息显示
		await waitFor(() => {
			expect(screen.getByText('获取角色失败')).toBeInTheDocument();
			expect(screen.getByText('网络错误，请检查网络连接后重试')).toBeInTheDocument();
		});
	});

	/**
	 * 测试获取登录角色请求HTTP状态非200
	 */
	it('应该正确处理获取登录角色时HTTP状态非200', async () => {
		// 模拟登录成功响应
		const mockLoginFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});

		// 模拟角色查询HTTP状态非200
		const mockRoleFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			json: () => Promise.resolve({ status: 1, msg: '服务器内部错误' })
		});

		global.fetch = vi.fn()
			.mockImplementationOnce(() => mockLoginFetch())
			.mockImplementationOnce(() => mockRoleFetch());

		render(LoginPage);

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);
		await fireEvent.click(loginButton);

		// 等待错误消息显示
		await waitFor(() => {
			expect(screen.getByText('获取角色失败')).toBeInTheDocument();
			expect(screen.getByText('网络错误，请检查网络连接后重试')).toBeInTheDocument();
		});
	});

	/**
	 * 测试确认角色选择HTTP状态非200
	 */
	it('应该正确处理确认角色选择时HTTP状态非200', async () => {
        global.fetch = vi.fn((url) => {
            if (url === '/api/login') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ status: 0, msg: '登录成功' }),
                });
            }
            if (url.includes('/api/user/me')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 0,
                        data: {
                            Domains: [
                                'cst.school^student',
                                'cst.school^teacher'
                            ]
                        }
                    }),
                });
            }
            if (url.includes('/user/login-domain')) {
                return Promise.resolve({
                    ok: false,
                    status: 403,
                    json: () => Promise.resolve({ status: 1, msg: '权限不足' }),
                });
            }
            return Promise.reject(new Error(`未匹配到的请求: ${url}`));
        });

        render(LoginPage);

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);
		await fireEvent.click(loginButton);

		// 等待角色选择对话框出现
		await waitFor(() => {
			expect(screen.getByText('选择登录角色')).toBeInTheDocument();
		});

		// 选择学生角色（通过radio按钮的value属性）
		const studentRoleRadio = screen.getByDisplayValue('cst.school^student');
		await fireEvent.click(studentRoleRadio);

		// 点击确认按钮
		const confirmButton = screen.getByRole('button', { name: '确定' });
		await fireEvent.click(confirmButton);

		// 等待错误消息显示
		await waitFor(() => {
			expect(screen.getByText('选择角色失败')).toBeInTheDocument();
			expect(screen.getByText('网络错误，请检查网络连接后重试')).toBeInTheDocument();
		});
	});

	/**
	 * 测试确认角色选择请求失败
	 */
	it('应该正确处理确认角色选择请求失败', async () => {
		// 模拟登录成功响应
		const mockLoginFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		});

		// 模拟角色查询成功响应（多个角色）
		const mockRoleFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve({
				status: 0,
				data: {
					Domains: [
                        'cst.school^student',
                        'cst.school^teacher'
					]
				}
			})
		});

		// 模拟角色确认请求失败
		const mockRoleConfirmFetch = vi.fn().mockRejectedValue(new Error('网络连接超时'));

		global.fetch = vi.fn()
			.mockImplementationOnce(() => mockLoginFetch())
			.mockImplementationOnce(() => mockRoleFetch())
			.mockImplementationOnce(() => mockRoleConfirmFetch());

		render(LoginPage);

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单并登录
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);
		await fireEvent.click(loginButton);

		// 等待角色选择对话框出现
		await waitFor(() => {
			expect(screen.getByText('选择登录角色')).toBeInTheDocument();
		});

		// 选择学生角色（通过radio按钮的value属性）
		const studentRoleRadio = screen.getByDisplayValue('cst.school^student');
		await fireEvent.click(studentRoleRadio);

		// 点击确认按钮
		const confirmButton = screen.getByRole('button', { name: '确定' });
		await fireEvent.click(confirmButton);

		// 等待错误消息显示
		await waitFor(() => {
			expect(screen.getByText('选择角色失败')).toBeInTheDocument();
			expect(screen.getByText('网络错误，请检查网络连接后重试')).toBeInTheDocument();
		});
	});

	/**
	 * 测试用户无可用角色的情况
	 */
	it('应该正确处理用户无可用角色的情况', async () => {
		// 模拟登录成功的响应
		const mockLoginResponse = {
			ok: true,
			json: () => Promise.resolve({ status: 0, msg: '登录成功' })
		};

		// 模拟获取用户角色返回空数组的响应
		const mockUserMeResponse = {
			ok: true,
			json: () => Promise.resolve({
				status: 0,
				data: {
					Domains: [] // 空的角色数组
				}
			})
		};

		// 模拟fetch调用
		const mockFetch = vi.fn()
			.mockResolvedValueOnce(mockLoginResponse) // 第一次调用：登录请求
			.mockResolvedValueOnce(mockUserMeResponse); // 第二次调用：获取用户角色

		global.fetch = mockFetch;

		render(LoginPage);

		// 切换到手机号登录
		await fireEvent.click(screen.getByText('手机号登录'));

		const phoneInput = screen.getByPlaceholderText('请输入手机号');
		const passwordInput = screen.getByPlaceholderText('请输入密码');
		const checkbox = screen.getByRole('checkbox');
		const loginButton = screen.getByRole('button', { name: '登录' });

		// 填写表单
		await fireEvent.input(phoneInput, { target: { value: '13800138000' } });
		await fireEvent.input(passwordInput, { target: { value: 'testpassword' } });
		await fireEvent.click(checkbox);

		// 点击登录按钮
		await fireEvent.click(loginButton);

		// 等待异步操作完成
		await new Promise(resolve => setTimeout(resolve, 100));

		// 验证登录请求被调用
		expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: '+8613800138000',
				cert: 'testpassword'
			})
		});

		// 验证获取用户角色请求被调用
		expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/user/me', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		// 验证显示无可用角色的提示信息
		await waitFor(() => {
			expect(screen.getByText('提示')).toBeInTheDocument();
			expect(screen.getByText('您没有可用的登录角色，请联系管理员')).toBeInTheDocument();
		});
	});
});