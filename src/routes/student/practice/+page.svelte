<script>
  import { onMount } from 'svelte';
  import Button from '$lib/components/Button/Button.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { goto } from '$app/navigation';
  import Empty from '$lib/components/Table/Empty.svelte';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import Toast from '$lib/components/Toast/Toast.svelte';

  const mockPractice = [
    {
      ID: 1,
      Name: '练习一：基础语法',
      Type: '00',
      AttemptCount: 0,
      Difficulty: '00',
      AllowedAttempts: 10,
      QuestionCount: 10,
      WrongCount: 15,
      TotalScore: 75,
      HighestScore: 90,
      PaperTotalScore: 100,
      PaperID: 'paper_001',
      LatestUnsubmittedID: '',
      LatestSubmittedID: 'attempt_008',
      Action: '00',
    },
    {
      ID: 2,
      Name: '练习二：数据类型',
      Type: '00',
      AttemptCount: 2,
      Difficulty: '02',
      AllowedAttempts: 5,
      QuestionCount: 8,
      WrongCount: 0,
      TotalScore: 0,
      HighestScore: 0,
      PaperTotalScore: 100,
      PaperID: 'paper_002',
      LatestUnsubmittedID: '',
      LatestSubmittedID: 'attempt_015',
      Action: '06',
    },
    {
      ID: 3,
      Name: '练习三：指针进阶',
      Type: '00',
      AttemptCount: 0,
      Difficulty: '00',
      AllowedAttempts: 5,
      QuestionCount: 5,
      WrongCount: 0,
      TotalScore: 0,
      HighestScore: 0,
      PaperTotalScore: 100,
      PaperID: 'paper_003',
      LatestUnsubmittedID: '',
      LatestSubmittedID: '',
      Action: '00',
    },
    {
      ID: 4,
      Name: '练习四：操作系统模拟题',
      Type: '00',
      AttemptCount: 1,
      Difficulty: '04',
      AllowedAttempts: 3,
      QuestionCount: 15,
      WrongCount: 5,
      TotalScore: 92,
      HighestScore: 92,
      PaperTotalScore: 100,
      PaperID: 'paper_004',
      LatestUnsubmittedID: '',
      LatestSubmittedID: 'attempt_005',
      Action: '02',
    },
    {
      ID: 5,
      Name: '练习一：基础语法',
      Type: '00',
      AttemptCount: 5,
      Difficulty: '00',
      AllowedAttempts: 10,
      QuestionCount: 10,
      WrongCount: 15,
      TotalScore: 75,
      HighestScore: 90,
      PaperTotalScore: 100,
      PaperID: 'paper_001',
      LatestUnsubmittedID: 'attempt_009',
      LatestSubmittedID: 'attempt_008',
      Action: '10',
    },
    {
      ID: 6,
      Name: '练习二：数据结构综合',
      Type: '00',
      AttemptCount: 2,
      Difficulty: '02',
      AllowedAttempts: 3,
      QuestionCount: 20,
      WrongCount: 10,
      TotalScore: 85,
      HighestScore: 88,
      PaperTotalScore: 100,
      PaperID: 'paper_002',
      LatestUnsubmittedID: '',
      LatestSubmittedID: 'attempt_003',
      Action: '04',
    },
    {
      ID: 7,
      Name: '练习三：指针进阶',
      Type: '00',
      AttemptCount: 0,
      Difficulty: '00',
      AllowedAttempts: 5,
      QuestionCount: 5,
      WrongCount: 0,
      TotalScore: 0,
      HighestScore: 0,
      PaperTotalScore: 100,
      PaperID: 'paper_003',
      LatestUnsubmittedID: '',
      LatestSubmittedID: '',
      Action: '00',
    },
    {
      ID: 8,
      Name: '练习四：操作系统模拟题',
      Type: '00',
      AttemptCount: 1,
      Difficulty: '04',
      AllowedAttempts: 3,
      QuestionCount: 15,
      WrongCount: 5,
      TotalScore: 92,
      HighestScore: 92,
      PaperTotalScore: 100,
      PaperID: 'paper_004',
      LatestUnsubmittedID: '',
      LatestSubmittedID: 'attempt_005',
      Action: '02',
    },
    {
      ID: 9,
      Name: '练习四：操作系统模拟题',
      Type: '00',
      AttemptCount: 1,
      Difficulty: '04',
      AllowedAttempts: 3,
      QuestionCount: 15,
      WrongCount: 5,
      TotalScore: 92,
      HighestScore: 92,
      PaperTotalScore: 100,
      PaperID: 'paper_004',
      LatestUnsubmittedID: '',
      LatestSubmittedID: 'attempt_005',
      Action: '02',
    },
    {
      ID: 12,
      Name: '练习四：操作系统模拟题',
      Type: '00',
      AttemptCount: 1,
      Difficulty: '04',
      AllowedAttempts: 3,
      QuestionCount: 15,
      WrongCount: 5,
      TotalScore: 92,
      HighestScore: 92,
      PaperTotalScore: 100,
      PaperID: 'paper_004',
      LatestUnsubmittedID: '',
      LatestSubmittedID: 'attempt_005',
      Action: '02',
    },
  ];

  // 练习类型映射表
  const typeMap = new Map([
    ['00', '经典巩固'],
    ['02', '常练常新'],
    ['04', '智能提升'],
  ]);

  // 难度映射表
  const difficultyMap = new Map([
    ['00', '简单'],
    ['02', '中等'],
    ['04', '困难'],
  ]);

  // 据此判断显示哪一个表格
  let currentPracticeTypeTab = $state('00');

  // 总数据数
  let totalCount = $state(0);

  // 筛选条件
  let practiceInfo = $state('');
  let practiceDifficulty = $state('');
  let page = $state(1);
  let pageSize = $state(10);

  // 前往练习
  function gotoPractice(practiceID) {
    goto('');
  }

  // 前往练习解析页
  function gotoPracticeInfo(practiceID) {
    goto('');
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
    if (TotalScore === null) return '06';

    // 达到最大尝试次数
    if (AttemptCount >= AllowedAttempts) return '08';

    // 正常可重新作答
    return '02';
  }

  // 操作映射表
  const actionMap = new Map([
    ['00', ['进入练习']],
    ['02', ['重新作答', '查看上次作答']],
    ['04', ['继续作答', '查看上次作答']],
    ['06', ['等待批改完成']],
    ['08', ['查看上次作答']],
    ['10', ['继续作答']],
  ]);

  const actionHandlers = {
    '00': (index, id) => gotoPractice(id),
    '02': (index, id) => (index === 0 ? gotoPractice(id) : gotoPracticeInfo(id)),
    '04': (index, id) => (index === 0 ? gotoPractice(id) : gotoPracticeInfo(id)),
    '06': () => {},
    '08': (index, id) => gotoPracticeInfo(id),
    '10': (index, id) => gotoPractice(id),
  };

  // 处理对应操作
  function handleAction(action, index, practiceID) {
    const handler = actionHandlers[action];

    if (handler) handler(index, practiceID);
    else toast.error('操作出错');
  }

  // 练习列表
  let practiceList = $state([]);
  let currentPracticeList = $derived(practiceList.filter((p) => p.Type === currentPracticeTypeTab));

  // 获取练习列表
  function getPracticeList(q) {
    fetch(
      `/api/practiceS?name=${q.name}&difficulty=${q.difficulty}&page=${q.page}&pageSize=${q.pageSize}&type=${q.type}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error('网络错误');
        return res.json();
      })
      .then((res) => {
        if (!res.status) {
          practiceList = res.data.practice;
          totalCount = res.data.total;

          // 计算每个练习 action
          if (Array.isArray(practiceList)) practiceList.forEach((p) => (p.Action = getPracticeAction(p)));
        } else throw new Error(res.msg ?? '获取练习列表失败');
      })
      .catch((err) => {
        toast.error(err.message);
      });
  }

  // 重置
  function handleReset() {
    practiceInfo = '';
    practiceDifficulty = '';
  }

  // 搜索
  function handleSearch() {
    const q = {
      name: practiceInfo,
      difficulty: practiceDifficulty,
      page,
      pageSize,
      type: currentPracticeTypeTab,
    };

    getPracticeList(q);
  }

  // 处理页号改变
  function handlePageChange(event) {
    page = event.detail;
    handleSearch();
  }

  // 处理页大小改变
  function handlePageSizeChange(event) {
    pageSize = event.detail;
    handleSearch();
  }

  onMount(() => handleSearch());
</script>

<svelte:head>
  <title>3min • 练习列表</title>
</svelte:head>

{#snippet tip()}
  <img src="/student_practice_list/tip.svg" alt="?" style="width:0.9rem;height:0.9rem" />
{/snippet}

<div class="practice-body">
  <div class="options">
    <div class="input">
      <div class="label">搜索练习：</div>
      <InputBox placeholder="练习名称 / 知识点" bind:value={practiceInfo} type="text" showLabel={false} />
    </div>
    <div>
      练习难度：<Select bind:value={practiceDifficulty}>
        <Option value="" label="全部" />
        {#each difficultyMap as [key, val]}
          <Option value={key} label={val} />
        {/each}
      </Select>
    </div>
    <Button type="info" onclick={handleReset}>重置</Button>
    <Button type="primary" onclick={handleSearch}>搜索</Button>
  </div>

  <div class="practice-show">
    <div class="practice-category">
      {#each typeMap as [key, val] (key)}
        <button onclick={() => (currentPracticeTypeTab = key)} class:selected={currentPracticeTypeTab === key}
          >{val}{@render tip()}</button
        >
      {/each}
    </div>

    <div class="table">
      <table>
        <thead>
          <tr>
            <th>练习名称</th>
            <th>作答次数</th>
            <th>练习难度</th>
            <th>可作答次数</th>
            {#if currentPracticeTypeTab === '00'}
              <th>试卷题数</th>
              <th>错题数</th>
              <th>得分</th>
              <th>最高得分</th>
              <th>试卷总分</th>
            {:else if currentPracticeTypeTab === '02'}
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
          {#each currentPracticeList as practice (practice.ID)}
            <tr>
              <td>{practice.Name}</td>
              <td>{practice.AttemptCount}</td>
              <td
                class="difficulty"
                class:easy={practice.Difficulty === '00'}
                class:medium={practice.Difficulty === '02'}
                class:hard={practice.Difficulty === '04'}
                class:unknown={!difficultyMap.has(practice.Difficulty)}
                >{difficultyMap.get(practice.Difficulty) ?? '未知'}</td
              >
              <td>{practice.AllowedAttempts}</td>
              {#if currentPracticeTypeTab === '00'}
                <td>{practice.QuestionCount}</td>
                <td
                  >{practice.Action !== '00' &&
                  practice.Action !== '04' &&
                  practice.Action !== '06' &&
                  practice.Action !== '10'
                    ? practice.WrongCount
                    : '--'}</td
                >
                <td
                  >{practice.Action !== '00' &&
                  practice.Action !== '04' &&
                  practice.Action !== '06' &&
                  practice.Action !== '10'
                    ? practice.TotalScore
                    : '--'}</td
                >
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
              {:else if currentPracticeTypeTab === '02'}
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
                >{#each actionMap.get(practice.Action) as action, index (index)}
                  <button
                    class="option"
                    class:can-click={practice.Action !== '06'}
                    onclick={() => handleAction(practice.Action, index, practice.ID)}>{action}</button
                  >{/each}</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
      {#if currentPracticeList.length === 0}
        <div class="empty">
          <Empty text="暂无练习数据" />
        </div>
      {/if}
    </div>
  </div>
</div>

<div class="pagination">
  <Pagination totalItems={totalCount} on:pageChange={handlePageChange} on:pageSizeChange={handlePageSizeChange} />
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

      .input {
        display: flex;
        align-items: center;

        .label {
          white-space: nowrap;
        }
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
                border: 0;
                background-color: white;
                color: blue;

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
