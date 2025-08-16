<!--
 * @Author: qjj qiaojunjie6@qq.com
 * @Date: 2025-07-24  19:31:15
 * @LastEditors: qjj qiaojunjie6@qq.com
 * @LastEditTime:  2025-07-24  19:31:15
 * @FilePath: 
 * @Description: 列表表格组件
 * @
-->
<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import { TheoryQuestion } from '../theory/type';
   import Empty from '$lib/components/Table/Empty.svelte';
  import UneditableTags from "$lib/components/Tag/UneditableTags.svelte";
  import { createEventDispatcher } from 'svelte';
  /**
   * @type {{
   *      question_data: TheoryQuestion[],                                //  题目数据
   *       current_page  //当前页码
   *      page_size, //每页显示的题目数量
   *      question_count:number                                          //筛选总题目数量
   *      onEdit?:(question:TheoryQuestion)=>void;                        //  编辑题目
   *      onDelete?:(question:TheoryQuestion)=>void;                      //  删除题目
   *      update_filtered_question_count?: (count:number)=>void;          //  更新筛选题目数
   *      onListItemClick?:(question:TheoryQuestion)=>void;               //  点击题目
   *  }}
   *
   */
  let {
    question_count,
    question_data,
    page_size,
    current_page,
    question_types,
    tableWidth = '100%',
    update_filtered_question_count = (
      /**
       * @type {number}
       */
      count,
    ) => {
      console.log('筛选题目数：' + count);
    },
    onEdit = (
      /**
       * @type {TheoryQuestion}
       */
      question,
    ) => {
      console.log('编辑第' + question.id + '题');
    },
    onDelete = (
      /**
       * @type {TheoryQuestion}
       */
      question,
    ) => {
      console.log('删除第' + question.id + '题');
    },
    onListItemClick = (
      /**
       * @type {TheoryQuestion}
       */
      question,
    ) => {
      console.log('删除第' + question.id + '题');
    },
  } = $props();

  const dispatch = createEventDispatcher();

  /**
   * @description 表格排序条件
   */
  let sort_field = $state('');

  /**
   * @description 表格排序方式
   */
  let sort_order = $state('desc');
  /**
   * @description 提取文本
   * @param htmlString {string}
   */
  const extractTextFromHTML = (htmlString) => {
    return htmlString
      .replace(/<\/?[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
  };

  /**
   * @description 所有题目的纯文本标题
   * @type {string[]}
   */
  let questions_content = $derived.by(() => {
    return question_data.map((question) => extractTextFromHTML(question.content));
  });

  // 分页器的回调函数
  function handlePageChange(event) {
    dispatch('pageChange', event.detail);
  }

  function handlePageSizeChange(event) {
    dispatch('pageSizeChange', event.detail);
    // 做每页条数变化逻辑处理
  }
  const ICON = {
    ascending_order: '/theory_question_bank/icons/ascending_order.svg',
    descending_order: '/theory_question_bank/icons/descending_order.svg',
    no_order: '/theory_question_bank/icons/no_order.svg',
  };
</script>

{#snippet headRow()}
  <tr style="height: fit-content;">
    <th class="questionType">题型</th>
    <th class="questionTitle">题目</th>
    <th class="questionScore sortable">
      <div>
        <button
          class="orderBtn"
          onclick={() => {
            sort_field = 'score';

            if (sort_order === 'asc') {
              sort_order = 'desc';
            } else {
              sort_order = 'asc';
            }
          }}
        >
          <span>分值</span>
          <svg
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            style="width: 20px;height:20px;"
          >
            <path
              d="M480.32 865.536l-206.592-198.848a45.696 45.696 0 0 1 31.68-78.656h413.184a45.696 45.696 0 0 1 31.68 78.656l-206.592 198.848a45.696 45.696 0 0 1-63.36 0z"
              fill={sort_field === 'score' ? (sort_order === 'asc' ? '#cdcdcd' : '#444') : '#cdcdcd'}
            ></path>
            <path
              d="M480.32 222.528L273.728 421.376a45.696 45.696 0 0 0 31.68 78.656h413.184a45.696 45.696 0 0 0 31.68-78.72L543.68 222.592a45.696 45.696 0 0 0-63.36 0z"
              fill={sort_field === 'score' ? (sort_order === 'asc' ? '#444' : '#cdcdcd') : '#cdcdcd'}
            ></path>
          </svg>
        </button>
      </div>
    </th>
    <th class="difficultyTag sortable">
      <div>
        <button
          class="orderBtn"
          onclick={() => {
            sort_field = 'difficulty';

            if (sort_order === 'asc') {
              sort_order = 'desc';
            } else {
              sort_order = 'asc';
            }
          }}
        >
          <span>难度</span>
          <svg
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            style="width: 20px;height:20px;"
          >
            <path
              d="M480.32 865.536l-206.592-198.848a45.696 45.696 0 0 1 31.68-78.656h413.184a45.696 45.696 0 0 1 31.68 78.656l-206.592 198.848a45.696 45.696 0 0 1-63.36 0z"
              fill={sort_field === 'difficulty' ? (sort_order === 'asc' ? '#cdcdcd' : '#444') : '#cdcdcd'}
            ></path>
            <path
              d="M480.32 222.528L273.728 421.376a45.696 45.696 0 0 0 31.68 78.656h413.184a45.696 45.696 0 0 0 31.68-78.72L543.68 222.592a45.696 45.696 0 0 0-63.36 0z"
              fill={sort_field === 'difficulty' ? (sort_order === 'asc' ? '#444' : '#cdcdcd') : '#cdcdcd'}
            ></path>
          </svg>
        </button>
      </div>
    </th>
    <th class="questionTags">标签</th>
    <th class="updateTime sortable">
      <div>
        <button
          class="orderBtn"
          onclick={() => {
            sort_field = 'update_time';

            if (sort_order === 'asc') {
              sort_order = 'desc';
            } else {
              sort_order = 'asc';
            }
          }}
        >
          <span>更新时间</span>
          <svg
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            style="width: 20px;height:20px;"
          >
            <path
              d="M480.32 865.536l-206.592-198.848a45.696 45.696 0 0 1 31.68-78.656h413.184a45.696 45.696 0 0 1 31.68 78.656l-206.592 198.848a45.696 45.696 0 0 1-63.36 0z"
              fill={sort_field === 'update_time' ? (sort_order === 'asc' ? '#cdcdcd' : '#444') : '#cdcdcd'}
            ></path>
            <path
              d="M480.32 222.528L273.728 421.376a45.696 45.696 0 0 0 31.68 78.656h413.184a45.696 45.696 0 0 0 31.68-78.72L543.68 222.592a45.696 45.696 0 0 0-63.36 0z"
              fill={sort_field === 'update_time' ? (sort_order === 'asc' ? '#444' : '#cdcdcd') : '#cdcdcd'}
            ></path>
          </svg>
        </button>
      </div>
    </th>
    <th class="operations">操作</th>
  </tr>
{/snippet}

{#snippet commonRow(
  /**
   * @type {TheoryQuestion}
   */
  question,
  /**
   * @type {number}
   */
  index,
)}
  <tr class="commonRow" onclick={() => onListItemClick(question)}>
    <td style="cursor:pointer;">{question_types !== undefined ? question_types.get(question.type) : question.type}题</td
    >
    <td style="cursor:pointer;">{questions_content[index]}</td>
    <td style="cursor:pointer;">{question.score}</td>
    <td style="cursor:pointer;">
      <span
        class={question.difficulty === 1 ? 'label_easy' : question.difficulty === 2 ? 'label_medium' : 'label_hard'}
      >
        {question.difficulty === 1 ? '简单' : question.difficulty === 2 ? '中等' : '困难'}
      </span>
    </td>
    <td style="overflow:hidden;text-overflow:ellipsis;cursor:pointer;">
      <div class="tags-container">
       <UneditableTags tags={question.tags || []} />
      </div>
    </td>
    <td style="cursor:pointer;">{question.update_time_str}</td>
    <td
      onclick={(e) => {
        e.stopPropagation();
      }}
    >
      <div class="controlBtns">
        <button style="color: #0036ff;" onclick={() => onEdit(question)}>编辑</button>
        <button style="color: #FF000F;" onclick={() => onDelete(question.id)}>删除</button>
      </div>
    </td>
  </tr>
{/snippet}

<div class="questionListTableContainer">
  <div>
    {#if question_data.length !== 0}
      <table style="width: {tableWidth};border-collapse: collapse;">
        <thead>
          {@render headRow()}
        </thead>
        <tbody>
          {#each question_data as question, index}
            {@render commonRow(question, index)}
          {/each}
          {#if question_data.length < page_size}
            <!-- 空行占位 -->
            <tr class="placeholderRow"> </tr>
          {/if}
        </tbody>
      </table>
    {:else}
         <table style="width: {tableWidth};border-collapse: collapse;">
      <Empty text="暂无题目数据" />
      </table>
    {/if}
  </div>
  {#if question_data.length !== 0}
    <div style="display: flex;width:100%;justify-content:flex-end;">
      <div style="margin-right:15px;">
        <Pagination
          total_items={question_count}
          page_size={page_size}
          current_page={current_page}
          page_size_options={[10, 20, 30]}
          on:pageChange={handlePageChange}
          on:pageSizeChange={handlePageSizeChange}
        ></Pagination>
      </div>
    </div>
  {/if}
</div>

<style lang="scss" scoped>
  button {
    margin: 0px;
    padding: 0px;
    border: 0px;
    background-color: transparent;
    cursor: pointer;
    user-select: none;

    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(0);

    &:focus {
      outline: none;
    }
  }

  span {
    font-family: PingFang FC;
  }

  .orderBtn {
     gap: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    position: relative;

    span {
      display: flex;
    }

    svg {
      width: 20px;
     height: 20px;
      right: 0;
    }

    font-size: 14px;

    font-weight: bold;
    unicode-bidi: isolate;
  }

  .questionListTableContainer {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-top: 10px;
    overflow: hidden;
    min-height: 0;

    & > div:first-child {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: flex;
      flex-direction: column;

      scrollbar-gutter: stable both-edges;
    }

    & > div:last-child {
      margin-top: 10px;
    }

    table {
      width: 100%;
      table-layout: fixed;
      border-collapse: separate;
      border-spacing: 0;

      thead {
        top: 0;
        position: sticky;
        z-index: 1;
        background-color: #f8f9fa;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

        &::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -1px;
          width: 100%;
          height: 1px;
          background: #dee2e6;
        }
      }

      tbody {
        position: relative;
        tr {
          transition: background-color 0.2s ease;
        }
      }

      tbody tr:hover {
        background-color: #f1f3f5;
      }

      tr.commonRow {
        border-bottom: 1px solid #ececec;
      }

      .placeholderRow {
        border: 0px;
        height: 100%;
        display: table-row;

        &:hover {
          background-color: transparent;
        }
        &::after {
          content: '';
          display: block;
          height: 100%;
        }
      }

      th {
        background-color: #f8f9fa;
        box-sizing: border-box;
        font-size: 14px;
        font-weight: 600;
        color: #495057;
        padding: 12px 8px;
        text-transform: capitalize;
      }

      td {
        padding: 12px 8px;
        border: none;
        text-align: center;
        color: #6c757d;
        word-break: break-word;
        font-size: 14px;
        background-clip: padding-box;

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          align-items: flex-start;

          .tag {
            background: #e9ecef;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            color: #495057;
          }
        }
      }

      .controlBtns {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: space-evenly;
        align-items: center;
      }

      tr:nth-child(even) td {
        background-color: #fcfcfc;
      }
    }
  }

  .label_easy {
    color: rgb(4, 217, 25);
  }

  .label_medium {
    color: rgb(200, 205, 0);
  }

  .label_hard {
    color: #ff0000;
  }

  .questionType {
    width: 10%;
  }

  .questionTitle {
    width: 255px;
  }

  .difficultyTag {
    width: 10%;
    div {
      display: flex;
      justify-content: start;
      align-items: center;
    }
  }

  .questionScore {
    width: 10%;
    div {
      display: flex;
      justify-content: start;
      align-items: center;
    }
  }

  .questionTags {
    width: 10%;
  }

  .updateTime {
    width: 15%;
    div {
      display: flex;
      justify-content: start;
      align-items: center;
    }
  }

  .operations {
    width: 20%;
  }
</style>
