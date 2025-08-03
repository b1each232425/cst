<script>
    // @ts-nocheck
    
    import { formatDate, formatTimestamp, getColorIndex } from "./_utils/func";
    import { paperLevelTrans, paperCategoryTrans, paperAccessModeTrans, paperAssemblyTypeTrans, tagColorList } from "./_utils/data";
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

    // 模拟数据
    let analogyData = [
        {
            ID: 62,
            // 试卷ID
            Name: "H3C练习卷",
            // 试卷名称
            AssemblyType: "00",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "00",
            // 试卷用途 00：考试 02：练习
            Level: "02",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 120,
            // 建议时长，单位为分钟
            Tags: ["测试", "简单", "常识", "牛逼", "哈哈", "English"],
            // 试卷标签
            Description: "我是整张试卷的介绍",
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: 1,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "02",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 5,
            QuestionCount: 1,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },
        {
            ID: 63,
            // 试卷ID
            Name: "2025年H3C网络工程师资格证考试综合试卷",
            // 试卷名称
            AssemblyType: "00",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "00",
            // 试卷用途 00：考试 02：练习
            Level: "00",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 60,
            // 建议时长，单位为分钟
            Tags: ["H3C", "无敌"],
            // 试卷标签
            Description: "我是这张试卷的试卷说明",
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: 1,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "00",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 240,
            QuestionCount: 10,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },
        {
            ID: 64,
            // 试卷ID
            Name: "2025年H3C网络工程资格证设计卷",
            // 试卷名称
            AssemblyType: "02",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "02",
            // 试卷用途 00：考试 02：练习
            Level: "02",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 45,
            // 建议时长，单位为分钟
            Tags: ["H3C"],
            // 试卷标签
            Description: null,
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: null,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "04",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 19,
            QuestionCount: 2,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },
        {
            ID: 65,
            // 试卷ID
            Name: "H3C选择题卷",
            // 试卷名称
            AssemblyType: "04",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "02",
            // 试卷用途 00：考试 02：练习
            Level: "04",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 30,
            // 建议时长，单位为分钟
            Tags: ["H3C"],
            // 试卷标签
            Description: null,
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: null,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "00",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 290,
            QuestionCount: 29,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },

        {
            ID: 65,
            // 试卷ID
            Name: "H3C选择题卷",
            // 试卷名称
            AssemblyType: "04",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "02",
            // 试卷用途 00：考试 02：练习
            Level: "04",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 30,
            // 建议时长，单位为分钟
            Tags: ["H3C"],
            // 试卷标签
            Description: null,
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: null,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "00",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 290,
            QuestionCount: 29,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },
        {
            ID: 65,
            // 试卷ID
            Name: "H3C选择题卷",
            // 试卷名称
            AssemblyType: "04",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "02",
            // 试卷用途 00：考试 02：练习
            Level: "04",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 30,
            // 建议时长，单位为分钟
            Tags: ["H3C"],
            // 试卷标签
            Description: null,
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: null,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "00",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 290,
            QuestionCount: 29,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },
        {
            ID: 65,
            // 试卷ID
            Name: "H3C选择题卷",
            // 试卷名称
            AssemblyType: "04",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "02",
            // 试卷用途 00：考试 02：练习
            Level: "04",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 30,
            // 建议时长，单位为分钟
            Tags: ["H3C"],
            // 试卷标签
            Description: null,
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: null,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "00",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 290,
            QuestionCount: 29,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },
        {
            ID: 65,
            // 试卷ID
            Name: "H3C选择题卷",
            // 试卷名称
            AssemblyType: "04",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "02",
            // 试卷用途 00：考试 02：练习
            Level: "04",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 30,
            // 建议时长，单位为分钟
            Tags: ["H3C"],
            // 试卷标签
            Description: null,
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: null,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "00",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 290,
            QuestionCount: 29,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },{
            ID: 65,
            // 试卷ID
            Name: "H3C选择题卷",
            // 试卷名称
            AssemblyType: "04",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "02",
            // 试卷用途 00：考试 02：练习
            Level: "04",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 30,
            // 建议时长，单位为分钟
            Tags: ["H3C"],
            // 试卷标签
            Description: null,
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: null,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "00",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 290,
            QuestionCount: 29,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },
        {
            ID: 65,
            // 试卷ID
            Name: "H3C选择题卷",
            // 试卷名称
            AssemblyType: "04",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "02",
            // 试卷用途 00：考试 02：练习
            Level: "04",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 30,
            // 建议时长，单位为分钟
            Tags: ["H3C"],
            // 试卷标签
            Description: null,
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: null,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "00",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 290,
            QuestionCount: 29,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },
        {
            ID: 65,
            // 试卷ID
            Name: "H3C选择题卷",
            // 试卷名称
            AssemblyType: "04",
            // 组卷方式 00：自定义组卷 02：随机组卷 04：智能刷题
            Category: "02",
            // 试卷用途 00：考试 02：练习
            Level: "04",
            // 试卷难度 00：简单 02：中等 04：困难
            SuggestedDuration: 30,
            // 建议时长，单位为分钟
            Tags: ["H3C"],
            // 试卷标签
            Description: null,
            // 试卷说明，介绍整张试卷
            Creator: 1,
            // 创建者
            CreateTime: 1753104023766,
            // 创建时间
            UpdatedBy: null,
            // 更新者
            UpdateTime: 1753104023766,
            // 更新时间
            Status: "00",
            // 状态 00：正常， 02：异常
            AccessMode: "00",
            // 试卷访问权限，00私有 02共享 04公开
            TotalScore: 290,
            QuestionCount: 29,
            GroupCount: null,
            TableMap: null,
            Action: "",
            Condition: "",
            Expr: "",
            Values: null,
            Columns: null,
            QryResult: null,
            Result: null,
            RowCount: 0,
            AuthExpr: "",
            AuthWhereValues: null,
            AuthWhereBeginPos: 0,
            AuthProc: false
        },
    ];
    
    let paperName = $state("");              // 试卷名称
    let paperTags = $state("");              // 试卷标签
    let paperCategory = $state("");          // 试卷用途
    let totalPapers = $state(0);             // 试卷总数
    let paperPageSize = $state(10);          // 每页条数
    let paperPage = $state(1);               // 当前页
    let paperPageSizeOptions = [10, 20]      // 每页条数选择项
    let paperList = $state([]);              // 试卷列表
    let selectedPaperIDs = $state([]);       // 已选 ID 数组
    let allPaperSelected = $state(false);    // 是否为全选状态
    let isFirstEntry = $state(true);         // 是否首次进入页面

    // 选中数据
    function toggleSelection(ID, checked) {
        if(checked) {
            selectedPaperIDs.push(ID);
        } else {
            selectedPaperIDs = selectedPaperIDs.filter(item => item !== ID);
        }
    }

    // 检查全选
    $effect(() => {
        if(paperList.length !== 0 && paperList.every(item => selectedPaperIDs.includes(item.ID))) {
            allPaperSelected = true;
        } else {
            allPaperSelected = false;
        }
    });

    // 全选
    function selectedAll(checked) {
        const currentPageIDs = paperList.map(item => item.ID);
        if(checked) {
            const currentPageIDs = paperList.map(item => item.ID);
            const notYetSelected = currentPageIDs.filter(ID => !selectedPaperIDs.includes(ID));
            selectedPaperIDs = [...selectedPaperIDs, ...notYetSelected];
        } else {
            selectedPaperIDs = selectedPaperIDs.filter(ID => !currentPageIDs.includes(ID));
        }
    }

    // 重置按钮
    function resetSearch() {
        paperName = "";
        paperTags = "";
        paperPage = 1;
        paperPageSize = 10;
        selectedPaperIDs = [];
    }

    // 处理页面跳转
    function handlePageChange(event) {
        paperPage = event.detail;
        fetchPaperList(paperName, paperTags, paperPage, paperPageSize, paperCategory)
            .then(result => {
                totalPapers = result.rowCount;
                paperList = result.data || [];
            });
    }

    // 处理页面大小更改
    function handlePageSizeChange(event) {
        paperPageSize = event.detail;
        paperPage = 1;
        fetchPaperList(paperName, paperTags, paperPage, paperPageSize, paperCategory)
            .then(result => {
                totalPapers = result.rowCount;
                paperList = result.data || [];
            });
    }

    // 防抖搜索试卷
    const debouncedFetchPaperList = debounce(() => {
        fetchPaperList(paperName, paperTags, paperPage, paperPageSize, paperCategory)
        .then(result => {
            totalPapers = result.rowCount;
            paperList = result.data || [];
        });
    }, 500, false);
        
    $effect(() => {
        paperName; paperTags; paperCategory;
        if(isFirstEntry) {
            debouncedFetchPaperList();
        }
    });

    // 挂载区
    onMount(() => {
        fetchPaperList(paperName, paperTags, paperPage, paperPageSize, paperCategory)
            .then(result => {
                totalPapers = result.rowCount;
                paperList = result.data || [];
                isFirstEntry = false;
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
                        fetchPaperList(paperName, paperTags, paperPage, paperPageSize, paperCategory)
                            .then(result => {
                                totalPapers = result.rowCount;
                                paperList = result.data || [];
                            })
                    });
            }
        });
    }

    // 批量删除试卷
    function deleteMultiplePapers() {
        if(selectedPaperIDs.length === 0) {
            toast.error("请先选择试卷", 1000);
        }
        MessageBox({
            title: "删除确认",
            content: `请问是否要批量删除这 ${selectedPaperIDs.length} 张试卷？`,
            confirm_button_type: "danger",

            onConfirm: () => {
                deletePaper(selectedPaperIDs)
                    .then(() => {
                        toast.success("删除成功", 1000);
                        fetchPaperList(paperName, paperTags, paperPage, paperPageSize, paperCategory)
                            .then(result => {
                                totalPapers = result.rowCount;
                                paperList = result.data || [];
                            })
                    });
            }
        });
    }

</script>

<!-- <button onclick={console.log(paperList)}>点我</button> -->

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
                    bind:value={paperName}
                />
            </div>

            <!-- 试卷标签 -->
            <div class="search-paper-tag">
                <span class="prompt">试卷标签</span>
                <InputBox
                    placeholder="搜索试卷标签"
                    showLabel={false}
                    type="text"
                    bind:value={paperTags}
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
                            bind:checked={allPaperSelected}
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
                {#each paperList as paper}
                    <tr>
                        <td>
                            <input
                                class="checkbox" 
                                type="checkbox"
                                checked={selectedPaperIDs.includes(paper.ID)}
                                onchange={(e) => toggleSelection(paper.ID, e.target.checked)}
                            >
                        </td>
                        <td class="paper-name">{paper.Name}</td>
                        <td class="assembly-type">{paperAssemblyTypeTrans[paper.AssemblyType]}</td>
                        <td class="category">{paperCategoryTrans[paper.Category]}</td>
                        <td class="question-count">{paper.QuestionCount}</td>
                        <td class="total-score">{paper.TotalScore}</td>
                        <td class="suggested-duration">{paper.SuggestedDuration}</td>
                        <td class="paper-tag">
                            <div class="tag-container">
                                {#if paper.Tags.length !== 0}
                                    {#each paper.Tags as tag}
                                        <div class="per-tag">
                                            <div class="tag-block" style="background-color: {tagColorList[getColorIndex(tag)]};"></div>
                                            <span class="tag-name">{tag}</span>
                                        </div>
                                    {/each}
                                {:else}
                                    <span>-</span>
                                {/if}
                            </div>
                        </td>
                        <td class="level"><span class={paperLevelTrans[paperLevelTrans[paper.Level]]}>{paperLevelTrans[paper.Level]}</span></td>
                        <td class="access-mode">
                            <div class="access-mode-box">
                                <Tag type={paperAccessModeTrans[paperAccessModeTrans[paper.AccessMode]]} them="light">{paperAccessModeTrans[paper.AccessMode]}</Tag>
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
            </tbody>
        </table>
    </div>

    <!-- 翻页控制 -->
    <div class="page-control-container">
        <div class="page-control">
            <Pagination
                totalItems={totalPapers}
                currentPage={paperPage}                
                pageSize={paperPageSize}   
                pageSizeOptions={paperPageSizeOptions}
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
