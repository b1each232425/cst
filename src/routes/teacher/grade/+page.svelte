<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/components/Toast/Toast.js';

	onMount(() => {
		// 显示提示信息
		try {
			toast.success('正在跳转到考试成绩管理页面...');
		} catch (error) {
			// 如果 Toast 失败，静默处理，不影响跳转
			console.warn('Toast 显示失败，但继续跳转:', error);
		}

		// 使用 setTimeout 确保跳转稳定执行
		setTimeout(() => {
			// 优先使用 SvelteKit 的 goto，如果失败则使用原生跳转
			try {
				goto('/teacher/grade/exam-grade', { replaceState: true });
			} catch (error) {
				// 备用方案：使用原生跳转
				window.location.href = '/teacher/grade/exam-grade';
			}
		}, 1000); // 1秒延迟，让用户看到提示
	});
</script>

<div class="loading-container">
	<div class="loading-content">
		<div class="spinner"></div>
		<p>您正在访问不存在的页面</p>
		<p>正在为您跳转到考试成绩管理...</p>
	</div>
</div>

<style lang="scss">
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		background-color: #f8f9fa;
	}

	.loading-content {
		text-align: center;
		
		p {
			margin-top: 20px;
			color: #6c757d;
			font-size: 1.1rem;
		}
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e9ecef;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>
