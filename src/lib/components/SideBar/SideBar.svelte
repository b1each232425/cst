<script>
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { baseNavItems } from '$lib/stores/modules/permission.js';
  import { page } from '$app/state';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { beforeNavigate } from '$app/navigation';

  let nav_map = $state();
  let current_path = $derived(page.url.pathname);
  let is_auto_fold = false;
  const NEED_FOLD_NAV = ['/teacher/question-bank/theory/editBank']; // 需要自动折叠的路径

  /**
   * 侧边栏折叠状态
   */
  let sidebar_fold_state = $state(false);

  /**
   * 侧边栏是否正在折叠中
   */
  let sidebar_is_folding = $state(false);

  /**
   * 侧边栏是否已经折叠
   */
  let sidebar_is_folded = $state(false);

  /**
   * 侧边栏是否悬浮
   */
  let side_float = $state(false);

  /**
   * 侧边栏折叠状态提示
   */
  let sidebar_fold_str = $state('收起侧边栏');

  /**
   * 当前选中的路由路径
   */
  let current_active = $state('/');

  /**
   * 侧边栏导航项数据
   * @type {HTMLDivElement}
   */
  let sidebar_container_element = $state(null);

  /**
   * 侧边栏组件
   * @type {HTMLDivElement}
   */
  let sidebar_element = $state();

  /**
   * 侧边栏折叠按钮
   * @type {HTMLButtonElement}
   */
  let sidebar_toggle_btn = $state();

  /**
   * 侧边栏鼠标进入定时器
   * @type {number}
   */
  let sidebar_mouse_enter_timeout = $state(null);

  /**
   * 侧边栏鼠标离开定时器
   * @type {number}
   */
  let sidebar_mouse_leave_timeout = $state(null);

  /**
   * 切换侧边栏折叠状态
   */
  function toggleSidebar(foldState) {
    side_float = false;
    sidebar_fold_state = foldState != null ? foldState : !sidebar_fold_state;
    sidebar_is_folding = sidebar_fold_state;
    sidebar_is_folded = false;

    sidebar_element.style.setProperty('--sidebar-min-width', '0px');

    // 更新折叠按钮提示
    sidebar_fold_str = sidebar_fold_state ? '展开侧边栏' : '收起侧边栏';

    // 控制折叠按钮的水平位移
    sidebar_toggle_btn.style.setProperty(
      '--sidebar-toggle-btn-translate-x',
      `${sidebar_fold_state ? sidebar_toggle_btn.offsetWidth : 0}px`,
    );

    is_auto_fold = false;
  }

  /**
   * 侧边栏折叠动画结束事件处理函数
   */
  function sidebarTransitionendHandle() {
    if (!sidebar_is_folding) {
      return;
    }

    sidebar_is_folding = false;
    sidebar_is_folded = true;
  }

  /**
   * 鼠标进入侧边栏事件处理函数
   * 执行后会将侧边栏滚动到当前选中的导航项
   * 如果侧边栏正在折叠中或者侧边栏已经折叠则不执行任何操作
   */
  function sidebarMouseEnter() {
    if (sidebar_is_folding || !sidebar_is_folded) {
      return;
    }

    clearTimeout(sidebar_mouse_leave_timeout);

    sidebar_mouse_enter_timeout = setTimeout(() => {
      clearTimeout(sidebar_mouse_enter_timeout);

      if (sidebar_is_folding || !sidebar_is_folded) {
        return;
      }

      side_float = true;

      sidebar_element.style.setProperty('--sidebar-min-width', '0px');
    }, 500);
  }

  /**
   * 鼠标离开侧边栏事件处理函数
   * 执行后会将侧边栏滚动到当前选中的导航项
   * 如果侧边栏正在折叠中或者侧边栏已经折叠则不执行任何操作
   * 如果鼠标在500ms内再次进入侧边栏则不执行任何操作
   */
  function sidebarMouseLeave() {
    if (sidebar_is_folding || !sidebar_is_folded) {
      return;
    }

    clearTimeout(sidebar_mouse_enter_timeout);

    sidebar_mouse_leave_timeout = setTimeout(() => {
      clearTimeout(sidebar_mouse_leave_timeout);

      side_float = false;
    }, 500);
  }

  /**
   * 侧边栏媒体查询事件处理函数
   * 如果侧边栏宽度小于等于768px则将侧边栏折叠
   */
  function handleResize() {
    if (!sidebar_element) return;

    if (window.innerWidth <= 768) {
      toggleSidebar(true);
    }
  }

  /**
   * 处理侧边栏导航项点击事件
   * @param { NavMapData } item 导航项数据
   */
  function handleSidebarItemClick(item) {
    if (item.children != null && item.children.length > 0 && item.children_is_parallel) {
      item.fold = !item.fold;
      return;
    }

    current_active = item.path;

    goto(item.path);
  }

  /**
   * 检查导航项是否有子路由
   * @param { NavMapData } item 导航项数据
   */
  function checkItemHasChildren(item, childrenPath) {
    if (item.children == null || item.children.length <= 0) {
      return false;
    }

    for (let i = 0; i < item.children.length; i++) {
      if (item.children[i].path == childrenPath) {
        return true;
      }
    }

    return false;
  }

  // 获取用户权限并生成 nav_map
  function getUserInfo() {
    fetch('/api/user/me')
      .then((response) => response.json())
      .then(async (data) => {
        if (!data?.data?.APIs) throw new Error('APIs 数据不存在');

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

  /**
   * 正则匹配路径
   */
  function regexMatch(path, path_regex) {
    return new RegExp(`${path_regex}`).test(path);
  }

  // 监听导航事件，跳转前执行逻辑
  beforeNavigate(({ from, to, cancel }) => {
    if (to) {
      const targetPath = to.url.pathname;

      if (targetPath.includes(NEED_FOLD_NAV) && !is_auto_fold && !sidebar_is_folded) {
        // 折叠侧边栏;
        toggleSidebar(true);
        // 自动折叠时才触发
        is_auto_fold = true;
      } else if (!targetPath.includes(NEED_FOLD_NAV) && is_auto_fold) {
        // 如果路径变化并且是自动折叠，展开侧边栏
        if (sidebar_is_folded) {
          toggleSidebar(false); // 展开侧边栏
        }
        is_auto_fold = false; // 路径变化后取消自动折叠
      }
    }
  });

  onMount(() => {
    // 当窗口大小变化时，调用handleResize函数,当宽度太小自动收起侧边栏
    window.addEventListener('resize', handleResize);

    // 更新当前选中模块并高亮
    current_active = window.location.pathname;

    // 获取用户信息
    getUserInfo();
  });
</script>

<div
  class="sidebar-container"
  bind:this={sidebar_container_element}
  role="region"
  onmouseenter={() => sidebarMouseEnter()}
  onmouseleave={() => sidebarMouseLeave()}
  data-testid="sidebar-container"
>
  <!-- 侧边栏内容 -->
  <div
    class="sidebar-content"
    class:folding={sidebar_is_folding}
    class:folded={sidebar_is_folded}
    class:float={side_float}
    bind:this={sidebar_element}
    ontransitionend={() => sidebarTransitionendHandle()}
    data-testid="sidebar-content"
  >
    <button class="logo">
      <div class="logo-svg">3min</div>
    </button>

    <!-- 导航项内容 -->
    {#snippet Sidebar(navMapData)}
      <ul class="sidebar-content-main">
        {#each navMapData as item}
          {#snippet Item(it, level)}
            {#if !it.force_hide}
              {#snippet ItemContent(i, level)}
                <div class="sidebar-item-content" style={`--level: ${level}`}>
                  {#if i.icon}
                    <img class="sidebar-item-icon" src={i.icon} alt={i.title} />
                  {:else}
                    <span class="sidebar-item-icon"></span>
                  {/if}
                  <span class="sidebar-item-text">{i.title}</span>
                </div>
              {/snippet}

              <li
                class="sidebar-item"
                class:active={(!it.children_is_parallel && regexMatch(current_active, it.path)) ||
                  (checkItemHasChildren(it, current_active) && (it.fold || !it.children_is_parallel)) ||
                  current_active == it.path}
                title={it.title}
              >
                {#if it.children != null && it.children.length > 0 && it.children_is_parallel}
                  <img
                    class="sidebar-subitem-icon"
                    src={it.fold ? '/sidebar/nav_icon/unfold.svg' : '/sidebar/nav_icon/fold.svg'}
                    alt={it.fold ? '展开' : '折叠'}
                  />
                {/if}

                {@render ItemContent(it, level)}

                <button
                  class="sidebar-item-btn"
                  class:active={current_active == it.name}
                  onclick={() => {
                    handleSidebarItemClick(it);
                  }}
                  aria-label={it.title}
                ></button>
              </li>

              {#if !it.fold && it.children_is_parallel}
                <ul class="sidebar-item-child" transition:slide>
                  {#each it.children as child}
                    {@render Item(child, level + 1)}
                  {/each}
                </ul>
              {/if}
            {/if}
          {/snippet}

          {@render Item(item, 0)}
        {/each}
      </ul>
    {/snippet}

    {@render Sidebar(nav_map)}
  </div>

  <button
    class="sidebar-toggle-btn"
    bind:this={sidebar_toggle_btn}
    title={sidebar_fold_str}
    onclick={() => toggleSidebar()}
  >
    {#if sidebar_fold_state}
      <img src="/sidebar/unfold.svg" alt="展开侧边栏" />
    {:else}
      <img src="/sidebar/fold.svg" alt="收起侧边栏" />
    {/if}
  </button>
</div>

<style lang="scss" scoped>
  .sidebar-container {
    position: relative;
    display: flex;
    width: max-content;
    height: 100%;
    background-color: rgba(243, 243, 243, 0);

    .sidebar-content {
      position: relative;
      display: flex;
      flex-direction: column;
      left: 0;
      width: var(--sidebar-width, 235px);
      min-width: var(--sidebar-min-width, 220px);
      max-width: var(--sidebar-max-width, 250px);
      height: var(--sidebar-height, 100%);
      background-color: var(--bg-thirdary);
      transition: width 0.3s ease;
      box-sizing: border-box;
      overflow: hidden;
      &.folding {
        width: 0;
        min-width: 0;
        max-width: var(--sidebar-max-width, 250px);
        overflow: hidden;
      }

      &.folded {
        width: 0;
        min-width: 0;
        max-width: var(--sidebar-max-width, 250px);
        position: absolute;
        top: 50px;
        height: 85vh;
        border-radius: 3px;
        box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.35);
        overflow: hidden;

        .logo,
        .sidebar-content-main {
          top: 5%;
        }
      }

      &.float {
        width: var(--sidebar-width, 235px);
        min-width: var(--sidebar-min-width, 220px);
        max-width: var(--sidebar-max-width, 250px);
        position: absolute;
        top: 50px;
        height: 85vh;
        border-radius: 3px;
        box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.35);
        overflow: hidden;

        .logo,
        .sidebar-content-main {
          top: 5%;
        }
      }

      .logo {
        display: flex;
        flex-direction: column;
        width: 235px;
        position: sticky;
        background-color: rgba(255, 255, 255, 0);
        left: 0;
        top: 50px;
        border: none;
        padding: 0px;
        margin-bottom: 5%;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        box-sizing: border-box;
        white-space: nowrap;
        z-index: 10;
        text-decoration: none;

        .logo-svg {
          width: fit-content;
          height: auto;
          margin-top: 10px;
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
          padding: 0;
          white-space: nowrap;
        }
      }

      .sidebar-content-main {
        display: inline;
        flex-direction: column;
        position: relative;
        top: 60px;
        height: 80%;
        width: 100%;
        justify-content: flex-start;
        align-items: center;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: auto;
        text-overflow: ellipsis;
        padding: 0;
        margin: 0;
        scrollbar-width: thin;

        .sidebar-item {
          display: flex;
          position: relative;
          min-width: max-content;
          height: 40px;
          background-color: rgba(255, 255, 255, 0);
          border: none;
          box-sizing: border-box;
          justify-content: flex-start;
          align-items: center;
          transition: all 0.3s ease;
          font-family: 'PingFangSC-Regular', 'PingFang SC', sans-serif;
          font-size: 16px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0px;
          border-radius: 3px;
          color: rgba(0, 0, 0, 0.6);
          &:hover {
            background-color: #d1d1d1;
          }

          &.active {
            background-color: #e0e0e0;
            &::before {
              content: '';
              position: absolute;
              top: 10%;
              left: 10px;
              width: 4px;
              height: 80%;
              background-color: #0336ff;
              border-radius: 10px;
            }
          }
        }

        .sidebar-item-btn {
          position: absolute;
          top: 0;
          left: 0%;
          width: 235px;
          height: 40px;
          border: none;
          cursor: pointer;
          padding: 0px;
          background-color: rgba(255, 255, 255, 0);
        }

        .sidebar-item-content {
          display: flex;
          flex-direction: row;
          position: absolute;
          justify-content: flex-start;
          align-items: center;
          margin: 0;
          transition: all 0.3s ease;

          /* 基础变量 */
          --left-base: 25px;
          --level-offset: 10px;
          --width-base: 100%;
          --width-reduction: 5%;

          /* 动态计算 */
          left: calc(var(--left-base) + calc(var(--level, 0) * var(--level-offset)));
          width: max(0%, calc(var(--width-base) - calc(var(--level, 0) * var(--width-reduction))));
        }

        .sidebar-item-icon {
          position: relative;
          width: 15px;
          margin: 5px;
        }

        .sidebar-subitem-icon {
          position: absolute;
          right: 10%;
        }

        .sidebar-item-text {
          display: block;
          position: relative;
          max-width: 60%;
          justify-content: start;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }

        .sidebar-item-child {
          display: block;
          flex-direction: column;
          position: relative;
          justify-content: flex-end;
          align-items: center;
          min-width: max-content;
          height: max-content;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: all 0.3s ease;
          padding: 0px;
        }
      }
    }

    .sidebar-toggle-btn {
      display: flex;
      position: absolute;
      top: 13px;
      right: 0px;
      width: 30px;
      height: 30px;
      background-color: rgba(255, 255, 255, 0);
      border: none;
      cursor: pointer;
      z-index: 10;
      transition: transform 0.3s ease;
      transform: translateX(var(--sidebar-toggle-btn-translate-x));
      box-sizing: border-box;
      justify-content: center;
      align-items: center;

      &:hover {
        background-color: #ababab;
        border: 6px;
        border-radius: 3px;
      }

      img {
        width: 30px;
      }
    }
  }
</style>
