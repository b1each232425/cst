<script>
	let { children } = $props();
</script>

{@render children()}

<style>
	.score-management-card {
		background-color: #fff;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		height: 100%;
		flex-grow: 1;
	}
</style> 