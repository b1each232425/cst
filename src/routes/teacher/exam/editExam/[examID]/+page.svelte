<script>
    //@ts-nocheck
    import { goto } from "$app/navigation";
    import SmartEditor from "@3min/smart-edit";
    import RequiredLabel from "../../_components/RequiredLabel.svelte";
    import PaperSelectionPanel from "../../_components/PaperSelectionPanel.svelte";
    import ExamineeSelectionPanel from "../../_components/ExamineeSelectionPanel.svelte";
    import Button from "$lib/components/Button/Button.svelte";
    import DatePicker from "$lib/components/DatePicker/DatePicker.svelte"
    import Title from "$lib/components/Title/Title.svelte";
    import { page } from '$app/stores';

  import { onMount } from "svelte";
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
    let examMode = $state("00");
    let examExaminee = $state([]);
    //考生数量
    let examineeNum = $derived(examExaminee.length);
    let files = $state([]);
    let RichTextEditor; //富文本编辑器
    let examRooms = $state([]); //考试场地
    let invigilators = $state([]); //监考人员
    let examID = $state();
    let examineeID = $state([])
    //考试场次数组
    let paperConfigs = $state([
        {
            paperID: 0,
            paperType: "",
            paperName: "",
            periodMode: "00",
            startTime: "",
            endTime: "",
            duration: 0,
            maxDuration: 0,
            isOptionShuffled: false,
            isQuestionShuffled: false,
            questionShuffledMode: "00",
            markMethod: "00",
           nameVisibility: false,
            markMode: "10",
            gradingConfig: [],
            isHide: false,
            sessionNum: 1,
            markConfig: {
                teacher_markConfigs: [
                    // {
                    //     id: 0,
                    //     name: "",
                    // },
                ],
            },
            showPaperSelectionPanel: false,
            showGraderSelectionPanel: false,
           lateEntryTime: 1,
           earlySubmissionTime: 0,
        },
    ]);
    

    //总时长计算
    let totalDuration = $derived(calculateDuration(paperConfigs));
    let showPaperSelectionPanel = $state(false);
    let showExamineePanel = $state(false);
    let showActionToast = $state(false);
    let actionToast = $state(null);
    

    function addNewPaper() {
        let default_paper_config = {
            paperID: 0, //试卷ID
            paperType: "", //试卷类型
            paperName: "",
            periodMode: "00", //考试时间段模式
            startTime: "",
            endTime: "",
            duration: 0,
            maxDuration: 0,
            isOptionShuffled: false, //是否选项乱序
            isQuestionShuffled: false, //是否题目乱序
            questionShuffledMode: "00",
            markMethod: "00", //批卷方式
            nameVisibility: false,
            markMode: "10", //批改模式
            gradingConfig: [],
            isHide: false,
            sessionNum: 1,
            markConfig: {
                teacher_markConfigs: [

                ],
            },
            showPaperSelectionPanel: false,
            showGraderSelectionPanel: false,
           lateEntryTime: 1,
           earlySubmissionTime: 0,
        };
        paperConfigs = [...paperConfigs, default_paper_config];

        // 清空考场选择
        // examRooms = [];
        // invigilators = [];
    }

    function resetTime(index) {
        if (
            !paperConfigs[index].startTime &&
            !paperConfigs[index].endTime
        ) {
            paperConfigs[index].duration = 0;
            paperConfigs[index].maxDuration = 0;
            return;
        }
        const startTime = new Date(paperConfigs[index].startTime);
        const endTime = new Date(paperConfigs[index].endTime);

        const timeDifference = endTime.getTime() - startTime.getTime();
        const durationInSeconds = Math.floor(timeDifference / (1000 * 60));

        paperConfigs[index].duration = durationInSeconds;
        paperConfigs[index].maxDuration = durationInSeconds;
    }

    

    function onChooseStartTime(index) {
    return function(event) {
        const startDate = event.detail.date;
        if (startDate) {
            startDate.setSeconds(0, 0);
            const startISO = startDate.toISOString();
            paperConfigs[index].startTime = startISO;
            updateDuration(index);
        }
    };
}

    function onChooseEndTime(index) {
        return function(event) {
            const endDate = event.detail.date;
            if (endDate) {
                endDate.setSeconds(0, 0);
                const endISO = endDate.toISOString();
                paperConfigs[index].endTime = endISO;
                updateDuration(index);
            }
        };
    }

        /**
     * 将秒或毫秒时间戳转换为 "YYYY/MM/DD HH:mm" 格式
     * @param {number|string} ts - 秒或毫秒时间戳
     * @returns {string}
     */
    // function formatDateTime(ts) {
    //     if (!ts) return '';
    //     // 自动判断是秒还是毫秒
    //     const isMilli = String(ts).length > 10;
    //     const date = new Date(isMilli ? Number(ts) : Number(ts) * 1000);

    //     const Y = date.getFullYear();
    //     const M = String(date.getMonth() + 1).padStart(2, '0');
    //     const D = String(date.getDate()).padStart(2, '0');
    //     const h = String(date.getHours()).padStart(2, '0');
    //     const m = String(date.getMinutes()).padStart(2, '0');

    //     return `${Y}/${M}/${D} ${h}:${m}`;
    // }

    function updateDuration(index) {
        const startTime = paperConfigs[index].startTime;
        const endTime = paperConfigs[index].endTime;
        
        if (!startTime || !endTime) {
            paperConfigs[index].duration = 0;
            paperConfigs[index].maxDuration = 0;
            return;
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const timeDifference = end.getTime() - start.getTime();
        const durationInMinutes = Math.floor(timeDifference / (1000 * 60));

        paperConfigs[index].duration = Math.max(0, durationInMinutes);
        paperConfigs[index].maxDuration = Math.max(0, durationInMinutes);
    }

    function calculateDuration(paperConfigs) {
        let duration = 0;
        paperConfigs.forEach((element) => {
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
    /* 1. 必填字段校验（保持原逻辑） */
    if (examName === "") {
        actionToast.show("error", "请输入考试名称");
        return;
    }
    if (examName.length > 50) {
        actionToast.show("error", "考试名称不得超过50个字符");
        return;
    }
    if (examRules === "") {
        actionToast.show("error", "请输入考试规则");
        return;
    }
    if (examRules.length > 1000) {
        actionToast.show("error", "考试规则不得超过1000个字符");
        return;
    }
    if (paperConfigs.length <= 0) {
        actionToast.show("error", "请至少添加一个考试场次");
        return;
    }

    /* 2. 场次级校验（保持原逻辑） */
    for (let i = 0; i < paperConfigs.length; i++) {
        const session = paperConfigs[i];

        if (!session.startTime || session.startTime === "") {
            // actionToast.show("error", `第${i + 1}个场次未设置时间段`);
            return;
        }
        if (!session.endTime || session.endTime === "") {
            // actionToast.show("error", `第${i + 1}个场次未设置时间段`);
            return;
        }

        const startTime = new Date(session.startTime);
        const endTime   = new Date(session.endTime);
        const now       = new Date();
        
        if (startTime < now) {
            // actionToast.show("error", `第${i + 1}个场次的开始时间不能早于当前时间`);
            return;
        }
        if (endTime <= startTime) {
            // actionToast.show("error", `第${i + 1}个场次的结束时间必须晚于开始时间`);
            return;
        }
    }

    /* 3. 预处理场次数据（保持原逻辑） */
    for (let i = 0; i < paperConfigs.length; i++) {
        paperConfigs[i].sessionNum = i + 1;

        if (paperConfigs[i].isOptionShuffled && paperConfigs[i].isQuestionShuffled) {
            paperConfigs[i].questionShuffledMode = "00";
        } else if (paperConfigs[i].isOptionShuffled && !paperConfigs[i].isQuestionShuffled) {
            paperConfigs[i].questionShuffledMode = "02";
        } else if (!paperConfigs[i].isOptionShuffled && paperConfigs[i].isQuestionShuffled) {
            paperConfigs[i].questionShuffledMode = "04";
        } else {
            paperConfigs[i].questionShuffledMode = "06";
        }

        if (paperConfigs[i].markMethod === "02") {
            paperConfigs[i].markConfig.teacher_markConfigs = [];
            paperConfigs[i].markMode = "00";
        }

        paperConfigs[i].lateEntryTime   = paperConfigs[i].lateEntryTime   <= 0 ? 1 : paperConfigs[i].lateEntryTime;
        paperConfigs[i].earlySubmissionTime = paperConfigs[i].earlySubmissionTime <= 0 ? 0 : paperConfigs[i].earlySubmissionTime;
    }

    /* 4. 构造真正要提交的 JSON（完全使用用户输入） */
    const examSessionsdata = paperConfigs.map(cfg => ({
        PaperID:              cfg.paperID,
        PeriodMode:           cfg.periodMode,
        StartTime:            cfg.startTime  ? new Date(cfg.startTime).getTime() : 0,
        EndTime:              cfg.endTime    ? new Date(cfg.endTime).getTime()   : 0,
        Duration:             Number(cfg.duration) || 0,
        LateEntryTime:        Number(cfg.lateEntryTime)        || 0,
        EarlySubmissionTime:  Number(cfg.earlySubmissionTime) || 0,
        QuestionShuffledMode: cfg.questionShuffledMode,
        MarkMethod:           cfg.markMethod,
        NameVisibilityIn:     !!cfg.nameVisibility,
        ReviewerIds:          (cfg.markConfig && cfg.markConfig.teacher_markConfigs)
                                ? cfg.markConfig.teacher_markConfigs.map(t => t.id)
                                : [],
        MarkMode:             cfg.markMode,
        SessionNum:           cfg.sessionNum,
    }));

    // 附加文件：若用户上传了文件，则遍历填充；否则留空数组
    const fileArr = files.length
        ? files.map(f => ({ Name: f.name, Url: f.url || "" }))
        : [];

    const examData = {
        data:{
            examInfo: {
            Name:   examName,
            Rules:  examRules,
            Type:   examType,
            Mode:   examMode,
            Files:  fileArr,
        },
        examSessions: examSessionsdata,
        examinee:     examExaminee.map(e => e.id ?? e),          // 用户选中的考生 id 数组
        invigilators: invigilators.map(i => i.id), // 监考员 id 数组
        }
    };
         
    console.log("examDATA",examData);
    /* 5. 发送请求（去掉写死的 DATA，直接发送 examData） */
    try {
        const res = await fetch("/api/exam", {
            method:  "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(examData),
        });
        const result = await res.json();
        if (result.status === 0) {
            goto("/teacher/exam");
        } else {
           
        }
    } catch (e) {
        console.error(e);
       
    }
}

    async function fetchSelectedStudents(){
        fetch(`/api/exam/examinee`,{
            method:'GET',
            credentials:"include",
            headers:{
                "Content-Type":"application/json",
            },
        })
        .then((response)=>response.json())
        .then((data)=>{
            if(data.status===0)
            {
                examExaminee=data.data;
                return;
            }
        })
        .catch((e) => {
            console.error("获取考试信息失败", e);
        });
    }

    async function fetchExamInfo() {
        //const examSessionsdata
        fetch(`/api/exam?exam_id=${examID}`,{
            method:"GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then((response) => response.json())
        .then((data) =>{
            if(data.status === 0)
            {
                // console.log("data",data);
                const examData = data.data;
                examName = examData.examInfo.Name;
                examRules = examData.examInfo.Rules;
                examType = examData.examInfo.Type;
                examMode = examData.examInfo.Mode;
                examineeID = examData.examinee ||[1];
                // invigilators = examData.invigilators.map(i => ({ id: i }));
                paperConfigs = examData.examSessions.map((s, idx) => {
                /* 根据 QuestionShuffledMode 还原两个 checkbox */
                // const mode = s.QuestionShuffledMode || "06";
                // const isQuestionShuffled = ["00", "04"].includes(mode);
                return {
                    paperID: s.PaperID || 0,
                    periodMode: "00",       // 默认固定
                    startTime: s.StartTime ? s.StartTime : "",
                    endTime:   s.EndTime   ? s.EndTime   : "",
                    duration:  s.Duration  || 0,
                    maxDuration: s.Duration || 0,

                    // isOptionShuffled,
                    // isQuestionShuffled,
                    // questionShuffledMode: mode,

                    markMethod: s.MarkMethod || "00",
                    nameVisibility: !!s.NameVisibilityIn,
                    markMode: s.MarkMode || "10",
                    gradingConfig: [],
                    isHide: false,
                    sessionNum: s.SessionNum,

                    // markConfig: {
                    //     teacher_markConfigs: (s.ReviewerIds || []).map(id => ({ id, name: "" })),
                    // },

                    showPaperSelectionPanel: false,
                    showGraderSelectionPanel: false,
                    lateEntryTime: s.LateEntryTime   || 1,
                    earlySubmissionTime: s.EarlySubmissionTime || 0,
                };
            });
                   
            }
        })
        .catch((e) => {
            console.error("获取考试信息失败", e);
        });
    }
    onMount(()=>{
        page.subscribe(value => {
        examID = value.params.examID;
    });
        fetchSelectedStudents();
        fetchExamInfo();
         console.log("examinee",examExaminee);
    })
</script>

<Title title="创建考试" line={true} />
<div class="createExamWrapper">
    <div class="createExamContainer">
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
                        <img class="tip" alt="提示" src="/exam_list/tip.png" />
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
                       <img class="tip" alt="提示" src="/exam_list/tip.png" />
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
                        bind:group={examMode}
                        value={"00"}
                        class="choice-radio-input"
                        disabled={examType === '04'}
                    />
                    线上考试
                    <span class="tip-wrapper">
                        <img class="tip" alt="提示" src="/exam_list/tip.png" />
                        <div class="tooltip-text">{TIP_TEXT["online"]}</div>
                    </span>
                </label>
            </div>
        </div>

         <div class="paper-configs-container">
            <RequiredLabel text="配置试卷" />
            <div class="paper-configs">
                {#each paperConfigs as _, index}
                <div></div> <!-- 左侧占位，与标签对齐 -->
                    {@render paperConfig(index)}
                {/each}

                
                <Button
                    size="small"
                    onclick={() => {
                        addNewPaper();
                    }}>添加试卷</Button
                >
            </div>
        </div>

         <div class="total-duration-container">
            <RequiredLabel text="总考试时长" />
            <div class="total-duration-input-container">
                <span class="total-duration-text">{totalDuration}</span>
                <span class="total-duration-text">&nbsp;&nbsp;&nbsp;分钟</span>
            </div>
        </div>

        <div class="examinee-container">
            <RequiredLabel text="考试人员" colon={false}  Asterisk={false}/>
            <div class="examinee-button-container normal-button-container">
                    <Button
                        type="primary"
                        size="small"
                        onclick={() => {
                            showExamineePanel = true;
                            }}>
                            考生选择
                    </Button>
                <div class="examinee-number-container">
                    <span class="examinee-number-text">已选择 </span>
                    <span
                        class="examinee-number-text {(examExaminee.length === 0) && examMode === "02"
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
                    goto("/teacher/exam");
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

{#snippet paperConfig(/** @type {number} */ paperConfigIndex)}
    <div class="paper-config-container">
        <div class="paper-config-head">
            <span class="paper-num">试卷{paperConfigIndex + 1}</span>
            <button
                class={paperConfigIndex != 0 ? "delete-paper-button" : "hide"}
                onclick={() => {
                    paperConfigs.splice(paperConfigIndex, 1);
                    // 清空考场选择
                     examRooms = [];
                     invigilators = [];
                }}><img src="/exam_list/delete.svg" alt="删除" /></button
            >
            <button
                class="arrow"
                onclick={() => {
                    paperConfigs[paperConfigIndex].isHide =
                        !paperConfigs[paperConfigIndex].isHide;
                }}
                ><img src="/dropdown/arrow_black.png" alt="展开/收起" /></button
            >
        </div>

            <div class="paper-config-body {paperConfigs[paperConfigIndex].isHide ? 'hide' : 'show'}">
                <div class="paper-choose-container config-row">
                    <RequiredLabel text="试卷" />
                    <div class="config-row-content">
                        <div class="paper-button-container normal-button-container">
                            {#if paperConfigs[paperConfigIndex].paperID === 0}
                                    <Button
                                    size="small"
                                    type="primary"
                                    onclick={() => {
                                        paperConfigs[
                                            paperConfigIndex
                                        ].showPaperSelectionPanel = true;
                                    }}>试卷选择</Button>

                                {:else}
                                <div class="paper-item-container">
                                    {#if !paperConfigs[paperConfigIndex].paperType || !paperConfigs[paperConfigIndex].paperName}
                                        <span class="paper-type-text">未知试卷</span
                                        >
                                    {:else}
                                        <span class="paper-type-text">
                                            {ASSEMBLY_TYPE_MAP[ paperConfigs[paperConfigIndex].paperType]}：
                                        </span>

                                        <span class="paper-name-text"
                                            >{paperConfigs[paperConfigIndex]
                                                .paperName}</span
                                        >
                                    {/if}
                                    <button
                                        class="edit-button"
                                        onclick={() => {
                                            paperConfigs[
                                                paperConfigIndex
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
                                    bind:group={paperConfigs[paperConfigIndex].periodMode}
                                    value={"00"}
                                    class="choice-radio-input"
                                    onchange={() => {
                                        if (paperConfigs[paperConfigIndex].periodMode === "00") {
                                            resetTime(paperConfigIndex);
                                        }
                                    }}
                                />
                                固定时段考试

                                <span class="tip-wrapper">
                                    <img class="tip" alt="提示" src="/exam_list/tip.png" />
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
                            <!-- <DateTimePicker
                                start_date={new Date()}
                                end_date={new Date()}
                                onSelectDate={onChooseTime(paperConfigIndex)}
                                min_date={paperConfigIndex === 0
                                    ? new Date()
                                    : new Date(
                                        paperConfigs[
                                            paperConfigIndex - 1
                                        ].endTime,
                                    )}
                                        on:startDateSelected={onChooseTime(paperConfigIndex)}
                                on:endDateSelected={onChooseTime(paperConfigIndex)}
                            ></DateTimePicker> -->
                            
                           <!-- 只有在paperConfigs数据准备好后才渲染DatePicker -->
                            {#if paperConfigs[paperConfigIndex] && paperConfigs[paperConfigIndex].startTime}
                                <DatePicker
                                    key={`${paperConfigIndex}-${paperConfigs[paperConfigIndex].startTime}`}
                                    isTimeSelection={true}
                                    initialStartDate={new Date(paperConfigs[paperConfigIndex].startTime)}
                                    initialEndDate={paperConfigs[paperConfigIndex].endTime ? new Date(paperConfigs[paperConfigIndex].endTime) : null}
                                    inputWidth={'350px'}
                                    singleDateSelection={false}
                                    on:startDateSelected={onChooseStartTime(paperConfigIndex)}
                                    on:endDateSelected={onChooseEndTime(paperConfigIndex)}
                                />
                            {:else}
                                <DatePicker
                                    key={paperConfigIndex}
                                    isTimeSelection={true}
                                    initialStartDate={null}
                                    initialEndDate={null}
                                    inputWidth={'350px'}
                                    singleDateSelection={false}
                                    on:startDateSelected={onChooseStartTime(paperConfigIndex)}
                                    on:endDateSelected={onChooseEndTime(paperConfigIndex)}
                                />
                            {/if}
                        </div>
                    </div>

                    <div class="exam-duration-container config-row">
                        <RequiredLabel text="考试时长" />
                        <div class="config-row-content">
                            <input
                                class="duration-input"
                                bind:value={
                                    paperConfigs[paperConfigIndex].duration
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
                                    bind:value={paperConfigs[paperConfigIndex].lateEntryTime}
                                    type="number"
                                    min="1"
                                    max="{paperConfigs[paperConfigIndex].duration}"
                                    style="width:60px;"
                                    oninput={(event)=>{
                                        const max = paperConfigs[paperConfigIndex].duration;
                                        const val = Number(event.target.value);
                                        if (val > max) {
                                            event.target.value = max;
                                            paperConfigs[paperConfigIndex].lateEntryTime = max;
                                        }else if(val < 1){
                                            event.target.value = 1;
                                            paperConfigs[paperConfigIndex].lateEntryTime = 1;
                                        }
                                    }}
                                />
                            <span style="font-size: 14px;">分钟内可进入考场，可提前</span>
                            <input
                                class="duration-input"
                                bind:value={paperConfigs[paperConfigIndex].earlySubmissionTime}
                                type="number"
                                min="0"
                                max="{paperConfigs[paperConfigIndex].duration}"
                                style="width:60px;"
                                oninput={(event)=>{
                                    const max = paperConfigs[paperConfigIndex].duration;
                                    const val = Number(event.target.value);
                                    if (val > max) {
                                        event.target.value = max;
                                        paperConfigs[paperConfigIndex].earlySubmissionTime = max;
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
                                        paperConfigs[paperConfigIndex]
                                            .isOptionShuffled
                                    }
                                />
                                选项乱序
                            </label>
                            <label class="label">
                                <input
                                    type="checkbox"
                                    class="choice-radio-input"
                                    bind:checked={
                                        paperConfigs[paperConfigIndex]
                                            .isQuestionShuffled
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
                                        paperConfigs[paperConfigIndex].markMethod
                                    }
                                    value={"00"}
                                    class="choice-radio-input"
                                />
                                人工批卷
                            </label>

                            <label class="label">
                                <input
                                    type="radio"
                                    bind:group={
                                        paperConfigs[paperConfigIndex].markMethod
                                    }
                                    value={"02"}
                                    class="choice-radio-input"
                                />
                                自动批卷
                            </label>
                        </div>
                    </div>

                    <div
                        class="show-name-container {paperConfigs[paperConfigIndex]
                            .markMethod !== '00'
                            ? 'hide'
                            : ' config-row'}"
                    >
                        <RequiredLabel text="批改时是否显示考生姓名：" Asterisk={false} colon={false} />
                        <div class="config-row-content">
                            <label class="label">
                                <input
                                    type="radio"
                                    bind:group={
                                        paperConfigs[paperConfigIndex]
                                            .nameVisibility
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
                                        paperConfigs[paperConfigIndex]
                                            .nameVisibility
                                    }
                                    value={false}
                                    class="choice-radio-input"
                                />
                                否
                            </label>
                        </div>
                    </div>
        
                    <div
                        class="grading-config-container {paperConfigs[
                            paperConfigIndex
                        ].markMethod !== '00'
                            ? 'hide'
                            : ' config-row'}"
                    >
                        <RequiredLabel text="批改配置" Asterisk={false} />
                        <div class="config-row-content graders-container">
                            <div class = "graders-type-1">
                                <!-- <button
                                    class="add-graders-button"
                                    onclick={() => {
                                        paperConfigs[
                                            paperConfigIndex
                                        ].showGraderSelectionPanel = true;
                                    }}
                                    ><img
                                        src="/add.svg"
                                        alt="添加"
                                        style="height: 14px; margin-right:5px"
                                    />添加批阅员</button
                                > -->

                                <Button
                                    size="small"
                                    onClick={() => {
                                        paperConfigs[paperConfigIndex].showGraderSelectionPanel = true;
                                    }}
                                >
                                    <img
                                        src="/exam_list/add.svg"
                                        alt="添加"
                                        style="height: 10px; margin-right:5px"
                                    />添加批阅员
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div
                        class="grading-mode-container {paperConfigs[
                            paperConfigIndex
                        ].markMethod !== '00'
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
                                                paperConfigs[paperConfigIndex].markMode
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
                    selected_id={paperConfigs[paperConfigIndex].paperID}
                    selected_name={paperConfigs[paperConfigIndex].paperName}
                    selected_type={paperConfigs[paperConfigIndex].paperType}
                    showPanel={paperConfigs[paperConfigIndex]
                        .showPaperSelectionPanel}
                    onCancel={() => {
                        paperConfigs[paperConfigIndex].showPaperSelectionPanel =
                            false;
                    }}
                    onConfirm={(
                        /** @type {number} */ selected_id,
                        /** @type {string} */ selected_name,
                        /** @type {string} */ selected_type,
                    ) => {
                        paperConfigs[paperConfigIndex].showPaperSelectionPanel =
                            false;
                        paperConfigs[paperConfigIndex].paperID = selected_id;
                        paperConfigs[paperConfigIndex].paperName = selected_name;
                        paperConfigs[paperConfigIndex].paperType = selected_type;
                    }}
        ></PaperSelectionPanel>

        <ExamineeSelectionPanel
            showPanel={showExamineePanel}
            onConfirm={(selected) => {
                //确认后将选择的考生取出
                showExamineePanel = false;
                examExaminee = selected;
            }}
            onCancel={(/** @type {boolean} */ load_new_file) => {
                showExamineePanel = false;
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
        overflow-y: auto;
        overflow-x: auto;
        padding-bottom: 5%;
        padding-top:10px;
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
        .tip{
            width: 14px;
            height: auto;
        }
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
        .duration-input{
            width: 50px;
        }
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