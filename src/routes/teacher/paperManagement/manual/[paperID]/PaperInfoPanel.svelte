<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:08 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:08 
 */
 -->

<script>
    import EditableTag from "$lib/component/EditableTag.svelte";
    import {PaperInfo} from "$lib/type/paper_type"
    import DropdownGray from "$lib/component/DropdownGray.svelte";

  let { paper_info = $bindable(),action_toast } = $props();

  /**
   * 难度选项
   * @type {Array<{value: string, label: string}>}
   */
  const LEVELOPTIONS = [
    { value: "00", label: "简单" },
    { value: "02", label: "中等" },
    { value: "04", label: "困难" },
  ];

  /**
   * 试卷用途选项
   * @type {Array<{value: string, label: string}>}
   */
  const CATEGORYOPTIONS = [
    { value: "00", label: "考试" },
    { value: "02", label: "练习" },
  ];



  // 新增标签
    /**
     * @param {string} content
     * @param {PaperInfo} paper - 当前行的试卷数据
     */
     function addTag(paper, content) {
        if (content == null || content == "") {
            return;
        }

        if (typeof content !== "string") {
            throw new Error("标签内容必须为字符串");
        }

        if (content.length > MAXTAGLENGTH) {
          action_toast.show("error",`标签长度不能超过${MAXTAGLENGTH}个字符`);
            return;
        }

        if (paper.tags.includes(content)) {
          action_toast.show("error","该标签已存在");
            return;
        } else {
            paper.tags.push(content);
            paper.add_tag_input = "";
        }


    }

    // 删除标签
    /**
     * @param {number} index
     * @param {PaperInfo} paper - 当前行的试卷数据
     */
    function deleteTag(paper, index) {
        if (paper == null) {
            throw new Error("item is required");
        }

        if (paper?.tags) {
            paper.tags.splice(index, 1);
        }

        // 发送请求给后端修改标签
    }

    // 标签内容改变
    /**
     * @param {PaperInfo} paper - 当前行的试卷数据
     * @param {number} index - 标签在试卷中的索引
     * @param {string} newContent - 新的标签内容
     */
    function tagContentCHange(paper, index, newContent) {
        if (newContent == null) {
            return;
        }

        if (typeof newContent !== "string") {
            throw new Error("标签内容必须为字符串");
        }

        if (newContent.length > MAXTAGLENGTH) {
          action_toast.show("error",`标签长度不能超过${MAXTAGLENGTH}个字符`);
            return;
        }

        if (paper?.tags) {
            paper.tags[index] = newContent;
        } else {
            throw new Error("curren paper tags is null");
        }

        // 发送请求给后端修改标签
    }

    /**
     * 题库标签内容改变处理函数, 输入时调用
     * @param {string} content - 标签内容
     * @param {number} index - 标签索引
     * @param {PaperInfo} paper - 题库数据
    */
    function tagContentChangeHandleFunc(content, index, paper) {
        if (content == null) {
            return;
        }

        if (typeof content !== "string") {
            throw new Error("content must be a string");
        }

        if (content.length > MAXTAGLENGTH) {
          action_toast.show("error",`标签长度不能超过${MAXTAGLENGTH}个字符`);
            return;
        }

        if (paper?.tags) {
          paper.tags[index] = content;
        } else {
            throw new Error("current item tags is null");
        }
    }

  const MAXTAGNUM = 6; // 最大标签数量
  const MAXTAGLENGTH = 20; // 最大标签长度
</script>

<div class="paper-info">
  <h3 class="section-title">试卷信息</h3>

  <div class="info-item">
    <label for="categrory">试卷用途</label>
    <div class="dropdown">
    <DropdownGray
      options={CATEGORYOPTIONS}
      selected={paper_info.category}
      placeholder="请选择试卷用途"
      selectOptionFunc={(value) => {
        paper_info.category = value;
      }}
    />
    </div>
  </div>

  <div class="info-item">
    <label for="level">试卷难度</label>
    <div class="radio-group">
      {#each LEVELOPTIONS as option}
        <label class="radio-option">
          <input
            type="radio"
            name="level"
            value={option.value}
            checked={paper_info.level === option.value}
            onchange={() => (paper_info.level = option.value)}
          />
          <span>{option.label}</span>
        </label>
      {/each}
    </div>
  </div>

  <div class="info-item">
    <label for="duration">建议时长</label>
    <input
      type="number"
      id="duration"
      bind:value={paper_info.duration}
      min="0"
    />
    <span class="unit">分钟</span>
  </div>

  <div class="info-item">
    <label for="score">试卷总分</label>
    <div class="score-value">{paper_info.total_score} 分</div>
  </div>

  <div class="info-item">
    <label for="question_count">试题数量</label>
    <div class="count-value">{paper_info.question_count} 道</div>
  </div>

  <div class="info-item description-item">
    <label for="description">试卷说明</label>
    <textarea
      id="description"
      bind:value={paper_info.description}
      placeholder="输入试卷说明"
      rows="3"
    ></textarea>
  </div>

  <div class="info-item tags">
    <label for="tags">试卷标签</label>
    <div class="tags-list">
    <div class="tag-item">
      <EditableTag
      bind:content={paper_info.add_tag_input}
      handle_funcs={{
          onchange: (old_content, new_content) => {
            paper_info.add_tag_input = ""
            addTag?.(paper_info,new_content)
          },
          delete: () => {
            paper_info.add_tag_input = ""
          },
      }}/>
      </div>
      {#each paper_info?.tags ?? [] as tag, index}
      <div class="tag-item">
          <EditableTag content={tag} handle_funcs={{
              delete: () => deleteTag?.(paper_info,index),
              input_change: (content) => {
                  tagContentChangeHandleFunc?.(content, index,paper_info)
              },
              onchange: (old_content,new_content) => {
                  tagContentCHange?.(paper_info,index,new_content)
              },
          }}/>
    </div>
    {/each}
    </div>
  </div>
</div>

<style lang="scss" scoped>
  // 通用颜色变量（可根据需要在全局文件中定义）
  $primary-color: var(--blue);
  $primary-hover: rgba($primary-color, 0.6);
  $border-color: var(--border-light);
  $text-color: var(--text-primary);
  $title-color: var(--text-primary);
  $font-size-lg: 16px;
  $font-size-md: 14px;
  $font-size-sm: 12px;

  .paper-info {
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 10px;
    .section-title {
      font-size: 20px;
      font-weight: 1000;
      margin: 0;
      padding-bottom: 8px;
      color: var(--text-primary);
    }

    .info-item {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content:left;

      label {
        width: 20%;
        font-size: $font-size-md;
        color: $text-color;
      }

      input,
      textarea {
        padding: 6px;
        border: 1px solid $border-color;
        border-radius: var(--input-border-radius);
        flex-grow: 1;
        font-size: font-size-lg;
        transition: all 0.3s;

        &:focus {
          border-color: #40a9ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
          outline: none;
        }
      }

      // 针对描述信息单独处理，使标签和输入框垂直排列
      &.description-item {
        align-items: flex-start;
        
        textarea {
          width: 80%;
          min-height: 60px;
          resize: vertical; // 保留垂直缩放能力
        }
      }

      &.tags{
        .tags-list{
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          align-items: center;
          box-sizing: border-box;
          overflow-y: auto;
          width: 80%;
          gap: 10px;
          height: 40px;
        }
      }

    }
    

    .dropdown {
        width: 80%;
    }

    .unit {
      color: $title-color;
      font-size: $font-size-sm;
      margin-left: 8px;
    }

    .score-value,
    .count-value {
      font-size: $font-size-md;
      color: $title-color;
      font-weight: 500;
    }

    .radio-group {
      display: inline-flex;
      gap: 8px;

      .radio-option {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 60px;

        input[type="radio"] {
          width: 20px;
          height: 20px;
          accent-color: $primary-color;

          &::-moz-focus-inner {
            border-color: $primary-color !important;
          }
        }

        span {
          flex-grow: 1; // 占据剩余空间
          min-width: 0; // 防止内容溢出
          white-space: nowrap; // 禁止换行
          font-size: $font-size-md;
        }
      }
    }
  }
</style>
