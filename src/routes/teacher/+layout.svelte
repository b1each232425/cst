<script>
  import { Router, Route, Link } from "svelte-routing";
  import Sidebar from "../../lib/components/SideBar/SideBar.svelte";
  import Crumb from "../../lib/components/Crumb/Crumb.svelte";
  import Brand from "../../lib/components/Brand/Brand.svelte";
  import { sidebarWidth } from "../../lib/stores/modules/layoutStore";
</script>

<div class="app">
  <nav class="sidebar-container" style="width: {$sidebarWidth};">
    <Sidebar></Sidebar>
  </nav>

  <main style="margin-left: {$sidebarWidth};">
    <header>
      <Crumb />
    </header>

    <div class="content-container">
      <Router>
        <!-- 路由配置，确保 path 属性正确设置 -->
        <Route
          path="/teacher/question-bank-management/theory"
          component={() =>
            import("./question-bank-management/theory/+page.svelte")}
        />
        <Route path="/teacher" component={() => import("./+page.svelte")} />
      </Router>
    </div>

    <footer>
      <Brand
        content={"广州近邻信息有限公司 Copyright © 2024-2034 w2w.me. All Rights Reserved."}
      />
    </footer>
  </main>
</div>

<style lang="scss" scoped>
  .app {
    display: flex;
    position: relative;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--bg-primary);

    .sidebar-container {
      height: 100%;
      background-color: var(--bg-thirdary);
      position: fixed;
      transition: width 0.5s ease;
    }

    main {
      display: flex;
      flex-direction: column;
      flex: 1;
      transition: margin-left 0.5s ease; /* 主体部分左边距过渡 */

      header {
        display: flex;
        width: 100%;
        height: 60px;
      }

      .content-container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
      }

      footer {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 55px;
        position: sticky;
      }
    }
  }
</style>
