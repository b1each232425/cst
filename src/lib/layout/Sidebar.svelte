<!--
 * @Author: Zpekii 3156752796@qq.com
 * @Date: 2025-04-04 14:00:14
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-06-20 21:32:25
 * @FilePath: \exam-fe\src\lib\layout\Sidebar.svelte
 * @Description: 侧边栏组件
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
//@ts-nocheck
    import { onMount } from "svelte";
    import { slide } from "svelte/transition";
	import { goto } from "$app/navigation";


    /**
     * @typedef NavMapData
     * @property {string}       name                    - 标识名
     * @property {string}       title                   - 标题,直接显示到侧边栏上
     * @property {string}       path                    - 路由路径
     * @property {NavMapData[]} [children]              - 子路由
     * @property {string}       [icon]                  - 图标路径
     * @property {boolean}      [fold]                  - 是否折叠,默认false,仅在有子路由时生效
     * @property {boolean}      [children_is_parallel]  - 启用子路由折叠/张开显示,默认值为true,仅在有子路由时生效；若为true,则当前路由将采用折叠/张开状态(不会进行页面跳转),否则采用默认状态(点击路由时将直接跳转到该路由页面)
     * @property {boolean}      [force_hide]            - 是否强制隐藏, 默认为false；若子路由存在  
     */
    
    
    /**
     * @type {{
     *      nav_map: NavMapData[];               // 导航项数据
     *      logo?: import("svelte").Snippet;    // logo组件
     *      icons: {
                itemFold:        string;  // 折叠图标
                itemUnfold:      string;  // 展开图标
                sidebarFold:     string;  // 收起侧边栏图标
                sidebarUnfold:   string;  // 展开侧边栏图标
            };                                  // 图标数据
            options?: {
                sidebarWidth:    string;  // 侧边栏宽度
                sidebarMaxWidth: string;  // 侧边栏最大宽度
                sidebarMinWidth: string;  // 侧边栏最小宽度
                sidebarHeight:   string;  // 侧边栏高度
            };                                  // 侧边栏配置项
     * }}
     */
    let { nav_map, logo, icons, options } = $props();

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
    let sidebar_fold_str = $state("收起侧边栏");

    /**
     * 当前选中的路由路径
     */
    let current_active = $state("/");

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
     * 当前选中的导航项
     * @type {HTMLButtonElement}
     */
    let current_navItem_element = $state(null);

    onMount(()=>{

        // 设置侧边栏宽度和高度
        sidebar_element.style.setProperty("--sidebar-width", options?.sidebarWidth || "235px");

        sidebar_element.style.setProperty("--sidebar-max-width", options?.sidebarMaxWidth || "250px");

        sidebar_element.style.setProperty("--sidebar-min-width", options?.sidebarMinWidth || "220px");

        sidebar_element.style.setProperty("--sidebar-height", options?.sidebarHeight || "100%");

        // 初始化侧边栏状态
        sidebar_fold_state = window.localStorage.getItem("sidebar_fold_state") == "true" ? true : false;
        sidebar_is_folding = sidebar_fold_state;
        sidebar_is_folded = sidebar_fold_state;

        let nav_map_storage = null;

        try{
            nav_map_storage = JSON.parse(window.localStorage.getItem("sidebarNavMap") || "[]");
        } catch(e) {
            console.error("sidebarNavMap parse error", e);
        }

        nav_map_storage = nav_map_storage == null ? [] : nav_map_storage;

        let nav_map_snapshot = $state.snapshot(nav_map);

        // 初始化侧边栏导航项状态
        for(let i = 0; i < nav_map_snapshot.length; i++){
            initItemFoldState(nav_map_snapshot[i], nav_map_storage[i]);
        }
        
        window.addEventListener("resize", handleResize);

    })

    $effect(()=>{

        if(sidebar_fold_state) {
            sidebar_fold_str = "展开侧边栏";

            sidebar_toggle_btn.style.setProperty("--sidebar-toggle-btn-translate-x", `${sidebar_toggle_btn.offsetWidth}px`)

        } else {
            sidebar_fold_str = "收起侧边栏";

            sidebar_toggle_btn.style.setProperty("--sidebar-toggle-btn-translate-x", `${0}px`)
        }

        current_active = window.location.pathname;

        window.localStorage.setItem("sidebar_fold_state", sidebar_fold_state);

        window.localStorage.setItem("sidebarNavMap", JSON.stringify(nav_map));

        // console.log(`sidebar_fold_state: ${sidebar_fold_state} sidebar_is_folding: ${sidebar_is_folding} sidebar_is_folded: ${sidebar_is_folded}`)
    })

    /**
     * 初始化导航项折叠状态
     * @param {NavMapData} item 导航项数据
     * @param {NavMapData} itemStorage 导航项存储数据
     */
    function initItemFoldState(item, itemStorage) {

        if (item == null || itemStorage == null) {
            return;
        }

        item.fold = itemStorage.fold == null ? true : itemStorage.fold;

        item.children = item.children == null ? [] : item.children;

        item.children_is_parallel = item.children_is_parallel == null ? true : item.children_is_parallel;

        item.children_is_parallel = checkItemHasChildrenNeedShow(item);

        item.force_hide = item.force_hide == null ? false : item.force_hide;

        for(let i = 0; i < item.children.length; i++){
            console.log(item?.children[i])

            let item_children = item.children == null ? null : item.children[i];

            let itemStorage_children = itemStorage?.children == null ? null : itemStorage.children[i];

            initItemFoldState(item_children, itemStorage_children);
        }

    }

    /**
     * 查找当前选中的导航项
     * @param {string} path 指定url路径
     * @param {NavMapData[]} navMapData 导航项数据
     * @return {NavMapData | null} 返回当前选中的导航项数据,如果没有找到则返回null
     */
    function findRouteItem(path, navMapData) {
        for(let i = 0; i < navMapData.length; i++){
            if(navMapData[i].path == path) {
                return navMapData[i];
            }
            if(navMapData[i].children != null && navMapData[i].children.length > 0) {
                let item = findRouteItem(path, navMapData[i].children);
                if(item != null) {
                    return item;
                }
            }
        }
        return null;
    }

    /**
     * 滚动到当前选中的导航项
     * @param {string} [path] 指定url路径,如果不传入则默认使用当前url路径
    */
    function scrollToCurrentNavItem(path) {

        if(current_navItem_element){
            current_navItem_element.scrollIntoView({ behavior: "smooth", block: "nearest" });
            return;
        }

        let currentPath = path == "" || path == null ? window.location.pathname : path;

        let currentItem = findRouteItem(currentPath, nav_map);

        if(currentItem != null) {
            current_navItem_element = sidebar_element.querySelector(`.sidebar-item[title="${currentItem.title}"]`);
            if(current_navItem_element != null) {
                current_navItem_element.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    }

    /**
     * 切换侧边栏折叠状态
     * @param {boolean} [foldState] 是否折叠侧边栏,如果不传入则默认使用当前状态
     */
    function toggleSidebar(foldState) {

        if(sidebar_fold_state == foldState) {
            return;
        }

        side_float = false;
        sidebar_fold_state = foldState != null ? foldState : !sidebar_fold_state;
        sidebar_is_folding = sidebar_fold_state;
        sidebar_is_folded = false;

        sidebar_element.style.setProperty("--sidebar-min-width", "0px");
        console.log(`sidebar_fold_state: ${sidebar_fold_state} sidebar_is_folding: ${sidebar_is_folding} sidebar_is_folded: ${sidebar_is_folded}`)
    }

    /**
     * 侧边栏折叠动画结束事件处理函数
     */
    function sidebarTransitionendHandle(){

        sidebar_element.style.setProperty("--sidebar-min-width", options?.sidebarMinWidth || "220px");

        if(!sidebar_is_folding) {
            return
        }

        sidebar_is_folding = false;
        sidebar_is_folded = true;

        // console.log(`sidebarTransitionendHandle => sidebar_fold_state: ${sidebar_fold_state} sidebar_is_folding: ${sidebar_is_folding} sidebar_is_folded: ${sidebar_is_folded}`)

    }

    /**
     * 鼠标进入侧边栏事件处理函数
     * 执行后会将侧边栏滚动到当前选中的导航项
     * 如果侧边栏正在折叠中或者侧边栏已经折叠则不执行任何操作
     */
    function sidebarMouseEnter(){

        scrollToCurrentNavItem();

        if(sidebar_is_folding || !sidebar_is_folded){
            return;
        }

        clearTimeout(sidebar_mouse_leave_timeout);

        sidebar_mouse_enter_timeout = setTimeout(() => {

            clearTimeout(sidebar_mouse_enter_timeout);

            if(sidebar_is_folding || !sidebar_is_folded) {
                return;
            }

            side_float = true;

            sidebar_element.style.setProperty("--sidebar-min-width", "0px");

        }, 500);

    }

    /**
     * 鼠标离开侧边栏事件处理函数
     * 执行后会将侧边栏滚动到当前选中的导航项
     * 如果侧边栏正在折叠中或者侧边栏已经折叠则不执行任何操作
     * 如果鼠标在500ms内再次进入侧边栏则不执行任何操作
     */
    function sidebarMouseLeave() {

        scrollToCurrentNavItem();

        if(sidebar_is_folding || !sidebar_is_folded){
            return;
        }

        clearTimeout(sidebar_mouse_enter_timeout);

        sidebar_mouse_leave_timeout = setTimeout(() => {

            clearTimeout(sidebar_mouse_leave_timeout);

            if(sidebar_is_folding || !sidebar_is_folded) {
                return;
            }

            side_float = false;


        }, 500);

    }

    /**
     * 侧边栏媒体查询事件处理函数
     * 如果侧边栏宽度小于等于768px则将侧边栏折叠
    */
    function handleResize(){
        if(window.innerWidth <= 768) {
            toggleSidebar(true);
        }
    }


    /**
     * 处理侧边栏导航项点击事件
     * 跳转到指定路由
     * @param { NavMapData } item 导航项数据
     */
    function handleSidebarItemClick(item){

        if(item.children != null && item.children.length > 0 && item.children_is_parallel && !checkItemHasChildrenForceHide(item)) {
            item.fold = item.fold == null ? false : !item.fold;
            return;
        }

        current_active = item.path;

        goto(item.path, { replaceState: true });
    }

    /**
     * 检查导航项是否有子路由
     * @param {NavMapData} item
     * @param {string} childrenPath
     * @return {boolean} result
     */
    function checkItemHasChildren(item, childrenPath){
        if(item.children == null || item.children.length <= 0) {
            return false;
        }

        for(let i = 0; i < item.children.length; i++){
            if(item.children[i].path == childrenPath) {
                return true;
            }

            let childrenResult = checkItemHasChildren(item.children[i], childrenPath);

            if(childrenResult) {
                return true;
            }

        }

        return false;
    }

    /**
     * 检查是否有子路由需要显示
     * @param {NavMapData} item
     * @return {boolean} result
    */
    function checkItemHasChildrenNeedShow(item) {
        if(item.children == null || item.children.length <= 0) {
            return false;
        }

        for(let i = 0; i < item.children.length; i++){
            if(item.children[i].force_hide) {
                continue;
            }

            return true;
        }

        return false;
    }

    /**
     * 检查当前是否有子路由强制隐藏
     * @param {NavMapData} item
     * @param {string} childrenPath
     * @return {boolean} result
    */
    function checkItemHasChildrenForceHide(item) {
        if(item.children == null || item.children.length <= 0) {
            return false;
        }

        for(let i = 0; i < item.children.length; i++){
            if(!item.children[i].force_hide) {
                continue;
            }

            return true;

        }

        return false;
    }

    /**
     * 检查当前选中的子路由是否强制隐藏
     * @param {NavMapData} item
     * @param {string} childrenPath
     * @return {boolean} result
    */
    function checkActiveChildrenIsForceHide(item, childrenPath) {
        if(item.children == null || item.children.length <= 0) {
            return false;
        }

        for(let i = 0; i < item.children.length; i++){
            if(item.children[i].path != childrenPath || !item.children[i].force_hide) {
                continue;
            }

            return true;
        }

        return false;
    }
    
    /**
     * 正则匹配路径
     * @param {string} path
     * @param {string} path_regex
     * @return {boolean} result
     */
    function regexMatch(path, path_regex){
        return new RegExp(`${path_regex}`).test(path);
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

<div class="sidebar-container" 
    bind:this={sidebar_container_element}
    role="region" 
    onmouseenter={() => sidebarMouseEnter()} 
    onmouseleave={() => sidebarMouseLeave()}
>

    <!-- 侧边栏内容 -->
    <div class="sidebar-content" 
        class:folding={sidebar_is_folding} 
        class:folded={sidebar_is_folded}
        class:float={side_float} 
        bind:this={sidebar_element}
        ontransitionend={() => sidebarTransitionendHandle()}
    >

        <button class="logo" onclick={() => { window.location.href = "/"}} >
            {@render logo()}
        </button>

        <!-- 导航项内容 -->
        {#snippet Sidebar(navMapData)}
            <ul class="sidebar-content-main">
                {#each navMapData as item}
            
                    {#snippet Item(it, level)}

                        {#if !it.force_hide}
                            {#snippet ItemContent(i, level)}
                                        
                                <div class="sidebar-item-content" style="left:{ 25 + level * 10}px;width: {(100 - level * 5) < 0 ? 0 : (100 - level * 5)}%"> 
                                    {#if i.icon}
                                        <img class="sidebar-item-icon" src={i.icon} alt={i.title} />
                                    {:else}
                                        <span class="sidebar-item-icon"></span>
                                    {/if}

                                    <span class="sidebar-item-text">{i.title}</span>
                                </div>

                            {/snippet}

                            <li class="sidebar-item"  
                                class:active={
                                    current_active == it.path || 
                                    (!it.children_is_parallel && regexMatch(current_active, it.path)) || 
                                    (checkItemHasChildren(it, current_active) && (it.fold || !it.children_is_parallel || checkActiveChildrenIsForceHide(it, current_active)))
                                }  
                                title={it.title} 
                            >

                                {#if it.children != null && it.children.length > 0 && it.children_is_parallel}
                                    <img class="sidebar-item-icon" src={it.fold ? icons.itemUnfold : icons.itemFold} alt={it.fold ? "展开":"折叠"}  style="
                                        position:absolute;
                                        right:10%;"/>
                                {/if}

                                {@render ItemContent(it, level)}

                                <button class="sidebar-item-btn" class:active={current_active == it.name} onclick={() => {handleSidebarItemClick(it)}} aria-label={it.title}></button>
                            
                            </li>

                            {#if !it.fold && it.children_is_parallel }
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


    <button class="sidebar-toggle-btn"  bind:this={sidebar_toggle_btn}  title={sidebar_fold_str} 
        onclick={() => toggleSidebar()}
    >

        {#if sidebar_fold_state}
            <img src={icons.sidebarUnfold} alt="展开侧边栏" style="width:30px"/>
        {:else}
            <img src={icons.sidebarFold} alt="收起侧边栏" style="width:30px"/>
        {/if}

    </button>

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

.sidebar-container {
    position: relative;
    display: block;
    width: max-content;
    height: 100%;
    background-color: rgba(243, 243, 243, 0);
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
}

img {
    width: inherit;
    height: inherit;
}

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
    // box-shadow: 5px 0 5px 1px rgba(0, 0, 0, 0.1);
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
        top: 42px;
        height: 85vh;
        border-radius: 3px;
        box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.35);
        overflow: hidden;

        .logo, .sidebar-content-main {
            top: 5%;
        }
    }

    &.float {
        width: var(--sidebar-width, 235px);
        min-width: var(--sidebar-min-width, 220px);
        max-width: var(--sidebar-max-width, 250px);
        position: absolute;
        top: 42px;
        height: 85vh;
        border-radius: 3px;
        box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.35);
        overflow: hidden;

        .logo, .sidebar-content-main {
            top: 5%;
        }
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
    cursor: pointer;
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

}

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
        &::before{
            content: "";
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
    width: max-content;
    margin: 0;
    transition: all 0.3s ease;
}

.sidebar-item-icon {
    position: relative;
    width:15px;
    margin:5px;
}

.sidebar-item-text {
    display: block;
    position: relative;
    max-width:60%;
    justify-content:start;
    text-overflow:ellipsis;
    white-space: nowrap;
    overflow:hidden
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


</style>