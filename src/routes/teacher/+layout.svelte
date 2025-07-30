<script>
  import { linear } from 'svelte/easing';
  import Sidebar from '$lib/components/SideBar/SideBar.svelte';
  import Crumb from '$lib/components/Crumb/Crumb.svelte';
  import Brand from '$lib/components/Brand/Brand.svelte';
  import { sidebarFoldingState } from '$lib/stores/modules/layoutStore';
  import { fly } from 'svelte/transition';
  let { children } = $props();
</script>

<div class="app">
  <nav class="sidebar-container">
    <Sidebar />
  </nav>

  <main class={$sidebarFoldingState ? 'shrink' : ''}>
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
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;

    .sidebar-container {
      top: 0;
      left: 0;
      height: 100%;
      position: fixed;
      z-index: 2;
    }

    main {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      overflow: hidden;
      transition: margin-left 0.2s linear;
      margin-left: 235px;

      &.shrink {
        margin-left: 0;
      }

      header {
        display: flex;
        flex-direction: row;
        position: relative;
        top: 0;
        left: 0;
        width: 100%;
        height: max-content;
        z-index: 1;
        background-color: #f5f5f5;
      }

      .content-container {
        display: flex;
        flex-direction: column;
        position: relative;
        width: 100%;
        height: 100%;
        background-color: var(--bg-primary);
        box-sizing: border-box;
        padding: 30px;
        z-index: 1;
      }

      footer {
        display: flex;
        position: relative;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 52px;
        z-index: 1;
        background-color: #f5f5f5;
        text-align: center;
      }
    }
  }
</style>
