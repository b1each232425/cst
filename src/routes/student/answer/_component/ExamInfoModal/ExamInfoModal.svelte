<!-- /*
* @Author: OuYang Haobin 1242968386@qq.com
* @Date: 2025-04-25 14:22:43
* @LastEditors: OuYang Haobin 1242968386@qq.com
* @LastEditTime: 2025-04-30 15:34:12
* @FilePath: /tutorial-platform-fe/src/lib/component/ExamInfoModal/ExamInfoModal.svelte
* @Description: 考试信息弹窗
*/ -->
<script>
  /**
   * 文件信息对象
   * @typedef {Object} FileInfo
   * @property {string} save_path - 文件在服务器保存的相对位置
   * @property {string} file_name - 文件的原始名称
   * @property {string} save_path - 文件在服务器上的保存路径，用于下载
   * @property {string} storage_name - 文件在存储系统中的名称
   * @property {string} upload_time - 文件的上传时间，格式为ISO字符串
   */
  import { onMount } from "svelte";
  import ActionToast from "../ActionToast.svelte";
  // 使用$props()代替export
  let {
    title = "考试信息",
    start_time,
    end_time,
    exam_notes = `<p><span style="font-size: 12pt">在即将开始的考试之前，请各位考生务必仔细阅读并遵守以下详细规则：<br>1. 请确保您的网络连接稳定，建议使用有线网络连接，并使用支持最新版本浏览器的电脑参加考试。<br>2. 提前30分钟登录考试平台，完成身份验证和设备检查，以保证准时开考。准备好有效的身份证件以备核查。<br>3. 考试环境应安静、无干扰，桌面除必要的文具外不得放置任何与考试无关的物品或参考资料。关闭所有与考试无关的应用程序和通知提醒。<br>4. 确保摄像头开启且面向考生，以便监考人员实时监控，考试全程需保持可见。背景应整洁，避免出现可能引起作弊嫌疑的物品。<br>5. 不得使用任何通讯工具或电子设备辅助答题，包括手机、平板电脑等。禁止查阅外部资料、与他人交流或寻求帮助。<br>6. 一旦进入考试界面，中途不允许离开，如遇特殊情况（如突发健康问题）须提前报告监考老师，并遵循监考老师的指示。<br>7. 遵守考试时间限制，系统将在规定时间自动提交试卷。请合理分配答题时间，不要集中在最后一刻提交答案。<br>8. 考试期间严禁录屏、录音或以任何形式记录考试内容。违反此规定将被视为作弊行为处理。<br>9. 如有任何技术问题或遇到不可抗力因素影响考试进行，请立即联系在线技术支持或监考老师寻求帮助。<br>请严格遵守上述规则，祝您考试顺利，取得满意的成绩！</span></p>`,
    exam_duration,
    show,
    closeModal,
    files,
  } = $props();

  // 附件容器引用
  /**
   * @type {HTMLDivElement}
   */
  let attachmentContainer;
  // 附件区域是否展开
  let isAttachmentExpanded = $state(false);
  // 是否显示展开按钮
  let showExpandButton = $state(false);
  //提示展示状态
  let actionToastIsShow = $state(false);

  //绑定action toast的组件
  /**
   * @type {any}
   */
  let actionToast = $state(null);

  // 将时间戳转换为格式化日期字符串
  function formatTimestamp(timestamp) {
    if (!timestamp) return "--";

    const date = new Date(Number(timestamp));

    // 格式化年月日
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // 格式化时分
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * 下载文件
   * @param {{ save_path: string, file_name: string }} file
   */
  function downloadFile(file) {
    // 拼接文件 URL
    const url = `/api/files/${file.save_path}`;

    // 创建 a 标签触发下载
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name || "downloaded_file";
    document.body.appendChild(a);
    a.click();

    actionToast.show("success",`正在下载：${file.file_name}`);

    document.body.removeChild(a);
  }

  /**
   * 下载所有附件
   *
   */
  async function downloadAllAttachments() {
    if (!files || files.length === 0) {
      actionToast.show("error", "没有可下载的附件");
      return;
    }

    // 遍历所有文件并下载
    for (const file of files) {
      await downloadAttachment(file);
      // 添加小延迟，避免浏览器同时触发太多下载
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  /**
   * 下载考试附件
   * @param {FileInfo} file - 文件信息对象
   */
  async function downloadAttachment(file) {
    try {
      // 使用文件的save_path构建下载URL
      const downloadUrl = `/api/files/${file.save_path}`;

      console.log("downloadUrl:", downloadUrl);

      // 创建一个a标签来触发下载
      const a = document.createElement("a");
      a.href = downloadUrl;
      // 使用原始文件名
      a.download = file.file_name;
      //防止跳转到新窗口
      a.target = "_blank";

      // 添加到DOM并触发点击
      document.body.appendChild(a);
      a.click();

      // 清理DOM
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);

      // 显示下载成功提示
      actionToast.show("success", `正在下载: ${file.file_name}`);
    } catch (error) {
      console.error("下载文件失败:", error);
      actionToast.show("error", "下载文件失败");
    }
  }
  onMount(() => {
    // 检查附件内容是否超出默认高度
    if (attachmentContainer) {
      // 使用setTimeout确保DOM已完全渲染
      setTimeout(() => {
        // 获取内容实际高度和容器最大高度
        const contentHeight = attachmentContainer.scrollHeight;
        const containerMaxHeight = 35; // 默认最大高度，与CSS中保持一致

        // 如果内容高度超过容器最大高度，显示展开按钮
        showExpandButton = contentHeight > containerMaxHeight;
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

<ActionToast
  bind:isShow={actionToastIsShow}
  type="success"
  message="删除试卷成功"
  duration={2000}
  bind:this={actionToast}
/>
{#if show}
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h1>{title}</h1>
        <button class="close-btn" onclick={closeModal}>×</button>
      </div>

      <div class="modal-content">
        <div class="exam-notes">
          <div class="info-header"><h2>考生须知</h2></div>

          <div class="notice-content">
            <div class="piptap-content">
              {@html exam_notes}
            </div>
          </div>
        </div>

        {#if files.length > 0}
          <div
            class="attachment-section {isAttachmentExpanded
              ? 'expanded-attachments'
              : ''}"
          >
            <div class="attachment-header">
              <span style="font-weight: 1000; padding-top: 5px;"
                >考试附件：</span
              >
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
                        }}>{file.file_name}</button
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
                    onclick={() =>
                      (isAttachmentExpanded = !isAttachmentExpanded)}
                    >{isAttachmentExpanded ? "收起" : "展开"}</button
                  >
                {/if}
              </div>
            </div>
          </div>
        {/if}

        <div class="exam-info">
          <div class="info-item">
            <span class="info-label">考试时长：</span>
            <span class="info-value"
              >{exam_duration === 0 || exam_duration === undefined
                ? "--"
                : exam_duration + "分钟"}
            </span>
          </div>

          <div class="info-item">
            <span class="info-label">开始时间：</span>
            <span class="info-value">{formatTimestamp(start_time)}</span>
          </div>

          <div class="info-item">
            <span class="info-label">截止时间：</span>
            <span class="info-value">{formatTimestamp(end_time)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style scoped lang="scss">
  $btn-color: #0336ff;
  $btn-hover-color: #0229cc;
  $spacing-sm: 10px;
  button {
    all: unset;
  }
  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
    opacity: 1;
    transition: opacity 0.3s ease;
  }

  .modal-container {
    position: relative;
    background-color: #fff;
    border-radius: 12px;
    width: 70%;
    max-width: 90%;
    max-height: 90%;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
    transform: scale(1);
  }

  .modal-container.closing {
    transform: scale(0.95);
  }

  .modal-header {
    padding: 20px 46px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    align-items: center;
    h1 {
      font-size: 28px;
      font-weight: 600;
      color: #222;
      margin: 0;
    }
  }
  .close-btn {
    position: absolute;
    right: 15px;
    top: 0;
    background: none;
    border: none;
    font-size: 56px;
    cursor: pointer;
    color: #999;
  }

  .close-btn:hover {
    color: #333;
  }

  .modal-content {
    width: 100%;
    height: 100%;
    padding-top: 10px;
    padding-left: 20px;
    padding-right: 20px;
    flex: 1;
    font-family: system-ui, sans-serif;
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
    padding-left: 10px;
    padding-right: 10px;
    height: fit-content;
    max-height: 50%;
    overflow-y: auto;
    white-space: pre-line;
    line-height: 1.6;
    color: #333;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 10px;
  }

  .exam-notes {
    width: 100%;
    height: fit-content;

    overflow-y: auto;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.8;
    white-space: pre-line;
    margin-bottom: $spacing-sm;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--border-light);
  }

  .exam-info {
    margin-top: 22px;
    margin-bottom: 20px;
    padding: 24px 95px;
    border-radius: 12px;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--border-light);
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 12px;
    font-size: 15px;
  }

  .info-label {
    font-weight: bold;
    width: 100px;
    color: #333;
  }

  .info-value {
    color: #555;
    font-weight: bold;
  }

  .attachment-section {
    width: 100%;
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
    cursor: pointer;
    &:hover {
      color: $btn-hover-color;
      background-color: rgba(3, 54, 255, 0.1);
      text-decoration: underline;
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
