<script>
  import SideBar from '$lib/components/SideBar/SideBar.svelte';
  import Crumb from '$lib/components/Crumb/Crumb.svelte';
  import Brand from '$lib/components/Brand/Brand.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { baseNavItems } from '$lib/stores/modules/permission.js';
  import { onMount } from 'svelte';

  let { children, data } = $props();

  let nav_map = $state([]); // 导航数据
  let display_name = $state(''); // 用户名称

  // 获取用户权限并生成 nav_map
  async function getUserInfo() {
    fetch('/api/user/me')
      .then((response) => response.json())
      .then(async (data) => {
        if (!data?.data?.APIs) throw new Error('APIs 数据不存在');

        // 获取用户名
        display_name = data.data.OfficialName;

        // 获取当前用户可访问的路径
        const allowedPaths = await data.data.APIs.map((api) => api.APIExposePath);

        // 过滤 baseNavItems，只保留匹配的父级菜单
        nav_map = $baseNavItems.filter((item) => {
          return allowedPaths.includes(item.path); // 只匹配一级菜单的 path
        });
      })
      .catch((error) => {
        nav_map = []; // 失败时设为空数组
        console.error('获取用户权限失败:', error);
        toast.error('获取用户权限失败：', error);
      });
  }

  onMount(async () => {
    await getUserInfo();
  });
</script>

<div class="app">
  <nav class="sidebar-container">
    <SideBar {nav_map} />
  </nav>

  <main>
    <header>
      <Crumb {display_name} />
    </header>

    <div class="content-wrapper">
      <div class="content-container">
        {@render children()}
      </div>
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
      position: relative;
      width: 100%;
      height: 50px;
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .content-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      height: calc(100% - 100px);
      position: relative;

      .content-container {
        flex: 1;
        overflow-y: auto;
        padding: 0px 15px 0px 15px;
        background-color: var(--bg-primary);
      }
    }

    footer {
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
