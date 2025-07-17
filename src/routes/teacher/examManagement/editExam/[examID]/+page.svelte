<!-- 
 /*
 * @Author: 宇昕 马 1243805308@qq.com
 * @Date: 2025-04-10 10:37:39
 * @LastEditors: Mayux && 1243805308@qq.com
 * @LastEditTime: 2025-07-08 16:47:46
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\examManagement\editExam\[ExamID]\+page.svelte
 * @Description: 更新考试页
 * @Copyright: Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->

<script>
    import { goto } from "$app/navigation";
    import DateTimePicker from "$lib/component/DatePicker/DateTimePicker.svelte";
    import DropdownBlueWithSearch from "$lib/component/DropdownBlueWithSearch.svelte";
    import MultipleChoicesDropdownBlue from "$lib/component/MultipleChoicesDropdownBlue.svelte";
    import { onDestroy, onMount } from "svelte";
    import ExamineeSelectionPanel from "../../ExamineeSelectionPanel.svelte";
    import GradersSelectionPanel from "../../GradersSelectionPanel.svelte";
    import PaperSelectionPanel from "../../PaperSelectionPanel.svelte";
    import ProctorsSelectionTable from "../../ProctorsSelectionTable.svelte";
    import Dialog from "$lib/component/Dialog.svelte";
    import ActionToast from "$lib/component/ActionToast.svelte";
    import ExamRoomsSelectionPanel from "../../ExamRoomsSelectionPanel.svelte";
    import SmartEditor from "@3min/smart-edit";
    import Title from "$lib/component/Title.svelte";

    /**
     * @typedef {import('@3min/cst-tiptap/dist/types').PiptapEditor} PiptapEditor
     */

    const TIP_TEXT = {
        final_exam:
            "当一门考试的考试性质为期末成绩考试时，它将决定学生在此课程的最终期末成绩",
        qualifying_exams:
            "当一门考试是资格证考试时，学生需要前往线下考点进行考试",
        online: "考生可以通过互联网在任何地方登录网站进行考试，无需到特定地点",
        offline: "要求考生到指定的考点机房现场参加考试，并通过网站进行操作",
        fixed: "固定时段考试：考试时长=结束时间-开始时间",
        flexible: "灵活时段考试：考试时长<=结束时间-开始时间",
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

    let exam_id = $state(0);

    //考试名称
    let exam_name = $state("");

    //考试规则
    let exam_rules = $state(DEFAULT_RULES);

    //考试类型
    let exam_type = $state("00");

    //考试方式
    let exam_method = $state("00");

    // 存储初始数据用于比较
    let initial_exam_data = $state(null);

    // 保存第一场考试的开始日期
    let basic_date = $state(new Date());

    // 联动逻辑：考试类型和方式、时段
    $effect(() => {
        if (exam_type === '04') {
            exam_method = '02';

            // 为所有试卷配置自动勾选选项乱序和题目乱序
            paper_configs.forEach(config => {
                config.is_option_shuffled = true;
                config.is_question_shuffled = true;
            });
        }
    });

    // 监听考试方式变化
    $effect(() => {
        if (exam_method === "02") {
            // 线下考试
            // 将所有场次的考试时段模式设置为固定时段
            paper_configs.forEach((config) => {
                config.period_mode = "00";
            });
        }
    });

    /**
     * @type {any[]}
     */
    let exam_examinee = $state([]);

    //文件列表
    /**
     * @type {File[]}
     */
    let files = $state([]);

    /**
     * @type {any[]}
     */
    let files_info = $state([]);

    //课程列表（暂无）
    let course_list = $state([
        {
            id: "1",
            name: "暂无",
        },
    ]);

    //章节列表（暂无）
    let chapter_list = $state([
        {
            id: "1",
            name: "暂无",
        },
    ]);

    let course_option = $derived(courseListToOption(course_list));
    let chapter_option = $derived(chapterListToOption(chapter_list));

    //考试场次数组
    /**
     * @type {any[]}
     */
    let paper_configs = $state([]);

    let exam_session_count = $state(1);

    //考场(线下考试需配置)
    /**
     * @type {any[]}
     */
    let exam_rooms = $state([

    ])

    // 计算所有考场容量的总和
    let total_capacity = $derived(exam_rooms.reduce((sum, room) => sum + (room.capacity || 0), 0));

    //监考员
    /**
     * @type {any[]}
     */
    let invigilators = $state([
        // {
        //     id:0,
        //     name:"",
        // }
    ])

    //是否显示考生选择面板
    let show_examinee_panel = $state(false);

    //是否显示监考员选择面板
    let show_proctors_panel = $state(false);

    //是否显示考场选择面板
    let show_exam_room_panel = $state(false);

    //总时长计算
    let total_duration = $derived(calculateDuration(paper_configs));

    let file_input = $state(null);

    let show_action_toast = $state(false);

    let action_toast = $state(null);

    let showLockDialog = $state(false);

    let lockCheckTimer = $state(null);

    let cancel_edit_exam_dialog = $state(false);
    
    let need_invigilator_count = $derived(exam_rooms.reduce((sum, room) => sum + room.invigilator_count, 0));

    let start_time = $derived(paper_configs.length > 0 
        ? new Date(Math.min(...paper_configs.map(config => new Date(config.start_time).getTime())))
        : new Date());
    let end_time = $derived(paper_configs.length > 0
        ? new Date(Math.max(...paper_configs.map(config => new Date(config.end_time).getTime())))
        : new Date());


    /**
     * 富文本编辑器组件实例
     * @type {SmartEditor}
     */
    let rich_text_editor;

    //获取考试详情
    onMount(async () => {
        const pathParts = window.location.pathname.split("/");
        const lastSegment = pathParts[pathParts.length - 1];

        // 过滤空字符串（处理末尾带/的情况）
        const cleanLastSegment = lastSegment.replace(/^\s+|\s+$/g, "");

        if (/^\d+$/.test(cleanLastSegment)) {
            //通过路径获取examID并查询考试详情
            const examID = parseInt(cleanLastSegment);

            const lockResult = await getExamLock(examID);
            if (lockResult == 0) {
                 await getExamDetails(examID);
            } else if (lockResult == -18) {
                showLockDialog = true;
                return;
            } else {
                action_toast.show("error", "用户无权访问");
                goto("/teacher/examManagement");
            }
        } else {
            alert("考试" + cleanLastSegment + "不存在");
            goto("/teacher/examManagement");
        }
    });

    onDestroy(() => {
        if (lockCheckTimer) {
            clearInterval(lockCheckTimer);
            lockCheckTimer = null;
        }
    });

    /**
     * 获取考试锁
     * @param {number} examID
     */
    async function getExamLock(examID) {
        const response = await fetch(`/api/exam/${examID}/lock`, {
            method: "GET",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -18) {
                action_toast.show("error", "考试正在被编辑，请稍后重试");
                return -18;
            }else if (result.status == -20) {
                action_toast.show("error", "用户无权访问");
                return -20;
            }
            return 0;
        } else {
            const responseMsg = await response.text();
            console.error(`获取编辑考试权限失败：${responseMsg}`);
            return -1;
        }
    }

    // 退出后释放锁
    async function releaseLock() {
        const response = await fetch(`/api/exam/${exam_id}/lock`, {
            method: "DELETE",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -19) {
                action_toast.show("error", "释放编辑考试权限失败");
                return false;
            }
            return true;
        } else {
            const responseMsg = await response.text();
            action_toast.show("error", "释放编辑考试权限失败");
            console.error(`释放编辑考试权限失败：${responseMsg}`);
            return false;
        }
    }

    //  刷新用户对考试的锁
    async function refreshLock() {
        const response = await fetch(`/api/exam/${exam_id}/lock`, {
            method: "PUT",
            credentials: "include",
        });
        if (response.ok) {
            const result = await response.json();
            if (result.status == -1) {
                action_toast.show("error", "获取编辑考试权限失败");
                clearInterval(lockCheckTimer);
                lockCheckTimer = null;
                return false;
            }
            return true;
        } else {
            const responseMsg = await response.text();
            action_toast.show("error", "获取编辑考试权限失败");
            console.error(`获取编辑考试权限失败：${responseMsg}`);
            return false;
        }
    }


    // 启动计时器，每过段时间刷新用户对这个试卷的锁
    function startLockCheckTimer() {
        lockCheckTimer = setInterval(() => {
            refreshLock();
        }, 60000);
    }

    /**
     * @param {number} examID
     */
    async function getExamDetails(examID) {
        if (examID && typeof examID === "string") {
            console.error("examID is string");
            return;
        }

        // 获取考试详情
        const response = await fetch(
            `/api/teacher/exam/getExamDetails?exam_id=${examID}`,
            {
                method: "GET",
                credentials: "include",
            },
        );

        const data = await response.json();

        if (data.Status === 0) {
            //处理响应
            let exam_info = data.Data.exam_info;
            exam_id = exam_info.ID;
            exam_name = exam_info.Name;
            exam_method = exam_info.Mode;
            exam_rules = exam_info.Rules;

            // 将获取来的考试规则赋值给富文本编辑器来初始化

            rich_text_editor?.setContentWithoutHistory(
                exam_info.Rules ? exam_info.Rules : "",
            );

            exam_type = exam_info.Type;
            files_info = exam_info.Files;

            let exam_sessions = data.Data.exam_sessions;
            exam_sessions.forEach((element) => {
                //处理需要计算出来的属性

                const start = new Date(element.start_time);
                const end = new Date(element.end_time);
                const diffInMinutes = Math.floor(
                    (end.getTime() - start.getTime()) / (1000 * 60),
                );
                element.max_duration = diffInMinutes;

                //乱序方式
                switch (element.question_shuffled_mode) {
                    case "00":
                        element.is_question_shuffled = true;
                        element.is_option_shuffled = true;
                        break;
                    case "02":
                        element.is_question_shuffled = false;
                        element.is_option_shuffled = true;
                        break;
                    case "04":
                        element.is_question_shuffled = true;
                        element.is_option_shuffled = false;
                        break;
                    case "06":
                        element.is_question_shuffled = false;
                        element.is_option_shuffled = false;
                        break;
                    default:
                        element.is_question_shuffled = false;
                        element.is_option_shuffled = false;
                        break;
                }

                element.is_hide = false;
                element.show_paper_selection_panel = false;
                element.show_graders_selection_panel = false;
                if (element.mark_config.teacher_mark_configs === null) {
                    element.mark_config.teacher_mark_configs = [];
                }
                if (element.mark_mode === "00") {
                    element.mark_mode = "10";
                }
            });

            paper_configs = exam_sessions;

            let students = data.Data.students.imported_students;
            console.log(students)
            exam_examinee = students || [];

            exam_rooms = data.Data.exam_rooms;

            data.Data.invigilators.forEach(element => {
                invigilators.push({
                    id: element,
                    name: "",
                });
            });

            basic_date = new Date(exam_sessions[0].start_time);

            exam_session_count = exam_sessions.length;

            // 保存初始数据
            initial_exam_data = {
                exam_info: {
                    exam_id: exam_id,
                    name: exam_name,
                    rules: exam_rules,
                    type: exam_type,
                    method: exam_method,
                    files: files_info ? [...files_info] : [],
                },
                exam_sessions: JSON.parse(JSON.stringify(paper_configs)),
                students: {
                    imported_students: exam_examinee ? [...exam_examinee] : [],
                },
                exam_rooms: exam_rooms ? [...exam_rooms] : [],
                invigilators: invigilators ? [...invigilators] : [],
            };

            // 启动计时器，每过段时间刷新用户对这个试卷的锁
            startLockCheckTimer();
        } else {
            action_toast.show("error", "获取考试详情失败");
        }
    }

    /**
     * @param {string} path
     * @param {string} file_name
     */
    async function getExamFiles(path, file_name) {
        try {
            const response = await fetch(
                `/api/files/?path=${path}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let filename = file_name;

            // 获取文件内容
            const blob = await response.blob();

            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // 清理
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("下载附件失败:", error);
            alert("下载附件失败，请稍后重试");
        }
    }

    // 处理文件选择
    function handleFileSelect(event) {
        // 将 FileList 转换为数组并添加到 files 中
        const newFiles = Array.from(event.target.files);
        files = [...files, ...newFiles];
    }

    // 处理文件删除
    /**
     * @param {number} index
     */
    function removeFile(index) {
        files = files.filter((_, i) => i !== index);
        if (file_input) {
            file_input.value = "";
        }
    }

    // 触发文件选择对话框
    function triggerFileInput() {
        file_input.click();
    }

    //添加新一张试卷配置
    function addNewPaper() {
        let default_paper_config = {
            paper_id: 0, //试卷ID
            paper_type: "", //试卷类型
            paper_name: "",
            period_mode: "00", //考试时间段模式
            start_time: new Date(),
            end_time: new Date(),
            duration: 0,
            max_duration: 0,
            is_option_shuffled: false, //是否选项乱序
            is_question_shuffled: false, //是否题目乱序
            question_shuffled_mode: "00",
            mark_method: "00", //批卷方式
            name_visibility: false,
            mark_mode: "02", //批改模式
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
            show_paper_selection_panel: false,
            show_graders_selection_panel: false,
        };
        paper_configs = [...paper_configs, default_paper_config];

        // 清空考场选择
        exam_rooms = [];

        // 清空监考员选择
        invigilators = [];
    }

    /**
     * 计算总时长
     * @param {any[]} paper_configs
     */
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

    /**
     * 将课程信息转为下拉框可用的数据格式
     * @param {{ id: string; name: string; }[]} course_list
     */
    function courseListToOption(course_list) {
        /**
         * @type {{ value: string; label: string; }[]}
         */
        let options = [];
        course_list.forEach(
            (/** @type {{ id: string; name: string; }} */ course) => {
                options.push({ value: course.id, label: course.name });
            },
        );
        return options;
    }

    /**
     * //将章节信息转为下拉框可用的数据格式
     * @param {{ id: string; name: string; }[]} chapter_list
     */
    function chapterListToOption(chapter_list) {
        /**
         * @type {{ value: string; label: string; }[]}
         */
        let options = [];
        chapter_list.forEach(
            (/** @type {{ id: string; name: string; }} */ chapter) => {
                options.push({ value: chapter.id, label: chapter.name });
            },
        );
        return options;
    }

    /**
     * @param {number} index
     * 选择考试的开始时间和结束时间
     */
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
            
            if(exam_session_count > 0){
                exam_session_count --;
            }else{
                exam_rooms = [];
                invigilators = [];
            }
        };
    }

    /**
     * @param {number} index
     */
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
    
    // 检查数据是否有改动
    function hasChanges() {
        if (!initial_exam_data) return true;
        
        if (files.length>0){
            return true
        }

        const current_data = {
            exam_info: {
                exam_id: exam_id,
                name: exam_name,
                rules: exam_rules,
                type: exam_type,
                method: exam_method,
                files: files_info || [],
            },
            exam_sessions: paper_configs.map(session => ({
                ...session,
                start_time: session.start_time ? new Date(session.start_time).toISOString().replace('.000Z', 'Z') : null,
                end_time: session.end_time ? new Date(session.end_time).toISOString().replace('.000Z', 'Z') : null,
            })),
            students: {
                imported_students: exam_examinee || [],
            },
            exam_rooms: exam_rooms || [],
            invigilators: invigilators || [],
        };

        const initial_data = {
            ...initial_exam_data,
            exam_info: {
                ...initial_exam_data.exam_info,
                files: initial_exam_data.exam_info.files || [],
            },
            exam_sessions: initial_exam_data.exam_sessions.map(session => ({
                ...session,
                start_time: session.start_time ? new Date(session.start_time).toISOString().replace('.000Z', 'Z') : null,
                end_time: session.end_time ? new Date(session.end_time).toISOString().replace('.000Z', 'Z') : null,
            })),
            students: {
                imported_students: initial_exam_data.students.imported_students || [],
            },
            exam_rooms: initial_exam_data.exam_rooms || [],
            invigilators: initial_exam_data.invigilators || [],
        };

        return JSON.stringify(current_data) !== JSON.stringify(initial_data);
    }

    async function handleSubmit() {
        // 检查是否有改动
        if (!hasChanges()) {
            goto("/teacher/examManagement");
            return;
        }

        //必填字段校验
        if (exam_name === "") {
            action_toast.show("error", "请输入考试名称");
            return;
        }

        if (exam_name.length > 50) {
            action_toast.show("error", "考试名称不得超过50个字符");
            return;
        }

        if (exam_rules === "") {
            action_toast.show("error", "请输入考试规则");
            return;
        }

        if (exam_rules.length > 1000) {
            action_toast.show("error", "考试规则不得超过1000个字符");
            return;
        }
        // 创建考试时可以暂时不选择考生
        // if (exam_examinee.length < 1) {
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

            if (exam_examinee.length > 0 && exam_examinee.length < exam_rooms.length && exam_method === "02") {
                action_toast.show("error", `考生总数不能小于考场总数`);
                return;
            }

            if (exam_examinee.length > 0 && exam_examinee.length > total_capacity && exam_method === "02") {
                action_toast.show("error", `考生总数不能超过考场总容量`);
                return;
            }

            if (invigilators.length > 0 && invigilators.length !== need_invigilator_count && exam_method === "02") {
                action_toast.show("error", `监考员总数不等于需求总数`);
                return;
            }
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
            paper_configs[i].early_submission_time = paper_configs[i].early_submission_time<0?0:paper_configs[i].early_submission_time
        }

        //如果是线上考试，则不需要考场和监考员（暂时）
        if(exam_method === "00"){
            exam_rooms = [];
            invigilators = [];
        }

        const formData = new FormData();

        if (files) {
            // 添加文件
            for (let file of files) {
                formData.append("files", file);
            }
        }

        let invigilatorsIDs = []
        invigilators.forEach(element => {
            invigilatorsIDs.push(element.id)
        });

        let exam_data = {
            exam_info: {
                exam_id: exam_id,
                name: exam_name,
                rules: exam_rules,
                type: exam_type,
                method: exam_method,
                files: files_info,
                status: "00",
                updated_by: "teacher", // 添加更新者标识
                updated_at: new Date().toISOString(), // 添加更新时间
            },
            exam_sessions: paper_configs, //考试场次
            students: {
                imported_students: exam_examinee,
            }, //学生信息
            exam_rooms:exam_rooms,
            invigilators:invigilatorsIDs,
        };

        formData.append("data", JSON.stringify(exam_data));

        fetch("/api/teacher/exam/updateExam", {
            method: "POST",
            credentials: "include",
            body: formData,
        })
            .then((response) => response.json())
            .then((result) => {
                if (result.Status === 0) {
                    action_toast.show("success", "考试修改成功！");
                    releaseLock();
                    goto("/teacher/examManagement");
                }
                else if (result.Status === -25) {
                    action_toast.show("error", "考试修改失败，当前考试不处于未发布和待开始状态, 即将返回考试列表...");
                    setTimeout(() => {
                        releaseLock();
                        goto("/teacher/examManagement");
                    }, 2000);
                }
                else {
                    action_toast.show("error", "考试修改失败，请稍后重试");
                    console.error(result.Msg);
                }
            })
            .catch((error) => {
                action_toast.show("error", "考试修改失败，请稍后重试");
                console.error(error);
                alert("修改考试失败，请稍后重试");
            });
    }

    // 添加下载文件的函数
    /**
     * @param {Blob | MediaSource} file
     */
    function downloadFile(file) {
        // 创建一个临时的URL
        const url = URL.createObjectURL(file);

        // 创建一个临时的a标签来触发下载
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 更新批改模式
    function updateMarkMode(paper_index) {
        const graderCount = paper_configs[paper_index].mark_config.teacher_mark_configs.length;
        if (graderCount <= 1) {
            paper_configs[paper_index].mark_mode = "10";
        } else {
            if (paper_configs[paper_index].mark_mode === "10") {
                paper_configs[paper_index].mark_mode = "02";
            }
        }
    }

    // 修改批阅员选择面板的确认回调
    function onGradersConfirm(paper_index, selected_ids) {
        paper_configs[paper_index].show_graders_selection_panel = false;
        paper_configs[paper_index].mark_config.teacher_mark_configs = selected_ids.map(
            (element) => ({
                id: element.id,
                name: element.name,
                mark_count: 0,
                mark_question_groups: [],
            }),
        );
        updateMarkMode(paper_index);
    }
</script>

<div class="create-exam-wrapper">
    <div class="create-exam-container">
        <Title title="编辑考试" />

        <div class="exam-name-input-container">
            <span class="label-wrapper">
                <span class="required-icon">*</span>
                考试名称：
            </span>
            <input
                placeholder="请输入考试名称（例：xxx平时考试）"
                class="exam-name-input"
                bind:value={exam_name}
                maxlength={50}
            />
        </div>
        <div class="exam-rule-input-container">
            <span class="label-wrapper">
                <span class="required-icon">*</span>
                考试规则：
            </span>
            <div class="rule-input-container">
                <SmartEditor
                    bind:this={rich_text_editor}
                    width = {"100%"}
                    height = {"400px"}
                    editor_options={{ ...EDITOR_OPTIONS, placeholder: "请输入考试规则",
                    onContentChange: (
                        /**
                            * @type {PiptapEditor}
                            */
                        editor,
                    ) => {
                        exam_rules = editor.getPreviewHTML();
                    },
                    }}
                />
            </div>
        </div>

        <div class="exam-type-choose-container">
            <span class="label-wrapper">
                <span class="required-icon">*</span>
                考试类型：
            </span>
            <div class="exam-choice-container">
                <label class="label">
                    <input
                        type="radio"
                        bind:group={exam_type}
                        value={"00"}
                        class="choice-radio-input"
                    />
                    平时考试
                </label>
                <label class="label">
                    <input
                        type="radio"
                        bind:group={exam_type}
                        value={"02"}
                        class="choice-radio-input"
                    />
                    期末成绩考试
                    <span class="tip-wrapper">
                        <img
                            src="/exam_list/tip.png"
                            alt="提示"
                            style="width: 14px; height:auto"
                        />
                        <div class="tooltip-text">{TIP_TEXT["final_exam"]}</div>
                    </span>
                </label>
                <label class="label">
                    <input
                        type="radio"
                        bind:group={exam_type}
                        value={"04"}
                        class="choice-radio-input"
                    />
                    资格证考试
                    <span class="tip-wrapper">
                        <img
                            src="/exam_list/tip.png"
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

        <div class="exam-course-container">
            <span class="label-wrapper"> 考试对应课程： </span>
            <div class="exam-dropdown-container">
                <div class="exam-dropdown">
                    <DropdownBlueWithSearch
                        disabled = {true}
                        options={course_option}
                        placeholder={"未选择"}
                    ></DropdownBlueWithSearch>
                </div>
            </div>
        </div>

        <div class="exam-chapter-container">
            <span class="label-wrapper"> 考试重点章节： </span>
            <div class="exam-dropdown-container">
                <div class="exam-dropdown">
                    <MultipleChoicesDropdownBlue
                        disabled = {true}
                        options={chapter_option}
                        placeholder={"未选择"}
                    ></MultipleChoicesDropdownBlue>
                </div>
            </div>
        </div>

        <div class="exam-type-choose-container">
            <span class="label-wrapper">
                <span class="required-icon">*</span>
                考试方式：
            </span>
            <div class="exam-choice-container">
                <label class="label">
                    <input
                        type="radio"
                        bind:group={exam_method}
                        value={"00"}
                        class="choice-radio-input"
                        disabled={exam_type === "04"}
                    />
                    线上考试
                    <span class="tip-wrapper">
                        <img
                            src="/exam_list/tip.png"
                            alt="提示"
                            style="width: 14px; height:auto"
                        />
                        <div class="tooltip-text">{TIP_TEXT["online"]}</div>
                    </span>
                </label>
                <label class="label">
                    <input
                        type="radio"
                        bind:group={exam_method}
                        value={"02"}
                        class="choice-radio-input"
                    />
                    线下机房考试
                    <span class="tip-wrapper">
                        <img
                            src="/exam_list/tip.png"
                            alt="提示"
                            style="width: 14px; height:auto"
                        />
                        <div class="tooltip-text">{TIP_TEXT["offline"]}</div>
                    </span>
                </label>
            </div>
        </div>

        <div class="paper-configs-container">
            <span class="label-wrapper">
                <span class="required-icon">*</span>
                配置试卷：
            </span>
            <div class="paper-configs">
                {#each paper_configs as _, index}
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
            <span class="label-wrapper">
                <span class="required-icon">*</span>
                总考试时长：
            </span>
            <div class="total-duration-input-container">
                <input
                    readonly
                    bind:value={total_duration}
                    class="total-duration-input"
                />
                <span style="font-size: 14px;">分钟</span>
            </div>
        </div>

        {#if exam_method === "02"}
            <div class="examinee-container">
                <span class="label-wrapper">
                    考场配置：
                </span>
                <div class="examinee-button-container normal-button-container">
                    <button
                        class="examinee-button normal-button"
                        onclick={() => {
                            show_exam_room_panel = true;
                        }}>考场选择</button
                    >
                    <div class="examinee-number-container">
                        <span class="examinee-number-text">已选择 </span>
                        <span
                            class="examinee-number-text {exam_rooms.length === 0
                                ? 'red-text'
                                : 'green-text'}">{exam_rooms.length}</span
                        >
                        <span class="examinee-number-text"> 个考场，总容量为</span>
                        <span
                        class="examinee-number-text {total_capacity === 0
                            ? 'red-text'
                            : 'green-text'}">{total_capacity}</span
                        >
                        <span class="examinee-number-text"> 名考生，需要监考员 </span>
                        <span
                        class="examinee-number-text {need_invigilator_count === 0
                            ? 'red-text'
                            : 'green-text'}">{need_invigilator_count}</span
                        >
                        <span class="examinee-number-text"> 名</span>
                    </div>
                </div>
            </div>
        {/if}

        <div class="examinee-container">
            <span class="label-wrapper">
                考试人员：
            </span>
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
                        class="examinee-number-text {exam_examinee.length === 0 || exam_examinee.length > total_capacity && exam_method === "02"
                            ? 'red-text'
                            : 'green-text'}">{exam_examinee.length}</span
                    >
                    <span class="examinee-number-text"> 名</span>
                </div>
            </div>
        </div>

        <div class="proctors-config-container">
            <span class="label-wrapper"> 监考员： </span>
            <div class="proctors-button-container normal-button-container">
                <button
                    class="proctors-button normal-button"
                    onclick={() => {
                        if(exam_rooms.length <= 0 && exam_method === "02"){
                            action_toast.show("error", "请先配置至少一个考场后再配置监考员")
                            return;
                        }
                        show_proctors_panel = true;
                    }}
                    disabled = {exam_method === "00"}
                    >配置监考员</button
                >
                <div class={exam_method === "02"?"proctors-number-container":"hide"}>
                    <span class="proctors-number-text">已选择 </span>
                    <span
                        class="proctors-number-text {invigilators.length === 0 || invigilators.length > need_invigilator_count
                            ? 'red-text'
                            : 'green-text'}">{invigilators.length}</span
                    >
                    <span class="proctors-number-text"> 名</span>
                </div>
            </div>
        </div>

        <div class="attachments-upload-container">
            <span class="label-wrapper"> 考试资料附件： </span>
            <div
                class="attachments-upload-button-container normal-button-container"
            >
                <button
                    class="attachments-upload-button normal-button"
                    onclick={triggerFileInput}
                >
                    上传文件
                </button>
                <input
                    type="file"
                    bind:this={file_input}
                    onchange={handleFileSelect}
                    multiple
                    style="display: none;"
                />
                <!-- 显示已上传的文件列表 -->
                {#each files_info as file, index}
                    <div class="file-list">
                        <div class="file-item">
                            <button
                                class="file-name-button"
                                onclick={() => {
                                    getExamFiles(
                                        file.save_path,
                                        file.file_name,
                                    );
                                }}>{file.file_name}</button
                            >
                            <button
                                class="delete-button"
                                onclick={() => files_info.splice(index, 1)}
                            >
                                x
                            </button>
                        </div>
                    </div>
                {/each}
                {#each files as file, index}
                    <div class="file-list">
                        <div class="file-item">
                            <button
                                class="file-name-button"
                                onclick={() => {
                                    downloadFile(file);
                                }}>{file.name}</button
                            >
                            <button
                                class="delete-button"
                                onclick={() => removeFile(index)}
                            >
                                x
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <ProctorsSelectionTable
            show_panel={show_proctors_panel}
            onCancel={() => {
               show_proctors_panel = false
            }}
            onConfirm={(/** @type {any[]} */ selected_ids) => {
               show_proctors_panel = false
               invigilators = selected_ids
            }}
            ids={invigilators}
        ></ProctorsSelectionTable>

        <div class="bottom-action-panel-fixed">
            <button
                class="cancel-action-button"
                onclick={() => {
                    releaseLock();
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    goto("/teacher/examManagement");
                }}>取消</button
            >
            <button
                class="save-action-button"
                onclick={() => {
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    handleSubmit();
                }}>保存</button
            >
        </div>

        <div class="bottom-action-panel">
            <button
                class="cancel-action-button"
                onclick={() => {
                    cancel_edit_exam_dialog = true;
                }}>取消</button
            >
            <button
                class="save-action-button"
                onclick={() => {
                    if (lockCheckTimer) {
                        clearInterval(lockCheckTimer);
                        lockCheckTimer = null;
                    }
                    handleSubmit();
                }}>保存</button
            >
        </div>
    </div>
    <ExamineeSelectionPanel
        show_panel={show_examinee_panel}
        onConfirm={(selected) => {
            
            //确认后将选择的考生取出
            show_examinee_panel = false;
            exam_examinee = selected;
        }}
        onCancel={(/** @type {boolean} */ load_new_file) => {
            show_examinee_panel = false;
            if (load_new_file) {
                exam_examinee = [];
            }
        }}
        ids={exam_examinee}
    ></ExamineeSelectionPanel>
    <ExamRoomsSelectionPanel
        show_panel = {show_exam_room_panel}
        onConfirm={(selected) => {
            show_exam_room_panel = false;
            exam_rooms = selected;
        }}
        onCancel={(/** @type {boolean} */ load_new_file) => {
            show_exam_room_panel = false;
        }}
        ids={exam_rooms}
        exam_start_time={start_time}
        exam_end_time={end_time}
        exam_id={exam_id}
    ></ExamRoomsSelectionPanel>
</div>

{#if showLockDialog}
    <div class="modal-mask"></div>
    <div class="modal">
        <div class="modal-title">考试被占用</div>
        <div class="modal-content">
            当前考试正在被其他用户编辑，请稍后再试。
        </div>
        <button class="btn" onclick={()=>{
                goto("/teacher/examManagement");
            }
        }>返回首页</button>
    </div>
{/if}

{#snippet paperConfig(/** @type {number} */ paper_config_index)}
    <div class="paper-config-container">
        <div class="paper-config-head">
            <span class="paper-num">试卷{paper_config_index + 1}</span>
            <button
                class={paper_config_index != 0 ? "delete-paper-button" : "hide"}
                onclick={() => {
                    paper_configs.splice(paper_config_index, 1);

                    // 清空考场选择
                    exam_rooms = [];
                    invigilators = [];
                }}><img src="/exam_list/delete.svg" alt="删除" /></button
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
        <div
            class="paper-config-body {paper_configs[paper_config_index].is_hide
                ? 'hide'
                : 'show'}"
        >
            <div class="paper-choose-container config-row">
                <span class="label-wrapper">
                    <span class="required-icon">*</span>
                    试卷：
                </span>
                <div class="config-row-content">
                    <div class="paper-button-container normal-button-container">
                        {#if paper_configs[paper_config_index].paper_id === 0}
                            <button
                                class="paper-button normal-button"
                                onclick={() => {
                                    paper_configs[
                                        paper_config_index
                                    ].show_paper_selection_panel = true;
                                }}>试卷选择</button
                            >
                        {:else}
                            <div class="paper-item-container">
                                {#if !paper_configs[paper_config_index].paper_type || !paper_configs[paper_config_index].paper_name}
                                    <span class="paper-type-text">未知试卷</span
                                    >
                                {:else}
                                    <span class="paper-type-text"
                                        >{ASSEMBLY_TYPE_MAP[
                                            paper_configs[paper_config_index]
                                                .paper_type
                                        ]}：</span
                                    >
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
                                        ].show_paper_selection_panel = true;
                                    }}
                                >
                                    编辑
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
            <div class="exam_mode-container config-row">
                <span class="label-wrapper">
                    <span class="required-icon">*</span>
                    考试时段模式：
                </span>
                <div class="config-row-content">
                    <label class="label">
                        <input
                            type="radio"
                            bind:group={
                                paper_configs[paper_config_index].period_mode
                            }
                            value={"00"}
                            class="choice-radio-input"
                            onchange={() => {
                                if (
                                    paper_configs[paper_config_index]
                                        .period_mode === "00"
                                ) {
                                    resetTime(paper_config_index);
                                }
                            }}
                        />
                        固定时段考试
                        <span class="tip-wrapper">
                            <img
                                src="/exam_list/tip.png"
                                alt="提示"
                                style="width: 14px; height:auto"
                            />
                            <div class="tooltip-text" style="min-width: 255px;">
                                {TIP_TEXT["fixed"]}
                            </div>
                        </span>
                    </label>
                    <label class="label">
                        <input
                            type="radio"
                            bind:group={
                                paper_configs[paper_config_index].period_mode
                            }
                            value={"02"}
                            class="choice-radio-input"
                            disabled={exam_method === "02"}
                        />
                        灵活时段考试
                        <span class="tip-wrapper">
                            <img
                                src="/exam_list/tip.png"
                                alt="提示"
                                style="width: 14px; height:auto"
                            />
                            <div class="tooltip-text" style="min-width: 255px;">
                                {TIP_TEXT["flexible"]}
                            </div>
                        </span>
                    </label>
                </div>
            </div>
            <div class="exam-time-container config-row">
                <span class="label-wrapper">
                    <span class="required-icon">*</span>
                    考试时段：
                </span>
                <div class="config-row-content">
                    <DateTimePicker
                        start_date={new Date(
                            paper_configs[paper_config_index].start_time,
                        )}
                        end_date={new Date(
                            paper_configs[paper_config_index].end_time,
                        )}
                        onSelectDate={onChooseTime(paper_config_index)}
                        min_date={paper_config_index === 0
                            ? new Date(basic_date)
                            : new Date(
                                  paper_configs[
                                      paper_config_index - 1
                                  ].end_time,
                              )}
                    ></DateTimePicker>
                </div>
            </div>
            <div class="exam-duration-container config-row">
                <span class="label-wrapper">
                    <span class="required-icon">*</span>
                    考试时长：
                </span>
                {#if paper_configs[paper_config_index].period_mode == "00"}
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
                {:else if paper_configs[paper_config_index].period_mode == "02"}
                    <div class="config-row-content">
                        <input
                            class="duration-input"
                            bind:value={
                                paper_configs[paper_config_index].duration
                            }
                            type="number"
                            min="1"
                            max={paper_configs[paper_config_index].max_duration}
                            oninput={(event)=>{
                                const max = paper_configs[paper_config_index].max_duration;
                                const val = Number(event.target.value);
                                if (val > max) {
                                    event.target.value = max;
                                    paper_configs[paper_config_index].duration = max;
                                }
                            }}
                        />
                        <span style="font-size: 14px;">分钟</span>
                    </div>
                {/if}
            </div>
            {#if paper_configs[paper_config_index].period_mode == "00" && exam_method === '00'}
                <div class="exam-duration-container config-row">
                    <span class="label-wrapper">
                        <span class="required-icon">*</span>
                        考场规则：
                    </span>
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
                                    }
                                }}
                            />
                            <span style="font-size: 14px;">分钟交卷</span>
                        </div>
                </div>
            {/if}
            <div class="order-manner-container config-row">
                <span class="label-wrapper">
                    <span class="required-icon">*</span>
                    乱序方式：
                </span>
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
                <span class="label-wrapper">
                    <span class="required-icon">*</span>
                    批卷方式：
                </span>
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
                    <label class="label">
                        <input
                            type="radio"
                            bind:group={
                                paper_configs[paper_config_index].mark_method
                            }
                            value={"02"}
                            class="choice-radio-input"
                        />
                        自动批卷
                        <span class="tip-wrapper">
                            <img
                                src="/exam_list/tip.png"
                                alt="提示"
                                style="width: 14px; height:auto"
                            />
                            <div class="tooltip-text" style="min-width: 255px;">
                                {TIP_TEXT["auto_mark"]}
                            </div>
                        </span>
                    </label>
                    <!-- <label class="label">
                        <input
                            type="radio"
                            bind:group={
                                paper_configs[paper_config_index].mark_method
                            }
                            value={"04"}
                            class="choice-radio-input"
                        />
                        AI批卷
                        <span class="tip-wrapper">
                            <img
                                src="/exam_list/tip.png"
                                alt="提示"
                                style="width: 14px; height:auto"
                            />
                            <div class="tooltip-text" style="min-width: 255px;">
                                {TIP_TEXT["ai_mark"]}
                            </div>
                        </span>
                    </label> -->
                </div>
            </div>
            <div
                class="show-name-container {paper_configs[paper_config_index]
                    .mark_method !== '00'
                    ? 'hide'
                    : ' config-row'}"
            >
                <span class="label-wrapper" style="flex-wrap: wrap;">
                    批改时是否显示考生姓名：
                </span>
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
                class="grading-config-container {paper_configs[paper_config_index]
                    .mark_method !== '00'
                    ? 'hide'
                    : ' config-row'}"
            >
                <span class="label-wrapper">
                    批改配置：
                </span>
                <div class="config-row-content graders-container">
                    <div class="graders-type-1">
                        <button
                            class="add-graders-button"
                            onclick={() => {
                                paper_configs[
                                    paper_config_index
                                ].show_graders_selection_panel = true;
                            }}
                            ><img
                                src="/exam_list/add.svg"
                                alt="添加"
                                style="height: 14px; margin-right:5px"
                            />添加批阅员</button
                        >
                        {#each paper_configs[paper_config_index].mark_config.teacher_mark_configs as grader, index}
                            {#if grader.id !== 0}
                                <div class="grader-item">
                                    {grader.name}
                                    <button
                                        class="delete-button"
                                        onclick={() => {
                                            paper_configs[
                                                paper_config_index
                                            ].mark_config.teacher_mark_configs.splice(
                                                index,
                                                1,
                                            );
                                            updateMarkMode(paper_config_index);
                                        }}
                                    >
                                        x
                                    </button>
                                </div>
                            {/if}
                        {/each}
                    </div>
                    <!--当前版本不需要配置具体的试卷分配比例-->
                    <!-- {#if paper_configs[paper_config_index].mark_mode === "04"}
                        <div class="graders-type-2">
                            <table style="border-collapse: collapse;">
                                <thead>
                                    <tr>
                                        <th class="grader-table-head-text" style="width: 100px;">批阅员</th>
                                        <th class="grader-table-head-text" style="width: 100px;">批改份数</th>
                                        <th class="grader-table-head-text" style="width: 80px;">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each paper_configs[paper_config_index].mark_config.teacher_mark_configs as grader, index}
                                        {#if grader.id !== 0}
                                        <tr style="height: 40px;">
                                            <td style="text-align: center; font-size:14px;  border-bottom:1px solid #ddd">
                                                <span>{grader.name}</span>
                                            </td>
                                            <td style="text-align: center; font-size:14px;  border-bottom:1px solid #ddd">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    max={getRemainingCount(paper_config_index, index)}
                                                    bind:value={grader.mark_count} 
                                                    style="width:40px;height:20px;outline:none"
                                                    oninput={(e) => {
                                                        const new_value = validateMarkCount(paper_config_index, index, e.currentTarget.value);
                                                        grader.mark_count = new_value;
                                                    }}
                                                />
                                            </td>
                                            <td style="text-align: center; font-size:14px;  border-bottom:1px solid #ddd">
                                                <button 
                                                    class="grader-delete-button"
                                                    onclick={() => {
                                                        paper_configs[
                                                            paper_config_index
                                                        ].mark_config.teacher_mark_configs.splice(
                                                            index,
                                                            1,
                                                        );
                                                        updateMarkMode(paper_config_index);
                                                    }}
                                                >删除</button>
                                            </td>
                                        </tr>
                                        {/if}
                                    {/each}
                                </tbody>
                            </table>
                        </div> 
                    {/if} -->
                </div>
            </div>
            <div class="grading-mode-container {paper_configs[paper_config_index]
                .mark_method !== '00'
                ? 'hide'
                : ' config-row'}">
                <span class="label-wrapper">
                    <span class="required-icon">*</span>
                    批改模式：
                </span>
                <div
                    class="config-row-content"
                    style="display: flex;flex-direction:column"
                >
                    {#if paper_configs[paper_config_index].mark_config.teacher_mark_configs.length > 1}
                        <span
                            class="grading-config-row-text"
                            style="padding: 2px 0 5px 0;">多人阅卷</span
                        >
                        <div class="config-row-content">
                            <label class="label" style="color: #757575;">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index].mark_mode
                                    }
                                    value={"02"}
                                    class="choice-radio-input"
                                />
                                全卷多评
                                <span class="tip-wrapper">
                                    <img
                                        src="/exam_list/tip.png"
                                        alt="提示"
                                        style="width: 14px; height:auto"
                                    />
                                    <div
                                        class="tooltip-text"
                                        style="min-width: 200px;"
                                    >
                                        {TIP_TEXT["multiply_mark"]}
                                    </div>
                                </span>
                            </label>
                            <label class="label" style="color: #757575;">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index].mark_mode
                                    }
                                    value={"04"}
                                    class="choice-radio-input"
                                />
                                试卷分配
                                <span class="tip-wrapper">
                                    <img
                                        src="/exam_list/tip.png"
                                        alt="提示"
                                        style="width: 14px; height:auto"
                                    />
                                    <div
                                        class="tooltip-text"
                                        style="min-width: 200px;"
                                    >
                                        {TIP_TEXT["assignment_of_paper"]}
                                    </div>
                                </span>
                            </label>
                            <label class="label" style="color: #757575;">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index].mark_mode
                                    }
                                    value={"06"}
                                    class="choice-radio-input"
                                />
                                按题分配
                                <span class="tip-wrapper">
                                    <img
                                        src="/exam_list/tip.png"
                                        alt="提示"
                                        style="width: 14px; height:auto"
                                    />
                                    <div
                                        class="tooltip-text"
                                        style="min-width: 200px;"
                                    >
                                        {TIP_TEXT["question_group_mark"]}
                                    </div>
                                </span>
                            </label>
                            <!-- <label class="label" style="color: #757575;">
                                <input
                                    type="radio"
                                    bind:group={
                                        paper_configs[paper_config_index].mark_mode
                                    }
                                    value={"08"}
                                    class="choice-radio-input"
                                />
                                题目分配
                                <span class="tip-wrapper">
                                    <img
                                        src="/exam_list/tip.png"
                                        alt="提示"
                                        style="width: 14px; height:auto"
                                    />
                                    <div
                                        class="tooltip-text"
                                        style="min-width: 200px;"
                                    >
                                        {TIP_TEXT["question_group_mark"]}
                                    </div>
                                </span>
                            </label> -->
                        </div>
                    {:else}
                        <span
                            class="grading-config-row-text"
                            style="padding: 2px 0 5px 0;">单人阅卷</span
                        >
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
                    {/if}
                </div>
            </div>
        </div>
        <GradersSelectionPanel
            show_panel={paper_configs[paper_config_index]
                .show_graders_selection_panel}
            onCancel={() => {
                paper_configs[paper_config_index].show_graders_selection_panel =
                    false;
            }}
            onConfirm={(/** @type {any[]} */ selected_ids) => {
                onGradersConfirm(paper_config_index, selected_ids);
            }}
            ids={paper_configs[paper_config_index].mark_config
                .teacher_mark_configs}
        ></GradersSelectionPanel>
        <PaperSelectionPanel
            selected_id={paper_configs[paper_config_index].paper_id}
            selected_name={paper_configs[paper_config_index].paper_name}
            selected_type={paper_configs[paper_config_index].paper_type}
            show_panel={paper_configs[paper_config_index]
                .show_paper_selection_panel}
            onCancel={() => {
                paper_configs[paper_config_index].show_paper_selection_panel =
                    false;
            }}
            onConfirm={(
                /** @type {number} */ selected_id,
                /** @type {string} */ selected_name,
                /** @type {string} */ selected_type,
            ) => {
                paper_configs[paper_config_index].show_paper_selection_panel =
                    false;
                paper_configs[paper_config_index].paper_id = selected_id;
                paper_configs[paper_config_index].paper_name = selected_name;
                paper_configs[paper_config_index].paper_type = selected_type;
            }}
        ></PaperSelectionPanel>
    </div>
{/snippet}

<Dialog
    bind:isOpen={cancel_edit_exam_dialog}
    title="确认取消编辑考试?"
    content="所做的更改将不会被保存"
    confirmTextBackgroundColor="#E34D59"
    onConfirm={() => {
        goto("/teacher/examManagement");
    }}
/>

<ActionToast bind:isShow={show_action_toast} bind:this={action_toast} />

<style lang="scss" scoped>
    $normal-font-size: 14px;

    .hide {
        display: none;
    }
    .show {
        display: flex;
        flex-direction: column;
    }

    .create-exam-wrapper {
        position: relative;
        background: #fff;
        margin: 0 auto;
        width: 100%;
        height: 100%;
        overflow-y: hidden;
        overflow-x: auto;
    }

    .create-exam-container {
        position: relative;
        background-color: white;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: auto;
    }

    .required-icon {
        color: var(--red);
        font-size: $normal-font-size;
    }

    .exam-name-input{
        width: 65%;
        height: 32px;
        box-sizing: border-box;
        border: 1px solid #d7d7d7;
        border-radius: 2px;
        outline: none;
        font-size: 14px;
    }

    .rule-input-container{
        width: 65%;
        height: auto;
        box-sizing: border-box;
        border: none;
        outline: none;
        font-size: 14px;
    }

    .exam-name-input:focus{
        border-color: var(--primary-color);
    }

    .exam-name-input-container,
    .exam-rule-input-container,
    .exam-type-choose-container,
    .exam-course-container,
    .exam-chapter-container,
    .examinee-container,
    .paper-configs-container,
    .proctors-config-container,
    .total-duration-container,
    .attachments-upload-container {
        display: flex;
        flex-direction: row;
        justify-content: center;
        padding: 5px 0 15px 0;
        min-width: 1100px;
    }

    .config-row {
        display: flex;
        flex-direction: row;
        justify-content: center;
        padding: 5px 0 15px 0;
    }

    .total-duration-container {
        align-items: center;
    }

    .exam-choice-container {
        width: 65%;
        height: 32px;
    }

    .label {
        display: inline-flex;
        align-items: center;
        font-size: 14px;
        margin-right: 32px;
        gap: 4px;
        .choice-radio-input {
            margin: auto;
            accent-color: var(--blue);
        }
    }

    .label-wrapper {
        font-size: 14px;
        width: 120px;
        text-align: right;
        display: inline-block;
        padding-right: 26px;
        .required-icon {
            color: var(--red);
            margin-right: 2px;
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

    .exam-dropdown-container,
    .paper-configs {
        width: 65%;
    }

    .config-row-content {
        width: 80%;
    }

    .exam-dropdown {
        width: 414px;
        height: 32px;
    }

    .paper-config-container {
        position: relative;
        width: 100%;
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
        }
    }

    .normal-button-container {
        width: 65%;
        .normal-button {
            /* 正常样式 */
            width: 100px;
            height: 32px;
            background-color: white;
            border: 1px solid var(--primary-color);
            border-radius: 3px;
            font-size: 14px;
            color: var(--primary-color);
            cursor: pointer;

            &:hover {
                background-color: var(--primary-color);
                color: white;
            }

            /* 提高 :disabled 优先级 */
            &:disabled,
            &:disabled:hover {
                background-color: white; /* 保持背景白色 */
                border: 1px solid #ccc;
                color: #ccc;
                cursor: not-allowed; /* 推荐用 not-allowed 而不是 none */
            }
        }
    }

    .duration-input {
        height: 32px;
        outline: none;
        box-sizing: border-box;
        border: 1px solid rgb(221, 221, 221, 1);
        width: 80px;
        padding-left: 5px;
    }

    .total-duration-input {
        height: 32px;
        outline: none;
        box-sizing: border-box;
        border: 1px solid rgb(221, 221, 221, 1);
        width: 30px;
        padding-left: 5px;
    }

    .total-duration-input {
        border: none;
        pointer-events: none;
    }

    .total-duration-input-container {
        width: 65%;
    }

    .add-paper-button {
        border: none;
        background-color: var(--primary-color);
        height: 32px;
        width: 100px;
        border-radius: 3px;
        color: white;
        cursor: pointer;
        margin-top: 5px;
    }

    .add-paper-button:hover {
        background-color: var(--blue);
    }

    .grading-config-row-text {
        font-size: 12px;
    }
    
    .file-list {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        background-color: #eff0f4;
        padding: 0 3px 0 10px;
        border-radius: 20px;
        margin-right: 5px;
        min-height: 32px;
        margin-bottom: 5px;
        .file-item {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
        }
    }

    .delete-button {
        border: none;
        background-color: rgb(0, 0, 0, 0);
        cursor: pointer;
        color: #757575;
    }

    .file-name-button {
        color: #757575;
        font-size: 14px;
        background-color: rgb(0, 0, 0, 0);
        border: none;
        cursor: pointer;
    }
    .file-name-button:hover {
        text-decoration: underline;
    }

    .attachments-upload-button-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        .attachments-upload-button {
            margin-right: 10px;
        }
    }

    .bottom-action-panel {
        position: sticky;
        background-color: #fff;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 15px 20px;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        z-index: 10;
        display: flex;
        justify-content: center;
        gap: 12px;
        border-top: 1px solid #eee;
        gap: 20%;
        width: 100%;
        box-sizing: border-box;
        .cancel-action-button {
            width: 100px;
            height: 32px;
            background-color: white;
            border: 1px solid #dcdcdc;
            border-radius: 3px;
            font-size: 14px;
            color: #333333;
            cursor: pointer;
        }
        .save-action-button {
            border: none;
            background-color: var(--primary-color);
            height: 32px;
            width: 100px;
            border-radius: 3px;
            color: white;
            cursor: pointer;
            margin-top: 5px;
        }
        .save-action-button:hover {
            background-color: var(--primary-hover);
        }
        .cancel-action-button:hover {
            border: 1px solid var(--primary-hover);
            color: var(--primary-color);
        }
    }
    .bottom-action-panel-fixed {
        display: none;
    }

    .graders-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        .graders-type-1 {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
    }

    .grader-item {
        color: #757575;
        margin-right: 5px;
        font-size: 14px;
        display: flex;
        flex-direction: row;
        align-items: center;
        background-color: #dcdcdc;
        padding: 0 5px 0 10px;
        border-radius: 20px;
        min-height: 25px;
        white-space: nowrap;
        overflow: hidden; 
        text-overflow: ellipsis; 
    }

    .add-graders-button {
        border: none;
        color: #757575;
        font-size: 14px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0 0 0 0;
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
                color: var(--blue);
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

    .examinee-button-container {
        display: flex;
        flex-direction: row;
        gap: 10px;
        .examinee-number-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 5px;
            .examinee-number-text {
                font-size: 14px;
                color: var(--text-primary);
            }
            .green-text {
                color: var(--green);
            }
            .red-text {
                color: var(--red);
            }
        }
    }

    .proctors-button-container{
        display: flex;
        flex-direction: row;
        gap: 10px;
        .proctors-number-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 5px;
            .proctors-number-text {
                font-size: 14px;
                color: var(--text-primary);
            }
            .green-text {
                color: var(--green);
            }
            .red-text {
                color: var(--red);
            }
        }
    }

    @media (max-height: 400px) {
        .bottom-action-panel-fixed {
            position: relative;
            background-color: #fff;
            padding: 15px 20px;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            z-index: 10;
            display: flex;
            justify-content: center;
            gap: 12px;
            border-top: 1px solid #eee;
            gap: 20%;
            width: 100%;
            box-sizing: border-box;
            .cancel-action-button {
                width: 100px;
                height: 32px;
                background-color: white;
                border: 1px solid #dcdcdc;
                border-radius: 3px;
                font-size: 14px;
                color: var(--text-primary);
                cursor: pointer;
            }
            .save-action-button {
                border: none;
                background-color: var(--primary-color);
                height: 32px;
                width: 100px;
                border-radius: 3px;
                color: white;
                cursor: pointer;
                margin-top: 5px;
            }
            .save-action-button:hover {
                background-color: var(--primary-color);
            }
            .cancel-action-button:hover {
                border: 1px solid var(--primary-hover);
                color: var(--primary-color);
            }
        }
        .bottom-action-panel {
            display: none;
        }
    }
    .modal-mask {
        position: fixed;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 1000;
    }

    .modal {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background: #fff;
        padding: 32px 24px;
        border-radius: 8px;
        z-index: 1001;
        min-width: 300px;
        text-align: center;
    }
    .modal-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
    }
    .modal-content {
        margin-bottom: 24px;
    }
    .btn {
        padding: 8px 24px;
        border-radius: 4px;
        background: var(--blue);
        color: #fff;
        border: none;
        cursor: pointer;
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

