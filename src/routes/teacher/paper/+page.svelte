<!--
 * @Author: WangKaidun 1597225095@qq.com
 * @Date: 2025-08-01 15:21:42
 * @LastEditors: WangKaidun 1597225095@qq.com
 * @LastEditTime: 2025-08-14 17:17:04
 * @FilePath: \exam\src\routes\teacher\paper\+page.svelte
 * @Description: 试卷列表页面
 * @Copyright (c) 2025 by WangKaidun 1597225095@qq.com, All Rights Reserved. 
-->
<script>
    // @ts-nocheck

    import Title from "$lib/components/Title/Title.svelte";
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import Tag from "$lib/components/Tag/Tag.svelte";
    import MessageBox from "$lib/components/MessageBox/MessageBox";
    import Empty from "$lib/components/Table/Empty.svelte";
    import UneditableTag from "$lib/components/Tag/UneditableTag.svelte";
    import "$lib/components/Button/index.scss"
    import "$lib/components/Input/index.scss"
    import { LEVEL_TRANS, CATEGORY_TRANS, ASSEMBLY_TYPE_TRANS } from "./_utils/tool";
    import { goto } from "$app/navigation";
    import { debounce } from "$lib/utils/optimize";
    import { onMount } from "svelte";
    import { toast } from "$lib/components/Toast/Toast";
    import { ALL_PAPER_SELECTED, CURRENT_PAPER_ID, PAPER_PAGE, PAPER_PAGE_SIZE, SEARCH_PAPER_NAME, SEARCH_PAPER_TAGS, SELECTED_PAPER_IDS } from "./_stores/store";
    import { get } from "svelte/store";
    import { formatTimestamp } from "$lib/utils/time_utils";
    
    /******************* API 区 ********************/

    // 自定义组卷
    function createEmptyPaper() {
        // 设置响应头
        const HEADERS = {
            "Content-Type": "application/json"
        };

        // 发起 POST 请求
        return fetch(`/api/paper/manual`, {
            method: "POST",
            headers: HEADERS,
            credentials: "include"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status !== 0) toast.error(data.msg, 1000);
                return data;
            })
            .catch(error => {
                console.error('自定义组卷出错：', error);
                return null;
            });
    }

    // 删除试卷
    function deletePaper(
        toDeletePapers = []
    ){
        const DATA = {
            data: toDeletePapers
        };

        const HEADERS = {
            "Content-Type": "application/json"
        };

        return fetch(`/api/paper`, {
            headers: HEADERS,
            method: "DELETE",
            credentials: "include",
            body: JSON.stringify(DATA)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status !== 0) toast.error(data.msg, 1000);
                return data;
            })
            .catch(error => {
                console.error('删除试卷出错：', error);
                return null;
            });
    }

    // 获取试卷列表
    function fetchPaperList(
        paperName = "", 
        paperTags = "", 
        paperPage = 1, 
        paperPageSize = 10, 
        paperCategory = ""
    ){
        const PARAMS = new URLSearchParams();

        if (paperName) PARAMS.append("name", paperName);
        if (paperTags) PARAMS.append("tags", paperTags);
        PARAMS.append("page", paperPage);
        PARAMS.append("pageSize", paperPageSize);
        if (paperCategory) PARAMS.append("category", paperCategory);

        return fetch(`/api/paper?${PARAMS.toString()}`, {
            method: "GET",
            credentials: "include"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status !== 0) toast.error(data.msg, 1000);
                return data;
            })
            .catch(error => {
                console.error('获取试卷列表出错：', error);
                return null;
            });
    }

    /******************* API 区 ********************/



    /*************** 列表基础功能区 ****************/

    let total_papers = $state(0);              // 试卷总数
    let paper_page_size_options = [10, 20]     // 每页条数选择项
    let paper_list = $state([]);               // 试卷列表
    
    // 选中数据
    function toggleSelection(ID, checked) {
        SELECTED_PAPER_IDS.update(current => {
            if (checked) {
                // 添加 ID（防止重复）
                if (!current.includes(ID)) {
                    return [...current, ID];
                }
                return current;
            } else {
                // 移除 ID
                return current.filter(item => item !== ID);
            }
        });

        checkAllSelected();
    }

    // 检查全选
    function checkAllSelected() {
        const SELECTED_IDS = get(SELECTED_PAPER_IDS);
        const ALL_SELECTED = paper_list.length !== 0 && paper_list.every(p =>
            SELECTED_IDS.includes(p.ID)
        );
        ALL_PAPER_SELECTED.set(ALL_SELECTED);
    }

    // 全选
    function selectedAll(checked) {
        const CURRENT_PAGE_IDS = paper_list.map(item => item.ID);

        SELECTED_PAPER_IDS.update(current => {
            if (checked) {
                const NOT_YET_SELECTED = CURRENT_PAGE_IDS.filter(ID => !current.includes(ID));
                return [...current, ...NOT_YET_SELECTED];
            } else {
                return current.filter(ID => !CURRENT_PAGE_IDS.includes(ID));
            }
        });

        checkAllSelected();
    }

    // 重置按钮
    function resetSearch() {
        SEARCH_PAPER_NAME.set("");
        SEARCH_PAPER_TAGS.set("");
        PAPER_PAGE.set(1);
        PAPER_PAGE_SIZE.set(10);
        SELECTED_PAPER_IDS.set([]);
        
        fetchPaperList(get(SEARCH_PAPER_NAME), get(SEARCH_PAPER_TAGS), get(PAPER_PAGE), get(PAPER_PAGE_SIZE), "")
        .then(result => {
            if (result) {
                total_papers = result.rowCount;
                paper_list = result.data || [];
            }
        });
    }

    // 处理页面跳转
    function handlePageChange(event) {
        PAPER_PAGE.set(event.detail);
        fetchPaperList(get(SEARCH_PAPER_NAME), get(SEARCH_PAPER_TAGS), get(PAPER_PAGE), get(PAPER_PAGE_SIZE), "")
            .then(result => {
                if (result) {
                    total_papers = result.rowCount;
                    paper_list = result.data || [];
                    checkAllSelected();
                }
            });
    }

    // 处理页面大小更改
    function handlePageSizeChange(event) {
        PAPER_PAGE_SIZE.set(event.detail);
        PAPER_PAGE.set(1);
        fetchPaperList(get(SEARCH_PAPER_NAME), get(SEARCH_PAPER_TAGS), get(PAPER_PAGE), get(PAPER_PAGE_SIZE), "")
            .then(result => {
                if (result) {
                    total_papers = result.rowCount;
                    paper_list = result.data || [];
                    checkAllSelected();
                }
            });
    }

    // 防抖搜索试卷
    const debouncedFetchPaperList = debounce(() => {
        fetchPaperList(get(SEARCH_PAPER_NAME), get(SEARCH_PAPER_TAGS), get(PAPER_PAGE), get(PAPER_PAGE_SIZE), "")
        .then(result => {
            if (result) {
                total_papers = result.rowCount;
                paper_list = result.data || [];
            }
        });
    }, 500, false);

    /*************** 列表基础功能区 ****************/



    /******************* 操作区 ********************/

    // 自定义组卷
    function manual() {
        createEmptyPaper().then( result => {
            if (result && result.data && result.data.paper && result.data.paper.ID) {
                CURRENT_PAPER_ID.set(result.data.paper.ID);
                goto('/teacher/paper/manual');
            } else {
                console.error('创建试卷失败：返回数据无效');
            }
        });
    }

    // 编辑试卷
    function editPaper(ID) {
        CURRENT_PAPER_ID.set(ID);
        goto('/teacher/paper/manual');
    }

    // 删除试卷
    function deleteSinglePaper(ID) {
        MessageBox({
            title: "删除确认",
            content: "请问是否要删除该试卷？",
            confirm_button_type: "danger",

            onConfirm: () => {
                deletePaper([ID])
                    .then(() => {
                        toast.success("删除成功", 1000);
                        fetchPaperList(get(SEARCH_PAPER_NAME), get(SEARCH_PAPER_TAGS), get(PAPER_PAGE), get(PAPER_PAGE_SIZE), "")
                            .then(result => {
                                if (result) {
                                    total_papers = result.rowCount;
                                    paper_list = result.data || [];
                                }
                            })
                    });
            }
        });
    }

    // 批量删除试卷
    function deleteMultiplePapers() {
        const SELECTED_IDS = get(SELECTED_PAPER_IDS);
        if(SELECTED_IDS.length === 0) {
            toast.error("请先选择试卷", 1000);
            return;
        }
        MessageBox({
            title: "删除确认",
            content: `请问是否要批量删除这 ${SELECTED_IDS.length} 张试卷？`,
            confirm_button_type: "danger",

            onConfirm: () => {
                deletePaper(SELECTED_IDS)
                    .then(() => {
                        toast.success("删除成功", 1000);
                         SELECTED_PAPER_IDS.update(current => current.filter(id => !SELECTED_IDS.includes(id)));
                        fetchPaperList(get(SEARCH_PAPER_NAME), get(SEARCH_PAPER_TAGS), get(PAPER_PAGE), get(PAPER_PAGE_SIZE), "")
                            .then(result => {
                                if (result) {
                                    total_papers = result.rowCount;
                                    paper_list = result.data || [];
                                }
                            })
                    });
            }
        });
    }

    // 预览试卷
    function previewPaper(ID, category) {
        const PARAMS = new URLSearchParams();

        PARAMS.append("paper_id", ID);
        PARAMS.append("mode", "preview");

        fetch(`/api/paper/manual?${PARAMS.toString()}`, {
            method: "GET",
            credentials: "include"
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`请求失败，状态码：${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                const PREVIEW_QUESTIONS = result.data;

                
                if (category === "00") {
                    localStorage.setItem(
                        "examQuestions",
                        JSON.stringify(PREVIEW_QUESTIONS),
                    );
                    window.location.href = "/student/answer/exam";
                } else if (category === "02") {
                    localStorage.setItem(
                        "practiceQuestions",
                        JSON.stringify(PREVIEW_QUESTIONS),
                    );
                    window.location.href = "/student/answer/practice";
                }
            })
            .catch(error => {
                console.error('获取试卷详情出错：', error);
                return null;
            });
    }

    /******************* 操作区 ********************/

    // 挂载区
    onMount(() => {
        fetchPaperList(get(SEARCH_PAPER_NAME), get(SEARCH_PAPER_TAGS), get(PAPER_PAGE), get(PAPER_PAGE_SIZE), "")
            .then(result => {
                if (result) {
                    total_papers = result.rowCount;
                    paper_list = result.data || [];
                    console.log(result)
                }
            });
    });

</script>

<div class="paper-management">
    <!-- 标题区域 -->
    <Title title="试卷管理"/>

    <!-- 操作栏区域 -->
    <div class="header">
        <!-- 左侧 -->
        <div class="left-side">
            <!-- 试卷名称 -->
            <div class="search-paper-name">
                <span class="prompt">试卷名称</span>
                <div class="input">
                    <input type="text"
                        placeholder="搜索试卷名称"
                        bind:value={$SEARCH_PAPER_NAME}
                        oninput={()=>debouncedFetchPaperList()}
                        onchange={()=>debouncedFetchPaperList()}
                    > 
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button data-name="clear" class="{$SEARCH_PAPER_NAME===""?"hide-clear":""}" onclick={()=>{SEARCH_PAPER_NAME.set("")}}></button>
                </div>
            </div>

            <!-- 试卷标签 -->
            <div class="search-paper-tag">
                <span class="prompt">试卷标签</span>
                <div class="input">
                    <input type="text"
                        placeholder="搜索试卷标签"
                        bind:value={$SEARCH_PAPER_TAGS}
                        oninput={()=>debouncedFetchPaperList()}
                        onchange={()=>debouncedFetchPaperList()}
                    >
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button data-name="clear" class="{$SEARCH_PAPER_TAGS===""?"hide-clear":""}" onclick={()=>{SEARCH_PAPER_TAGS.set("")}}></button>
                </div>
            </div>
        </div>

        <!-- 右侧 -->
        <div class="right-side">
            <button onclick={()=>resetSearch()} class="btn btn--primary is-plain">重置</button>
            <button onclick={()=>deleteMultiplePapers()} class="btn btn--danger is-plain">删除</button>
            <button onclick={()=>manual()} class="btn btn--primary is-plain">自定义组卷</button>
        </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
        <!-- 表格内容 -->
        <table>
            <thead>
                <tr>
                    <th>
                        <input
                            class="checkbox"
                            type="checkbox"
                            bind:checked={$ALL_PAPER_SELECTED}
                            onchange={(e) => selectedAll(e.target.checked)}
                        >
                    </th>
                    <th>试卷名称</th>
                    <th>组卷方式</th>
                    <th>试卷用途</th>
                    <th>试题数量</th>
                    <th>试卷总分</th>
                    <th>建议时长(分)</th>
                    <th>试卷标签</th>
                    <th>试卷难度</th>
                    <th>更新时间</th>
                    <th>创建日期</th>
                    <th>操作</th>
                </tr>
            </thead>

            <tbody>
                {#if paper_list.length !== 0}
                    {#each paper_list as paper}
                        <tr>
                            <td>
                                <input
                                    class="checkbox" 
                                    type="checkbox"
                                    checked={$SELECTED_PAPER_IDS.includes(paper.ID)}
                                    onchange={(e) => toggleSelection(paper.ID, e.target.checked)}
                                >
                            </td>
                            <td class="paper-name">{paper.Name}</td>
                            <td class="assembly-type">{ASSEMBLY_TYPE_TRANS[paper.AssemblyType]}</td>
                            <td class="category">{CATEGORY_TRANS[paper.Category]}</td>
                            <td class="question-count">{paper.QuestionCount}</td>
                            <td class="total-score">{paper.TotalScore}</td>
                            <td class="suggested-duration">{paper.SuggestedDuration}</td>
                            <td class="paper-tag">
                                <div class="tag-container">
                                    {#if paper.Tags.length !== 0}
                                        {#each paper.Tags as tag}
                                            <UneditableTag content={tag}/>
                                        {/each}
                                    {:else}
                                        <span>-</span>
                                    {/if}
                                </div>
                            </td>
                            <td class="level"><span class={LEVEL_TRANS[LEVEL_TRANS[paper.Level]]}>{LEVEL_TRANS[paper.Level]}</span></td>
                            <td class="update-time">{formatTimestamp(paper.UpdateTime,{show_date:true,show_time:true})}</td>
                            <td class="create-time">{formatTimestamp(paper.CreateTime,{show_date:true,show_time:false})}</td>
                            <td>
                                <div class="operation">
                                    <!-- 第一行按钮 -->
                                    <div class="operation-line">
                                        <button onclick={()=>editPaper(paper.ID)} class="blue-btn">修改</button>
                                        <button class="blue-btn" onclick={()=>previewPaper(paper.ID,paper.Category)}>预览</button>
                                        <button onclick={()=>deleteSinglePaper(paper.ID)} class="red-btn">删除</button>
                                    </div>
        
                                    <!-- 第二行按钮 -->
                                    <!-- <div class="operation-line"> -->
                                        <!-- <button class="blue-btn">日志</button> -->
                                    <!-- </div> -->
                                </div>
                            </td>
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
        {#if paper_list.length === 0}
            <Empty text="暂无试卷数据"/>
        {/if}
    </div>

    <!-- 翻页控制 -->
    <div class="page-control-container">
        <div class="page-control">
            <Pagination
                total_items={total_papers}
                current_page={$PAPER_PAGE}                
                page_size={$PAPER_PAGE_SIZE}   
                page_size_options={paper_page_size_options}
                on:pageChange={handlePageChange}
                on:pageSizeChange={handlePageSizeChange}
            />
        </div>
    </div>
</div>

<style>
    .paper-management {
        font-family: 'Noto Sans SC', sans-serif;
        color: var(--text-primary);
        display: flex;
        flex-direction: column;
        
        /* 操作栏区域 */
        .header {
            /* background-color: red; */
            display: flex;
            font-size: 14px;
            margin: 15px 0;

            /* 左侧 */
            .left-side {
                /* background-color: rebeccapurple; */
                display: flex;
                gap: 30px;
                align-items: center;

                /* 搜索试卷名称 & 试卷标签 */
                .search-paper-name, .search-paper-tag {
                    display: flex;
                    align-items: center;
                    width: 300px;

                    .prompt {
                        margin-right: 30px;
                    }

                    .input {

                        .hide-clear {
                            visibility: hidden;
                        }
                    }
                }
            }

            /* 右侧 */
            .right-side {
                /* background-color: blanchedalmond; */
                display: flex;
                gap: 12px;
                margin-left: auto;
            }
        }

        /* 表格区域 */
        .table-container {
            height: calc(87vh - 215px);
            overflow: auto;

            /* 表格内容 */
            table {
                width: 100%;
                font-size: 14px;
                text-align: center;
                border-collapse: collapse;

                tbody tr {

                    &:hover {

                        td {

                            background-color: rgb(236, 242, 254);
                        }
                    }
                }

                th, td {
                    background-color: var(--bg-primary);
                    padding: 8px 6px;
                }

                th {
                    color: rgb(178, 178, 178);
                    font-weight: normal;
                    height: 30px;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }

                td {
                    border-bottom: 1px solid var(--border-light);
                    height: 60px;

                    /* 试卷难度 */
                    .easy-level { font-size: 15px; color: var(--green); }
                    .normal-level { font-size: 15px; color: var(--orange); }
                    .hard-level { font-size: 15px; color: var(--red); }
                    
                    /* 操作按钮 */
                    .operation {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                        justify-content: space-evenly;

                        .operation-line {
                            display: flex;
                            gap: 4px;
                            justify-content: center;

                            button {
                                cursor: pointer;
                                border: none;
                                font-size: 14px;
                                background: none;
                                transition: all 0.2s;
                                white-space: nowrap;  /* 文本内容不换行 */
                                border-radius: var(--btn-border-radius);
                                border: 1px solid var(--border-medium);

                                &:hover {
                                    font-weight: bold;
                                    border: 1px solid var(--border-dark)
                                }
                            }

                            .blue-btn { 
                                color: var(--blue);
        
                                &:hover {
                                    background-color: #e6f7ff;
                                    color: var(--primary-hover);
                                }
                            }

                            .red-btn { 
                                color: var(--red);
        
                                &:hover {
                                    background-color: #fff2f0;
                                    color: var(--red);
                                }
                            }
                        }
                    }

                    /* 试卷标签 */
                    .tag-container {
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                        overflow-y: auto;
                        flex-wrap: wrap;
                        max-height: 65px;
                    }
                }

                .checkbox {
                    cursor: pointer;
                    width: 16px;
                    height: 16px;
                    accent-color: var(--primary-color);
                }

                .paper-name {
                    min-width: 120px;
                }
                .assembly-type {
                    min-width: 72px;
                }
                .category {
                    min-width: 58px;
                }
                .question-count {
                    min-width: 58px;
                }
                .total-score {
                    min-width: 58px;
                }
                .suggested-duration {
                    min-width: 82px;
                }
                .paper-tag {
                    max-width: 200px;
                    min-width: 120px;
                }
                .level {
                    min-width: 58px;
                }
                .update-time {
                    min-width: 74px;
                }
                .create-time {
                    min-width: 74px;
                }
            }

        }

        /* 翻页控制 */
        .page-control-container {
            display: flex;
            white-space: nowrap;

            .page-control {
                margin-left: auto;
            }
        }

    }
</style>
