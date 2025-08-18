<!-- /*
 * @Author: 李乐毅
 * @Date: 2025-07-27 16:36:22
 * @Last Modified by:   李乐毅
 * @Last Modified time: 2025-07-27 16:36:22
 */ -->
<script>
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/components/Toast/Toast.js';
  import StudentSelectionPanel from './_components/StudentSelectionPanel.svelte';
  import { get } from 'svelte/store';
  import {
    practice_data_list,
    practice_data_list_display,
    practice_name_store,
    practice_type_store,
    practice_status_store,
    current_page_store,
    page_size_store,
    practice_filter,
  } from './store/practiceData.js';
  import { exportToExcel, pageQueryHandle } from './utils';
  import Title from '$lib/components/Title/Title.svelte';
  import { resolveRoute } from '$app/paths';
  import { onMount } from 'svelte';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import InputBox from '$lib/components/Input/InputBox.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import Empty from '$lib/components/Table/Empty.svelte';
  import { transformPracticeData } from './utils.js';
  import { isTemplateMiddle } from 'typescript';

  // 状态管理
  let practice_name = $state(''); // 练习名称/课程名称输入框的值
  let practice_type = $state('全部'); // 练习类型
  let practice_status = $state('全部'); // 练习状态
  let practice_paper_id = $state('');

  // 对话框状态管理
  let publishDialogOpen = $state(false); // 发布确认对话框
  let deleteDialogOpen = $state(false); // 删除确认对话框
  let invalidatedDialogOpen = $state(false); // 取消发布确认对话框
  let show_student_selectionPanel = $state(false); // 学生选择面板
  /** @type {Practice[] | null} */
  let currentPractice = $state([]); // 当前操作的练习对象

  // 学生选择相关
  /** @type {Array<{id: string, serial_number: number}>} */
  let selectedStudentIds = $state([]);

  

  //练习复选框状态
  let is_all_selected = $state(false);

  /**
   * @typedef {Object} Practice
   * @property {number} ID - 练习ID
   * @property {string} Name - 练习名称
   * @property {number} student_count - 学生人数
   * @property {string} Type - 练习类型
   * @property {string} Status - 练习状态
   * @property {number} AllowedAttempts - 可作答的次数
   * @property {string} selected - 是否被选中
   */

  // 练习列表数据类型
  /** @type {Practice[]} */
  let displayed_practice_list = $state([]);

  // 练习列表数据 - 从page.js加载，并进行转置处理
  /** @type {any[]} */
  let practice_list = $state([]);

  // 下拉选项配置
  let type_options = ['全部', '经典巩固', '随机组卷', '智能提升'];

  let status_options = ['全部', '已发布', '未发布', '已作废'];

  // 分页配置
  let total_data_num = $state(0);
  let total_page_num = $state(1);
  let current_page_num = $state(1);
  let data_per_page = $state(10);

  /**
   * 从服务器获取指定页的练习数据
   * @param {number} page - 页码
   * @param {number} page_size - 每页数据条数
   * @param {string} [name=""] - 练习名称筛选
   * @param {string} [type="全部"] - 练习类型筛选
   * @param {string} [status="全部"] - 练习状态筛选
   */
  async function fetchPracticesFromServer(page, page_size, name = '', type = '全部', status = '全部') {
    // 准备查询参数
    let queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('page_size', page_size.toString());

    // 添加筛选条件（如果有）
    if (name) queryParams.append('name', name);
    if (type !== '全部') {
      // 转换类型为后端识别的格式
      let typeCode = '';
      if (type === '经典巩固') typeCode = '00';
      else if (type === '随机组卷') typeCode = '02';
      else if (type === '智能提升') typeCode = '04';

      if (typeCode) queryParams.append('type', typeCode);
    }
    if (status !== '全部') {
      // 转换状态为后端识别的格式
      let statusCode = '';
      if (status === '已发布') statusCode = '02';
      else if (status === '未发布') statusCode = '00';
      else if (status === '已作废') statusCode = '06';

      if (statusCode) queryParams.append('status', statusCode);
    }

    // 发送请求
    const url = `/api/practice?${queryParams.toString()}`;
    const response = await fetch(url, {
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) {
          const err_text = await response.text();
          toast.error(err_text);
          throw new Error(err_text);
        }
        return response;
      })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 0 && result.data && result.data.practices) {
          practice_filter.set(true);
          // 更新练习列表和分页信息
          const transformedData = transformPracticeData(result.data.practices);
          practice_list = transformedData;
          displayed_practice_list = transformedData;

          // 更新分页信息
          total_data_num = result.data.total || 0;
          total_page_num = pageQueryHandle(total_data_num, page_size);
          current_page_num = page;
          data_per_page = page_size;

          // 更新store
          practice_data_list.set(practice_list);
          practice_data_list_display.set(displayed_practice_list);
          current_page_store.set(current_page_num);
          page_size_store.set(data_per_page);
        } else {
          console.error('获取练习列表响应格式错误:', result);
        }
      })
      .catch((error) => {
        console.error('获取练习列表错误:', error);
        toast.error('获取练习列表失败');
        practice_filter.set(true);

        ((practice_list = get(practice_data_list)),
          (displayed_practice_list = get(practice_data_list_display)),
          (practice_name = get(practice_name_store)),
          (practice_type = get(practice_type_store)),
          (practice_status = get(practice_status_store)),
          (current_page_num = get(current_page_store)),
          (data_per_page = get(page_size_store)));
      });
  }

  /**
   * 筛选练习列表
   * 如果使用本地筛选，则从practice_list中过滤
   * 如果使用服务器筛选，则调用fetchPracticesFromServer
   */
  async function filter_practice_list() {
    // 更新store
    practice_name_store.set(practice_name || '');
    practice_type_store.set(practice_type);
    practice_status_store.set(practice_status);
    current_page_store.set(current_page_num);
    page_size_store.set(data_per_page);
    // 使用本地端分页和筛选
    await fetchPracticesFromServer(current_page_num, data_per_page, practice_name, practice_type, practice_status);
  }

  // 初始化时执行一次筛选
  onMount(() => {
    console.log(get(practice_filter));
    if (practice_filter) {
      ((practice_list = get(practice_data_list)),
        (displayed_practice_list = get(practice_data_list)),
        (practice_name = get(practice_name_store)),
        (practice_type = get(practice_type_store)),
        (practice_status = get(practice_status_store)),
        (current_page_num = get(current_page_store)),
        (data_per_page = get(page_size_store)));
    }
    // 从API获取练习列表数据
    filter_practice_list();
  });

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
   * 页码选择回调
   * @param {number} page - 选中的页码
   */
  function handle_page_choose(event) {
    if (event.detail !== current_page_num) {
      current_page_num = event.detail;
      filter_practice_list();
    }
  }

  /**
   * 每页数量选择回调
   * @param {string} value - 每页显示的数据条数
   */
  function handle_page_size_change(event) {
    const newPageSize = parseInt(event.detail, 10);
    if (newPageSize !== data_per_page) {
      data_per_page = newPageSize;
      current_page_num = 1; // 重置为第一页
      filter_practice_list();
    }
  }

  // 新建练习按钮点击事件
  function create_new_practice() {
    goto('/teacher/practice/create');
  }

  /**
   * 发布练习按钮点击事件
   * @param {Practice} practice - 练习对象
   */
  function publish_practice(practice) {
    if (!Array.isArray(practice)) {
      practice = [practice];
    }
    // 保存当前操作的练习
    currentPractice = practice;
    if (!currentPractice || currentPractice.length == 0) {
      toast.error('请选择要发布的练习');
      return;
    }
    publishDialogOpen = true;
  }

  /**
   * 确认发布练习
   */
  function confirm_publish() {
    // 实现发布练习的逻辑
    console.log('练习信息:', currentPractice);
    const queryParams = new URLSearchParams();
    queryParams.append(
      'id',
      currentPractice.map((practice) => practice.ID),
    );
    queryParams.append('status', '02');

    const url = `/api/practice?${queryParams.toString()}`;

    // 调用API发布练习
    fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) {
          const err_text = await response.text();
          toast.error(err_text);
          throw new Error(err_text);
        }
        return response.json();
      })
      .then((data) => {
        console.log('发布练习响应:', data);
        if (data.status !== 0) {
          console.error('发布练习失败:', data.msg);
          toast.error('发布练习失败');
          return;
        }
        // 更新练习状态
        const practiceIds = currentPractice?.map((p) => p.ID);
        practiceIds.forEach((id) => {
          const index = practice_list.findIndex((p) => p.ID === id);
          if (index !== -1) {
            practice_list[index].Status = '已发布';
          }
        });
        practice_data_list.set(practice_list);
        // 刷新列表显示
        filter_practice_list();

        // 显示发布成功提示
        toast.success('发布练习成功', 1000);
      })
      .catch((error) => {
        console.error('发布练习请求异常:', error);
        toast.error('发布练习请求异常', 1000);
      })
      .finally(() => {
        publishDialogOpen = false;
        currentPractice = [];
        is_all_selected = isAllSelected();
      });
  }

  /**
   * 作废按钮点击事件
   * @param {Practice} practice - 练习对象
   */
  function invalidated(practice) {
    if (!Array.isArray(practice)) {
      practice = [practice];
    }

    // 保存当前操作的练习
    currentPractice = practice;
    if (!currentPractice || currentPractice.length == 0) {
      toast.error('请选择要作废的练习');
      return;
    }

    // 打开作废确认对话框
    invalidatedDialogOpen = true;
  }

  /**
   * 确认作废
   */
  function confirm_invalidated() {
    if (!currentPractice) return;
    console.log('currentPractice', currentPractice);

    // 实现作废的逻辑
    const queryParams = new URLSearchParams();
    queryParams.append(
      'id',
      currentPractice.map((practice) => practice.ID),
    );
    queryParams.append('status', '06');
    const url = `/api/practice?${queryParams.toString()}`;
    // 调用API取消发布练习
    fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) {
          const err_text = await response.text();
          toast.error(err_text);
          throw new Error(err_text);
        }
        return response;
      })
      .then((response) => response.json())
      .then((data) => {
        console.log('作废练习响应:', data);
        if (data.status !== 0) {
          console.error('作废练习失败:', data.msg);
          toast.error('作废练习失败');
          return;
        }
        // 更新练习状态
        const practiceIds = currentPractice?.map((p) => p.ID);
        practiceIds.forEach((id) => {
          const index = practice_list.findIndex((p) => p.ID === id);
          if (index !== -1) {
            practice_list[index].Status = '已作废';
          }
        });
        practice_data_list.set(practice_list);
        // 刷新列表显示
        filter_practice_list();

        // 显示取消发布成功提示
        toast.success('作废练习成功', 1000);
      })
      .catch((error) => {
        console.error('作废练习请求异常:', error);
        toast.error('作废练习请求异常', 1000);
      })
      .finally(() => {
        invalidatedDialogOpen = false;
        currentPractice = [];
        is_all_selected = isAllSelected();
      });
  }

  let practiceID = $state();

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
    practiceID = practice.ID;
  }

  /**
   * 获取已选择的学生
   * @param {number} practiceId - 练习ID
   */
  async function fetchSelectedStudents(practiceId) {
    await fetch(`/api/practiceStudentList?id=${practiceId}`)
      .then(async (response) => {
        if (!response.ok) {
          const err_text = await response.text();
          toast.error(err_text);
          throw new Error(err_text);
        }
        return response.json();
      })
      .then((data) => {
        if (data.status !== 0) {
          toast.error(data.msg);
          throw new Error(data.msg);
        } else {
          // 转换学生数据格式
          selectedStudentIds = data.data.map((student, index) => ({
            id: student.id,
            serial_number: index + 1,
          }));
        }
      })
      .catch((error) => {
        console.error('获取已选择学生异常:', error);
        toast.error(`获取已选择学生异常`);
        selectedStudentIds = [];
      });
  }

  /**
   * 学生选择确认回调
   * @param {Array<{id: string, serial_number: number}>} selected - 选中的学生
   */
  async function handleStudentSelectionConfirm(newStudents, selected) {
    if (!currentPractice) return;
    const UPDATE_STUDENTS = () => {
      // 调用API更新练习的学生
      const requestBody = {
        Action: 'POST',
        Data: {
          practice_id: currentPractice.ID,
          student: selectedStudentIds.map((s) => s.id), // 发送学生 ID 数组
        },
      };

      return fetch('/api/practiceStudentList', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
        .then(async (response) => {
          if (!response.ok) {
            let err_text = await response.text();
            toast.error(err_text);
            throw new Error(`HTTP error! err_text: ${err_text}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.status !== 0) {
            console.error('更新学生失败:', data.msg);
            toast.error('更新学生失败');
            return;
          }
          // 显示更新成功提示
          toast.success('更新学生成功');
        })
        .catch((error) => {
          console.error('更新学生失败:', error);
          toast.error('更新学生失败', 1000);
        });
    };
    if (newStudents && newStudents.length > 0) {
      // 先执行导入操作
      fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: newStudents }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('导入失败');
          }
          return res.json();
        })
        .then((result) => {
          if (result.status !== 0) {
            throw new Error( '导入失败');
          }
          console.log('333333',selectedStudentIds)
          //获取新增之后的学生ID
          let studentIds = result.data.map((item) => ({
            id: item.ID
          }));
          //获取已经有账号的学生的ID
          let existStudentIds = selected.filter((item) => item.id).map((item) => ({
            id: item.id
          }));
         
          //检验是否有相同的ID，进行过滤
           existStudentIds = existStudentIds.filter((item) => !selectedStudentIds.some((item2) => item2.id === item.id));
          //创建需要关联的学生ID
          selectedStudentIds = [...selectedStudentIds, ...studentIds, ...existStudentIds];
          // 导入成功后执行创建练习
          return UPDATE_STUDENTS();
        })
        .catch((error) => {
          console.error('导入学生异常:', error);
          toast.error('导入学生异常', 1000);
        });
    } else {
      //获取已经有账号的学生的ID
      console.log("selecteds",selected)
      let existStudentIds = selected.filter((item) => item.ID).map((item) => ({
            id: item.ID
          }));
     
       //检验是否有相同的ID，进行过滤
           existStudentIds = existStudentIds.filter((item) => !selectedStudentIds.some((item2) => item2.id === item.id));
            console.log('existStudentIds', existStudentIds);
            
      //创建需要关联的学生ID
      selectedStudentIds = [...selectedStudentIds, ...existStudentIds];

      UPDATE_STUDENTS().catch((error) => {
        console.error('编辑练习请求异常:', error);
        toast.error('编辑练习请求异常', 1000);
      });
    }
  }

  /**
   * 继续编辑按钮点击事件
   * @param {Practice} practice - 练习对象
   */
  function continue_edit(practice) {
    // 实现继续编辑的逻辑
    goto(`/teacher/practice/edit/${practice.ID}`);
  }

  /**
   * 删除练习按钮点击事件
   * @param {Practice} practice - 练习对象
   */
  function delete_practice(practice) {
    if (!Array.isArray(practice)) {
      practice = [practice];
    }
    // 保存当前操作的练习
    currentPractice = practice;
    if (!currentPractice || currentPractice.length === 0) {
      toast.error('请选择要删除的练习');
      return;
    }
    // 打开删除确认对话框
    deleteDialogOpen = true;
  }

  /**
   * 确认删除练习
   */
  function confirm_delete() {
    if (!currentPractice) return;
    console.log('currentPractice:', currentPractice);
    let publishPractice = currentPractice.find((item) => {
      // 判断是否有练习不处于可删除状态
      return item.Status === '已发布' || item.Status === '已作废';
    });
    console.log('publishPractice:', publishPractice);
    if (publishPractice) {
      toast.error('存在练习无法删除');
      return; // 直接返回，不执行删除操作
    }

    // 实现删除练习的逻辑

    const queryParams = new URLSearchParams();
    queryParams.append(
      'id',
      currentPractice.map((practice) => practice.ID),
    );
    queryParams.append('status', '04');

    // 调用API删除练习
    fetch(`/api/practice?${queryParams.toString()}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          toast.error('删除练习失败');
          throw new Error('删除练习失败');
        }
        return response.json();
      })
      .then((data) => {
        console.log('删除练习响应:', data);
        if (data.status !== 0) {
          console.error('删除练习失败:', data.msg);
          toast.error('删除练习失败');
          return;
        }
        // 从列表中移除
        const practiceIds = currentPractice?.map((p) => p.ID);
        practice_list = practice_list.filter((p) => !practiceIds.includes(p.ID));
        practice_data_list.set(practice_list);
        // 刷新列表显示
        filter_practice_list();

        // 显示删除成功提示
        toast.success('删除练习成功', 1000);
      })
      .catch((error) => {
        console.error('删除练习请求异常:', error);
        toast.error('error', '删除练习请求异常', '', 1000);
      })
      .finally(() => {
        deleteDialogOpen = false;
        //清空现在选择的练习
        currentPractice = [];
        is_all_selected = isAllSelected();
      });
  }
  //全选练习
  function toggleSelectAll() {
    //切换全选状态
    is_all_selected = !is_all_selected;
    displayed_practice_list.forEach((practice) => {
      practice.selected = is_all_selected; //更新选中状态
    });
    if (is_all_selected) {
      displayed_practice_list.forEach((practice) => {
        const exist = currentPractice.find((item) => {
          practice.id === item.id;
        });
        if (!exist) {
          currentPractice.push(practice);
        }
      });
    } else {
      displayed_practice_list.forEach((practice) => {
        const index = currentPractice.findIndex((item) => {
          return practice.id === item.id;
        });
        if (index !== -1) {
          currentPractice.splice(index, 1);
        }
      });
    }
    is_all_selected = isAllSelected();
  }

  /**
   * 获取参与学生名单
   * @param {Practice} practice
   */
  async function getStudentInfos(practice) {
    await fetch(`/api/practiceStudentList?id=${practice.ID}`)
      .then(async (response) => {
        if (!response.ok) {
          const err_text = await response.text();
          toast.error(err_text);
          throw new Error(err_text);
        }
        return response.json();
      })
      .then((data) => {
        if (data.status !== 0) {
          toast.error(data.msg);
          throw new Error(data.msg);
        } else {
          console.log('getStudentInfos: ', data.data);
          let studentInfos = data.data;
          exportToExcel(studentInfos);
        }
      })
      .catch((error) => {
        console.error('获取参与学生名单异常:', error);
        toast.error(`获取参与学生名单异常:${error}`, '', 1000);
      });
  }

  //判断当前是否全选
  function isAllSelected() {
    if (displayed_practice_list != null) {
      return displayed_practice_list.length === currentPractice.length;
    } else {
      return false;
    }
  }
  //预览函数的实现
  async function preview(practice) {
    let GetPaperIdParam = new URLSearchParams();
    GetPaperIdParam.append('id', practice.ID);
    //获取练习的试卷ID
    await fetch(`/api/practice?${GetPaperIdParam.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((data) => {
        if (!data.ok) {
          throw new Error('请求练习详情失败');
        }
        return data.json();
      })
      .then((result) => {
        if (result.status === 0) {
          practice_paper_id = result.data.practice.PaperID;
          let practiceName = result.data.paper_name;
          //获取试卷的信息
          let paperParam = new URLSearchParams();
          paperParam.append('paper_id', practice_paper_id);
          paperParam.append('mode', 'preview');
          return fetch(`/api/paper/manual?${paperParam.toString()}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },

            credentials: 'include',
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error('请求试卷信息失败');
              }
              return response.json();
            })
            .then((paperInfo) => {
              if (paperInfo.status !== 0) {
                throw new Error('请求试卷信息失败');
              }

              let practiceQuestions = {
                Questions: paperInfo.data.Questions,
                QuestionGroupInfo: paperInfo.data.QuestionGroupInfo,
              };
              let practiceTitle = practiceName;
              //存进localStorage
              localStorage.setItem('practiceQuestions', JSON.stringify(practiceQuestions));
              localStorage.setItem('practiceTitle', practiceTitle);
              goto(`/student/answer/practice`);
            });
        } else {
          throw new Error('请求试卷详情失败');
        }
      })
      .catch((e) => {
        console.log(e);
        toast.error(e.message);
        throw new Error('请求练习详情失败');
      });
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
            onInput={handle_name_input}
          />
        </div>

        <div class="filter-box">
          <span class="filter-label">练习类型：</span>
          <div class="dropdown-wrapper">
            <Select bind:value={practice_type} changeValue={handle_type_change} filterable>
              {#each type_options as option}
                <Option value={option} label={option}></Option>
              {/each}
            </Select>
          </div>
        </div>
        <div class="filter-box">
          <span class="filter-label">练习状态：</span>
          <div class="dropdown-wrapper">
            <Select bind:value={practice_status} filterable changeValue={handle_status_change}>
              {#each status_options as option}
                <Option value={option} label={option}></Option>
              {/each}
            </Select>
          </div>
        </div>
      </div>
      <div>
        <button class="new-practice-btn" onclick={create_new_practice}> 新增 </button>
        <button class="delete-practice-btn" onclick={() => delete_practice(currentPractice)}> 删除 </button>
      </div>
    </div>

    <div class="practice-table">
      <table>
        <thead>
          <tr>
            <th class="header" style="width: 10%">
              <input type="checkbox" class="checkbox" onchange={toggleSelectAll} checked={is_all_selected} />
            </th>
            <th class="header" style="width: 20%">练习名称</th>
            <th class="header" style="width: 20%">练习类型</th>
            <th class="header" style="width: 20%">学生人数</th>
            <th class="header" style="width: 20%">当前状态</th>
            <th class="header" style="width: 20%">可作答次数</th>
            <th class="header" style="width: 20%">操作</th>
          </tr>
        </thead>
        <tbody>
          {#if displayed_practice_list.length > 0}
            {#each displayed_practice_list as practice}
              <tr>
                <td>
                  <input
                    type="checkbox"
                    class="checkbox"
                    checked={practice.selected}
                    onchange={(event) => {
                      const target = event.target;
                      if (target && target.checked) {
                        if (
                          !currentPractice.find((g) => {
                            return g.ID === practice.ID;
                          })
                        ) {
                          currentPractice.push(practice);
                        }
                        practice.selected = true;
                        is_all_selected = isAllSelected();
                      } else {
                        const index = currentPractice.findIndex((g) => {
                          g.ID === practice.ID;
                        });
                        if (index !== -1) {
                          currentPractice.splice(index, 1);
                        }
                        practice.selected = false;
                        is_all_selected = isAllSelected();
                      }
                    }}
                  />
                </td>
                <td style="text-align: center;" title={practice.Name}>{practice.Name}</td>
                <td style="text-align: center;" title={practice.Type}>{practice.Type}</td>
                <td style="text-align: center;" title={practice?.student_count?.toString()}>{practice.student_count}</td
                >
                <td style="text-align: center;">
                  <span
                    class="Status-tag {practice.Status === '已发布'
                      ? 'published'
                      : practice.Status === '未发布'
                        ? 'unpublished'
                        : 'invalidated'}"
                  >
                    {practice.Status}
                  </span>
                </td>
                <td title={String(practice.AllowedAttempts)} style="text-align: center;">
                  {practice.AllowedAttempts === 0 ? '不限作答次数' : practice.AllowedAttempts}
                </td>
                <td class="operation-column">
                  <div class="operation-row">
                    {#if practice.Status === '已发布'}
                      <button class="op-btn edit" onclick={() => selectStudents(practice)}> 选择学生 </button>
                      <button class="op-btn unpublish" onclick={() => invalidated(practice)}> 作废 </button>
                    {/if}

                    {#if practice.Status === '未发布'}
                      <button class="op-btn edit" onclick={() => continue_edit(practice)}> 编辑 </button>
                      <button class="op-btn publish" onclick={() => publish_practice(practice)}> 发布 </button>
                      <button class="op-btn unpublish" onclick={() => invalidated(practice)}> 作废 </button>
                    {/if}
                    {#if practice.Status === '已作废'}
                      <button class="op-btn unpublish" disabled>无法操作</button>
                    {/if}
                  </div>
                  <!-- 添加下载学生名单按钮 -->

                  <div class="operation-row">
                    {#if practice.Status !== '已作废'}
                      <button class="op-btn download" onclick={() => getStudentInfos(practice)}> 下载学生名单 </button>
                      <button class="op-btn preview" onclick={() => preview(practice)}> 预览 </button>
                    {/if}
                    {#if practice.Status === '未发布'}
                      <button class="op-btn delete" onclick={() => delete_practice(practice)}> 删除 </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          {:else}
            <tr>
              <td colspan="6" style="border: none;">
                <div class="empty-wrapper">
                  <Empty text="暂无练习数据" />
                </div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
    <div class="pagination-container" data-testid="pagination-container">
      <Pagination
      class="pagination-container"
        total_items={total_data_num}
        page_size={data_per_page}
        current_page={current_page_num}
        on:pageChange={handle_page_choose}
        on:pageSizeChange={handle_page_size_change}
      />
    </div>
  </div>

  <!-- 发布确认对话框 -->
  <MessageBox
    bind:visible={publishDialogOpen}
    title="请问是否要发布练习？"
    content="发布练习将同时发布练习通知"
    confirm_text="确定"
    cancel_text="取消"
    onConfirm={confirm_publish}
    onCancel={() => {
      publishDialogOpen = false;
    }}
  />

  <!-- 删除确认对话框 -->
  <MessageBox
    bind:visible={deleteDialogOpen}
    title="请问是否要删除练习？"
    content="该操作不可逆，请谨慎操作。"
    confirm_text="确定"
    cancel_text="取消"
    confirmTextBackgroundColor="#E34D59"
    onConfirm={confirm_delete}
    onCancel={() => {
      deleteDialogOpen = false;
    }}
  />

  <!-- 作废确认对话框 -->
  <MessageBox
    bind:visible={invalidatedDialogOpen}
    title="请问是否要作废练习？"
    content="作废后学生将无法参与该练习。"
    confirm_text="确定"
    cancel_text="取消"
    onConfirm={confirm_invalidated}
    onCancel={() => {
      invalidatedDialogOpen = false;
    }}
  />

  <!-- 学生选择面板 -->
  <StudentSelectionPanel
 
    show_panel={show_student_selectionPanel}
    ids={selectedStudentIds.map(item=>({
      ID : item.id,
      ...item
    }))}
    onCancel={() => {
      show_student_selectionPanel = false;
    }}
    practice_id={practiceID}
    onConfirm={(newStudents, selected) => {
      newStudents = newStudents.map((item)=>({
        ...item,
        Domains:['cst.school^student']
      }))
      handleStudentSelectionConfirm(newStudents, selected);
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
    overflow: hidden;

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
    .delete-practice-btn {
      background-color: #ff4d00;
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
        background-color: #ff0000;
      }
    }
    .publish-practice-btn {
      background-color: #06e609;
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
        background-color: #35c908;
      }
    }
    .unpublish-practice-btn {
      background-color: #e68c06;
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
        background-color: #c95c08;
      }
    }

    .search-bar {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 20px;
      align-items: center;
      gap: 16px;

      .search-label {
        font-size: 14px;
        color: #333;
        margin-right: 8px;
        white-space: nowrap;
      }
    }

    .filter-box {
      display: flex;
      align-items: center;
      min-width: 225px;

      .filter-label {
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
        width: 75px;
        white-space: nowrap;
        text-align: right;
      }

      .dropdown-wrapper {
        width: 120px;
        height: 32px;
      }
    }
  }

  .practice-table {
    position: absolute;
    top: 120px; /* 根据实际情况调整 */
    left: 0;
    width: 100%;
    height: calc(87vh - 200px);
    border: none;
    border-radius: 0;
    overflow: auto;
    margin-bottom: 20px;
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
        position: sticky; /* 添加这行 */
        top: 0; /* 添加这行 */
        z-index: 1; /* 确保它在其他内容之上 */
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
        &.invalidated {
          background-color: #ff0000;
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
  .checkbox {
    width: 16px;
    height: 16px;
    border: 1px solid rgb(0, 0, 0, 0.3);
    cursor: pointer;
    accent-color: #0052d9;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    position: fixed; /* 改为 fixed */
    bottom: 50px; /* 距离底部 20px */
    right: 40px; /* 距离右边 40px */
    z-index: 10;
    padding: 0 40px 0px 0;
  }
  .empty-wrapper {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
  }
</style>
