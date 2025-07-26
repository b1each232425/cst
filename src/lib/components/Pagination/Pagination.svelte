<!-- /**
   * 分页器组件使用说明
   *
   * 作者：熊炜
   * 邮箱：1062051028@qq.com
   *
   * 参数配置：
   * @param {Number} totalItems        总数据条数  number
   * @param {Number} pageSize          每页显示的数据条数  number
   * @param {Number} currentPage       当前页数  number
   * @param {Number} jumpPage          跳转目标页  number
   * @param {Array} pageSizeOptions    每页条数选项  array
   *
   * 函数说明：
   * @event pageChange                页码发生变化时触发，传递当前页码  { page: number }
   * @event pageSizeChange            每页条数变化时触发，传递新的每页条数  { pageSize: number }
   *
   * 使用示例：
   * <Pagination
   *   totalItems={100}               // 总数据条数
   *   pageSize={10}                  // 每页条数
   *   currentPage={1}                // 当前页
   *   pageSizeOptions={[10, 20, 30]} // 每页条数选择项
   *   on:pageChange={handlePageChange}  // 监听页码变化
   *   on:pageSizeChange={handlePageSizeChange}  // 监听每页条数变化
   * />
   *
   * // 父组件控制分页器的行为
   * function handlePageChange(event) {
   *   currentPage = event.detail;
   *   // 做分页逻辑处理
   * }
   *
   * function handlePageSizeChange(event) {
   *   pageSize = event.detail;
   *   // 做每页条数变化逻辑处理
   * }
   */ -->

<script>
  // @ts-nocheck
  import left_jt from '/static/pagination/left_jt.svg';
  import right_jt from '/static/pagination/right_jt.svg';
  import { createEventDispatcher } from 'svelte';

  let {
    totalItems = 0, // 总数据条数
    pageSize = 10, // 每页显示的数据条数
    currentPage = 1, // 当前页数
    jumpPage = 0, // 跳转的目标页
    pageSizeOptions = [10, 20, 30, 40, 50], // 每页条数选项
  } = $props(); // 从父组件获取的属性

  // 创建一个事件分发器，用于在分页组件内触发事件并通知父组件
  const dispatch = createEventDispatcher();

  let totalPages = $derived(Math.ceil(totalItems / pageSize)); // 总页数
  let pagesToShow = $derived(calculatePagesArray(totalPages)); // 用于保存要显示的页码数组

  // 处理跳转到指定页面
  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page; // 更新当前页
      dispatch('pageChange', page);
    }
  }

  // 处理上一页
  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      dispatch('pageChange', currentPage);
    }
  }

  // 处理下一页
  function nextPage() {
    if (currentPage < totalPages) {
      currentPage++;
      dispatch('pageChange', currentPage);
    }
  }

  // 输入页数并跳转
  function handleJump() {
    const page = +jumpPage;
    if (!isNaN(page)) {
      goToPage(page);
    }
  }

  // 处理每页显示条数的变化
  function handlePageSizeChange(event) {
    const sizeOption = +event.target.value;
    if (currentPage > Math.ceil(totalItems / sizeOption)) {
      currentPage = Math.ceil(totalItems / sizeOption);
    }
    pageSize = sizeOption;
    dispatch('pageSizeChange', pageSize);
  }

  // 处理分页的页面列表逻辑
  function calculatePagesArray(total) {
    let pages = [];

    // 如果总页数小于等于8，直接显示所有页码
    if (total <= 8) {
      pages = Array.from({ length: total }, (_, i) => i + 1);
    } else {
      pages.push(1); // 始终显示第一页

      // 如果当前页大于5，显示省略号
      if (currentPage > 5) {
        pages.push('...');
      }

      let start = Math.max(2, currentPage - 2); // 计算中间起始页
      let end = Math.min(total - 1, currentPage + 2); // 计算中间结束页

      // 处理中间展示显示的页码数组
      if (currentPage <= 4) {
        start = 2;
        end = 6;
      }

      if (currentPage >= total - 3) {
        start = total - 5;
        end = total - 1;
      }

      // 将中间起始页到中间结束页的页码添加到页面数组中
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // 如果当前页小于总页数 - 4，显示省略号
      if (currentPage < total - 4) {
        pages.push('...');
      }

      pages.push(total); // 始终显示最后一页
    }

    return pages;
  }
</script>

<div class="pagination-wrapper">
  <div class="total-items">共 {totalItems} 条</div>

  <div class="pagination">
    <button onclick={prevPage} disabled={currentPage === 1}>
      <img src={left_jt} alt="" />
    </button>

    {#each pagesToShow as page}
      {#if page === '...'}
        <span class="dots">...</span>
      {:else}
        <button class:active={currentPage === page} onclick={() => goToPage(page)}>
          {page}
        </button>
      {/if}
    {/each}

    <button onclick={nextPage} disabled={currentPage === totalPages}>
      <img src={right_jt} alt="" />
    </button>
  </div>

  <div class="page-settings">
    <select onchange={handlePageSizeChange}>
      {#each pageSizeOptions as sizeOption}
        <option value={sizeOption}>{sizeOption}条/页</option>
      {/each}
    </select>
  </div>

  <div class="jump-to">
    <span>前往</span>
    <input
      type="number"
      min="1"
      max={totalPages}
      bind:value={jumpPage}
      onkeydown={(e) => e.key === 'Enter' && handleJump()}
    />
  </div>
</div>

<style>
  .pagination-wrapper {
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    .total-items {
      color: #333;
      display: flex;
      align-items: center;
    }

    .pagination {
      display: flex;
      gap: 0.1rem;
      align-items: center;

      .dots {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 2.2rem;
        height: 2.2rem;
        font-size: 1rem;
        color: #999;
      }

      img {
        width: 0.7rem;
        height: 0.7rem;
      }

      button {
        padding: 0.4rem 0.7rem;
        background: transparent;
        cursor: pointer;
        font-size: 0.9rem;
        min-width: 2.2rem;
        height: 2.2rem;
        border: none;
        border-radius: 4px;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .active {
        color: #0056b3;
        background-color: #e6f0ff;
      }
    }

    .page-settings {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      background-color: #f5f5f5;
      border-radius: 6px;

      select {
        padding: 0.3rem 0.5rem;
        font-size: 0.9rem;
        border: none;
        border-radius: 4px;
        background-color: #f5f5f5;
      }
      select:focus {
        outline: none;
      }
    }

    .jump-to {
      display: flex;
      align-items: center;
      gap: 0.3rem;

      span {
        font-size: 0.9rem;
        color: #555;
      }

      input {
        width: 60px;
        padding: 0.3rem 0.5rem;
        font-size: 0.9rem;
        border: none;
        border-radius: 4px;
        background-color: #f5f5f5;
      }

      input:focus {
        outline: none;
      }

      /* 隐藏input的上下箭头 */
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }
  }
</style>
