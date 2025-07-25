<!-- /*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-04-14 11:15:25
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-04-30 15:35:13
 * @FilePath: /tutorial-platform-fe/src/lib/component/QuestionAnswer/answer.svelte
 * @Description: 考试答题组件
 */ -->

<script>
  //打包后修改引入方式
  import RichTextEditor from "@3min/smart-edit";
  import Option from "./option.svelte";
  import { onMount } from "svelte";
  import { Answer, getAnswerFilesPath } from "./utils";

  /**
   * @typedef {Object} Option
   * @property {string} label - 选项标签，如 A、B、C
   * @property {string} value - 富文本格式的选项内容
   */

  /**
   * @typedef {Object} Question
   * @property {number} id - 题目 ID
   * @property {string} type - 题目类型编号，如 "02"、"04"、"06"
   * @property {string} group_name - 题目分组名称，通常带有题号与分值
   * @property {string} content - 题干内容，通常是 HTML 字符串
   * @property {Option[]} [options] - 可选的题目选项，仅选择题/判断题存在
   * @property {number} [answer_num] - 可选的答案数量，通常用于简答题或填空题
   */

  /**
   * 上传处理器
   * @param {File} file 上传的文件对象
   * @param {string}uploadFormName 上传文件在 form-data 中对应的 key（比如 "file"）
   * @returns 上传结果（Promise）
   */
  const uploadHandler = async (file, uploadFormName) => {
    const formData = new FormData();

    // 1. 添加文件字段
    formData.append("file", file);

    // 2. 添加文本字段（固定为 file_dir）
    formData.append("file_dir", "/exam_answer");

    // 3. 发起 POST 请求
    const res = await fetch("/api/uploadFiles", {
      method: "POST",
      body: formData,
    });

    // 错误处理（重复判断）
    if (!res.ok || res.status !== 200) {
      throw new Error(`上传失败，状态码 ${res.status}`);
    }

    // 4. 返回 JSON 结果
    let resp = await res.json();
    let result = {
      errorCode: Number(resp.status),
      data: {
        src: resp.data[0],
        alt: "加载失败",
      },
    };
    console.log(result);
    return result;
  };

  //富文本编辑器的宽度和高度
  const editor_width = "100%";

  //获取父组件传递下来的题目信息
  let { question, ifPreview, query_url, saveAnswer, editor_height } = $props();

  //题目id
  let question_id = $state(question.id);

  //此题的答案
  let student_answer = $state({ answer: initial(question) });
  /**
   * 富文本编辑器组件实例
   * @type {(SmartEditor | null)[]}
   */
  let rich_text_editors = $state(Array(question.answer_num || 1).fill(null));

  onMount(async () => {
    //从数据库获取学生的此答题记录
    await getStudentAnswer();
  });

  $effect(() => {
    if (question.id != question_id) {
      getStudentAnswer();
    }
  });

  /**
   * 初始化答案类型
   * @param {Question} question
   *
   */
  function initial(question) {
    // console.log("初始化答案类型");
    switch (question.type) {
      case "00":
        return [];
      case "02":
        return [];
      case "04":
        return [];
      case "08":
        return Array(question.answer_num || 1).fill(""); // 简答题，初始化为空字符串数组
      case "06":
        return Array(question.answer_num || 1).fill(""); // 填空题，初始化为空字符串数组
      default:
        return [];
    }
  }

  /**
   * 为每个编辑器生成独立的配置
   * @param {number} index 编辑器索引
   * @returns {Object} 编辑器配置
   */
  function getEditorOptions(index) {
    return {
      autoFocus: false,
      editable: true,
      content: "",
      table: {
        overflow: false,
      },
      image: {
        inline: true,
        uploadFormName: "image",
        uploader: uploadHandler,
        sizeLimit: 30,
      },
      video: {
        inline: true,
        uploadFormName: "video",
        uploader: uploadHandler,
        defaultSize: 30,
        sizeLimit: 30,
      },
      attachment: {
        inline: true,
        uploadFormName: "attachment",
        uploader: uploadHandler,
        sizeLimit: 30,
      },
      link: {
        protocols: [],
      },
      audio: {
        inline: true,
        uploadFormName: "audio",
        uploader: uploadHandler,
        sizeLimit: 30,
      },
      onContentChange: (
        /**
         * @type {any}
         */ editor
      ) => {
        if (ifPreview) {
          console.log("当前为预览模式");
          return;
        }
        if (rich_text_editors[index]) {
          let editor_text = rich_text_editors[index].getHTML();
          setTimeout(async () => {
            //仅当内容不一样的时候才发送修改请求
            if (editor_text != student_answer.answer[index]) {
              student_answer.answer[index] = editor_text;

              /**
               * @type {Answer}
               */
              // 构建答案数据并保存
              let answer = {
                question_id: Number(question.id),
                answer: student_answer.answer,
                type: question.type,
              };

              //获取作答中的文件路径
              let attachment_paths = getAnswerFilesPath(answer);
              console.log("attachment_paths", attachment_paths);
              await saveAnswer(
                answer,
                question,
                false,
                (attachment_paths = attachment_paths)
              );
              console.log(answer);
            }
          }, 1000);
        }
      },
    };
  }

  // 获取学生题目的答题情况
  async function getStudentAnswer() {
    if (ifPreview) {
      console.log("当前为预览模式");
      return;
    }
    try {
      const res = await fetch(`${query_url}&question_id=${question.id}`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        console.log("获取答题情况失败");
        student_answer.answer = initial(question);
        return;
      }

      const data = await res.json();
      if (data.status !== 0) {
        console.log("获取答题情况失败:", data.msg);
        if (data.status === -10) {
          student_answer.answer = initial(question);
          let answer = {
            question_id: Number(question.id),
            answer: student_answer.answer,
            type: question.type,
          };
          await saveAnswer(answer, question, false, []);
        }
      } else {
        // console.log("获取答题情况成功:", data.data);
        let answer = data.data.Answer;
        if (Object.keys(answer).length !== 0) {
          // console.log("获取答题情况成功:", answer);
          student_answer.answer = answer.answer;
          if (question.type === "06" || question.type === "08") {
            student_answer.answer.forEach(async (item, index) => {
              console.log("item:", index);
              if (rich_text_editors[index]) {
                let editor = rich_text_editors[index].getEditor();
                console.log(
                  "rich_text_editors[index]:",
                  $state.snapshot(rich_text_editors[index])
                );
                await rich_text_editors[index].waitEditorReady();
                rich_text_editors[index].setContent(item);
                //判断富文本是否已经加载完
                // if (editor){
                //   rich_text_editors[index].setContent(item);
                // }else{
                //   //没有加载完就需要轮询去加载
                //   waitAndSetContent(index,item);
                // }
              } else {
                console.error("rich_text_editors[index] is null");
              }
            });
          }
        } else {
          // console.log("继续补充空数据");
          student_answer.answer = initial(question);
          let answer = {
            question_id: Number(question.id),
            answer: student_answer.answer,
            type: question.type,
          };
          await saveAnswer(answer, question, false, []);
        }

        return;
      }
    } catch (e) {
      console.log("获取答题情况失败:", e);
      student_answer.answer = initial(question);
      return;
    }
  }

  /**
   * 处理单选题、判断题
   * @param {string}question_id
   * @param {string}option_id
   */
  async function handleOptionSelect(question_id, option_id) {
    if (ifPreview) {
      console.log("当前为预览模式");
      return;
    }
    console.log("student_answer.answer:", student_answer.answer);
    student_answer.answer.length = 0;
    student_answer.answer.push(option_id);
    console.log("Selected option for question ", option_id);

    if (question.type === "判断题" && ["A", "B"].includes(option_id)) {
      console.error("判断题请选择A或B");
      return;
    }

    let answer = {
      question_id: Number(question_id),
      answer: student_answer.answer,
      type: question.type,
    };

    await saveAnswer(answer, question, false, []);
  }

  /**
   * 处理多选题
   * @param {string}question_id
   * @param {string}option_id
   */
  async function handleMultiOptionSelect(question_id, option_id) {
    if (ifPreview) {
      console.log("当前为预览模式");
      return;
    }
    //如果当前选项已经被选中，则取消选择，否则选择它
    if (!student_answer.answer) {
      student_answer.answer = [option_id];
    } else {
      if (!student_answer.answer.includes(option_id)) {
        student_answer.answer.push(option_id);
      } else {
        student_answer.answer = student_answer.answer.filter(
          (id) => id !== option_id
        );
      }
    }
    console.log("Selected options for question ", student_answer.answer);

    let answer = {
      question_id: Number(question_id),
      answer: student_answer.answer,
      type: question.type,
    };

    await saveAnswer(answer, question, false, []);
  }
</script>

<div class="layout">
  <!-- 单选题 -->
  {#if question.type === "00"}
    <div class="options">
      {#each question.options as option}
        <label class="option">
          <input
            type="radio"
            name="question-{question.id}"
            value={option.label}
            checked={student_answer.answer?.includes(option.label)}
            onchange={() => handleOptionSelect(question.id, option.label)}
            class="hidden-radio"
          />
          <span class="option-id">{option.label}</span>
          <Option {option} />
        </label>
      {/each}
    </div>
    <!-- 多选题 -->
  {:else if question.type === "02"}
    <div class="options">
      {#each question.options as option}
        <label class="option">
          <input
            type="checkbox"
            name="question-{question.id}"
            value={option.label}
            checked={student_answer.answer?.includes(option.label)}
            onchange={() => handleMultiOptionSelect(question.id, option.label)}
            class="hidden-radio"
          />
          <span class="option-id-multiple">{option.label}</span>
          <Option {option} />
        </label>
      {/each}
    </div>
    <!-- 判断题 -->
  {:else if question.type === "04"}
    <div class="options">
      {#each question.options as option}
        <label class="option">
          <input
            type="radio"
            name="question-{question.id}"
            value={option.id}
            checked={student_answer.answer?.includes(option.label)}
            onchange={() => handleOptionSelect(question.id, option.label)}
            class="hidden-radio"
          />
          <span class="option-id">{option.label}</span>
          <span>{option.value}</span>
        </label>
      {/each}
    </div>
    <!-- 填空题 -->
  {:else if question.type === "06"}
  
    <!-- 简答题 -->
  {:else if question.type === "08"}
    {#each Array(question.answer_num) as _, index}
      <div class="fill-blank">
        {#if question.answer_num > 1}
          <div class="question-id">
            （{index + 1}）
          </div>
        {/if}

        <div class="rich-text-editor">
          <RichTextEditor
            bind:this={rich_text_editors[index]}
            width={editor_width}
            height={editor_height}
            editor_options={getEditorOptions(index)}
          />
        </div>
      </div>
    {/each}
  {/if}
</div>

<style scoped lang="scss">
  //最外层容器
  .layout {
    max-width: 100%;
    width: 100%;
  }
  //富文本编辑器容器
  .rich-text-editor {
    width: 95%;
    max-width: 95%;
    flex-grow: 0;
    flex-shrink: 0;
  }
  //选项容器
  .options {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  //每个选项样式
  .option {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 10px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f0f7ff;
    }

    input {
      margin-right: 10px;
    }
    //选项label样式
    .option-id {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      min-width: 30px;
      height: 30px;
      text-align: center;
      border-radius: 50%;
      background-color: white;
      border: 1px solid #797979;
      margin-right: 10px;
      font-size: 16px;
    }
    /* 选中样式：当 input 被选中时，改变 option-id 的外观 */
    input:checked + .option-id {
      background-color: #e8f3ff;
      border: 1px solid #165dff;
      color: #165dff;
    }
    input:checked + .option-id-multiple {
      background-color: #e8f3ff;
      border: 1px solid #165dff;
      color: #165dff;
    }
    .option-id-multiple {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      min-width: 30px;
      height: 30px;
      text-align: center;
      background-color: white;
      border: 1px solid #797979;
      margin-right: 10px;
      font-size: 16px;
      border-radius: 8px;
    }
  }

  //填空题或者选择题答题容器
  .fill-blank {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    max-width: 100%;
    margin-bottom: 15px;
  }
  .question-id {
    width: 5%;
    max-width: 5%;
    font-size: 14px;
  }
  /* 隐藏原生单选按钮 */
  .hidden-radio {
    display: none;
  }
</style>
