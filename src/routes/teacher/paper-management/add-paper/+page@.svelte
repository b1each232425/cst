<script>

    let paperName = "新建试卷";
    let category = "00";            // 试卷用途 00：考试 02：练习
    let level = "00";               // 试卷难度 00：简单 02：中等 04：困难
    let suggestedDuration = 120;    // 建议时长，单位为分钟
    let totalScore = 0;
    let questionCount = 0;
    let description = "";
    let tags = [];

    function test() {
        console.log(level);
    }

</script>

<!-- <button on:click={test}>点我</button> -->

<div class="add-paper">
    <!-- 顶部栏 -->
    <div class="header">
        <!-- 标题 -->
        <div class="title-container">
            <div class="title-icon"></div>
            <span class="title-name">自定义组卷</span>
        </div>

        <!-- 试卷名称 -->
        <input class="paper-name-input {paperName===""?"name-warn":""}" type="text" bind:value={paperName} placeholder="试卷名称不能为空">
        
        <!-- 操作区 -->
        <div class="operation">
            <button id="temp-btn">一键展开</button>
            <button id="temp-btn">一键收取</button>
            <button id="temp-btn">从题库中导入</button>
            <button id="temp-btn">保存</button>
            <button id="temp-btn">退出</button>
        </div>
    </div>

    <!-- 下半区 -->
    <div class="bottom-area">
        <!-- 侧边栏 -->
        <div class="side-bar">
            <!-- 试卷信息 -->
            <div class="paper-info-container">
                <span class="title">试卷信息</span>
                <!-- 试卷用途 -->
                <div class="per-line">
                    <span class="info-label">试卷用途</span>
                    <select id="temp-select">
                        <option id="temp-option">考试</option>
                        <option id="temp-option">练习</option>
                    </select>
                </div>

                <!-- 试卷难度 -->
                <div class="per-line">
                    <span class="info-label">试卷难度</span>
                    <div>
                        <input type="radio" name="paper-level" value="00" bind:group={level}>简单
                        <input type="radio" name="paper-level" value="02" bind:group={level}>中等
                        <input type="radio" name="paper-level" value="04" bind:group={level}>困难
                    </div>
                </div>
                
                <!-- 建议时长 -->
                <div class="per-line">
                    <span class="info-label">建议时长</span>
                    <input type="number" id="temp-duration" bind:value={suggestedDuration}>
                    <span class="duration-span">分钟</span>
                </div>

                <!-- 试卷总分 -->
                <div class="per-line">
                    <span class="info-label">试卷总分</span>
                    <span class="total-score-number">{totalScore}</span>
                    <span class="total-score-span">分</span>
                </div>

                <!-- 试题数量 -->
                <div class="per-line">
                    <span class="info-label">试题数量</span>
                    <span class="question-count-number">{questionCount}</span>
                    <span class="question-count-span">道</span>
                </div>

                <!-- 试卷说明 -->
                <div class="paper-description">
                    <span class="info-label">试卷说明</span>
                    <textarea class="description-textarea" bind:value={description} placeholder="输入试卷说明"></textarea>
                </div>

                <!-- 试卷标签 -->
                <div class="paper-tags">
                    <span class="info-label">试卷标签</span>
                    <div class="tags-container">
                        <div class="per-tag">
                            <div class="color-block"></div>
                            <div class="btn-box">
                                <input type="text" placeholder="+标签">
                                <button>✕</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 题组列表 -->
            <div class="question-groups-container">
                <div class="title">题组列表</div>

            </div>
        </div>

        <!-- 内容区 -->
        <div class="content-container">

        </div>
    </div>
</div>

<style>
    /************ 此区域为临时组件区域 ************/
    
    #temp-btn {
        padding: 6px 18px;
    }

    #temp-select {
        width: 274px;
        padding: 6px 12px;
    }

    #temp-duration {
        padding: 6px;
        width: 228px;
    }

    /************ 此区域为临时组件区域 ************/


    .add-paper {
        font-family: 'Noto Sans SC', sans-serif;
        color: var(--text-primary);
        
        /* 顶部栏 */
        .header {
            /* background-color: red; */
            display: flex;
            padding: 16px 32px 16px 24px;
            align-items: center;
            border-bottom: 1.5px solid var(--border-light);
            height: 40px;
            white-space: nowrap;

            /* 标题 */
            .title-container {
                display: flex;
                margin-right: auto;
                align-items: center;

                /* 标题符 */
                .title-icon {
                    width: 13px;
                    height: 38px;
                    background-color: var(--primary-color);
                    margin-right: 6px;
                    border-radius: var(--border-radius-sm);
                }

                /* 标题名 */
                .title-name {
                    font-size: 26px;
                    font-weight: 900;
                }
            }

            /* 试卷名称 */
            .paper-name-input {
                border-top: none;
                border-left: none;
                border-right: none;
                padding: 8px 12px;
                text-align: center;
                font-size: 20px;
                transition: all 0.3s;
                width: 30%;
                margin-left: 15vw;
                margin-right: 5vw;
                min-width: 108px;

                &:focus {
                    outline: none;
                    border-color: var(--primary-hover);
                }
            }
            .name-warn {
                border-color: var(--red);
                transition: all 0.3s;
                background-color: rgb(255, 241, 240);

                &::placeholder {
                    color: var(--red);
                }

                &:focus {
                    outline: none;
                    border-color: var(--red);
                }
            }

            /* 操作区 */
            .operation {
                display: flex;
                margin-left: auto;
                gap: 0.8vw;
                align-items: center;
            }
        }

        /* 下半区 */
        .bottom-area {
            /* background-color: rebeccapurple; */
            height: 92.5vh;
            display: flex;

            /* 侧边栏 */
            .side-bar {
                /* background-color: aliceblue; */
                width: 348px;
                padding: 18px 26px;

                /* 试卷信息 */
                .paper-info-container {
                    /* background-color: antiquewhite; */
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    font-size: 14px;
                    margin-bottom: 24px;
                    
                    /* 提示词 */
                    .info-label { margin-right: 16px; }

                    /* 标题 */
                    .title { font-weight: 1000; font-size: 20px; }

                    /* 正常行 */
                    .per-line {
                        display: flex;
                        align-items: center;
                        
                        .duration-span { font-size: 12px; margin-left: 8px }
                        .total-score-number { font-weight: 500;}
                        .total-score-span { margin-left: 4px; font-weight: 500; }
                        .question-count-number { font-weight: 500; }
                        .question-count-span { margin-left: 4px; font-weight: 500; }
                    }

                    /* 试卷说明 */
                    .paper-description {
                        display: flex;
                        align-items: flex-start;

                        .description-textarea {
                            resize: vertical;
                            min-height: 60px;
                            flex-basis: 262px;
                            padding: 6px;
                        }
                    }

                    /* 试卷标签 */
                    .paper-tags {
                        /* background-color: antiquewhite; */
                        display: flex;
                        align-items: flex-start;

                        .tags-container {
                            /* background-color: violet; */
                            display: flex;
                            width: 276px;
                            height: 40px;
                            gap: 10px;
                            overflow-y: auto;
                            flex-wrap: wrap;
                            padding-top: 2px;

                            .per-tag {
                                display: flex;

                                /* 颜色块 */
                                .color-block {
                                    background-color: #40d5ff;
                                    width: 12px;
                                    height: 12px;
                                    margin: 2px;
                                }

                                /* 按钮块 */
                                .btn-box {
                                    /* background-color: aqua; */
                                    display: flex;
                                    align-items: center;
                                    height: 16px;
                                    
                                    &:hover {
                                        border-bottom: 1px solid #7792ff;
                                    }

                                    &:hover button {
                                        visibility: visible;
                                    }

                                    &:focus-within {
                                        border-bottom: 1px solid #7792ff;
                                    }
                                    
                                    input {
                                        /* background: lavenderblush; */
                                        font-weight: 500;
                                        height: 16px;
                                        padding: 0;
                                        width: 30px;
                                        border: none;
                                        font-size: 12px;
                                        outline: none;
                                        margin-left: 2px;
                                        margin-right: 8px;
                                    }

                                    button {
                                        font-size: 10px;
                                        padding: 0;
                                        background: none;
                                        border: none;
                                        cursor: pointer;
                                        font-weight: 600;
                                        color: #3f3f3f;
                                        visibility: hidden;

                                        &:hover {
                                            color: var(--primary-hover);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                /* 题组列表 */
                .question-groups-container {
                    /* background-color: aquamarine; */

                    /* 标题 */
                    .title {
                        font-weight: 1000;
                        font-size: 20px;
                    }
                }
            }

            /* 内容区 */
            .content-container {
                padding: 20px;
            }
        }
    }

</style>