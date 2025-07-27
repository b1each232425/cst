<script>
    import Button from "$lib/components/Button/Button.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";

    let dropUpToggleIsOpen = $state(false);
    let filterIsOpen = $state(false);

</script>

<!-- 遮罩 -->
<div class="modal-overlay">
    <!-- 弹窗 -->
    <div class="modal-container">
        <!-- 头部 -->
        <div class="container-header">
            <span class="title">从题库导入题目</span>
            <button>✖</button>
        </div>

        <!-- 内容区 -->
        <div class="container-body">
            <!-- 左侧区域 -->
            <div class="body-left">
                <!-- 标题 -->
                <div class="title-box">
                    <span class="title">题库列表</span>
                </div>

                <!-- 搜索 -->
                <div class="search-box">
                    <InputBox placeholder="搜索题库" showLabel={false}/>
                    <div class="selected-banks-box">
                        <span class="selected-banks">已选择 <span>0</span> 个题库</span>
                    </div>
                </div>

                <!-- 题库列表 -->
                <div class="question-bank-list">
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>

                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                    <div class="single-bank">
                        <input type="checkbox">
                        <span class="bank-name">软件工程基础题库</span>
                        <span class="questions-number">11</span>
                    </div>
                </div>
            </div>

            <!-- 右侧区域 -->
            <div class="body-right">
                <!-- 上半区 -->
                <div class="top-area">
                    <div class="input-box">
                        <InputBox placeholder="搜索题目内容" showLabel={false}/>
                    </div>

                    <!-- 下拉筛选栏 -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="filter-header" onclick={filterIsOpen=!filterIsOpen}>
                        <span class="filter-prompt">筛选</span>
                        <button class="dropdown-btn">{filterIsOpen?"∨":"∧"}</button>
                    </div>

                    <!-- 筛选菜单 -->
                    {#if filterIsOpen}
                        <div class="filter-container">
                            <!-- 题型 & 难度 -->
                            <div class="type-level">
                                <span class="prompt">题型：</span>
                                <button>单选题</button>
                                <button>多选题</button>
                                <button>判断题</button>
                                <button>填空题</button>
                                <button>简答题</button>
                                <button>编程题</button>
                                <span class="prompt">难度：</span>
                                <button>简单</button>
                                <button>中等</button>
                                <button>困难</button>
                            </div>

                            <!-- 标签 -->
                            <div class="question-tags">
                                <span class="level-prompt">标签：</span>
                                <div class="tags-box">
                                    <button>测试</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>
                                    <button>常识</button>

                                </div>
                            </div>

                            <!-- 清空条件 -->
                            <div class="clear-condition">
                                <button>清空条件</button>
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- 下半区 -->
                <div class="bottom-area">

                </div>
            </div>
        </div>

        <!-- 底部 -->
        <div class="container-footer">
            <span class="selected-span">已选择 <span>2</span> 道题目</span>
            <span class="import-span">导入到题组：</span>
            <div class="dropup-toggle" onmouseenter={dropUpToggleIsOpen=true} onmouseleave={dropUpToggleIsOpen=false}>
                {#if dropUpToggleIsOpen}
                    <div class="dropup-menu">
                        <div class="menu-option selected">
                            <span>
                                一、单选题（共0题，共0分）
                            </span>
                        </div>
                        <div class="menu-option">
                            <span>
                                二、多选题（共0题，共0分）
                            </span>
                        </div>
                        <div class="menu-option">
                            <span>
                                三、判断题（共0题，共0分）
                            </span>
                        </div>
                        <div class="menu-option">
                            <span>
                                四、填空题（共0题，共0分）
                            </span>
                        </div>
                        <div class="menu-option">
                            <span>
                                五、多选题（共0题，共0分）
                            </span>
                        </div>
                    </div>  
                {/if}
                <span class="selected-group">一、单选题（共0题，共0分）</span>
                <button class="toggle-btn">∨</button>
            </div>
            <div class="btn-box">
                <Button plain={true}>取消</Button>
                <Button>确认导入</Button>
            </div>
        </div>
    </div>
</div>

<style>

    /* 遮罩 */
    .modal-overlay {
        font-family: 'Noto Sans SC', sans-serif;
        color: var(--text-primary);

        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;

        /* 弹窗 */
        .modal-container {
            height: 90vh;
            max-height: 90vh;
            width: 85vw;
            max-width: 85vw;
            background-color: #fff;
            border-radius: var(--border-radius-md);
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

            /* 头部 */
            .container-header {
                padding: 16px 24px;
                border-bottom: 1px solid var(--border-light);
                display: flex;
                justify-content: space-between;

                span {
                    font-size: 20px;
                    font-weight: bold;
                }

                button {
                    background: none;
                    border: none;
                    font-weight: bold;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    font-size: 16px;

                    &:hover {
                        color: var(--primary-color);
                    }
                }
            }

            /* 内容区 */
            .container-body {
                padding: 16px;
                display: flex;
                flex-grow: 1;
                /* background-color: var(--bg-primary); */
                max-height: calc(90vh - 162px);
                gap: 16px;

                /* 左侧区域 */
                .body-left {
                    width: 280px;
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius-sm);
                    display: flex;
                    flex-direction: column;

                    /* 标题 */
                    .title-box {
                        padding: 12px 16px 24px 16px;
                        border-bottom: 1px solid var(--border-light);

                        .title {
                            font-size: 20px;
                            font-weight: bold;
                        }
                    }

                    /* 搜索 */
                    .search-box {
                        display: flex;
                        flex-direction: column;
                        padding: 12px 16px;
                        background-color: var(--bg-primary);
                        gap: 8px;
                        border-bottom: 1px solid var(--border-light);

                        .selected-banks-box {
                            display: flex;
                            justify-content: right;

                            .selected-banks {
                                font-size: 14px;
                                
                                span {
                                    color: #1890ff;
                                    font-weight: bold;
                                }
                            }
                        }
                    }

                    /* 题库列表 */
                    .question-bank-list {
                        padding: 12px 16px;
                        font-weight: 500;
                        display: flex;
                        flex-direction: column;
                        overflow-y: auto;
                        flex-grow: 1;
                        
                        /* 单个题库 */
                        .single-bank {
                            display: flex;
                            padding: 8px 12px;
                            border-radius: var(--border-radius-sm);
                            cursor: pointer;

                            &:hover {
                                background-color: var(--bg-secondary);
                            }

                            /* 勾选框 */
                            input {
                                width: 16px;
                                height: 16px;
                                cursor: pointer;
                                accent-color: var(--primary-color);
                                position: relative;  /* 使其可相对定位 */
                                top: 1.5px;  /* 向下移动 3px */
                            }
    
                            /* 题库名称 */
                            .bank-name {
                                margin-left: 8px;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                                width: 175px;
                            }
    
                            /* 题目数量 */
                            .questions-number {
    
                            }
                        }

                    }
                }

                /* 右侧区域 */
                .body-right {
                    display: flex;
                    flex-direction: column;
                    flex-grow: 1;
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius-sm);

                    /* 上半区 */
                    .top-area {
                        padding: 12px 16px;
                        border-bottom: 1px solid var(--border-light);

                        .input-box{ background-color: rgb(249, 249, 249); }

                        /* 下拉筛选栏 */
                        .filter-header {
                            display: flex;
                            justify-content: space-between;
                            padding: 12px 16px;
                            cursor: pointer;
                            background-color: rgb(249, 249, 249);

                            .filter-prompt {
                                font-weight: 1000;
                            }

                            .dropdown-btn {
                                transform: scaleX(1.8);
                                background: none;
                                border: none;
                                padding: 2px 0 0 0;
                                height: 30px;
                                cursor: pointer;
                                font-size: 10px;
                                font-weight: 1000;
                            }
                        }

                        /* 筛选菜单 */
                        .filter-container {
                            display: flex;
                            flex-direction: column;
                            gap: 12px;
                            padding: 0 16px 12px;
                            background-color: rgb(249, 249, 249);
                            border-radius: 0 0 var(--border-radius-sm) var(--border-radius-sm);

                            .prompt { font-size: 12px; font-weight: 500;}

                            button {
                                padding: 2px 8px;
                                background-color: #f5f5f5;
                                border: 1px solid #d9d9d9;
                                border-radius: var(--btn-border-radius);
                                font-size: 12px;
                                cursor: pointer;

                                &:hover {
                                    border-color: #40a9ff;
                                    transition: all 0.3;
                                }
                            }

                            /* 题型 & 难度 */
                            .type-level {
                                display: flex;
                                flex-wrap: wrap;
                                gap: 8px;
                                align-items: center;
                            }

                            /* 标签 */
                            .question-tags {
                                display: flex;

                                .level-prompt {
                                    font-size: 12px;
                                    font-weight: 500;
                                    margin-right: 8px;
                                    width: 75px;
                                }

                                .tags-box {
                                    display: flex;
                                    flex-wrap: wrap;
                                    gap: 8px;
                                    flex-grow: 1;
                                    overflow-y: auto;
                                    max-height: 54px;
                                }
                            }

                            /* 清空条件 */
                            .clear-condition {
                                display: flex;
                                justify-content: right;
                            }
                        }
                    }

                    /* 下半区 */
                    .bottom-area {
                        flex-grow: 1;
                    }
                }
            }

            /* 底部 */
            .container-footer {
                padding: 16px 24px;
                border-top: 1px solid var(--border-light);
                display: flex;
                justify-content: right;
                align-items: center;

                /* 已选题目 */
                .selected-span {
                    font-weight: 500;

                    span {
                        color: var(--primary-color);
                    }
                }

                /* 导入 */
                .import-span {
                    font-size: 14px;
                    color: var(--text-primary);
                    margin-left: 2vw;
                }

                /* 上拉栏 */
                .dropup-toggle {
                    display: flex;
                    align-items: center;
                    padding: 2px 0x;
                    border: 1px solid var(--border-light);
                    border-radius: var(--input-border-radius);
                    background: var(--bg-primary);
                    cursor: pointer;
                    justify-content: space-between;
                    width: 299px;
                    position: relative;
                    
                    &:hover {
                        transition: all 0.3s ease;
                        border-color: #1890ff;
                        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                            
                        .selected-group, .toggle-btn {
                            color: #1890ff;
                            transition: all 0.3s ease;
                        }

                         .toggle-btn {
                            transform: scaleX(1.8) rotate(180deg);
                            transition: none;
                        }
                    }

                    /* 文本 */
                    .selected-group {
                        font-size: 14px;
                        font-weight: 500;
                        padding-left: 12px;
                    }

                    /* 上拉符 */
                    .toggle-btn {
                        transform: scaleX(1.8);
                        background: none;
                        /* background-color: red; */
                        border: none;
                        padding: 2px 0 0 0;
                        margin-right: 12px;
                        height: 30px;
                        cursor: pointer;
                        font-size: 10px;
                        font-weight: 1000;
                    }

                    /* 上拉菜单 */
                    .dropup-menu {
                        position: absolute;
                        background-color: var(--bg-primary);
                        bottom: 100%;
                        width: 100%;
                        border: 1px solid var(--border-light);
                        border-bottom: none;
                        border-radius: var(--input-border-radius);
                        padding: 6px 0;
                        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
                        max-height: 200px;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                        gap: 3px;
                        margin-bottom: 1.5px;
                        margin-left: -1px;

                        /* 单项 */
                        .menu-option {
                            padding: 6px 12px;

                            &:hover {
                                background-color: #e6f7ff;
                            }

                            span {
                                font-size: 14px;
                                font-weight: 500;
                            }
                        }

                        /* 选中状态 */
                        .selected {
                            background-color: #ecf2fe;
                            
                            span {
                                font-weight: 600;
                            }
                        }
                    }
                }

                /* 按钮 */
                .btn-box {
                    display: flex;
                    gap: 8px;
                    margin-left: 2vw;
                }
            }
        }
    
    }

</style>