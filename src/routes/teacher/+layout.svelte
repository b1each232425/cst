<script>
  import { linear } from 'svelte/easing';
  import Sidebar from '$lib/components/SideBar/SideBar.svelte';
  import Crumb from '$lib/components/Crumb/Crumb.svelte';
  import Brand from '$lib/components/Brand/Brand.svelte';
  import { sidebarFoldingState, navStore } from '$lib/stores/modules/layoutStore';
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
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

<style lang="scss">
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
      left: 0;
      width: auto;
      height: 100%;
      position: fixed;
      z-index: 1000;
    }

    main {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      margin-left: 235px;
      transition: margin-left 0.2s linear;

      &.shrink {
        margin-left: 0;
      }

      header {
        position: relative;
        flex-shrink: 0;
        height: 50px;
        background-color: #f5f5f5;
        z-index: 1001;
      }

      .content-container {
        flex: 1;
        overflow-y: auto;
        background-color: var(--bg-primary);
        padding: 30px;
      }

      footer {
        flex-shrink: 0;
        height: 50px;
        background-color: #f5f5f5;
      }
    }
  }
</style>
