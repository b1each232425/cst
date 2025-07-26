<script>
    // @ts-nocheck
    
    import { formatDate, formatTimestamp, getColorIndex } from "./_utils/func";
    import { levelTrans, categoryTrans, accessModeTrans, assemblyTypeTrans, tagColorList } from "./_utils/data";
    import { goto } from "$app/navigation";
    import Title from "$lib/components/Title/Title.svelte";

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
    ];

</script>

<div class="paper-management">
    <!-- 标题区域 -->
    <div>
        <Title title="试卷管理"/>
    </div>

    <!-- 操作栏区域 -->
    <div class="header">
        <!-- 左侧 -->
        <div class="left-side">
            <!-- 试卷名称 -->
            <div class="search-paper-name">
                <span style="margin-right: 26px;">试卷名称</span>
                <input id="temp-input" type="text" placeholder="搜索试卷名称">
            </div>

            <!-- 试卷标签 -->
            <div class="search-paper-tag">
                <span style="margin-right: 10px;">试卷标签</span>
                <input id="temp-input" type="text" placeholder="搜索试卷标签">
            </div>
        </div>

        <!-- 右侧 -->
        <div class="right-side">
            <button id="temp-btn">重置</button>
            <button id="temp-btn">删除</button>
            <button id="temp-btn" onclick={
                goto('/teacher/paper-management/add-paper')}>自定义组卷</button>
            <button id="temp-btn">随机组卷</button>
            <button id="temp-btn">智能刷题</button>
        </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-container">
        <!-- 表格内容 -->
        <table>
            <thead>
                <tr>
                    <th><input class="checkbox" type="checkbox"></th>
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
                {#each analogyData as paper}
                    <tr>
                        <td><input class="checkbox" type="checkbox"></td>
                        <td class="paper-name">{paper.Name}</td>
                        <td class="assembly-type">{assemblyTypeTrans[paper.AssemblyType]}</td>
                        <td class="category">{categoryTrans[paper.Category]}</td>
                        <td class="question-count">{paper.QuestionCount}</td>
                        <td class="total-score">{paper.TotalScore}</td>
                        <td class="suggested-duration">{paper.SuggestedDuration}</td>
                        <td class="paper-tag">
                            <div class="tag-container">
                                {#each paper.Tags as tag}
                                    <div class="per-tag">
                                        <div class="tag-block" style="background-color: {tagColorList[getColorIndex(tag)]};"></div>
                                        <span class="tag-name">{tag}</span>
                                    </div>
                                {/each}
                            </div>
                        </td>
                        <td class="level"><span class={levelTrans[levelTrans[paper.Level]]}>{levelTrans[paper.Level]}</span></td>
                        <td class="access-mode"><span class={accessModeTrans[accessModeTrans[paper.AccessMode]]}>{accessModeTrans[paper.AccessMode]}</span></td>
                        <td class="update-time">{formatTimestamp(paper.UpdateTime)}</td>
                        <td class="create-time">{formatDate(paper.CreateTime)}</td>
                        <td>
                            <div class="operation">
                                <!-- 第一行按钮 -->
                                <div class="operation-line">
                                    <button class="blue-btn">修改</button>
                                    <button class="blue-btn">共享</button>
                                    <button class="blue-btn">预览</button>
                                </div>
    
                                <!-- 第二行按钮 -->
                                <div class="operation-line">
                                    <button class="blue-btn">日志</button>
                                    <button class="red-btn">删除</button>
                                </div>
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <!-- 翻页控制 -->
    <div class="page-control-container">
        <div class="page-control">(我是翻页组件)</div>
    </div>
</div>

<style>
    
    /************ 此区域为临时组件区域 ************/

    #temp-title {
        font-size: 20px;
        font-weight: bold;
    }

    #temp-input {
        padding: 7px 12px;
    }

    #temp-btn {
        padding: 7px 20px;
    }

    /************ 此区域为临时组件区域 ************/

    .paper-management {
        font-family: 'Noto Sans SC', sans-serif;
        color: var(--text-primary);
        
        /* 操作栏区域 */
        .header {
            /* background-color: red; */
            display: flex;
            font-size: 14px;
            margin: 30px 0;

            /* 左侧 */
            .left-side {
                /* background-color: rebeccapurple; */
                display: flex;
                gap: 32px;
                align-items: center;
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
            max-height: 70vh;
            overflow: auto;

            /* 表格内容 */
            table {
                width: 100%;
                font-size: 14px;
                text-align: center;
                border-collapse: collapse;

                th, td {
                    background-color: var(--bg-primary);
                }

                th {
                    color: rgb(178, 178, 178);
                    font-weight: normal;
                    height: 40px;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }

                td {
                    border-bottom: 1px solid var(--border-light);
                    height: 75px;

                    /* 试卷难度 */
                    .easy-level { color: var(--green); }
                    .normal-level { color: var(--orange); }
                    .hard-level { color: var(--red); }

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
                                    color: rgb(34, 34, 34);
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
    
                            /* 标签名 */
                            .tag-name {
    
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
