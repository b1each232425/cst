<script>
  let {
    question,
    ai_marked = null,
    onInputMarkedScore = () => {
      console.log('on input score')
    },
    onScoreInputBlur = () => {
      console.log('on score input blur')
    }
  } = $props()

  function replaceSpansWithLines(htmlString) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      const spans = doc.querySelectorAll('span.blank-item');

      spans.forEach(span => {
          const blankNumber = span.getAttribute('blanknumber') || '';
          const id = span.id;

          const line = document.createElement('span');
          // input.type = 'text';
          line.className = 'blank-item-line'; // 可选：添加样式
          line.setAttribute('data-blank-number', blankNumber);
          line.setAttribute('data-original-id', id);

          // 设置文本
          line.textContent = `_____`;


          // 替换 span 为 line
          span.replaceWith(line);
      });

      // 返回修改后的 HTML 字符串
      return doc.body.innerHTML;
  }

  $effect(()=>{
      if (question) {
          question.details.forEach(d => {
              d.content = replaceSpansWithLines(d.content)
          })
      }
  })

</script>


<div class="question-container">
  <div class="question-title">
    <p class="question-number">{question.order_num}.</p>
    <p class="question-type">【{question.type}】</p>
    <p class="question-score">（{question.total_score}分）</p>
    <p class="question-score">{question.addition}</p>
  </div>
  <div class="question-content">
    <!--                <text>-->
    <!--                  {question.stem}-->
    <!--                </text>-->
    {#each question.details as d, i (i)}
      <!--                  <p>{d.content}</p>-->
      {@html d.content}
    {/each}
  </div>
</div>
<div class="answer-container">
  <div class="answer-text">
    <p>学生作答</p>
  </div>
  <div class="answer-content">
    {#if !question.answer}
      <p>无</p>
    {:else}
      {#if question.answer.details && question.answer.details.length > 1}
        {#each question.answer.details as a, i (i)}
          <div style="display: flex; height:24px;">
            <p>
              （{i + 1}）
            </p>
            {@html a.content}
          </div>
        {/each}
      {:else}
        {#each question.answer.details as a, i (i)}
          {@html a.content}
        {/each}
      {/if}
    {/if}
  </div>
</div>
<div class="marking-area">
  <div class="score-container">
    <p style="margin-left: 25px">得分：</p>
    {#each question.standard_answers as d, index (index)}
      {#if question.standard_answers && question.standard_answers.length > 1}
        <p>（{index + 1}）</p>
      {/if}
      <div class="score-input-container">
        <input type="number" class="score-input" on:input={(e)=>{onInputMarkedScore(d.score, e)}}
               on:blur={(e)=>{onScoreInputBlur(question.order_num, index, e)}}
               bind:value={question.marked_score[index]} placeholder="输入得分"
               required min=0 max="{d.score}" maxlength="2">
      </div>
      <p style="margin-left: 8px; margin-right: 15px; color:#686767; font-size: 12px">（{d.score}分）
      </p>
    {/each}
  </div>
  <div class="dashed-line"></div>
  <div class="answer-mark-role-container">
    {#if ai_marked}
      <div class="mark-role-container" on:click={()=>{question.is_analyze_expanded = !question.is_analyze_expanded}}
           role="button" tabindex="0"
           on:keydown={()=>{}}>
        <div class="mark-role-title">
          <p style="height:45px; line-height: 45px; margin-left:25px;">【解析】</p>
        </div>
        <div class="mark-role-content {question.is_analyze_expanded ? 'expanded' : ''}">
          <p>{question.analyze}</p>
        </div>
      </div>
    {/if}
    <div class="mark-role-container" on:click={()=>{question.is_mark_role_expanded = !question.is_mark_role_expanded}}
         role="button" tabindex="0"
         on:keydown={()=>{}}>
      <div class="mark-role-title">
        <p style="height:45px; line-height: 45px; margin-left:25px;">【批改规则/提示词】</p>
      </div>
      <div class="mark-role-content {question.is_mark_role_expanded ? 'expanded' : ''}">
        <p>{question.mark_role}</p>
      </div>
    </div>
    <div class="mark-role-container"
         on:click={()=>{question.is_standard_answer_expanded = !question.is_standard_answer_expanded}} role="button"
         tabindex="0"
         on:keydown={()=>{}}>
      <div class="mark-role-title">
        <p style="height:45px; line-height: 45px; margin-left:25px;">【答案】</p>
      </div>
      <div class="mark-role-content {question.is_standard_answer_expanded ? 'expanded' : ''}">
        <p>{question.standard_answer}</p>
      </div>
    </div>
  </div>
</div>
<div class="question-separator"></div>


<style scoped>
    p {
        font-size: 14px;
        margin-block-start: 0;
        margin-block-end: 0;
        margin-inline-start: 0;
        margin-inline-end: 0;
    }

    .question-container {
        width: 100%;
        height: max-content;
    }

    .question-title {
        height: 45px;
        line-height: 45px;
        width: 100%;
        display: flex;
        align-items: center;
    }

    .question-content {
        height: max-content;
        /*width: calc(100% - 50px);*/
        margin-left: 25px;
        margin-right: 25px;
    }

    .question-content text {
        line-height: 45px;
        height: 45px;
    }

    .question-content p {
        line-height: 45px;
        height: 45px;
    }


    .answer-container {
        background-color: #f7f8fb;
        /*min-height: 120px;*/
        display: flex;
        flex-direction: column;

    }

    .answer-text {
        margin-left: 25px;
        height: 45px;
        margin-top: 11px;
        /*width: 100%;*/
    }

    .answer-text p {
        height: 45px;
        line-height: 45px;
    }

    .answer-content {
        margin-left: 40px;
        margin-right: 40px;
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        /*height: 16px;*/
    }

    .answer-content p {
        color: #0c1b6a;
        line-height: 24px;
        height: 24px;
    }

    .marking-area {
        margin-top: 10px;
        background-color: #f7f8fb;
        /*min-height: 171px;*/
        height: auto;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .score-container {
        min-height: 70px;
        width: 100%;
        display: flex;
        align-items: center;
    }

    input {
        -moz-appearance: textfield;
    }

    input::-webkit-inner-spin-button,
    input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .score-input {
        width: 80px;
        height: 36px;
        padding: 2px 2px 2px 2px;
        border-radius: 3px;
        border: 1px solid #e4e7ed;
        background-color: #ffffff;
        box-sizing: border-box;
        font-family: 'PingFangSC-Regular', 'PingFang SC', sans-serif;
        color: #333333;
        text-align: center;
        font-size: 14px;
    }

    input:focus {
        outline: none;
    }

    .score-input:focus {
        border: 1px solid #b3c0dc;
    }

    .dashed-line {
        background: repeating-linear-gradient(to right, #b7b7b7, #b7b7b7 10px, transparent 10px, transparent 15px); /* 创建一条虚线背景 */
        height: 1px; /* 设置元素的高度为1像素 */
        /*width: 100%; !* 设置元素的宽度为100% *!*/
        margin-left: 25px;
        margin-right: 25px;
    }

    .answer-mark-role-container {
        width: 100%;
        height: max-content;
        min-height: 100px;
    }

    .mark-role-container {
        min-height: 45px;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .mark-role-container:hover {
        background-color: #e7edf3;
        cursor: pointer;
    }

    .mark-role-title {
        height: 45px;
    }

    .mark-role-content {
        min-height: 0;
        height: 1px;
        margin-left: 40px;
        margin-right: 40px;
        margin-bottom: 12px;
        overflow: hidden;
    }

    .mark-role-content p {
        color: #624242;
        line-height: 25px;
    }

    .expanded {
        height: auto;
    }

    .question-separator {
        height: 1px;
        min-height: 1px;
        background-color: #e3e3e3;
        width: 100%;
        margin: 45px 0 30px;
    }
</style>