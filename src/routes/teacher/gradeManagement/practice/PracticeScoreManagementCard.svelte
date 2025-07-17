<!-- 
 /*
 * @Author: Mayux dbs45412@163.com
 * @Date: 2025-04-06 16:03:00
 * @LastEditors: zdl 1311866870@qq.com
 * @LastEditTime: 2025-06-20 22:47:28
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\gradeManagement\practice\PracticeScoreManagementCard.svelte
 * @Description: 练习成绩管理页卡片
 * Copyright (c) 2025 by Mayux, All Rights Reserved. 
 */ 
 -->
<!--                         o8o                 .   
                             `"'               .o8   
 .oooo.o  .ooooo.  oooo d8b oooo  oo.ooooo.  .o888oo 
d88(  "8 d88' `"Y8 `888""8P `888   888' `88b   888   
`"Y88b.  888        888      888   888   888   888   
o.  )88b 888   .o8  888      888   888   888   888 . 
8""888P' `Y8bod8P' d888b    o888o  888bod8P'   "888" 
                                   888               
                                  o888o              
-->
<script>
  // @ts-nocheck

  import Title from "$lib/component/Title.svelte";
  import DropdownBlue from "$lib/component/DropdownBlue.svelte";
  import UneditableTags from "$lib/component/UneditableTags.svelte";
  import SearchInput from "$lib/component/SearchInput.svelte";
  import DropdownGray from "$lib/component/DropdownGray.svelte";
  import Pagination from "$lib/component/Pagination.svelte";
  import DropdownBlueWithSearch from "$lib/component/DropdownBlueWithSearch.svelte";
  import { formatSecondTimestamp } from "$lib/common/time_utils";
  import {exportPracticeToExcel} from "$lib/excel_export/export_practice_score"
  import { sget } from '$lib/common/api_data';
  import { goto } from "$app/navigation";

  /**
   * @typedef PracticeInfo
   * @property {number} id -练习ID
   * @property {string} name -练习名称
   * @property {string} class -练习班级
   * @property {number} total_score -练习总分
   * @property {number} average_score -练习平均分
   * @property {number} completed_students -作答人数
   * @property {number} passed_students -通过人数
   */

  /**
   * @typedef ResponseData
   * @property {PracticeInfo[]} data -练习信息列表
   * @property {number} status -状态码
   * @property {string} msg -状态信息
   * @property {number} row_count -总行数
   */

  /**
   * @typedef PracticeInfoCache
   * @property {number} select_num -当前选中的练习数量
   * @property {PracticeInfo[]} practice_info -练习信息列表
   */

  let { is_folded = false } = $props();

  /**
   * 当前选择的课程
   * @type {number}
   */
  let current_select_course = $state(0);

  /**
   * 当前选择的班级
   * @type {number}
   */
  let current_select_class = $state(0);

  /**
   * 当前搜索的练习名称输入
   * @type {string}
   */
  let current_name_search_input = $state("");

  /**
   * 学习人数
   * @type {number}
   */
  let learners_num = $state(0);

  /**
   * 班级数量
   * @type {number}
   */
  let classes_num = $state(0);

  /**
   * 练习数量
   * @type {number}
   */
  let practices_num = $state(0);

  /**
   * 当前选中的练习数量
   * @type {number}
   */
  let choose_num = $state(0);

  /**
   * 当前是否有选中练习
   * @type {boolean}
   */
  let rows_is_select = $state(false);

  /**
   * 当前页码
   * @type {number}
   */
  let current_page = $state(1);

  /**
   * 每页显示的练习数量
   * @type {number}
   */
  let page_size = $state(10);

  /**
   * 上一次选择的每页练习数量
   * @type {number}
   */
  let last_page_size = $state(10);

  /**
   * 总行数
   * @type {number}
   */
  let total_row_count = $state(0);

  /**
   * 当前页练习信息列表
   * @type {PracticeInfo[]}
   */
  let practice_info = $state([]);

  /**
   * 练习信息缓存
   * @type {Record<number, PracticeInfoCache>} key:页数, value:练习信息列表
   */
  let practice_info_cache = $state({});

  /**
   * 当前选择的练习, 如: { "123456":"test" }, key:练习id, value: 练习名称
   * @type {Record<string, string>}
   */
  let current_select_practice = $state({});

  /**
   * 课程选择下拉框的选项
   */
  let course_choose_dropdown_maps = $state([
    { value: 0, label: "全部" },
    { value: -1, label: "未指定课程" },
  ]);

  /**
   * 班级选择下拉框的选项
   */
  let class_choose_dropdown_maps = $state([
    { value: 0, label: "全部" },
    { value: -1, label: "未指定班级" },
  ]);

  /**
   * 全选状态
   * @type {boolean}
   */
  let select_all = $state(false);

  $effect(async () => {
    await getPracticeInfo(
      current_select_course,
      current_select_class,
      current_page,
      page_size,
    );
  });

  /**
   * 获取练习信息列表
   * @param {number} [courseID] - 课程ID
   * @param {number} [classID] - 班级ID
   * @param {number} [page_num] - 当前页码
   * @param {number} [page_size] - 每页显示的练习数量
   * @param {boolean} [updated] - 是否更新练习信息
   */
  async function getPracticeInfo(
    courseID,
    classID,
    page_num = 1,
    page_size = 20,
    updated,
  ) {
    if (last_page_size != page_size) {
      current_page = 1;
      last_page_size = page_size;
      practice_info_cache = {};
      resetPracticeSelect();
    }

    if (updated) {
      practice_info_cache = {};
      resetPracticeSelect();
    }

    if (practice_info_cache[page_num]) {
      practice_info = practice_info_cache[page_num].practice_info;
      return;
    }

    let practice_name = $state.snapshot(current_name_search_input);

    let url = `/api/teacher/practice-grade?courseID=${courseID}&classID=${classID}&page=${page_num}&pageSize=${page_size}&practiceName=${practice_name}`;

    let resp = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    /**
     * @type {ResponseData}
     */
    let resp_data = await resp.json();

    if (resp_data.status < 0) {
      throw new Error(resp_data.msg);
    } else if (resp_data.status > 0) {
      console.warn(resp_data.msg);
    }

    practice_info = resp_data.data ?? [];

    for (let practice of practice_info) {
      practice.total_score =
        practice.total_score == -1 || practice.total_score == null
          ? "−"
          : practice.total_score.toFixed(1);

      practice.average_score =
        practice.average_score == -1 || practice.average_score == null
          ? "−"
          : practice.average_score.toFixed(1);
    }

    total_row_count = resp_data.row_count;

    // console.log($state.snapshot(practice_data));

    practice_info_cache[page_num] = {
      select_num: 0,
      practice_info: practice_info,
    };
  }

  /**
   * 当前页全选处理函数
   * @param {boolean} is_select_all
   */
  function handleCurrentPageSelectAll(is_select_all) {
    if (!is_select_all) {
      for (let practice of practice_info) {
        delete current_select_practice[practice.id];
        choose_num--;
      }

      if (choose_num == 0) {
        rows_is_select = false;
      }

      return;
    }

    rows_is_select = true;

    practice_info_cache[current_page].select_num = practice_info.length;

    for (let practice of practice_info) {
      if (current_select_practice[practice.id]) {
        continue;
      }

      choose_num++;
      current_select_practice[practice.id] = practice.name;
    }
  }

  /**
   * 选中练习处理函数
   * @param {number} id - 练习id
   * @param {string} name - 练习名称
   */
  function handleSelectPractice(id, name) {
    if (current_select_practice[id]) {
      delete current_select_practice[id];

      choose_num = choose_num == 0 ? choose_num : choose_num - 1;

      let select_num = practice_info_cache[current_page].select_num;

      practice_info_cache[current_page].select_num =
        select_num == 0 ? select_num : select_num - 1;
    } else {
      current_select_practice[id] = name;

      choose_num = choose_num + 1;

      let select_num = practice_info_cache[current_page].select_num;

      practice_info_cache[current_page].select_num =
        select_num == practice_info.length ? select_num : select_num + 1;
    }

    // console.log($state.snapshot(current_select_practice));

    switch (practice_info_cache[current_page].select_num) {
      case 0:
        rows_is_select = false;
        select_all = false;
        break;

      case practice_info.length:
        rows_is_select = true;
        select_all = true;
        break;

      default:
        rows_is_select = true;
        select_all = false;
        break;
    }
  }

  /**
   * 重置选择
   */
  function resetPracticeSelect() {
    current_select_practice = {};

    select_all = false;

    rows_is_select = false;

    choose_num = 0;
  }

  /**
   * @param {Record<string,number>} SelectPracticeID - 练习ID数组
   * @description 批量不分页获取练习数据
   *
   */
  async function handleExportPracticeScore(SelectPracticeID) {
    let PracticeIDString = Object.keys(SelectPracticeID).join(",");
    console.log(PracticeIDString);
    const res = await fetch(
      `/api/teacher/practice-grade/examinee-grade-list?practiceID=${PracticeIDString}&page=-1&pageSize=-1`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    let resp_data = await res.json();
    const status = sget(resp_data, "status", -1);
    const msg = sget(resp_data, "msg", "");
    if (status === -1) {
      console.error("获取考试考生名单失败");
    } else {
      const data = sget(resp_data, "data", []);
      // 这里获取到之后，再进行导出，等待完成
      if (data == null || data.length === 0) {
        console.error("获取考试考生名单失败");
        return
      }
      await exportPracticeToExcel(data, SelectPracticeID);
    }
  }

  // 单一导出一个练习
async function handleExportSingleEPracticeScore(practiceID,practiceName){
   const res = await fetch(
      `/api/teacher/practice-grade/examinee-grade-list?practiceID=${practiceID}&page=-1&pageSize=-1`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    let resp_data = await res.json();
    const status = sget(resp_data, "status", -1);
    const msg = sget(resp_data, "msg", "");
    if (status === -1) {
      console.error("获取练习名单失败");
    } else {
      const data = sget(resp_data, "data", []);
      // 这里获取到之后，再进行导出，等待完成
      if (data == null || data.length === 0) {
        console.error("获取练习名单失败");
        return
      }
      // 这里要获取一次这个名字
      let exportData = {}
      exportData[practiceID] = practiceName
      await exportPracticeToExcel(data, exportData);
    }

}

  /**
   * 处理分页选择函数
   * @param {number} page - 当前页码
   */
  async function handlePageChange(page) {
    current_page = page;

    select_all = false;

    if (!practice_info_cache[page]) {
      return;
    }

    let practice_info = practice_info_cache[page].practice_info;

    for (let practice of practice_info) {
      if (current_select_practice[practice.id]) {
        select_all = true;
        continue;
      }

      select_all = false;
    }
  }

  /**
   * 处理搜索输入
   * @param {string} value - 搜索输入的值
   */
  function handleNameSearch(value) {
    current_name_search_input = value;

    getPracticeInfo(
      current_select_course,
      current_select_class,
      current_page,
      page_size,
      true,
    );
  }
</script>

<!-- 
oooo            .                     oooo  
`888          .o8                     `888  
 888 .oo.   .o888oo ooo. .oo.  .oo.    888  
 888P"Y88b    888   `888P"Y88bP"Y88b   888  
 888   888    888    888   888   888   888  
 888   888    888 .  888   888   888   888  
o888o o888o   "888" o888o o888o o888o o888o                                                     
-->

{#snippet tableHead()}
  <tr class="practice-list-head">
    <th class="practice-select">
      <button
        class="square-container {select_all ? 'checked' : ''}"
        onclick={() => {
          select_all = !select_all;
          handleCurrentPageSelectAll(select_all);
        }}
      >
        {#if select_all}
          <div class="check-square"></div>
        {/if}
      </button>
    </th>
    <th class="practice-name">名称</th>
    <th class="practice-total-score">总分</th>
    <th class="practice-average-score">平均分</th>
    <th class="practice-actual-students">作答人数</th>
    <th class="practice-pass-students">通过人数</th>
    <th class="operation">操作</th>
  </tr>
{/snippet}

{#snippet tableRow(
  /**
   * 练习信息
   * @type {PracticeInfo}
   */
  practice,

  /**
   * 当前行索引
   * @type {number}
   */
  index,
)}
  <tr class="practice-list-row" class:alter={index % 2 == 1}>
    <!-- 复选框 -->
    <td class="practice-select">
      <button
        class="square-container {current_select_practice[practice.id] != null
          ? 'checked'
          : ''}"
        onclick={() => {
          handleSelectPractice(practice.id, practice.name);
        }}
      >
        {#if current_select_practice[practice.id] != null}
          <div class="check-square"></div>
        {/if}
      </button>
    </td>

    <!-- 练习名称 -->
    <td class="practice-name" title={practice.name == "" ? "-" : practice.name}>
      <span>{practice.name == "" ? "-" : practice.name}</span>
    </td>

    <!-- 练习总分 -->
    <td class="practice-total-score">
      <span class="score-text">
        {practice.total_score == -1 || practice.total_score == null
          ? "−"
          : practice.total_score}
      </span>
    </td>

    <!-- 练习平均分 -->
    <td class="practice-average-score">
      <span class="score-text">
        {practice.average_score == -1 || practice.average_score == null
          ? "−"
          : practice.average_score}
      </span>
    </td>

    <!-- 实考人数 -->
    <td class="practice-actual-students">
      <span>
        {practice.completed_students == -1 ||
        practice.completed_students == null
          ? "−"
          : practice.completed_students}
      </span>
    </td>

    <!-- 通过人数 -->
    <td class="practice-pass-students">
      <span>
        {practice.passed_students == -1 || practice.passed_students == null
          ? "−"
          : practice.passed_students}
      </span>
    </td>

    <!-- 操作 -->
    <td class="operation">
      <button
        class="details-btn"
        onclick={() =>
          goto(
            `/teacher/gradeManagement/practice/detail?practiceId=${encodeURIComponent(practice.id)}`,
          )}
      >
        详情
      </button>
      <button class="export-btn" onclick={async() =>{
        await handleExportSingleEPracticeScore(practice.id,practice.name)
      }}> 导出 </button>
    </td>
  </tr>
{/snippet}

<div class="container {is_folded ? 'fold' : 'unfold'}">
  <!-- <div class="card {is_folded ? 'fold' : 'unfold'}"> -->
  <Title title="练习成绩管理" />

  <!--表格的搜索、筛选部分-->
  <div class="table-action-bar">
    <div class="search-group">
      <div class="search-container">
        <SearchInput
          purpose_text={"搜索练习"}
          place_holder="请输入练习名称"
          onSearchFunc={(value) => {
            handleNameSearch(value);
          }}
        />
      </div>
    </div>
    <div class="table-action-group">
      <span class="choose_num_text1">当前已选中</span>
      <span class="choose_num">{choose_num}</span>
      <span class="choose_num_text2">项</span>
      <button
        class={rows_is_select
          ? "batch-export-button"
          : "batch-export-button-disabled"}
        onclick={async () => {
          // console.log("点击批量导出按钮");
          await handleExportPracticeScore(current_select_practice)
        }}
        disabled={!rows_is_select}
      >
        批量导出
      </button>
    </div>
  </div>

  <!--基础信息面板（练习类型选择、课程选择、班级选择）-->
  <div class="form-panel">
    <div class="course-class-row">
      <!-- 课程选择 -->
      <!-- 后续对接课程 -->
      <!-- <span class="course-choose-text">课程选择</span>
				<div class="blue-dropdown-container">
					<DropdownBlueWithSearch
						options={course_choose_dropdown_maps}
						selected={current_select_course}
						search_place_holder="输入课程名搜索课程"
						selectOptionFunc={(/**@type {number}*/ value) => {
							current_select_course = value;
						}}
					/>
				</div> -->

      <!-- 班级选择 -->
      <!-- {#if current_select_course != 0 && current_select_course != -1}
					<span class="class-choose-text">班级选择</span>
					<div class="blue-dropdown-container">
						<DropdownBlueWithSearch
							options={class_choose_dropdown_maps}
							selected={current_select_class}
							search_place_holder="输入班级名搜索班级"
							selectOptionFunc={(/**@type {number}*/ value) => {
								current_select_class = value;
							}}
						/>
					</div>
				{/if} -->
    </div>

    {#if current_select_course != 0 && current_select_course != -1}
      <div class="basic-msg-row1">
        <!-- 学习人数 -->
        <span class="learners-num-text">学习人数</span>
        <div class="learners-num">{learners_num}</div>

        <!-- 班级数量 -->
        <!-- <span class="classes-num-text">班级数量</span>
					<div class="classes-num">{classes_num}</div> -->
      </div>

      <div class="basic-msg-row2">
        <!-- 课程标签 -->
        <!-- <span class="course-tags-text">课程标签</span>
					<div class="course-tags">
						<UneditableTags />
					</div> -->

        <!-- 练习数量 -->
        <span class="practices-num-text">练习数量</span>
        <div class="practices-num">{practices_num}</div>
      </div>
    {/if}
  </div>

  <!--表格部分-->
  <div class="table-container">
    <table>
      <thead>
        {@render tableHead()}
      </thead>

      <tbody>
        {#each practice_info as practice, index}
          {@render tableRow(practice, index)}
        {/each}
      </tbody>
    </table>

    <div class="pagination-container">
      <Pagination
        current_page_num={current_page}
        max_show_page_num={page_size}
        total_data_num={total_row_count}
        total_page_num={Math.ceil(total_row_count / page_size)}
        expand_direction="up"
        selectOptionFunc={(value) => {
          page_size = value;
        }}
        onPageChooseFunc={(value) => {
          current_page = value;
        }}
        onPageChangeFunc={(is_next) => {
          if (is_next) {
            current_page =
              current_page == Math.ceil(total_row_count / page_size)
                ? current_page
                : current_page + 1;
          } else {
            current_page = current_page == 1 ? current_page : current_page - 1;
          }
        }}
      />
    </div>
  </div>
  <!-- </div> -->
</div>

<!-- 
             .               oooo            
           .o8               `888            
 .oooo.o .o888oo oooo    ooo  888   .ooooo.  
d88(  "8   888    `88.  .8'   888  d88' `88b 
`"Y88b.    888     `88..8'    888  888ooo888 
o.  )88b   888 .    `888'     888  888    .o 
8""888P'   "888"     .8'     o888o `Y8bod8P' 
                 .o..P'                      
                 `Y8P'                       
                       
 -->
<style lang="scss" scoped>
  $container-width: 100%;
  $container-height: 100%;
  $card-border: 1px solid #d7d7d7;
  $card-border-radius: 10px;
  $card-min-width: 900px;
  $form-panel-max-width: 1150px;
  $form-panel-height: 235px;
  $form-panel-padding: 0 0 0 0;
  $dropdown-height: 36px;
  $content-width: 333px;
  $table-action-bar-padding: 20px 0 0 46px;

  /* 定义不同缩放时的适配宽度 */
  $content-width-state1: 260px;
  $content-width-state2: 200px;

  .card {
    background-color: white;
  }

  .container {
    display: flex;
    flex-direction: column;
    position: relative;
    width: $container-width;
    height: $container-height;
    background-color: var(--text-white);
  }
  .form-panel {
    display: flex;
    flex-direction: column;
    position: relative;
    max-width: $form-panel-max-width;
    padding: $form-panel-padding;
  }

  .course-class-row,
  .basic-msg-row1,
  .basic-msg-row2,
  .table-action-bar,
  .search-group,
  .table-action-group {
    display: flex;
    flex-direction: row;
  }

  .card {
    display: flex;
    box-sizing: border-box;
    flex-direction: column;
    border-radius: $card-border-radius;
    border: $card-border;
    min-width: $card-min-width;
    width: calc(100% - 2.6%);
    margin: 12px 1.6% 12px 1%;
  }

  .big-title {
    display: flex;
    align-items: center;
    height: 60px;
    min-height: 60px;
    padding-left: 32px;
  }

  .big-title-icon {
    width: 7px;
    height: 24px;
    background-color: #0052d9;
  }

  .big-title-text {
    font-size: 20px;
    font-weight: bold;
    padding-left: 2px;
  }

  .blue-dropdown-container {
    min-width: $content-width;
    min-height: $dropdown-height;
    width: $content-width;
    height: $dropdown-height;
  }

  .course-class-row,
  .basic-msg-row1 {
    align-items: center;
    margin-bottom: 30px;
  }

  .course-choose-text,
  .class-choose-text,
  .learners-num-text,
  .classes-num-text,
  .learners-num,
  .classes-num,
  .course-tags-text,
  .practices-num-text,
  .practices-num,
  .choose_num_text1,
  .choose_num_text2 {
    font-size: 14px;
  }

  .choose_num {
    display: flex;
    justify-content: center;
    font-size: 16px;
    color: #0052d9;
    min-width: 35px;
  }

  .course-choose-text,
  .learners-num-text,
  .course-tags-text {
    padding: 0 49px 0 10px;
    min-width: 56px;
  }

  .class-choose-text,
  .classes-num-text,
  .practices-num-text {
    padding: 0 49px 0 22%;
    min-width: 56px;
  }

  .basic-msg-row1,
  .basic-msg-row2 {
    height: 36px;
  }

  .learners-num,
  .classes-num,
  .course-tags {
    min-width: $content-width;
    width: $content-width;
  }

  .basic-msg-row2,
  .search-group,
  .table-action-group,
  .practice-list-text,
  .table-action-bar {
    align-items: center;
  }

  .course-tags {
    padding-top: 10px;
    align-self: flex-start;
  }

  .practice-list-text {
    display: flex;
    font-size: 16px;
    font-weight: bold;
    padding-left: 39px;
    height: 40px;
  }

  .table-action-bar {
    padding: $table-action-bar-padding;
    flex-wrap: wrap;
    gap: 10px;
  }

  .table-action-group {
    padding: 0 20px 0 0;
  }

  .search-group {
    padding-right: 5%;
  }

  .choose_num_text2 {
    padding: 0 28px 0 0;
  }

  .choose_num_text1,
  .choose_num_text2 {
    color: #555555;
  }

  .batch-export-button {
    width: 88px;
    height: 32px;
    min-width: 88px;
    border: none;
    border-radius: 3px;
    color: white;
    background-color: #0052d9;
    font-size: 14px;
    cursor: pointer;
  }

  .batch-export-button-disabled {
    width: 88px;
    height: 32px;
    min-width: 88px;
    border: none;
    border-radius: 3px;
    color: white;
    background-color: #bbd3fb;
    font-size: 14px;
  }
  .table-container {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0 37px 100px 37px;
  }

  .table-container thead,
  .table-container tbody {
    display: flex;
    flex-direction: column;
    width: 100%;

    tr {
      display: flex;
      width: 100%;
      height: 64px;
      min-height: fit-content;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
      padding: 0 15px 0 15px;
    }

    .practice-name {
      width: 18%;
    }

    .practice-total-score,
    .practice-average-score,
    .practice-actual-students,
    .practice-pass-students {
      width: 8.5%;
    }

    .operation {
      width: 12%;
    }
  }

  .table-container thead {
    z-index: 1;
    background-color: var(--text-white);
    font-size: 14px;
    font-weight: normal;
    color: rgb(0, 0, 0, 0.3);
    border: none;
    text-align: center;
    th {
      color: #828282;
      font-weight: 500;
      font-family: "Arial", sans-serif;
      box-sizing: border-box;
      padding: 0 4px 0 4px;
      background-color: transparent;
    }
  }

  .table-container tbody {
    tr td {
      color: #3d3d3d;
      min-height: fit-content;
      font-size: 14px;
      font-weight: 400;
      font-family: "Arial", sans-serif;
      box-sizing: border-box;
      text-align: center;
      padding: 0 4px 0 4px;
    }

    .practice-list-row {
      border-bottom: 1px solid #e0e0e0;
    }

    .practice-name,
    .practice-total-score,
    .practice-average-score,
    .practice-actual-students,
    .practice-pass-students {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .practice-total-score,
    .practice-average-score {
      .score-text {
        display: block;
        width: 100%;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
    }

    .practice-name {
      span {
        display: block;
        max-width: 100%;
        height: fit-content;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
    }

    .operation button {
      border: none;
      background-color: transparent;
      margin: 2px;
      cursor: pointer;
    }

    .operation .details-btn,
    .operation .export-btn {
      color: #0052d9;
    }
  }

  .square-container {
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 1px solid #919191;
    border-radius: 3px;
    padding: 0 0 0 0;
    width: 16px;
    height: 16px;
  }

  .square-container:hover {
    background-color: #e0e0e0;
    border-color: #aaa;
  }

  .check-square {
    width: 11px;
    height: 11px;
    background-color: #165dff;
  }

  .square-container.checked .check-square {
    opacity: 1;
  }

  .pagination-container {
    position: absolute;
    right: 0;
    bottom: 35px;
    width: fit-content;
    justify-self: right;
    padding: 57px 0 0 0;
  }

  @media (max-width: 1400px) {
    .blue-dropdown-container,
    .learners-num,
    .classes-num,
    .course-tags {
      min-width: $content-width-state1;
      width: $content-width-state1;
    }

    .search-container {
      min-width: 273px;
      width: 273px;
    }
  }

  @media (max-width: 1200px) {
    .blue-dropdown-container,
    .learners-num,
    .classes-num,
    .course-tags {
      min-width: $content-width-state2;
      width: $content-width-state2;
    }

    .search-container {
      min-width: 273px;
      width: 273px;
    }
  }
</style>
