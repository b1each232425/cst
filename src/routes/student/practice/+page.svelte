<!--
 * @Author: 林炜佳 wj2144632819@qq.com
 * @Date: 2025-07-25 9:00:00
 * @LastEditors: 林炜佳 wj2144632819@qq.com
 * @LastEditTime: 2025-08-06 14:18:07
 * @FilePath: \exam\src\routes\student\practice\+page.svelte
 * @Description: 学生端练习列表页面
 * @Copyright (c) 2025 by 广州近邻信息有限公司, All Rights Reserved. 
-->

<script>
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { goto } from '$app/navigation';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Toast from '$lib/components/Toast/Toast.svelte';
  import '$lib/components/Button/index.scss';
  import '$lib/components/Input/index.scss';

  // const mockPractice = [
  //   {
  //     ID: 1,
  //     Name: '练习一：基础语法',
  //     Type: '00',
  //     AttemptCount: 0,
  //     Difficulty: '00',
  //     AllowedAttempts: 10,
  //     QuestionCount: 10,
  //     WrongCount: 15,
  //     TotalScore: 75,
  //     HighestScore: 90,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_001',
  //     LatestUnsubmittedID: 0,
  //     LatestSubmittedID: 'attempt_008',
  //     Action: '00',
  //   },
  //   {
  //     ID: 2,
  //     Name: '练习二：数据类型',
  //     Type: '00',
  //     AttemptCount: 2,
  //     Difficulty: '02',
  //     AllowedAttempts: 5,
  //     QuestionCount: 8,
  //     WrongCount: 0,
  //     TotalScore: 0,
  //     HighestScore: 95,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_002',
  //     LatestUnsubmittedID: 21,
  //     LatestSubmittedID: 'attempt_015',
  //     Action: '04',
  //   },
  //   {
  //     ID: 3,
  //     Name: '练习三：指针进阶',
  //     Type: '00',
  //     AttemptCount: 5,
  //     Difficulty: '00',
  //     AllowedAttempts: 5,
  //     QuestionCount: 5,
  //     WrongCount: 2,
  //     TotalScore: 51,
  //     HighestScore: 54,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_003',
  //     LatestUnsubmittedID: 0,
  //     LatestSubmittedID: 66,
  //     Action: '08',
  //   },
  //   {
  //     ID: 4,
  //     Name: '练习四：操作系统模拟题',
  //     Type: '00',
  //     AttemptCount: 1,
  //     Difficulty: '04',
  //     AllowedAttempts: 3,
  //     QuestionCount: 15,
  //     WrongCount: 5,
  //     TotalScore: null,
  //     HighestScore: 92,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_004',
  //     LatestUnsubmittedID: '',
  //     LatestSubmittedID: 'attempt_005',
  //     Action: '06',
  //   },
  //   {
  //     ID: 5,
  //     Name: '练习五：基础语法',
  //     Type: '00',
  //     AttemptCount: 5,
  //     Difficulty: '00',
  //     AllowedAttempts: 5,
  //     QuestionCount: 10,
  //     WrongCount: 15,
  //     TotalScore: 75,
  //     HighestScore: 90,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_001',
  //     LatestUnsubmittedID: 'attempt_009',
  //     LatestSubmittedID: 'attempt_008',
  //     Action: '10',
  //   },
  //   {
  //     ID: 6,
  //     Name: '练习六：数据结构综合',
  //     Type: '00',
  //     AttemptCount: 2,
  //     Difficulty: '02',
  //     AllowedAttempts: 3,
  //     QuestionCount: 20,
  //     WrongCount: 10,
  //     TotalScore: 85,
  //     HighestScore: 88,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_002',
  //     LatestUnsubmittedID: 25,
  //     LatestSubmittedID: 'attempt_003',
  //     Action: '04',
  //   },
  //   {
  //     ID: 177,
  //     Name: '练习一：基础语法',
  //     Type: '00',
  //     AttemptCount: 0,
  //     Difficulty: '00',
  //     AllowedAttempts: 10,
  //     QuestionCount: 10,
  //     WrongCount: 15,
  //     TotalScore: 75,
  //     HighestScore: 90,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_001',
  //     LatestUnsubmittedID: '',
  //     LatestSubmittedID: 'attempt_008',
  //     Action: '00',
  //   },
  //   {
  //     ID: 27,
  //     Name: '练习二：数据类型',
  //     Type: '00',
  //     AttemptCount: 2,
  //     Difficulty: '02',
  //     AllowedAttempts: 5,
  //     QuestionCount: 8,
  //     WrongCount: 0,
  //     TotalScore: 0,
  //     HighestScore: 0,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_002',
  //     LatestUnsubmittedID: '',
  //     LatestSubmittedID: 'attempt_015',
  //     Action: '06',
  //   },
  //   {
  //     ID: 37,
  //     Name: '练习三：指针进阶',
  //     Type: '00',
  //     AttemptCount: 0,
  //     Difficulty: '00',
  //     AllowedAttempts: 5,
  //     QuestionCount: 5,
  //     WrongCount: 0,
  //     TotalScore: 0,
  //     HighestScore: 96,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_003',
  //     LatestUnsubmittedID: '',
  //     LatestSubmittedID: '',
  //     Action: '00',
  //   },
  //   {
  //     ID: 45,
  //     Name: '练习四：操作系统模拟题',
  //     Type: '00',
  //     AttemptCount: 14,
  //     Difficulty: '04',
  //     AllowedAttempts: 3,
  //     QuestionCount: 15,
  //     WrongCount: 5,
  //     TotalScore: 92,
  //     HighestScore: 92,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_004',
  //     LatestUnsubmittedID: '',
  //     LatestSubmittedID: 'attempt_005',
  //     Action: '02',
  //   },
  //   {
  //     ID: 577,
  //     Name: '练习一：基础语法',
  //     Type: '00',
  //     AttemptCount: 5,
  //     Difficulty: '00',
  //     AllowedAttempts: 10,
  //     QuestionCount: 10,
  //     WrongCount: 15,
  //     TotalScore: 75,
  //     HighestScore: 90,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_001',
  //     LatestUnsubmittedID: 'attempt_009',
  //     LatestSubmittedID: 'attempt_008',
  //     Action: '10',
  //   },
  //   {
  //     ID: 644,
  //     Name: '练习二：数据结构综合',
  //     Type: '00',
  //     AttemptCount: 2,
  //     Difficulty: '02',
  //     AllowedAttempts: 3,
  //     QuestionCount: 20,
  //     WrongCount: 10,
  //     TotalScore: 85,
  //     HighestScore: 88,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_002',
  //     LatestUnsubmittedID: '',
  //     LatestSubmittedID: 'attempt_003',
  //     Action: '04',
  //   },
  //   {
  //     ID: 744,
  //     Name: '练习三：指针进阶',
  //     Type: '00',
  //     AttemptCount: 0,
  //     Difficulty: '00',
  //     AllowedAttempts: 5,
  //     QuestionCount: 5,
  //     WrongCount: 0,
  //     TotalScore: 0,
  //     HighestScore: 0,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_003',
  //     LatestUnsubmittedID: '',
  //     LatestSubmittedID: '',
  //     Action: '00',
  //   },
  //   {
  //     ID: 87,
  //     Name: '练习四：操作系统模拟题',
  //     Type: '00',
  //     AttemptCount: 1,
  //     Difficulty: '04',
  //     AllowedAttempts: 3,
  //     QuestionCount: 15,
  //     WrongCount: 5,
  //     TotalScore: 92,
  //     HighestScore: 92,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_004',
  //     LatestUnsubmittedID: '',
  //     LatestSubmittedID: 'attempt_005',
  //     Action: '02',
  //   },
  //   {
  //     ID: 94,
  //     Name: '练习四：操作系统模拟题',
  //     Type: '00',
  //     AttemptCount: 1,
  //     Difficulty: '04',
  //     AllowedAttempts: 3,
  //     QuestionCount: 15,
  //     WrongCount: 5,
  //     TotalScore: 92,
  //     HighestScore: 92,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_004',
  //     LatestUnsubmittedID: '',
  //     LatestSubmittedID: 'attempt_005',
  //     Action: '02',
  //   },
  //   {
  //     ID: 121,
  //     Name: '练习四：操作系统模拟题',
  //     Type: '00',
  //     AttemptCount: 1,
  //     Difficulty: '04',
  //     AllowedAttempts: 0,
  //     QuestionCount: 15,
  //     WrongCount: 5,
  //     TotalScore: 92,
  //     HighestScore: 92,
  //     PaperTotalScore: 100,
  //     PaperID: 'paper_004',
  //     LatestUnsubmittedID: '',
  //     LatestSubmittedID: 'attempt_005',
  //     Action: '02',
  //   },
  // ];

  // 练习类型映射表
  const TYPE_MAP = {
    '00': '经典巩固',
    '02': '常练常新',
    '04': '智能提升',
  };

  // 难度映射表
  const DIFFICULTY_MAP = {
    '00': '简单',
    '02': '中等',
    '04': '困难',
  };

  // 据此判断显示哪一个表格
  let current_practice_type = $state('00');

  // 练习列表
  let practice_list = $state([]);

  // 总数据数
  let total_count = $state(0);

  // 筛选条件
  let practice_info = $state('');
  let practice_difficulty = $state('');
  let page = $state(1);
  let page_size = $state(10);

  // 操作映射表
  const ACTION_MAP = {
    '00': ['进入练习'],
    '02': ['重新作答', '查看上次作答'],
    '04': ['继续作答', '查看上次作答'],
    '06': ['等待批改完成'],
    '08': ['查看上次作答'],
    '10': ['继续作答'],
  };

  // 操作码对应的事件
  const ACTION_HANDLERS = {
    '00': (index, id) => gotoPracticeDetail(id),
    '02': (index, id) => (index === 0 ? gotoPracticeDetail(id) : gotoPracticeResult(id)),
    '04': (index, id) => (index === 0 ? gotoPracticeDetail(id) : gotoPracticeResult(id)),
    '06': () => {},
    '08': (index, id) => gotoPracticeResult(id),
    '10': (index, id) => gotoPracticeDetail(id),
  };

  // 处理对应操作
  function handleAction(action, index, practice_id) {
    if (action && ACTION_MAP[action]) {
      const handler = ACTION_HANDLERS[action];
      handler(index, practice_id);
    }
  }

  //  前往练习批改结果页面
  function gotoPracticeResult(practice_id) {
    goto(`/student/answer/result/practice?practice-id=${practice_id}`);
  }

  // 前往练习详情页进行作答
  function gotoPracticeDetail(practice_id) {
    goto(`/student/answer/practice?practice-id=${practice_id}`);
  }

  // 判断练习的操作
  function getPracticeAction(practice) {
    const { LatestUnsubmittedID, TotalScore, AttemptCount, AllowedAttempts } = practice;

    // 没有作答过
    if (!LatestUnsubmittedID && !AttemptCount) return '00';

    // 存在未提交记录
    if (LatestUnsubmittedID) {
      if (TotalScore !== null && TotalScore !== undefined) return '04'; // 不是第一次答题
      return '10'; // 第一次答题
    }

    // 已提交但未批改（本次作答未批改，不能进行下一次作答）（这里并不能确定是不是第一次作答）
    if (TotalScore === null && TotalScore !== 0) return '06';

    // 达到最大尝试次数（AllowedAttempts <= 0 表示可以无限作答）
    if (AllowedAttempts > 0 && AttemptCount >= AllowedAttempts) return '08';

    // 正常可重新作答
    return '02';
  }

  // 是否有上次的作答记录
  function hasLastRecord(action) {
    return action != '00' && action != '04' && action != '06' && action != '10';
  }

  function handleReset() {
    practice_info = '';
    practice_difficulty = '';
  }

  // 搜索
  function handleSearch() {
    // 获取练习列表
    fetch(
      `/api/practice?name=${practice_info}&difficulty=${practice_difficulty}&page=${page}&page_size=${page_size}&type=${current_practice_type}`,
    )
      .then((res) => {
        if (!res.ok)
          return res.text().then((error_text) => {
            throw new Error(`请求失败：${res.status} ${res.statusText}` + (error_text ? '-' + error_text : ''));
          });
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          practice_list = res.data?.practices ?? [];
          total_count = res.data?.total ?? 0;

          // 计算每个练习 action
          if (Array.isArray(practice_list)) practice_list.forEach((p) => (p.Action = getPracticeAction(p)));
          else {
            practice_list = [];
            throw new Error('practice_list 数据类型错误');
          }
        } else throw new Error(res.msg ?? '获取练习列表失败');
      })
      .catch((err) => {
        toast.error(err.message);
      });
  }

  // TODO 处理练习种类的切换
  function handlePracticeTypeChange(key) {
    // current_practice_type = key;
    // handleSearch(); TODO
  }

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

<svelte:head>
  <title>练习列表 • 3min</title>
</svelte:head>

{#snippet tip()}
  <img src="/student_practice_list/tip.svg" alt="" style="width:0.9rem;height:0.9rem" />
{/snippet}

<div class="practice-body">
  <!-- 筛选框、按钮 -->
  <div class="options">
    <div class="practice-input">
      <div class="label">搜索练习：</div>
      <input type="text" placeholder="练习名称 / 知识点" bind:value={practice_info} class="input" />
    </div>
    <div class="select" data-testid="difficult-select">
      <div class="label">练习难度：</div>
      <Select bind:value={practice_difficulty}>
        <Option value="" label="全部" />
        {#each Object.entries(DIFFICULTY_MAP) as [key, val], index (index)}
          <Option value={key} label={val} />
        {/each}
      </Select>
    </div>
    <button class="btn btn--info is_plain" onclick={handleReset}>重置</button>
    <button class="btn btn--primary" onclick={handleSearch}>搜索</button>
  </div>

  <!-- 练习种类 -->
  <div class="practice-show">
    <div class="practice-category">
      {#each Object.entries(TYPE_MAP) as [key, val], index (index)}
        <button onclick={() => handlePracticeTypeChange(key)} class:selected={current_practice_type === key}
          >{val}{@render tip()}</button
        >
      {/each}
    </div>

    <!-- 练习列表 -->
    <div class="table">
      <table>
        <thead>
          <tr>
            <th>练习名称</th>
            <th>作答次数</th>
            <th>练习难度</th>
            <th>可作答次数</th>
            {#if current_practice_type === '00'}
              <th>试卷题数</th>
              <th>错题数</th>
              <th>得分</th>
              <th>最高得分</th>
              <th>试卷总分</th>
            {:else if current_practice_type === '02'}
              <th>正确率</th>
              <th>时长</th>
              <th>得分</th>
            {:else}
              <th>已作题数 / 题目存量</th>
              <th>错题数 / 题目存量</th>
              <th>题目情况</th>
              <th>得分</th>
            {/if}
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each practice_list as practice (practice.ID)}
            <tr>
              <td>{practice.Name}</td>
              <td>{practice.AttemptCount}</td>
              <td
                class="difficulty"
                class:easy={practice.Difficulty === '00'}
                class:medium={practice.Difficulty === '02'}
                class:hard={practice.Difficulty === '04'}
                class:unknown={!DIFFICULTY_MAP[practice.Difficulty]}>{DIFFICULTY_MAP[practice.Difficulty] ?? '未知'}</td
              >
              <td>{practice.AllowedAttempts === 0 ? '不限次数' : practice.AllowedAttempts}</td>
              {#if current_practice_type === '00'}
                <td>{practice.QuestionCount}</td>
                <td>{hasLastRecord(practice.Action) ? practice.WrongCount : '--'}</td>
                <td>{hasLastRecord(practice.Action) ? practice.TotalScore : '--'}</td>
                <td
                  >{practice.Action !== '00' &&
                  !(
                    practice.Action === '06' &&
                    (practice.HighestScore === null || practice.HighestScore === undefined)
                  ) &&
                  practice.Action !== '10'
                    ? practice.HighestScore
                    : '--'}</td
                >
                <td>{practice.PaperTotalScore}</td>
              {:else if current_practice_type === '02'}
                <td> </td>
                <td> </td>
                <td> </td>
              {:else}
                <td> </td>
                <td> </td>
                <td> </td>
                <td> </td>
              {/if}
              <td
                >{#each ACTION_MAP[practice.Action] as action, index}
                  <button
                    class="option"
                    class:can-click={practice.Action && ACTION_MAP[practice.Action] && practice.Action !== '06'}
                    onclick={() => handleAction(practice.Action, index, practice.ID)}>{action}</button
                  >
                {/each}</td
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
</div>

<div class="pagination">
  <Pagination total_items={total_count} on:pageChange={handlePageChange} on:pageSizeChange={handlePageSizeChange} />
</div>

<style lang="scss">
  .practice-body {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    height: 70vh;

    .options {
      display: flex;
      flex-wrap: wrap;
      justify-content: left;
      align-items: center;
      gap: 1rem;
      z-index: 10;

      .practice-input,
      .select {
        display: flex;
        align-items: center;
      }

      .label {
        white-space: nowrap;
      }

      .select {
        width: 15rem;
      }
    }

    .practice-show {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .practice-category {
        display: flex;
        justify-content: left;
        gap: 2rem;

        button {
          border: 0;
          background-color: white;
          cursor: pointer;
          display: flex;
          gap: 0.5rem;
          font-size: 1.05rem;
          padding-bottom: 5px;

          &.selected {
            color: blue;
            border-bottom: 1px solid blue;
          }
        }
      }
    }

    .table {
      height: 55vh;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #ccc transparent;

      table {
        width: 100%;
        border-collapse: collapse;

        thead {
          background-color: rgb(250, 250, 250);
          position: sticky;
          top: 0;
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

              $difficulty-color: (
                'easy': #52c41a,
                'medium': #faad14,
                'hard': #f5222d,
                'unknown': red,
              );

              &.difficulty {
                @each $name, $color in $difficulty-color {
                  &.#{$name} {
                    color: $color;
                  }
                }
              }

              .option {
                all: unset;
                color: blue;
                padding: 0 0.3rem;

                &.can-click:hover {
                  cursor: pointer;
                  font-weight: bold;
                }
              }
            }
          }
        }
      }

      .empty {
        margin-top: 10rem;
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: right;
  }
</style>
