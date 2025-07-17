<script>
</script>
<div class="app">
  <main>
    <slot />
  </main>
</div>


<style scoped>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: #eff0f2;
    }

    text {
        font-size: 14px;
    }

    main {
        height: 100%;
    }

</style>