<script>
  import { onMount, setContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import InfoCard from '../../_components/detail/InfoCard.svelte';
  import StudentGradeTable from '../../_components/detail/StudentGradeTable.svelte';
  import GradeChart from '../../_components/detail/GradeChart.svelte';
  import AnalysisPanel from '../../_components/detail/AnalysisPanel.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';

  /**
   * @typedef {Object} PracticeData
   * @property {number} practiceId - 练习ID
   * @property {string} name - 练习名称
   * @property {number} total_score - 总分
   * @property {number} average_score - 平均分
   * @property {number} completed_students - 作答人数
   * @property {number} passed_students - 通过人数
   * @property {string} mark_mode - 批改模式
   */


     // 常量定义
  const MARK_MODE_MAP = {
    '00': '自动批改',
    '10': '人工批改',
  };


  /**
   * @type {string|null}
   */
  let practiceId = $state('');

  /**
   * @type {PracticeData|null}
   * @description 当前练习数据
   */
  let practiceData = $state(null);

  /**
   * @type {boolean}
   * @description 页面是否显示
   * @default false
   */
  let is_show = $state(false);

  // 设置上下文
  setContext('practice', {
    get practiceId() {
      return practiceId;
    },
    get practiceData() {
      return practiceData;
    },
  });

  /**
   * 转换响应数据格式
   * @param {Object} rawData - 后端返回的原始数据
   * @returns {PracticeData} 转换后的练习数据
   */
  function transformResponseData(rawData) {
    return {
      practiceId: rawData.id,
      name: rawData.name,
      total_score: rawData.total_score,
      average_score: rawData.average_score || 0,
      completed_students: rawData.completed_students || 0,
      passed_students: rawData.passed_students || 0,
      mark_mode: MARK_MODE_MAP[rawData.mark_mode] || rawData.mark_mode || '自动批改',
    };
  }

  /**
   * 获取练习数据
   * @param {string} practiceId - 练习ID
   * @returns {Promise<PracticeData|null>} 返回练习数据
   */
  function fetchPracticeData(practiceId) {
    const query = new URLSearchParams({
      category: 'practice',
      page: '1',
      pageSize: '10',
      practiceID: practiceId,
    });

    return fetch(`/api/grade/list?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.status !== 0) throw new Error(json.msg || '接口返回异常');

        // 后端按 practiceID 过滤，数组里只有 1 条或为空
        const raw = (json.data || [])[0];
        if (!raw) throw new Error('未找到对应练习');

        return transformResponseData(raw);
      })
      .catch((err) => {
        console.error('获取练习数据失败:', err);
        toast.error(`获取练习数据失败: ${err.message}`);
        return null;
      });
  }

  // 页面初始化
  onMount(async () => {
    // 从 URL 参数获取练习 ID
    practiceId = $page.url.searchParams.get('id');
    console.log('练习ID:', practiceId);

    if (!practiceId) {
      console.error('缺少练习ID参数');
      return;
    }

    // 获取练习数据
    practiceData = await fetchPracticeData(practiceId);

    // 显示页面
    is_show = true;
  });
</script>

{#if is_show}
  <div class="page-container">
    <div class="detail-container">
      <div class="first-row">
        <div class="card card1"><InfoCard type="practice" data={practiceData} /></div>
        <div class="card card2"><GradeChart type="practice" resource_id={practiceId} papers={[]} /></div>
      </div>
      <div class="second-row">
        <div class="card card3"><StudentGradeTable type="practice" resource_id={practiceId} papers={[]} /></div>
      </div>
      <div class="third-row">
        <!-- <div class="card card4"><AnalysisPanel type="practice" resource_id={practiceId} papers={[]} /></div> -->
      </div>
    </div>
  </div>
{/if}

<style lang="scss" scoped>
  .page-container {
    background-color: var(--bg-primary);
    height: 100%;
    width: 100%;

    .detail-container {
      display: flex;
      flex-direction: column;
      height: 98%;
      gap: 20px;
      overflow: auto;
      padding: 10px;

      .card {
        box-sizing: border-box;
        border: 1px solid #d7d7d7;
        border-radius: var(--border-radius-md);
        padding: 10px;
      }

      .first-row {
        display: flex;
        gap: 10px;
        flex-shrink: 0;

        .card1 {
          flex: 0 0 calc(55% - 5px);
          min-width: 800px;
        }

        .card2 {
          flex: 0 0 calc(45% - 5px);
          min-width: 680px;
        }
      }

      .second-row,
      .third-row {
        .card3,
        .card4 {
          min-width: 1480px;
        }

      }
    }
  }
</style>
