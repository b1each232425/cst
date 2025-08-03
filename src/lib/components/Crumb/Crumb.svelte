<script>
  //@ts-nocheck
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { baseNavItems } from '$lib/stores/modules/permission.js';
  import { json } from '@sveltejs/kit';

  let { app_name, curr_url_path = $bindable(''), username, avatar_img, icons, event_handle_funcs } = $props();

  let displayName = $state('');

  let nav_map = $baseNavItems;

  let current_nav_path_data = $state([]);

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
   * 导航历史记录
   * @type {record<string, string>}}
   */
  let nav_history_set = {};

  onMount(async () => {
    await getUserInfo();
  });

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

  $effect(() => {
    let current_url_path = page.url.pathname;

    if (nav_map == null) {
      throw new Error('navigation data is required');
    }

    let nav_path_data = getNavData(current_url_path, nav_map);

    current_nav_path_data = nav_path_data;

    if (document.title == '') {
      document.title = `${app_name}`;
    } else if ((document.title == '' || document.title == `${app_name}`) && nav_path_data.length > 0) {
      document.title = ``;

      for (let i = current_nav_path_data.length - 1; i >= 0; i--) {
        if (i == 0) {
          document.title += ` ${current_nav_path_data[i].title}`;
          break;
        }

        document.title += `${current_nav_path_data[i].title} • `;
      }

      document.title += ` • ${app_name}`;
    }

    console.log(document.title, `当前历史路径: ${JSON.stringify(nav_history_set)}`);
  });

  /**
   * 获取cookie值
   * @param {string} name - cookie名称
   * @returns {string|null} cookie值
   */
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * 获取用户正式名称
   */
  // 获取用户权限并生成 nav_map
  function getUserInfo() {
    fetch('/api/user/me')
      .then((response) => response.json())
      .then(async (data) => {
        if (!data?.data?.APIs) throw new Error('APIs 数据不存在');

        displayName = data.data.OfficialName;
      })
      .catch((error) => {
        console.error('获取用户权限失败:', error);
        nav_map = []; // 失败时设为空数组
      });
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

  /**
   * 获取当前路由路径数据
   * @param {string} path - 路由路径
   * @param {Array<NavMapData>} nav_map - 导航数据
   * @returns {Array<NavMapData>} - 当前路由路径数据
   */
  function getNavData(path, nav_map) {
    let result = [];

    for (let navData of nav_map) {
      let path_reg = new RegExp(`\^${navData.path}\$`);

      if (path_reg.test(path)) {
        result.push({
          ...navData,
          actual_path: path,
        });

        nav_history_set[navData.path] = path;

        break;
      }

      if (navData.children == null) {
        continue;
      }

      let childNavData = getNavData(path, navData.children);

      if (childNavData.length <= 0) {
        continue;
      }

      result.push({
        ...navData,
      });

      result = result.concat(childNavData);
    }

    return result;
  }

  /**
   * 导航跳转函数
   * @param {string} curr_path - 路由路径
   * @param {string} first_path - 初始路径
   */
  function navGoto(curr_path, first_path) {
    let history_path = nav_history_set[curr_path];

    if (history_path != null && history_path != undefined) {
      goto(history_path);
      return;
    }

    goto(first_path);
  }
</script>

<div class="header-container">
  <div class="breadcrumbs-container">
    {#each current_nav_path_data as { name, title, path, actual_path, children_is_parallel }, index}
      <div class="breadcrumbs-item-container">
        {#if index < current_nav_path_data.length - 1}
          {#if children_is_parallel}
            <span class="breadcrumbs-item">{title}</span>
          {:else}
            <button
              class="breadcrumbs-item"
              class:active={true}
              title={`跳转至${title}`}
              onclick={() => {
                navGoto(path, current_nav_path_data[0].path);
              }}
            >
              {title}
            </button>
          {/if}

          <span class="breadcrumbs-separator">{'>'}</span>
        {:else}
          <span class="breadcrumbs-item">{title}</span>
        {/if}
      </div>
    {/each}
  </div>

  <div class="user-container">
    <span class="welcome-text">{`你好，${displayName}`}</span>

    <button
      class="avatar-btn"
      bind:this={avatar_btn_element}
      onclick={() => {
        user_menu_open = !user_menu_open;
      }}
    >
      <img class="avatar-img" src={avatar_img} alt="头像" />
    </button>

    <button class="notification-btn">
      <img class="notification-img" src={icons.notification} alt="通知" />
    </button>
  </div>

  {#if user_menu_open}
    <div class="user-menu-container" bind:this={user_menu_element} transition:slide={{ duration: 150 }}>
      <button
        class="user-menu-item"
        onclick={(e) => {
          user_menu_open = false;
          event_handle_funcs?.onclickPersonalCenter?.();
        }}
      >
        <span>个人中心</span>
      </button>
      <button
        class="user-menu-item"
        onclick={() => {
          user_menu_open = false;
          event_handle_funcs?.onclickSettings?.();
        }}
      >
        <span>设置</span>
      </button>
      <button
        class="user-menu-item"
        style="color:#e34d59"
        onclick={() => {
          user_menu_open = false;
          // 如果提供了自定义的退出登录函数，则使用它
          if (event_handle_funcs?.onclickLogout) {
            event_handle_funcs.onclickLogout();
          } else {
            // 否则使用默认的退出登录逻辑
            handleLogout();
          }
        }}
      >
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
    padding: 2px 2px 2px 55px;
    justify-content: flex-start;
    align-items: center;
  }

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
  }

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

  .user-container {
    display: flex;
    position: absolute;
    right: 2%;
    justify-content: flex-start;
    align-items: center;
  }

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
  }

  .user-menu-item {
    border: none;
    padding: 8px 2px 8px 2px;
    cursor: pointer;

    &:hover {
      background-color: #e2e2e2;
      box-sizing: border-box;
    }
  }
</style>
