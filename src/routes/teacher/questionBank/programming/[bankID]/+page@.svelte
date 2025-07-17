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
    import { page } from '$app/state';
    import EditableTag from '$lib/component/EditableTag.svelte';
    import { slide } from 'svelte/transition';
    import { formatTimestamp } from '$lib/common/time_utils';
    import { onMount } from 'svelte';
    import Sidebar from '$lib/layout/Sidebar.svelte';

    let { data } = $props();

    /**
     * @typedef {Object} BankData
     * @property {string} name - 题库名称
     * @property {string[]} tags - 题库标签
     */
    
    /**
     * 题库数据
     * @type {BankData}
     */
    let bank_data = $state(data);

    /**
     * 添加标签输入框的内容
     * @type {string}
     */
    let add_tag_input = $state("");

    /**
     * 是否折叠仓库列表
     * @type {boolean}
     */
    let is_fold_repository_list = $state(false);

    /**
     * 是否折叠题库配置
     * @type {boolean}
    */
    let is_fold_question_setup = $state(false);

    /**
     * 是否全屏显示题库配置
     * @type {boolean}
     */
    let is_question_setup_fullscreen = $state(false);

    /**
     * @typedef {Object} RepositoryData 仓库数据
     * @property {string} url - 仓库地址
     * @property {string} user - 仓库用户
     * @property {string} password - 仓库用户密码
     * @property {string} operation_time - 操作时间
     */
    
    /**
     * 仓库配置信息数据
     * @type {RepositoryData[]}
     */
    let repository_data = $state([
        {
            url: "https://git.w2w.me:6443",
            user: "abc1231",
            password: "123456",
            operation_time: formatTimestamp(Date.now()),
        },
        {
            url: "https://git.w2w.me:6443",
            user: "abc1232",
            password: "123456",
            operation_time: formatTimestamp(Date.now()),
        },
        {
            url: "https://git.w2w.me:6443",
            user: "abc1233",
            password: "123456",
            operation_time: formatTimestamp(Date.now()),
        },
        {
            url: "https://git.w2w.me:6443",
            user: "abc1234",
            password: "123456",
            operation_time: formatTimestamp(Date.now()),
        },
        {
            url: "https://git.w2w.me:6443",
            user: "abc1235",
            password: "123456",
            operation_time: formatTimestamp(Date.now()),
        },
        {
            url: "https://git.w2w.me:6443",
            user: "abc1236",
            password: "123456",
            operation_time: formatTimestamp(Date.now()),
        },
        {
            url: "https://git.w2w.me:6443",
            user: "abc1237",
            password: "123456",
            operation_time: formatTimestamp(Date.now()),
        },
    ]);

    /**
     * 仓库输入数据
     */
    let input_repository_data = $state({
        url: "",
        user: "",
        password: "",
    });

    /**
     * 编辑区域左侧边栏折叠状态
     * @type {boolean}
    */
    let is_edit_area_left_sidebar_folded = $state(false);

    /**
     * 编辑区域右侧边栏折叠状态
     * @type {boolean}
    */
    let is_edit_area_right_sidebar_folded = $state(false);

    /**
     * 当前选中的仓库Url#User数据
     * @type {{
     *      id: string,
     *      url: string,
     *      user: string,
     *      password: string,
     *      operation_time: string,
     * }}
    */
    let current_selected = $state({
        id: getRepositoryUrlUser(repository_data[0]),
        ...repository_data[0],
    });

    /**
     * 是否直接连接仓库
     * @type {boolean}
     */
    let is_immediately_connect = $state(true);

    onMount(() => {
        
    })

    function handleQuitEdit(){

    }

    /**
     * 获取仓库Url和用户组合字符串,用于判断是否重复添加
     * 组合格式: url#user
     * @param {RepositoryData} item - 仓库数据
     * @returns {string}
     */
    function getRepositoryUrlUser(item){
        return `${item.url}#${item.user}`;
    }

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
<div class="bank-container">

    <div class="bank-edit-content">

        <div class="bank-name">

            <img src="/programming_question_bank/icons/edit_square.svg" alt="编辑" />
            
            <input class="bank-name-input" bind:value={bank_data.name} />
            
            {#if bank_data.name.length > 0}
                <button class="clear-input-bottom"
                    onmousedown={(e) => {e.preventDefault()}}
                    onclick={() => {
                        bank_data.name = '';
                    }}
                >
                    <span>⨉</span>
                </button>
            {/if}
           
        </div>

        <div class="bank-tags-list-container">
            
            <img  src="/programming_question_bank/icons/tag.svg" alt="标签"/>
            
            <!-- 题库标签列表 -->
            <div class="bank-tags-list">
                    
                <div class="bank-tags-item">
                    <EditableTag
                        bind:content={add_tag_input}
                        handle_funcs={{
                            onchange: (old_content, new_content) => {
                                add_tag_input = '';

                                if(new_content.length > 0) {
                                    bank_data.tags.push(new_content);
                                }

                            },
                            delete: () => {
                                add_tag_input = '';
                            },
                        }}
                    />
                </div>

                {#each bank_data?.tags ?? [] as tag, index}
                    <div class="bank-tags-item">
                        <EditableTag content={tag} handle_funcs={{
                            delete: () => {
                                bank_data.tags.splice(index, 1);
                            },
                        }} />
                    </div>
                {/each}
            </div>

        </div>

        <div class="bank-repository-list-container">

            <button class="bank-repository-list-fold-btn"
                onclick={() => {
                    is_fold_repository_list = !is_fold_repository_list;
                }}
                title={is_fold_repository_list ? "展开" : "收起"}
            >
                <img src="/programming_question_bank/icons/{is_fold_repository_list ? "arrow_down" : "arrow_up"}.svg" alt="展开/收起" />
                <span>仓库配置</span>
            </button>

            {#if !is_fold_repository_list}
                <div class="bank-repository-list"
                    transition:slide={{ duration: 150 }}
                >
                    <table class="bank-repository-list-table">

                        <thead>
                            <tr>
                                <th class="repository-url">仓库地址</th>
                                <th class="repository-user">仓库用户</th>
                                <th class="repository-password">仓库用户密码</th>
                                <th class="repository-operation">操作</th>
                                <th class="repository-operation-time">操作时间</th>
                            </tr>
                        </thead>

                        <tbody>

                            {#snippet operationBtns(/**@type {RepositoryData} */ item)}
                                <div class="repository-operation-btns">
                                    <button
                                        class="repository-select-btn"
                                        onclick={() => {
                                            current_selected = {
                                                id: getRepositoryUrlUser(item),
                                                ...item,
                                            };
                                        }}
                                    >
                                        <img src="/programming_question_bank/icons/select_check_box.svg" alt="选中"/>
                                        <span>选中仓库</span>
                                    </button>

                                    <button
                                        class="repository-verify-btn"
                                        onclick={() => {
                                            console.log("验证仓库:", $state.snapshot(item));
                                        }}
                                    >
                                        <img src="/programming_question_bank/icons/refresh.svg" alt="验证"/>
                                        <span>验证仓库</span>
                                    </button>

                                    <button
                                        class="repository-delete-btn"
                                        onclick={() => {
                                            console.log("删除仓库:", $state.snapshot(item));
                                        }}
                                    >
                                        <img src="/programming_question_bank/icons/delete_red.svg" alt="删除"/>
                                        <span>删除仓库</span>
                                    </button>
                                </div>
                            {/snippet}

                            <!-- 新增仓库输入行 -->
                            <tr class="repository-input-row">
                                <td>
                                    <div style="
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        height: 100%;
                                        width:12px;
                                        border-radius: 5px 0 0 5px;
                                        background-color:#7490ff;">
                                        <img src="/programming_question_bank/icons/add.svg" alt="添加"/>
                                    </div>
                                    <input type="url" class="url-input" placeholder="请输入仓库地址" bind:value={input_repository_data.url} />
                                </td>
                                <td>
                                    <input type="text" class="user-input" placeholder="请输入仓库用户" bind:value={input_repository_data.user} />
                                </td>
                                <td>
                                    <input type="password" class="password-input" placeholder="请输入仓库用户密码" bind:value={input_repository_data.password} />
                                </td>
                                <td>
                                    <div class="repository-operation-btns">
                                        <button
                                            onclick={() => {
                                                
                                            }}
                                        >
                                            <img src="/programming_question_bank/icons/square_add.svg" alt="选中"/>
                                            <span>添加仓库</span>
                                        </button>

                                        <label class="immediately-connect-checkbox">
                                            <input  type="checkbox" bind:checked={is_immediately_connect} />
                                            <div class="checkmark">
                                                <img src="/programming_question_bank/icons/square_check.svg" alt="选中"/>
                                            </div>
                                            <span>立即连接</span>
                                        </label>

                                    </div>
                                </td>
                                <td>
                                    <span>YYYY-MM-DD HH:MM</span>
                                </td>
                            </tr>

                            {#each repository_data as item,index}
                                <tr class="repository-item-row">
                                    <td>
                                        <button class="repository-select-btn-before-input" 
                                            class:selected={current_selected.id == getRepositoryUrlUser(item)}
                                            onclick={() => {
                                                current_selected = {
                                                    id: getRepositoryUrlUser(item),
                                                    ...item,
                                                };
                                            }}
                                        >
                                            <img src="/programming_question_bank/icons/check.svg" alt="选中"/>
                                        </button>
                                        <input type="url" class="url-input" bind:value={item.url} placeholder="请输入仓库地址" />
                                    </td>
                                    <td>
                                        <input type="text" class="user-input" bind:value={item.user} placeholder="请输入仓库用户" />
                                    </td>
                                    <td>
                                        <input type="password" class="password-input" bind:value={item.password} placeholder="请输入仓库用户密码" />
                                    </td>
                                    <td>
                                        {@render operationBtns(item)}
                                    </td>
                                    <td>{item.operation_time}</td>
                                </tr>
                            {/each}
                        </tbody>
                        

                    </table>
                </div>
            {/if}

        </div>

        <div class="bank-question-setup-container">
            <button class="bank-question-setup-content-fold-btn"
                onclick={() => {
                    is_fold_question_setup = !is_fold_question_setup;
                }}
                title={is_fold_question_setup ? "展开" : "收起"}
            >
                <img src="/programming_question_bank/icons/{is_fold_question_setup ? "arrow_down" : "arrow_up"}.svg" alt="展开/收起" />
                <span>题库配置</span>
            </button>

            {#if !is_fold_question_setup}
                <div class="bank-question-setup-content"
                    transition:slide={{ duration: 150 }}
                >
                    <div class="main-content" class:fullscreen={is_question_setup_fullscreen}>

                        <!-- 顶部栏 -->
                        <div class="top-bar">
                            <button class="open-in-full-btn"
                                title={is_question_setup_fullscreen ? "退出全屏" : "全屏"}
                                onmousedown={(e) => {e.preventDefault()}}
                                onclick={() => {
                                    is_question_setup_fullscreen = !is_question_setup_fullscreen;
                                }}
                            >
                                <img src="/programming_question_bank/icons/{ is_question_setup_fullscreen ? "close_fullscreen.svg" : "open_fullscreen.svg" }"  alt="全屏"/>
                            </button>

                            <div class="bar-title">
                                <img src="/programming_question_bank/icons/eye.svg"  alt="预览"/>
                                <span>文件预览</span>
                            </div>

                            <div class="save-tool-bar">
                                <button class="save-btn">保存</button>
                            </div>

                        </div> 

                        <!-- 操作区 -->
                        <div class="edit-area-container">

                            <!-- 左侧边栏: 仓库文件目录 -->
                            <div class="left-sidebar">

                                <div class="left-sidebar-content"
                                    class:folded={is_edit_area_left_sidebar_folded}
                                >
                                    <div class="left-sidebar-title">
                                        <span>仓库文件目录</span>
                                    </div>

                                    <div class="repository-operation-bar">
                                        <button class="fetch-btn">
                                            <img src="/programming_question_bank/icons/refresh_thin.svg" alt="刷新"/>
                                            <span>fetch</span>
                                        </button>
                                    </div>

                                    <div class="repository-tag-select-container">
                                        <div class="current-selected-repository">
                                            <span>当前仓库:</span>
                                            <span></span>
                                        </div>
                                    </div>

                                </div>

                                <button class="left-sidebar-fold-btn" class:folded={is_edit_area_left_sidebar_folded}
                                    onclick={() => {
                                        is_edit_area_left_sidebar_folded = !is_edit_area_left_sidebar_folded;
                                    }}
                                >
                                    <span>{is_edit_area_left_sidebar_folded ? "≫" : "−"}</span>
                                </button>

                            </div>

                            <!-- 文件预览区 -->
                            <div class="file-preview-content">
                                
                            </div>

                            <!-- 右侧边栏: 题目目录 -->
                            <div class="right-sidebar">
                                <div class="right-sidebar-content"
                                    class:folded={is_edit_area_right_sidebar_folded}
                                >

                                    <div class="right-sidebar-title">
                                        <span>题目目录</span>
                                    </div>

                                </div>

                                <button class="right-sidebar-fold-btn" class:folded={is_edit_area_right_sidebar_folded}
                                    onclick={() => {
                                        is_edit_area_right_sidebar_folded = !is_edit_area_right_sidebar_folded;
                                    }}
                                >
                                    <span>{is_edit_area_right_sidebar_folded ? "≫" : "−"}</span>
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            {/if}

        </div>

    </div>

    <button class="quit-edit-btn" style="display: {is_question_setup_fullscreen ? 'none' : ''};"
        onclick={() => {
            handleQuitEdit();
        }}
    >   
        <img src="/programming_question_bank/icons/back.svg" alt="返回" />
        <span>退出编辑</span>
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

.bank-container {
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;

    .quit-edit-btn {
        position: absolute;
        display: flex;
        top: 0;
        left: 0;
        justify-content: center;
        align-items: center;
        font-size: 18px;
        box-sizing: border-box;
        font-family: 'Arial', sans-serif;
        color: #bdbdbd;
        border: none;
        padding: 4px 8px 4px 8px;
        margin: 2px;
        border-radius: 6px;
        background-color: #ffffff;
        cursor: pointer;

        img {
            width:18px;
            height:18px;
            margin:2px;
        }

        &:hover {
            color: #ffffff;
            box-sizing: border-box;
            background-color: #8e97b8;

            img {
                filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(142deg) brightness(100%) contrast(100%);
            }
        }
    }

    .bank-edit-content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 99%;
        height: 100%;
        overflow-y: auto;

        .bank-name {
            position: sticky;
            display: flex;
            justify-content: center;
            align-items: center;
            top:15px;
            width: max-content;
            height: max-content;
            margin: 10px 0 10px 0;

            img {
                position: absolute;
                left: 0;
                width: 24px;
                height: 24px;
                margin: 2px;
            }

            .bank-name-input {
                width: 400px;
                border: none;
                padding: 2px 2px 2px 2px;
                border-bottom: 3px solid #718ffa;
                background-color: rgba(255, 255, 255, 0);
                box-sizing: border-box;
                font-size: 24px;
                font-family: 'PingFang SC ', 'PingFang SC', sans-serif;
                color: #000000;
                text-align: center;
                padding: 0px 24px 0px 24px;
                &:focus {
                    outline: none;
                    border-bottom: 3px solid #0336ff;
                }
            }

            .clear-input-bottom {
                position: absolute;
                display: flex;
                justify-content: center;
                align-items: center;
                width: 20px;
                height: 20px;
                right: 1%;
                border: none;
                border-radius: 3px;
                background-color: transparent;
                cursor: pointer;
                &:hover {
                    background-color: #45454524;
                }
            }

        }

        
        .bank-tags-list-container {
            position: sticky;
            top:55px;
            display: flex;
            width: 100%;
            height: 40px;
            min-height: 40px;
            border-radius: 10px 10px 3px 3px;
            background-color: #e9e9e9;
            box-sizing: border-box;
            padding: 2px 10px 2px 10px;
            overflow-x: auto;
            scrollbar-width: none;
            scrollbar-color: #d0d0d0 transparent;
            margin: 10px 0 10px 0;
            img {
                position: sticky;
                left: 0;
                width: 20px;
                margin: 0 6px 0 6px;
            }

            .bank-tags-list {
                position: relative;
                display: flex;
                height: 100%;
                justify-content: flex-start;
                align-items: center;
                
            }

            &:hover {
                scrollbar-width: thin;
            }

        }

        .bank-repository-list-container, .bank-question-setup-container {
            position: sticky;
            display: flex;
            top: 105px;
            flex-direction: column;
            width: 100%;
            height: max-content;
            border-radius: 10px 10px 0 0;
            background-color: transparent;
            box-sizing: border-box;
            margin: 10px 0 10px 0;

        }

        .bank-repository-list-fold-btn, .bank-question-setup-content-fold-btn {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            width: 100%;
            height: 40px;
            border: none;
            border-radius: 10px 10px 3px 3px;
            background-color: #e9e9e9;
            box-sizing: border-box;
            padding: 2px 10px 2px 10px;
            font-family: 'Arial', sans-serif;
            font-size: 16px;
            color: #9c9a9a;
            cursor: pointer;
            &:hover {
                background-color: #dbdbdb;
            }

            img {
                position: relative;
                width: 20px;
                margin: 0 6px 0 6px;
            }

            span {
                padding: 0 6px 0 6px;
            }

        }

        .bank-repository-list, .bank-question-setup-content {
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            width: 100%;
            height: 260px;
            border-radius: 0 0 5px 5px;
            background-color: #f2f2f2;
            box-sizing: border-box;
            padding: 0 0 8px 0;
        }

        .bank-repository-list-table {
            position: relative;
            display: flex;
            flex-direction: column;
            width: 100%;
            height:100%;
            justify-content: flex-start;
            align-items: flex-start;

            thead, tbody {
                position: relative;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                width: 100%;
                height: 42px;

                tr {
                    position:relative;
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    width: 100%;
                    height: 42px;
                    min-height: 42px;
                    border-radius: 0 0 5px 5px;
                    background-color: #f2f2f2;
                    box-sizing: border-box;
                    margin: 2px 0 2px 0;
                }

                
            }

            thead {
                th {
                    display:flex;
                    width: 100%;
                    color:#868686;
                    padding: 2px 2px 2px 2px;
                    background-color: #f6f6f6;
                    box-sizing: border-box;
                    font-family: 'ArialMT', 'Arial', sans-serif;
                    font-size: 18px;
                    color: #868686;
                    text-align: left;
                    font-weight: 500;
                }
            }

            tbody {
                overflow-y: auto;
                height: 100%;

                td {
                    display:flex;
                    width: 100%;
                    color:#868686;
                    padding: 2px 2px 2px 2px;
                    background-color: #f6f6f6;
                    box-sizing: border-box;
                    font-family: 'ArialMT', 'Arial', sans-serif;
                    font-size: 18px;
                    color: #868686;
                    text-align: left;
                    font-weight: 500;
                }

                .repository-input-row {
                    position: sticky;
                    top: 0;
                    z-index: 2;
                }

                .repository-item-row {
                    top: 0;

                    input {
                        height: 100%;
                    }

                    td {
                        .repository-select-btn-before-input {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100%;
                            width:12px;
                            border-radius: 5px 0 0 5px;
                            background-color:#bcebdc;
                            border: none;
                            cursor: pointer;
                            &:hover {
                                background-color: #48c79c;
                            }
                            
                            &.selected{
                                background-color: #10c58f;
                            }
                        }
                    }
                }

                .repository-input-row, .repository-item-row {
                    td {
                        height: 100%;
                    }

                    .url-input {
                        color: #4267ff;
                    }

                    input {
                        width: 90%;
                        height: 100%;
                        padding: 0;
                        border: none;
                        background-color: transparent;
                        box-sizing: border-box;
                        font-size:16px;
                        font-family: 'PingFangSC-Regular', 'PingFang SC', sans-serif;
                        color:#6e6e6e;
                        padding: 0 2px 0 2px;
                        &:hover {
                            font-weight: 600;
                            border-bottom: 2px solid #7e8fd4;
                        }

                        &:focus {
                            outline: none;
                            font-weight: 600;
                            border-bottom: 2px solid #7e8fd4;
                        }

                        
                    }
                }

                .repository-operation-btns {
                    display: flex;
                    justify-content: flex-start;
                    align-items: center;
                    width: 100%;
                    button {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        border: none;
                        font-size: 13px;
                        cursor: pointer;

                        img {
                            width: 20px;
                            margin: 0 2px 0 2px;
                        }

                        span {
                            padding: 0 2px 0 2px;
                            opacity: 0;
                            color: #5d5c5c;
                        }

                        &:hover {
                            span {
                                opacity: 1;
                            }
                        }

                        
                    }

                    .immediately-connect-checkbox {
                        display: flex;
                        justify-content: flex-start;
                        align-items: center;
                        height: 20px;
                        padding: 0 6px 0 6px;
                        cursor: pointer;

                        input {
                            opacity: 0;
                            cursor: pointer;
                            height: 0;
                            width: 0;
                            margin: 0;
                            padding: 0;
                        }

                        .checkmark {
                            display: flex;
                            justify-content: center;
                            align-items: center;    
                            height: 18px;
                            width: 18px;
                            background-color: transparent;
                            border: 2px solid #6f83e9;
                            border-radius: 4px;
                            transition: all 0.2s ease-in-out;

                            img {
                                width: 20px;
                                height: 20px;
                                opacity: 0;
                                transition: all 0.2s ease-in-out;
                            }
                        }

                        /* 选中状态样式 */
                        input:checked ~ .checkmark {
                            img {
                                opacity: 1;
                            }
                        }

                        span {
                            opacity: 0;
                            font-size: 13px;
                            padding: 0 2px 0 2px;
                            color: #5d5c5c;
                        }

                        &:hover {
                            span {
                                opacity: 1;
                            }
                        }

                    }

                    .repository-select-btn span {
                        color: #3acb97;
                    }

                    .repository-verify-btn span {
                        color: #6884e6;
                    }

                    .repository-delete-btn span {
                        color: #ee6262;
                    }


                }
            }
        }

        .bank-question-setup-content {
            position: sticky;
            height: 100vh;
            max-height: 100vh;
            padding: 0;

            .main-content {
                position: sticky;
                top: 2px;
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 98%;
                max-height: 100%;
                transition: all 0.1s ease-in-out;
                overflow-x: hidden;

                &.fullscreen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: #f2f2f2;
                    z-index: 15;
                }

                .top-bar {
                    position: relative;
                    display: flex;
                    background-color: #ebebeb;
                    width: 100%;
                    height: 40px;
                    justify-content: center;
                    align-items: center;
                    padding: 0 10px 0 10px;
                    box-sizing: border-box;

                    .open-in-full-btn {
                        position: absolute;
                        left: 10px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        border: none;
                        width: 32px;
                        height: 32px;
                        padding: 5px;
                        border-radius: 5px;
                        background-color: #e9e9e9;
                        box-sizing: border-box;
                        cursor: pointer;

                        img {
                            width:20px;
                        }

                        &:hover {
                            background-color: #d0d0d0;
                        }
                    }

                    .bar-title {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        height: 100%;
                        font-family: 'Arial', sans-serif;
                        font-size: 18px;
                        color: #333333;
                        box-sizing: border-box;
                        img, span {
                            padding: 0 3px 0 3px;
                            text-align: center;
                        }

                    }

                    .save-tool-bar {
                        position: absolute;
                        right: 10px;
                        display: flex;
                        justify-content: center;
                        align-items: center;

                    }

                }

                .edit-area-container {
                    position: relative;
                    display: flex;
                    width: 100%;
                    min-width: max-content;
                    height: 100%;
                    box-sizing: border-box;

                    .left-sidebar, .right-sidebar {
                        position: relative;
                        display: block;
                        flex-direction: column;
                        align-items: center;
                        width: max-content;
                        height: 100%;
                        transition: all 0.3s ease-in-out;
                    }

                    .left-sidebar {
                        .left-sidebar-fold-btn {
                            right: 5px;

                            &.folded {
                                top: 25px;
                                right: -45px;
                                width: 45px;
                                border-radius: 0 15px 15px 0;
                                background-color: #7490ff;
                                color: #ffffff;
                                font-size: 15px;
                                justify-content: flex-end;
                                padding: 10px;
                                span {
                                    right:0;
                                    font-weight: 600;
                                }
                            }

                        }
                    }

                    .right-sidebar {
                        .right-sidebar-fold-btn {
                            left: 5px;
                            &.folded {
                                top: 25px;
                                left: -45px;
                                width: 45px;
                                border-radius: 0 15px 15px 0;
                                background-color: #7490ff;
                                color: #ffffff;
                                font-size: 15px;
                                justify-content: flex-end;
                                padding: 10px;
                                transform: rotateY(180deg);

                                span {
                                    left:0;
                                    font-weight: 600;
                                }
                            }
                        }
                    }

                    .left-sidebar-fold-btn, .right-sidebar-fold-btn {
                        position: absolute;
                        top: 5px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 25px;
                        height: 25px;
                        border: none;
                        background-color: #ffffff;
                        font-size: 25px;
                        border-radius: 5px;
                        box-sizing: border-box;
                        cursor: pointer;
                        z-index:1;

                        &:hover {
                            background-color: #d0d0d0;
                        }

                    }

                    .left-sidebar-content, .right-sidebar-content {
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        justify-content: flex-start;
                        align-items: center;
                        width: 255px;
                        min-width: 255px;
                        height: 100%;
                        overflow: hidden;
                        transition: all 0.3s ease-in-out;
                        text-overflow: nowrap;
                        &.folded {
                            width: 0;
                            min-width:0;
                        }

                    }

                    .left-sidebar-content {
                        .repository-operation-bar {
                            display: flex;
                            justify-content: flex-end;
                            align-items: center;
                            width: 95%;
                            height: 30px;
                            background-color: #e2e2e2;

                            
                            button {
                                position: relative;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                right: 5px;
                                width: 50x;
                                height: 20px;
                                border-radius: 3px;
                                border: 1px solid #0052d9;
                                color: #0052d9;
                                background-color: #fff;
                                font-size: 15px;

                                img {
                                    width: 15px;
                                    height: 15px;
                                    margin: 0 2px 0 2px;
                                }
                            }
                        }
                    }

                    .left-sidebar-title, .right-sidebar-title {
                        position: relative;
                        display: flex;
                        width: max-content;
                        justify-content: center;
                        align-items: center;
                        padding: 2px 2px 2px 2px;
                        background-color: #f1f1f1;
                        box-sizing: border-box;
                        font-family: 'ArialMT', 'Arial', sans-serif;
                        color: #333333;
                        text-align: center;
                        font-size: 20px;
                        overflow: hidden;
                        text-overflow: nowrap;

                        span {
                            width: 100%;
                            text-overflow: nowrap;
                        }
                    }

                    .file-preview-content {
                        position: relative;
                        display: block;
                        flex-direction: column;
                        justify-content: flex-start;
                        align-items: center;
                        width: 100%;
                        height: 100%;
                        background-color: #f7fafd;
                    }
                }

            }
            
        }


    }

    
}

</style>