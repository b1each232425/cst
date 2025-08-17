<!--
 * @Author: 林炜佳 wj2144632819@qq.com
 * @Date: 2025-08-06 9:00:00
 * @LastEditors: 林炜佳 wj2144632819@qq.com
 * @LastEditTime: 2025-08-07 00:18:07
 * @FilePath: \exam\src\routes\teacher\correct\practice-correct\+page.svelte
 * @Description: 教师端考试批改列表
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->

<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import { debounce } from '$lib/utils/optimize';
  import { onDestroy, onMount } from 'svelte';
  import { toast } from '$lib/components/Toast/Toast';
  import { goto } from '$app/navigation';
  import '$lib/components/Input/index.scss';
  import Title from '$lib/components/Title/Title.svelte';

  // const mockPractice = [
  //   {
  //     id: 0,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  //   {
  //     id: 60,
  //     name: 'string',
  //     respondent_count: 10,
  //     unmarked_student_count: 7,
  //     mark_mode: '10',
  //   },
  //   {
  //     id: 50,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  //   {
  //     id: 40,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  //   {
  //     id: 30,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  //   {
  //     id: 20,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  //   {
  //     id: 1,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  //   {
  //     id: 11,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  //   {
  //     id: 21,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  //   {
  //     id: 34,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  //   {
  //     id: 33,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  //   {
  //     id: 111,
  //     name: 'string',
  //     respondent_count: 0,
  //     unmarked_student_count: 0,
  //     mark_mode: '00',
  //   },
  // ];

  // 练习类型
  // const TYPE_MAP = {
  //   '00': '经典巩固',
  //   '02': '常练常新',
  //   '04': '智能提升',
  // };

  // 批改方式映射
  const MARK_MODE_MAP = {
    '00': '自动 (AI)',
    '10': '手动',
  };

  let practice_list = $state([
    // {
    //   id: 1,
    //   name: '基础语法练习',
    //   respondent_count: 15,
    //   unmarked_student_count: 5,
    //   mark_mode: '10', // 手动批改
    // },
    // {
    //   id: 2,
    //   name: '数据结构练习',
    //   respondent_count: 20,
    //   unmarked_student_count: 0, // 没有待批改
    //   mark_mode: '10',
    // },
    // {
    //   id: 3,
    //   name: '算法练习',
    //   respondent_count: 10,
    //   unmarked_student_count: 3,
    //   mark_mode: '00', // 自动批改
    // },
    // {
    //   id: 4,
    //   name: '未知批改方式练习',
    //   respondent_count: 8,
    //   unmarked_student_count: 2,
    //   mark_mode: '99', // 未知状态
    // },
  ]);
  let total_count = $state(0);
  let practice_type = $state('00');
  let practice_name = $state('');
  let page = $state(1);
  let page_size = $state(10);

  function canCorrected(unmarked_student_count, mark_mode) {
    return unmarked_student_count > 0 && mark_mode === '10';
  }

  function gotoCorrect(practice_name, practice_id) {
    goto(`/teacher/correct/correct?name=${practice_name}&practice_id=${practice_id}`);
  }

  function handleSearch() {
    fetch(`/api/mark/practice?page=${page}&page_size=${page_size}&practice_name=${practice_name}`)
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          practice_list = res.data?.practice_list ?? [];
          total_count = res.rowCount ?? 0;

          if (!Array.isArray(practice_list)) {
            practice_list = [];
            throw new Error('practice_list 数据类型错误');
          }
        } else throw new Error(res.msg ?? '获取练习列表失败');
      })
      .catch((err) => {
        toast.error(err.message);
        console.error(err);
      });
  }

  const debounceSearch = debounce(handleSearch, 500);

  // 处理页号改变
  function handlePageChange(event) {
    page = event.detail;
    handleSearch();
  }

  // 处理页大小改变
  function handlePageSizeChange(event) {
    page_size = event.detail;
  }

  onMount(() => handleSearch());
</script>

<div class="practice-correct-body">
  <Title title="练习批改" />

  <!-- 筛选 -->
  <div class="options">
    <div class="practice-input">
      <div class="label">练习名称：</div>
      <input type="text" class="input" placeholder="请输入信息" bind:value={practice_name} oninput={debounceSearch} />
    </div>
    <!-- <div class="select">
      <div class="label">练习类型</div>
      <Select bind:value={practice_type}>
        <Option value="" label="全部" />
        {#each TYPE_MAP as [key, val], index (index)}
          <Option value={key} label={val} />
        {/each}
      </Select>
    </div> -->
  </div>

  <!-- 练习列表 -->
  <div class="table">
    <table>
      <thead>
        <tr>
          <th>练习名称</th>
          <!-- <th>练习类型</th> -->
          <th>作答人数</th>
          <th>待批改人数</th>
          <th>批阅方式</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {#each practice_list as { id, name, respondent_count, unmarked_student_count, mark_mode } (id)}
          <tr>
            <td>{name}</td>
            <td>{respondent_count}</td>
            <td>{unmarked_student_count}</td>
            <td class:manual={mark_mode === '10'} class:unknown={!MARK_MODE_MAP[mark_mode]}
              >{MARK_MODE_MAP[mark_mode] ?? '未知状态'}</td
            >
            <td
              ><div class="options">
                <button
                  class:disabled={!canCorrected(unmarked_student_count, mark_mode)}
                  disabled={!canCorrected(unmarked_student_count, mark_mode)}
                  onclick={() => gotoCorrect(name, id)}>进入批改</button
                >
              </div></td
            >
          </tr>
        {/each}
      </tbody>
    </table>
    {#if practice_list.length === 0}
      <div class="empty">
        <Empty text="暂无练习数据" />
      </div>
    {/if}
  </div>
</div>

<div class="pagination">
  <Pagination total_items={total_count} on:pageChange={handlePageChange} on:pageSizeChange={handlePageSizeChange} />
</div>

<style lang="scss">
  button {
    all: unset;
    cursor: pointer;
  }

  .practice-correct-body {
    display: flex;
    flex-direction: column;
    height: 93%;
    gap: 1rem;

    .options {
      display: flex;
      flex-wrap: wrap;
      justify-content: left;
      align-items: center;
      gap: 1rem;
      z-index: 10;

      // .select,
      .practice-input {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .label {
        white-space: nowrap;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
      }

      // .select {
      //   width: 13rem;
      // }
    }

    .table {
      height: 70vh;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #ccc transparent;

      table {
        width: 100%;
        border-collapse: collapse;

        thead {
          position: sticky;
          top: 0;
          font-size: 14px;
          color: rgba(0, 0, 0, 0.3);
          background-color: white;
        }

        tr {
          height: 3rem;
          color: rgb(102, 102, 102);
          border-bottom: 1px lightgray solid;

          th {
            font-weight: lighter;
            font-size: 0.9rem;
            white-space: nowrap;
          }
        }

        tbody {
          tr {
            color: black;

            td {
              font-size: 0.9rem;
              text-align: center;
              vertical-align: middle;

              &.manual {
                color: green;
              }

              &.unknown {
                color: red;
              }

              .options {
                display: flex;
                justify-content: center;

                button {
                  &.disabled {
                    color: #ccc;
                    cursor: not-allowed;
                  }

                  &:not(.disabled):hover {
                    font-weight: bold;
                  }
                }
              }
            }
          }
        }
      }

      .empty {
        margin-top: 10vh;
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: right;
  }
</style>
