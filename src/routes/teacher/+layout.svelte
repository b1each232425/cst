<!--
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-04-06 00:31:15
 * @LastEditors: MIOZD && l317101@163.com
 * @LastEditTime: 2025-06-02 10:37:16
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\+layout.svelte
 * @Description:
 * @
 * @Copyright (c) 2025 by Zpekii, All Rights Reserved.
-->
<!--                         o8o                 .
                             `"'               .o8
 .oooo.o  .ooooo.  oooo d8b oooo  oo.ooooo.  .o888oo
d88(  "8 d88' `"Y8 `888""8P `888   888' `88b   888
`"Y88b.  888        888      888   888   888   888
o.  )88b 888   .o8  888      888   888   888   888 .
8""888P' `Y8bod8P' d888b    o888o  888bod8P'   "888"
                                   888
                                  o888o
 -->
<script>
    import Sidebar from "$lib/layout/Sidebar.svelte";
    import Header from "$lib/layout/Header.svelte";
    import Footer from "$lib/layout/Footer.svelte";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { baseNavItems, permittedModulesKeyInCache } from "$lib/stores/permission.js";

    /**
     * @typedef {Object} Permission
     * @property {number} id
     * @property {string} name
     * @property {string} type
     * @property {string} path
     * @property {string} method
     */

	let { children, data } = $props();

    let nav_icons = $state({
        itemFold: "/sidebar/nav_icon/fold.svg",
        itemUnfold: "/sidebar/nav_icon/unfold.svg",
        sidebarFold: "/sidebar/fold.svg",
        sidebarUnfold: "/sidebar/unfold.svg",
    });

    /** @type {typeof baseNavItems} */
    let navData = $state([]);

    // 获取用户菜单权限
    async function fetchMenuPermissions() {
        try {
            const response = await fetch('/api/permissions/menu', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('获取菜单权限失败:', response.status);
                return;
            }

            const result = await response.json();
            
            if (!result) {
                console.error('菜单权限返回数据为空');
                return;
            }
            
            // 确保data字段存在且有效
            if (!result.data) {
                console.error('菜单权限返回数据缺少data字段');
                return;
            }
            
            // 获取权限列表
            /** @type {Permission[] | null} */
            const permissions = result.data.permissions;

            // 特殊处理：permissions 为 null，视为无任何权限
            if (permissions === null) {
                console.warn('权限字段为 null，用户无任何菜单权限');
                navData = []; // 或 navData = baseNavItems; 根据需求选择
                localStorage.setItem(permittedModulesKeyInCache, JSON.stringify([]));
                localStorage.setItem('sidebarNavMap', '');
                return;
            }
            
            // 确保permissions是数组
            if (!Array.isArray(permissions)) {
                console.error('权限数据格式错误，预期是数组，实际是:', typeof permissions);
                // 回退到使用所有菜单
                console.warn('由于权限数据格式错误，回退到使用全部菜单项');
                navData = baseNavItems;
                return;
            }
            
            if (permissions.length === 0) {
                console.warn('权限列表为空，用户可能没有任何菜单权限');
                // 回退到使用所有菜单
                console.warn('由于权限列表为空，回退到使用全部菜单项');
                navData = baseNavItems;
                return;
            }
            
            // 检查第一个权限项的结构
            const firstItem = permissions[0];
            if (!firstItem || typeof firstItem !== 'object' || !('name' in firstItem) || !('type' in firstItem)) {
                console.error('权限数据格式不符合预期，缺少必要的name或type字段:', firstItem);
                // 回退到使用所有菜单
                console.warn('由于权限数据格式不符合预期，回退到使用全部菜单项');
                navData = baseNavItems;
                return;
            }
            
            // 提取有权限访问的模块名称
            const permittedModules = new Set(
                permissions
                    .map((/** @type {Permission} */ p) => p.name)
            );
            
            // 更新导航数据
            navData = baseNavItems.filter(item =>
                permittedModules.has(item.name)
            );

            // 清空菜单状态缓存
            localStorage.setItem('sidebarNavMap', '');
        } catch (error) {
            console.error('获取菜单权限时出错:', error);
            console.error('错误详情:', error instanceof Error ? error.stack : '未知错误类型');
        }
    }

    // 根据角色初始化导航数据
    onMount(() => {
        if (data.needLogin) {
            // 如果需要登录，重定向到登录页面
            goto('/teacher/login');
            return;
        }

        fetchMenuPermissions();
    });

</script>

<!--
ooooo   ooooo     .                     oooo
`888'   `888'   .o8                     `888
 888     888  .o888oo ooo. .oo.  .oo.    888
 888ooooo888    888   `888P"Y88bP"Y88b   888
 888     888    888    888   888   888   888
 888     888    888 .  888   888   888   888
o888o   o888o   "888" o888o o888o o888o o888o
-->
<div class="app">

    {#snippet logo()}
        <div class="logo" style="
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
        ">
            3min
        </div>
    {/snippet}


    <nav class="sidebar-container">
        <Sidebar {logo} icons={nav_icons}  nav_map={navData} />
    </nav>

    <main>
        <header>
            <Header app_name={"3min"} nav_map={navData} username={"张晓雷"} avatar_img={"/user_icons/defaultAvatar.svg"} icons={ {notification: "/user_icons/notification.svg"} } />
        </header>
        <div class="content-container">

            {@render children()}

            <footer>
                <Footer content= {"广州近邻信息有限公司 Copyright © 2024-2034 w2w.me. All Rights Reserved."} />
            </footer>
        </div>
    </main>


</div>

<!--
             .               oooo
           .o8               `888
 .oooo.o .o888oo oooo    ooo  888   .ooooo.
d88(  "8   888    `88.  .8'   888  d88' `88b
`"Y88b.    888     `88..8'    888  888ooo888
o.  )88b   888 .    `888'     888  888    .o
8""888P'   "888"     .8'     o888o `Y8bod8P'
                 .o..P'
                 `Y8P'

-->
<style lang="scss" scoped>
.app {
    display: flex;
    position: fixed;
    top:0;
    left: 0;
    width: 100%;
    height: 100vh;
}

.sidebar-container {
    top: 0;
    left: 100%;
    width: max-content;
    height: 100%;
    background-color: var(--bg-thirdary);
    box-sizing: border-box;
    z-index: 10;
}

main {
    display: block;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

header {
    display: flex;
    flex-direction: row;
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: max-content;
    z-index: 1;
}

.content-container {
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
    height: 100%;
    background-color: var(--bg-primary);
    box-sizing: border-box;
    padding-bottom: 52px; /* set for footer height */
}

footer {
    display: flex;
    position: relative;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 52px;
    z-index: 2;
}

</style>