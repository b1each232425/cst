<script>
  // @ts-nocheck
  import { goto } from "$app/navigation";
  import {
    sidebarFoldingState,
    sidebarWidth,
    navMap,
  } from "../../../lib/stores/modules/layoutStore";
  import { Router, Route, Link } from "svelte-routing";

  // 处理折叠点击事件
  const toggleSidebar = () => {
    $sidebarFoldingState = !$sidebarFoldingState;
    $sidebarWidth = $sidebarFoldingState ? "0px" : "235px";
  };

  // 处理侧边栏点击事件
  const handleItemButtonClick = (item) => {
    if (!item.children) {
      navMap.update((map) => {
        map.forEach((i) => {
          i.isSelect = false;
          if (i.children) {
            i.children.forEach((child) => {
              child.isSelect = false;
            });
          }
        });
        item.isSelect = true;
        item.isOpen = !item.isOpen;
        return [...map];
      });
    } else {
      item.isOpen = !item.isOpen;
      navMap.update((map) => {
        return [...map];
      });
    }
  };
</script>

<div class="sidebar-container" style="width: {$sidebarWidth};">
  <!-- 折叠按钮 -->
  <div class="sidebar-header">
    <button
      class="sidebar-toggle-btn {!$sidebarFoldingState ? '' : 'hide'}"
      onclick={() => toggleSidebar()}
    >
      <img src="/sidebar/fold.svg" alt="收起侧边栏" style="width:30px" />
    </button>
  </div>

  <!-- logo -->
  <div class="logo {!$sidebarFoldingState ? '' : 'hide'}">3min</div>

  <!-- 侧边栏内容 -->
  <div class="sidebar-content {!$sidebarFoldingState ? '' : 'hide'}">
    <!-- 导航项内容 -->
    <div class="sidebar-content-main">
      {#each $navMap as item}
        <div
          class="sidebar-item"
          class:active={item.isSelect}
          style="opacity: {$sidebarFoldingState ? 0 : 1};"
        >
          {#if item.children}
            <button
              class="sidebar-item-btn"
              onclick={() => handleItemButtonClick(item)}
            >
              <div class="sidebar-item-content">
                <img
                  class="sidebar-item-icon"
                  src={item.icon}
                  alt={item.title}
                />
                <span class="sidebar-item-text">{item.title}</span>
                {#if item.isOpen}
                  <img
                    class="img-flod"
                    src="/sidebar/nav_icon/fold.svg"
                    alt=""
                  />
                {:else}
                  <img
                    class="img-unflod"
                    src="/sidebar/nav_icon/unfold.svg"
                    alt=""
                  />
                {/if}
              </div>
            </button>
          {:else}
            <Router>
              <Link to={item.path} style="text-decoration: none;">
                <button
                  class="sidebar-item-btn"
                  onclick={() => handleItemButtonClick(item)}
                >
                  <div class="sidebar-item-content">
                    <img
                      class="sidebar-item-icon"
                      src={item.icon}
                      alt={item.title}
                    />
                    <span class="sidebar-item-text">{item.title}</span>
                  </div>
                </button></Link
              >
            </Router>
          {/if}
        </div>
        {#if item.isOpen && item.children}
          {#each item.children as child}
            <div
              class="sidebar-subitem"
              class:active={child.isSelect}
              style="opacity: {$sidebarFoldingState ? 0 : 1};"
            >
              <Router>
                <Link to={child.path} style="text-decoration: none;">
                  <button
                    class="sidebar-subitem-btn"
                    onclick={() => handleItemButtonClick(child)}
                  >
                    {child.title}
                  </button></Link
                >
              </Router>
            </div>
          {/each}
        {/if}
      {/each}
    </div>
  </div>
</div>

<style lang="scss" scoped>
  /* 修改后的样式 */
  .sidebar-container {
    position: relative;
    display: block;
    height: 100%;
    background-color: rgba(243, 243, 243, 0);

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
        visibility: visible;

        &.hide {
          visibility: hidden;
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
      font-family: "ComicSansMS-Bold", "Comic Sans MS Bold", "Comic Sans MS",
        sans-serif;
      font-weight: 700;
      font-size: 36px;
      color: #0336ff;
      text-align: center;
      line-height: 25px;
      white-space: nowrap;
      display: block;
      margin-left: auto;
      margin-right: auto;
      transition:
        opacity 0.5s ease,
        transform 0.5s ease; /* 添加opacity过渡 */
      opacity: 1; /* 默认显示 */

      &.hide {
        opacity: 0; /* 收起时，透明度为0 */
        transform: scaleX(0); /* 缩放效果 */
      }
    }

    .sidebar-content {
      position: relative;
      display: flex;
      flex-direction: column;
      height: var(--sidebar-height, 100%);
      box-sizing: border-box;
      overflow: hidden;
      transition:
        opacity 0.5s ease,
        transform 0.5s ease; /* 添加过渡效果 */

      &.hide {
        opacity: 0; /* 隐藏内容 */
        transform: scaleX(0); /* 收起时，缩小至0 */
      }

      .sidebar-content-main {
        display: inline;
        flex-direction: column;
        position: relative;
        top: 20px;
        height: 80%;
        width: 100%;
        opacity: 1; /* 默认显示 */

        .sidebar-item {
          display: flex;
          width: 100%;
          height: 40px;
          background-color: rgba(255, 255, 255, 0);
          transition: opacity 0.5s ease; /* 添加过渡效果 */
          font-size: 18px;
          border-radius: 3px;
          color: rgba(0, 0, 0, 0.6);
          opacity: 0; /* 初始透明度为0 */

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
          transition: opacity 0.5s ease; /* 添加透明度过渡 */
          opacity: 0;

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
  }
</style>
