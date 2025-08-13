<script>
  import SideBar from '$lib/components/SideBar/SideBar.svelte';
  import Crumb from '$lib/components/Crumb/Crumb.svelte';
  import Brand from '$lib/components/Brand/Brand.svelte';
  let { children, data } = $props();
</script>

<div class="app">
  <nav class="sidebar-container">
    <SideBar />
  </nav>

  <main>
    <header>
      <Crumb />
    </header>

    <div class="content-wrapper">
      <div class="content-container">
        {@render children()}
      </div>

      <footer>
        <Brand content={'广州近邻信息有限公司 Copyright © 2024-2034 w2w.me. All Rights Reserved.'} />
      </footer>
    </div>
  </main>
</div>

<style lang="scss" scoped>
  .app {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    overflow: hidden;

    .sidebar-container {
      top: 0;
      left: 100%;
      width: max-content;
      height: 100%;
      background-color: var(--bg-thirdary);
      box-sizing: border-box;
      z-index: 1001;
    }
  }

  main {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;

    header {
      flex: 0 0 auto;
      position: relative;
      width: 100%;
      height: max-content;
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .content-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      height: calc(100% - 50px);
      position: relative;

      .content-container {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background-color: var(--bg-primary);
      }
    }

    footer {
      flex: 0 0 auto;
      width: 100%;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
    }
  }
</style>
