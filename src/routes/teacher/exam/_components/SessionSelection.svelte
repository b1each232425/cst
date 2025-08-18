<script>
    let{
        show_panel = false,
        // onCancel = (/** @type {boolean} */ load_new_file) => {},
        // onConfirm = (/** @type {any} */ selected_examinee) => {},
  } = $props();
    
</script>
<!-- 仅保留页面结构与样式 -->
<div class={show_panel ? 'examinee-panel-container' : 'hide'}>
  <div class="examinee-panel">
    <div class="panel-header">
      <span class="panel-header-text">考生列表</span>
      <button class="close-btn">×</button>
    </div>

    <div class="panel-body">
      <!-- 已选考生列表（仅作占位） -->
      <div class="selected-examinees-container">
        <div class="examinee-selection-table-container">
          <table class="table">
            <thead class="student-table-head">
              <tr class="table-head-row">
                <th class="table-head">姓名</th>
                <th class="table-head">性别</th>
                <th class="table-head">手机号</th>
                <th class="table-head">身份证号</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>

          <!-- 暂无数据 -->
          <div class="no-data-text">
            <span>暂无数据</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <button class="btn">取消</button>
      <button class="btn save">确定</button>
    </div>
  </div>
</div>

<style lang="scss" scoped>
  /* 原样式保持不变，仅删除与脚本相关的注释 */
  .examinee-panel-container {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }

  .examinee-panel {
    width: 1000px;
    min-width: 800px;
    max-height: 90vh;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #eee;
    font-size: 20px;
    font-weight: 600;

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      width: 32px;
      height: 32px;
      cursor: pointer;
    }
  }

  .panel-body {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .selected-examinees-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 450px;
  }

  .examinee-selection-table-container {
    flex: 1;
    position: relative;
    margin-top: 20px;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    th,
    td {
      font-size: 14px;
      padding: 8px;
      text-align: center;
    }
    th {
      background: #fafafa;
      color: rgba(0, 0, 0, 0.3);
    }
    td {
      border-bottom: 1px solid #ddd;
    }
  }

  .no-data-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--text-disabled);
    font-size: 14px;
  }

  .panel-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    padding: 12px 24px 18px;
    border-top: 1px solid #eee;
  }

  .btn {
    min-width: 80px;
    padding: 7px 18px;
    border-radius: 5px;
    border: 1.5px solid #d9d9d9;
    background: #fff;
    color: var(--blue);
    cursor: pointer;
    font-size: 15px;
    &.save {
      background: var(--blue);
      color: #fff;
      border-color: var(--blue);
    }
  }
</style>