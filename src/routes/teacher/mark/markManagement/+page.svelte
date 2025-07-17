<script>
  import {goto, pushState} from "$app/navigation";
  import {getExamList, startAIMark, submitMarkingResult, updateExamSessionStatus, updateMarkInfoState} from "../api.js";
  import {onMount} from "svelte";
  import Dialog from "../Dialog.svelte";
  import Pagination from "$lib/component/Pagination.svelte";
  import {exam_list_flash_tag} from "$lib/stores/mark.js";
  import SearchInput from "$lib/component/SearchInput.svelte";
  import Title from "$lib/component/Title.svelte";
  import BatchImportQuestionPanel from "$lib/component/BatchImport/BatchImportQuestionPanel.svelte";
  import OperationLogPanel from "$lib/component/OperationLogPanel.svelte";
  import AwesomeLogPanel from "$lib/component/AwesomeLogPanel.svelte";

  let exam_list = []

  exam_list_flash_tag.subscribe(async val => {
    try {
      console.log('触发订阅事件')
      if (val === true) {
        console.log('刷新exam_list')
        await searchExam()
        exam_list_flash_tag.set(false)
      }
    } catch (e) {
      console.error(e)
      showTips('数据获取错误，请联系管理员')
    }

  })


  let total_exam_list = []

  onMount(async () => {
    try {
      let resp = await getExamList(new URLSearchParams())
      // console.log(resp)
      row_count = resp.row_count
      total_page = Math.ceil(row_count / search_params.page_size)
      if (!resp.exam_list) {
        console.log('暂无需批改的考试')
        exam_list = []
        return
      }
      exam_list = initExamList(resp.exam_list, resp.level)
      total_exam_list.push(...exam_list)
      console.log(exam_list)
    } catch (e) {
      console.error(e)
      showTips('数据获取错误，请联系管理员')
    }
  })

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

  async function searchExam() {
    try {
      console.log('11111')
      // 构建查询参数
      let query_params = new URLSearchParams()

      // 添加基础参数
      query_params.append("page", search_params.page.toString())
      query_params.append("page_size", search_params.page_size.toString())

      // 添加可选参数
      if (search_params.name) {
        query_params.append("exam_name", search_params.name)
      }
      if (search_params.status) {
        query_params.append("status", search_params.status);
      }

      if (search_params.startTime) {
        const start_time = new Date(search_params.startTime);
        query_params.append("startTime", start_time.toISOString());
      }
      if (search_params.endTime) {
        const endTime = new Date(search_params.endTime);
        query_params.append("endTime", endTime.toISOString());
      }

      console.log(query_params)

      let resp = await getExamList(query_params)
      if (!resp.exam_list) {
        console.log('暂无需批改的考试')
        exam_list = []
        return
      }

      console.log(resp)

      exam_list = initExamList(resp.exam_list, resp.level)
      total_exam_list.push(...exam_list)

    } catch (e) {
      console.error(e)
      showTips('数据获取错误，请联系管理员')
    }

  }

  function showTips(content) {
    dialog_content1.content = content
    dialog_content1.show = true
    dialog_content = dialog_content1
  }

  let name_search_timer = null
  /**
   * @param {string} value
   * 搜索时执行的函数
   */
  function onSearchFunc(value) {
    console.log('onSearch name: ', value)
    search_params.name = value

    //防抖逻辑
    if (name_search_timer) {
      clearTimeout(name_search_timer)
    }
    name_search_timer = setTimeout(() => {
      searchExam()
      name_search_timer = null
    }, 600)
  }

  let dialog_content = {
    show: false,
    title: "提示",
    content: "数据获取错误，请联系管理员",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      dialog_content.show = false
      dialog_content = dialog_content
      // onClickNavigateBack()
    },
    onCancel: () => {
      dialog_content.show = false
      dialog_content = dialog_content
    }
  }

  let dialog_content1 = {
    show: true,
    title: "提示",
    content: "数据获取错误，请联系管理员",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      dialog_content.show = false
      dialog_content = dialog_content
      // onClickNavigateBack()
    },
    onCancel: () => {
      dialog_content.show = false
      dialog_content = dialog_content
    }
  }

  let dialog_content2 = {
    show: true,
    title: "提示",
    content: "AI批改中，请等待",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      dialog_content = dialog_content2
      dialog_content.show = false
      // onClickNavigateBack()
    },
    onCancel: () => {
      dialog_content = dialog_content2
      dialog_content.show = false
    }
  }

  let dialog_content3 = {
    show: true,
    title: "提示",
    content: "AI批改完成",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      dialog_content = dialog_content3
      dialog_content.show = false
      // onClickNavigateBack()
    },
    onCancel: () => {
      dialog_content = dialog_content3
      dialog_content.show = false
    }
  }

  let dialog_content4 = {
    show: true,
    title: "提示",
    content: "AI批改失败，请重试",
    confirmText: "确定",
    cancelText: "取消",
    confirmTextBackgroundColor: "#E34D59",
    onConfirm: () => {
      dialog_content = dialog_content4
      dialog_content.show = false
      // onClickNavigateBack()
    },
    onCancel: () => {
      dialog_content = dialog_content4
      dialog_content.show = false
    }
  }


  let examTypeToText = {
    "": "未知",
    "00": "平时考试",
    "02": "期末成绩考试",
    "04": "资格证考试",
  }

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

  let statusToColor = {
    "": "#ff0000",
    "00": "#888888",
    "01": "#888888",
    "02": "#888888",
    "04": "#ff0000",
    "06": "#888888", // 已删除
    "08": "#ffad00",
    "10": "#888888",
    "12": "#888888"
  }

  // 批改配置，包括批卷模式 00：不需要手动批改  02：全卷多评 04：试卷分配 06：题组专评 08：题目分配 10：单人批改
  let markModeToText = {
    "00": "无需批改",
    "02": "全卷多评",
    "04": "试卷分配",
    "06": "题组专评",
    "08": "题目分配",
    "10": "单人批改",
  }

  let markButtonText = {
    "00": "进入批改",
    "02": "启用AI批改",
    "04": "查看AI批改结果"
  }

  let statusToButtonState = {
    "": ['deactive', 'active', 'deactive'],
    "00": ['deactive', 'deactive', 'deactive'],
    "01": ['deactive', 'deactive', 'deactive'],
    "04": ['active', 'active', 'active'],
    "02": ['deactive', 'active', 'deactive'],
    "06": ['deactive', 'deactive', 'deactive'],
    "08": ['active', 'active', 'active'],
    "10": ['deactive', 'active', 'deactive'],
    "12": ['deactive', 'active', 'deactive'],
    "14":['deactive', 'active', 'deactive']
  }

  function initExamList(exam_list, level = "02") {
    if (!exam_list || exam_list.length === 0) {
      console.error('exam_list is empty')
      return []
    }

    return exam_list?.map(exam => {
      return {
        ...exam,
        type: examTypeToText[exam.type],
        class: !exam.class ? "--" : exam.class,
        exam_sessions: exam.exam_sessions?.map(session => {
          // console.log(session.status, session.id, statusToButtonState[session.status] )
          let button_state = statusToButtonState[session.status]

          if (!button_state) {
            button_state = statusToButtonState[""]
            console.error("未知考试场次状态")
            throw new Error("未知考试场次状态")
          }


          if (session.mark_method !== "02" && level === "02" && session.mark_mode !== "10") {
            button_state[2] = "deactive"
            button_state[1] = "deactive"
          }

          if (session.respondent_count === 0) {
            button_state = statusToButtonState["00"]
          }

          let mark_button_text

          if (session.mark_status === '02' && session.mark_method === '02') {
            mark_button_text = markButtonText['04']
          } else {
            mark_button_text = markButtonText[session.mark_method]
          }
          console.log(session.mark_status === '02' && session.mark_method === '02')

          return {
            ...session,
            session_type: "试卷" + session.name,
            exam_time: formatExamTime(session.start_time, session.end_time),
            button_state: button_state,
            status_color: statusToColor[session.status],
            status: statusToText[session.status] || "--",
            mark_button_text: mark_button_text,
            mark_mode_text: (session.mark_method === '04' || session.mark_method === '02') ? 'AI批改' : markModeToText[session.mark_mode],
          }
        })
      }
    })
  }

  // function updateExamList

  function formatExamTime(startTimeStamp, endTimeStamp) {

    // 若传入seconds的转为mill
    if (typeof startTimeStamp === 'number' && startTimeStamp < 1000000000000) {
      startTimeStamp *= 1000;
      endTimeStamp *= 1000;
    }

    const startDate = new Date(startTimeStamp);
    const endDate = new Date(endTimeStamp);

    const pad = (num) => String(num).padStart(2, '0');

    const year = startDate.getFullYear();
    const month = pad(startDate.getMonth() + 1);
    const day = pad(startDate.getDate());
    const startHours = pad(startDate.getHours());
    const startMinutes = pad(startDate.getMinutes());
    const endHours = pad(endDate.getHours());
    const endMinutes = pad(endDate.getMinutes());

    return `${year}-${month}-${day} ${startHours}:${startMinutes}~${endHours}:${endMinutes}`;
  }

  function onClickGotoMarking(exam_id, session_id, mark_mode) {
    let i_ = -1
    let j_ = -1
    for(let i = 0; i < exam_list.length; i++) {
      for(let j = 0; j < exam_list[i].exam_sessions.length; j++) {
        if (exam_list[i].exam_sessions[j].id === session_id) {
          i_ = i
          j_ = j
          break
        }
      }
    }

    if (i_ === -1 || j_ === -1) {
      console.error('未找到考试场次')
      showTips("数据错误，请重试")
      return
    }

    let exam_session_data = exam_list[i_].exam_sessions[j_]

    // let sessions = exam_list?.find(exam => exam.id === exam_id)
    // let exam_session_data = sessions.exam_sessions?.find(session => session.id === session_id)

    if (exam_session_data.mark_status === '02' && exam_session_data.mark_method === '02') {
      goto(`/teacher/mark/mark?session_id=${session_id}&ai_marked=${1}`, {state: exam_session_data})
      return
    }

    updateExamSessionState(exam_id, session_id, "08")
    updateExamSessionStatus(session_id, "08")



    if (exam_session_data.mark_method === '02') {
      dialog_content = dialog_content2
      dialog_content.show = true

      exam_list[i_].exam_sessions[j_].button_state[0] = "deactive"
      exam_list = exam_list

      startAIMark(exam_session_data.id)
        .then((r) => {
          console.log(r)
          updateMarkInfoState(exam_session_data.id)
            .then((r) => {
              console.log('ai批改完成')
              exam_list[i_].exam_sessions[j_].mark_button_text = markButtonText['04']
              exam_list[i_].exam_sessions[j_].button_state[0] = "active"
              exam_list[i_].exam_sessions[j_].mark_status = '02'
              exam_list = exam_list

              // sessions.exam_sessions.forEach(session => {
              //   if (session.id === session_id) {
              //     session.mark_button_text = markButtonText['04']
              //     exam_list = exam_list
              //   }
              // })
              // dialog_content = dialog_content3
              // goto(`/teacher/mark/mark?session_id=${session_id}&ai_marked=${1}`, {state: exam_session_data})
            })
            .catch((e) => {
              console.error(e)
              dialog_content = dialog_content4
              updateExamSessionState(exam_id, session_id, "04")
            })

          // dialog_content = dialog_content3
          // goto(`/teacher/mark/mark?session_id=${session_id}`, {state: exam_session_data})

        })
        .catch((e) => {
          console.error(e)
          dialog_content = dialog_content4
          updateExamSessionState(exam_id, session_id, "04")
        })

      return
    }
    let pageUrl = mark_mode === '10' ? 'mark' : 'multiMark'

    console.log(exam_session_data)
    goto(`/teacher/mark/${pageUrl}?session_id=${session_id}`, {state: exam_session_data})
  }

  function onClickGotoDetail(exam_id, session_id) {
    let sessions = exam_list.find(exam => exam.id === exam_id)
    let exam_session_data = sessions.exam_sessions?.find(session => session.id === session_id)
    console.log(exam_session_data)

    if (exam_session_data.mark_status === '02' && exam_session_data.mark_method === '02') {
      goto(`/teacher/mark/markDetails?session_id=${session_id}&ai_marked=${1}`, {state: exam_session_data})
      return
    }

    goto(`/teacher/mark/markDetails?session_id=${session_id}`, {
      state: exam_session_data
    })

  }

  function updateExamSessionState(exam_id, session_id, status = "") {
    // 找到对应的 exam 和 session，并替换整个 session 对象
    const newExamList = exam_list.map(exam => {
      if (exam.id === exam_id) {
        // 找到对应的 session，并替换它
        const newExamSessions = exam.exam_sessions.map(session => {
          if (session.id === session_id) {
            // 创建一个新的 session 对象（而不是直接修改原对象）
            return {
              ...session,
              button_state: statusToButtonState[status],
              status_color: statusToColor[status],
              status: statusToText[status],
            };
          }
          return session; // 其他 session 保持不变
        });

        // 返回一个新的 exam 对象（替换 exam_sessions）
        return {
          ...exam,
          exam_sessions: newExamSessions,
        };
      }
      return exam; // 其他 exam 保持不变
    });

    // 最后，用新的 exam_list 替换原来的 exam_list（触发响应式更新）
    exam_list = newExamList;
  }

  function onClickSubmitResult(exam_id, session_id) {
    submitMarkingResult(session_id)
      .then(() => {
        showTips("提交成功")

        updateExamSessionState(exam_id, session_id, "12")

      })
      .catch((e) => {
        console.error(e)
        showTips("提交失败，请稍后重试")
      })

  }

  //---------------------------------------操作日志面板--------------------------------------
  /**
   * @description 显示题库操作日志
   * @param {number} session_id
   * @returns {Promise<void>}
   */
  async function fetchMarkLogs(session_id) {
    let res = await fetch(`/api/operation_logs/16/${session_id}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      const responseMgs = res.text();
      console.error("获取操作日志失败", responseMgs);
      actionToast.show("error", "获取操作日志失败");
      return;
    }
    const result = await res.json();
    if (result.status !== 0) {
      console.error("获取操作日志失败", result.msg);
      actionToast.show("error", "获取操作日志失败");
      return;
    }
    let logs = result.data;
    operationLogPanel.showLogPanel(logs);
  }

  /**
   * @description: 显示操作日志面板
   */
  async function showMarkOperationLogs(session_id) {
    try {

      const fetchOperationLogs = async (page, page_size) => {
        try {
          const res = await fetch(`/api/operation_logs/16/${session_id}?page=${page}&page_size=${page_size}`, {
            method: "GET",
            credentials: "include",
          })

          if (!res.ok) {
            console.error("获取操作日志失败", await res.text())
            throw new Error("网络请求失败")
          }

          const result = await res.json()
          if (result.status !== 0) {
            console.error("获取操作日志失败", result.message || "未知错误")
            throw new Error(result.message || "获取数据失败")
          }

          console.log(session_id)
          console.log("获取操作日志成功", result)
          return {
            data: result.data || [],
            total: result.rowCount || 0
          }

        } catch (error) {
          console.error("获取操作日志失败:", error)
          // actionToast.show("error", `获取操作日志失败: ${error.message}`);
          throw error
        }

      }

      await operationLogPanel.showLogPanelWithPagination(fetchOperationLogs)
    } catch (error) {
      console.error("显示操作日志失败:", error);
    }
  }

  /**
   * @description 获取并显示用户管理操作日志
   * @param {number} page 页码
   * @param {number} page_size 每页数量
   */
  /**
   * @description: 获取操作日志数据的函数
   * @param {number} page - 页码
   * @param {number} page_size - 每页数量
   * @returns {Promise<Object>} 返回包含日志数据和总数的对象
   */
  async function fetchOperationLogs(page = 1, page_size = 10) {
    try {
      // const res = await fetch(`/api/user-mgt/operation-log?page=${page}&page_size=${page_size}`, {
      //   method: "GET",
      //   credentials: "include",
      // });

      let res = await fetch(`/api/operation_logs/16/${session_id}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("获取操作日志失败", await res.text())
        actionToast.show("error", "获取操作日志失败")
        throw new Error("网络请求失败")
      }

      const result = await res.json();
      if (result.status !== 0) {
        console.error("获取操作日志失败", result.message || "未知错误")
        actionToast.show("error", "获取操作日志失败")
        throw new Error(result.message || "获取数据失败")
      }

      console.log("获取操作日志成功", result)

      return {
        data: result.data || [],
        total: result.rowCount || 0
      }
    } catch (error) {
      console.error("获取操作日志失败:", error);
      actionToast.show("error", `获取操作日志失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * @type {OperationLogPanel}
   */
  let operationLogPanel

  let batchImportPanel

</script>

<div class="page-container">
  <div class="page-body">
<!--    <div class="page-title">-->
<!--      <div class="page-title-text">-->
<!--        <p>考试列表</p>-->
<!--      </div>-->
<!--    </div>-->
    <Title title="考试列表" />


    <div class="table-container">
      <div class="table-search-container">
        <div class="filter-container">
          <div class="filter-item">
            <div class="filter-item-title">
              <p>考试类型</p>
            </div>
            <div class="filter-item-content">
              <select>
                <option value="">全部</option>
                <option value="">通过</option>
              </select>
            </div>
          </div>
          <div class="filter-item">
            <div class="filter-item-title">
              <p>批改状态</p>
            </div>
            <div class="filter-item-content">
              <select>
                <option value="">全部</option>
                <option value="">通过</option>
              </select>
            </div>
          </div>
          <div class="filter-item">
            <SearchInput
              place_holder={"请输入考试名称"}
              purpose_text={"搜索考试"}
              --search_input_container_width="280px"
              {onSearchFunc}
            />


<!--            <div class="filter-item-title">-->
<!--              <p>搜索考试</p>-->
<!--            </div>-->
<!--            <input type="text" placeholder="请输入考试名称/班级名称">-->
          </div>
        </div>
      </div>
      <div class="table-body">
        <table>
          <thead>
          <tr>
            <th style="width: 20%">考试名称</th>
            <th style="width: 9.33%">考试类型</th>
            <th style="width: 9.33%">考试班级</th>
            <th style="width: 6%">考试场次</th>
            <th style="width: 13.33%">考试时间</th>
            <th style="width: 6%">作答人数</th>
            <th style="width: 8%">批阅方式</th>
            <th style="width: 6%">待批改数</th>
            <th style="width: 8%">批改状态</th>
            <th style="width: 13.33%">操作</th>
          </tr>
          </thead>
          <tbody>
          {#each exam_list as exam}
            <tr>
              <td><p>{exam.name}</p></td>
              <td><p>{exam.type}</p></td>
              <td><p>{exam.class}</p></td>

              <td>
                <div class="table-row-container">
                  {#each exam.exam_sessions as session}
                    <p class="table-sub-row">{session.session_type}</p>
                  {/each}
                </div>

              </td>
              <td>
                <div class="table-row-container">
                  {#each exam.exam_sessions as session}
                    <p class="table-sub-row">{session.exam_time}</p>
                  {/each}
                </div>
              </td>
              <td>
                <div class="table-row-container">
                  {#each exam.exam_sessions as session}
                    <p class="table-sub-row">{session.respondent_count}</p>
                  {/each}
                </div>
              </td>
              <td>
                <div class="table-row-container">
                  {#each exam.exam_sessions as session}
                    <p class="table-sub-row">{session.mark_mode_text}</p>
                  {/each}
                </div>
              </td>
              <td>
                <div class="table-row-container">
                  {#each exam.exam_sessions as session}
                    <p class="table-sub-row">{session.unmarked_student_count}</p>
                  {/each}
                </div>
              </td>
              <td>
                <div class="table-row-container">
                  {#each exam.exam_sessions as session}
                    <p class="table-sub-row" style="color: {session.status_color}">{session.status}</p>
                  {/each}
                </div>
              </td>
              <td style="gap:25px">
                <div class="table-row-container">
                  {#each exam.exam_sessions as session}
                    <div class="table-sub-row">
                      <button class="operation-btn-{session.button_state[0]}"
                              on:click={()=>{if(session.button_state[0] === 'deactive') {return} onClickGotoMarking(exam.id, session.id, session.mark_mode)}}>{session.mark_button_text}
                      </button>
<!--                      <button class="operation-btn-{session.button_state[0]}"-->
<!--                              on:click={()=>{if(session.button_state[0] === 'deactive1') {return} onClickGotoMarking(exam.id, session.id, session.mark_mode)}}>{session.mark_button_text}-->
<!--                      </button>-->
                      <button class="operation-btn-{session.button_state[1]}"
                              on:click={()=>{if(session.button_state[1] === 'deactive') {return} onClickGotoDetail(exam.id, session.id)}}>
                        查看详情
                      </button>
                      <button class="operation-btn-{session.button_state[2]}"
                              on:click={()=>{if(session.button_state[2] === 'deactive') {return} onClickSubmitResult(exam.id, session.id)}}>
                        提交
                      </button>
                      <button class="operation-btn-active"
                              on:click={()=>{showMarkOperationLogs(session.id)}}>
                        日志
                      </button>
                    </div>
                  {/each}
                </div>
              </td>
            </tr>
          {/each}
          </tbody>
        </table>
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

<BatchImportQuestionPanel bind:this={batchImportPanel} bank_id={26}/>

<!--<OperationLogPanel bind:this={operationLogPanel} />-->
<AwesomeLogPanel bind:this={operationLogPanel} />

<Dialog
  bind:isShow={dialog_content.show}
  title="{dialog_content.title}"
  content="{dialog_content.content}"
  confirmTextBackgroundColor="{dialog_content.confirmTextBackgroundColor}"
  onConfirm={dialog_content.onConfirm}
  onCancel={dialog_content.onCancel}
/>

<style>
    /*::-webkit-scrollbar {*/
    /*    display: none;*/
    /*}*/
    button {
        /* 清除默认边框 */
        border: 0;
        outline: none;
        /*清除默认背景 */
        background-color: transparent;
    }

    p {
        color: #333333;
        font-size: 14px;
        margin-block-start: 0;
        margin-block-end: 0;
        margin-inline-start: 0;
        margin-inline-end: 0;
    }

    .page-container {
        display: flex;
        /*gap: 2rem;*/
        margin-top: 5px;
        /*width: calc(100vw - 235px);*/
        width: 100%;
        /*height: calc(100vh - 65px - 5px);*/
        height: 100%;
        /*justify-content: center;*/
        background-color: #fff;
    }

    .page-body {
        display: flex;
        flex-direction: column;
        /*gap: 15px;*/
        width: 100%;
        height: 100%;
        overflow-y: scroll;
        overflow-x: auto;
    }

    .pagination-container {
        display: flex;
        justify-content: right;
        margin-top: 10px;
    }

    /*.page-title {*/
    /*    width: calc(100% - 55px);*/
    /*    height: 30px;*/
    /*    margin-left: 35px;*/
    /*    margin-top: 20px;*/
    /*}*/

    /*.page-title-text {*/
    /*    width: 100px;*/
    /*    height: 30px;*/
    /*    border-left: 4px solid #0336ff;*/
    /*}*/

    .page-title-text p {
        height: 30px;
        line-height: 30px;
        text-align: right;
        font-size: 21px;
        font-weight: bold;
    }

    .table-container {
        width: 80vw;
        min-width: 900px;
        margin: 0 auto;
    }

    .table-body {
        margin-top: 15px;
        width: 100%;
        height: 68vh;
        overflow-y: scroll;
        overflow-x: hidden;
    }

    thead tr th {
        background-color: var(--bg-primary);
        position: sticky;
        top: 0;
    }

    .table-body table {
        width: 100%;
    }


    .table-search-container {
        height: 34px;
        width: 100%;
        margin-top: 40px;

    }

    .filter-container {
        /*position: absolute;*/
        /*right: 0;*/
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
    }

    table {
        border-collapse: collapse;
    }

    table tr {
        border-bottom: 1px solid #eeeeee;
    }


    td {
        height: 90px;
        text-align: center;
        padding: 0;
        border-spacing: 0;
        /*display: flex;*/
        /*flex-direction: column;*/
        /*justify-content: space-evenly;*/
    }

    .table-row-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
    }

    .table-sub-row {
        /*height: 45px;*/
        min-width: 45px;
        line-height: 45px;
        @media (min-height: 50px) {
            line-height: 30px;
        }
        overflow-wrap: break-word;
        word-wrap: break-word;
    }

    .operation-btn-active {
        color: var(--blue)
    }

    .operation-btn-active:hover {
        /*color: #0036ff;*/
        color: var(--primary-active);
        cursor: pointer;
        /*text-shadow: 0 0 1px #819bce;*/
        font-weight: bold;
    }

    .operation-btn-deactive {
        color: var(--gray);
    }

    .operation-btn-deactive:hover {
        cursor: not-allowed;
    }

</style>