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
  } from '$lib/stores/modules/layoutStore';
  import { linear } from 'svelte/easing';

  let currentPath = $derived(page.url.pathname); // 当前页面路径

  // 折叠、展开侧边栏
  const toggleSidebar = () => {
    $sidebarFoldingState = !$sidebarFoldingState;
  };

  // 处理侧边栏点击事件
  const handleItemButtonClick = (item) => {
    if (!item.children) {
      // 如果没有子路由，直接跳转
      item.isOpen = !item.isOpen;
      navStore.update((map) => {
        return map.map((i) => (i === item ? { ...i, isOpen: item.isOpen } : i));
      });
      goto(item.path);
    } else {
      // 如果有子路由，切换 isOpen 状态
      item.isOpen = !item.isOpen;
      navStore.update((map) => {
        return map.map((i) => (i === item ? { ...i, isOpen: item.isOpen } : i));
      });
    }
  };

  // 处理路径变化
  function isPathActive(item) {
    if (item.children) {
      return false;
    } else {
      if (item.path === currentPath) return true;

      // 判断是否是子路径
      const currentPathWithoutBase = currentPath.replace('/teacher', '');
      const itemPathWithoutBase = item.path.replace('/teacher', '');

      // 比较路径去掉公共部分后的结果
      return currentPathWithoutBase.startsWith(itemPathWithoutBase);
    }
  }
</script>

{#if !$sidebarFoldingState}
  <div transition:fly={{ x: -235, duration: 200, easing: linear }} class="sidebar-container">
    <!-- 折叠按钮 -->
    <div class="sidebar-header">
      <button class="sidebar-toggle-btn" onclick={() => toggleSidebar()}>
        <img src="/sidebar/fold.svg" alt="收起侧边栏" />
      </button>
    </div>

    <!-- logo -->
    <div class="logo">3min</div>

    <!-- 侧边栏主要导航区域 -->
    {@render sideBar($navStore)}
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
    {@render sideBar($navStore)}
  </div>
{/if}

<!-- 侧边栏主要导航区域 -->
{#snippet sideBar(navStore)}
  <div class="sidebar-content">
    <div class="sidebar-content-main">
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
          {#each item.children as child}
            <div transition:slide|global class="sidebar-subitem" class:active={isPathActive(child)}>
              <button class="sidebar-subitem-btn" onclick={() => handleItemButtonClick(child)}>
                {child.title}
              </button>
            </div>
          {/each}
        {/if}
      {/each}
    </div>
  </div>
{/snippet}

<style lang="scss" scoped>
  .sidebar-container {
    position: relative;
    display: block;
    height: 100%;
    background-color: var(--bg-thirdary);

    .sidebar-header {
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
        }

        &:hover {
          background-color: #d1d1d1;
          border: 6px;
          border-radius: 3px;
        }
      }
    }

    .logo {
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

  .floating-sidebar-container {
    position: fixed;
    height: 80%;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    z-index: 9999;
    background-color: var(--bg-thirdary);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
  }

  .sidebar-content {
    position: relative;
    display: flex;
    flex-direction: column;
    height: var(--sidebar-height, 100%);
    box-sizing: border-box;
    overflow: hidden;

    .sidebar-content-main {
      display: inline;
      flex-direction: column;
      position: relative;
      top: 20px;
      height: 80%;
      width: 100%;

      .sidebar-item {
        display: flex;
        width: 100%;
        height: 40px;
        background-color: rgba(255, 255, 255, 0);
        font-size: 18px;
        border-radius: 3px;
        color: rgba(0, 0, 0, 0.6);

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
      }

      .sidebar-subitem {
        &:hover {
          background-color: #d1d1d1;
        }

        &.active {
          background-color: #d1d1d1;
          border-left: 4px solid blue;
        }
      }

      .sidebar-item-btn {
        all: unset;
        width: 235px;
        height: 40px;
        color: rgba(0, 0, 0, 0.6);
      }

      .sidebar-subitem-btn {
        all: unset;
        width: 100%;
        height: 40px;
        font-size: 17px;
        color: rgba(0, 0, 0, 0.6);
        padding-left: 4rem;
      }
    }
  }
</style>
