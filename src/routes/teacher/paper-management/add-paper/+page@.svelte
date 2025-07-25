<script>
  import { tagColorList } from "../_utils/data";
  import { getColorIndex } from "../_utils/func";

    let paperName = $state("新建试卷");
    let category = $state("00");            // 试卷用途 00：考试 02：练习
    let level = $state("00");               // 试卷难度 00：简单 02：中等 04：困难
    let suggestedDuration = $state(120);    // 建议时长，单位为分钟
    let totalScore = $state(0);
    let questionCount = $state(0);
    let description = $state("");
    let tags = $state(["测试","简单","常识","English", "牛逼", "WDF"]);
    
    /**************** 标签处理区 ****************/

    let toAddTag = $state("");

    // 新增标签
    function addTag() {
        if (event.key === "Enter" && toAddTag.trim() !== "") {
            tags = [toAddTag, ...tags];
            toAddTag = "";
        }
    }

    // 清除新建标签内容
    function clearToAddTagContent() {
        toAddTag = "";
    }

    // 处理旧标签 Enter 键
    function oldTagEnter() {
        if(event.key === "Enter") {
            event.target.blur();
        }
    }

    // 删除旧标签
    function deleteTag(index) {
        tags = tags.toSpliced(index, 1);
    }

    /**************** 标签处理区 ****************/    

    function test() {
        console.log(tags);
    }

</script>

<!-- {toAddTag}
<button onclick={test}>{tags}</button> -->

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
                <div class="single-line">
                    <span class="info-label">试卷用途</span>
                    <select id="temp-select">
                        <option id="temp-option">考试</option>
                        <option id="temp-option">练习</option>
                    </select>
                </div>

                <!-- 试卷难度 -->
                <div class="single-line">
                    <span class="info-label">试卷难度</span>
                    <div>
                        <input type="radio" name="paper-level" value="00" bind:group={level}>简单
                        <input type="radio" name="paper-level" value="02" bind:group={level}>中等
                        <input type="radio" name="paper-level" value="04" bind:group={level}>困难
                    </div>
                </div>
                
                <!-- 建议时长 -->
                <div class="single-line">
                    <span class="info-label">建议时长</span>
                    <input type="number" id="temp-duration" bind:value={suggestedDuration}>
                    <span class="duration-span">分钟</span>
                </div>

                <!-- 试卷总分 -->
                <div class="single-line">
                    <span class="info-label">试卷总分</span>
                    <span class="total-score-number">{totalScore}</span>
                    <span class="total-score-span">分</span>
                </div>

                <!-- 试题数量 -->
                <div class="single-line">
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
                        <!-- 固定用于创建新标签的标签 -->
                        <div class="paper-tag" style="border: 1.5px dashed var(--border-medium);">
                            <div class="color-block" style="background-color: {toAddTag===""? "#40d5ff":tagColorList[getColorIndex(toAddTag)]};"></div>
                            <div class="btn-box">
                                <input type="text" bind:value={toAddTag} onkeydown={addTag} placeholder="+标签"/>
                                <button onclick={clearToAddTagContent}>✕</button>
                            </div>
                        </div>

                        <!-- 已创建的标签 -->
                        {#each tags as tag, index}
                            <div class="paper-tag">
                                <div class="color-block" style="background-color: {tag===""? "#40d5ff":tagColorList[getColorIndex(tag)]};"></div>
                                <div class="btn-box">
                                    <input type="text" bind:value={tags[index]} onkeydown={oldTagEnter} placeholder="+标签"/>
                                    <button onclick={()=>deleteTag(index)}>✕</button>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- 题组列表 -->
            <div class="question-groups-container">
                <!-- 标题 -->
                <div class="question-groups-header">
                    <div class="title-box">
                        <div class="title">题组列表</div>
                        <span>共有 5 个题组</span>
                    </div>
                    <button id="temp-add-group">添加题组</button>
                </div>

                <!-- 列表 -->
                <div class="question-groups-box">
                    <div class="single-group">
                        <span>一、单选题&nbsp;&nbsp;&nbsp;&nbsp;(共0题，共0分)</span>
                        <div>
                            <!-- 编辑按钮 -->
                            <button class="edit-group-btn" title="编辑" aria-label="编辑题目">
                                <svg
                                    viewBox="0 0 1024 1024"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    width="10"
                                    height="10"
                                >
                                    <path
                                        d="M114.445959 666.607355c-20.078238 20.078238-20.078238 46.179948 0 68.266011l174.680675 174.680675c20.078238 20.078238 54.211244 20.078238 68.266011 0l477.862075-477.862076c20.078238-20.078238 20.078238-46.179948 0-68.26601l-174.680675-174.680675c-20.078238-20.078238-54.211244-20.078238-68.26601 0L114.445959 666.607355zM760.965238 14.064605l-100.391193 100.391193 248.970157 248.970157 100.391193-100.391193c34.133005-34.133005 0-68.266011 0-68.266011L835.25472 20.088077c-2.007824-6.023472-34.133005-38.148653-74.289482-6.023472zM46.179948 728.849895L0 1024l295.150105-46.179948L46.179948 728.849895z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>
                            <!-- 删除按钮 -->
                            <button class="delete-group-btn" title="删除">x</button>
                        </div>
                    </div>

                    <div class="single-group">
                        <span>二、多选题&nbsp;&nbsp;&nbsp;&nbsp;(共0题，共0分)</span>
                        <div>
                            <!-- 编辑按钮 -->
                            <button class="edit-group-btn" title="编辑" aria-label="编辑题目">
                                <svg
                                    viewBox="0 0 1024 1024"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    width="10"
                                    height="10"
                                >
                                    <path
                                        d="M114.445959 666.607355c-20.078238 20.078238-20.078238 46.179948 0 68.266011l174.680675 174.680675c20.078238 20.078238 54.211244 20.078238 68.266011 0l477.862075-477.862076c20.078238-20.078238 20.078238-46.179948 0-68.26601l-174.680675-174.680675c-20.078238-20.078238-54.211244-20.078238-68.26601 0L114.445959 666.607355zM760.965238 14.064605l-100.391193 100.391193 248.970157 248.970157 100.391193-100.391193c34.133005-34.133005 0-68.266011 0-68.266011L835.25472 20.088077c-2.007824-6.023472-34.133005-38.148653-74.289482-6.023472zM46.179948 728.849895L0 1024l295.150105-46.179948L46.179948 728.849895z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>
                            <!-- 删除按钮 -->
                            <button class="delete-group-btn" title="删除">x</button>
                        </div>
                    </div>
                    <div class="single-group">
                        <span>三、判断题&nbsp;&nbsp;&nbsp;&nbsp;(共0题，共0分)</span>
                        <div>
                            <!-- 编辑按钮 -->
                            <button class="edit-group-btn" title="编辑" aria-label="编辑题目">
                                <svg
                                    viewBox="0 0 1024 1024"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    width="10"
                                    height="10"
                                >
                                    <path
                                        d="M114.445959 666.607355c-20.078238 20.078238-20.078238 46.179948 0 68.266011l174.680675 174.680675c20.078238 20.078238 54.211244 20.078238 68.266011 0l477.862075-477.862076c20.078238-20.078238 20.078238-46.179948 0-68.26601l-174.680675-174.680675c-20.078238-20.078238-54.211244-20.078238-68.26601 0L114.445959 666.607355zM760.965238 14.064605l-100.391193 100.391193 248.970157 248.970157 100.391193-100.391193c34.133005-34.133005 0-68.266011 0-68.266011L835.25472 20.088077c-2.007824-6.023472-34.133005-38.148653-74.289482-6.023472zM46.179948 728.849895L0 1024l295.150105-46.179948L46.179948 728.849895z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>
                            <!-- 删除按钮 -->
                            <button class="delete-group-btn" title="删除">x</button>
                        </div>
                    </div>
                    <div class="single-group">
                        <span>四、填空题&nbsp;&nbsp;&nbsp;&nbsp;(共0题，共0分)</span>
                        <div>
                            <!-- 编辑按钮 -->
                            <button class="edit-group-btn" title="编辑" aria-label="编辑题目">
                                <svg
                                    viewBox="0 0 1024 1024"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    width="10"
                                    height="10"
                                >
                                    <path
                                        d="M114.445959 666.607355c-20.078238 20.078238-20.078238 46.179948 0 68.266011l174.680675 174.680675c20.078238 20.078238 54.211244 20.078238 68.266011 0l477.862075-477.862076c20.078238-20.078238 20.078238-46.179948 0-68.26601l-174.680675-174.680675c-20.078238-20.078238-54.211244-20.078238-68.26601 0L114.445959 666.607355zM760.965238 14.064605l-100.391193 100.391193 248.970157 248.970157 100.391193-100.391193c34.133005-34.133005 0-68.266011 0-68.266011L835.25472 20.088077c-2.007824-6.023472-34.133005-38.148653-74.289482-6.023472zM46.179948 728.849895L0 1024l295.150105-46.179948L46.179948 728.849895z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>
                            <!-- 删除按钮 -->
                            <button class="delete-group-btn" title="删除">x</button>
                        </div>
                    </div>
                    <div class="single-group" style="border-bottom: transparent;">
                        <span>五、简答题&nbsp;&nbsp;&nbsp;&nbsp;(共0题，共0分)</span>
                        <div>
                            <!-- 编辑按钮 -->
                            <button class="edit-group-btn" title="编辑" aria-label="编辑题目">
                                <svg
                                    viewBox="0 0 1024 1024"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    width="10"
                                    height="10"
                                >
                                    <path
                                        d="M114.445959 666.607355c-20.078238 20.078238-20.078238 46.179948 0 68.266011l174.680675 174.680675c20.078238 20.078238 54.211244 20.078238 68.266011 0l477.862075-477.862076c20.078238-20.078238 20.078238-46.179948 0-68.26601l-174.680675-174.680675c-20.078238-20.078238-54.211244-20.078238-68.26601 0L114.445959 666.607355zM760.965238 14.064605l-100.391193 100.391193 248.970157 248.970157 100.391193-100.391193c34.133005-34.133005 0-68.266011 0-68.266011L835.25472 20.088077c-2.007824-6.023472-34.133005-38.148653-74.289482-6.023472zM46.179948 728.849895L0 1024l295.150105-46.179948L46.179948 728.849895z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </button>
                            <!-- 删除按钮 -->
                            <button class="delete-group-btn" title="删除">x</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 内容区 -->
        <div class="content-container">
            <div class="single-group-content">
                <!-- 头部下拉栏 -->
                <div class="group-header">
                    <!-- 左侧区域 -->
                    <div class="header-left">

                    </div>

                    <!-- 右侧区域 -->
                    <div class="header-right">

                    </div>
                </div>

                <!-- 题目列表 -->
                <div class="group-question-list">

                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /**************** 临时组件区 ****************/
    
    #temp-btn {
        padding: 6px 18px;
    }

    #temp-select {
        width: 300px;
        padding: 6px 12px;
    }

    #temp-duration {
        padding: 6px;
        width: 252px;
    }

    #temp-add-group {
        padding: 6px 12px;
    }

    /**************** 临时组件区 ****************/


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
                margin-left: auto;
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
            height: 92vh;
            display: flex;

            /* 侧边栏 */
            .side-bar {
                /* background-color: aliceblue; */
                width: 372px;
                min-width: 372px;
                padding: 18px 24px;

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
                    .single-line {
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
                            flex-basis: 286px;
                            padding: 6px;
                            transition: all 0.3s;
                            outline: none;
                            border-radius: var(--input-border-radius);
                            border: 1px solid var(--border-light);

                            &:focus {
                                border: 1px solid #40a9ff;
                                box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
                            }
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
                            width: 300px;
                            height: 48px;
                            gap: 10px 16px;
                            overflow-y: auto;
                            flex-wrap: wrap;
                            padding-top: 2px;

                            .paper-tag {
                                /* background-color: red; */
                                display: flex;
                                height: 16px;
                                border: 1.5px solid transparent;

                                /* 颜色块 */
                                .color-block {
                                    width: 12px;
                                    height: 12px;
                                    margin: 2px;
                                }

                                /* 按钮块 */
                                .btn-box {
                                    display: flex;
                                    align-items: center;
                                    height: 16px;
                                    border-bottom: 1px solid transparent;
                                    
                                    &:hover {
                                        border-bottom: 1px solid #7792ff;
                                    }

                                    &:focus-within {
                                        border-bottom: 1px solid #7792ff;
                                    }

                                    input {
                                        font-weight: 500;
                                        height: 16px;
                                        padding: 0;
                                        width: 42px;
                                        border: none;
                                        font-size: 12px;
                                        outline: none;
                                        margin-left: 2px;
                                        margin-right: 8px;
                                        color: var(--text-primary);
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

                                .btn-box:hover button {
                                    visibility: visible;
                                }
                            }
                        }
                    }
                }

                /* 题组列表 */
                .question-groups-container {
                    /* background-color: aquamarine; */

                    /* 标题 */
                    .question-groups-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 10px;

                        .title-box {

                            .title {
                                font-weight: 1000;
                                font-size: 20px;
                            }

                            span {
                                font-size: 14px;
                            }
                        }
                    }

                    /* 列表 */
                    .question-groups-box {
                        /* background-color: #40a9ff; */
                        padding: 5px;   
                        display: flex;   
                        border: 1px solid var(--border-light);
                        border-radius: var(--border-radius-sm);
                        flex-direction: column;          

                        .single-group {
                            display: flex;
                            padding: 17px 21px;
                            justify-content: space-between;
                            cursor: grab;
                            border-bottom: 1px solid var(--border-light);

                            span {
                                font-weight: 500;
                            }
                        
                            &:hover {
                                background-color: var(--bg-secondary);
                            }

                            .edit-group-btn, .delete-group-btn {
                                width: 24px;
                                height: 24px;
                                border: 1px solid var(--border-light);
                                background: none;
                                border-radius: var(--btn-border-radius);
                                cursor: pointer;
                                background-color: var(--bg-primary);
                            }

                            /* 编辑按钮 */
                            .edit-group-btn {
                                padding: 0;

                                &:hover {
                                    border-color: var(--green);
                                    color: var(--green);
                                }
                            }

                            /* 删除按钮 */
                            .delete-group-btn {
                                font-size: 14px;

                                &:hover {
                                    border-color: var(--red);
                                    color: var(--red);
                                }
                            }
                        }
                    }
                }
            }

            /* 内容区 */
            .content-container {
                background-color: aliceblue;
                width: 73%;
                padding: 20px;
            }
        }
    }

</style>