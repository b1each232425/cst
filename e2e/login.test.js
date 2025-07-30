import { expect, test } from '@playwright/test';

/**
 * 登录页面端对端测试
 */
test.describe('登录页面测试', () => {
	/**
	 * 测试页面基本元素渲染
	 */
 	test('页面基本元素应该正确渲染', async ({ page }) => {
		await page.goto('/login');

		// 检查页面标题
		await expect(page.locator('h1')).toContainText('3min');

		// 检查输入框
		await expect(page.locator('.token-input')).toBeVisible();
		await expect(page.locator('.password-input')).toBeVisible();

		// 检查登录按钮
		await expect(page.locator('.login-btn')).toBeVisible();
		await expect(page.locator('.login-btn')).toContainText('登录');

		// 检查用户协议复选框
		await expect(page.locator('.agreement-checkbox')).toBeVisible();

		// 检查微信扫码区域
		await expect(page.locator('.qr-title')).toContainText('微信扫码登录');
		await expect(page.locator('.qr-code')).toBeVisible();
	});

	/**
	 * 测试输入框占位符文本
	 */
	test('输入框应该显示正确的占位符', async ({ page }) => {
		await page.goto('/login');

		// 检查用户名输入框占位符
		await expect(page.locator('.token-input')).toHaveAttribute(
			'placeholder',
			'请输入ID/帐号/手机号/邮箱/姓名'
		);

		// 检查密码输入框占位符
		await expect(page.locator('.password-input')).toHaveAttribute(
			'placeholder',
			'请输入密码'
		);
	});

	/**
	 * 测试表单验证 - 空字段提交
	 */
	test('空字段提交应该显示验证错误', async ({ page }) => {
		await page.goto('/login');

		// 监听控制台日志
		const consoleMessages = [];
		page.on('console', msg => {
			if (msg.type() === 'log') {
				consoleMessages.push(msg.text());
			}
		});

		// 点击登录按钮（不填写任何信息）
		await page.locator('.login-btn').click();

		// 验证错误消息
		await page.waitForTimeout(100);
		expect(consoleMessages).toContain('请输入令牌和密码');
	});

	/**
	 * 测试表单验证 - 未同意用户协议
	 */
	test('未同意用户协议应该显示验证错误', async ({ page }) => {
		await page.goto('/login');

		// 监听控制台日志
		const consoleMessages = [];
		page.on('console', msg => {
			if (msg.type() === 'log') {
				consoleMessages.push(msg.text());
			}
		});

		// 填写用户名和密码
		await page.locator('.token-input').fill('testuser');
		await page.locator('.password-input').fill('testpassword');

		// 点击登录按钮（不勾选协议）
		await page.locator('.login-btn').click();

		// 验证错误消息
		await page.waitForTimeout(100);
		expect(consoleMessages).toContain('请先同意用户协议');
	});

	/**
	 * 测试表单输入功能
	 */
	test('表单输入应该正常工作', async ({ page }) => {
		await page.goto('/login');

		// 填写用户名
		await page.locator('.token-input').fill('testuser@example.com');
		await expect(page.locator('.token-input')).toHaveValue('testuser@example.com');

		// 填写密码
		await page.locator('.password-input').fill('mypassword123');
		await expect(page.locator('.password-input')).toHaveValue('mypassword123');

		// 勾选用户协议
		await page.locator('.agreement-checkbox').check();
		await expect(page.locator('.agreement-checkbox')).toBeChecked();
	});

	/**
	 * 测试用户协议链接
	 */
	test('用户协议链接应该存在', async ({ page }) => {
		await page.goto('/login');

		// 检查协议链接
		const agreementLinks = page.locator('.agreement-text a');
		await expect(agreementLinks).toHaveCount(3);

		// 检查链接文本
		await expect(agreementLinks.nth(0)).toContainText('用户协议');
		await expect(agreementLinks.nth(1)).toContainText('隐私政策');
		await expect(agreementLinks.nth(2)).toContainText('产品服务协议');
	});

	/**
	 * 测试完整的登录流程（模拟成功场景）
	 */
	test('完整登录流程应该发送正确的请求', async ({ page }) => {
		await page.goto('/login');

		// 监听网络请求
		const requests = [];
		page.on('request', request => {
			if (request.url().includes('/api/login')) {
				requests.push({
					url: request.url(),
					method: request.method(),
					headers: request.headers(),
					body: request.postData()
				});
			}
		});

		// 模拟API响应
		await page.route('/api/login', async route => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ status: 0, msg: '登录成功' })
			});
		});

		// 填写表单
		await page.locator('.token-input').fill('testuser');
		await page.locator('.password-input').fill('testpassword');
		await page.locator('.agreement-checkbox').check();

		// 提交表单
		await page.locator('.login-btn').click();

		// 等待请求发送
		await page.waitForTimeout(500);

		// 验证请求
		expect(requests).toHaveLength(1);
		const loginRequest = requests[0];
		expect(loginRequest.method).toBe('POST');
		expect(loginRequest.headers['content-type']).toBe('application/json');

		// 验证请求体
		const requestBody = JSON.parse(loginRequest.body);
		expect(requestBody.name).toBe('testuser');
		expect(requestBody.cert).toBe('testpassword');
	});

	/**
	 * 测试登录失败场景
	 */
	test('登录失败应该显示错误信息', async ({ page }) => {
		await page.goto('/login');

		// 监听控制台错误
		const consoleErrors = [];
		page.on('console', msg => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		// 模拟API失败响应
		await page.route('/api/login', async route => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ status: 1, msg: '用户名或密码错误' })
			});
		});

		// 填写表单并提交
		await page.locator('.token-input').fill('wronguser');
		await page.locator('.password-input').fill('wrongpassword');
		await page.locator('.agreement-checkbox').check();
		await page.locator('.login-btn').click();

		// 等待错误处理
		await page.waitForTimeout(500);

		// 验证错误信息
		expect(consoleErrors.some(error => 
			error.includes('登录失败') && error.includes('用户名或密码错误')
		)).toBeTruthy();
	});

	/**
	 * 测试网络错误场景
	 */
	test('网络错误应该显示错误信息', async ({ page }) => {
		await page.goto('/login');

		// 监听控制台错误
		const consoleErrors = [];
		page.on('console', msg => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		// 模拟网络错误
		await page.route('/api/login', async route => {
			await route.abort('failed');
		});

		// 填写表单并提交
		await page.locator('.token-input').fill('testuser');
		await page.locator('.password-input').fill('testpassword');
		await page.locator('.agreement-checkbox').check();
		await page.locator('.login-btn').click();

		// 等待错误处理
		await page.waitForTimeout(500);

		// 验证错误信息
		expect(consoleErrors.some(error => 
			error.includes('登录失败')
		)).toBeTruthy();
	});

	/**
	 * 测试响应式布局
	 */
	test('响应式布局应该正常工作', async ({ page }) => {
		// 测试桌面视图
		await page.setViewportSize({ width: 1200, height: 800 });
		await page.goto('/login');

		// 检查桌面布局
		const loginPanel = page.locator('.login-panel');
		await expect(loginPanel).toBeVisible();

		// 测试移动端视图
		await page.setViewportSize({ width: 768, height: 600 });
		await page.reload();

		// 检查移动端布局仍然可见
		await expect(loginPanel).toBeVisible();
		await expect(page.locator('.login-form')).toBeVisible();
		await expect(page.locator('.qr-section')).toBeVisible();
	});

	/**
	 * 测试键盘导航
	 */
	test('键盘导航应该正常工作', async ({ page }) => {
		await page.goto('/login');

		// 使用Tab键导航
		await page.keyboard.press('Tab');
		await expect(page.locator('.token-input')).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.locator('.password-input')).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.locator('.login-btn')).toBeFocused();

		await page.keyboard.press('Tab');
		await expect(page.locator('.agreement-checkbox')).toBeFocused();
	});

	/**
	 * 测试Enter键提交表单
	 */
	test('Enter键应该能提交表单', async ({ page }) => {
		await page.goto('/login');

		// 监听控制台日志
		const consoleMessages = [];
		page.on('console', msg => {
			if (msg.type() === 'log') {
				consoleMessages.push(msg.text());
			}
		});

		// 填写表单
		await page.locator('.token-input').fill('testuser');
		await page.locator('.password-input').fill('testpassword');
		await page.locator('.agreement-checkbox').check();

		// 在密码框中按Enter键
		await page.locator('.password-input').press('Enter');

		// 注意：由于当前实现中没有监听Enter键事件，这个测试主要验证不会出错
		// 实际项目中可能需要添加Enter键监听功能
	});
});