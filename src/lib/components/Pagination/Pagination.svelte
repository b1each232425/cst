<!--
   分页器组件使用说明

   作者：熊炜
   邮箱：1062051028@qq.com

   参数配置：
   @param {Number} total_items        总数据条数  number
   @param {Number} page_size          每页显示的数据条数  number
   @param {Number} current_page       当前页数  number
   @param {Number} jump_page          跳转目标页  number
   @param {Array} page_size_options   每页条数选项  array

   函数说明：
   @event pageChange                页码发生变化时触发，传递当前页码  { page: number }
   @event pageSizeChange            每页条数变化时触发，传递新的每页条数  { size: number }

   使用示例：
   <Pagination
     total_items={100}               // 总数据条数
     page_size={10}                  // 每页条数
     current_page={1}                // 当前页
     page_size_options={[10, 20, 30]} // 每页条数选择项
     on:pageChange={handlePageChange}  // 监听页码变化
     on:pageSizeChange={handlePageSizeChange}  // 监听每页条数变化
   />

   // 父组件控制分页器的行为
   function handlePageChange(event) {
     current_page = event.detail;
     // 做分页逻辑处理
   }

   function handlePageSizeChange(event) {
     page_size = event.detail;
     // 做每页条数变化逻辑处理
   }
-->

<script>
  import left_jt from '/static/pagination/left.svg';
  import right_jt from '/static/pagination/right.svg';
  import { createEventDispatcher } from 'svelte';
  import Select from '../Select/Select.svelte';
  import Option from '../Select/Option.svelte';

  // 从父组件接收的属性参数
  let {
    total_items = 0, // 总数据条数，默认0
    page_size = 10, // 每页显示条数，默认10
    current_page = 1, // 当前页码，默认1
    jump_page = 1, // 跳转目标页，默认1
    page_size_options = [10, 20, 30, 40, 50], // 每页条数可选配置
  } = $props();

  // 参数校验
  (() => {
    // 校验 total_items 参数
    if (typeof total_items !== 'number') {
      console.warn(`[Pagination] total_items 应该是一个数字，当前为 ${typeof total_items}`);
      total_items = 0; // 设置默认值
    }

    // 校验 page_size 参数
    if (typeof page_size !== 'number') {
      console.warn(`[Pagination] page_size 应该是一个数字，当前为 ${typeof page_size}`);
      page_size = 10; // 设置默认值
    }

    // 校验 current_page 参数
    if (typeof current_page !== 'number') {
      console.warn(`[Pagination] current_page 应该是一个数字，当前为 ${typeof current_page}`);
      current_page = 1; // 设置默认值
    }

    // 校验 jump_page 参数
    if (typeof jump_page !== 'number') {
      console.warn(`[Pagination] jump_page 应该是一个数字，当前为 ${typeof jump_page}`);
      jump_page = 1; // 设置默认值
    }

    // 校验 page_size_options 参数
    if (!Array.isArray(page_size_options)) {
      console.warn(`[Pagination] page_size_options 应该是一个数组，当前为 ${typeof page_size_options}`);
      page_size_options = [10, 20, 30, 40, 50]; // 设置默认值
    } else {
      // 校验数组内每一项是否为数字
      let flag = false;
      page_size_options.forEach((option, index) => {
        if (typeof option !== 'number') {
          console.warn(`[Pagination] page_size_options[${index}] 应该是一个数字，当前为 ${typeof option}`);
          flag = true;
        }
      });
      if (flag) {
        page_size_options = [10, 20, 30, 40, 50]; // 设置默认值
      }
    }
  })();

  // 创建事件分发器
  const dispatch = createEventDispatcher();

  // 计算属性：总页数（向上取整）
  let total_pages = $derived(Math.ceil(total_items / page_size));

  // 计算属性：需要显示的页码数组
  let visible_pages = $derived(getVisiblePages(total_pages));

  // 转换每页条数选项为下拉框需要的格式
  let size_options = page_size_options.map((size) => ({
    value: size,
    label: `${size}条/页`,
  }));

  /**
   * 跳转到指定页码
   * @param {number} page - 目标页码
   */
  function goToPage(page) {
    // 验证页码范围有效性
    if (page >= 1 && page <= total_pages) {
      current_page = page;
      // 触发页码变化事件
      dispatch('pageChange', page);
    }
  }

  /**
   * 跳转到上一页
   */
  function prevPage() {
    if (current_page > 1) {
      current_page--;
      dispatch('pageChange', current_page);
    }
  }

  /**
   * 跳转到下一页
   */
  function nextPage() {
    if (current_page < total_pages) {
      current_page++;
      dispatch('pageChange', current_page);
    }
  }

  /**
   * 处理跳转页码输入
   */
  function handleJump() {
    const page = +jump_page; // 转换为数字
    if (!isNaN(page)) {
      // 验证是否为有效数字
      goToPage(page);
    }
  }

  /**
   * 处理每页显示条数变化
   */
  function handlePageSizeChange() {
    // 如果当前页超出新的总页数，跳转到最后一页
    if (current_page > Math.ceil(total_items / page_size)) {
      current_page = Math.ceil(total_items / page_size);
    }

    // 触发两个事件：条数变化和页码变化
    dispatch('pageSizeChange', page_size);
    dispatch('pageChange', current_page);
  }

  /**
   * 计算需要显示的页码数组
   * @param {number} total - 总页数
   * @returns {Array} 需要显示的页码数组（可能包含省略号）
   */
  function getVisiblePages(total) {
    const pages = [];
    const max_visible = 5; // 中间最多显示5个页码

    // 如果总页数较少，直接显示所有页码
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // 始终显示第一页
    pages.push(1);

    // 当前页靠后时，显示前省略号
    if (current_page > 3) {
      pages.push('...');
    }

    // 计算中间页码的起始和结束位置
    const start = Math.max(2, current_page - 1);
    const end = Math.min(total - 1, current_page + 1);

    console.log(start, end);

    if (current_page < 4) {
      // 当前页靠前时的处理
      for (let i = 2; i <= 4; i++) {
        pages.push(i);
      }
    } else if (current_page > total - 3) {
      // 当前页靠后时的处理
      for (let i = total - 3; i <= total - 1; i++) {
        pages.push(i);
      }
    } else {
      // 当前页在中间时的处理
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    // 当前页不够靠后时，显示后省略号
    if (current_page < total - 2) {
      pages.push('...');
    }

    // 始终显示最后一页
    pages.push(total);
    return pages;
  }
</script>

<!-- 分页器容器 -->
<div class="pagination-wrapper">
  <!-- 总条数显示 -->
  <div class="total-items">{`共 ${total_items} 条`}</div>

  <!-- 页码导航区 -->
  <div class="pagination">
    <!-- 上一页按钮 -->
    <button onclick={prevPage} disabled={current_page === 1} data-testid="left_jt">
      <img src={left_jt} alt="上一页" />
    </button>

    <!-- 动态生成页码按钮 -->
    {#each visible_pages as page}
      {#if page === '...'}
        <!-- 省略号显示 -->
        <span class="dots">...</span>
      {:else}
        <!-- 页码按钮，高亮当前页 -->
        <button class:active={current_page === page} onclick={() => goToPage(page)}>
          {page}
        </button>
      {/if}
    {/each}

    <!-- 下一页按钮 -->
    <button onclick={nextPage} disabled={current_page === total_pages} data-testid="right_jt">
      <img src={right_jt} alt="下一页" />
    </button>
  </div>

  <!-- 每页条数设置 -->
  <div class="page-settings">
    <Select bind:value={page_size} direction="top" changeValue={handlePageSizeChange}>
      {#each size_options as option}
        <Option value={option.value} label={option.label}></Option>
      {/each}
    </Select>
  </div>

  <!-- 页码跳转区 -->
  <div class="jump-to">
    <span>前往</span>
    <input
      type="number"
      min="1"
      max={total_pages}
      bind:value={jump_page}
      onkeydown={(e) => e.key === 'Enter' && handleJump()}
      data-testid="jump-to-input"
    />
  </div>
</div>

<style>
  .pagination-wrapper {
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;

    .total-items {
      color: #333;
      display: flex;
      margin-bottom: 4px;
      font-size: 14px;
      font-weight: 500;
    }

    .pagination {
      display: flex;
      gap: 0.1rem;
      align-items: center;

      .dots {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        height: 2rem;
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
        min-width: 2rem;
        height: 2rem;
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
      width: 90px;
      gap: 0.1rem;
      border-radius: 6px;
    }

    .jump-to {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin-left: 5px;

      span {
        font-size: 0.9rem;
        color: #555;
      }

      input {
        width: 50px;
        padding: 0.3rem 0.1rem;
        font-size: 0.9rem;
        border: none;
        border-radius: 4px;
        background-color: #f5f5f5;
        text-align: center;
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
