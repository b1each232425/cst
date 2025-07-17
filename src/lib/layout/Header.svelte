<!--
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-04-02 20:05:24
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-06-18 20:59:10
 * @FilePath: \exam-fe\src\lib\layout\Header.svelte
 * @Description: 顶部栏组件
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
<script >
//@ts-nocheck

    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
    import { afterNavigate, goto } from "$app/navigation";
	import { page } from "$app/state";
    import { permittedModulesKeyInCache } from "$lib/stores/permission.js";
	import { json } from "@sveltejs/kit";


    /**
     * @typedef NavMapData
     * @property {string}       name            - 标识名
     * @property {string}       title           - 标题,直接显示到侧边栏上
     * @property {string}       path            - 路由路径, 支持正则表达式
     * @property {string}       actual_path    - 实际路由路径, 用于跳转
     * @property {boolean}      [children_is_parallel] - 是否子路由是平行关系, 如果为 true, 则子路由不会被折叠
     * @property {NavMapData[]} [children]      - 子路由
     */

    /**
     * 所有导航数据
     * @type {{
     *      app_name?: string;       // 应用名称
     *      curr_url_path?: string;   // 当前路由路径
     *      nav_map: NavMapData[];   // 导航数据
     *      username: string;       // 用户名
     *      avatar_img: string;      // 头像图片地址
     *      icons?: {
     *          notification: string; // 通知图标图片地址
     *      };                      // 导航图标图片地址数据
     *      event_handle_funcs?: {
     *          onclickPersonalCenter?: () => void;  // 个人中心点击事件处理函数
     *          onclickSettings?: () => void;        // 设置点击事件处理函数
     *          onclickLogout?: () => void;          // 退出登录点击事件处理函数
     *      }
     * }}
     */
    let { app_name, curr_url_path = $bindable("") ,nav_map, username, avatar_img, icons, event_handle_funcs } = $props();

    /**
     * 显示的用户名
     * @type {string}
     */
    let displayName = $state("");

    /**
     * 当前导航数据，从 nav_map 中获取, 按照父子关系排序的数组数据
     * @type { Array<{
     *      name:   string;         // 标识名
     *      title:  string;         // 标题,直接显示到侧边栏上
     *      path:   string;         // 路由路径
     *   }>
     * }
    */
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

    onMount(async()=>{

        await getUserOfficialName();

    })

    $effect(() => {

        /**
         * 用户菜单lightbox处理函数, 处理用户菜单的点击事件, 如果点击在用户菜单外部, 则关闭用户菜单
         * @param {MouseEvent} e
         */
        let userMenuLightboxHandleFunc = (e) => {
            if(!user_menu_element?.contains(e.target) && !avatar_btn_element?.contains(e.target)){
                user_menu_open = false;
            }
        }

        if(user_menu_open){
            document.addEventListener("click", userMenuLightboxHandleFunc)
        }else{
            document.removeEventListener("click", userMenuLightboxHandleFunc)
        }

    })

    $effect(() => {
        
        let current_url_path = page.url.pathname;

        if(nav_map == null){
            throw new Error("navigation data is required")
        }

        let nav_path_data = getNavData(current_url_path, nav_map);

        current_nav_path_data = nav_path_data;

        if ( document.title == ""){
            document.title =  `${app_name}`
        }else if ((document.title == "" || document.title == `${app_name}`) && nav_path_data.length > 0){

            document.title = ``;

            for(let i = current_nav_path_data.length - 1; i >= 0; i--){

                if(i == 0){
                    document.title += ` ${current_nav_path_data[i].title}`;
                    break;
                }

                document.title += `${current_nav_path_data[i].title} • `;
            }

            document.title += ` • ${app_name}`;

        }

        console.log(document.title, `当前历史路径: ${JSON.stringify(nav_history_set)}`);
    })

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
    async function getUserOfficialName() {
        try {
            const response = await fetch('/api/me/official-name', {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                displayName = `${data.data.official_name}`;
            } else {
                console.error('获取用户名失败');
                displayName = username;
            }
        } catch (error) {
            console.error('获取用户名时出错:', error);
            displayName = username;
        }
    }

    /**
     * 处理退出登录点击事件
     */
    async function handleLogout() {
        try {
            // 向后端发送GET请求退出登录，携带cookies
            const response = await fetch("/api/logout", {
                method: 'GET',
                credentials: 'include', // 确保携带cookies
            });

            // 如果响应成功，重定向到登录页面
            if (response.ok) {
                // 清除缓存中的权限数据
                localStorage.removeItem(permittedModulesKeyInCache);
                goto('/teacher');
            } else {
                console.error('退出登录失败');
            }
        } catch (error) {
            console.error('退出登录时出错:', error);
        }
    }

    /**
     * 获取当前路由路径数据
     * @param {string} path - 路由路径
     * @param {Array<NavMapData>} nav_map - 导航数据
     * @returns {Array<NavMapData>} - 当前路由路径数据
     */
    function getNavData(path, nav_map) {
        let result = [];

        for(let navData of nav_map) {

            let path_reg = new RegExp(`\^${navData.path}\$`);


            if(path_reg.test(path)){
                result.push({
                    ...navData,
                    actual_path: path
                });

                nav_history_set[navData.path] = path;

                break;
            }

            if(navData.children == null ){
                continue;
            }

            let childNavData = getNavData(path, navData.children);

            if(childNavData.length <= 0){
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

<!--
    .                                          oooo                .
  .o8                                          `888              .o8
.o888oo  .ooooo.  ooo. .oo.  .oo.   oo.ooooo.   888   .oooo.   .o888oo  .ooooo.
  888   d88' `88b `888P"Y88bP"Y88b   888' `88b  888  `P  )88b    888   d88' `88b
  888   888ooo888  888   888   888   888   888  888   .oP"888    888   888ooo888
  888 . 888    .o  888   888   888   888   888  888  d8(  888    888 . 888    .o
  "888" `Y8bod8P' o888o o888o o888o  888bod8P' o888o `Y888""8o   "888" `Y8bod8P'
                                     888
                                    o888o

-->

<div class="header-container">

    <div class="breadcrumbs-container">

        {#each current_nav_path_data as { name, title, path, actual_path, children_is_parallel}, index }

            <div class="breadcrumbs-item-container">

                {#if index < current_nav_path_data.length - 1}

                    {#if children_is_parallel }
                        <span class="breadcrumbs-item">{title}</span>
                    {:else}
                        <button class="breadcrumbs-item" class:active={true} title={`跳转至${title}`}
                            onclick={() => {
                                navGoto(path, current_nav_path_data[0].path);
                            }}
                        >
                            {title}
                        </button>
                    {/if}
                    
                    <span class="breadcrumbs-separator">{">"}</span>

                {:else}
                    <span class="breadcrumbs-item">{title}</span>
                {/if}


            </div>
        {/each}

    </div>

    <div class="user-container">

        <span class="welcome-text">{`你好，${displayName}`}</span>

        <button class="avatar-btn"
            bind:this={avatar_btn_element}
            onclick={() => {
                user_menu_open = !user_menu_open;
            }}
        >
            <img class="avatar-img" src={avatar_img} alt="头像"/>
        </button>

        <button class="notification-btn">
            <img class="notification-img" src={icons.notification} alt="通知"/>
        </button>

    </div>

    {#if user_menu_open}
        <div class="user-menu-container"
            bind:this={user_menu_element}
            transition:slide={{duration: 150}}
        >
            <button class="user-menu-item"
                onclick={(e) => {
                    user_menu_open = false;
                    event_handle_funcs?.onclickPersonalCenter?.();
                }}
            >
                <span>个人中心</span>
            </button>
            <button class="user-menu-item"
                onclick={() => {
                    user_menu_open = false;
                    event_handle_funcs?.onclickSettings?.();
                }}
            >
                <span>设置</span>
            </button>
            <button class="user-menu-item"
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
    margin: 10px ;
    box-sizing: border-box;
}

.avatar-btn, .notification-btn {
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
    position:absolute;
    display: flex;
    right:5%;
    top:100%;
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
