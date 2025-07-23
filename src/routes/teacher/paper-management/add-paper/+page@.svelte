<script>
    let paperName = "新建试卷";
</script>

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
            <button>一键展开</button>
            <button>一键收取</button>
            <button>从题库中导入</button>
            <button>保存</button>
            <button>退出</button>
        </div>
    </div>

    <!-- 下半区 -->
    <div class="bottom-area">
        <!-- 侧边栏 -->
        <div class="side-bar">
            <!-- 试卷信息 -->
            <div class="paper-info-container">
                <div class="title">试卷信息</div>
                <!-- 试卷用途 -->
                <div class="per-line">
                    <span class="info-label">试卷用途</span>
                </div>

                <!-- 试卷难度 -->
                <div class="per-line">
                    <span class="info-label">试卷难度</span>
                </div>
                
                <!-- 建议时长 -->
                <div class="per-line">
                    <span class="info-label">建议时长</span>
                </div>

                <!-- 试卷总分 -->
                <div class="per-line">
                    <span class="info-label">试卷总分</span>
                </div>

                <!-- 试题数量 -->
                <div class="per-line">
                    <span class="info-label">试题数量</span>
                </div>

                <!-- 试卷说明 -->
                <div class="per-line">
                    <span class="info-label">试卷说明</span>
                </div>

                <!-- 试卷标签 -->
                <div class="per-line">
                    <span class="info-label">试卷标签</span>
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

            /* 标题 */
            .title-container {
                display: flex;
                margin-right: auto;
                align-items: center;
                margin-right: 20%;

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
                width: 33.3%;

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
                margin-left: auto;
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
                width: 400px;

                /* 试卷信息 */
                .paper-info-container {
                    /* background-color: antiquewhite; */
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 10px;
                    
                    .info-label {
                        font-size: 14px;
                        width: 20%;
                        
                    }

                    /* 标题 */
                    .title {
                        font-weight: bold;
                        font-size: 20px;
                    }

                    /* 正常行 */
                    .per-line {
                        display: flex;
                        align-items: center;

                        
                    }
                }

                /* 题组列表 */
                .question-groups-container {
                    /* background-color: aquamarine; */
                    padding: 10px;

                    /* 标题 */
                    .title {
                        font-weight: bold;
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