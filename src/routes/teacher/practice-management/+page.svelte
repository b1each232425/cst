<!-- /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ -->
<script>
   import CustomSelect from "./_components/CustomSelect.svelte";
  // import Pagination from "../../../lib/component/Pagination.svelte"
  // import Dialog from "./components/Dialog.svelte";
  import { goto } from "$app/navigation";
   import Toast from "$lib/components/Toast/Toast.svelte";
  import StudentSelectionPanel from "./_components/StudentSelectionPanel.svelte";
  import {
    practice_data_list,
    practice_data_list_display,
    practice_name_store,
    practice_type_store,
    practice_status_store,
    current_page_store,
    page_size_store,
  } from "$lib/stores/modules/practiceData.js";
  import { exportToExcel, pageQueryHandle } from "./utils";
  import Title from "$lib/components/Title/Title.svelte";
  import { resolveRoute } from "$app/paths";
  import { onMount } from "svelte";
  import MessageBox from "$lib/components/MessageBox/MessageBox.svelte";
  import  inputBox from "$lib/components/Input/InputBox.svelte"
  import InputBox from "$lib/components/Input/InputBox.svelte";
  import  Select from "$lib/components/Select/Select.svelte";
  import Option from "$lib/components/Select/Option.svelte";


  // 使用runes接收页面数据
  const { data } = $props();

  /**
   * @type {Toast}
   */
  let actionToast;

  // Toast 状态管理
  let showToast = $state(false);
  let toastConfig = $state({
    type: 'success',
    message: '',
    duration: 3000,
    showClose: true,
    plain: true
  });

  // 自定义 Toast 显示函数
  function showToastMessage(type, message, duration = 3000) {
    toastConfig = {
      type,
      message,
      duration,
      showClose: true,
      plain: true
    };
    showToast = true;
    
    // 自动隐藏（与组件内部的自动关闭配合）
    setTimeout(() => {
      showToast = false;
    }, duration + 100);
  }

  // 状态管理
  let practice_name = $state(data.practice_name || ""); // 练习名称/课程名称输入框的值
  let practice_type = $state(data.practice_type || "全部"); // 练习类型
  let practice_status = $state(data.practice_status || "全部"); // 练习状态

  // 对话框状态管理
  let publishDialogOpen = $state(false); // 发布确认对话框
  let deleteDialogOpen = $state(false); // 删除确认对话框
  let cancelPublishDialogOpen = $state(false); // 取消发布确认对话框
  let show_student_selectionPanel = $state(false); // 学生选择面板
  /** @type {Practice | null} */
  let currentPractice = $state(null); // 当前操作的练习对象

  // 学生选择相关
  /** @type {Array<{id: string, serial_number: number}>} */
  let selectedStudentIds = $state([]);

  /**
   * @typedef {Object} Practice
   * @property {number} ID - 练习ID
   * @property {string} Name - 练习名称
   * @property {number} student_cnt - 学生人数
   * @property {string} Type - 练习类型
   * @property {string} Status - 练习状态
   * @property {number} AllowedAttempts - 可作答的次数
   */

  // 练习列表数据类型
  /** @type {Practice[]} */
  let displayed_practice_list = $state(
    Array.isArray(data.practices_display) ? data.practices_display : []
  );

  // 处理数据转置
  /**
   * 转置练习数据中的type和status字段
   * @param {any[]} practices - 原始练习数据数组
   * @returns {Practice[]} 转置后的练习数据数组
   */
  function transformPracticeData(practices) {
    if (!Array.isArray(practices)) return [];

    return practices.map((practice) => {
      // 转置type字段
      let transformedType = practice.Type;
      // 这里根据实际需求进行转置处理，例如：
      // 假设后端返回的是英文类型，需要转为中文显示
      if (practice.Type === "00") transformedType = "经典巩固";
      else if (practice.Type === "02") transformedType = "随机组卷";
      else if (practice.Type === "04") transformedType = "智能提升";

      // 转置status字段
      let transformedStatus = practice.Status;
      if (practice.Status === "02") transformedStatus = "已发布";
      else if (practice.Status === "00") transformedStatus = "未发布";

      return {
        ...practice,
        Type: transformedType,
        Status: transformedStatus,
      };
    });
  }

  // 练习列表数据 - 从page.js加载，并进行转置处理
  /** @type {any[]} */
  let practice_list = $state(
    transformPracticeData(Array.isArray(data.practices) ? data.practices : [])
  );

  // 下拉选项配置
  let type_options = ["全部", "经典巩固", "随机组卷", "智能提升"];

  let status_options = ["全部", "已发布", "未发布"];

  // 分页配置 - 使用后端返回的分页数据
  let total_data_num = $state(data.total_count || 0);
  let total_page_num = $state(data.total_page || 1);
  let current_page_num = $state(data.current_page || 1);
  let data_per_page = $state(data.page_size || 10);

  /**
   * 从服务器获取指定页的练习数据
   * @param {number} page - 页码
   * @param {number} page_size - 每页数据条数
   * @param {string} [name=""] - 练习名称筛选
   * @param {string} [type="全部"] - 练习类型筛选
   * @param {string} [status="全部"] - 练习状态筛选
   */
  async function fetchPracticesFromServer(
    page,
    page_size,
    name = "",
    type = "全部",
    status = "全部"
  ) {
    
      // 准备查询参数
      let queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("page_size", page_size.toString());

      // 添加筛选条件（如果有）
      if (name) queryParams.append("name", name);
      if (type !== "全部") {
        // 转换类型为后端识别的格式
        let typeCode = "";
        if (type === "经典巩固") typeCode = "00";
        else if (type === "随机组卷") typeCode = "02";
        else if (type === "智能提升") typeCode = "04";

        if (typeCode) queryParams.append("type", typeCode);
      }
      if (status !== "全部") {
        // 转换状态为后端识别的格式
        let statusCode = "";
        if (status === "已发布") statusCode = "02";
        else if (status === "未发布") statusCode = "00";

        if (statusCode) queryParams.append("status", statusCode);
      }

      // 发送请求
      const url = `/api/practice?${queryParams.toString()}`;
      const response = await fetch(url, {
        credentials: "include",
      }).then(async(response)=>{
        if (!response.ok){
               const err_text = await response.text();
        throw new Error(err_text);
        }
        return response;
      }).then((res) => res.json()).then((result)=>{
        if (result.status === 0 && result.data && result.data.practices) {
        // 更新练习列表和分页信息
        const transformedData = transformPracticeData(result.data.practices);
        practice_list = transformedData;
        displayed_practice_list = transformedData;

        // 更新分页信息
        total_data_num = result.rowCount || 0;
        total_page_num = pageQueryHandle(total_data_num, page_size);
        current_page_num = page;
        data_per_page = page_size;

        // 更新store
        practice_data_list.set(practice_list);
        practice_data_list_display.set(displayed_practice_list);
        current_page_store.set(current_page_num);
        page_size_store.set(data_per_page);
      } else {
        console.error("获取练习列表响应格式错误:", result);
      }
      }).catch(error => { 
        console.error("获取练习列表错误:", error);
      });
  }

  /**
   * 筛选练习列表
   * 如果使用本地筛选，则从practice_list中过滤
   * 如果使用服务器筛选，则调用fetchPracticesFromServer
   */
  async function filter_practice_list() {
    // 更新store
    practice_name_store.set(practice_name || "");
    practice_type_store.set(practice_type || "全部");
    practice_status_store.set(practice_status || "全部");
    current_page_store.set(current_page_num);
    page_size_store.set(data_per_page);

    // 使用本地端分页和筛选
    await fetchPracticesFromServer(
      current_page_num,
      data_per_page,
      practice_name,
      practice_type,
      practice_status
    );
  }

  // 初始化时执行一次筛选
  onMount(()=>{
 filter_practice_list();
  })
 

  // 修改CustomSelect组件以添加事件监听
  function handle_type_change() {
    current_page_num = 1; // 重置为第一页
    filter_practice_list();
  }

  function handle_status_change() {
    current_page_num = 1; // 重置为第一页
    filter_practice_list();
  }

  function handle_name_input() {
    current_page_num = 1; // 重置为第一页
    filter_practice_list();
  }

  /**
   * 页码变更回调
   * @param {boolean} is_next - 是否点击下一页
   */
  function handle_page_change(is_next) {
    if (is_next && current_page_num < total_page_num) {
      current_page_num++;
      filter_practice_list();
    } else if (!is_next && current_page_num > 1) {
      current_page_num--;
      filter_practice_list();
    }
  }

  /**
   * 页码选择回调
   * @param {number} page - 选中的页码
   */
  function handle_page_choose(page) {
    if (page !== current_page_num) {
      current_page_num = page;
      filter_practice_list();
    }
  }

  /**
   * 每页数量选择回调
   * @param {string} value - 每页显示的数据条数
   */
  function handle_page_size_change(value) {
    const newPageSize = parseInt(value, 10);
    if (newPageSize !== data_per_page) {
      data_per_page = newPageSize;
      current_page_num = 1; // 重置为第一页
      filter_practice_list();
    }
  }

  /**
   * 页码搜索回调
   * @param {string} value - 输入的页码
   */
  function handle_page_search(value) {
    const page = parseInt(value, 10);
    if (
      !isNaN(page) &&
      page > 0 &&
      page <= total_page_num &&
      page !== current_page_num
    ) {
      current_page_num = page;
      filter_practice_list();
    }
  }

  // 新建练习按钮点击事件
  function create_new_practice() {
    goto("/teacher/practice-management/create");
  }

  /**
   * 发布练习按钮点击事件
   * @param {Practice} practice - 练习对象
   */
  function publish_practice(practice) {
    // 保存当前操作的练习
    currentPractice = practice;
    // 打开发布确认对话框
    publishDialogOpen = true;
  }

  /**
   * 确认发布练习
   */
  function confirm_publish() {
    if (!currentPractice) return;

    // 实现发布练习的逻辑
    console.log("确认发布练习:", currentPractice.Name);
    console.log("练习信息:", currentPractice);
    const queryParams = new URLSearchParams();
    queryParams.append("id", currentPractice.ID);
    queryParams.append("status", "02");

    const url = `/api/practice?${queryParams.toString()}`;

    // 调用API发布练习
    fetch(url , {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then(async(response) => {
      if (!response.ok){
             const err_text = await response.text();
        throw new Error(err_text);
      }
      return response;
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("发布练习响应:", data);
        if (data.status !== 0) {
          console.error("发布练习失败:", data.msg);
         showToastMessage("error", data.msg || "发布练习失败", "", 1000);
          return;
        }
        // 更新练习状态
        const practiceId = currentPractice?.ID;

        const index = practice_list.findIndex((p) => p.ID === practiceId);
        if (index !== -1) {
          practice_list[index].Status = "已发布";
          practice_data_list.set(practice_list);
          // 刷新列表显示
          filter_practice_list();
        }

        // 显示发布成功提示
        showToastMessage("success", "发布练习成功", "", 1000);
      })
      .catch((error) => {
        console.error("发布练习请求异常:", error);
        showToastMessage("error", "发布练习请求异常", "", 1000);
      });
  }

  /**
   * 取消发布按钮点击事件
   * @param {Practice} practice - 练习对象
   */
  function cancel_publish(practice) {
    // 保存当前操作的练习
    currentPractice = practice;
    // 打开取消发布确认对话框
    cancelPublishDialogOpen = true;
  }

  /**
   * 确认取消发布
   */
  function confirm_cancel_publish() {
    if (!currentPractice) return;

    // 实现取消发布的逻辑
    console.log("确认取消发布练习:", currentPractice.Name);
    const queryParams = new URLSearchParams();
    queryParams.append("id", currentPractice.ID);
    queryParams.append("status", "00");
    const url = `/api/practice?${queryParams.toString()}`;
    // 调用API取消发布练习
    fetch(url, {
      method: "Patch",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then(async(response)=>{
      if (!response.ok){
        const err_text = await response.text();
        throw new Error(err_text);
      }
      return response;
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("取消发布练习响应:", data);
        if (data.status !== 0) {
          console.error("取消发布练习失败:", data.msg);
          showToastMessage("error", data.msg || "取消发布练习失败", "", 1000);
          return;
        }
        // 更新练习状态
        const practiceId = currentPractice?.ID;
        const index = practice_list.findIndex((p) => p.ID === practiceId);
        if (index !== -1) {
          practice_list[index].Status = "未发布";
          practice_data_list.set(practice_list);
          // 刷新列表显示
          filter_practice_list();
        }

        // 显示取消发布成功提示
        showToastMessage("success", "取消发布练习成功", "", 1000);
      })
      .catch((error) => {
        console.error("取消发布练习请求异常:", error);
       showToastMessage("error", "取消发布练习请求异常", "", 1000);
      });
  }

  /**
   * 选择学生按钮点击事件
   * @param {Practice} practice - 练习对象
   */
  async function selectStudents(practice) {
    // 保存当前操作的练习
    currentPractice = practice;
    // 获取已选择的学生
    await fetchSelectedStudents(practice.ID);
    // 打开学生选择面板
    show_student_selectionPanel = true;
  }

  /**
   * 获取已选择的学生
   * @param {number} practiceId - 练习ID
   */
  async function fetchSelectedStudents(practiceId) {
    await fetch(
        `/api/practiceStudentList?id=${practiceId}`
      ).then(async(response)=>{
         if (!response.ok) {
        const err_text = await response.text();
        throw new Error(err_text);
      }return response.json();
      }).then((data)=>{
      if (data.status !== 0) {
        throw new Error(data.msg);
      } else {
        // 转换学生数据格式
        selectedStudentIds = data.data.map((student, index) => ({
          id: student.id,
          serial_number: index + 1,
        }));
      }
      }).catch(error => {
       console.error("获取已选择学生异常:", error);
      showToastMessage("error", `获取已选择学生异常:${error}`, "", 1000);
      selectedStudentIds = [];
      });
    
  }

  /**
   * 学生选择确认回调
   * @param {Array<{id: string, serial_number: number}>} selected - 选中的学生
   */
  async function handleStudentSelectionConfirm(selected) {
    if (!currentPractice) return;
      // 调用API更新练习的学生
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
         practice: {
            ID: currentPractice.ID,
          
          },
          student:{
              students: selected.map((s) => ({
              id: s.id,
            })),
          }
        }),
        credentials: "include",
      }).then(async(response)=>{
     if (!response.ok) {
        let err_text = await response.text();
        throw new Error(`HTTP error! err_text: ${err_text}`);
       
      }
     return response.json();}).then((data)=>{
 if (data.status !== 0) {
        console.error("更新学生失败:", data.msg);
        actionToast.show("error", data.msg || "更新学生失败", "", 1000);
        return;
      }
      // 显示更新成功提示
      showToastMessage("success", "更新学生成功", "", 1000);
     }).catch(error => {
        console.error("更新学生失败:", error);
        showToastMessage("error", "更新学生失败", "", 1000);
      });
     
    }

  
  

  /**
   * 继续编辑按钮点击事件
   * @param {Practice} practice - 练习对象
   */
  function continue_edit(practice) {
    // 实现继续编辑的逻辑
    goto(`/teacher/practiceManagement/edit/${practice.ID}`);
  }

  /**
   * 删除练习按钮点击事件
   * @param {Practice} practice - 练习对象
   */
  function delete_practice(practice) {
    // 保存当前操作的练习
    currentPractice = practice;
    // 打开删除确认对话框
    deleteDialogOpen = true;
  }

  /**
   * 确认删除练习
   */
  function confirm_delete() {
    if (!currentPractice) return;

    // 实现删除练习的逻辑
    console.log("确认删除练习:", currentPractice.Name);

    const queryParams = new URLSearchParams();
    queryParams.append("id", currentPractice.Id);
    queryParams.append("status", "04")

    // 调用API删除练习
    fetch("/api/practice", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
           throw new Error("删除练习失败");
        } return response.json();
      })
      .then((data) => {
        console.log("删除练习响应:", data);
        if (data.status !== 0) {
          console.error("删除练习失败:", data.msg);
          showToastMessage("error", data.msg || "删除练习失败", "", 1000);
          return;
        }
        // 从列表中移除
        const practiceId = currentPractice?.ID;
        practice_list = practice_list.filter((p) => p.ID !== practiceId);
        practice_data_list.set(practice_list);
        // 刷新列表显示
        filter_practice_list();

        // 显示删除成功提示
        showToastMessage("success", "删除练习成功", "", 1000);
      })
      .catch((error) => {
        console.error("删除练习请求异常:", error);
        showToastMessage("error", "删除练习请求异常", "", 1000);
      });
  }

  /**
   * 获取参与学生名单
   * @param {Practice} practice
   */
  async function getStudentInfos(practice) {
   await fetch(
        `/api/practiceStudentList?id=${practice.ID}`
      ).then(async(response)=>{
 if (!response.ok) {
        const err_text = await response.text();
        throw new Error(err_text);
      }
      return response.json();
      }).then((data)=>{
if (data.status !== 0) {
        throw new Error(data.msg);
      } else {
        console.log("getStudentInfos: ", data.data);
        let studentInfos = data.data;
        exportToExcel(studentInfos);
      }
      }).catch((error)=>{
  console.error("获取参与学生名单异常:", error);
      showToastMessage("error", `获取参与学生名单异常:${error}`, "", 1000);
      })
    
  }
</script>

<div class="practice-management">
  <Title title="练习列表" />

  <div class="table-action-container">
    <div class="search-and-add-button-container">
      <div class="search-bar">
        <div class="search-box">
          <InputBox
          label="搜索练习："
          type="text"
            placeholder="请输入练习名称"
            bind:value={practice_name}
            oninput={handle_name_input}
          />
        </div>

        <div class="filter-box">
          <span class="filter-label">练习类型：</span>
          <div class="dropdown-wrapper">
            <Select
              bind:value={practice_type}
              onChangeFunc={handle_type_change}
              filterable
            >
         {#each type_options as option}
    <Option value={option} label={option}></Option>
  {/each}
          </Select>
          </div>
        </div>
        <div class="filter-box">
          <span class="filter-label">练习状态：</span>
          <div class="dropdown-wrapper">
            <Select
              bind:selected_value={practice_status}
              filterable
              onChangeFunc={handle_status_change}
            >
          {#each status_options as option}
          <Option value={option} label={option}></Option>
          {/each}
          </Select>
          </div>
        </div>
      </div>
      <button class="new-practice-btn" onclick={create_new_practice}>
        + 新增练习
      </button>
    </div>

    <div class="practice-table">
      <table>
        <thead>
          <tr>
            <th class="header" style="width: 20%">练习名称</th>
            <th class="header" style="width: 20%">练习类型</th>
            <th class="header" style="width: 20%">学生人数</th>
            <th class="header" style="width: 20%">当前状态</th>
            <th class="header" style="width: 20%">可作答次数</th>
            <th class="header" style="width: 20%">操作</th>
          </tr>
        </thead>
        <tbody>
          {#each displayed_practice_list as practice}
            <tr>
              <td style="text-align: center;" title={practice.Name}
                >{practice.Name}</td
              >
              <td style="text-align: center;" title={practice.Type}
                >{practice.Type}</td
              >
              <td
                style="text-align: center;"
                title={practice.student_cnt.toString()}
                >{practice.student_cnt}</td
              >
              <td style="text-align: center;">
                <span
                  class="Status-tag {practice.Status === '已发布'
                    ? 'published'
                    : 'unpublished'}"
                >
                  {practice.Status}
                </span>
              </td>
              <td
                title={String(practice.AllowedAttempts)}
                style="text-align: center;"
              >
                {practice.AllowedAttempts === 0
                  ? "不限作答次数"
                  : practice.AllowedAttempts}
              </td>
              <td class="operation-column">
                <div class="operation-row">
                  {#if practice.Status !== "未发布"}
                    <button
                      class="op-btn edit"
                      onclick={() => selectStudents(practice)}
                    >
                      选择学生
                    </button>
                    <button
                      class="op-btn unpublish"
                      onclick={() => cancel_publish(practice)}
                    >
                      取消发布
                    </button>
                  {/if}

                  {#if practice.Status === "未发布"}
                    <button
                      class="op-btn edit"
                      onclick={() => continue_edit(practice)}
                    >
                      继续编辑
                    </button>
                    <button
                      class="op-btn publish"
                      onclick={() => publish_practice(practice)}
                    >
                      发布练习
                    </button>
                  {/if}
                </div>
                <!-- 添加下载学生名单按钮 -->

                <div class="operation-row">
                  <button
                    class="op-btn download"
                    onclick={() => getStudentInfos(practice)}
                  >
                    下载学生名单
                  </button>
                  {#if practice.Status === "未发布"}
                    <button
                      class="op-btn delete"
                      onclick={() => delete_practice(practice)}
                    >
                      删除练习
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
     <div class="pagination-container">
      <!-- <Pagination
        {total_data_num}
        {total_page_num}
        {current_page_num}
        max_show_page_num={5}
        data_num_per_page_options={[
          { value: 10, label: "10条/页" },
          { value: 20, label: "20条/页" },
          { value: 30, label: "30条/页" },
        ]}
        selected={{ value: data_per_page, label: `${data_per_page}条/页` }}
        onPageChangeFunc={handle_page_change}
        onPageChooseFunc={handle_page_choose}
        selectOptionFunc={handle_page_size_change}
        onPageSearchFunc={handle_page_search}
        expand_direction="up"
      />  -->
     </div> 
  </div>

  <!-- 发布确认对话框 -->
   <MessageBox
    bind:isOpen={publishDialogOpen}
    title="请问是否要发布练习？"
    content="发布练习将同时发布练习通知"
    onConfirm={confirm_publish}
  /> 

  <!-- 删除确认对话框 -->
  <MessageBox
    bind:isOpen={deleteDialogOpen}
    title="请问是否要删除练习？"
    content="该操作不可逆，请谨慎操作。"
    confirmTextBackgroundColor="#E34D59"
    onConfirm={confirm_delete}
  /> 

  <!-- 取消发布确认对话框 -->
  <MessageBox
    bind:isOpen={cancelPublishDialogOpen}
    title="请问是否要取消发布练习？"
    content="取消发布后学生将无法参与该练习。"
    onConfirm={confirm_cancel_publish}
  /> 

  <!-- 学生选择面板 -->
  <StudentSelectionPanel
    show_panel={show_student_selectionPanel}
    ids={selectedStudentIds}
    onCancel={() => {
      show_student_selectionPanel = false;
    }}
    onConfirm={(selected) => {
      handleStudentSelectionConfirm(selected);
      show_student_selectionPanel = false;
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }}
  />


</div>

<style lang="scss">
  :global(*) {
    box-sizing: border-box;
  }
  $border-color: #e5e6eb;
  $primary-color: var(--blue);
  .practice-management {
    background-color: #fff;
    box-shadow: none;
    position: relative;
    display: block;
    height: 100%;
    overflow: auto;
    .page-header {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: space-between;
      margin-bottom: 20px;
      .title {
        display: flex;
        align-items: center;
        font-size: 20px;
        font-weight: bold;
        color: #000;
      }
      .title::before {
        content: "";
        display: inline-block;
        width: 13px;
        height: 29px;
        background-color: #0336ff;
        margin-right: 8px;
        border-radius: 4px;
      }
    }

    .table-action-container {
      display: flex;
      flex-direction: column;
      padding: 17px 30px 0 30px;
    }

    .search-and-add-button-container {
      display: flex;
      justify-content: space-between;
    }

    .new-practice-btn {
      background-color: #165dff;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 16px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 500;
      white-space: nowrap;
      height: 32px;
      &:hover {
        background-color: #0336ff;
      }
    }

    .search-bar {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 20px;
      align-items: center;
      gap: 16px;
      .search-box {
        display: flex;
        align-items: center;
        min-width: 200px;

        .search-label {
          font-size: 14px;
          color: #333;
          margin-right: 8px;
          white-space: nowrap;
        }

        .search-input {
          height: 32px;
          max-width: 300px;
          border: 1px solid $border-color;
          padding: 7px 12px;
          font-size: 14px;
          border-radius: var(--input-border-radius);
          min-height: 20px;
          transition: all 0.3s;

          &:focus {
            border-color: $primary-color;
            outline: none;
          }
        }
      }

      .filter-box {
        display: flex;
        align-items: center;
        min-width: 315px;

        .filter-label {
          font-size: 14px;
          color: #333;
          margin-right: 8px;
          white-space: nowrap;
        }

        .dropdown-wrapper {
          width: 120px;
          height: 32px;
        }
      }
    }

    .practice-table {
      border: none;
      border-radius: 0;
      overflow: auto;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        table-layout: fixed;
        background: #fff;
        height: 40px;
        thead {
          background-color: #ffffff;
          font-size: 14px;
          font-weight: normal;
          color: rgb(0, 0, 0, 0.3);
          border: none;
          padding: 8px;
          text-align: center;
        }
        th,
        td {
          border: none;
          padding: 8px 6px;
          text-align: center;
          vertical-align: middle;
        }

        th {
          white-space: nowrap;
          background-color: #ffffff;
          font-size: 14px;
          font-weight: normal;
          color: rgb(0, 0, 0, 0.3);
          border: none;
          padding: 8px;
          text-align: center;
        }

        td {
          color: #222;
          background: #fff;
          word-break: break-all;
          border-bottom: 1px solid #e0e0e0;
        }

        .header {
          text-align: center;
        }

        .Status-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 12px;

          &.published {
            background-color: #70b603;
            color: #ffffff;
          }

          &.unpublished {
            background-color: #689bff;
            color: #ffffff;
          }
        }

        .operation-column {
          .operation-row {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
            margin-bottom: 8px;

            &:last-child {
              margin-bottom: 0;
            }
          }

          .op-btn {
            padding: 5px 8px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            border: none;
            white-space: nowrap;
            color: #165dff;
            background-color: white;
            &:hover {
              opacity: 0.9;
            }
          }
        }
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 15px;
      position: relative;
      z-index: 10;
    }
  }
</style>
