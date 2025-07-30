<script>
	// 登录页面组件
	let credential = '';
	let password = '';
	let agreeTerms = false;

	/**
	 * 处理登录提交
	 */
	function handleLogin() {
		if (!credential || !password) {
			console.log('请输入令牌和密码'); // TODO: 替换为提示框组件
			return;
		}
		if (!agreeTerms) {
			console.log('请先同意用户协议'); // TODO: 替换为提示框组件
			return;
		}

		// TODO: 替换为统一请求接口
		fetch('/api/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				name: credential,
				cert: password
			})
		}).then(response => {
			if (!response.ok) {
				throw new Error('网络错误');
			}
			return response.json();
		}).then(data => {
			if (data.status !== 0) {
				console.error('登录失败:', data.msg); // TODO: 替换为提示框组件
			}
		}).catch(error => {
			console.error('登录失败:', error); // TODO: 替换为提示框组件
		})
	}
</script>

<div class="login-container">
	<div class="login-panel">
		<!-- 左侧登录表单 -->
		<div class="login-form">
			<h1 class="title">3min</h1>
			
			<div class="form-content">
				<div class="input-container">
					<input 
						type="text" 
						bind:value={credential}
						placeholder="请输入ID/帐号/手机号/邮箱/姓名"
						class="token-input"
					/>
				</div>
				
				<div class="input-container">
					<input 
						type="password" 
						bind:value={password}
						placeholder="请输入密码"
						class="password-input"
					/>
				</div>
				
				<button 
					type="button" 
					class="login-btn"
					onclick={handleLogin}
				>
					登录
				</button>
				
				<div class="agreement-container">
					<label class="agreement-label">
						<input 
							type="checkbox" 
							bind:checked={agreeTerms}
							class="agreement-checkbox"
						/>
						<span class="agreement-text">
							我已阅读并同意<a href="#">用户协议</a>、
							<a href="#">隐私政策</a>、
							<a href="#">产品服务协议</a>
						</span>
					</label>
				</div>
			</div>
		</div>
		
		<!-- 右侧微信扫码 -->
		<div class="qr-section">
			<h3 class="qr-title">微信扫码登录</h3>
			<div class="qr-code">
				<!-- 这里应该是实际的二维码，暂时用占位符 -->
				<div class="qr-placeholder">
					<div class="qr-pattern"></div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@import '/src/lib/styles/global.css';

	.login-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 2rem;
	}

	.login-panel {
		display: flex;
		background: white;
		border-radius: var(--border-radius-lg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		max-width: 70%;
		width: 100%;
	}

	.login-form {
		flex: 1;
		padding: 4rem 5.5rem;
		min-width: 0;
		max-width: 60%;
	}

	.title {
		font-size: 2.5rem;
		font-weight: bold;
		color: var(--primary-color);
		margin: 0 0 2rem 0;
		text-align: center;
	}

	.form-content {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.input-container {
		display: flex;
		align-items: center;
		border-bottom: 2px solid #e0e0e0;
		padding-bottom: 0.5rem;
	}

	.token-input,
	.password-input {
		flex: 1;
		border: none;
		outline: none;
		font-size: 1rem;
		padding: 0.5rem 0;
		background: transparent;
		width: 100%;
	}

	.token-input::placeholder,
	.password-input::placeholder {
		color: #999;
	}

	.login-btn {
		background: var(--primary-color);
		color: white;
		border: none;
		border-radius: 4px;
		padding: 1rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
		width: 100%;
		margin-top: 1.5rem;
	}

	.login-btn:hover {
		background: var(--primary-hover);
	}

	.agreement-container {
		display: flex;
		justify-content: center;
	}

	.agreement-label {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		cursor: pointer;
	}

	.agreement-checkbox {
		margin: 0.1rem 0 0;
		cursor: pointer;
	}

	.agreement-text {
		font-size: 0.8rem;
		color: #666;
		line-height: 1.4;
	}

	.agreement-text a {
		color: var(--primary-color);
		text-decoration: none;
	}

	.agreement-text a:hover {
		text-decoration: underline;
	}

	.qr-section {
		flex: 1;
		padding: 3rem 2.5rem;
		background: #fafafa;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-width: 0;
		max-width: 50%;
		text-align: center;
	}

	.qr-title {
		font-size: 1.2rem;
		color: #333;
		margin: 0 0 2rem 0;
		text-align: center;
	}

	.qr-code {
		width: 80%;
		max-width: 200px;
		aspect-ratio: 1;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f9f9f9;
		margin: 0 auto;
		position: relative;
	}

	.qr-placeholder {
		width: 90%;
		aspect-ratio: 1;
		border: 2px dashed #ccc;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
		font-size: 0.875rem;
		position: relative;
		overflow: hidden;
	}

	.qr-pattern {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: 
			repeating-linear-gradient(0deg, #333 0px, #333 10px, transparent 10px, transparent 20px),
			repeating-linear-gradient(90deg, #333 0px, #333 10px, transparent 10px, transparent 20px);
		opacity: 0.3;
	}

	/* 响应式设计 */
	@media (max-width: 1200px) {
		.login-panel {
			flex-direction: column;
			max-width: 80%;
			width: 100%;
		}
		
		.login-form {
			max-width: 80%;
		}
		.qr-section {
			min-width: auto;
			max-width: 100%;
			padding: 2rem 1.5rem;
		}
		
		.qr-code {
			width: 70%;
			max-width: 170px;
		}
		
		.qr-placeholder {
			width: 85%;
		}
		
		.qr-pattern {
			background-size: 1rem 1rem;
			background-position: 0 0, 0 0.5rem, 0.5rem -0.5rem, -0.5rem 0;
		}
	}
</style>