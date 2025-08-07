<script>
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { baseNavItems } from '$lib/stores/modules/permission.js';

  let { event_handle_funcs } = $props();
  let display_name = $state(''); // 用户名称
  let nav_map = $baseNavItems; // 导航数据
  let current_nav_path_data = $state([]);
  let app_name = '3min';

  /**
   * 用户菜单是否打开
   * @type {boolean}
   */
  let user_menu_open = $state(false);

  /**
   * 用户头像按钮元素
   * @type {HTMLElement}
   */
  let avatar_btn_element = $state(null);

  /**
   * 用户菜单元素
   * @type {HTMLElement}
   */
  let user_menu_element = $state(null);

  /**
   * 获取用户正式名称
   */
  function getUserInfo() {
    fetch('/api/user/me')
      .then((response) => response.json())
      .then((data) => {
        if (data.status !== 0) {
          throw new Error('用户数据不存在');
        } else {
          display_name = data.data.OfficialName;
        }
      })
      .catch((error) => {
        console.error('获取用户权限失败:', error);
        nav_map = []; // 失败时设为空数组
      });
  }

  /**
   * 获取当前路由路径数据（保持完整层级结构）
   */
  function getNavData(path, nav_map) {
    let result = [];

    for (let navData of nav_map) {
      let path_reg = new RegExp(`^${navData.path}$`);

      if (path_reg.test(path)) {
        // 如果该项标记为isFilter，则跳过不加入结果
        if (!navData.isFilter) {
          result.push({
            ...navData,
            actual_path: path,
          });
        }
        break;
      }

      if (navData.children == null) {
        continue;
      }

      // 递归
      let childNavData = getNavData(path, navData.children);

      if (childNavData.length <= 0) {
        continue;
      }

      // 如果当前项标记为isFilter，则不加入结果
      if (!navData.isFilter) {
        result.push({
          ...navData,
        });
      }

      result = result.concat(childNavData);
    }

    return result;
  }

  /**
   * 处理退出登录点击事件
   */
  async function handleLogout() {
    // 清除 qNearSessions
    document.cookie = 'qNearSessions=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // 跳转到登录页
    goto('/login');
  }

  $effect(() => {
    /**
     * 用户菜单lightbox处理函数, 处理用户菜单的点击事件, 如果点击在用户菜单外部, 则关闭用户菜单
     * @param {MouseEvent} e
     */
    let userMenuLightboxHandleFunc = (e) => {
      if (!user_menu_element?.contains(e.target) && !avatar_btn_element?.contains(e.target)) {
        user_menu_open = false;
      }
    };

    if (user_menu_open) {
      document.addEventListener('click', userMenuLightboxHandleFunc);
    } else {
      document.removeEventListener('click', userMenuLightboxHandleFunc);
    }
  });

  // 响应式效果：根据当前路由更新导航数据和页面标题
  $effect(() => {
    const current_url_path = page.url.pathname;

    if (nav_map == null) {
      throw new Error('navigation data is required');
    }

    let nav_path_data = getNavData(current_url_path, nav_map);
    current_nav_path_data = nav_path_data;
    // $inspect(current_nav_path_data);

    // 设置标题：只使用最后一个导航项的title
    if (nav_path_data.length > 0) {
      const currentNavItem = nav_path_data[nav_path_data.length - 1];
      document.title = `${currentNavItem.title} • ${app_name}`;
    } else {
      document.title = app_name;
    }
  });

  onMount(async () => {
    await getUserInfo();
  });
</script>

<div class="header-container">
  <div class="breadcrumbs-container">
    {#each current_nav_path_data as { name, title, path }, index}
      <div class="breadcrumbs-item-container">
        {#if index < current_nav_path_data.length - 1}
          <button class="breadcrumbs-item" class:active={true} title={`跳转至${title}`} onclick={() => goto(path)}>
            {title}
          </button>
          <span class="breadcrumbs-separator">{'>'}</span>
        {:else}
          <span class="breadcrumbs-item">
            {title}
          </span>
        {/if}
      </div>
    {/each}
  </div>

  <div class="user-container">
    <span class="welcome-text">{`你好，${display_name}`}</span>

    <button
      class="avatar-btn"
      bind:this={avatar_btn_element}
      onclick={() => {
        user_menu_open = !user_menu_open;
      }}
    >
      <img class="avatar-img" src="/user_icons/defaultAvatar.svg" alt="头像" />
    </button>

    <button class="notification-btn">
      <img class="notification-img" src="/user_icons/notification.svg" alt="通知" />
    </button>
  </div>

  {#if user_menu_open}
    <div class="user-menu-container" bind:this={user_menu_element} transition:slide={{ duration: 150 }}>
      <button class="user-menu-item">
        <span>个人中心</span>
      </button>
      <button class="user-menu-item">
        <span>设置</span>
      </button>
      <button class="user-menu-item" style="color:#e34d59" onclick={() => handleLogout()}>
        <span>退出登录</span>
      </button>
    </div>
  {/if}
</div>

<style lang="scss" scoped>
  .header-container {
    display: flex;
    flex-direction: row;
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 52px;
    max-height: 52px;
    background-color: var(--bg-secondary);
    box-sizing: border-box;
    padding: 2px 2px 2px 30px;
    justify-content: flex-start;
    align-items: center;

    .breadcrumbs-container {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      align-items: center;
      width: max-content;
      height: 100%;
      background-color: transparent;
      box-sizing: border-box;
      padding: 2px 2px 2px 2px;

      .breadcrumbs-item {
        text-decoration: none;
        color: rgba(0, 0, 0, 0.6);
        padding: 2px 2px 2px 2px;
        font-size: 16px;
        border: none;
        cursor: pointer;

        &.active {
          color: #0052d9;

          &:hover {
            color: #2b36ff;
            text-decoration: underline;
          }
        }
      }

      .breadcrumbs-separator {
        display: inline-block;
        font-weight: 600;
        font-size: 16px;
        color: rgba(0, 0, 0, 0.6);
        transform: scaleX(0.5);
      }
    }

    .user-container {
      display: flex;
      position: absolute;
      right: 2%;
      justify-content: flex-start;
      align-items: center;

      .welcome-text {
        color: #333333;
        margin: 10px;
        box-sizing: border-box;
      }

      .avatar-btn,
      .notification-btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #f7fafd;
        box-sizing: border-box;
        padding: 2px 2px 2px 2px;
        margin: 5px;
        border: none;
        box-sizing: border-box;
        cursor: pointer;
      }
    }

    .user-menu-container {
      position: absolute;
      display: flex;
      right: 2.8%;
      top: 100%;
      flex-direction: column;
      width: 130px;
      height: max-content;
      box-sizing: border-box;
      box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.35);

      .user-menu-item {
        border: none;
        padding: 8px 2px 8px 2px;
        cursor: pointer;

        &:hover {
          background-color: #e2e2e2;
          box-sizing: border-box;
        }
      }
    }
  }
</style>
