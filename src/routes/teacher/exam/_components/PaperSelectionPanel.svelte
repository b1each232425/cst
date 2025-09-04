<script>
  import Empty from '$lib/components/Table/Empty.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import { onDestroy } from 'svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import UneditableTag from '$lib/components/Tag/UneditableTag.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import {onMount} from 'svelte'
  // 难度颜色常量
  export const DIFFICULTY_COLOR_SIMPLE = 'green';
  export const DIFFICULTY_COLOR_MEDIUM = 'orange';
  export const DIFFICULTY_COLOR_HARD = 'red';
  export const DIFFICULTY_COLOR_DEFAULT = 'black';

  const AssemblyType_MAP = {
    '00': '自定义组卷',
    '02': '随机组卷',
    '04': '智能刷题',
  };

  const CATEGORY_MAP = {
    '00': '考试',
    '02': '练习',
  };

  const LEVEL_MAP = {
    '00': '简单',
    '02': '中等',
    '04': '困难',
  };

  let {
    show_panel = false,
    selected_ID,
    selected_name,
    selected_type,
    excludedPaperIDs = [],
    onCancel = () => {},
    onConfirm = (
      /** @type {any} */ selected_ID,
      /** @type {any} */ selected_name,
      /** @type {any} */ selected_type,
    ) => {},
  } = $props();

  //选中的试卷ID
  let paperselected_ID = $state(selected_ID);

  //选中的试卷名称
  let paperselected_name = $state(selected_name);

  //选中的试卷类型
  let paperselected_type = $state(selected_type);

  //总数据条数
  let totals = $state(0);

  //搜索参数
  let search_params = $state({
    name: '',
    tag: '',
    page: 1,
    page_size: 10,
    assembly_type: '00',
  });


  //是否加载中
  let loading = $state(false);

  //报错
  let error = $state('');

  let paperList = $state([]);

  /**
   * @type {number|null}
   * 防抖计时器
   */
  let name_search_timer = null;
  let tag_search_timer = null;

  /**
   * @type {number|null}
   * 防抖计时器
   */
  // let pageSearchTimer = null;

  // 获取难度颜色
  /**
   * @param {string} level - 难度等级（简单、中等、困难）
   * @returns {string} 难度对应的背景色
   */
  function getDifficultyColor(level) {
    if (level === '00') {
      return DIFFICULTY_COLOR_SIMPLE; // 简单难度为绿色
    } else if (level === '02') {
      return DIFFICULTY_COLOR_MEDIUM; // 中等难度为橙色
    } else if (level === '04') {
      return DIFFICULTY_COLOR_HARD; // 困难难度为红色
    }
    return DIFFICULTY_COLOR_DEFAULT; // 默认颜色为黑色
  }


  function searchPaperName(value){
      search_params.name=value;
      if(name_search_timer)
      clearTimeout(name_search_timer);
      name_search_timer = setTimeout(() => {
      searchPaper();
      name_search_timer = null;
    }, 300);
  }

  function searchPaperTag(value){
    search_params.tag=value;
      if(tag_search_timer)
      clearTimeout(tag_search_timer);
      tag_search_timer = setTimeout(() => {
      searchPaper();
      tag_search_timer = null;
    }, 300);
  }

  function handlePageChange(event) {
    search_params.page = event.detail;
    searchPaper();
  }

  // 处理每页条数变化
  function handlePageSizeChange(event) {
    search_params.page_size = event.detail;
    search_params.page = 1; // 重置到第一页
    searchPaper();
  }

  //请求考试列表
  async function searchPaper() {
    loading = true;
    error = '';

    // 构建查询参数
    let queryParams = new URLSearchParams();

    // 添加基础参数
    queryParams.append('page', search_params.page.toString());
    queryParams.append('pageSize', search_params.page_size.toString());
    queryParams.append('category', '00');

    // 添加可选参数
    if (search_params.name) {
      queryParams.append('name', search_params.name);
    }
    if (search_params.tag) {
      queryParams.append('tags', search_params.tag);
    }

    const response = await fetch(`/api/paper?${queryParams.toString()}&published=true`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    if (result.status !== 0) {
      error = result.msg;
      paperList = [];
      totals = 0;
      toast.error(result.msg);
      console.log(result.msg);
    } else {
      paperList = result.data;
      totals = result.rowCount;
    }

    loading = false;
  }

  // 格式化成日期+时分：2025-04-21 20:00
  /**
   * @param {string | number | Date} iso_string
   */
  function formatDateTime(iso_string) {
    const date = new Date(iso_string);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
  // 添加 Select 相关状态和函数
  let selected_paper_type = $state('04');

     onMount(() =>{
        searchPaper();
     })
  // onDestroy(() => {
  //     if (name_search_timer !== null) {
  //         clearTimeout(name_search_timer);
  //         name_search_timer = null;
  //     }
  //     if (pageSearchTimer !== null) {
  //         clearTimeout(pageSearchTimer);
  //         pageSearchTimer = null;
  //     }
  //     if (tagsSearchTimer !== null) {
  //         clearTimeout(tagsSearchTimer);
  //         tagsSearchTimer = null;
  //     }
  // });
</script>

<div class={show_panel ? 'paper-selection-panel-container' : 'hide'}>
  <div class="paper-selection-panel">
    <div class="panel-header">
      <span>选择试卷</span>
      <button
        class="close-btn"
        onclick={() => {
          paperselected_ID = selected_ID;
          paperselected_name = selected_name;
          paperselected_type = selected_type;
          onCancel();
        }}>×</button
      >
    </div>
    <div class="panel-body">
      <div class="action-container">
        <div class="paper-selection-search-container">
              <InputBox
                      label="试卷名称"
                      placeholder="请输入考试名称搜索"
                      bind:value={search_params.name}
                      onInput={searchPaperName}
                      clearable={true}
                    />
        </div>
        <div class="paper-selection-search-container">
        <InputBox
                      label="试卷标签"
                      placeholder="请输入考试标签搜索"
                      bind:value={search_params.tag}
                      onInput={searchPaperTag}
                      clearable={true}
                    />
        </div>

        <div class="paper-type-container">
          <div class="paper-type-dropdown">
            <!-- <Select  placeholder="试卷类型" changeValue={onPaperTypeChange}>
              <Option value="04" label="全部" />
              <Option value="00" label="自定义组卷" />
              <Option value="02" label="随机组卷" />
            </Select> -->
          </div>
        </div>

      </div>
      <div class="paper-selection-table-container">
        <table class="table">
          <thead class="paper-table-head">
            <tr class="table-head-row">
              <th class="table-head" style="width: 30px;"></th>
              <th class="table-head">试卷名称</th>
              <th class="table-head">组卷方式</th>
              <th class="table-head">试卷用途</th>
              <th class="table-head">试题数量</th>
              <th class="table-head">试卷总分</th>
              <th class="table-head">建议时长(分)</th>
              <th class="table-head">试卷标签</th>
              <th class="table-head">试卷难度</th>
              <th class="table-head">更新时间</th>
              <th class="table-head">创建日期</th>
            </tr>
          </thead>
          <tbody>
            {#each paperList as paper, index}
            {@const isDisabled = excludedPaperIDs.includes(paper.ID)}
              <tr class="paper-list {isDisabled ? 'disabled-row' : ''}"
              onclick={() => {
                if (!isDisabled) {
                  paperselected_ID = paper.ID;
                  paperselected_name = paper.Name;
                  paperselected_type = paper.AssemblyType;
                }
              }}>
                <td>
                  <input
                    type="radio"
                    class="custom-checkbox"
                    value={paper.ID}
                    bind:group={paperselected_ID}
                    readonly
                  />
                </td>
                <td class="body-row paper-name-cell">
                  {paper.Name}
                </td>
                <td class="body-row">{AssemblyType_MAP[paper.AssemblyType]}</td>
                <td class="body-row">{CATEGORY_MAP[paper.Category]}</td>
                <td class="body-row">{paper.QuestionCount}</td>
                <td class="body-row">{paper.TotalScore}</td>
                <td class="body-row">{paper.SuggestedDuration}</td>
                <td class="body-row">
                  {#if paper.Tags && paper?.Tags.length > 0}
                    {#each paper?.Tags ?? [] as tag, index}
                      <div class="paper-tags-item">
                        <UneditableTag content={tag} />
                      </div>
                    {/each}
                  {:else}
                    <span>--</span>
                  {/if}
                </td>
                <td style="color: {getDifficultyColor(paper.Level)};" class="body-row">{LEVEL_MAP[paper.Level]}</td>
                <td class="updated-time body-row">
                  {formatDateTime(paper.UpdateTime)}
                </td>
                <td class="body-row">{formatDateTime(paper.CreateTime)}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        <div class ="{paperList&&paperList.length ===0 ? "no-data-text" : "hideButton"}"> 
              <Empty text = "暂无试卷"/>
        </div>

      </div>
    </div>
    <div class="pagination-container">
      <Pagination
        total_items={totals}
        current_page={search_params.page}
        page_size={search_params.page_size}
        on:pageChange={handlePageChange}
        on:pageSizeChange={handlePageSizeChange}
        page_size_options={[10, 20]}
      ></Pagination>
    </div>
    <div class="panel-footer">
      <button
        class="btn"
        onclick={() => {
          paperselected_ID = selected_ID;
          paperselected_name = selected_name;
          paperselected_type = selected_type;
          onCancel();
        }}>取消</button
      >
      <button
        class="btn save"
        onclick={() => {
          if (!paperselected_ID) {
            toast.warning('请选择一张试卷');
            return;
          }
          //将选中的试卷传递给外部
          onConfirm(paperselected_ID, paperselected_name, paperselected_type);
        }}>确定</button
      >
    </div>
  </div>
</div>

<style lang="scss" scoped>
  .hide {
    display: none;
  }

  .table {
  width: 100%;
  border-collapse: collapse;
// flex: 1;
  
  th,
  td {
    position: relative;
    font-size: 14px;
    color: var(--text-primary);
    border: none;
    padding: 8px;
    text-align: center;
    border-top: none;
    border-left: none;
    border-right: none;
    box-sizing: border-box;
    word-wrap: break-word;
    word-break: break-all;
    white-space: normal;
    vertical-align: middle;
    height: 50px;
    
    // 小屏幕适配 - 降低行高、字体大小和横向间距
    @media (max-width: 1440px) {
      height: 32px;
      padding: 6px 5px; // 减少横向间距
      font-size: 13px;
    }

    @media (max-width: 1080px) {
      height: 28px;
      padding: 4px 3px; // 进一步减少横向间距
      font-size: 12px;
    }

    @media (max-width: 768px) {
      height: 24px;
      padding: 3px 2px; // 大幅减少横向间距
      font-size: 11px;
    }

    @media (max-width: 480px) {
      height: 24px;
      padding: 2px 1px; // 最小横向间距
      font-size: 10px;
    }
  }

  td {
    border-bottom: 1px solid #ddd;
  }

  th {
    color: var(--text-disabled);
    background: #fafafa;
    white-space: nowrap;
  }
  }

  .paper-table-head {
  position: relative;
  background-color: #ffffff;
  font-size: 14px;
  font-weight: normal;
  color: rgb(0, 0, 0, 0.3);
  border: none;
  padding: 8px;
  text-align: center;
  
  .table-head-row {
    height: 40px;
    
    @media (max-width: 1440px) {
      height: 32px;
    }

    @media (max-width: 1080px) {
      height: 28px;
    }

    @media (max-width: 768px) {
      height: 24px;
    }

    @media (max-width: 480px) {
      height: 20px;
    }
    
    .table-head {
      font-weight: normal;
      background: #fff;
      color: rgb(0, 0, 0, 0.3);
      
      // 优化表头的横向间距
      @media (max-width: 1440px) {
        font-size: 13px;
        padding: 6px 5px;
      }

      @media (max-width: 1080px) {
        font-size: 12px;
        padding: 4px 3px;
      }

      @media (max-width: 768px) {
        font-size: 11px;
        padding: 3px 2px;
      }

      @media (max-width: 480px) {
        font-size: 10px;
        padding: 2px 1px;
      }
    }
  }
}

  .body-row {
    min-height: 50px;
    max-width: 200px;
    word-wrap: break-word;
    word-break: break-all;
  }

  // 自定义复选框
  .custom-checkbox {
    accent-color: var(--blue);
  }

  .paper-selection-panel-container {
    position: fixed;
    top: 0%;
    left: 0%;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.25); /* 半透明遮罩层 */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  }

  .paper-selection-panel {
    margin-left: 100px;
    justify-content: center;
    width: 75%;
    min-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    background-color: white;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: 1001;
     

  //   @media (max-width: 480px) {
  //     width: 88%;
  //     height: 95vh;
  //     max-height: 95vh;
  //     border-radius: 8px;
  //    // margin-left:0%;
  //   }

  //   @media (max-width: 1440px) {
  //     width: 80%;
  //     min-width: 800px;
  //     height: 85vh;
  //     // margin-right: 30%;
  //   }

  //  @media (max-width: 1200px) {
  //     width: 75%;
  //     min-width: 320px;
  //     max-height: 80vh;
  //     height: 70vh;
  //     //margin: 0 auto;
  //   }
  }

  .panel-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #eee;
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 600;

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      width: 32px;
      height: 32px;
      text-align: center;
      color: #666;
      cursor: pointer;
      transition: color 0.2s;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover {
        color: var(--red);
        background: rgba(0, 0, 0, 0.04);
      }
    }
  }

  .panel-body {
    padding-left: 24px;
    padding-right: 24px;
    padding-top: 24px;
    padding-bottom: 10px;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    position: relative;
  }

  .action-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    // justify-content: space-between;
    gap: 30px;
    padding: 0 16px;
    margin-bottom: 10px;
  }

  .paper-selection-search-container {
    display: flex;
    flex: 0 0 300px;
    margin-left: -46px;
  }

  .paper-type-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .paper-type-label {
    font-size: 14px;
    color: rgb(0, 0, 0, 0.6);
  }

  .paper-type-dropdown {
    width: 130px;
    height: 32px;
    display: flex;
    justify-content: flex-end;
  }

  .paper-selection-table-container {
    margin: 10px 0px 0 0px;
    flex: 1;
    min-height: 250px;
    position: relative;
    display: flex;
    flex-direction: column;
    
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin: 16px 0;
    //padding: 0px 16px;

    position: relative;
    @media (max-width: 1080px) {
      padding: 8px 12px;
    }

    @media (max-width: 480px) {
      justify-content: center; /* 小屏幕下居中显示 */
    }
  }

  .btn {
    min-width: 80px;
    padding: 7px 18px;
    border-radius: 5px;
    border: 1.5px solid #d9d9d9;
    background: #fff;
    color: var(--blue);
    font-size: 15px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;

    @media (max-width: 768px) {
      min-width: 70px;
      padding: 6px 16px;
      font-size: 14px;
    }

    &:hover {
      background: #f0f6ff;
    }
    &.save {
      background: var(--blue);
      color: #fff;
      border-color: var(--blue);
      &:hover {
        background: var(--primary-hover);
        border-color: var(--primary-hover);
      }
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .panel-footer {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    padding: 12px 24px 18px;
    border-top: 1px solid #eee;

    // 小屏幕适配 - 降低底部面板高度和内边距
    @media (max-width: 1440px) {
      padding: 10px 20px 15px;
    }

    @media (max-width: 1080px) {
      padding: 8px 16px 12px;
      gap: 12px;
    }

    @media (max-width: 768px) {
      padding: 6px 12px 10px;
      gap: 10px;
    }

    @media (max-width: 480px) {
      flex-direction: column;
      gap: 8px;
      padding: 8px 12px 12px;

      .btn {
        width: 100%;
      }
    }
  }

  .no-data-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--text-disabled);
    font-size: 14px;
    font-weight: normal;
  }

  .paper-list {
    border-top: none;
    border-bottom: 1px solid #ddd;
    border-left: none;
    border-right: none;
  }

  .paper-tags-item {
    display: inline-block;
    margin-right: 5px;
    margin-bottom: 2px;
  }

  .paper-name-cell {
    max-width: 250px;
    min-width: 200px;
    text-align: left;
    padding-left: 12px;
    padding-right: 12px;
  }
  
  .hideButton {
    visibility: hidden;
    position: absolute;
    pointer-events: none;
  }

  .disabled-row {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
  
  td {
    color: var(--gray);
    //
  }
}

.disabled-hint {
  color: #ff6b6b;
  font-size: 12px;
  margin-left: 5px;
}

.custom-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
