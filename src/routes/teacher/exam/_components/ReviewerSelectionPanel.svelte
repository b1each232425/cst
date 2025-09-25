<!--
 * @Author: yeweixuan t051521@163.com
 * @Date: 2025-08-23 
 * @LastEditors: yeweixuan t051521@163.com
 * @LastEditTime: 2025-08-11 14:55:31
 * @FilePath: \exam\src\routes\teacher\exam\components\ExamineeSelectionPanel
 * @Description: 用于查看选中的批阅员以及为考试挑选批阅员的面板
 * @Copyright (c) 2025 by yeweixuan t051521@163.com, All Rights Reserved. 
-->
 <script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import {toast} from '$lib/components/Toast/Toast.js'
  import '$lib/components/Button/index.scss';
  import {onMount} from 'svelte';
  let{
    show_panel = false,
    onConfirm=(seleted_reviewers) =>{},
    onCancel=()=>{},
    selectedReviewers = [], // 打开面板时已选批阅员
  }=$props();
  
  let is_selection_mode=$state(false);
  let reviewer_list = $state([]);
  let selected_reviewers = $state([]); // 统一管理选中的批阅员
  
  let filter_reviewer_list = $derived(
    is_selection_mode
      ? selected_reviewers            // 选择模式不前端过滤（走后端）
      : selected_reviewers.filter(i =>
          !name_filter_view || 
          i.OfficialName.toLowerCase().includes(name_filter_view.toLowerCase()) ||
          (i.MobilePhone && i.MobilePhone.includes(name_filter_view)) ||
          (i.Account && i.Account.toLowerCase().includes(name_filter_view.toLowerCase()))
        )
  );
  
  // 查看模式前端分页切片
let view_mode_paginated_reviewers = $derived(
  filter_reviewer_list.slice(
    (pagination_params.page - 1) * pagination_params.pageSize,
    pagination_params.page * pagination_params.pageSize
  )
);

  /** 当前页是否已全部选中 */
  let is_total_selected = $derived(
    reviewer_list.length > 0 &&
    reviewer_list.every(reviewer => selected_reviewers.some(i => i.ID === reviewer.ID))
  );

  //搜索参数
  let search_params = $state({
    page: 1,
    pageSize: 10,
    orderBy:[{ "capacity": "DESC"}],
    data:{},
    filter:{},
    fuzzyCondition:''
  });

  let pagination_params = $state({
    page: 1,
    pageSize: 10
  });

  let reviewer_count = $state(0);
  let name_search_timer = null;
  let name_filter = $state("");
  let name_filter_view = $state("");   // 仅查看模式用

  $effect(() => {
    if (show_panel && selectedReviewers.length > 0) {
      // 初始化选中的批阅员列表
      selected_reviewers = selectedReviewers.map((reviewer, index) => ({
        ...reviewer,
        serialNumber: index + 1,
      }));
    }
  });

  // 统一的添加批阅员方法
  function addToSelectedReviewers(reviewer) {
    if (!selected_reviewers.some(i => i.ID === reviewer.ID)) {
      selected_reviewers.push({
        ...reviewer
      });
    }
  }

  // 统一的移除批阅员方法
  function removeFromSelectedReviewers(reviewerId) {
    selected_reviewers = selected_reviewers.filter(i => i.ID !== reviewerId);
  }

  // 切换单个批阅员选择状态
  function toggleSelectReviewer(reviewer) {
    const isSelected = selected_reviewers.some(i => i.ID === reviewer.ID);
    
    if (isSelected) {
      removeFromSelectedReviewers(reviewer.ID);
    } else {
      addToSelectedReviewers(reviewer);
    }
    
    // 更新reviewer_list中的selected状态
    const reviewerInList = reviewer_list.find(i => i.ID === reviewer.ID);
    if (reviewerInList) {
      reviewerInList.selected = !isSelected;
    }
  }

  // 改进的全选/取消全选逻辑
  function toggleSelectAll(e) {
    const checked = e.target.checked;
    
    if (checked) {
      reviewer_list.forEach((reviewer) => {
        if (!selected_reviewers.some(i => i.ID === reviewer.ID)) {
          addToSelectedReviewers(reviewer);
        }
      });
    } else {
      reviewer_list.forEach((reviewer) => {
        removeFromSelectedReviewers(reviewer.ID);
      });
    }
    
    // 更新reviewer_list中的selected状态
    reviewer_list.forEach(reviewer => {
      reviewer.selected = selected_reviewers.some(i => i.ID === reviewer.ID);
    });
  }

  function handleCheckBoxChange(reviewer, event) {
    if (event.target.type === 'checkbox') {
      event.stopPropagation();
      return;
    }
    toggleSelectReviewer(reviewer);
  }

  // 移除已选批阅员
  function removeSelectedReviewer(reviewer) {
    const targetId = reviewer.ID;
    removeFromSelectedReviewers(targetId);
    
    // 同时更新reviewer_list中对应项的selected状态
    const reviewerInList = reviewer_list.find(i => i.ID === targetId);
    if (reviewerInList) {
      reviewerInList.selected = false;
    }
  }

  async function fetchReviewers(){
    const query_params = new URLSearchParams({
      page: search_params.page.toString(),
      pageSize: search_params.pageSize.toString(),
      domain:'assess^examGrader',
      fuzzyCondition: search_params.fuzzyCondition || ''
    }).toString();
    fetch(`/api/user?${query_params}`,{ 
      method:'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        },
      })
      .then((response)=>response.json())
      .then((result => {
        if(result.status === 0)
        {
          reviewer_count = result.rowCount || result.data.length;
          reviewer_list = result.data.map(i => ({
            ...i,
            selected: selected_reviewers.some(selected => selected.ID === i.ID)
          }));
        }
        else{
          toast.error("获取列表失败"+result.msg);
          console.log("获取失败:",result.msg);
        }
       }))
      .catch((err) => {
        console.error(err);
        toast.error('获取失败');
      })
  }

  function searchReviewerName(value){
    search_params.fuzzyCondition = value || '';
    if(name_search_timer)
      clearTimeout(name_search_timer);
    name_search_timer = setTimeout(() => {
      fetchReviewers();
      name_search_timer = null;
    }, 300);
  }

  function filterreviewerName(value){
    name_filter = value;
  }

  onMount(async()=>{
    await fetchReviewers();
  })
</script>

    <div class={show_panel ? 'exam-reviewer-panel-container' : 'hide'}>
        <div class="exam-reviewer-panel">
            <div class="panel-header">
                <span class="panel-header-text">{is_selection_mode ? '选择批阅员' : '批阅员列表'}</span>
            <button
                class="close-btn"
                onclick={() => {
                show_panel = false;
                search_params.page = 1;
                is_selection_mode = false;
                onCancel(false);
                }}>×</button
            >
            </div>

    <div class="panel-body">
        <!-- 查看选择后的列表 -->
        <div class="selected-exam-reviewer-container">
          <div class="action-container">
            <div class="exam-reviewer-search-container {!is_selection_mode?' ':'hideButton'}">
              <InputBox
              label={'搜索批阅员'} 
              placeholder={'请输入手机号或姓名'}
              bind:value={name_filter_view}
              clearable={true}
              >
            </InputBox>

            </div>

            <div class="exam-reviewer-search-container {is_selection_mode?' ':'hideButton'}">
              <InputBox
              label={'搜索批阅员'} 
              placeholder={'请输入手机号或姓名'}
              clearable={true}
              onInput={searchReviewerName}
              >
            </InputBox>

            </div>
            <div class="button-group">
                <button class="{is_selection_mode ? 'btn btn--info' : 'btn btn--primary'} " 
                onclick={()=>{
                  is_selection_mode=!is_selection_mode
                  if(is_selection_mode)
                  {
                    fetchReviewers();
                  }
                  }}>
                {is_selection_mode ? '返回批阅员列表' : '添加批阅员'}</button>
            </div>
          </div>

          <!-- 查看模式 -->
           {#if !is_selection_mode}
          <div class="exam-reviewer-selection-table-container">
            <table class="table">
              <thead class="exam-reviewer-table-head">
                <tr class="table-head-row">
                  <th>姓名</th>
                  <th>手机号</th>
                  <th>性别</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {#each view_mode_paginated_reviewers as selected_reviewer, index}
                  <tr class="exam_reviewer">
                    <td>{selected_reviewer.OfficialName}</td>
                    <td>{selected_reviewer.MobilePhone || "--"}</td>
                    <td>{selected_reviewer.Gender || "--"}</td>
                    <td><button class="view-btn" onclick={()=>removeSelectedReviewer(selected_reviewer)}>移除</button></td>
                  </tr>
                  {/each}
              </tbody>
            </table>

            <div class ="{selected_reviewers.length === 0 ? 'no-data-text' : 'hideButton'}" > 
              <Empty text = "暂无数据"/>
            </div>
          </div>
          
          {:else}
          <!-- 选择模式 -->
          <div class="exam-reviewer-selection-table-container">
            <table class="table">
              <thead class="exam-reviewer-table-head">
                <tr class="table-head-row">
                  <th>
                    <input
                    type="checkbox"
                    class="custom-checkbox"
                    onchange={toggleSelectAll}
                    checked={is_total_selected}
                  /></th>
                  <th>姓名</th>
                  <th>手机号</th>
                  <th>性别</th>
                </tr>
              </thead>
              <tbody>
                {#each reviewer_list as reviewer, index}
                  <tr class="exam_reviewer"
                  onclick= {(event) => handleCheckBoxChange(reviewer, event)}
                  >
                    <td>
                        <input
                        type="checkbox"
                        class="custom-checkbox"
                        checked={reviewer.selected}
                        onchange={(e) => {
                          e.stopPropagation();
                          toggleSelectreviewer(reviewer);
                        }}
                        />
                    </td>
                    <td>{reviewer.OfficialName}</td>
                    <td>{reviewer.MobilePhone || "--"}</td>
                    <td>{reviewer.Gender || "--"}</td>
                  </tr>
                  {/each}
              </tbody>
            </table>

            <div class ="{reviewer_list.length === 0 ? 'no-data-text' : 'hideButton'}" > 
              <Empty text = "暂无数据"/>
            </div>
          </div>
          {/if}
        </div>
    </div>
    
    <div class="pagination-container {!is_selection_mode ? ' ' : 'hideButton'}">

            <Pagination
              total_items={filter_reviewer_list.length}
              current_page={pagination_params.page}
              page_size_options={[10, 20, 50]}
              on:pageChange={(e) => {
                pagination_params.page = e.detail;
              }}
              on:pageSizeChange={(e) => {
                pagination_params.pageSize = e.detail;
                pagination_params.page = 1; // 重置到第一页
              }}
            />
          </div>
    
    <div class="pagination-container {is_selection_mode ? ' ' : 'hideButton'}">
          <span style="font-size: 12px; margin-right:10px">
            已选 <span style="color: #00A870; margin:0 5px 0 5px;">{selected_reviewers.length}</span> 条
          </span>
          <Pagination
            total_items={reviewer_count}
            current_page={search_params.page}
            page_size_options={[10, 20, 50]}
            on:pageChange={(e) => {
              search_params.page = e.detail;
              fetchReviewers();
            }}
            on:pageSizeChange={(e) => {
             search_params.pageSize = e.detail;
             search_params.page = 1; // 重置到第一页
             fetchReviewers();
            }}
          ></Pagination>
        </div>


        <div class="panel-footer">
                <button class="btn btn--info is-plain" onclick={() => {
                    show_panel = false;
                    search_params.page = 1;
                    is_selection_mode = false;
                     selected_reviewers = [];
                    onCancel();
                }}>取消</button>
                <button class="btn btn--primary is-plain" onclick={() => {
                    show_panel = false;
                    is_selection_mode = false;
                    onConfirm(selected_reviewers);
                }}>确定</button>
        </div>
    </div>
</div>


<style>
    .hide {
        display: none;
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

  .hideButton {
    visibility: hidden;
    position: absolute;
    pointer-events: none;
  }

    .exam-reviewer-panel-container {
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

  .exam-reviewer-panel {
    width: 1000px;
    min-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    background-color: white;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    z-index: 1001;
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
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        .tip-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 0 0 20px 0;
            .exam-tip-text {
                color: var(--text-primary);
                font-size: 12px;
            }
        }
        .exam-time-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding: 0 0 5px 0;
        }
        .selected-exam-reviewer-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 450px;
        }
        .exam-reviewer-selection-table-container {
            margin: 20px 0px 0 0px;
            flex: 1;
            max-height: 440px;
            position: relative;
            display: flex;
            flex-direction: column;
            
        }
    }

    .panel-footer {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        padding: 12px 24px 18px;
        border-top: 1px solid #eee;

        @media (max-width: 768px) {
            padding: 12px 16px 16px;
        }

        @media (max-width: 480px) {
            flex-direction: column;
            gap: 8px;

            .btn {
                width: 100%;
            }
        }
    }

    .action-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
        .exam-reviewer-search-container {
        flex: 0 0 350px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        margin-left: -5%; 
        
    }
  }

  .table {
            width: 100%;
            border-collapse: collapse;
            flex: 1;
            max-height: 40px;
            .exam-reviewer-table-head {
            background-color: #ffffff;
            font-size: 14px;
            font-weight: normal;
            color: var(--text-disabled);
            border: none;
            padding: 8px;
            text-align: center;
            .table-head-row {
            height: 40px;
            .table-head {
                font-weight: normal;
                background: #fff;
                color: var(--text-disabled);
                    }
                }
            }
          
            .custom-checkbox {
                width: 16px;
                height: 16px;
                border: 1px solid rgb(0, 0, 0, 0.3);
                cursor: pointer;
                accent-color: #0052d9;

                &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                }
            }
            
            th,
            td {
            font-size: 14px;
            color: rgba(51, 51, 51);
            border: none;
            padding: 8px;
            text-align: center;
            overflow: visible;
            border-top: none;
            border-left: none;
            border-right: none;
            height: 40px;
            box-sizing: border-box;
            }

            td {
            border-bottom: 1px solid #ddd;
            }

            th {
            border: none ;
            color: rgba(0, 0, 0, 0.3);
            
            }
            tbody {
            tr {
                border: none;
                &:hover {
                background-color: #e0f0ff;
                cursor: pointer;
                }

                &.selected {
                background-color: #d0e8ff;

                    &:hover {
                        background-color: #c0d8ff;
                    }
                }
            }
            }
        }
  
  .pagination-container {
    display: flex;
    justify-content: right;
    align-items: center;
    margin: 16px 0;
    padding: 0 16px;
  }

  .view-btn{
    all:unset;
    color:var(--blue);
    cursor: pointer;
  }
    
</style>