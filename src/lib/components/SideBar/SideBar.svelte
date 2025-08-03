<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { slide, fly } from 'svelte/transition';
  import {
    sidebarFoldingState,
    navStore,
    sidebarFloatState,
    timerId,
    sidebarMouseEnter,
    sidebarMouseLeave,
    getCookie,
  } from '$lib/stores/modules/layoutStore';
  import { linear } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  let currentPath = $derived(page.url.pathname); // 当前页面路径
  let assesableNav = $state([]); // 存储当前用户可以访问的模块数据
  let userInfo = $state(null); // 存储用户信息

  // 折叠、展开侧边栏
  const toggleSidebar = () => {
    $sidebarFoldingState = !$sidebarFoldingState;
  };

  // 处理侧边栏点击事件
  const handleItemButtonClick = (item) => {
    if (!item.children) {
      // 如果没有子路由，直接跳转
      goto(item.path);
    } else {
      // 如果有子路由，切换 isOpen 状态
      item.isOpen = !item.isOpen;
      // 更新 assesableNav
      assesableNav = assesableNav.map((i) => (i.path === item.path ? { ...i, isOpen: item.isOpen } : i));
    }
  };

  // 处理路径变化
  function isPathActive(item) {
    if (item.children && !item.isOpen) {
      // 判断是否是子路径
      const currentPathWithoutBase = currentPath.replace('/teacher', '');
      const itemPathWithoutBase = item.path.replace('/teacher', '');

      // 比较路径去掉公共部分后的结果
      return currentPathWithoutBase.startsWith(itemPathWithoutBase);
    } else {
      if (item.path === currentPath) return true;
    }
  }

  // 过滤侧边栏数据，匹配后端返回的 API 权限
  const filterNavItems = async (apis) => {
    const filteredNavItems = $navStore.filter((item) => {
      // 遍历 APIs，检查当前路径是否与后端权限路径匹配
      return apis.some((api) => api.APIExposePath === item.path);
    });

    return filteredNavItems;
  };

  // 获取用户信息
  async function getUserInfo() {
    // 获取 qNearSessions cookie
    let qNearSessions = getCookie('qNearSessions');

    // 获取用户信息
    fetch(`/api/user/me?qNearSessions=${qNearSessions}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then(async (res) => {
        if (res.status !== 0) {
          console.log('获取用户信息失败', res.msg || '获取用户信息失败，请重试');
        } else {
          userInfo = res.data;
          assesableNav = await filterNavItems(userInfo.APIs);
        }
      })
      .catch(() => {
        console.log('获取用户信息失败', '网络错误，请检查网络连接后重试');
      });
  }

  onMount(async () => {
    await getUserInfo();
  });
</script>

{#if !$sidebarFoldingState}
  <div transition:fly={{ x: -235, duration: 200, easing: linear }} class="sidebar-container">
    <!-- 折叠按钮 -->
    <div class="sidebar-header">
      <button class="sidebar-toggle-btn" onclick={() => toggleSidebar()}>
        <img src="/sidebar/fold.svg" alt="收起侧边栏" />
      </button>
    </div>

    <!-- 侧边栏主要导航区域 -->
    {@render sideBar(assesableNav)}
  </div>
{/if}

{#if $sidebarFoldingState && $sidebarFloatState}
  <!-- 悬浮窗效果 -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="floating-sidebar-container"
    transition:fly={{ x: -235, duration: 300, easing: linear }}
    onmouseenter={() => sidebarMouseEnter()}
    onmouseleave={() => sidebarMouseLeave()}
  >
    {@render sideBar(assesableNav)}
  </div>
{/if}

{#snippet sideBar(navStore)}
  <div class="sidebar-content-main">
    <!-- logo -->
    <div class="logo">3min</div>

    <!-- 遍历路由 -->
    {#each navStore as item}
      <div class="sidebar-item" class:active={isPathActive(item)}>
        <!-- 有子路由 -->
        {#if item.children}
          <button class="sidebar-item-btn" onclick={() => handleItemButtonClick(item)}>
            <div class="sidebar-item-content">
              <img class="sidebar-item-icon" src={item.icon} alt={item.title} />
              <span class="sidebar-item-text">{item.title}</span>
              {#if item.isOpen}
                <img class="img-flod" src="/sidebar/nav_icon/fold.svg" alt="" />
              {:else}
                <img class="img-unflod" src="/sidebar/nav_icon/unfold.svg" alt="" />
              {/if}
            </div>
          </button>
          <!-- 无子路由 -->
        {:else}
          <button class="sidebar-item-btn" onclick={() => handleItemButtonClick(item)}>
            <div class="sidebar-item-content">
              <img class="sidebar-item-icon" src={item.icon} alt={item.title} />
              <span class="sidebar-item-text">{item.title}</span>
            </div>
          </button>
        {/if}
      </div>
      <!-- 处理子路由 -->
      {#if item.isOpen && item.children}
        <div class="sidebar-subitem-wrap" transition:slide>
          {#each item.children as child}
            <div class="sidebar-subitem" class:active={isPathActive(child)}>
              <button class="sidebar-subitem-btn" onclick={() => handleItemButtonClick(child)}>
                {child.title}
              </button>
            </div>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
{/snippet}

<style lang="scss" scoped>
  .sidebar-container {
    position: relative;
    display: block;
    width: 235px;
    height: 100vh;
    background-color: var(--bg-thirdary);

    .sidebar-header {
      width: 235px;
      display: flex;
      justify-content: flex-end;

      .sidebar-toggle-btn {
        width: 50px;
        height: 50px;
        margin-top: 3px;
        background-color: rgba(255, 255, 255, 0);
        border: none;
        margin-left: auto;

        img {
          width: 30px;

          &:hover {
            background-color: #d1d1d1;
            border: 6px;
            border-radius: 3px;
          }
        }
      }
    }
  }

  .floating-sidebar-container {
    display: flex;
    position: fixed;
    width: 235px;
    left: 0;
    top: 30px;
    z-index: 9999;
    pointer-events: auto;
  }

  .sidebar-content-main {
    display: flex;
    flex-direction: column;
    position: relative;
    top: 20px;
    width: 235px;
    height: calc(100vh - min(150px, 20vh));
    background-color: var(--bg-thirdary);
    overflow-y: auto;
    overflow-x: hidden;

    .sidebar-item {
      display: flex;
      background-color: rgba(255, 255, 255, 0);
      font-size: 18px;
      border-radius: 3px;
      color: rgba(0, 0, 0, 0.6);
      cursor: pointer;

      &:hover {
        background-color: #d1d1d1;
      }

      &.active {
        background-color: #d1d1d1;
        border-left: 4px solid blue;
      }

      .sidebar-item-content {
        padding-left: 2rem;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .sidebar-item-icon {
        width: 16px;
      }

      .sidebar-item-text {
        font-size: 18px;
      }

      .img-unflod,
      .img-flod {
        width: 20px;
        margin-left: 3.5rem;
      }

      .sidebar-item-btn {
        all: unset;
        color: rgba(0, 0, 0, 0.6);
        width: 235px;
        height: 40px;
        min-height: 40px;
      }
    }

    .sidebar-subitem {
      display: flex;
      flex-direction: column;
      border-radius: 3px;
      min-height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      &:hover {
        background-color: #d1d1d1;
      }

      &.active {
        background-color: #d1d1d1;
        border-left: 4px solid blue;
      }

      .sidebar-subitem-btn {
        all: unset;
        font-size: 17px;
        color: rgba(0, 0, 0, 0.6);
        width: 235px;
        height: 40px;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .logo {
      width: 235px;
      height: auto;
      margin-top: 20px;
      margin-bottom: 10px;
      border-radius: 3px;
      background-color: rgba(255, 255, 255, 0);
      box-sizing: border-box;
      font-family: 'ComicSansMS-Bold', 'Comic Sans MS Bold', 'Comic Sans MS', sans-serif;
      font-weight: 700;
      font-size: 36px;
      color: #0336ff;
      text-align: center;
      line-height: 25px;
      white-space: nowrap;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
  }
</style>
