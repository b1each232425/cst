<script>
	// 全局布局组件
	import '$lib/styles/global.css';
</script>

<style>
	:global(html) {
		height: 100%;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		height: 100%;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
		background-color: var(--bg-primary);
	}

	.app-container {
		min-height: 100vh;
	}
</style>

<div class="app-container">
	<slot />
</div>
