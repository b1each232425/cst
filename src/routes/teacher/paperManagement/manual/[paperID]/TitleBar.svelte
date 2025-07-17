<!-- /*
 * @Author: wusaber33 
 * @Date: 2025-04-15 22:19:36 
 * @Last Modified by:   wusaber 
 * @Last Modified time: 2025-04-15 22:19:36 
 */
 -->
<script>

  /**
   * @type {{
   *  paper_name: string,
   * importQuestion: (group_id:string|number|null)=>void,
   * save: ()=>void,
   * goHome: ()=>void,
   * expanded: ()=>void,
   * collapse: ()=>void,}}
   */
  let {
    paper_name = $bindable(),
    importQuestion,
    save,
    goHome,
    expanded,
    collapse
  } = $props();

  let isInvalid = $state(false);

  const validateName = () => {
    isInvalid = paper_name.trim() === "";
  };
</script>

<div class="title-bar">
  <div class="title-section">
    <h1>自定义组卷</h1>
  </div>
  <div class="paper-name-input">
    <input
      type="text"
      placeholder="试卷名称不能为空"
      bind:value={paper_name}
      oninput={validateName}
      onblur={validateName}
      maxlength={50}
      class:is-invalid={isInvalid}
    />
  </div>
  <div class="action-buttons">
    <button class="btn expanded" onclick={expanded}>一键展开</button>
    <button class="btn collapse" onclick={collapse}>一键收起</button>
    <button class="btn import" onclick={()=>{importQuestion(null)}}>从题库中导入</button>
    <button class="btn save" onclick={save}>保存</button>
    <button class="btn go-home" onclick={goHome}>退出</button>
  </div>
</div>

<style lang="scss" scoped>
$titlebar-bg: #fff;
$titlebar-border: #e8e8e8;
$primary: #0052d9;
$primary-hover: #2563eb;
$danger: #ff4d4f;
$gray: #999;
$btn-radius: 5px;
$btn-gap: 14px;

.title-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px 16px 24px;
  background: $titlebar-bg;
  border-bottom: 1.5px solid $titlebar-border;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);

    .title-section {
      display: flex;
      align-items: center;

    h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      color: #222;
      border-left: $primary solid 7px;
      padding-left: 14px;
      letter-spacing: 1px;
      background: linear-gradient(90deg, $primary 0 7px, transparent 7px 100%);
    }
  }

    .paper-name-input {
      input {
        position: relative;
        padding: 8px 12px;
        font-size: 20px;
        width: 30vw;
        margin-left: 20%;
        transition: all 0.3s;
        border-top: none;
        border-left: none;
        border-right: none;
        text-align: center;

        &.is-invalid {
          border-color: var(--red);
          background-color: #fff1f0;

          &:focus {
            border-color: var(--red);
          }

          // 修改placeholder颜色
          &::placeholder {
            color: var(--red) !important;
            opacity: 1; // Firefox需要这个属性
          }
        }
        // 正常状态下的placeholder颜色
        &::placeholder {
          color: #999 !important;
          opacity: 1;
        }
        &:focus {
          border-color: var(--primary-hover);
          outline: none;
        }
      }
    }

  .action-buttons {
    display: flex;
    gap: $btn-gap;

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px 18px;
      font-size: 14px;
      border: 1.5px solid var(--border-light);
      border-radius: var(--btn-border-radius);
      cursor: pointer;
      background: #fff;
      color: #222;
      font-weight: 500;
      transition: all 0.2s;

      &:hover {
        background: #f0f6ff;
        border-color: var(--primary-hover);
        color: var(--primary-hover);
        opacity: 1;
      }

      &.import {
        background: $primary;
        border-color: $primary;
        color: #fff;
        &:hover {
          background: $primary-hover;
          border-color: $primary-hover;
        }
      }
      &.save {
        background: #fff;
        color: $primary;
        border-color: $primary;
        &:hover {
          background: $primary;
          color: var(--bg-primary);
        }
      }
      &.go-home {
        background: #fff;
        color: $primary;
        border-color: $primary;
        &:hover {
          background: #f7f8fa;
          color: $primary-hover;
          border-color: $primary-hover;
        }
      }
      &.expanded, &.collapse {
        background: #f7f8fa;
        color: #666;
        border-color: #d9d9d9;
        &:hover {
          background: #e6f7ff;
          color: $primary;
        }
      }
    }
  }
}

// 响应式
@media (max-width: 900px) {
  .title-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 10px 8px;
    .title-section h1 { font-size: 20px; padding-left: 8px; }
    .paper-name-input input { font-size: 16px; width: 60vw; }
    .action-buttons .btn { font-size: 13px; padding: 7px 10px; }
  }
}
@media (max-width: 600px) {
  .title-bar {
    .title-section h1 { font-size: 16px; }
    .paper-name-input input { font-size: 13px; width: 90vw; min-width: 80px; }
    .action-buttons { gap: 6px; }
    .action-buttons .btn { font-size: 12px; padding: 5px 6px; }
  }
}
</style>
