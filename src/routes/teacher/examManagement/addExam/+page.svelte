<script>
    //@ts-nocheck
    import { goto } from "$app/navigation";
    import SmartEditor from "@3min/smart-edit";
    import DateTimePicker from "$lib/component/DatePicker/DateTimePicker.svelte";
    import RequiredLabel from "../_components/RequiredLabel.svelte";
    import PaperSelectionPanel from "../_components/PaperSelectionPanel.svelte";
    import ExamineeSelectionPanel from "../_components/ExamineeSelectionPanel.svelte";
    const TIP_TEXT = {
        final_exam:
            "当一门考试的考试性质为期末成绩考试时，它将决定学生在此课程的最终期末成绩",
        qualifying_exams:
            "当一门考试是资格证考试时，学生需要以真实身份进入考试",
        online: "考生可以通过互联网在任何地方登录网站进行考试，无需到特定地点",
        offline: "要求考生到指定的考点机房现场参加考试，并通过网站进行操作",
        fixed: "固定时段考试：考试时长=结束时间-开始时间",
        flexible: "灵活时段考试：考试时长<=结束时间-开始时间，只适用于线上考试",
        auto_mark:
            "批改方式仅适用于填空题和简答题，其他题型将默认由系统批改，自动批改：AI根据提示词对学生的答案进行打分",
        ai_mark:
            "批改方式仅适用于填空题和简答题，其他题型将默认使用自动批改，AI批改：根据提示词对学生的答案进行打分",
        multiply_mark: "每位批阅员分别批阅所有考生的试卷，最终得分取平均值",
        assignment_of_paper: "将试卷平分或按一定比例分配给不同批阅员",
        question_group_mark: "每位批阅员负责批阅某一特定题型",
        paper_by_paper: "一次批改一份完整试卷，依次完成所有题目",
        question_by_question:
            "一次批改一个题型，完成所有试卷的该题型后，再到下一个题型",
    };

    const ASSEMBLY_TYPE_MAP = {
        "00": "自定义组卷",
        "02": "随机组卷",
        "04": "智能刷题",
    };

    const DEFAULT_RULES = `在即将开始的考试之前，请各位考生务必仔细阅读并遵守以下详细规则：
    1. 请确保您的网络连接稳定，建议使用有线网络连接，并使用支持最新版本浏览器的电脑参加考试。
    2. 提前30分钟登录考试平台，完成身份验证和设备检查，以保证准时开考。准备好有效的身份证件以备核查。
    3. 考试环境应安静、无干扰，桌面除必要的文具外不得放置任何与考试无关的物品或参考资料。关闭所有与考试无关的应用程序和通知提醒。
    4. 确保摄像头开启且面向考生，以便监考人员实时监控，考试全程需保持可见。背景应整洁，避免出现可能引起作弊嫌疑的物品。
    5. 不得使用任何通讯工具或电子设备辅助答题，包括手机、平板电脑等。禁止查阅外部资料、与他人交流或寻求帮助。
    6. 一旦进入考试界面，中途不允许离开，如遇特殊情况（如突发健康问题）须提前报告监考老师，并遵循监考老师的指示。
    7. 遵守考试时间限制，系统将在规定时间自动提交试卷。请合理分配答题时间，不要集中在最后一刻提交答案。
    8. 考试期间严禁录屏、录音或以任何形式记录考试内容。违反此规定将被视为作弊行为处理。
    9. 如有任何技术问题或遇到不可抗力因素影响考试进行，请立即联系在线技术支持或监考老师寻求帮助。
    请严格遵守上述规则，祝您考试顺利，取得满意的成绩！`;

    const EDITOR_OPTIONS = {
        editable: true,
        content: DEFAULT_RULES,
        table: {
            overflow: false,
        },
        link: {
            protocols: [],
        },
        disableFileContent: true,
        characterCount: {
            characterCountLimit: 1000,
            enableCharacterCountLimit: true,
        },
        menuBarExcludeKeys:["attachment","audio","image" ,"video"]
    }

    //考试名称
    let examName = $state("");
    //考试规则
    let examRules = $state(DEFAULT_RULES);
    //考试类型
    let examType = $state("00");
    //考试方式
    let examMethod = $state("00");
    let examExaminee = $state([]);
    //考生数量
    let examinee_num = $derived(examExaminee.length);
    let files = $state([]);
    let RichTextEditor; //富文本编辑器
    //考试场次数组
    let paper_configs = $state([
        {
            paper_id: 0,
            paper_type: "",
            paper_name: "",
            period_mode: "00",
            start_time: "",
            end_time: "",
            duration: 0,
            max_duration: 0,
            is_option_shuffled: false,
            is_question_shuffled: false,
            question_shuffled_mode: "00",
            mark_method: "00",
            name_visibility: false,
            mark_mode: "10",
            grading_config: [],
            is_hide: false,
            session_num: 1,
            mark_config: {
                teacher_mark_configs: [
                    // {
                    //     id: 0,
                    //     name: "",
                    // },
                ],
            },
            showPaperSelectionPanel: false,
            show_graders_selection_panel: false,
            late_entry_time: 1,
            early_submission_time: 0,
        },
    ]);
    

    //总时长计算
    let total_duration = $derived(calculateDuration(paper_configs));
    let showPaperSelectionPanel = $state(false);
    let show_examinee_panel = $state(false);
    let show_action_toast = $state(false);
    let action_toast = $state(null);
    function addNewPaper() {
        let default_paper_config = {
            paper_id: 0, //试卷ID
            paper_type: "", //试卷类型
            paper_name: "",
            period_mode: "00", //考试时间段模式
            start_time: "",
            end_time: "",
            duration: 0,
            max_duration: 0,
            is_option_shuffled: false, //是否选项乱序
            is_question_shuffled: false, //是否题目乱序
            question_shuffled_mode: "00",
            mark_method: "00", //批卷方式
            name_visibility: false,
            mark_mode: "10", //批改模式
            grading_config: [],
            is_hide: false,
            session_num: 1,
            mark_config: {
                teacher_mark_configs: [
                    // {
                    //     id: 0,
                    //     name: "",
                    //     mark_count: 0, //第一版暂无
                    //     mark_question_groups: [], //第一版暂无
                    // },
                ],
            },
            showPaperSelectionPanel: false,
            show_graders_selection_panel: false,
            late_entry_time: 1,
            early_submission_time: 0,
        };
        paper_configs = [...paper_configs, default_paper_config];

        // 清空考场选择
        // exam_rooms = [];
        // invigilators = [];
    }

    function resetTime(index) {
        if (
            !paper_configs[index].start_time &&
            !paper_configs[index].end_time
        ) {
            paper_configs[index].duration = 0;
            paper_configs[index].max_duration = 0;
            return;
        }
        const startTime = new Date(paper_configs[index].start_time);
        const endTime = new Date(paper_configs[index].end_time);

        const timeDifference = endTime.getTime() - startTime.getTime();
        const durationInSeconds = Math.floor(timeDifference / (1000 * 60));

        paper_configs[index].duration = durationInSeconds;
        paper_configs[index].max_duration = durationInSeconds;
    }

    function onChooseTime(index) {
        return function (
            /** @type {string | number | Date} */ start,
            /** @type {string | number | Date} */ end,
        ) {
            if (!start || !end) {
                paper_configs[index].duration = 0;
                paper_configs[index].max_duration = 0;
                return;
            }

            const startTime = new Date(start);
            const endTime = new Date(end);

            // 检查日期是否有效
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.error("Invalid date values");
                return;
            }

            startTime.setSeconds(0, 0);
            endTime.setSeconds(0, 0);

            const timeDifference = endTime.getTime() - startTime.getTime();
            const durationInSeconds = Math.floor(timeDifference / (1000 * 60));

            paper_configs[index].duration = durationInSeconds;
            paper_configs[index].max_duration = durationInSeconds;

            const startISO = startTime.toISOString();
            const endISO = endTime.toISOString();

            paper_configs[index].start_time = startISO;
            paper_configs[index].end_time = endISO;

            // 清空考场选择
            // exam_rooms = [];
            // invigilators = [];
        };
    }

    function calculateDuration(paper_configs) {
        let duration = 0;
        paper_configs.forEach((element) => {
            let number = Number(element.duration);
            if (typeof number !== "number") {
                number = 0;
                console.error("typeof duration is not number");
            }
            duration += number;
        });
        return duration;
    }

    async function handleSubmit() {
        //必填字段校验
        if (examName === "") {
            action_toast.show("error", "请输入考试名称");
            return;
        }

        if (examName.length > 50) {
            action_toast.show("error", "考试名称不得超过50个字符");
            return;
        }

        if (examRules === "") {
            action_toast.show("error", "请输入考试规则");
            return;
        }

        if (examRules.length > 1000) {
            action_toast.show("error", "考试规则不得超过1000个字符");
            return;
        }

        // 创建考试时可以暂时不选择考生
        // if (examExaminee.length < 1) {
        //     action_toast.show("error", "未选择考生");
        //     return;
        // }

        if (paper_configs.length <= 0) {
            action_toast.show("error", "请至少添加一个考试场次");
            return;
        }

        // 校验每个考试场次
        for (let i = 0; i < paper_configs.length; i++) {
            const session = paper_configs[i];

            // 校验试卷ID
            if (!session.paper_id || session.paper_id === 0) {
                action_toast.show("error", `第${i + 1}个场次未选择试卷`);
                return;
            }

            // 校验开始时间
            if (!session.start_time || session.start_time === "") {
                action_toast.show("error", `第${i + 1}个场次未设置时间段`);
                return;
            }

            // 校验结束时间
            if (!session.end_time || session.end_time === "") {
                action_toast.show("error", `第${i + 1}个场次未设置时间段`);
                return;
            }

            // 校验时间逻辑
            const startTime = new Date(session.start_time);
            const endTime = new Date(session.end_time);
            const now = new Date();

            // 检查开始时间是否早于当前时间
            if (startTime < now) {
                action_toast.show(
                    "error",
                    `第${i + 1}个场次的开始时间不能早于当前时间`,
                );
                return;
            }

            // 检查结束时间是否早于开始时间
            if (endTime <= startTime) {
                action_toast.show(
                    "error",
                    `第${i + 1}个场次的结束时间必须晚于开始时间`,
                );
                return;
            }


        for (let i = 0; i < paper_configs.length; i++) {
            //设置场次编号
            paper_configs[i].session_num = i + 1;

            //设置乱序方式
            if (
                paper_configs[i].is_option_shuffled &&
                paper_configs[i].is_question_shuffled
            ) {
                paper_configs[i].question_shuffled_mode = "00";
            } else if (
                paper_configs[i].is_option_shuffled &&
                !paper_configs[i].is_question_shuffled
            ) {
                paper_configs[i].question_shuffled_mode = "02";
            } else if (
                !paper_configs[i].is_option_shuffled &&
                paper_configs[i].is_question_shuffled
            ) {
                paper_configs[i].question_shuffled_mode = "04";
            } else if (
                !paper_configs[i].is_option_shuffled &&
                !paper_configs[i].is_question_shuffled
            ) {
                paper_configs[i].question_shuffled_mode = "06";
            }

            // 如果是自动批改，则清空批阅员选择
            if(paper_configs[i].mark_method == "02"){
                paper_configs[i].mark_config.teacher_mark_configs = []
                paper_configs[i].mark_mode = "00"
            }

            paper_configs[i].late_entry_time = paper_configs[i].late_entry_time<=0?1:paper_configs[i].late_entry_time
            paper_configs[i].early_submission_time = paper_configs[i].early_submission_time<=0?1:paper_configs[i].early_submission_time
        }


        const formData = new FormData();


        let exam_data = {
            examInfo: {
                Name: examName,
                Rules: examRules,
                Type: examType,
                Mode: examMethod,
                status: "00",
                Files:[
                    {
                    Name: "string", 
                    Url: "string"
                    }
                ]
            },
            examSessions: paper_configs,
            examinee:examExaminee,
            invigilators: [0] // 监考员列表，暂时设置为0，后续可以添加监考员选择功能，模拟数据   
        };

        formData.append("data", JSON.stringify(exam_data));

        fetch("http://127.0.0.1:4523/m1/6247470-5941367-default/api/exam",
        {
            method: "POST",
            body: formData,
        })
        .then((response) => response.json())
        .then((result) => {
            if(result.status===0){
                // action_toast.show("success", "考试创建成功！");
            }
            else{
                // action_toast.show("error", "考试创建失败！");
            }
        })
        .catch( (error) => {
                console.error("创建考试失败:", error);
                action_toast.show("error", "考试创建失败！");
            });
    
        // fetch("/api/teacher/exam/createExam", {
        //     method: "POST",
        //     credentials: "include",
        //     body: formData,
        // })
        //     .then((response) => response.json())
        //     .then((result) => {
        //         if (result.Status === 0) {
        //             action_toast.show("success", "考试创建成功！");
        //             goto("/teacher/examManagement");
        //         }else if (result.Status === -21) {
        //             action_toast.show("error", "部分监考员无法监考该时段的考试，已自动取消选择");
        //             result.Data.invigilatorNotCanInvigilate.forEach(element => {
        //                 invigilators.splice(invigilators.findIndex(item => item.id === element), 1);
        //             });
        //         }
        //         else {
        //             console.error("创建考试失败:", result.Msg);
        //             action_toast.show("error", "创建考试失败，请稍后重试");
        //         }
        //     })
        //     .catch((error) => {
        //         console.error("创建考试失败:", error);
        //         action_toast.show("error", "创建考试失败，请稍后重试");
        //     });
    }
}
</script>

<div class="createExamWrapper">
    <div class="createExamContainer">
         <span>创建考试</span> <!-- 占位标记 -->
         <div class="examNameInputContainer">
            <RequiredLabel text="考试名称" />
            <input
                placeholder="请输入考试名称（例：xxx平时考试）"
                class="exam-name-input"
                bind:value={examName}
                maxlength={50}
            />
            </div>

            <div class="examRuleInputContainer">
                <RequiredLabel text="考试规则" />
                <div class="ruleInputContainer">
                    <SmartEditor
                    bind:this={RichTextEditor}
                    width = {"100%"}
                    height = {"400px"}
                    editor_options={{ ...EDITOR_OPTIONS, placeholder: "请输入考试规则",
                    onContentChange: (
                        /**
                            * @type {PiptapEditor}
                            */
                        editor,
                    ) => {
                        examRules = editor.getPreviewHTML();
                    },
                    }}
                />
                </div>
            </div>

            <div class="examTypeChooseContainer">
                <RequiredLabel text="考试类型" />
            <div class="exam-choice-container">
                <label class="label">
                    <input
                        type="radio"
                        bind:group={examType}
                        value={"00"}
                        class="choice-radio-input"
                    />
                    平时考试
                </label>
                <label class="label">
                    <input
                        type="radio"
                        bind:group={examType}
                        value={"02"}
                        class="choice-radio-input"
                    />
                    期末成绩考试
                    <span class="tip-wrapper">
                        <img
                            src="/tip.png"
                            alt="提示"
                            style="width: 14px; height:auto"
                        />
                        <div class="tooltip-text">{TIP_TEXT["final_exam"]}</div>
                    </span>
                </label>
                <label class="label">
                    <input
                        type="radio"
                        bind:group={examType}
                        value={"04"}
                        class="choice-radio-input"
                    />
                    资格证考试
                    <span class="tip-wrapper">
                        <img
                            src="/tip.png"
                            alt="提示"
                            style="width: 14px; height:auto"
                        />
                        <div class="tooltip-text">
                            {TIP_TEXT["qualifying_exams"]}
                        </div>
                    </span>
                </label>
            </div>
        </div>

        <div class="exam-type-choose-container">
            <RequiredLabel text="考试方式" />
            <div class="exam-choice-container">
                <label class="label">
                    <input
                        type="radio"
                        bind:group={examMethod}
                        value={"00"}
                        class="choice-radio-input"
                        disabled={examType === '04'}
                    />
                    线上考试
                    <span class="tip-wrapper">
                        <img
                            src="/tip.png"
                            alt="提示"
                            style="width: 14px; height:auto"
                        />
                        <div class="tooltip-text">{TIP_TEXT["online"]}</div>
                    </span>
                </label>
            </div>
        </div>

         <div class="paper-configs-container">
            <RequiredLabel text="配置试卷" />
            <div class="paper-configs">
                {#each paper_configs as _, index}
                <div></div> <!-- 左侧占位，与标签对齐 -->
                    {@render paperConfig(index)}
                {/each}

                <button
                    class="add-paper-button"
                    onclick={() => {
                        addNewPaper();
                    }}>添加试卷</button
                >
            </div>
        </div>

         <div class="total-duration-container">
            <RequiredLabel text="总考试时长" />
            <div class="total-duration-input-container">
                <span class="total-duration-text">{total_duration}</span>
                <span class="total-duration-text">&nbsp;&nbsp;&nbsp;分钟</span>
            </div>
        </div>

        <div class="examinee-container">
            <RequiredLabel text="考试人员" colon={false}  Asterisk={false}/>
            <div class="examinee-button-container normal-button-container">
                <button
                    class="examinee-button normal-button"
                    onclick={() => {
                        show_examinee_panel = true;
                    }}>考生选择</button
                >
                <div class="examinee-number-container">
                    <span class="examinee-number-text">已选择 </span>
                    <span
                        class="examinee-number-text {(examExaminee.length === 0) && examMethod === "02"
                            ? 'red-text'
                            : 'green-text'}">{examExaminee.length}</span
                    >
                    <span class="examinee-number-text"> 名</span>
                </div>
            </div>
        </div>

        <div class="bottom-action-panel-fixed">
            <button
                class="cancel-action-button"
                onclick={() => {
                    goto("/teacher/examManagement");
                }}>取消</button
            >
            <button
                class="save-action-button"
                onclick={() => {
                     handleSubmit();
                }}>保存</button
            >
        </div>
    </div>
    
</div>

{#snippet paperConfig(/** @type {number} */ paper_config_index)}
    <div class="paper-config-container">
        <div class="paper-config-head">
            <span class="paper-num">试卷{paper_config_index + 1}</span>
            <button
                class={paper_config_index != 0 ? "delete-paper-button" : "hide"}
                onclick={() => {
                    paper_configs.splice(paper_config_index, 1);
                    // 清空考场选择
                    // exam_rooms = [];
                    // invigilators = [];
                }}><img src="/delete.svg" alt="删除" /></button
            >
            <button
                class="arrow"
                onclick={() => {
                    paper_configs[paper_config_index].is_hide =
                        !paper_configs[paper_config_index].is_hide;
                }}
                ><img src="/dropdown/arrow_black.png" alt="展开/收起" /></button
            >
        </div>

            <div class="paper-config-body {paper_configs[paper_config_index].is_hide ? 'hide' : 'show'}">
                <div class="paper-choose-container config-row">
                    <RequiredLabel text="试卷" />
                    <div class="config-row-content">
                        <div class="paper-button-container normal-button-container">
                            {#if paper_configs[paper_config_index].paper_id === 0}
                                <button
                                    class="paper-button normal-button"
                                    onclick={() => {
                                        paper_configs[
                                            paper_config_index
                                        ].showPaperSelectionPanel = true;
                                    }}>试卷选择</button
                                >
                                {:else}
                                <div class="paper-item-container">
                                    {#if !paper_configs[paper_config_index].paper_type || !paper_configs[paper_config_index].paper_name}
                                        <span class="paper-type-text">未知试卷</span
                                        >
                                    {:else}
                                        <span class="paper-type-text">
                                            {ASSEMBLY_TYPE_MAP[ paper_configs[paper_config_index].paper_type]}：
                                        </span>

                                        <span class="paper-name-text"
                                            >{paper_configs[paper_config_index]
                                                .paper_name}</span
                                        >
                                    {/if}
                                    <button
                                        class="edit-button"
                                        onclick={() => {
                                            paper_configs[
                                                paper_config_index
                                            ].showPaperSelectionPanel = true;
                                        }}
                                    >
                                        编辑
                                    </button>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
                    
                    <div class="exam-mode-container config-row">
                        <RequiredLabel text="考试时段模式" />
                        <div class="config-row-content">
                            <label class="label">
                                <input
                                    type="radio"
                                    bind:group={paper_configs[paper_config_index].period_mode}
                                    value={"00"}
                                    class="choice-radio-input"
                                    onchange={() => {
                                        if (paper_configs[paper_config_index].period_mode === "00") {
                                            resetTime(paper_config_index);
                                        }
                                    }}
                                />
                                固定时段考试

                                <span class="tip-wrapper">
                                    <img
                                        src="/tip.png"
                                        alt="提示"
                                        style="width: 14px; height:auto"
                                    />
                                    <div class="tooltip-text" style="min-width: 255px;">
                                        {TIP_TEXT["fixed"]}
                                    </div>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div class="exam-time-container config-row">
                        <RequiredLabel text="考试时段" />
                        <div class="config-row-content">
                            <DateTimePicker
                                start_date={new Date()}
                                end_date={new Date()}
                                onSelectDate={onChooseTime(paper_config_index)}
                                min_date={paper_config_index === 0
                                    ? new Date()
                                    : new Date(
                                        paper_configs[
                                            paper_config_index - 1
                                        ].end_time,
                                    )}
                            ></DateTimePicker>
                        </div>
                    </div>

                    <div class="exam-duration-container config-row">
                        <RequiredLabel text="考试时长" />
                        <div class="config-row-content">
                            <input
                                class="duration-input"
                                bind:value={
                                    paper_configs[paper_config_index].duration
                                }
                                type="number"
                                min="1"
                                disabled
                            />
                            <span style="font-size: 14px;">分钟</span>
                        </div>
                    </div>

                        <div class="exam-duration-container config-row">
                            <RequiredLabel text="考场规则" />
                            <div class="config-row-content">
                                <span style="font-size: 14px;">考试开始后</span>
                                <input
                                    class="duration-input"
                                    bind:value={paper_configs[paper_config_index].late_entry_time}
                                    type="number"
                                    min="1"
                                    max="{paper_configs[paper_config_index].duration}"
                                    style="width:60px;"
                                    oninput={(event)=>{
                                        const max = paper_configs[paper_config_index].duration;
                                        const val = Number(event.target.value);
                                        if (val > max) {
                                            event.target.value = max;
                                            paper_configs[paper_config_index].late_entry_time = max;
                                        }else if(val < 1){
                                            event.target.value = 1;
                                            paper_configs[paper_config_index].late_entry_time = 1;
                                        }
                                    }}
                                />
                            <span style="font-size: 14px;">分钟内可进入考场，可提前</span>
                            <input
                                class="duration-input"
                                bind:value={paper_configs[paper_config_index].early_submission_time}
                                type="number"
                                min="0"
                                max="{paper_configs[paper_config_index].duration}"
                                style="width:60px;"
                                oninput={(event)=>{
                                    const max = paper_configs[paper_config_index].duration;
                                    const val = Number(event.target.value);
                                    if (val > max) {
                                        event.target.value = max;
                                        paper_configs[paper_config_index].early_submission_time = max;
                                    }
                                }}
                            />
                            <span style="font-size: 14px;">分钟交卷</span>
                        </div>
                    </div>

                    <div class="order-manner-container config-row">
                        <RequiredLabel text="乱序方式" />
                        <div class="config-row-content">
                            <label class="label">
                                <input
                                    type="checkbox"
                                    class="choice-radio-input"
                                    bind:checked={
                                        paper_configs[paper_config_index]
                                            .is_option_shuffled
                                    }
                                />
                                选项乱序
                            </label>
                            <label class="label">
                                <input
                                    type="checkbox"
                                    class="choice-radio-input"
                                    bind:checked={
                                        paper_configs[paper_config_index]
                                            .is_question_shuffled
                                    }
                                />
                                试题乱序
                            </label>
                        </div>
                    </div>

                    <div class="marking-method-container config-row">
                        <RequiredLabel text="批卷方式" />
                        <div class="config-row-content">
                            <label class="label">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index].mark_method
                                    }
                                    value={"00"}
                                    class="choice-radio-input"
                                />
                                人工批卷
                            </label>
                        </div>
                    </div>

                    <div
                        class="show-name-container {paper_configs[paper_config_index]
                            .mark_method !== '00'
                            ? 'hide'
                            : ' config-row'}"
                    >
                        <RequiredLabel text="批改时是否显示考生姓名：" Asterisk={false} colon={false} />
                        <div class="config-row-content">
                            <label class="label">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index]
                                            .name_visibility
                                    }
                                    value={true}
                                    class="choice-radio-input"
                                />
                                是
                            </label>
                            <label class="label">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index]
                                            .name_visibility
                                    }
                                    value={false}
                                    class="choice-radio-input"
                                />
                                否
                            </label>
                        </div>
                    </div>
        
                    <div
                        class="grading-config-container {paper_configs[
                            paper_config_index
                        ].mark_method !== '00'
                            ? 'hide'
                            : ' config-row'}"
                    >
                        <RequiredLabel text="批改配置" Asterisk={false} />
                        <div class="config-row-content graders-container">
                            <div class = "graders-type-1">
                                <button
                                    class="add-graders-button"
                                    onclick={() => {
                                        paper_configs[
                                            paper_config_index
                                        ].show_graders_selection_panel = true;
                                    }}
                                    ><img
                                        src="/add.svg"
                                        alt="添加"
                                        style="height: 14px; margin-right:5px"
                                    />添加批阅员</button
                                >
                            </div>
                        </div>
                    </div>

                    <div
                        class="grading-mode-container {paper_configs[
                            paper_config_index
                        ].mark_method !== '00'
                            ? 'hide'
                            : ' config-row'}"
                    >
                        <RequiredLabel text="批改模式" />

                         <div
                    class="config-row-content"
                    style="display: flex;flex-direction:column"
                >
                        <span class="grading-config-row-text">单人阅卷</span>
                        </div>    
                    </div>

                    <div class="grading-mode-button-container">
                        <RequiredLabel text="" Asterisk={false} colon={false} />
                                <div class="config-row-content">
                                    <label class="label" style="color: #757575;">
                                        <input
                                            type="radio"
                                            bind:group={
                                                paper_configs[paper_config_index].mark_mode
                                            }
                                            value={"10"}
                                            class="choice-radio-input"
                                        />
                                        单人批改
                                    </label>
                                </div>
                        </div>
                </div>

                <PaperSelectionPanel
                    selected_id={paper_configs[paper_config_index].paper_id}
                    selected_name={paper_configs[paper_config_index].paper_name}
                    selected_type={paper_configs[paper_config_index].paper_type}
                    show_panel={paper_configs[paper_config_index]
                        .showPaperSelectionPanel}
                    onCancel={() => {
                        paper_configs[paper_config_index].showPaperSelectionPanel =
                            false;
                    }}
                    onConfirm={(
                        /** @type {number} */ selected_id,
                        /** @type {string} */ selected_name,
                        /** @type {string} */ selected_type,
                    ) => {
                        paper_configs[paper_config_index].showPaperSelectionPanel =
                            false;
                        paper_configs[paper_config_index].paper_id = selected_id;
                        paper_configs[paper_config_index].paper_name = selected_name;
                        paper_configs[paper_config_index].paper_type = selected_type;
                    }}
        ></PaperSelectionPanel>

        <ExamineeSelectionPanel
            show_panel={show_examinee_panel}
            onConfirm={(selected) => {
                //确认后将选择的考生取出
                show_examinee_panel = false;
                examExaminee = selected;
            }}
            onCancel={(/** @type {boolean} */ load_new_file) => {
                show_examinee_panel = false;
                if (load_new_file) {
                    examExaminee = [];
                }
            }}
            ids={examExaminee}
    ></ExamineeSelectionPanel>
    </div>
{/snippet}

<style lang="scss" scoped>

.hide {
        display: none;
    }
.createExamWrapper {
        position: relative;
        display: block;
        background: #fff;
        margin: 0 auto;
        overflow-y: hidden;
        overflow-x: auto;
        padding-bottom: 5%;
        .createExamContainer {
            margin: 0 auto;
            position: relative;
            background-color: white;
            display: grid;
            gap: 20px; //垂直间距
            align-items: center;
            overflow-y: auto;
            overflow-x: auto;
            .examNameInputContainer,
            .examRuleInputContainer,
            .examTypeChooseContainer,
            .exam-type-choose-container,
            .paper-configs-container,
            .total-duration-container,
            .examinee-container{
                display: grid;
                grid-template-columns: auto 1fr;
               // margin-left:15%;
                gap:20px;
                // align-items: center;
                
            }
        }
    }

    .exam-name-input{
                    //max-width:60%;
                    min-height:32px;
                    box-sizing: border-box;
                    border: 1px solid #d7d7d7;
                    border-radius: 2px;
                   // outline: none;
                    font-size: 14px;
                }
                
     .label-wrapper {
        display: flex;
        gap:6px; //文字和星号之间的间距
        font-size: 14px;
        padding-right: 26px;
        .required-icon {
            // color: var(--red);
            margin-right: 2px;
        }
    }


    .paper-config-container {
        position: relative;
        // width: 60%;
        margin-bottom: 10px;
        .paper-config-head {
            height: 40px;
            background-color: #dcdcdc;
            display: flex;
            align-items: center;
            justify-content: center;
            .paper-num {
                margin: auto;
            }
            .arrow {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 26px;
                border: none;
                background-color: rgb(0, 0, 0, 0);
                cursor: pointer;
            }
            .delete-paper-button {
                position: absolute;
                top: 10px;
                right: 50px;
                width: 15px;
                border: none;
                background-color: rgb(0, 0, 0, 0);
                cursor: pointer;
            }
        }
        .paper-config-body {
            background-color: #f2f2f2;
            padding-top: 10px;
            padding-left: 5%; //配置试卷区域的左边距
            .label-wrapper {
                text-align: right;
            }

            .paper-button-container {
        display: flex;
        flex-direction: row;
        .paper-item-container {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            background-color: #dcdcdc;
            border-radius: 20px;
            min-height: 33px;
            padding: 0 10px 0 10px;
            margin-left: 5px;

            .paper-type-text {
                color: var(--primary-active);
                font-size: 14px;
            }
            .paper-name-text {
                color: black;
                font-size: 14px;
                max-width: 350px;
                word-wrap: break-word;
            }
        }
    }
        }
    }


    .tip-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        .tooltip-text {
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            position: absolute;
            bottom: 150%;
            left: 50%;
            transform: translateX(-50%);
            white-space: pre-line;
            background-color: white;
            border: 1px solid #d7d7d7;
            border-radius: 4px;
            padding: 6px 8px;
            font-size: 12px;
            line-height: 1.4;
            z-index: 1;
            max-width: 200px;
            min-width: 120px;
        }

        &:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
    }

    .paper-choose-container.config-row,
    .exam-mode-container.config-row,
    .exam-time-container.config-row,
    .exam-duration-container.config-row,
    .order-manner-container.config-row,
    .grading-mode-container.config-row,
    .grading-config-container.config-row,
    .show-name-container.config-row,
    .marking-method-container.config-row,
    .grading-mode-button-container,
    .examinee-button-container.normal-button-container
    {
        display: flex;
        flex-wrap: nowrap;
        margin-top: 10px;
        padding-bottom: 10px;
        gap:10px;
    }

    .total-duration-text{
        font-size: 14px;
        color: #333;
    }
    
    .examinee-number-text {
                font-size: 14px;
            }
    
    .bottom-action-panel-fixed{
        display: flex;
        position: fixed;
        gap:20%;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        background-color: #fff;
        padding: 15px 20px;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        border-top: 1px solid #eee;
        z-index: 100;
        .cancel-action-button {
                width: 100px;
                height: 32px;
                background-color: white;
                border: 1px solid #dcdcdc;
                border-radius: 3px;
                font-size: 14px;
                // color: var(--text-primary);//
                cursor: pointer;
            }
            .save-action-button {
                border: none;
                background-color: blue;
                height: 32px;
                width: 100px;
                border-radius: 3px;
                color: white;
                cursor: pointer;
                
            }
            .save-action-button:hover {
                background-color: blue;//
            }
            .cancel-action-button:hover {
                border: 1px solid #0336ff;
                color: #3083ff;
            }
    }

    .edit-button {
        border: none;
        background-color: rgb(0, 0, 0, 0);
        cursor: pointer;
        color: var(--primary-color);
        font-size: 14px;
        margin: 0 5px;
    }
    .edit-button:hover {
        text-decoration: underline;
    }
</style>