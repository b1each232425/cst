<!--
 * @Author: MIOZD && l317101@163.com
 * @Date: 2025-04-08 10:51:51
 * @LastEditors: Zpekii 3156752796@qq.com
 * @LastEditTime: 2025-07-08 18:00:28
 * @FilePath: \exam-fe\src\routes\teacher\invigilationList\invigilation\+page@.svelte
 * @Description: 理论题库编辑页
 * @
-->

<script>
  // @ts-nocheck

  import DropDown from "$lib/component/DropDownForInvigilation.svelte";
  
	import { onMount } from "svelte";
  
	import {
    getInvigilationInfo,
    updateExamineeInfo,
    updateInvigilationInfo,
    uploadProofImg,
    getProofImg,
    deleteProofImg,
    recoverExaminee
  } from "../api.js";
  
	import { formatHMSTime, formatTimestamp } from "$lib/common/time_utils.js";
  
	import Pagination from "$lib/component/Pagination.svelte";
  
	import Question from "$lib/component/QuestionAnswer/question.svelte";
  
	import { goto } from "$app/navigation";

  import BubbleMessageComponet from "$lib/component/BubbleMessageToast.svelte";
  
	import AwesomeLogPanel from "$lib/component/AwesomeLogPanel.svelte";

	import { transformHMSTimeExpression, transformTimeToHMS } from "$lib/common/time_utils.js";

  /**
   * @typedef InvigilationInfo - 考试场次信息
   * @property {string} exam_id - 考试ID
   * @property {string} exam_mode - 考试模式(线上/线下)
   * @property {string} exam_session_id - 考试场次ID
   * @property {string} exam_session_name - 考试场次名称
   * @property {number} exam_site_name - 考点
   * @property {number} exam_room_id - 考场ID
   * @property {number} exam_room_name - 考场
   * @property {string} status - 考试状态
   * @property {string} start_time - 考试开始时间
   * @property {string} end_time - 考试结束时间
   * @property {number} examinee_num - 考生人数
   * @property {number} absentee_num - 缺考人数
   * @property {number} cheater_num - 作弊人数
   * @property {number} abnormal_examinee_num - 考试异常人数
   * @property {number} extended_time_num - 已延长时间人数
   * @property {string} basic_eval - 考试基本情况评估
   * @property {string} record - 考试情况记录
   * @property {boolean} [is_admin] - 是否为管理员访问
   */

  /**
   * @typedef ExamineeInfo - 考生信息
   * @property {number} student_id - 学生ID
   * @property {number} examinee_id - 考生ID
   * @property {number} exam_session_id - 考试场次ID
   * @property {number} exam_room_id - 考场ID
   * @property {string} exam_card - 准考证号
   * @property {string} identity_id - 身份证号
   * @property {string} name - 姓名
   * @property {string} status - 考试状态
	 * @property {number} extra_time - 延长时间, 单位为分钟
   * @property {string} remark - 备注
   * @property {number} extendable_time - 可延长时间, 单位为分钟, -1表示无限制
   */

  /**
   * 当前选择的考生
   * @type {Record<number, ExamineeInfo>}
   */
  let current_select_examinee = $state({});

  /**
   * 全选状态
   * @type {boolean}
   */
  let select_all = $state(false);

  /**
   * 当前选中的考生数量
   * @type {number}
   */
  let choose_num = $state(0);

  /**
   * 当前是否有选中考生
   * @type {boolean}
   */
  let rows_is_select = $state(false);

  // 批量操作选择框用户的选择值（能发送至后端请求的值）
  let batchOptionValue = $state("");

  // 批量操作选择框用户的选择值的上一次选择值
  let batchOriginOptionValue = $state("");

  // 批量操作的备注绑定输入框
  let batchInputValue = $state("");

  // 批量操作多选复选框的控制timer
  let batchOptionTimer = $state(false);

  /**
   * @description ICON集合
   */
  const ICON = {
    rollback: "/invigilation/icons/rollback.svg",
    rollbackHover: "/invigilation/icons/rollback_hover.svg",
    group: "/invigilation/icons/group.svg",
    add: "/programming_question_bank/icons/add.svg"
  };

  // 当前页码
  let current_page = $state(1);
  // 每页容量
  let page_size = $state(10);
  // 总行数
  let total_row_count = $state(0);

  // 搜索文本
  let search_text = $state("");

  const EXAM_SESSION_STATUS = {
    "": "−",
    "01": "未开始",
    "02": "进行中",
    "04": "已结束",
  };

  /**
   * @description 考试信息状态
   * @type {InvigilationInfo}
   */
  let exam_info = $state({});

  /**
   * @description 考试信息的原始状态
   * 用于在考试信息修改后进行回滚
   */
  let origin_exam_info;

  /**
   * @description 考生信息列表的原始数据
   * @type {ExamineeInfo[]}
   */
  let origin_examinee_list;

  /**
   * @description 考生信息列表
   * @type {ExamineeInfo[]}
   */
  let examinee_list = $state([]);

  /**
   * @description 气泡信息组件
   * @type {BubbleMessageComponet}
   */
  let bubble_message_component;

  /**
   * @type {AwesomeLogPanel}
   */
  let operationLogPanel;

	/**
   * 是否显示延长时间设置面板
	 * @type {boolean} 
	 */
	let show_extend_time = $state(false);

	/**
   * 延长时间输入框的值
	 * @type {number} 
	 */
	let extend_time_batch_input_value = $state(0);

  /**
   * 可延长时间, 单位为分钟, -1表示无限制
   * @typedef {number}
  */
  let extendable_time = $state(-1);

  /**
   * @description 是否为管理员访问
  */
  let is_admin = $state(false);

  let large_image_preview_url = $state("");

  let show_large_image_preview = $state(false);

  /**
   * @description 当前考试的证明图片列表
   * @type {Array<string>}
  */
  let curr_proof_imgs = $state([]);

  /**
   * 考试证明图片更新计数器
   */
  let proof_img_updated = $state(0);

  onMount(async () => {
    if (localStorage) {

      let invigilation_session_info_json = localStorage.getItem(
        "invigilation_session_info"
      );

      if (invigilation_session_info_json) {

        let invigilation_session_info = JSON.parse(
          invigilation_session_info_json
        );

        is_admin = invigilation_session_info.is_admin ?? false;

        exam_info = {
          ...invigilation_session_info,
          exam_session_id: invigilation_session_info.exam_session_id.toString(),
        };
      }
    }
    await renewInvigilationInfo();
  });

  $effect(async() => {

    console.log(`proof image updated: ${$state.snapshot(proof_img_updated)}`)

    getProofImg(
      exam_info.exam_session_id,
      exam_info.exam_room_id
    )
    .then(result => {
      curr_proof_imgs = result;
    })
    .catch(err => {
      console.error("获取考试证明图片失败：", err);
      bubble_message_component.show("warn", "获取考试证明图片失败：" + err.message);
    });

    if(proof_img_updated == 0){
      return;
    }

    onUpdateInvigilationDebounce(
      exam_info.exam_session_id,
      exam_info.exam_room_id,
      exam_info.record,
      exam_info.basic_eval
    );
    
  })

  async function renewInvigilationInfo() {
		
    const res = await getInvigilationInfo(
      current_page,
      page_size,
      exam_info.exam_session_id,
      exam_info.exam_room_id,
      search_text
    );

    if (res.status !== 0) {
      bubble_message_component.show("warn", "拉取监考信息失败：" + res.msg);
      throw new Error(`${res.msg}`);
    }

    if (!res.data.examinee_info.list) {
      res.data.examinee_info.list = [];
    }

    if (!res.data.examinee_info.row_count) {
      res.data.examinee_info.row_count = 0;
    }

    // 更新考生信息列表
    examinee_list = res.data.examinee_info.list;

    total_row_count = res.data.examinee_info.row_count;

		let all_selected = true;

		for(let examinee of examinee_list) {
			examinee.extra_time = transformHMSTimeExpression(
				examinee.extra_time,
				"m"
			);

			if(current_select_examinee[examinee.examinee_id] == null) {
				all_selected = false;
			}

		}

		select_all = all_selected

    // 更新考试信息
    exam_info = {
      ...res.data.invigilation_info,
      start_time: formatTimestamp(
        new Date(res.data.invigilation_info.start_time).getTime()
      ),
      end_time: formatTimestamp(
        new Date(res.data.invigilation_info.end_time).getTime()
      ),
    };

    // 备份
    origin_exam_info = JSON.parse(JSON.stringify(exam_info));

    // 备份
    origin_examinee_list = JSON.parse(JSON.stringify(examinee_list));
  }

  /**
   * 处理分页选择函数
   * @param {number} page - 当前页码
   */
  function handlePageChange(page) {
    console.log(`当前页码: ${page}`);
    current_page = page;
    renewInvigilationInfo();
  }

  /**
   * @description 考试情况状态
   * @type {any[]}
   */
  let exam_basic_eval = [
    {
      value: "00",
      label: "良好",
    },
    {
      value: "02",
      label: "一般",
    },
    {
      value: "04",
      label: "较差",
    },
  ];

  /**
   * @description 考生异常状态
   */
  let examinee_status = [
    {
      value: "00",
      label: "正常",
    },
    {
      value: "02",
      label: "缺考",
    },
    {
      value: "06",
      label: "作弊",
    },
    {
      value: "14",
      label: "考试异常",
    },
  ];

  const rollback = () => {

    // 获取当前前一次历史路径
    if (window.history.length <= 1) {
      goto("/teacher/invigilationList");
    }

    window.history.back();
  };

  /**
   * @description 考生信息更新防抖处理
   * @type {Array}
   */
  let examinee_update_debounce_timer = new Map();

  
  /**
   * @description 更新单个考生信息
   * @param {string} examinee_id - 考生ID
   * @param {string} status - 考试状态
   * @param {string} remark - 备注
	 * @param {string} [extra_time] - 延长时间, 格式为 "HH:mm:ss"
   */
  function onUpdateExamineeDebounce(examinee_id, status, remark, extra_time) {
    
		if (examinee_update_debounce_timer.has(examinee_id)) {
      clearTimeout(examinee_update_debounce_timer.get(examinee_id));
    }

    examinee_update_debounce_timer.set(
      examinee_id,
      setTimeout(async () => {
        const res = await updateExamineeInfo([examinee_id], status, remark, extra_time);

        let modified_examinee = examinee_list.find(
          (examinee) => examinee.examinee_id === examinee_id
        );
        let origin_examinee = origin_examinee_list.find(
          (examinee) => examinee.examinee_id === examinee_id
        );

        if (res.status !== 0) {
          if (origin_examinee && modified_examinee) {
            // 恢复原始状态
            modified_examinee.status = origin_examinee.status;
            modified_examinee.remark = origin_examinee.remark;
						modified_examinee.extra_time = origin_examinee.extra_time;
          }

          bubble_message_component.show("warn", "更新考生信息失败：" + res.msg);
          return;
        }

        if (origin_examinee) {
          // 存在的话，就对应更改相应的状态
          origin_examinee.status = status;
          origin_examinee.remark = remark;
					origin_examinee.extra_time = transformHMSTimeExpression(extra_time, "m");
        } else {
          origin_examinee_list = JSON.parse(JSON.stringify(examinee_list));
        }

        bubble_message_component.show("success", "更新考生信息成功");
      }, 1000)
    );
  }

  /**
   * @description 考生信息更新计时器防抖处理
   * @type {Array}
   */
  let batch_status_timer = new Map();

  /**
   * @description 批量更新考生信息 包括异常标记状态 、 备注
   * @param {string} status - 考试状态
   * @param {string} remark - 备注
	 * @param {string} [extra_time] - 延长时间, 格式为 "HH:mm:ss"
   */
  async function batchOnUpdateExamineeDebounce(status, remark, extra_time) {
    
		// 这里先获取所有的在Map里面的考生信息 这里面可以不传输这个remark的，那这里我就不给他传输备注信息了；然后需要创建很多的数组
    if (batch_status_timer.has(1)) {
      clearTimeout(batch_status_timer.get(1));
    }

    batch_status_timer.set(
      1,
      setTimeout(async () => {
        
				const selectExamineeIDArray = [];
        
				Object.keys(current_select_examinee).forEach((key) => {
          selectExamineeIDArray.push(parseInt(key));
        });
        
				let changeNum = selectExamineeIDArray.length;
        
				if (status != "" && status != null) {
          switch (batchOptionValue) {
            case "02":
              exam_info.absentee_num -= changeNum;
              break;
            case "06":
              exam_info.cheater_num -= changeNum;
              break;
            case "14":
              exam_info.abnormal_examinee_num -= changeNum;
              break;
          }
          switch (status) {
            case "02":
              exam_info.absentee_num += changeNum;
              break;
            case "06":
              exam_info.cheater_num += changeNum;
              break;
            case "14":
              exam_info.abnormal_examinee_num += changeNum;
              break;
          }
        }

        // 实现批量更新
        const res = await updateExamineeInfo(
          selectExamineeIDArray,
          status,
          remark,
					extra_time
        );
        if (res.status !== 0) {
          batchOptionValue = batchOriginOptionValue;
          bubble_message_component.show("warn", "更新考生信息失败：" + res.msg);
          return;
        }

        batchOptionValue = "";
        batchInputValue = "";
        resetExamSelect();

        // 更新监考信息
        renewInvigilationInfo()
        .then(() => {
          bubble_message_component.show("success", "更新考生信息成功");
        })
        .catch(err => {
          bubble_message_component.show("warn", "更新考生信息失败：" + e);
        });

        
      }, 1000)
    );
  }

  /**
   * @description 更新考场信息的定时器
   */
  let updateInvigilationTimer;

  /**
   * @description 更新考场信息
   * @param {string} exam_session_id - 考试场次ID
   * @param {string} exam_room_id - 考场ID
   * @param {string} record - 考试记录
   * @param {string} basic_eval - 考试基本情况评估
   */
  function onUpdateInvigilationDebounce(
    exam_session_id,
    exam_room_id,
    record,
    basic_eval
  ) {
    if (updateInvigilationTimer) {
      clearTimeout(updateInvigilationTimer);
    }

    updateInvigilationTimer = setTimeout(async () => {
      const res = await updateInvigilationInfo(
        exam_session_id,
        exam_room_id,
        record,
        basic_eval
      );

      if (res.status !== 0) {
        bubble_message_component.show("warn", "更新监考信息失败：" + res.msg);
        // 恢复原始状态
        exam_info.record = origin_exam_info.record;
        exam_info.basic_eval = origin_exam_info.basic_eval;
        return;
      }

      origin_exam_info.record = record;
      origin_exam_info.basic_eval = basic_eval;
      bubble_message_component.show("success", "更新监考信息成功");
    }, 1000);
  }

  /**
   * @description 搜索考生信息的防抖处理
   */
  let search_examinee_debounce_timer;

  /**
   * @description 搜索考生信息的防抖处理
   */
  function onSearchExamineeDebounce() {
    if (search_examinee_debounce_timer) {
      clearTimeout(search_examinee_debounce_timer);
    }
    search_examinee_debounce_timer = setTimeout(async () => {
      await renewInvigilationInfo();
    }, 1000);
  }

  /**
   * 选中考生处理函数
   * @param {number} id - 考生id
	 * @param {ExamineeInfo} [info] - 考生信息
   */
  function handleSelectExaminee(id, info) {
    if (current_select_examinee[id]) {
      delete current_select_examinee[id];
      choose_num = choose_num == 0 ? choose_num : choose_num - 1;
    } else {
      current_select_examinee[id] = info;
      choose_num = choose_num + 1;
    }

    // console.log($state.snapshot(current_select_exam));

    // console.log(
    // 	$state.snapshot(exam_info_cache[current_page]),
    // 	$state.snapshot(exam_info).length
    // );

    switch (choose_num) {
      case 0:
        rows_is_select = false;
        select_all = false;
        break;

      case examinee_list.length:
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
  function resetExamSelect() {
    current_select_examinee = {};

    select_all = false;

    rows_is_select = false;

    choose_num = 0;
  }

  /**
   * 当前页全选处理函数
   * @param {boolean} is_select_all
   */
  function handleCurrentPageSelectAll(is_select_all) {
    if (!is_select_all) {
      for (let exam of examinee_list) {
        delete current_select_examinee[exam.examinee_id];
        choose_num--;
      }

      if (choose_num == 0) {
        rows_is_select = false;
      }

      return;
    }

    rows_is_select = true;

    for (let exam of examinee_list) {
      if (current_select_examinee[exam.examinee_id]) {
        continue;
      }

      current_select_examinee[exam.examinee_id] = exam;
      choose_num++;
    }
  }

  /**
   * 
   * 日志获取函数
   * @param {number} page
   * @param {number} pageSize
   * @return {Promise<logResult>}
   */
  async function logFetchFunc(page, pageSize) {

		return new Promise((resolve, reject)=>{
			/**
			 * @type {logResult}
			 */
			let result = {
					data: [],
					total: 0,
			};

			let query_params = new URLSearchParams({
					page: `${page}`,
					pageSize: `${pageSize}`,
					examSessionID: `${exam_info.exam_session_id}`,
					examRoomID: `${exam_info.exam_room_id ?? -1}`,
			})

			fetch(
				`/api/teacher/invigilation-info/log?${query_params}`,
				{
						method: "GET",
						credentials: "include",
				},
			)
			.then((resp) => {

					if (resp.ok) {
							return resp.json();
					}

					throw new Error(`网络请求失败, ${resp.statusText} (${resp.status})`);

			})
			.then((respData) => {

					if (respData.status != 0) {
							throw new Error(`${respData.msg}`);
					}

					resolve({
							data: respData.data,
							total: respData.row_count,
					});

			})
			.catch((err) => {
					
					action_toast?.show("error", `获取考点日志失败: ${err.message}`);
					
					reject(err);

			})


		});
  }

  /**
   * 恢复考生作答
   */
  function handleRecoverExaminee(){

    if (exam_info.status != "02") {
      bubble_message_component.show("warn", "考试未处于进行中, 无法执行操作");
      return;
    }

    for( let examinee_id in current_select_examinee) {
      recoverExaminee(
        exam_info.exam_id,
        examinee_id,
        current_select_examinee[examinee_id].student_id
      )
      .then(() => {
        bubble_message_component.show("success", "恢复作答成功");
        delete current_select_examinee[examinee_id];
        choose_num--;
      })
      .catch(err => {
        bubble_message_component.show("warn", "恢复作答失败：" + err.message);
      });
    }

  }

  /**
   * 上传考试证明图片
   * @param {{EventTarget & HTMLInputElement}} event
   */
  function handleUploadProofImg(event){

    let files = event.target.files;

    for(let file of files) {
      if (!file.type.startsWith("image/")) {
        bubble_message_component.show("warn", "只能上传图片文件");
        return;
      }
    }

    uploadProofImg(
      exam_info.exam_session_id,
      exam_info.exam_room_id,
      ...files
    )
    .then(async(result) => {
      bubble_message_component.show("success", "上传考试证明图片成功");
      proof_img_updated++;
    })
    .catch(err => {
      bubble_message_component.show("warn", "上传考试证明图片失败：" + err.message);
    });

  }

  /**
   * 删除考试证明图片
   * @param {string} img - 图片URL
   */
  function handleDeleteProofImg(img) {
    if (!confirm("确定要删除此图片吗？")) {
      return;
    }

    // 解析文件名
    let fileName = img.split("/").pop();

    deleteProofImg(
      exam_info.exam_session_id,
      exam_info.exam_room_id,
      fileName
    )
    .then(() => {
      bubble_message_component.show("success", "删除考试证明图片成功");
      proof_img_updated++;
    })
    .catch((err) => {
      bubble_message_component.show("warn", "删除考试证明图片失败：" + err.message);
    });
  }

  // 打开大图预览
  function openLargeImage(image_url) {
    if (image_url) {
      large_image_preview_url = image_url;
      show_large_image_preview = true;
    }
  }

  // 控制确认和取消按钮的显示与隐藏
  let showConfirmButtons = $state(false);

  function handleTextareaChange(e) {
    exam_info.record = e.target.value;
    showConfirmButtons = true;
  }

  async function confirmChanges() {
    await onUpdateInvigilationDebounce(
      exam_info.exam_session_id,
      exam_info.exam_room_id,
      exam_info.record,
      exam_info.basic_eval
    );
    showConfirmButtons = false;
  }

  function cancelChanges() {
    exam_info.record = origin_exam_info.record;
    showConfirmButtons = false;
  }

  /**
   * 检查是否可以更新信息
   * @return {boolean}
   */
  function canUpdateInfo() {
    let result = exam_info?.status == "02";

    result = result ?? false;

    return result;
  }

</script>

{#snippet tableHead()}
  <tr class="exam-list-head">
    <th class="exam-select">
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

    {#if exam_info.exam_mode == "02"}
      <th class="exam-card">准考证号</th>
    {/if}

    <th class="identity-id">身份证号</th>
    <th class="name">姓名</th>
    <th class="seat">座位号</th>
    <th class="status">异常标记</th>
		<th class="extra-time">延长时间</th>
    <th class="remark">备注</th>
  </tr>
{/snippet}


{#snippet tableRow(
 
  /**
   * 考试信息
   * @type {ExamineeInfo}
   */
  examineeInfo,

  /**
   * 当前行索引
   * @type {number}
   */
  index
)}
  <tr class="exam-list-row">
    <td class="exam-select">
      <button
        class="square-container {current_select_examinee[
          examineeInfo.examinee_id
        ] != null
          ? 'checked'
          : ''}"
        onclick={() => {
          handleSelectExaminee(examineeInfo.examinee_id, examineeInfo);
        }}
      >
        {#if current_select_examinee[examineeInfo.examinee_id] != null}
          <div class="check-square"></div>
        {/if}
      </button>
    </td>

    {#if exam_info.exam_mode == "02"}
      <td class="exam-card">
        <span>{examineeInfo.exam_card ?? "-"}</span>
      </td>
    {/if}
    

    <td class="identity-id">
      <span>{examineeInfo.identity_id ?? "-"}</span>
    </td>

    <td class="name">
      <span>{examineeInfo.name ?? "-"}</span>
    </td>

    <td class="seat">{(current_page - 1) * page_size + index + 1}</td>

    <td class="status">
      <div class="dropdown-container">
        <DropDown
          disabled={!canUpdateInfo()}
          options={examinee_status}
          selected={examineeInfo.status}
          selectOptionFunc={(value) => {
            switch (examineeInfo.status) {
              case "02":
                exam_info.absentee_num -= 1;
                break;
              case "06":
                exam_info.cheater_num -= 1;
                break;
              case "14":
                exam_info.abnormal_examinee_num -= 1;
                break;
            }
            switch (value) {
              case "02":
                exam_info.absentee_num += 1;
                break;
              case "06":
                exam_info.cheater_num += 1;
                break;
              case "14":
                exam_info.abnormal_examinee_num += 1;
                break;
            }
            examineeInfo.status = value;
            onUpdateExamineeDebounce(
              examineeInfo.examinee_id,
              examineeInfo.status,
              examineeInfo.remark
            );
          }}
          placeholder="无"
          onlyLeftBorder={false}
          contentInCenter={true}
        ></DropDown>
      </div>
    </td>

		<td class="extra-time">

			<div class="extra-time-container">
				<span class="extra-time-num">{examineeInfo.extra_time}</span>
				<span>分</span>
			</div>

		</td>

    <td class="remark">
      <input
        title="点击修改"
        placeholder="--"
        bind:value={examineeInfo.remark}
        onchange={(e) => {
          examineeInfo.remark = e.target.value;
          onUpdateExamineeDebounce(
            examineeInfo.examinee_id,
            examineeInfo.status,
            examineeInfo.remark,
            "00:00:00"
          );
        }}
      />
    </td>
  </tr>
{/snippet}

{#snippet extendTime()}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="extend-time-container"
	>
		<div class="extend-time-bg" 
			tabindex="0"
			role="button"
			onclick={(e) => {
				e.stopPropagation();
				show_extend_time = !show_extend_time;
			}}
		></div>

		<div class="extend-time-panel">
			
			<span class="extend-time-panel-title">延长时间设置</span>

			<div class="extend-time-panel-form">
				<div class="extend-time-panel-form-item">
					
					<span>选中考生:</span>
					
					<div class="extend-time-panel-form-item-content">
						
						{#each Object.keys(current_select_examinee) as id}
							
							<div class="name-item">
								
								<span>{current_select_examinee[id].name}</span>
								
								<button
									title="移除"
									onclick={() => {
										delete current_select_examinee[id];
										choose_num = choose_num == 0 ? choose_num : choose_num - 1;
										if (choose_num == 0) {
											rows_is_select = false;
											select_all = false;
											show_extend_time = false;
										}
									}}
								>
									⨉
								</button>
							
							</div>
						
						{/each}
					
					</div>

				</div>

				<div class="extend-time-panel-form-item">
					<span>延长时间:</span>
					<div class="extend-time-panel-form-item-content">

						<div 
							class="input-container"
							title="在现有的延长时间基础上进行增加时间"
						>
							<input
								type="number"
								min="0"
								bind:value={extend_time_batch_input_value}
								oninput={(e) => {

                  if (extendable_time == -1) {
                    return;
                  }

                  if (e.target.value < 0) {
                    extend_time_batch_input_value = 0;
                    return;
                  }

                  if (e.target.value <= extendable_time) {
                    return;
                  }

                  extend_time_batch_input_value = extendable_time;
                }}
							/>
							<span>分钟</span>
						</div>

            <span 
              style="color: var(--blue); font-size:14px"
              title="取值为当前已选择的考生中可延长时间最小的值"
            >
              {extendable_time == -1 ? "(最大可延长时间: 无限制)" : `(最大可延长时间: ${extendable_time} 分钟)`}
            </span>

					</div>
				</div>

			</div>

			<div class="extend-time-panel-btns">

				<button
					class="cancel-btn"
					onclick={() => {
						show_extend_time = false;
					}}
				>
					取消
				</button>

				<button
					class="confirm-btn"
					onclick={() => {
						show_extend_time = false;
						
						batchOnUpdateExamineeDebounce(
							undefined,
							undefined,
							`00:${extend_time_batch_input_value}:00`
						);
					}}
				>
					确认
				</button>

			</div>

		</div>


	</div>
{/snippet}

{#snippet largeImgPreview()}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div 
    class="large-image-preview-container"
  >
    <div class="large-image-overlay" 
      tabindex="0"
      role="button"
      title="点击关闭大图预览"
      onclick={()=>{
        show_large_image_preview = false;
        large_image_preview_url = "";
      }}
    ></div>

    <div class="large-image-container">
      <img 
          src={large_image_preview_url} 
          alt="大图预览" 
          class="large-image" 
      />
      <button class="close-button" onclick={()=>{
        show_large_image_preview = false;
          large_image_preview_url = "";
        }}
      >
        ×
      </button>
    </div>
  </div>
{/snippet}

<div class="page-container">

  <div class="msg-bar">
    
    <button class="back-btn" onclick={rollback}
      ><img src={ICON.rollback} alt="返回" /></button
    >

    <div class="invigilation-info">
      
      <div class="back-btn-placeholder" style="visibility: hidden;">
        <button class="back-btn"><img src={ICON.rollback} alt="返回" /></button>
      </div>
      
      <div class="top-content">
        <div class="exam-session-name">

          <span class="exam-session-name-text {exam_info.exam_session_name ? "" : "none"}">
            {exam_info.exam_session_name ?? "待下发"}
          </span>

        </div>
        
        <div class="examinee-num">
          <img src={ICON.group} alt="考生人数:" />
          <span class="small-text">
            {exam_info.examinee_num -
              exam_info.absentee_num}/{exam_info.examinee_num ?? 0}</span
          >
        </div>

      </div>

      <div class="bottom-content">
        <div class="exam-time">
          <span class="time-text">考试时间:</span>
          <span class="time-text"
            >{exam_info.start_time}~{exam_info.end_time}</span
          >
        </div>
        <div class="exam-location">
          
          {#if exam_info.exam_mode == "02"}
            <span class="small-text">
              {`${exam_info.exam_site_name} - ${exam_info.exam_room_name}`}
            </span>
          {/if}
        
        </div>

        <div class="exam-status">
          {#if exam_info && exam_info.status === "01"}
            <div class="status-circle" style="background-color:#0052d9;"></div>
            <span class="small-text"
              >{EXAM_SESSION_STATUS[exam_info.status]}</span
            >
          {:else if exam_info && exam_info.status === "02"}
            <div class="status-circle" style="background-color:#4caf50;"></div>
            <span class="small-text"
              >{EXAM_SESSION_STATUS[exam_info.status]}</span
            >
          {:else }
            <div class="status-circle" style="background-color:#9e9e9e;"></div>
            <span class="small-text"
              >已结束</span
            >
          {/if}
        </div>

				<button class="text-btn" 
					onclick={()=>{
						operationLogPanel.showLogPanelWithPagination(logFetchFunc);
					}}
				>
					查看操作日志
				</button>

      </div>

      <div class="back-btn-placeholder" style="visibility: hidden;">
        <button class="back-btn"><img src={ICON.rollback} alt="返回" /></button>
      </div>

    </div>
    
  </div>

  <div class="content">
    <div class="exam-condition">
      
			<div class="sub-title">
        <div class="left-color-block"></div>
        <span>考试情况</span>
      </div>
      
      {#if exam_info.exam_mode == "02"}
        <div class="exam-condition-item">
          <span class="normal-text" style="margin-right: 5px;">基本情况:</span>
          <div class="msg-display">
            <div class="dropdown-container">
              <DropDown
                options={exam_basic_eval}
                selected={exam_info.basic_eval}
                selectOptionFunc={(value) => {
                  exam_info.basic_eval = value;
                  onUpdateInvigilationDebounce(
                    exam_info.exam_session_id,
                    exam_info.exam_room_id,
                    exam_info.record,
                    value
                  );
                }}
                onlyLeftBorder={true}
              ></DropDown>
            </div>
          </div>
        </div>
      {/if}

      <div class="exam-condition-item">
        <span class="normal-text" style="margin-right: 5px;">缺考人数:</span>
        <div class="msg-display">
          <div class="display-num">{exam_info.absentee_num}</div>
        </div>
      </div>
      
			<div class="exam-condition-item">
        <span class="normal-text" style="margin-right: 5px;">作弊人数:</span>
        <div class="msg-display">
          <div class="display-num">{exam_info.cheater_num}</div>
        </div>
      </div>
      
			<div class="exam-condition-item">
        <span class="normal-text" style="margin-right: 5px;">考试异常人数:</span
        >
        <div class="msg-display">
          <div class="display-num">
            {exam_info.abnormal_examinee_num}
          </div>
        </div>
      </div>
      
      <div class="exam-condition-item">
        <span class="normal-text" style="margin-right: 5px;">已延长时间人数:</span
        >
        <div class="msg-display">
          <div class="display-num">
            {exam_info.extended_time_num}
          </div>
        </div>
      </div>

      {#if exam_info.exam_mode == "02"}
			  <div class="exam-condition-item" style="align-items:flex-start;">
          <span class="normal-text" style="margin-right: 5px;">考场记录:</span>
          <div class="msg-display">
            <textarea
              class="exam-condition-textarea"
              placeholder="在此填写考场记录、延长时间原因等"
              bind:value={exam_info.record}
              onchange={handleTextareaChange}
            ></textarea>
            {#if showConfirmButtons}
              <div class="confirm-buttons">
                <button class="confirm-btn" onclick={confirmChanges}>确认</button>
                <button class="cancel-btn" onclick={cancelChanges}>取消</button>
              </div>
            {/if}
          </div>
        </div>
  
        <div class="exam-condition-item">
          <span class="normal-text" style="margin-right: 5px;">证明图片:</span>
          <div class="msg-display">
            <div class="img-list">
              
              <div 
                class="img-item" 
                title="点击上传考试证明图片"
                style="background-color: rgba(0,0,0,0.1);"
              >
                <img
                  src={ICON.add}
                  style="position:absolute; width:50%; height:50%;"
                  alt="上传考试证明图片"
                  class="proof-img"
                />
  
                <input
                  type="file"
                  accept="image/*"
                  multiple="true"
                  style="opacity:0;width:100%;height:100%;cursor:pointer;"
                  onchange={(e)=>{
                    handleUploadProofImg(e);
                  }}
                />
              </div>
  
              {#each curr_proof_imgs as img }
                <div class="img-item">
                  <img
                    src={img}
                    alt="考试证明图片"
                    class="proof-img"
                  />
  
                  <button
                    class="delete-btn"
                    title="移除"
                    onclick={() => {
                      handleDeleteProofImg(img);
                    }}
                  >
                    ⨉
                  </button>
  
                  <button
                    class="preview-btn"
                    title="预览"
                    onclick={() => {
                      openLargeImage(img);
                    }}
                  >
                    预览
                  </button>
  
                </div>
              {/each}
  
            </div>
          </div>
        </div>
			{/if}

    </div>

    <div class="examinee-list">

      <div class="sub-title">
        <div class="left-color-block"></div>
        <span>考生名单</span>
      </div>

      <div class="list-search">

        <div class="list-search-container">
          <span class="label-text">搜索:</span>
          <input
            type="text"
            class="list-search-input"
            placeholder="请输入准考证号、身份证号或姓名"
            bind:value={search_text}
            oninput={(e) => onSearchExamineeDebounce()}
          />
        </div>

        <div class="list-search-container">
          <span class="label-text">批量标记:</span>
          <div class="dropdown-container">
            <DropDown
              options={examinee_status}
              selected={batchOptionValue}
              selectOptionFunc={async (value) => {
                await batchOnUpdateExamineeDebounce(value);
              }}
              placeholder="无"
              onlyLeftBorder={false}
              contentInCenter={true}
              disabled={!rows_is_select || !canUpdateInfo()}
            ></DropDown>
          </div>
        </div>
        
        <div class="list-search-container">
          <span class="label-text">批量备注:</span>
          <input
            type="text"
            class="batch-remark-input"
            placeholder="无"
            bind:value={batchInputValue}
            onchange={async (e) => {
              batchInputValue = e.target.value;
              batchOnUpdateExamineeDebounce("", e.target.value);
            }}
            disabled={!rows_is_select || !canUpdateInfo()}
          />
        </div>
        
        {#if is_admin}
          <div class="list-search-container">
            <button
              class={"operation-btn extend-time"}
              onclick={() => {
                show_extend_time = !show_extend_time;

                extend_time_batch_input_value = 0;

                extendable_time = -1;

                for(let examinee_id in current_select_examinee) {

                  let curr_extendable_time = transformHMSTimeExpression(
                    current_select_examinee[examinee_id].extendable_time,
                    "m"
                  );

                  if (extendable_time == -1) {
                    extendable_time = curr_extendable_time;
                    continue;
                  }

                  extendable_time = Math.min(
                    extendable_time,
                    curr_extendable_time
                  );

                }

              }}
              disabled={!rows_is_select || !canUpdateInfo()}
            >
              延长时间
            </button>
          </div>
        {/if}

        {#if exam_info.exam_mode === "00"}
          <div class="list-search-container">
            <button class={"operation-btn recover"}
              disabled={!rows_is_select || !canUpdateInfo()}
              onclick={() => {
                handleRecoverExaminee();
              }}
            >
              恢复作答
            </button>
          </div>
        {/if}

        <div class="list-search-container">
          <button
            class={"operation-btn reset"}
            onclick={resetExamSelect}
            disabled={!rows_is_select}>取消选中</button
          >

          
        </div>

        <div class="list-search-container">
          <span class="choose_num_text">已选中</span>
          <span class="choose_num">{choose_num}</span>
          <span class="choose_num_text">项</span>
        </div>	

      </div>

      <table class="exam-list-table">
        <thead>
          {@render tableHead()}
        </thead>

        <tbody>
          {#each examinee_list as examinee, index}
            {@render tableRow(examinee, index)}
          {/each}

          {#if examinee_list && examinee_list.length == 0}
            <tr class="exam-list-row" style="height: 100%;">
              <td
                style="display:flex;justify-content: center;align-items:center;width: 100%;height: 100%;font-size: 16px;"
              >
                <span>暂无考生信息</span>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
      <div class="pagination">
        <Pagination
          current_page_num={current_page}
          selected={page_size}
          max_show_page_num={page_size}
          total_data_num={total_row_count}
          total_page_num={Math.ceil(total_row_count / page_size)}
          expand_direction="up"
          selectOptionFunc={(value) => {
            page_size = value;
            renewInvigilationInfo();
          }}
          onPageChooseFunc={(value) => {
            handlePageChange(value);
          }}
          onPageChangeFunc={(is_next) => {
            if (is_next) {
              current_page =
                current_page == Math.ceil(total_row_count / page_size)
                  ? current_page
                  : current_page + 1;
            } else {
              current_page =
                current_page == 1 ? current_page : current_page - 1;
            }

            handlePageChange(current_page);
          }}
					onPageSearchFunc={(value) => {
						current_page = value;
						handlePageChange(current_page);
					}}
        />
      </div>
    </div>
  </div>
</div>

<BubbleMessageComponet bind:this={bubble_message_component}
></BubbleMessageComponet>

<AwesomeLogPanel bind:this={operationLogPanel} />

{#if show_extend_time}
	{@render extendTime()}
{/if}

{#if show_large_image_preview}
  {@render largeImgPreview()}
{/if}


<style lang="scss" scoped>
  
  input,
  textarea,
  button {
    font-family: inherit;
  }

  button {
    margin: 0px;
    padding: 0px;
    border: 0px;
    background-color: transparent;
    cursor: pointer;
    user-select: none;

    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:focus {
      outline: none;
    }
  }

  .small-text {
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }

  .normal-text {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }

  .time-text {
    font-size: 12px;
    color: #333333;
    font-weight: 500;
    color: #666 !important;
  }

  .sub-title {
    display: flex;
    align-items: center;
    margin-top: 10px;
    margin-bottom: 10px;
		width: 100%;
		min-width: fit-content;

    .left-color-block {
      display: block;
      max-width: 4px;
      min-width: 4px;
      height: 100%;
      flex: 1;

      background-color: #0336ff;
    }

    span {
      font-size: 16px;
      font-weight: 500;
      margin-left: 10px;
    }
  }

  span,
  input {
    font-family: PingFang FC;
  }

  .dropdown-container {
    width: 100px;
    height: 34px;
  }

  .exam-list-table {
    color: #0000004d;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: thin;
    box-sizing: border-box;
    overflow: auto;
    margin-top: 10px;
		background-color: inherit;
    scrollbar-gutter: stable both-edges;

    .seat {
      width: 8%;
    }

		.name,
		.status,
		.extra-time {
			width: 15%;
		}
		
		.remark {
			width: 12.5%;
		}

		.exam-card,
		.identity-id {
			width: 14.25%;
		}

		tr {
			display: flex;
			width: 100%;
			min-height: fit-content;
			justify-content: space-between;
			align-items: center;
			min-height: 55px;
			box-sizing: border-box;
			background-color: transparent;
      border-bottom: 1px solid var(--border-light);
		}
    
    thead {
			position: sticky;
      top: 0;
      border-radius: 6px 6px 0 0;
      margin-bottom: 8px;
			background-color: inherit;
			z-index: 3;
    }

    tbody {
      display: block;
      flex-direction: column;
      width: 100%;
			height: 100%;

      tr {

				td {
					display: flex;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					height: 100%;
					min-height: 100%;
					color: #333333;
					min-height: fit-content;
					font-size: 14px;
					font-weight: 400;
					font-family: "Arial", sans-serif;
					box-sizing: border-box;
					text-align: center;
					background-color: transparent;
				}

        .remark input {
					outline: none;
					border: none;
					background-color: transparent;
					resize: none;
					border-radius: var(--border-radius-sm);
					width: 100%;
					height: 40px;
					text-align: center;

					&:hover, &:focus {
						border: 1px solid var(--border-medium);
					}

          &:disabled {
            cursor: not-allowed;
          }

        }

        .extra-time .extra-time-num{
          width: 40%;
					height: 25px;
					resize: none;
					text-align: center;
          font-size: 16px;
        }
      }
    }
  }

  .page-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0px 30px 12px 30px;
    transition: all 0.2s ease;
    min-height: 0;

    .msg-bar {
      display: flex;
      position: relative;
      gap: 10px;
      min-width: 1000px;
      background-color: #fff;
      border-radius: 5px;
      flex-shrink: 0;
      overflow: hidden;
      border: 1px solid var(--border-light);
      margin-top: 5px;
      transition: all 0.2s ease;

      border-radius: var(--border-radius-sm);
      transition:
        transform 0.2s,
        box-shadow 0.2s;

      .back-btn {
        width: fit-content;
        height: fit-content;
        box-shadow: none;
        background-color: #e9e9e9;

        padding: 2px 10px;

        border-top-left-radius: 5px;
      }

      .back-btn-placeholder {
        user-select: none;
        pointer-events: none;
      }

      .invigilation-info {
        display: flex;
        flex-direction: column;

        .top-content {
          display: flex;
          flex-shrink: 0;
          align-items: flex-end;
          margin-left: 20px;

          .exam-session-name {
            display: flex;
            align-items: baseline;

            .exam-session-name-text {
              font-size: 28px;
              font-weight: 600;
              color: #333;
              line-height: 1;

              &.none {
                color: var(--text-secondary);
              }

            }
          }

          .examinee-num {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 0 10px 0 10px;

            img {
              width: 18px;
              height: 18px;
              vertical-align: middle;
            }
          }
        }

        .bottom-content {
          display: flex;
          gap: 20px;
          flex-shrink: 0;

          margin-left: 20px;
          margin-top: 20px;
          align-items: baseline;

          .exam-time {
            display: flex;
            width: fit-content;
          }

          .exam-location {
            display: flex;
            width: fit-content;
          }

          .exam-status {
            display: flex;
            align-items: baseline;

            .status-circle {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              margin-right: 5px;
              align-self: center;
            }

            .small-text {
              line-height: 1;
            }
          }
        }
      }

      
    }

    .content {
      display: flex;
      margin-top: 5px;
      transition: all 0.2s ease;
      flex: 1;
      min-height: 0;
			background-color: var(--bg-primary);
      
      .exam-condition {
        display: flex;
        flex-direction: column;
        background-color: var(--bg-primary);
        border-radius: 5px;
        max-width: 30%;
        min-width: 220px;
        flex: 1;
        box-sizing: border-box;
        overflow-y: auto;
        scrollbar-gutter: stable both-edges;
        border-radius: 8px;
        transition:
          transform 0.2s,
          box-shadow 0.2s;

        border: 1px solid var(--border-light);
        border-radius: var(--border-radius-sm);

        padding: 5px 10px 5px 10px;

        .exam-condition-item {
          display: flex;
          width: 100%;
          align-items: baseline;
          justify-content: flex-end;
          padding: 5px 15px 5px 5px;
          box-sizing: border-box;

          .normal-text {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            width: 30%;
            min-width: fit-content;
            padding-right: 10px;
          }

          .msg-display {
            position: relative;
            width: 65%;
            flex-shrink: 0;

            .display-num {
              padding: 4px;
              background-color: rgb(240, 240, 240);
              width: 40%;
              height: 26px;
            }

            .exam-condition-textarea {
              display: block;
              resize: none;
              border: none;
							outline: none;
              height: 150px;
              width: 100%;
							border: 1px solid var(--border-light);
							background-color: var(--bg-secondar);
              border-radius: var(--input-border-radius);

              &:hover, &:focus {
								
                border: 1px solid var(--border-dark);
              }
            }
          }

          .confirm-buttons {
            display: flex;
            justify-content: flex-end;
            margin-top: 2px;
            gap: 10px;
          }

          .confirm-btn,
          .cancel-btn {
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
          }

          .confirm-btn {
            background-color: var(--primary-color);
            color: white;
          }

          .cancel-btn {
            background-color: var(--bg-secondary);
            color: var(--text-secondary);
          }
        }
      }

      .examinee-list {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 800px;
        min-height: 400px;
        border-radius: 5px;
        margin-left: 5px;
        padding: 5px 10px 5px 10px;
        background-color: inherit;
        box-sizing: border-box;

        border-radius: 8px;
        transition:
          transform 0.2s,
          box-shadow 0.2s;

        border: 1px solid var(--border-light);
        border-radius: var(--border-radius-sm);
        

        .list-search {
          display: flex;
          align-items: baseline;
          z-index: 5;
          
          .list-search-container {
            display: flex;
            align-items: center;
						width: fit-content;
            min-width: fit-content;
            padding: 0px 5px;

          }

          span {
            min-width: fit-content;
            font-size: 14px;
            padding: 0px 4px;
          }

          .list-search-input {
            outline: none;
            border: #e9e9e9 1px solid;
            padding: 8px;
            width: 200px;
            border-radius: 3px;
            font-size: 12px;
            line-height: 14px;
          }
          
        }

        .operation-btn {
          width: 70px;
          height: 32px;
          border: none;
          border-radius: 3px;
          color: white;
          
          font-size: 14px;
          cursor: pointer;

          &:disabled {
            color: white;
            background-color: var(--border-medium);
						cursor: not-allowed;
          }

          &.reset {
            background-color: var(--text-secondary);

            &:disabled {
              color: white;
              background-color: var(--border-medium);
              cursor: not-allowed;
            }
          }

          &.extend-time {
            background-color: var(--blue);

            &:disabled {
              color: white;
              background-color: var(--border-medium);
              cursor: not-allowed;
            }
          }

          &.recover {
            background-color: var(--green);

            &:disabled {
              color: white;
              background-color: var(--border-medium);
              cursor: not-allowed;
            }
          }

        }

        .batch-remark-input {
          outline: none;
          border:  1px solid var(--border-dark);
          padding: 8px;
          width: 100px;
          border-radius: 3px;
          text-align: center;
          font-size: 12px;
          line-height: 14px;

          &:disabled {
            cursor: not-allowed;
            border:  1px solid var(--border-light);

          }

          &:hover, &:focus {
            border: 1px solid var(--border-light);
          }

        }

        .choose_num_text {
          font-size: 12px;
          min-width: fit-content;
        }

        .choose_num {
          display: flex;
          justify-content: center;
          font-size: 16px;
          color: #0052d9;
          min-width: 20px;
        }
      }
    }
  }

  @media screen and (max-width: 1200px) {
    .page-container {
      padding: 0px;
      transition: all 0.2s ease;

      .msg-bar {
        transition: all 0.2s ease;
        margin-top: 0px;
        border: 0px;
        border-radius: 0px;

        box-shadow: none;
      }

      .content {
        transition: all 0.2s ease;
        margin-top: 0px;

        .exam-condition {
          border: 0px;
          border-radius: 0px;

          box-shadow: none;
        }

        .examinee-list {
          transition: all 0.2s ease;
          margin-left: 0px;
          border: 0px;
          border-radius: 0px;

          box-shadow: none;
        }
      }
    }
  }

  .pagination {
    margin-top: 10px;
    display: flex;
    width: 100%;
    height: fit-content;
    justify-content: flex-end;
    align-items: center;
  }

  .square-container {
    width: 19px;
    height: 19px;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 2px solid #e5e6eb;
    padding: 0 0 0 0;

    &:hover {
      background-color: #e0e0e0;
      border-color: #aaa;
    }

    &:disabled {
      background-color: white;
      cursor: not-allowed;
    }

  }

  .check-square {
    width: 11px;
    height: 11px;
    background-color: #165dff;
  }

  .text-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    color: var(--blue);
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 2px 4px;
    border-radius: var(--btn-border-radius);
    transition: all 0.2s;
    white-space: nowrap;
    box-shadow: none;

    &:hover {
      font-weight: bold;
      text-decoration: underline;
    }

  }

	.extend-time-container {
		display: flex;
		position: fixed;
		justify-content: center;
		align-items: center;
		width: 100vw;
		height: 100vh;
		top: 0;
		left: 0;
		z-index: 10;

		.extend-time-panel {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			position: relative;
			width: 400px;
			min-height: 200px;
			max-height: max-content;
			background-color: var(--bg-primary);
			border-radius: var(--border-radius-sm);
			padding: 15px;
			z-index: 10;
			box-sizing: border-box;

			.extend-time-panel-title {
				position: absolute;
				left: 10px;
				top: 10px;
				font-size: 18px;
				font-weight: bold;
			}

			.extend-time-panel-form {
				display: flex;
				flex-direction: column;
				width: 100%;
				height: 90%;
				padding: 30px 0 5px 0;
				box-sizing: border-box;


				.extend-time-panel-form-item {
					display: flex;
					justify-content: flex-end;
					align-items: flex-start;
					padding: 0px 15px 0px 5px;
					margin: 5px 0 5px 0;
					min-width: 100%;
					max-width: 100%;
					min-height: 50px;
					max-height: 250px;
					box-sizing: border-box;

					span {
						min-width: fit-content;
						height: 100%;
					}

					.extend-time-panel-form-item-content {
						display: flex;
						align-items: flex-start;
						min-width: 70%;
						max-width: 70%;
						min-height: 30px;
						max-height: 250px;
						flex-wrap: wrap;
						overflow: auto;
						margin-left: 10px;

						.input-container {
							display: flex;
							align-items: center;
						}

						input {
							width: 50px;
							height: 25px;
							text-align: center;
							outline: none;
							padding: 0px 2px;
							margin: 0px 4px;
							border: 1px solid var(--border-medium);
						}

						.name-item {
							padding: 2px 5px;
							color: var(--primary-color);

							button {
								color: var(--primary-color);
								box-shadow: none;
								background-color: transparent;

								&:hover {
									font-weight: bold;
								}

							}

							&:hover {
								text-decoration: underline;
							}

						}

					}


				}
			}

			.extend-time-panel-btns {
				bottom: 15px;

				button {
					width: 80px;
					height: 30px;
					border: none;
					box-shadow: none;
					padding: 0px 10px;
					margin: 0px 10px;
				}

				.confirm-btn {
					background-color: var(--primary-color);
					color: white;
					border-radius: var(--border-radius-sm);

					&:hover {
						background-color: var(--primary-hover);
					}
				}

				.cancel-btn {
					background-color: var(--bg-secondary);
					color: var(--text-secondary);
					border-radius: var(--border-radius-sm);

					&:hover {
						background-color: var(--bg-thirdary);
					}
				}

			}

		}

		.extend-time-bg {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: rgba(0, 0, 0, 0.5);
			z-index: 9;
		}

	}

  .img-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    max-height: 300px;
    width: 250px;
    overflow-y: auto;

    .img-item {
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      width: 100px;
      height: 80px;
      padding: 5px;
      border: 1px solid var(--border-light);
      border-radius: var(--border-radius-sm);
      margin: 2px;

      img {
        width: 100%;
        height: 100%;

      }

      .delete-btn {
        display: none;
        position: absolute;
        justify-content: center;
        align-items: center;
        top: 2px;
        right: 5px;
        width: 16px;
        height: 16px;
        font-size: 14px;
        border-radius: var(--btn-border-radius);
        text-align: center;
        z-index: 3;

        &:hover {
          color: red;
          background-color: var(--bg-secondary);
        }

      }

      .preview-btn {
        display: none;
        position:absolute;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.2);
      }

      &:hover {
        .delete-btn, .preview-btn {
          display: flex;
        }
      }
    }
  }

  /* 大图预览相关样式 */
  .large-image-preview-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(3px);
  }

  .large-image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      cursor: pointer;
  }

  .large-image-container {
      position: relative;
      max-width: 90%;
      max-height: 90%;
      background-color: white;
      border-radius: 5px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }

  .large-image {
      display: block;
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
  }

  .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: background-color 0.2s ease;

      &:hover {
          background-color: rgba(0, 0, 0, 0.7);
      }
  }
  
</style>
