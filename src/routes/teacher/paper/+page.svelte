<script>
    // @ts-nocheck
    
    import { formatDate, formatTimestamp, getColorIndex } from "./_utils/func";
    import { LEVEL_TRANS, CATEGORY_TRANS, ACCESS_MODE_TRANS, ASSEMBLY_TYPE_TRANS, TAG_COLOR_LIST } from "./_utils/data";
    import { goto } from "$app/navigation";
    import Title from "$lib/components/Title/Title.svelte";
    import InputBox from "$lib/components/Input/InputBox.svelte";
    import Button from "$lib/components/Button/Button.svelte";
    import Pagination from "$lib/components/Pagination/Pagination.svelte";
    import Tag from "$lib/components/Tag/Tag.svelte";
    import { createEmptyPaper, deletePaper, fetchPaperList } from "./_utils/api";
    import { debounce } from "$lib/utils/optimize";
    import MessageBox from "$lib/components/MessageBox/MessageBox";
    import { onMount } from "svelte";
    import { toast } from "$lib/components/Toast/Toast";
    import Empty from "$lib/components/Table/Empty.svelte";
    
    let paper_name = $state("");               // 试卷名称
    let paper_tags = $state("");               // 试卷标签
    let paper_category = $state("");           // 试卷用途
    let total_papers = $state(0);              // 试卷总数
    let paper_page_size = $state(10);          // 每页条数
    let paper_page = $state(1);                // 当前页
    let paper_page_size_options = [10, 20]     // 每页条数选择项
    let paper_list = $state([]);               // 试卷列表
    let selected_paperIDs = $state([]);        // 已选 ID 数组
    let all_paper_selected = $state(false);    // 是否为全选状态
    let is_first_entry = $state(true);         // 是否首次进入页面

    // 选中数据
    function toggleSelection(ID, checked) {
        if(checked) {
            selected_paperIDs.push(ID);
        } else {
            selected_paperIDs = selected_paperIDs.filter(item => item !== ID);
        }
    }

    // 检查全选
    $effect(() => {
        if(paper_list.length !== 0 && paper_list.every(item => selected_paperIDs.includes(item.ID))) {
            all_paper_selected = true;
        } else {
            all_paper_selected = false;
        }
    });

    // 全选
    function selectedAll(checked) {
        const CURRENT_PAGE_IDS = paper_list.map(item => item.ID);
        if(checked) {
            const CURRENT_PAGE_IDS = paper_list.map(item => item.ID);
            const NOT_YET_SELECTED = CURRENT_PAGE_IDS.filter(ID => !selected_paperIDs.includes(ID));
            selected_paperIDs = [...selected_paperIDs, ...NOT_YET_SELECTED];
        } else {
            selected_paperIDs = selected_paperIDs.filter(ID => !CURRENT_PAGE_IDS.includes(ID));
        }
    }

    // 重置按钮
    function resetSearch() {
        paper_name = "";
        paper_tags = "";
        paper_page = 1;
        paper_page_size = 10;
        selected_paperIDs = [];
    }

    // 处理页面跳转
    function handlePageChange(event) {
        paper_page = event.detail;
        fetchPaperList(paper_name, paper_tags, paper_page, paper_page_size, paper_category)
            .then(result => {
                total_papers = result.rowCount;
                paper_list = result.data || [];
            });
    }

    // 处理页面大小更改
    function handlePageSizeChange(event) {
        paper_page_size = event.detail;
        paper_page = 1;
        fetchPaperList(paper_name, paper_tags, paper_page, paper_page_size, paper_category)
            .then(result => {
                total_papers = result.rowCount;
                paper_list = result.data || [];
            });
    }

    // 防抖搜索试卷
    const debouncedFetchPaperList = debounce(() => {
        fetchPaperList(paper_name, paper_tags, paper_page, paper_page_size, paper_category)
        .then(result => {
            total_papers = result.rowCount;
            paper_list = result.data || [];
        });
    }, 500, false);
        
    $effect(() => {
        paper_name; paper_tags; paper_category;
        if(!is_first_entry) {
            debouncedFetchPaperList();
        }
    });

    // 本质：先调用effect，再调用onMount

    // 挂载区
    onMount(() => {
        fetchPaperList(paper_name, paper_tags, paper_page, paper_page_size, paper_category)
            .then(result => {
                total_papers = result.rowCount;
                paper_list = result.data || [];
                is_first_entry = false;
            });
    });

    // 自定义组卷
    function manual() {
        createEmptyPaper().then( result => {
            localStorage.setItem('currentPaperID', JSON.stringify(result.data.paper.ID));
            goto('/teacher/paper/manual');
        });
    }

    // 编辑试卷
    function editPaper(ID) {
        localStorage.setItem('currentPaperID', JSON.stringify(ID));
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
                        fetchPaperList(paper_name, paper_tags, paper_page, paper_page_size, paper_category)
                            .then(result => {
                                total_papers = result.rowCount;
                                paper_list = result.data || [];
                                console.log(result);
                            })
                    });
            }
        });
    }

    // 批量删除试卷
    function deleteMultiplePapers() {
        if(selected_paperIDs.length === 0) {
            toast.error("请先选择试卷", 1000);
            return;
        }
        MessageBox({
            title: "删除确认",
            content: `请问是否要批量删除这 ${selected_paperIDs.length} 张试卷？`,
            confirm_button_type: "danger",

            onConfirm: () => {
                deletePaper(selected_paperIDs)
                    .then(() => {
                        toast.success("删除成功", 1000);
                        fetchPaperList(paper_name, paper_tags, paper_page, paper_page_size, paper_category)
                            .then(result => {
                                total_papers = result.rowCount;
                                paper_list = result.data || [];
                            })
                    });
            }
        });
    }

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
                <InputBox
                    placeholder="搜索试卷名称"
                    showLabel={false}
                    type="text"
                    bind:value={paper_name}
                />
            </div>

            <!-- 试卷标签 -->
            <div class="search-paper-tag">
                <span class="prompt">试卷标签</span>
                <InputBox
                    placeholder="搜索试卷标签"
                    showLabel={false}
                    type="text"
                    bind:value={paper_tags}
                />
            </div>
        </div>

        <!-- 右侧 -->
        <div class="right-side">
            <Button onclick={()=>resetSearch()} plain={true}>重置</Button>
            <Button onclick={()=>deleteMultiplePapers()} plain={true} type="danger">删除</Button>
            <Button onclick={()=>manual()} plain={true}>自定义组卷</Button>
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
                            bind:checked={all_paper_selected}
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
                    <th>共享状态</th>
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
                                    checked={selected_paperIDs.includes(paper.ID)}
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
                                            <div class="per-tag">
                                                <div class="tag-block" style="background-color: {TAG_COLOR_LIST[getColorIndex(tag)]};"></div>
                                                <span class="tag-name">{tag}</span>
                                            </div>
                                        {/each}
                                    {:else}
                                        <span>-</span>
                                    {/if}
                                </div>
                            </td>
                            <td class="level"><span class={LEVEL_TRANS[LEVEL_TRANS[paper.Level]]}>{LEVEL_TRANS[paper.Level]}</span></td>
                            <td class="access-mode">
                                <div class="access-mode-box">
                                    <Tag type={ACCESS_MODE_TRANS[ACCESS_MODE_TRANS[paper.AccessMode]]} them="light">{ACCESS_MODE_TRANS[paper.AccessMode]}</Tag>
                                </div>
                            </td>
                            <td class="update-time">{formatTimestamp(paper.UpdateTime)}</td>
                            <td class="create-time">{formatDate(paper.CreateTime)}</td>
                            <td>
                                <div class="operation">
                                    <!-- 第一行按钮 -->
                                    <div class="operation-line">
                                        <button onclick={()=>editPaper(paper.ID)} class="blue-btn">修改</button>
                                        <!-- <button class="blue-btn">共享</button> -->
                                        <!-- <button class="blue-btn">预览</button> -->
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
                current_page={paper_page}                
                page_size={paper_page_size}   
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
                gap: 32px;
                align-items: center;

                /* 搜索试卷名称 */
                .search-paper-name {
                    display: flex;
                    align-items: center;
                    width: 300px;

                    .prompt {
                        width: 120px;
                    }
                }

                /* 搜索试卷标题 */
                .search-paper-tag {
                    display: flex;
                    align-items: center;
                    width: 300px;

                    .prompt {
                        width: 120px;
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

                    /* 共享状态 */
                    .private-access {
                        color: #666;
                        background-color: #f5f5f5;
                        font-size: 13px;
                        padding: 2px 8px;
                        border-radius: var(--border-radius-sm);
                        font-weight: 500;
                    }
                    .share-access {
                        color: var(--blue);
                        background-color: #e6f4ff;
                        font-size: 13px;
                        padding: 2px 8px;
                        border-radius: var(--border-radius-sm);
                        font-weight: 500;
                    }
                    .public-access {
                        color: var(--green);
                        background-color: #f6ffed;
                        font-size: 13px;
                        padding: 2px 8px;
                        border-radius: var(--border-radius-sm);
                        font-weight: 500;
                    }
                    
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

                        .per-tag {
                            display: flex;
                            align-items: center;
                            width: max-content;
                            height: max-content;
    
                            /* 颜色块 */
                            .tag-block{
                                width: 12px;
                                height: 12px;
                                border-radius: 2px;
                                margin-right: 9px;
                            }
                        }
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
                .access-mode {
                    min-width: 58px;

                    .access-mode-box {
                        padding-top: 4px;
                        width: 40px;
                        /* background-color: red; */
                        width: 100%;
                        display: flex;
                        justify-content: center;
                    }
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

            .page-control {
                margin-left: auto;
            }
        }

    }
</style>
