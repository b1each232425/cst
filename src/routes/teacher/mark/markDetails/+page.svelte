<script>
  import {goto} from "$app/navigation";

  import {page} from '$app/state';
  import {getExamDetails, getExamineeList} from "../api.js";
  import {onMount} from "svelte";
  import Dialog from "../Dialog.svelte";
  import BarChart from "$lib/component/charts/BarChart.svelte"
  import {countScoreRanges} from "$lib/component/charts/utils.js";
  import Pagination from "$lib/component/Pagination.svelte";
  // import * as echarts from "echarts";
  // import {onMount} from "svelte";

  // console.log('init')

  let ai_marked = ""

  onMount(async () => {
    try {
      await init()
    } catch (e) {
      console.error(e)
      showDialog('初始化页面数据失败，请重试或联系管理员')
    }

  })

  async function init() {
    try {
      // 响应式获取状态
      $: {
        if (page.status === 200) {  // 确保页面加载完成
          const receivedData = page.state
          // console.log('接收到的数据:', receivedData)
          session_info = {...session_info, ...receivedData}
          // console.log($state.snapshot(session_info))


          if (!receivedData) {
            throw new Error("页面信息初始化错误")
          }
        }
      }

      session_id = page.url.searchParams.get('session_id');
      ai_marked = page.url.searchParams.get('ai_marked')
      if (!session_id) {
        throw new Error("页面信息初始化错误")
      }

      let exam_details_resp = await getExamDetails(session_id)

      let examimee_list_resp = await getExamineeList(session_id)

      // console.log(examimee_list_resp)
      // console.log(exam_details_resp)
      student_list = setStudentList(examimee_list_resp.student_list, exam_details_resp.total_score)
      initChartData(exam_details_resp.total_score, examimee_list_resp.student_list)
      // console.log(student_list)
      total_student_list = student_list
      exam_info = setExamInfo(exam_details_resp)
      exam_info.passed_rate = (exam_details_resp.passed_count / exam_info.respondent_count * 100).toFixed(1) + "%"
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  function setExamInfo(exam_details) {
    return {
      ...exam_details,
      exam_location: exam_details.exam_location ? exam_details.exam_location : "无",
      course_name: exam_details.course_name ? exam_details.course_name : "无",
      respondent_count: session_info.respondent_count,
      status: statusToText[exam_details.status]
    }
  }

  function setStudentList(examimee_list, paper_total_score, info_mask = true) {
    let results = []
    let button_status = ["active", "deactive"]

    results = examimee_list.map(student => ({
      student_id: student.student_id,
      examinee_id: student.examinee_id,
      order_number: student.number,
      name: info_mask ? maskName(student.name) : student.name,
      id_type: "****",
      id_number: info_mask ? maskIdNumberFlexible(student.id_number) : student.id_number,
      exam_admission_number: info_mask ? maskIdNumberFlexible(student.exam_admission_number) : student.exam_admission_number,
      score: student.score,
      score_color: student.status === "02" ? "#888888" : score_color[student.score >= paper_total_score * 0.6 ? "00" : "02"],
      is_passed: student.score >= paper_total_score * 0.6,
      status: mark_state_to_text[student.status],
      status_color: status_color[student.status],
      button_status: [student.status === "10" ? "active" : "deactive", "deactive"]
    }))

    return results

  }

  // 姓名屏蔽函数 - 只显示第一个字，其余用*代替
  function maskName(name) {
    if (!name) return '';
    if (name.length === 1) return name;
    return name[0] + '*'.repeat(name.length - 1);
  }

  // 电话号码屏蔽函数 - 保留前3位和后4位，中间用*代替
  function maskPhone(phone) {
    if (!phone) return '';
    // 移除所有非数字字符
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 7) {
      // 如果号码长度小于等于7位，只保留前3位和后2位
      return digits.slice(0, 3) + '*'.repeat(digits.length - 5) + digits.slice(-2);
    }
    // 标准处理：保留前3位和后4位
    return digits.slice(0, 3) + '*'.repeat(digits.length - 7) + digits.slice(-4);
  }

  function maskIdNumberFlexible(id, showStart = 3, showEnd = 3) {
    if (!id) return '';
    const cleanId = id.replace(/\D/g, '');
    const length = cleanId.length;

    if (length <= showStart + showEnd) {
      // 如果总长度小于等于要显示的前后位数之和，只显示前一半和后一半
      const half = Math.ceil(length / 2);
      return cleanId.slice(0, half) + '*'.repeat(length - length) + cleanId.slice(-half);
    }

    return cleanId.slice(0, showStart) + '*'.repeat(length - showStart - showEnd) + cleanId.slice(-showEnd);
  }

  function examineeListFilterChangedHandler(type, value) {
    // 更新对应筛选条件的值
    if (type === "02") {
      examinee_list_filter.passed_state = value
    } else if (type === "04") {
      examinee_list_filter.mark_state = value
    }

    // 从总列表开始筛选
    student_list = total_student_list.filter(student => {
      // 检查通过状态条件（如果设置了）
      if (examinee_list_filter.passed_state !== undefined && examinee_list_filter.passed_state !== "0") {
        if (examinee_list_filter.passed_state === "1" && !student.is_passed) {
          return false; // 需要通过但未通过
        }
        if (examinee_list_filter.passed_state === "2" && student.is_passed) {
          return false; // 需要未通过但已通过
        }
      }

      // 检查评分状态条件（如果设置了）
      if (examinee_list_filter.mark_state !== undefined && examinee_list_filter.mark_state !== "0") {
        const expectedStatus = examinee_list_filter.mark_state === "1"
          ? mark_state_to_text["10"]
          : mark_state_to_text["02"]

        if (expectedStatus !== student.status) {
          return false; // 状态不匹配
        }
      }

      // 所有设置的条件都满足
      return true
    })
  }

  function gradeSortedHandler() {
    console.log('click')
    grade_sorted_state = (grade_sorted_state + 1) % 3
    SORT_ICON_ROUTE = SORT_ICON_ROUTE

    $: {
      passed_sorted_icon = SORT_ICON_ROUTE[grade_sorted_state]
    }

    console.log(grade_sorted_state)
    switch (grade_sorted_state) {
      case 0:
        student_list = total_student_list
        break;
      case 1:
        student_list = total_student_list.sort((a, b) => a.score - b.score)
        break;
      case 2:
        student_list = total_student_list.sort((a, b) => b.score - a.score)
        break;
    }

  }

  function showDialog(content) {
    dialog1.content = content
    dialog1.show = true
    dialog = dialog1
  }

  function initChartData(total_score, student_list) {
    // 筛选出已交卷的，去掉缺考的
    student_list = student_list.filter(student => student.status === "10")

    let {labels, counts } = countScoreRanges(total_score, student_list)
    console.log(labels, counts)
    xAxis_data = [...labels]
    series_data = [...counts]
    // console.log(labels, counts)
  }

  function onNextOrLastPage(is_next) {
    if (loading === true) {
      return;
    }
    if (is_next && search_params.page < total_page) {
      search_params.page += 1;
      searchExam();
    }
    if (!is_next && search_params.page > 1) {
      search_params.page -= 1;
      searchExam();
    }
  }

  function onPageChooseFunc(page) {
    if (loading === true) {
      return;
    }
    search_params.page = page;
    curr_page = page;
    searchExam();
  }

  let curr_page = 1
  let total_page = 1
  let row_count = 0
  let loading = false
  let search_params = {
    page: 1,
    page_size: 10,
    exam_type: "",
    status: "",
    start_time: "",
    end_time: "",
  }

  // 响应式获取状态
  // $effect(()=>{
  //   if ($page.status === 200) {  // 确保页面加载完成
  //     const receivedData = $page.state;
  //     console.log('接收到的数据:', receivedData);
  //
  //   }
  // })
  let dialog = $state({
    show: false,
    title: "提示",
    content: "数据获取错误，请联系管理员",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      // onClickNavigateBack()
    },
  })

  let xAxis_data = $state([])
  let series_data = $state([])

  //状态 00：未发布 01：待开始  02：进行中 04：已结束 06：已删除 08：批改中 10：已批改 12：已提交 14：待同步
  let statusToText = {
    "": "待批改",
    "00": "未发布",
    "01": "待开始", // 待开始
    "02": "进行中", // 进行中
    "04": "待批改",
    "08": "批改中",
    "10": "已提交",
    "12": "已提交",
    "14": "待同步"

    // "06": "已提交"
  }

  let session_id = 0
  let session_info = {}

  let exam_info = $state({
    session_id: "--",
    exam_name: "--",
    exam_paper_name: "--",
    exam_location: "--",
    course_name: "--",
    student_count: "--",
    respondent_count: "--",
    passed_count: "--",
    passed_rate: "--",
    status: "--"
  })

  let total_student_list = []
  let student_list = $state([])

  function handleMark(examinee_id) {
    console.log(examinee_id)

    if (!ai_marked) {
      ai_marked = ""
    }

    goto(`/teacher/mark/mark?session_id=${session_info.id}&examinee_id=${examinee_id}&ai_marked=${ai_marked}`, {
      state: {...session_info, last_page: "markDetails", last_page_state: {...session_info}}
    })
  }

  //状态 00：正常考 02：缺考 04：补考 06：作弊 08：已删除 10：已交卷 12：待同步 14：考试异常
  let mark_state_to_text = {
    "00": "正常考",
    "02": "缺考",
    "04": "补考",
    "06": "作弊",
    "08": "已删除",
    "10": "已交卷",
    "12": "待同步",
    "14": "考试异常"
  }

  let status_color = {
    "": "#ff0000",
    "00": "#888888",
    "01": "#888888",
    "02": "#888888",
    "04": "#888888",
    "06": "#888888", // 已删除
    "08": "#888888",
    "10": "#333333",
    "12": "#888888",
    "14": "#ffad00"
  }

  let score_color = {
    "00": "",
    "02": "#ff0000",
    "04": "#777777"
  }

  let grade_sorted_state = 0

  let passed_sorted_icon = "/mark/i-sort.svg"

  let SORT_ICON_ROUTE = [
    "/mark/i-sort.svg",
    "/mark/i-sort-up.svg",
    "/mark/i-sort-down.svg",
  ]

  const icons = {
    sort: SORT_ICON_ROUTE[0],
    sort_up: SORT_ICON_ROUTE[1],
    sort_down: SORT_ICON_ROUTE[2],
    bar_chart_example: "/mark/bar-chart.png"
  }

  // let examinee_list_filter = $state({
  //   passed_state: "",
  //   mark_state: ""
  // })

  let examinee_list_filter = $state({
    passed_state: "0",
    mark_state: "0"
  })
</script>

<div class="page-container">
  <div class="page-body">
    <div class="exam-info-container">
      <div class="exam-details-container">
        <div class="exam-details-title">
          <p>{exam_info.exam_name}</p>
        </div>
        <div class="exam-details-content">
          <div class="exam-details-content-row">
            <div class="exam-details-content-item">
              <div class="exam-details-content-item-title">
                <p>试卷名称</p>
              </div>
              <div class="exam-details-content-item-content">
                <p>{exam_info.exam_paper_name}</p>
              </div>
            </div>
            <div class="exam-details-content-item">
              <div class="exam-details-content-item-title">
                <p>考生人数</p>
              </div>
              <div class="exam-details-content-item-content" style="width: 100px">
                <p>{exam_info.student_count}</p>
              </div>
            </div>
          </div>
          <div class="exam-details-content-row">
            <!--            <div class="exam-details-content-item">-->
            <!--              <div class="exam-details-content-item-title">-->
            <!--                <p>考点</p>-->
            <!--              </div>-->
            <!--              <div class="exam-details-content-item-content">-->
            <!--                <p>{exam_info.exam_location}</p>-->
            <!--              </div>-->
            <!--            </div>-->
            <div class="exam-details-content-item">
              <div class="exam-details-content-item-title">
                <p>隶属课程</p>
              </div>
              <div class="exam-details-content-item-content">
                <p>{exam_info.course_name}</p>
              </div>
            </div>
            <div class="exam-details-content-item">
              <div class="exam-details-content-item-title">
                <p>作答人数</p>
              </div>
              <div class="exam-details-content-item-content" style="width: 100px">
                <p>{exam_info.respondent_count}</p>
              </div>
            </div>
          </div>
          <div class="exam-details-content-row">
            <!--            <div class="exam-details-content-item">-->
            <!--              <div class="exam-details-content-item-title">-->
            <!--                <p>隶属课程</p>-->
            <!--              </div>-->
            <!--              <div class="exam-details-content-item-content">-->
            <!--                <p>{exam_info.course_name}</p>-->
            <!--              </div>-->
            <!--            </div>-->
            <div class="exam-details-content-item">
              <div class="exam-details-content-item-title">
                <p>批改状态</p>
              </div>
              <div class="exam-details-content-item-content">
                <p>{exam_info.status}</p>
              </div>
            </div>
            <div class="exam-details-content-item">
              <div class="exam-details-content-item-title">
                <p>通过人数</p>
              </div>
              <div class="exam-details-content-item-content" style="width: 100px">
                <p>{exam_info.passed_count}</p>
              </div>
            </div>
          </div>
          <div class="exam-details-content-row">
            <!--            <div class="exam-details-content-item">-->
            <!--              <div class="exam-details-content-item-title">-->
            <!--                <p>批改状态</p>-->
            <!--              </div>-->
            <!--              <div class="exam-details-content-item-content">-->
            <!--                <p>{exam_info.status}</p>-->
            <!--              </div>-->
            <!--            </div>-->
            <div class="exam-details-content-item">
              <div class="exam-details-content-item-title">
                <p></p>
              </div>
              <div class="exam-details-content-item-content">
                <p></p>
              </div>
            </div>
            <div class="exam-details-content-item">
              <div class="exam-details-content-item-title">
                <p>通过率</p>
              </div>
              <div class="exam-details-content-item-content" style="width: 100px">
                <p>{exam_info.passed_rate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="exam-bar-chart-container">
        <BarChart bind:xAxis_data={xAxis_data} bind:series_data={series_data}/>
<!--        <img-->
<!--          src={icons.bar_chart_example}-->
<!--          alt="柱状图"-->
<!--          style="width: auto; height: 90%;"-->
<!--        />-->
      </div>
    </div>
    <div class="examinee-list-container">
      <div class="table-container">
        <div class="table-search-container">
          <!--          <button class="mark-button">批改试卷</button>-->
          <div class="filter-container">
            <div class="filter-item">
              <div class="filter-item-title">
                <p>是否通过</p>
              </div>
              <div class="filter-item-content">
                <select bind:value={examinee_list_filter.passed_state}
                        on:change={(e)=>{examineeListFilterChangedHandler("02", e.target.value)}}>
                  <option value="0">全部</option>
                  <option value="2">未通过</option>
                  <option value="1">通过</option>
                </select>
              </div>
            </div>
            <div class="filter-item">
              <div class="filter-item-title">
                <p>批改状态</p>
              </div>
              <div class="filter-item-content">
                <select bind:value={examinee_list_filter.mark_state}
                        on:change={(e)=>{examineeListFilterChangedHandler("04", e.target.value)}}>
                  <option value="0">全部</option>
                  <option value="1">已交卷</option>
                  <option value="2">缺考</option>
                </select>
              </div>
            </div>
            <div class="filter-item">
              <div class="filter-item-title">
                <p>搜索考生</p>
              </div>
              <input type="text" placeholder="请输入考生序号">
            </div>
          </div>
        </div>
        <div class="table-body">
          <table>
            <thead>
            <tr>
              <!--              <th style="width: 120px">-->
              <!--                <div style="display: flex;justify-content: center;">-->
              <!--                  <SquareCheckBox></SquareCheckBox>-->
              <!--                </div>-->
              <!--              </th>-->
              <!--              <th style="width: 120px">[]</th>-->
              <!--              <th style="width: 120px">序号</th>-->
              <!--              <th style="width: 140px">姓名</th>-->
              <!--              <th style="width: 140px">证件类型</th>-->
              <!--              <th style="width: 200px">证件号码</th>-->
              <!--              <th style="width: 200px">准考证号</th>-->
              <!--              <th style="width: 120px">成绩</th>-->
              <!--              <th style="width: 120px">是否通过</th>-->
              <!--              <th style="width: 120px">批改状态</th>-->
              <!--              <th style="width: 200px">操作</th>-->
              <th style="width: 8%">
                <div style="display: flex;justify-content: center;">
                  <!--                  <SquareCheckBox></SquareCheckBox>-->
                </div>
              </th>
              <th style="width: 8%">序号</th>
              <th style="width: 10%">姓名</th>
              <th style="width: 10%">证件类型</th>
              <th style="width: 14%">证件号码</th>
              <th style="width: 14%">准考证号</th>
              <th style="width: 8%" on:click={gradeSortedHandler}>
                <div class="th-item">
                  成绩
                  <div class="sorted-icon">
                    <img
                      src={passed_sorted_icon}
                      alt="排序"
                      style="width: auto; height: 14px;"
                    />
                  </div>
                </div>

              </th>
              <th style="width: 8%">是否通过</th>
              <th style="width: 8%">批改状态</th>
              <th style="width: 12%">操作</th>
            </tr>
            </thead>
            <tbody>
            {#each student_list as student}
              <tr>
                <td>
                  <div style="display: flex;justify-content: center;">
                    <!--                    <SquareCheckBox></SquareCheckBox>-->
                  </div>
                </td>
                <td>
                  <p>{student.order_number}</p>
                </td>
                <td>
                  <p>{student.name}</p>
                </td>
                <td>
                  <p>{student.id_type}</p>
                </td>
                <td>
                  <p>{student.id_number}</p>
                </td>
                <td>
                  <p>{student.exam_admission_number}</p>
                </td>
                <td>
                  <p style="color: {student.score_color}">{student.score}</p>
                </td>
                <td>
                  <p
                    style="color: {student.is_passed ? '#00aa00' : '#ff0000'}">{student.is_passed ? '通过' : '不通过'}</p>
                </td>
                <td>
                  <p style="color: {student.status_color}">{student.status}</p>
                </td>
                <td>
                  <button class="operation-btn-{student.button_status[0]}"
                          on:click="{() => handleMark(student.examinee_id)}">
                    批改
                  </button>
                  <button class="operation-btn-{student.button_status[1]}">查看</button>
                </td>
              </tr>

            {/each}
            </tbody>
          </table>
        </div>
      </div>
      <div class="pagination-container">
        <Pagination
          onPageChangeFunc={onNextOrLastPage}
          {onPageChooseFunc}
          current_page_num={curr_page}
          total_page_num={total_page}
          selected={10}
          total_data_num={row_count}
          data_num_per_page_options={[
                    { value: 10, label: "10条/页" },
                    { value: 20, label: "20条/页" },
                ]}
          expand_direction="up"
        ></Pagination>
      </div>
    </div>
  </div>
</div>

<Dialog
  bind:isShow={dialog.show}
  title={dialog.title}
  content={dialog.content}
  confirmText={dialog.confirmText}
  cancelText={dialog.cancelText}
  confirmTextBackgroundColor={dialog.confirmTextBackgroundColor}
  onConfirm={dialog.onConfirm}
/>

<style scoped>
    button {
        /* 清除默认边框 */
        border: 0;
        outline: none;
        /*清除默认背景 */
        background-color: transparent;
    }

    .page-container {
        display: flex;
        /*gap: 2rem;*/
        /*margin-top: 5px;*/
        /*width: calc(100vw - 235px);*/
        width: 100%;
        /*height: calc(100vh - 65px - 5px);*/
        height: 100%;
        /*justify-content: center;*/

    }

    .page-body {
        display: flex;
        flex-direction: column;
        /*flex-wrap: wrap;*/
        gap: 10px;
        width: 100%;
        height: 100%;
        overflow-x: scroll;
        background-color: #f8f8f8;
        border-top: 1px solid #e0e0e0;
    }

    p {
        font-size: 14px;
        margin-block-start: 0;
        margin-block-end: 0;
        margin-inline-start: 0;
        margin-inline-end: 0;
        color: #333333;
    }

    .exam-info-container {
        display: flex;
        gap: 10px;
        width: calc(100% - 30px);
        margin-left: 15px;
        margin-top: 15px;
    }

    .exam-details-container {
        display: flex;
        flex-direction: column;
        /*width: 982px;*/
        width: 51.14vw;
        min-width: 600px;
        height: 336px;
        border: 1px solid #d7d7d7;
        border-radius: 5px;
        background-color: #fff;
    }

    .exam-details-title {
        height: 50px;
        margin-top: 15px;
        margin-left: 35px;
    }

    .exam-details-title p {
        font-size: 20px;
        height: 50px;
        line-height: 50px;
    }

    .exam-details-content {
        display: flex;
        flex-direction: column;
        width: calc(100% - 20px);
        margin-left: 20px;
        margin-top: 40px;
        gap: 24px;
    }

    .exam-details-content-row {
        display: flex;
        width: 100%;
    }


    .exam-details-content-item {
        display: flex;
        width: 50%;
    }

    .exam-details-content-item-title {
        width: 100px;
        /*width: 10.18%;*/
        text-align: right;
        color: #999999;
        line-height: 20px;
    }

    .exam-details-content-item-title p {
        color: #999999;
    }

    .exam-details-content-item-content {
        /*width: 400px;*/
        /*width: 42%;*/
        margin-left: 30px;
    }

    .exam-bar-chart-container {
        /*width: 585px;*/
        /*padding: 10px;*/
        min-width: 600px;
        flex: 1;
        height: 336px;
        border: 1px solid #d7d7d7;
        background-color: #fff;
        border-radius: 5px;
        display: flex;
        justify-content: center;
        /*margin-top: 15px;*/
    }

    .examinee-list-container {
        /*width: 1579px;*/
        width: calc(100% - 30px);
        min-width: 1210px;
        height: calc(100% - 15px - 338px - 10px);
        min-height: 400px;
        border: 1px solid #d7d7d7;
        background-color: #fff;
        margin-left: 15px;
        border-radius: 5px;
    }

    .pagination-container {
        display: flex;
        justify-content: right;
        margin-top: 10px;
    }


    .table-container {
        width: 77.6vw;
        min-width: 1010px;
        margin: 0 auto;
        height: calc(100% - 40px);
    }

    .table-search-container {
        height: 36px;
        width: 100%;
        margin-top: 40px;
        display: flex;
        position: relative;
        align-items: center;
    }

    .filter-container {
        position: absolute;
        right: 0;
        display: flex;
        gap: 24px;
    }

    .filter-item {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .filter-item input {
        width: 300px;
        height: 32px;
        border: 1px solid #dddddd;
        border-radius: 3px;
        padding-left: 5px;
    }

    .filter-item input:focus {
        outline: none;
        border: 1px solid #a6b0ff;
    }

    .filter-item-title {
        height: 25px;
        line-height: 25px;
    }

    .filter-item-content {
        width: 108px;
    }

    .filter-item-content select {
        width: 98px;
        height: 32px;
        background-color: #e7e7e7;
        border: 0;
        border-radius: 3px;
        padding-left: 10px;
    }

    .filter-item-content select:focus {
        outline: none;
    }


    .table-search-container .mark-button {
        height: 36px;
        width: 120px;
        padding: 2px 2px 2px 2px;
        border-radius: 3px;
        border: 1px solid #c2c6ca;
        background-color: #f0f0f0;
        box-sizing: border-box;
    }

    .table-body {
        margin-top: 15px;
        width: 100%;
        height: calc(100% - 40px - 15px - 10px);
        min-height: 300px;
        overflow-y: scroll;
        overflow-x: hidden;
    }

    thead tr th {
        background-color: #fff;
        position: sticky;
        top: 0;
    }

    .table-body table {
        width: 100%;
    }

    th {
        height: 45px;
        background-color: rgba(255, 255, 255, 0);
        box-sizing: border-box;
        font-family: 'Arial', sans-serif;
        color: rgba(0, 0, 0, 0.3);
        text-align: center;
        line-height: 45px;
        font-weight: normal;
        font-size: 14px;
        border-bottom: 1px solid #eeeeee;
        padding: 0;
        position: relative;
    }

    .th-item {
        height: 45px;
        background-color: rgba(255, 255, 255, 0);
        box-sizing: border-box;
        font-family: 'Arial', sans-serif;
        color: rgba(0, 0, 0, 0.3);
        text-align: center;
        line-height: 45px;
        font-weight: normal;
        font-size: 14px;
        /*border-bottom: 1px solid #eeeeee;*/
        padding: 0;
        display: flex;
        justify-content: center;
    }

    .sorted-icon {

        display: flex;
        align-items: center;
        justify-content: center;
        /*height: 45px;*/
        /*width: 100%;*/
    }

    .sort-icon img {
        height: 14px;
        width: 14px;
    }

    table {
        border-collapse: collapse;
    }

    table tr {
        border-bottom: 1px solid #eeeeee;
    }


    td {
        height: 50px;
        text-align: center;
        padding: 0;
        border-spacing: 0;
    }

    .operation-btn-active {
        color: #0052d9;
    }

    .operation-btn-active:hover {
        color: #0036ff;
        cursor: pointer;
        /*text-shadow: 0 0 1px #819bce;*/
        font-weight: bold;
    }

    .operation-btn-deactive {
        color: #b2b2b2;
    }

    .operation-btn-deactive:hover {
        cursor: not-allowed;
    }
</style>