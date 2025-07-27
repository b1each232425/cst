<script>
  import Sidebar from '$lib/components/SideBar/SideBar.svelte';
  import Crumb from '$lib/components/Crumb/Crumb.svelte';
  import Brand from '$lib/components/Brand/Brand.svelte';
  import { sidebarWidth } from '$lib/stores/modules/layoutStore';

  let richTextEditor;

  let { children } = $props();
</script>

<div class="app">
  <nav class="sidebar-container" style="width: {$sidebarWidth};">
    <Sidebar />
  </nav>

  <main style="margin-left: {$sidebarWidth};">
    <header>
      <Crumb />
    </header>

    <div class="content-container">
      {@render children()}
    </div>

    <footer>
      <Brand content={'广州近邻信息有限公司 Copyright © 2024-2034 w2w.me. All Rights Reserved.'} />
    </footer>
  </main>
</div>

<style lang="scss" scoped>
  .app {
    display: flex;
    position: relative;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--bg-primary);

    .sidebar-container {
      height: 100%;
      background-color: var(--bg-thirdary);
      position: fixed;
      transition: width 0.5s ease;
    }

    main {
      display: flex;
      flex-direction: column;
      flex: 1;
      transition: margin-left 0.5s ease;

      header {
        display: flex;
        width: 100%;
        height: 60px;
      }

      .content-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        padding: 20px;
      }

      footer {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 55px;
        position: sticky;
      }
    }
  }
</style>
