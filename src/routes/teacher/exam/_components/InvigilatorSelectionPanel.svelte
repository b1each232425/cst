<!--
 * @Author: yeweixuan t051521@163.com
 * @Date: 2025-08-23 
 * @LastEditors: yeweixuan t051521@163.com
 * @LastEditTime: 2025-08-11 14:55:31
 * @FilePath: \exam\src\routes\teacher\exam\components\ExamineeSelectionPanel
 * @Description: 用于查看选中的监考员以及为考试挑选监考员的面板
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
    onConfirm=(seleted_exam_invigilators) =>{},
    onCancel=()=>{},
  }=$props();
  
  let is_selection_mode=$state(false);
  let invigilator_list = $state([]);
  let selected_invigilator_list = $derived(exam_invigilator_list.filter(r => r.selected));
  /** 当前页是否已全部选中 */
  let is_total_selected = $derived(
  exam_invigilator_list.length > 0 &&
  exam_invigilator_list.every(r => r.selected)
    );
  //搜索参数
  let search_params = $state({
    page: 1,
    pageSize: 10,
    orderBy:[{ "capacity": "DESC"}],
    data:{},
    filter:{}
  });

  function toggleSelectAll(e) {
  const checked = e.target.checked;
  exam_invigilator_list.forEach(r => (r.selected = checked));
  }

  function handleCheckBoxChange(invigilator,event){
    if (event.target.type === 'checkbox') return;
    invigilator.selected = !invigilator.selected;
  }


  onMount(async()=>{
    await fetchExaminvigilators();
  })
</script>

    <div class={show_panel ? 'exam-invigilator-panel-container' : 'hide'}>
        <div class="exam-invigilator-panel">
            <div class="panel-header">
                <span class="panel-header-text">{is_selection_mode ? '选择监考员' : '监考员列表'}</span>
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
        <div class="selected-exam-invigilator-container">
          <div class="action-container">
            <div class="exam-invigilator-search-container">
              <InputBox
              label={'搜索监考员'} 
              placeholder={'请输入监考员或考点名'}
              
              clearable={true}
              >
            </InputBox>

            </div>
            <div class="button-group">
                <button class="{is_selection_mode ? 'btn btn--info' : 'btn btn--primary'} " onclick={is_selection_mode=!is_selection_mode}>{is_selection_mode ? '返回监考员列表' : '添加监考员'}</button>
            </div>
          </div>

          <!-- 查看模式 -->
           {#if !is_selection_mode}
          <div class="exam-invigilator-selection-table-container">
            <table class="table">
              <thead class="exam-invigilator-table-head">
                <tr class="table-head-row">
                  <th>监考员</th>
                  <th>所属考点</th>
                  <th>监考员容量</th>
                  <th>监考员数量</th>
                </tr>
              </thead>
              <tbody>
                {#each selected_invigilator_list as selected_invigilator, index}
                  <tr class="exam_invigilator">
                    <td>{selected_invigilator.name}</td>
                    <td>{selected_invigilator.exam_site_name}</td>
                    <td>{selected_invigilator.capacity}</td>
                    <td>{selected_invigilator.invigilator_count || "--"}</td>
                  </tr>
                  {/each}
              </tbody>
            </table>

            <div class ="{exam_invigilator_list.length === 0?'no-data-text' : 'hideButton'}" > 
              <Empty text = "暂无数据"/>
            </div>
          </div>
          
          {:else}
          <!-- 选择模式 -->
          <div class="exam-invigilator-selection-table-container">
            <table class="table">
              <thead class="exam-invigilator-table-head">
                <tr class="table-head-row">
                  <th>
                    <input
                    type="checkbox"
                    class="custom-checkbox"
                    onchange={toggleSelectAll}
                    checked={is_total_selected}
                  /></th>
                  <th>监考员</th>
                  <th>所属考点</th>
                  <th>监考员容量</th>
                  <th>监考员数量</th>
                </tr>
              </thead>
              <tbody>
                {#each exam_invigilator_list as invigilator, index}
                  <tr class="exam_invigilator"
                  onclick= {(event) => handleCheckBoxChange(invigilator, event)}
                  >
                    <td>
                        <input
                        type="checkbox"
                        class="custom-checkbox"
                        checked={invigilator.selected}
                        />
                    </td>
                    <td>{invigilator.name}</td>
                    <td>{invigilator.exam_site_name}</td>
                    <td>{invigilator.capacity}</td>
                    <td>{invigilator.invigilator_count || "--"}</td>
                  </tr>
                  {/each}
              </tbody>
            </table>

            <div class ="{exam_invigilator_list.length === 0?'no-data-text' : 'hideButton'}" > 
              <Empty text = "暂无数据"/>
            </div>
          </div>
          {/if}
        </div>
    </div>

        <div class="panel-footer">
                <button class="btn btn--info is-plain" onclick={() => {
                    show_panel = false;
                    search_params.page = 1;
                    selected_ids = [];
                    is_selection_mode = false;
                    onCancel();
                }}>取消</button>
                <button class="btn btn--primary is-plain" onclick={() => {
                    show_panel = false;
                    is_selection_mode = false;
                    onConfirm(selected_invigilator_list);
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

    .exam-invigilator-panel-container {
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

  .exam-invigilator-panel {
    width: 1000px;
    min-width: 800px;
    height: 75vh;
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
        min-height: 0;
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
        .selected-exam-invigilator-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 450px;
        }
        .exam-invigilator-selection-table-container {
            margin: 20px 0px 0 0px;
            flex: 1;
            min-height: 440px;
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
        .exam-invigilator-search-container {
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
            .exam-invigilator-table-head {
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

    
</style>