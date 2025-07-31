<script>
  let { children } = $props();
</script>

<div class="no-global-layout">
  {@render children()}
</div>

<style>
  :global(footer) {
    display: none !important;
  }
  :global(body) {
    background: none !important;
  }
  :global(.student-layout) {
    width: 100vw !important;
    padding: 0 !important;
    margin: 0 !important;
    background: none !important;
  }
  :global(.header) {
    display: none !important;
  }
</style>