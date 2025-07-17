<!--
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-03-31 22:02:53
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-05-05 22:08:52
 * @FilePath: \exam-fe\src\routes\teacher\login\+page@.svelte
 * @Description: 
 * @
 * @Copyright (c) 2025 by Zpekii, All Rights Reserved. 
-->
<script>
    import {page} from "$app/state";
    import Login from "$lib/Login.svelte";
    import Footer from "$lib/layout/Footer.svelte";
    import {onMount} from "svelte";
    import {baseNavItems} from "$lib/stores/permission.js";

    /**
     * @typedef {Object} Permission
     * @property {number} id
     * @property {string} name
     * @property {string} type
     * @property {string} path
     * @property {string} method
     */

    /**
     * @typedef {Object} NavItem
     * @property {string} name
     * @property {string} title
     * @property {string} path
     * @property {string} [icon]
     * @property {boolean} [children_is_parallel]
     * @property {boolean} [force_hide]
     * @property {NavItem[]} [children]
     */

    onMount(async() => {
        
        document.title = "教师登录 • 3min";

        let response = await fetch("/api/checkLoginStatus", {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) {
            return;
        }

        let current_path = window.location.pathname;

        if (current_path !== page.url.pathname) {
            return
        }

        window.location.href = "/teacher/questionBank/programming";

    })

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
                return;
            }

            // 确保permissions是数组
            if (!Array.isArray(permissions)) {
                console.error('权限数据格式错误，预期是数组，实际是:', typeof permissions);
                // 回退到使用所有菜单
                console.warn('由于权限数据格式错误，回退到使用全部菜单项');
                return;
            }

            if (permissions.length === 0) {
                console.warn('权限列表为空，用户可能没有任何菜单权限');
                // 回退到使用所有菜单
                console.warn('由于权限列表为空，回退到使用全部菜单项');
                return;
            }

            // 检查第一个权限项的结构
            const firstItem = permissions[0];
            if (!firstItem || typeof firstItem !== 'object' || !('name' in firstItem) || !('type' in firstItem)) {
                console.error('权限数据格式不符合预期，缺少必要的name或type字段:', firstItem);
                // 回退到使用所有菜单
                console.warn('由于权限数据格式不符合预期，回退到使用全部菜单项');
                return;
            }

            // 提取有权限访问的模块名称
            const permittedModules = new Set(
                permissions
                    .map((/** @type {Permission} */ p) => p.name)
            );

            // 更新导航数据
            return baseNavItems.filter(item =>
                permittedModules.has(item.name)
            );

        } catch (error) {
            console.error('获取菜单权限时出错:', error);
            console.error('错误详情:', error instanceof Error ? error.stack : '未知错误类型');
        }
    }

    /**
     * 查找第一个可路由的路径
     * @param {NavItem[]} navItems - 导航项数组
     * @returns {string|null} - 第一个可路由路径
     */
    function findFirstRoutablePath(navItems) {
        /**
         * @param {NavItem} item
         * @returns {string}
         */
        function getFirstPath(item) {
            // 如果是并行子路由，则递归找第一个子项的路径
            if (item.children_is_parallel && Array.isArray(item.children) && item.children.length > 0) {
                return getFirstPath(item.children[0]);
            }

            // 否则，返回它自己的 path
            return item.path;
        }

        for (const item of navItems) {
            const path = getFirstPath(item);
            if (path) return path;
        }

        return null;
    }

</script>

{#snippet logo()}
    <div class="logo" style="
        width: fit-content;
        height: fit-content;
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0);
        box-sizing: border-box;
        font-family: 'ComicSansMS-Bold', 'Comic Sans MS Bold', 'Comic Sans MS', sans-serif;
        font-weight: 700;
        font-size: 32px;
        color: #0336ff;
        text-align: center;
        line-height: 25px;
        padding: 0;
    ">
        3min
    </div>
{/snippet}

{#snippet qr_code()}
    <img src="/normal_u7.png" alt="QR-Code" style="width: 50%;" />
{/snippet}


<div class="main-container">

    <div class="main-content">
        <Login {logo} qr_code={qr_code}  handle_funcs={{
            login: async () => {
                // 获取用户菜单权限
                const navData = await fetchMenuPermissions();
                if (!navData || navData.length === 0) {
                    console.error('用户没有任何菜单权限，无法登录');
                    alert("您没有任何权限，无法登录。请联系管理员。");
                    return;
                }

                let routePath = findFirstRoutablePath(navData);
                if (!routePath) {
                    console.error('没有找到可路由的路径');
                    alert("没有找到可访问的菜单，请联系管理员。");
                    return;
                }

                window.location.href = routePath;
            }
        }} />
    </div>

    <footer>
        <Footer content= {"广州近邻信息有限公司 Copyright © 2024-2034 w2w.me. All Rights Reserved."} />
    </footer>

</div>


<style lang="scss" scoped>
    
.main-container {
    position: fixed;
    display: block;
    left: 0;
    top: 0;
    justify-items: center;
    align-items: center;
    width: 100vw;
    height: 100%;
    background-color: #ffffff;
    z-index: 15;
}
 
.main-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    min-height: max-content;
}

footer {
    display: flex;
    position: absolute;
    justify-content: center;
    align-items: center;
    width: 100%;
    z-index: 20;
    bottom: 0;
}
</style>