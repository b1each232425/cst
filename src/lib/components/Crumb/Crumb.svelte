<script>
  import {
    sidebarFoldingState,
    sidebarWidth,
    navMap,
  } from "../../../lib/stores/modules/layoutStore";

  // 静态数据
  let username = "张三";

  // 用户菜单是否打开
  let user_menu_open = false;
  let displayName = username;

  // 处理展开按钮点击事件
  const toggleSidebar = () => {
    $sidebarFoldingState = !$sidebarFoldingState;
    $sidebarWidth = $sidebarFoldingState ? "0px" : "235px";
  };
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
    {#each $navMap as item}
      {#if !item.children && item.isSelect}
        <div class="breadcrumbs-item-container">
          <button class="breadcrumbs-item active">
            {item.title}
          </button>
        </div>
      {:else if item.children}
        {#each item.children as child}
          {#if child.isSelect}
            <div class="breadcrumbs-item-container">
              <button class="breadcrumbs-item active">
                {child.title}
              </button>
            </div>
          {/if}
        {/each}
      {/if}
    {/each}
  </div>

  <!-- 用户信息 -->
  <div class="user-container">
    <span class="welcome-text">{`你好，${displayName}`}</span>

    <button
      class="avatar-btn"
      onclick={() => {
        user_menu_open = !user_menu_open;
      }}
    >
      <img class="avatar-img" src="/user_icons/defaultAvatar.svg" alt="头像" />
    </button>

    <button class="notification-btn">
      <img
        class="notification-img"
        src="/user_icons/notification.svg"
        alt="通知"
      />
    </button>
  </div>

  <div class="user-menu-container {user_menu_open ? '' : 'hide'}">
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

      .breadcrumbs-item {
        text-decoration: none;
        color: rgba(0, 0, 0, 0.6);
        padding: 2px;
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
