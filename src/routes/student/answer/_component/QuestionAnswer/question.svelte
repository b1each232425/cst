<!-- /*
 * @Author: OuYang Haobin 1242968386@qq.com
 * @Date: 2025-04-14 11:01:03
 * @LastEditors: OuYang Haobin 1242968386@qq.com
 * @LastEditTime: 2025-04-30 15:42:39
 * @FilePath: /tutorial-platform-fe/src/lib/component/QuestionAnswer/question.svelte
 * @Description: 题目显示组件
 */ -->

<script>
  import { onMount } from "svelte";
  import Answer from "./answer.svelte";
  import "@3min/cst-tiptap/dist/style.css";

  const max_input_len = 100;

  let { question=$bindable(), index, ifPreview, saveAnswer, query_url, editor_height } =
    $props();

  // 绑定当前题干容器，用于局部查找 input
  let contentWrapper; 

  // 获取学生题目的答题情况
  async function getStudentAnswer() {

    if (ifPreview) {
      console.log("当前为预览模式");
      return;
    }
    if (!contentWrapper) {
      return;
    }
    const inputs = contentWrapper.querySelectorAll("input.blank-item-input");
    try {
      const res = await fetch(`${query_url}&question_id=${question.ID}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        console.log("获取答题情况失败");
        return;
      }

      const data = await res.json();

      if (data.status !== 0) {
        console.log("获取答题情况失败:", data.msg);

        // -10 表示没有作答记录，补空答案
        if (data.status === -10) {
          let answer = {
            question_id: Number(question.ID),
            answer: Array(inputs.length).fill(""),
            type: question.Type,
          };
          await saveAnswer(answer, question, false, []);
        }
        return;
      }

      // status === 0，获取成功
      const answer = data.data.Answer.answer;

      // console.log("获取填空题答题情况成功:", answer);

      if (Array.isArray(answer) && answer.length > 0) {
        // 只在当前组件下查找 input

        inputs.forEach((input, index) => {
          if (answer[index] !== undefined) {
            input.value = answer[index];
          }
        });
      } else {
        // 后端返回的是空数组，也需要存入空答案
        let answer = {
          question_id: Number(question.ID),
          answer: Array(inputs.length).fill(""),
          type: question.Type,
        };
        await saveAnswer(answer, question, false, []);
      }
    } catch (e) {
      console.log("获取答题情况失败:", e);
    }
  }
  function replaceSpansWithLines(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const spans = doc.querySelectorAll("span.blank-item");

    spans.forEach((span) => {
      const blankNumber = span.getAttribute("blanknumber") || "";
      const id = span.id;

      const input = document.createElement("input");
      input.type = "text";
      input.className = "blank-item-input";
      input.setAttribute("data-blank-number", blankNumber);
      input.setAttribute("data-original-id", id);
      input.maxLength = max_input_len; 
      input.style.width = "80px"; // 初始宽度
      input.style.minWidth = "80px"; // 最小宽度
      input.style.textAlign = "center";
      input.style.border = "none";
      input.style.borderBottom = "1px solid black";
      input.style.outline = "none";
      input.style.boxSizing = "content-box";
      input.style.padding = "0px 0px 0px 0px";
      input.style.margin = "0px 0px 0px 0px";
      input.style.fontSize = "16px";

      // 移除事件监听器，因为我们在onMount中添加
      span.replaceWith(input);
    });

    return doc.body.innerHTML;
  }

  onMount(async () => {
    if (question.Type !== "06") return;
    question.Content = replaceSpansWithLines(question.Content);

    // 在DOM渲染后，为所有input添加事件监听器
    setTimeout(async () => {
      if (contentWrapper) {
        await getStudentAnswer(); // 渲染完后填充答案
        const inputs = contentWrapper.querySelectorAll(
          "input.blank-item-input"
        );
        inputs.forEach((input) => {
          // 创建一个隐藏 span，用于测量文字宽度
          const mirror = document.createElement("span");
          mirror.style.visibility = "hidden";
          mirror.style.position = "absolute";
          mirror.style.whiteSpace = "pre";
          mirror.style.font = "inherit";
          mirror.style.padding = "0";
          mirror.style.margin = "0";
          mirror.style.border = "none";
          mirror.style.width = "fit-content";
          document.body.appendChild(mirror);

          // 初始宽度设置
          const adjustWidth = () => {
            mirror.textContent = input.value || "_";
            console.log(mirror.offsetWidth);
            input.style.width = mirror.offsetWidth + "px";
          };

          adjustWidth(); // 初始调用一次
          input.addEventListener("input", async () => {
            adjustWidth();
            // console.log("input change:", input.value);

            const allInputs = contentWrapper.querySelectorAll(
              "input.blank-item-input"
            );
            const combinedAnswer = Array.from(allInputs).map((el) =>
              el.value.trim()
            );
            question.Answer = combinedAnswer;
            // console.log("combinedAnswer:", combinedAnswer);

            const answer = {
              question_id: Number(question.ID),
              answer: combinedAnswer,
              type: question.Type,
            };

            await saveAnswer(answer, question, false, []);
          });
        });
        // console.log('事件监听器已添加到', inputs.length, '个输入框');
      } else {
        console.log("没有找到题干容器");
      }
    }, 0);
  });

  $effect(() => {
    if (question.Type === "06" ) {
      getStudentAnswer(); // 渲染完后填充答案
    }
  });

</script>

<div class="question">
  <div class="question-content">
    {#if index !== null && index !== undefined}
      <h2>{index + 1}.</h2>
    {/if}
    <div class="piptap-content" style="width: 80%;" bind:this={contentWrapper}>
      {@html question.Content}
    </div>
  </div>

  {#if question.Type !== "06"}
    <Answer bind:question={question} {ifPreview} {saveAnswer} {query_url} {editor_height} />
  {/if}
</div>

<style scoped lang="scss">
  .question {
    background-color: #fff;
    border-radius: 8px;
    margin-bottom: 25px;
    width: 100%;
    min-width: 100%;
    max-width: 100%;
  }

  .question-content {
    display: flex;
    padding-bottom: 10px;

    h2 {
      font-weight: 500;
      margin-right: 10px;
      font-size: 16px;
    }
  }
</style>
