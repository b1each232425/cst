<script>
    import '../lib/styles/global.css';

    let { children } = $props();

</script>

<div class="root-container">
    {@render children()}
</div>

<style lang="scss" scoped>
    .root-container {
        width: 100%;
        height: 100%;
        min-width: max-content;
        min-height: max-content;
    }
</style>