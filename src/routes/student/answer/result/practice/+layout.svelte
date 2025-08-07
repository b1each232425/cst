<script>
    // 使用$props()获取子组件
    let { children } = $props();
</script>

<div>
    <!-- 渲染子组件内容 -->
    {@render children()}
</div>