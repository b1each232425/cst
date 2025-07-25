<!--
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-04-10 18:38:11
 * @LastEditors: MIOZD && l317101@163.com
 * @LastEditTime: 2025-05-24 17:44:16
 * @FilePath: \tutorial-platform-fe\src\lib\component\QuestionEditPanel\multipleSelect.svelte
 * @Description: 题目编辑面板
 * @
-->
<script>
    import QuestionTag from "$lib/component/EditableTag.svelte";
    import SmartEditor from "@3min/smart-edit";

    /**
     * @typedef {import('@3min/cst-tiptap/dist/types').PiptapEditor} PiptapEditor
     * @typedef {import('@3min/cst-tiptap/dist/types').PiptapEditorOptions} PiptapEditorOptions
     */

    import { TheoryQuestion } from "../../../routes/teacher/questionBank/theory/types";
    import { formatTimestamp } from "$lib/common/time_utils";
    import QuestionPreviewPanel from "$lib/component/QuestionPreviewPanelForQuestionBank.svelte";
    import { customUploadHandler } from "./uploader";
    import { questionLimit } from "./questionConfig.js";
    import { getQuestionFilesPath } from "../../../routes/teacher/questionBank/theory/utils";

    const editor_width = "calc(100% - 24px - 10px)";
    const editor_height = "100%";

    /**
     * 富文本编辑器配置项
     * @typedef {import('@3min/cst-tiptap/dist/types').PiptapEditorOptions} PiptapEditorOptions
     * @type {Partial<PiptapEditorOptions>}
     */
    const editor_options = {
        editable: true,
        content: "这是一个编辑器",
        table: {
            overflow: false,
        },
        link: {
            protocols: [],
        },
        uploader: customUploadHandler,
        image: {
            inline: true,
            uploadFormName: "image",
            sizeLimit: 100,
        },
        video: {
            inline: true,
            uploadFormName: "video",
            sizeLimit: 100,
        },
        audio: {
            inline: true,
            uploadFormName: "audio",
            sizeLimit: 100,
        },
        attachment: {
            inline: true,
            uploadFormName: "attachment",
            sizeLimit: 1024,
        },
    };

    /**
     * @type {{
     *      show:boolean                                // 编辑面板是否显示
     *      is_new_question?:boolean                    // 是否为新增题目
     *      question_data?:TheoryQuestion               // 题目数据
     *      onCancel:()=>void                           // 取消编辑函数
     *      onConfirm:(data:Partial<TheoryQuestion>)=>void       // 确认编辑函数
     * }}
     */
    let { show, is_new_question, question_data, onCancel, onConfirm } =
        $props();

    const ICON = {
        radioButton_disabled:
            "/theory_question_bank/icons/radioButton_disabled.svg",
        radioButton_selected:
            "/theory_question_bank/icons/radioButton_selected.svg",
        radioButton_unselect:
            "/theory_question_bank/icons/radioButton_unselect.svg",
        delete: "/theory_question_bank/icons/delete.svg",

        checkbox_selected_green:
            "/theory_question_bank/icons/checkbox_selected_green.svg",
        checkbox_unselect: "/theory_question_bank/icons/checkbox_unselect.svg",

        delete_bin: "/theory_question_bank/icons/delete_bin.svg",
        arrow_down: "/theory_question_bank/icons/arrow_down.svg",
        Xacross_grey: "/theory_question_bank/icons/Xacross_grey.svg",
    };

    /**
     * @description 是否已初始化
     * @type {boolean}
     */
    let initialized = $state(false);

    /**
     * @description 题目类型
     */
    let question_type = "02";

    /**
     * @description 题目编辑的富文本编辑器组件实例
     * @type {SmartEditor |null}
     */
    let title_editor = $state(null);

    /**
     * @description 题目题干
     */
    let question_title_content = $state("");

    /**
     * @description 题目编辑器的警告状态
     * @type {number}
     */
    let title_editor_warning = $state(0);

    /**
     * @description 题目难度选项
     * @type {number}
     */
    let question_difficulty = $state(1);

    /**
     * @description 题目标签
     * @type {string[]}
     */
    let question_tags = $state([]);

    /**
     * @description 题目标签数组警告状态
     * @type {number}
     */
    let question_tags_warning = $state(0);

    /**
     * @description 题目标签输入框内容
     * @type {string}
     */
    let tag_content = $state("");
    /**
     * @description 删除tag
     * @param {string} tagText
     */
    const deleteTag = (tagText) => {
        const index = question_tags.indexOf(tagText);
        if (index !== -1) {
            question_tags.splice(index, 1);
        }

        if (question_tags.length > questionLimit.questionTagsLenLimit) {
            question_tags_warning = 1;
        } else {
            question_tags_warning = 0;
        }
    };

    /**
     * @description 题目分数
     */
    let question_score = $state(0);

    /**
     * @description 题目分数输入警告状态
     */
    let question_score_warning = $state(0);

    /**
     * @description 题目选项
     */
    let question_options = $state([
        {
            label: "A",
            value: "",
        },
        {
            label: "B",
            value: "",
        },
        {
            label: "C",
            value: "",
        },
        {
            label: "D",
            value: "",
        },
    ]);

    /**
     * @description 重复项的富文本编辑器实例数组
     * @type {SmartEditor[]}
     */
    let question_options_editors = $state([]);

    /**
     * @description 包裹重复项的富文本编辑器的容器
     * @type {number[]}
     */
    let question_options_editors_warning = $state([]);

    let firstAnswerLabel = () => question_options[0].label;
    /**
     * @description 答案
     * @type {string[]}
     */
    let question_answers = $state([firstAnswerLabel()]);

    /**
     * @description 题目编辑器的容器
     * @type {HTMLElement|undefined}
     */
    let question_edit_container = $state();

    /**
     * @description 初始化面板
     */
    export const initPanel = () => {
        //  难度
        question_difficulty = question_data?.difficulty
            ? $state.snapshot(question_data.difficulty)
            : 1;

        //  标签
        question_tags = question_data?.tags
            ? $state.snapshot(question_data.tags)
            : [];

        //  分值
        question_score = question_data?.score
            ? $state.snapshot(question_data.score)
            : 0;

        //  选项
        question_options =
            question_data && Object.keys(question_data).length > 0
                ? $state.snapshot(question_data.options)
                : [
                      { label: "A", value: "" },
                      { label: "B", value: "" },
                      { label: "C", value: "" },
                      { label: "D", value: "" },
                  ];

        //  选项答案
        //@ts-ignore
        question_answers =
            question_data?.answers &&
            Object.keys(question_data.answers).length > 0
                ? $state.snapshot(question_data.answers)
                : ["A"];

        question_options_editors_warning = new Array(
            question_options.length,
        ).fill(0);

        // 设置富文本编辑器内容
        title_editor?.setContentWithoutHistory(
            question_data?.content ? question_data.content : "",
        );
        analysis_editor?.setContentWithoutHistory(
            question_data?.analysis ? question_data.analysis : "",
        );
        question_options_editors.forEach((editor, i) => {
            editor?.setContentWithoutHistory(question_options[i]?.value);
        });

        if (question_edit_container) {
            question_edit_container.scrollTop = 0;
        }

        initialized = true;
    };

    /**
     * @description 题目解析的富文本编辑器组件实例
     * @type {SmartEditor|null}
     */
    let analysis_editor = $state(null);

    /**
     * @description 题目解析
     */
    let question_analysis_content = $state("");

    /**
     * @description 题目解析编辑器的警告状态
     */
    let analysis_editor_warning = $state(0);

    /**
     * @description 确认编辑
     */
    const onEditConfirm = () => {
        /**
         * @description 可成功保存标识
         * @type {boolean}
         */
        let success_confirm_flag = true;
        if (question_title_content === "") {
            title_editor_warning = 1;
            success_confirm_flag = false;
        } else if (
            title_editor &&
            title_editor.getContentLength() >
                questionLimit.contentCharacterLenLimit
        ) {
            title_editor_warning = 2;
            success_confirm_flag = false;
        }

        if (
            analysis_editor &&
            analysis_editor.getContentLength() >
                questionLimit.analysisCharacterLenLimit
        ) {
            analysis_editor_warning = 2;
            success_confirm_flag = false;
        }

        if (question_score <= 0) {
            question_score_warning = 1;
            success_confirm_flag = false;
        }

        if (question_tags.length > questionLimit.questionTagsLenLimit) {
            question_tags_warning = 1;
            success_confirm_flag = false;
        }

        //  单选/多选
        for (let i = 0; i < question_options.length; i++) {
            if (question_options_editors[i].getHTML() === "") {
                question_options_editors_warning[i] = 1;
                success_confirm_flag = false;
            } else if (
                question_options_editors[i].getContentLength() >
                questionLimit.optionsCharacterLenLimit
            ) {
                question_options_editors_warning[i] = 2;
                success_confirm_flag = false;
            }
        }

        if (!success_confirm_flag) {
            return;
        }

        /**
         * @description 题目数据，保留原有字段
         * @type {Partial<TheoryQuestion>}
         */
        let data = {};

        if (is_new_question) {
            data = {
                id: question_data?.id === undefined ? -1 : question_data.id,
                type: question_type,
                content:
                    question_title_content === undefined
                        ? ""
                        : question_title_content,
                options: $state.snapshot(question_options),
                score: question_score,
                difficulty: question_difficulty,
                tags: $state.snapshot(question_tags),
                answers: $state.snapshot(question_answers),
                analysis:
                    question_analysis_content === undefined
                        ? ""
                        : question_analysis_content,
            };
        } else {
            // 更新题目(只更新变动字段)
            if (!question_data) {
                return;
            }
            data.id = question_data?.id;
            data.type = question_type;

            if (question_data?.content !== question_title_content) {
                data.content = question_title_content;
            }

            if (question_data?.difficulty !== question_difficulty) {
                data.difficulty = question_difficulty;
            }

            if (question_data?.analysis !== question_analysis_content) {
                data.analysis = question_analysis_content;
            }

            if (question_data?.score !== question_score) {
                data.score = question_score;
            }

            let options_equal =
                question_data.options.length === question_options.length &&
                question_data.options.every(
                    (value, index) =>
                        value.label === question_options[index].label &&
                        value.value === question_options[index].value,
                );

            let answers_equal =
                question_data.answers.length === question_answers.length &&
                question_data.answers.every(
                    (value, index) => value === question_answers[index],
                );
            // 后端需要验证答案是否存在于选项中
            if (!answers_equal || !options_equal) {
                data.options = $state.snapshot(question_options);
                data.answers = $state.snapshot(question_answers);
            }

            let tags_equal =
                question_data.tags.length === question_tags.length &&
                question_data.tags.every(
                    (value, index) => value === question_tags[index],
                );
            if (!tags_equal) {
                data.tags = $state.snapshot(question_tags);
            }
        }

        data.question_attachments_path = getQuestionFilesPath(data);

        onConfirm(data);
    };

    /**
     * @description 分数变动
     * @param {Event} e
     */
    const onScoreChange = (e) => {
        if (
            e &&
            e.target &&
            "value" in e.target &&
            typeof e.target.value === "string"
        ) {
            const value = Number(e.target.value);
            const limited_value =
                value > 0
                    ? value <= questionLimit.scoreLimit
                        ? value
                        : questionLimit.scoreLimit
                    : 0;

            question_score = limited_value;
            e.target.value = limited_value;
            question_score_warning = 0;
        } else {
            question_score_warning = 1;
            question_score = 0;
        }
    };

    /**
     * @description 删除选项
     * @param {number} index
     * @param {{label:string,value:string}} question_option
     */
    const onDeleteOption = (index, question_option) => {
        //  阻止无意义操作
        if (question_options.length <= 2) {
            return;
        }

        for (let i = question_options.length - 1; i > index; i--) {
            question_options[i].label = question_options[i - 1].label;
        }

        const delete_label = question_options[index].label;

        //  默认给出正确选项
        if (
            question_answers.includes(question_option.label) &&
            question_answers.length === 1
        ) {
            question_answers = [question_options[0].label];
        }

        question_answers.forEach((item, i) => {
            if (item > delete_label) {
                question_answers[i] = String.fromCharCode(
                    item.charCodeAt(0) - 1,
                );
            }
        });

        // 转移富文本编辑器
        for (let i = index; i < question_options_editors.length - 1; i++) {
            let editor_Container =
                question_options_editors[i + 1].getEditorContainer();
            question_options_editors[i].setEditorContainer(editor_Container);
            question_options_editors[i].updateEditorOptions({
                onContentChange: (
                    /**
                     * @type {PiptapEditor}
                     */
                    editor,
                ) => {
                    if (i >= question_options.length) return;

                    question_options[i].value = editor.getPreviewHTML();
                    question_options_editors_warning[i] = 0;
                },
            });
        }

        question_options.splice(index, 1);
        //  each循环中删除元素时，组件删除的是末尾
        question_options_editors.pop();
        question_options_editors_warning.pop();
    };

    /**
     * @description 添加选项
     */
    const onAddOption = () => {
        if (question_options.length >= 8) {
            return;
        }
        /**
         * @type {any}
         */
        let new_editor;
        question_options_editors.push(new_editor);

        question_options.push({
            label: String.fromCharCode(65 + question_options.length),
            value: "",
        });

        question_options_editors_warning.push(0);
    };

    /**
     * @description 选择答案
     * @param {{label:string,value:string}} question_option
     */
    const onSelectAnswer = (question_option) => {
        let in_answers = question_answers.includes(question_option.label);
        if (in_answers && question_answers.length !== 1) {
            question_answers = question_answers.filter(
                (item) => item !== question_option.label,
            );
        } else if (!in_answers) {
            question_answers.push(question_option.label);
        }
    };
</script>

<div class="editorContainer {show ? '' : 'hide'}">
    <div class="topBar">
        <span>{is_new_question ? `新增` : `编辑`}多选题</span>

        <div class="topBarControlBtns">
            <button
                class="cancelBtn"
                onclick={() => {
                    //  避免内容瞬间消失
                    onCancel();
                    // resetPanel();
                }}>取消</button
            >
            <button class="confirmBtn" onclick={onEditConfirm}>保存</button>
        </div>
    </div>

    <div class="mainContent">
        <div class="editArea" bind:this={question_edit_container}>
            <div
                style="
        display:flex;
        flex-direction:column;
        flex:1;
        align-items: end;
        min-height: 100%;
        "
            >
                <div
                    class="container contentInputContainer {title_editor_warning !==
                    0
                        ? 'warning'
                        : ''}"
                >
                    <div class="labelText">
                        <span><span style="color:#D9001B">*</span>题目:</span>
                    </div>
                    <div class="content richTextEditor">
                        <div>
                            {#if initialized}
                                <SmartEditor
                                    bind:this={title_editor}
                                    width={editor_width}
                                    height={editor_height}
                                    editor_options={{
                                        ...editor_options,
                                        content: question_data?.content,
                                        characterCount: {
                                            characterCountLimit:
                                                questionLimit.contentCharacterLenLimit,
                                            enableCharacterCountLimit: false,
                                        },
                                        placeholder: "输入题目内容（必填）",
                                        onContentChange: (
                                            /**
                                             * @type {PiptapEditor}
                                             */
                                            editor,
                                        ) => {
                                            title_editor_warning = 0;
                                            question_title_content =
                                                editor.getPreviewHTML();
                                        },
                                    }}
                                ></SmartEditor>
                            {/if}
                            <div class="deleteOptionBtn"></div>
                        </div>
                        <span class="inputWarnText">
                            {title_editor_warning === 1
                                ? "题目内容不能为空"
                                : "题目内容长度超出限制"}
                        </span>
                    </div>
                </div>
                <div class="container difficultyOptionsContainer">
                    <div class="labelText">
                        <span><span style="color:#D9001B">*</span>难度:</span>
                    </div>
                    <div class="content difficultyOptions">
                        <button
                            onclick={() => {
                                question_difficulty = 1;
                            }}
                        >
                            {#if question_difficulty !== 1}
                                <img
                                    class="radioButton"
                                    src={ICON.radioButton_unselect}
                                    alt="radio_unselect"
                                />
                            {:else}
                                <img
                                    class="radioButton"
                                    src={ICON.radioButton_selected}
                                    alt="radio_selected"
                                />
                            {/if}
                            <span style="font-size:14px;margin-left:5px;">
                                简单
                            </span>
                        </button>
                        <button
                            onclick={() => {
                                question_difficulty = 2;
                            }}
                        >
                            {#if question_difficulty !== 2}
                                <img
                                    class="radioButton"
                                    src={ICON.radioButton_unselect}
                                    alt="radio_unselect"
                                />
                            {:else}
                                <img
                                    class="radioButton"
                                    src={ICON.radioButton_selected}
                                    alt="radio_selected"
                                />
                            {/if}
                            <span style="font-size:14px;margin-left:5px;">
                                中等
                            </span></button
                        >
                        <button
                            onclick={() => {
                                question_difficulty = 3;
                            }}
                        >
                            {#if question_difficulty !== 3}
                                <img
                                    class="radioButton"
                                    src={ICON.radioButton_unselect}
                                    alt="radio_unselect"
                                />
                            {:else}
                                <img
                                    class="radioButton"
                                    src={ICON.radioButton_selected}
                                    alt="radio_selected"
                                />
                            {/if}
                            <span style="font-size:14px;margin-left:5px;">
                                困难
                            </span></button
                        >
                    </div>
                </div>
                <div class="container questionTagsContainer">
                    <div class="labelText">
                        <span>标签:</span>
                    </div>
                    <div
                        class="content"
                        style="display: flex;flex-direction:column;align-items:flex-start"
                    >
                        <div class="questionTags">
                            <QuestionTag
                                bind:content={tag_content}
                                handle_funcs={{
                                    onchange: (old_content, new_content) => {
                                        const value = new_content.trim();

                                        if (value === "") return;
                                        if (question_tags.includes(value)) {
                                            tag_content = "";
                                            return;
                                        }

                                        question_tags.unshift(value);
                                        if (question_tags.length > 32) {
                                            question_tags_warning = 1;
                                        } else {
                                            question_tags_warning = 0;
                                        }
                                        tag_content = "";
                                    },
                                    delete: () => {
                                        tag_content = "";
                                    },
                                }}
                            />
                            {#each question_tags as tag, index}
                                <QuestionTag
                                    content={tag}
                                    handle_funcs={{
                                        onchange: (
                                            old_content,
                                            new_content,
                                        ) => {
                                            const value = new_content.trim();

                                            if (value === "") return;

                                            question_tags[index] = value;
                                        },
                                        delete: () => {
                                            deleteTag(tag);
                                        },
                                    }}
                                />
                            {/each}
                        </div>
                        <span
                            class="inputWarnText"
                            style="color:#D9001B;visibility: {question_tags_warning !==
                            0
                                ? 'visible'
                                : 'hidden'};"
                            >标签数量超出限制，上限为{32}个</span
                        >
                    </div>
                </div>

                {#if initialized}
                    {@render multipleSelect()}
                {/if}

                <div
                    class="container contentInputContainer {analysis_editor_warning !==
                    0
                        ? 'warning'
                        : ''}"
                >
                    <div class="labelText">
                        <span>解析:</span>
                    </div>
                    <div class="content richTextEditor">
                        <div>
                            {#if initialized}
                                <SmartEditor
                                    bind:this={analysis_editor}
                                    width={editor_width}
                                    height={editor_height}
                                    editor_options={{
                                        ...editor_options,
                                        content: question_data?.analysis,
                                        characterCount: {
                                            characterCountLimit:
                                                questionLimit.analysisCharacterLenLimit,
                                            enableCharacterCountLimit: false,
                                        },
                                        placeholder: "输入解析内容（选填）",
                                        onContentChange: (
                                            /**
                                             * @type {PiptapEditor}
                                             */
                                            editor,
                                        ) => {
                                            analysis_editor_warning = 0;
                                            question_analysis_content =
                                                editor?.getPreviewHTML();
                                        },
                                    }}
                                ></SmartEditor>
                            {/if}
                            <div class="deleteOptionBtn"></div>
                        </div>
                        <span class="inputWarnText">解析内容长度超出限制</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="previewArea">
            <QuestionPreviewPanel
                closePanel={() => {}}
                question={{
                    id: 0,
                    type: question_type,
                    content: question_title_content,
                    options: question_options,
                    score: question_score,
                    difficulty: question_difficulty,
                    tags: question_tags,
                    answers: question_answers,
                    analysis: question_analysis_content,
                    update_time: question_data?.update_time
                        ? question_data.update_time
                        : 0,
                    update_time_str: question_data?.update_time_str
                        ? question_data.update_time_str
                        : "",
                    question_attachments_path: [],
                }}
                displayClosePanelBtn={false}
            ></QuestionPreviewPanel>
        </div>
    </div>
</div>

<!-- 单选/多选题 分数输入框-->
{#snippet scoreInput()}
    <div
        class="container scoreContainer {question_score_warning === 1
            ? 'warning'
            : ''}"
    >
        <div class="labelText">
            <span>分数:</span>
        </div>
        <div class="content scoreContent">
            <input
                class="scoreInput"
                type="number"
                min="0"
                max="100"
                onchange={onScoreChange}
                bind:value={question_score}
            />
            <span class="inputWarnText">题目分值必须大于0</span>
        </div>
    </div>
{/snippet}

<!-- 单选/多选题 选项编辑器 -->
{#snippet selectionOptionRichTextEditor(
    /**
     * @type {{label:string,value:string}}
     */
    question_option,
    /**
     * @type {number}
     */
    index,
    /**
     * @type {boolean}
     */
    enable_delete_btn = true,
)}
    <div class="content richTextEditor">
        <div>
            <SmartEditor
                bind:this={question_options_editors[index]}
                height={editor_height}
                width={editor_width}
                editor_options={{
                    ...editor_options,
                    content: question_option.value,
                    characterCount: {
                        characterCountLimit:
                            questionLimit.optionsCharacterLenLimit,
                        enableCharacterCountLimit: false,
                    },
                    placeholder: `输入选项内容（必填）`,
                    onContentChange: (
                        /**
                         * @type {PiptapEditor}
                         */
                        editor,
                    ) => {
                        if (index >= question_options.length) return;

                        question_options[index].value = editor.getPreviewHTML();
                        question_options_editors_warning[index] = 0;
                    },
                }}
            ></SmartEditor>
            {#if enable_delete_btn}
                <button
                    class="deleteOptionBtn"
                    onclick={() => onDeleteOption(index, question_option)}
                >
                    <img src={ICON.delete} alt="delete_icon" />
                </button>
            {/if}
        </div>
        <span class="inputWarnText">
            {question_options_editors_warning[index] === 1
                ? "选项内容不能为空"
                : "选项内容长度超出限制"}
        </span>
    </div>
{/snippet}

<!-- 多选题 -->
{#snippet multipleSelect()}
    {@render scoreInput()}
    {#each question_options as question_option, index}
        <div
            class="container contentInputContainer {question_options_editors_warning[
                index
            ] !== 0
                ? 'warning'
                : ''}"
        >
            <div class="labelText questionLabelText">
                <span class="spanWithBtn">
                    <button onclick={() => onSelectAnswer(question_option)}>
                        {#if !question_answers.includes(question_option.label)}
                            <img
                                class="checkboxButton"
                                src={ICON.checkbox_unselect}
                                alt="checkbox_unselect"
                            />
                        {:else}
                            <img
                                class="checkboxButton"
                                src={ICON.checkbox_selected_green}
                                alt="checkbox_selected_green"
                            />
                        {/if}
                    </button>
                    <span style="color:#D9001B">*</span
                    >选项{question_option.label}:</span
                >
                {#if question_answers.includes(question_option.label)}
                    <span class="correctAnswerLabel" style="visibility:visible;"
                        >正确答案</span
                    >
                {:else}
                    <span class="correctAnswerLabel" style="visibility:hidden;"
                        >正确答案</span
                    >
                {/if}
            </div>
            {@render selectionOptionRichTextEditor(question_option, index)}
        </div>
    {/each}
    <div class="addOptionBtnContainer">
        <button
            class="addOptionBtn"
            disabled={question_options.length >= 8 ? true : false}
            onclick={onAddOption}>添加选项</button
        >
    </div>
{/snippet}

<style lang="scss" scoped>
    button {
        margin: 0px;
        padding: 0px;
        border: 0px;
        background-color: transparent;
        cursor: pointer;
        user-select: none;

        display: flex;

        align-items: center;
        transition: all 0.2s ease;
        &:focus {
            outline: none;
        }
    }

    .editorContainer {
        display: flex;
        flex-direction: column;

        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;

        z-index: 999;
        background-color: #fff;

        transition: all 0.3s ease-in-out;

        overflow-x: auto;
        .topBar {
            display: flex;
            justify-content: space-between;
            font-size: 20px;
            font-family: PingFang SC;
            font-weight: 100;
            height: 65px;

            box-sizing: border-box;
            padding: 15px;

            min-width: 1000px;
            span {
                font-weight: normal;
                margin-left: 15px;
            }

            .topBarControlBtns {
                display: flex;
                .cancelBtn {
                    background-color: #f0f0f0;
                    width: 110px;
                    height: 35px;
                    font-size: 16px;
                    border-radius: 5px;

                    display: flex;
                    justify-content: center;
                    align-items: center;

                    color: #619cf5;
                    border: 1px solid #619cf5;

                    &:hover {
                        background-color: #e3e3e3;
                    }
                }

                .confirmBtn {
                    margin-left: 25px;
                    background-color: #619cf5;
                    width: 110px;
                    height: 35px;
                    font-size: 16px;
                    border-radius: 5px;

                    display: flex;
                    justify-content: center;
                    align-items: center;

                    color: #fff;
                    border: 1px solid #797979;

                    &:hover {
                        background-color: #578ddd;
                    }
                }
            }
        }

        .mainContent {
            display: flex;
            flex: 1;
            height: calc(100% - 65px);
            box-sizing: border-box;

            min-width: 1000px;
            .editArea {
                flex: 1;
                max-width: 55%;
                overflow-y: auto;

                padding-right: 16px;
                padding-bottom: 30px;
                box-sizing: border-box;
                // 默认保留滚动条空间
                scrollbar-gutter: stable;

                border-top: 1px solid rgba($color: #7b7b7b, $alpha: 0.5);
                border-right: 1px solid rgba($color: #7b7b7b, $alpha: 0.5);

                .contentInputContainer {
                    &:first-child {
                        margin-top: 0px;
                        margin-bottom: 0px;
                    }
                    &:last-child {
                        margin-bottom: 30px;
                    }
                }

                .difficultyOptionsContainer {
                    margin-top: 10px;
                    .difficultyOptions {
                        display: flex;

                        button {
                            margin-right: 10px;
                        }
                    }
                }

                .questionTagsContainer {
                    align-items: baseline;
                    .questionTags {
                        display: flex;
                        flex-wrap: wrap;
                    }
                }
            }

            .previewArea {
                flex: 1;
                max-width: 45%;

                box-sizing: border-box;
                border-top: 1px solid rgba($color: #7b7b7b, $alpha: 0.5);
            }
        }
    }

    .hide {
        transform: translateY(100%);
    }

    .radioButton,
    .checkboxButton {
        width: 20px;
        height: 20px;
    }

    .scoreContainer {
        display: flex;
        align-items: baseline;
        justify-content: flex-end;

        &.container {
            margin-top: 10px;
        }

        .content.scoreContent {
            display: flex;
            flex-direction: column;

            align-items: flex-start;
        }

        .scoreInput {
            border-top: none;
            border-right: none;
            border-bottom: none;
            border-left-color: rgba($color: #d4d4d4, $alpha: 0.5);
            outline: none;

            width: 50px;
            height: 20px;
            font-size: 14px;
        }
    }

    .labelText {
        white-space: nowrap;
        margin-right: 20px;
        font-size: 14px;

        & .spanWithBtn {
            display: flex;
        }
    }

    .questionLabelText {
        display: flex;
        flex-direction: column;
        align-items: end;

        .correctAnswerLabel {
            font-size: 12px;
            color: #66cd00;
        }
    }

    .container {
        display: flex;
        justify-content: end;
        width: 100%;
        margin-top: 20px;

        &:first-child {
            margin-top: 0px;
        }

        .content {
            display: flex;
            align-items: center;
            width: 85%;

            .inputWarnText {
                visibility: hidden;
                height: 10px;
                font-size: 12px;
            }
        }

        .content.richTextEditor {
            display: flex;
            flex-direction: column;
            justify-content: start;
            align-items: start;
            width: 85%;
            height: 250px;

            & > div {
                display: flex;
                height: calc(100% - 10px);
                width: 100%;
            }
        }
    }

    .container.warning {
        color: #d9001b;
        animation: bumpAnimation 1.3s ease-in-out 1;
        .content .inputWarnText {
            visibility: visible;
        }
    }

    .inputWarnText {
        user-select: none;
    }

    @keyframes bumpAnimation {
        0%,
        100% {
            transform: translateX(0);
        }
        15% {
            transform: translateX(15px);
        }
        25% {
            transform: translateX(13px);
        }
        30%,
        70% {
            transform: translateX(15px);
        }
        85% {
            transform: translateX(0);
        }
        95% {
            transform: translateX(2px);
        }
    }

    .addOptionBtn {
        color: #fff;
        margin-left: 25px;
        background-color: #0052d9;
        width: fit-content;
        padding: 5px 10px;
        font-size: 14px;
        border-radius: 5px;

        margin-left: 15%;
        display: flex;
        justify-content: center;
        align-items: center;

        color: #fff;
        border: 1px solid #797979;

        &:hover {
            background-color: #266fe8;
        }

        &:disabled {
            background-color: #b3c9f0;
        }
    }

    .addOptionBtnContainer {
        margin-top: 20px;
        width: 100%;
    }

    .deleteOptionBtn {
        width: 24px;
        height: 24px;
        margin-left: 10px;

        flex-shrink: 0;
        img {
            width: 100%;
            height: 100%;
        }
    }
</style>
