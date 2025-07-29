<script>
<<<<<<< HEAD
  // @ts-nocheck
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { tooltip } from '$lib/components/ToolTip/tooltip';
  import { sidebarFoldingState, sidebarWidth, navMap, crumbStore } from '$lib/stores/modules/layoutStore';
=======
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { tooltip } from '$lib/components/ToolTip/tooltip';
  import { sidebarFoldingState, sidebarWidth, crumbStore } from '$lib/stores/modules/layoutStore';
>>>>>>> v1.0.0
  import { onMount } from 'svelte';

  let userName = '张三'; // 静态数据
  let isMenuOpen = $state(false); // 用户菜单是否打开
  let currentPath = $derived(page.url.pathname); // 当前页面路径
  let crumbArray = []; // url分割后的字段数组
  let filterCrumbs = $state([]); // 过滤后的面包屑title和path

  // 处理展开按钮点击事件
  const toggleSidebar = () => {
    $sidebarFoldingState = !$sidebarFoldingState;
    $sidebarWidth = $sidebarFoldingState ? '0px' : '235px';
  };

  // 响应式处理路径变化
  $effect(() => {
    crumbArray = currentPath.split('/').filter((part) => part !== '' && part !== 'teacher');
    updateCrumbSelection($crumbStore);
  });

  // 更新面包屑数据，过滤不需要显示的项
  const updateCrumbSelection = (crumbData) => {
    let newFilterCrumbs = [];

    // 遍历 crumbArray 和仓库数据
    crumbArray.forEach((part) => {
      // 遍历仓库数据，找到与 part 对应的项
      const matchedItem = crumbData.find((item) => {
        // 如果 item.id 是 '[bankid]'，检查路径前缀部分是否匹配
        if (item.id === '[bankid]') {
          // 检查路径前缀部分是否相同
<<<<<<< HEAD
          const basePath = '/teacher/question-bank-management/theory';

          // 判断 currentPath 是否以 basePath 开头，并且路径长度比 basePath 多一部分
          const isBasePathMatch = currentPath.startsWith(basePath);
          const isDynamicPath = currentPath.split('/').length === basePath.split('/').length + 1;

          // 如果是动态路径，匹配并继续处理；如果没有动态部分，也需要匹配
=======
          const basePath = '/teacher/question-bank/theory';
          const isBasePathMatch = currentPath.startsWith(basePath);
          const isDynamicPath = currentPath.split('/').length === basePath.split('/').length + 1;

>>>>>>> v1.0.0
          return isBasePathMatch && (isDynamicPath || currentPath === basePath);
        }
        // 处理其他非动态路径的匹配
        return item.id === part;
      });

      // 如果找到匹配项且 isFilter 为 false，则加入 newFilterCrumbs
      if (matchedItem && !matchedItem.isFilter) {
        newFilterCrumbs.push({
          title: matchedItem.title,
          path: matchedItem.path,
        });
      }
    });

    filterCrumbs = newFilterCrumbs;
  };

  onMount(() => {
    // 点击外部关闭菜单栏
    const handleClickOutside = (event) => {
      if (!event.target.closest('.header-container')) {
        isMenuOpen = false;
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="header-container">
  <!-- 展开按钮 -->
  <div class="sidebar-unflod-btn {$sidebarFoldingState ? '' : 'hide'}">
    <button class="sidebar-toggle-btn" onclick={() => toggleSidebar()}>
      <img src="/sidebar/unfold.svg" alt="展开侧边栏" style="width:30px" />
    </button>
  </div>

  <!-- 面包屑 -->
  <div class="breadcrumbs-container">
    {#each filterCrumbs as crumb, index}
      <button
        class="breadcrumb-item"
        onclick={() => goto(crumb.path)}
<<<<<<< HEAD
        use:tooltip={() => ({
          content: '回到' + crumb.title,
          theme: 'light',
        })}
=======
        use:tooltip={{
          text: '回到' + crumb.title,
        }}
>>>>>>> v1.0.0
      >
        {crumb.title}
      </button>
    {/each}
  </div>

  <!-- 用户信息 -->
  <div class="user-container">
    <span class="welcome-text">{`你好，${userName}`}</span>

    <button class="avatar-btn" onclick={() => (isMenuOpen = !isMenuOpen)}>
      <img class="avatar-img" src="/user_icons/defaultAvatar.svg" alt="头像" />
    </button>

    <button class="notification-btn">
      <img class="notification-img" src="/user_icons/notification.svg" alt="通知" />
    </button>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="user-menu-container {isMenuOpen ? '' : 'hide'}">
    <button class="user-menu-item"> 个人中心 </button>
    <button class="user-menu-item"> 设置 </button>
    <button class="user-menu-item logout"> 退出登录 </button>
  </div>
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
    padding: 0px 2px 2px 0px;
    justify-content: flex-start;
    align-items: center;

    .sidebar-unflod-btn {
      width: 50px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      visibility: visible;

      &.hide {
        visibility: hidden;
      }

      &:hover {
        border-radius: 3px;
        background-color: #d1d1d1;
      }

      .sidebar-toggle-btn {
        all: unset;
        width: 30px;
        height: 30px;
      }
    }

    .breadcrumbs-container {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: max-content;
      height: 100%;
      background-color: transparent;

      .breadcrumb-item {
        all: unset;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;

        border: 1px solid #ccc;
        padding: 5px 10px;
        border-radius: 4px;
        transition:
          color 0.2s,
          background-color 0.2s;
        margin-right: 5px;
      }

      .breadcrumb-item:hover {
        background-color: #f0f0f0;
      }

      .breadcrumb-item:disabled {
        color: #bbb;
        border: 1px solid #ddd;
        cursor: not-allowed;
      }

      .breadcrumb-item:last-child {
        color: #007bff;
        pointer-events: none;
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
        padding: 2px;
        margin: 5px;
        border: none;
        cursor: pointer;
      }
    }

    .user-menu-container {
      position: absolute;
      display: flex;
      right: 3%;
      top: 100%;
      flex-direction: column;
      width: 130px;
      height: max-content;
      box-sizing: border-box;
      box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.35);
      visibility: visible;

      &.hide {
        visibility: hidden;
      }

      .user-menu-item {
        border: none;
        padding: 8px 2px;
        cursor: pointer;
        &:hover {
          background-color: #e2e2e2;
        }
      }

      .logout {
        color: #e34d59;
      }
    }
  }
</style>
