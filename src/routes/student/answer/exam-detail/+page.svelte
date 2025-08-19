<script>
  /*
   * @Author: PENG HAIFENG 1614818457@qq.com
   * @Date: 2025-07-23 10:55:37
   * @LastEditors: PENG HAIFENG 1614818457@qq.com
   * @LastEditTime: 2025-07-30 10:28:54
   * @FilePath: \src\routes\student\answer\exam-detail\+page.svelte
   * @Description: 考试详情页
   */

  import { onMount } from "svelte";
  import { formatTimestamp } from "../_utils/time_utils";
  import { page } from "$app/state";
  import { fly } from "svelte/transition";
  import { goto } from "$app/navigation";
  import { toast } from '$lib/components/Toast/Toast';
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';
  import { sget } from '$lib/utils/index.js';

  /**
   * @typedef {Object} ExamineeSession
   * @property {number} ID - 考试场次 ID
   * @property {number} ExamID - 所属考试 ID
   * @property {string} PaperID - 试卷 ID
   * @property {string} PeriodMode - 考试时间模式（如固定时间段、倒计时等）
   * @property {string} StartTime - 开始时间（ISO 字符串格式）
   * @property {string} EndTime - 结束时间（ISO 字符串格式）
   * @property {number} Duration - 考试时长（单位：分钟）
   * @property {number} SessionNum - 当前场次编号（第几场）
   * @property {number} ExamineeID - 考生 ID
   * @property {number} LateEntryTime - 允许迟到进入的时间（单位：分钟）
   * @property {number} EarlySubmissionTime - 最早可交卷时间（单位：分钟）
   * @property {number} StartTimeTimestamp - 开始时间戳
   * @property {number} EndTimeTimestamp - 结束时间戳
   *

   *
   * 文件信息对象
   * @typedef {Object} FileInfo
   * @property {string} save_path - 文件在服务器保存的相对位置
   * @property {string} file_name - 文件的原始名称
   * @property {string} save_path - 文件在服务器上的保存路径，用于下载
   * @property {string} storage_name - 文件在存储系统中的名称
   * @property {string} upload_time - 文件的上传时间，格式为ISO字符串
   *

   *
   * 考试场次信息
   * @type {ExamineeSession[]}
   *
   *
   * 获取考试信息
   * @type {string | null}
   *

   *
   * 下载考试附件
   * @param {FileInfo} file - 文件信息对象
   *

   * attachmentContainer
   * @type {HTMLDivElement}
   *

   *
   * 获取考试状态并设置按钮文本 function fetchExamStatus
   * @param {string|number} exam_id - 考试ID
   * @param {number} examinee_id - 考生ID
   * @returns {Promise<void>}
   *

   *
   * 下载文件
   * @param {{ save_path: string, file_name: string }} file
   */

  let title = $state(""); // 考试标题
  let exam_info = $state(null); // 考试信息
  let exam_sessions = $state([]); //考场
  let exam_id = $state(""); //考试id
 // let exam_session_id = $state(""); //考场id
  let exam_notes = $state(""); // 考生须知内容
  let current_session = $state(0); // 当前考场
  let button_text = $state("等待考试开始"); // 按钮文本
  let pre_text = $state("<<上一场"); // 上一场文本
  let flyDirection = $state(1); // 1代表下一场（向左飞入），-1代表上一场（向右飞入）
  let isAttachmentExpanded = $state(false); // 附件区域是否展开
  let showExpandButton = $state(false); // 是否显示展开按钮
  let attachmentContainer = $state(null); // 附件容器引用
  let files = $state([]); // 附件列表
  
  //文件下载类  
  async function downloadAttachment(file) { // 使用文件的save_path构建下载URL
    try {
      const downloadUrl = `/api/file/${file.checksum}`;
      const a = document.createElement("a"); // 创建一个a标签来触发下载
      a.href = downloadUrl;
      a.download = file.name; // 使用原始文件名
      a.target = "_blank"; //防止跳转到新窗口
      document.body.appendChild(a); // 添加到DOM并触发点击
      a.click();
      setTimeout(() => { // 清理DOM
        document.body.removeChild(a);
      }, 100);
      toast.success(`正在下载: ${file.name}`); // 显示下载成功提示
    } catch (error) {
      console.error("下载文件失败:", error);
      toast.error(`下载文件失败！${error.message || ''}`);
    }
  }
  async function downloadAllAttachments() { // 下载所有附件
    if (!files || files.length === 0) {
      toast.error("没有可下载的附件");
      return;
    }
    for (const file of files) { // 遍历所有文件并下载
      await downloadAttachment(file);
      await new Promise((resolve) => setTimeout(resolve, 300)); // 添加小延迟，避免浏览器同时触发太多下载
    }
  }
  function downloadFile(file) { //下载文件
    const url = `/api/file/${file.checksum}`; // 拼接文件 URL

    const a = document.createElement("a"); // 创建 a 标签触发下载
    a.href = url;
    a.download = file.name || "downloaded_file";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
  }

  //按钮逻辑类
  async function clickButton() { //进入考试
    if (button_text === "进入考试") {
      try {
        let session = exam_sessions[current_session];

        let now = new Date().getTime();
  //      console.log("进入考试", session.StartTime, session.EndTime, now);
        await goto(
          `/student/answer/exam/?exam-id=${exam_id}&exam-session-id=${session.ID}`
        );
      } catch (e) {
        console.log("进入考试时出错：", e.message);
        toast.error(`进入考试时出错！${e.message || ''}`, 2000);
      }
    }
  }
  async function backToExamList() { //返回考试列表
    window.location.href = "/student/exam";
  }
  function fetchExamStatus(exam_session_id) { // 获取考试状态并且设置按钮文本
    return fetch(`/api/respondent/exam/status?exam_session_id=${exam_session_id}`, {
      method: "GET",
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(error_text => {
            console.error("获取考试状态失败:", error_text);
            toast.error(`获取考试状态失败！${error_text}`, 2000);
            throw new Error(`获取考试状态失败: ${error_text}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.status !== 0) {
          console.error("获取考试状态失败:", data.msg);
          toast.error(`获取考试状态失败！${data.msg || ''}`, 2000);
          throw new Error(`获取考试状态失败: ${data.msg}`);
        }
        // 根据返回的状态设置button_text
        // StartTimeNotArrived = 1: 考试开始时间未到
        // EndTimeArrived = 2: 考试结束时间已到
        // ExamSubmitted = 3: 考试已提交
        // LastEntryTimeArrived = 4: 最晚进入时间已到
        // ExamCanBeEnter = 5: 考试可以进入
        const examStatus = data.data;
        switch (examStatus) {
          case 1:
            button_text = "等待考试开始";
            break;
          case 2:
            button_text = "考试已结束";
            break;
          case 3:
            button_text = "考试已提交";
            break;
          case 4:
            button_text = "进入考试时间已过";
            break;
          case 5:
            button_text = "进入考试";
            break;
          default:
            button_text = "等待考试开始";
        }
        return examStatus;
      })
      .catch(error => {
        console.error("获取考试状态失败:", error);
        toast.error(`获取考试状态失败！${error.message || ''}`, 2000);
      });
  }
  function nextSession() { //下一场
    if (current_session < exam_sessions.length - 1) {
      flyDirection = 1; // 下一场，往左飞
      current_session++;
    }
  }
  function prevSession() {  //上一场
    if (current_session > 0) {
      flyDirection = -1; // 上一场，往右飞
      current_session--;
    }
  }

  $effect(() => { // 当current_session变化时，重新调用API获取考试状态
    if (exam_id && exam_sessions && exam_sessions.length > 0) {
       fetchExamStatus(exam_sessions[current_session].ID);
    }
  });
  
  onMount(async () => { //加载函数
    const params = page.url.searchParams;
    exam_id = params.get("exam-id");

    if (!exam_id ) { // 检查参数是否存在
      MessageBox({
        title: '未知路径',
         content: '未知路径',
        show_cancel_button: false,
          onConfirm: () => {
             goto("/student/exam"); 
        },
      });
      return;
    }

    fetch(`/api/exam?exam_id=${exam_id}`, {
      method: "GET",
      credentials: "include"
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          return response.text().then(err_text => {
            console.error("获取考试信息失败:", err_text);
            toast.error(`获取考试信息失败: ${err_text}`, 2000);
            throw new Error(`获取考试信息失败: ${err_text}`);
          });
        }
      })
      .then(data => {
        if (data.status !== 0) {
          console.error("获取考试信息失败:", data.msg);
          toast.error(`获取考试信息失败: ${data.msg || ''}`, 2000);
          throw new Error(data.Msg);
        } else {

        if (!data.data.examInfo.Name) throw new Error('标题不能为空'); // 考试信息
          title = data.data.examInfo.Name;

        if (!data.data.examInfo.Rules) throw new Error('考生须知不能为空'); // 考生须知
          exam_notes = data.data.examInfo.Rules;
        
        if (!data.data.examInfo)   throw new Error('考试信息不能为空');
         exam_info = data.data.examInfo;

        if (!data.data.examSessions || data.data.examSessions.length === 0) {
          throw new Error('没有可用的考试场次');
        }
        exam_sessions = data.data.examSessions.map(session => ({
          ...session,
          StartTimeTimestamp: new Date(session.StartTime).getTime(),
          EndTimeTimestamp: new Date(session.EndTime).getTime()
        }));

        files = data.data.files || []; // 获取附件列表

      /*    title = sget(data, "data.examInfo.Name", "无标题");
          exam_notes = sget(data, "data.examInfo.Rules", "暂无规则说明");
          exam_info = sget(data, "data.examInfo", {});
          exam_sessions = sget(data, "data.examSessions", []).map(session => ({
            ...session,
            StartTimeTimestamp: new Date(sget(session, "StartTime", 0)).getTime(),
            EndTimeTimestamp: new Date(sget(session, "EndTime", 0)).getTime()
          }));
          files = sget(data, "data.files", []); // 获取附件列表*/
        }
      })
      .catch(error => {
        console.error("获取考试信息失败:", error);
        toast.error(`获取考试信息失败！${error.message || ''}`, 2000);
        return;
      });

    if (exam_id && exam_sessions && exam_sessions.length > 0) { // 调用/api/student/exam/status接口查看当前状态
      await fetchExamStatus(exam_sessions[current_session].ID);
    }

    if (exam_sessions && exam_sessions.length > 0) {
      const now = new Date().getTime();
      let upcomingSessionIndex = 0;
      let minTimeDiff = Infinity;
      let allEnded = true;
      let hasOngoingSession = false;
      let ongoingSessionIndex = 0;

      
      exam_sessions.forEach((session, index) => { // 首先检查是否有正在进行中的考试
        if (now <= session.EndTimeTimestamp) { // 检查是否所有考试都已结束
          allEnded = false;
        }
        if ( // 检查是否有正在进行中的考试（开始时间已过，结束时间未到）
          now >= session.StartTimeTimestamp &&
          now <= session.EndTimeTimestamp
        ) {
          hasOngoingSession = true;
          ongoingSessionIndex = index;
        }
        const timeDiff = session.StartTimeTimestamp - now; // 查找还未开始但最近要开始的考试
        if (timeDiff > 0 && timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          upcomingSessionIndex = index;
        }
      });

      if (allEnded) { // 所有考试都已结束，跳到最后一个
        current_session = exam_sessions.length - 1;
      } else if (hasOngoingSession) { // 有正在进行中的考试，优先跳转到该场次
        current_session = ongoingSessionIndex;
      } else { // 没有正在进行的考试，跳转到最近要开始的考试
        current_session = upcomingSessionIndex;
      }
    }

    
    if (attachmentContainer) { // 检查附件内容是否超出默认高度
      setTimeout(() => { // 使用setTimeout确保DOM已完全渲染
        const contentHeight = attachmentContainer.scrollHeight; // 获取内容实际高度和容器最大高度
        const containerMaxHeight = 35; // 默认最大高度，与CSS中保持一致

        showExpandButton = contentHeight > containerMaxHeight; // 如果内容高度超过容器最大高度，显示展开按钮
        console.log(
          "附件内容高度:",
          contentHeight,
          "最大高度:",
          containerMaxHeight,
          "是否显示展开按钮:",
          showExpandButton
        );
      }, 100);
    }
  });
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.9.4/css/bulma.min.css"
  />
</svelte:head>

{#if exam_sessions.length > 0}
  <div class="exam-detail-container">
    <div class="nav">
      <div class="nav-left">
        <button class="back-btn" onclick={backToExamList}>
          <span class="icon"> ← </span>
          <span> 返回 </span>
        </button>
      </div>
      <div class="nav-right"></div>
    </div>
    <div class="paper-header">
      <h1>{title}</h1>
    </div>

    <div class="info-section">
      <div class="info-header">
        <h2>考生须知</h2>
      </div>

      <div class="notice-content">
        <div class="piptap-content">
          {@html exam_notes}
        </div>
      </div>
    </div>
    {#if files && files.length > 0}
      <div
        class="attachment-section {isAttachmentExpanded
          ? 'expanded-attachments'
          : ''}"
      >
        <div class="attachment-header">
          <span style="font-weight: 1000; padding-top: 5px;">考试附件：</span>
          <div
            class="attachment-files-container"
            bind:this={attachmentContainer}
          >
            <!-- 显示已上传的文件列表 -->
            {#each files as file, index}
              <div class="file-list">
                <div class="file-item">
                  <button
                    class="file-name-button"
                    onclick={() => {
                      downloadFile(file);
                    }}>{file.name}</button
                  >
                </div>
              </div>
            {/each}
          </div>
          <div class="attachment-actions">
            <button class="download-btn" onclick={downloadAllAttachments}
              >一键下载</button
            >
            {#if showExpandButton}
              <button
                class="expand-button"
                onclick={() => (isAttachmentExpanded = !isAttachmentExpanded)}
                >{isAttachmentExpanded ? "收起" : "展开"}</button
              >
            {/if}
          </div>
        </div>
      </div>
    {/if}
    <div class=" exam-time-section">
      {#key current_session}
        <div
          class="time-layout"
          in:fly={{ y: 300 * flyDirection, x: 0, duration: 300 }}
          out:fly={{ y: -300 * flyDirection, x: 0, duration: 300 }}
        >
          <div class="exam-info-item">
            <span class="label">考试时长：</span>
            <span>{exam_sessions[current_session]?.Duration} 分钟</span>
          </div>
          <div class="exam-info-item">
            <span class="label">开始时间：</span>
            <span
              >{formatTimestamp(
                exam_sessions[current_session]?.StartTimeTimestamp !== undefined
                  ? exam_sessions[current_session].StartTimeTimestamp
                  : 0
              )}</span
            >
          </div>
          {#if exam_sessions[current_session]?.PeriodMode === "00"}
            <div class="exam-info-item">
              <span class="label">结束时间：</span>
              <span
                >{formatTimestamp(
                  exam_sessions[current_session]?.EndTimeTimestamp !== undefined
                    ? exam_sessions[current_session].EndTimeTimestamp
                    : 0
                )}</span
              >
            </div>
          {/if}
        </div>
      {/key}
    </div>
    <div class="start-exam-section">
      <button
        class="pre-btn"
        class:disable={current_session === 0}
        onclick={prevSession}
      >
        {pre_text}
      </button>

      <button
        class="start-exam-btn"
        class:over={button_text !== "进入考试"}
        class:begin={button_text === "进入考试"}
        onclick={clickButton}>{button_text}</button
      >

      <button
        class="next-btn"
        class:disable={current_session >= exam_sessions.length - 1}
        onclick={nextSession}
      >
        下一场 >>
      </button>
    </div>
  </div>
{/if}

<style lang="scss" scoped>
  :global(html),
  :global(body) {
    overflow: auto;
  }
  $btn-color: #0336ff;
  $btn-hover-color: #0229cc;
  $spacing-sm: 10px;
  button {
    all: unset;
  }
  .nav {
    width: 100%;
    height: 5%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .nav-left,
  .nav-right {
    display: flex;
    align-items: center;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    color: #666;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      color: #266fe8;
    }

    .icon {
      font-size: 12px;
    }
  }

  .next-btn,
  .pre-btn {
    background: none;
    border: none;
    color: $btn-color;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }

    &.disable {
      color: #ccc;
      cursor: not-allowed;
    }
  }

  .exam-detail-container {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: auto;
    overflow-x: auto;
    align-items: center;
    height: 100vh;
    width: 100vw;
    min-width: 1000px;
    min-height: 600px;
  }

  .paper-header {
    text-align: center;
    h1 {
      font-size: 28px;
      font-weight: 1000;
      margin-bottom: 10px;
      margin-top: 10px;
    }
  }

  .info-section {
    width: 60%;
    height: fit-content;
    max-height: 50%;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 70px;
    padding-right: 70px;

    margin-bottom: $spacing-sm;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--border-light);
  }

  .info-header {
    height: fit-content;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
    h2 {
      font-size: 24px;
      font-weight: bold;
    }
  }

  .notice-content {
    height: fit-content;
    max-height: 80%;
    overflow-y: auto;
    white-space: pre-line;
    line-height: 1.6;
    color: #333;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 10px;
  }
  .attachment-section {
    width: 60%;
    height: auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    text-align: center;
    font-size: 18px;
    padding: 10px 70px;
    gap: 10px;
    margin-bottom: $spacing-sm;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--border-light);
  }

  .attachment-header {
    display: flex;
    align-items: flex-start;
    width: 100%;
  }

  .attachment-actions {
    display: flex;
    justify-content: flex-end;
    width: 15%;
    padding: 5px 10px 5px 0;
    margin-top: 5px;
  }

  .expand-button {
    font-weight: 800;
    font-size: 12px;
    margin-right: 8px;
    color: $btn-color;
    cursor: pointer;
    &:hover {
      color: $btn-hover-color;
      background-color: rgba(3, 54, 255, 0.1);
      text-decoration: underline;
    }
  }

  .attachment-files-container {
    display: flex;
    flex-wrap: wrap;
    width: 70%;
    gap: 10px;
    height: auto; /* 自动高度 */
    max-height: 35px; /* 默认最大高度 */
    overflow-y: hidden; /* 默认不允许滚动 */
    padding-left: 15px;
    padding-right: 10px;
    margin-bottom: 0;
    transition:
      max-height 0.3s ease,
      overflow-y 0.1s ease;
  }

  /* 展开时的样式 */
  :global(.expanded-attachments) .attachment-files-container {
    max-height: 500px; /* 展开后的最大高度，可以根据需要调整 */
    overflow-y: auto; /* 展开后允许滚动 */
  }
  .download-btn {
    font-weight: 800;
    font-size: 12px;
    margin-right: 8px;
    color: $btn-color;
    &:hover {
      color: $btn-hover-color;
      background-color: rgba(3, 54, 255, 0.1);
      text-decoration: underline;
    }
  }

  .exam-time-section {
    position: relative;
    width: 60%;
    height: 25%;
    min-width: 25%;
    max-width: 60%;

    overflow-y: auto;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--border-light);
  }
  .time-layout {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    top: 0;
    left: 0;
    height: 85%;
    width: 100%;
    padding-top: 20px;
    padding-left: 70px;
    padding-right: 70px;
  }

  .exam-info-item {
    display: flex;
    justify-content: space-between;

    span {
      font-weight: 1000;
      margin-right: 8px;
    }
  }

  .start-exam-section {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 60%;
    margin-top: 20px;
  }

  .start-exam-btn {
    background-color: $btn-color;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 12px 40px;
    margin-bottom: 10px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;

    &.begin:hover {
      background-color: $btn-hover-color;
    }

    &.over {
      background-color: #666;
    }
  }

  .file-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    background-color: #eff0f4;
    padding: 0 10px 0 10px;
    border-radius: 20px;
    margin-right: 5px;
    min-height: 32px;
    max-width: 100%;
    .file-item {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      max-width: 100%;
    }
  }
  .file-name-button {
    color: #757575;
    font-size: 14px;
    background-color: rgb(0, 0, 0, 0);
    border: none;
    cursor: pointer;
    white-space: normal;
    word-break: break-word;
    text-align: center;
    max-width: 100%;
    overflow: hidden;

    &:hover {
      color: $btn-hover-color;
      text-decoration: underline;
    }
  }
</style>
