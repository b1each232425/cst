<!--
 * @Author: qjj && qiaojunjie6@qq.com
 * @Date: 2025-07-25 10:51:51
 * @Author: qjj && qiaojunjie6@qq.com
 * @LastEditTime: 2025-07-28 18:54:51
 * @FilePath: \src\routes\teacher\question-bank-management\theory\newBank\+page.svelte
 * @Description: 理论题库新建页
 * @LastEditors: qjj 
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
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import QuestionList from '../../_components/questionList.svelte';
  import FilterBar from '../../_components/FilterBarForQuestionBank.svelte';
  import BankTag from '../../_components/editableTag.svelte';
  import Dropdown from '../../_components/DropDownForQuesitonBank.svelte';
  import SingleSelectEditPanel from '../../_components/singlePage.svelte';
  import MultipleSelectEditPanel from '../../_components/multiplePage.svelte';
  import JudgeSelectEditPanel from '../../_components/judgePage.svelte';
  import QuestionPreviewPanel from '../../_components/QuestionPreviewPanel.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { compareBankMsg } from '../../utils/utils.js';
  import { formatTimestamp } from '../../utils/time_utils.js';
  import { TheoryQuestion } from '../type';
  import SinglePage from '../../_components/singlePage.svelte';
  import { get } from 'svelte/store';


  /**
   * @description ICON集合
   */
  const ICON = {
    rollback: '/theory_question_bank/icons/rollback.svg',
    edit: '/theory_question_bank/icons/edit.svg',
    compelete: '/theory_question_bank/icons/compelete.svg',
    Xacross: '/theory_question_bank/icons/Xacross.svg',
    bankTag: '/theory_question_bank/icons/bankTag.svg',
    checkbox_slected: '/theory_question_bank/icons/checkbox_selected.svg',
    checkbox_unselected: '/theory_question_bank/icons/checkbox_unselected.svg',
  };

  /**
   * @description 预览面板显示
   * @type {boolean}
   */
  let show_preview_panel = $state(false);

  /**
   * @description 预览面板数据
   * @type {TheoryQuestion}
   */

  /**
   * @description 题目标签
   * @type {Array<string>}
   */
  let all_question_tags = $derived.by(() => {
    /**
     * @type {Array<string>}
     */
    let question_tags = [];
    questions.forEach((item) => {
      if (item.tags) {
        item.tags.forEach(
          /**
           * @param tag {string}
           */
          (tag) => {
            if (!question_tags.includes(tag)) {
              question_tags.push(tag);
            }
          },
        );
      }
    });
    return question_tags;
  });

  /**
   * @description 题库名称输入框
   * @type {HTMLInputElement}
   */
  let bank_name_input;

  /**
   * @description 题库名称
   * @type {string}
   */
  let bank_name = $state('未命名题库');

  /**
   * @description 清空题库名称输入框按钮
   * @type {HTMLButtonElement}
   */
  let clean_bank_input_btn;

  /**
   * @description 题库修改保存按钮
   * @type {HTMLButtonElement|undefined}
   */
  let bank_data_save_btn = $state();
  /**
   * @description 题库修改不保存按钮
   * @type {HTMLButtonElement|undefined}
   */
  let bank_data_not_save_btn = $state();

  /**
   * @description 题库标签列表
   * @type {string[]}
   */
  let bank_tags = $state([]);
  /**
   * @description 题库原始数据
   * @type {{
   *   name: string,
   *   tags: string[],
   * }}
   */
  let origin_bank_data = {
    name: '未命名题库',
    tags: [],
  };

  /**
   * @description 返回题库列表页
   */
  const onGoBackToQuestionBankList = () => {
    // window.location.href = "/teacher/questionBank/theory";
    goto('/teacher/question-bank/theory');
  };
  /**
   * @description 题目类型
   */
  let question_types = $state([
    {
      value: '00',
      label: '单选',
    },
    {
      value: '02',
      label: '多选',
    },
    {
      value: '04',
      label: '判断',
    },
   
  ]);

  /**
   * @description 请求锁
   */
  let request_lock = $state(false);
  /**
   * @description 打开添加新题目面板
   * @param {string} value
   */
  /**
   * @description 新建题目类型
   * @type {"00"|"02"|"04"|"06"|"08"|""}
   */
  /**
   * @description 待编辑题目内容
   * @type {TheoryQuestion | null}
   */
  /**
   * @description 是否又未提交的修改
   * @type {boolean}
   */

  /**
   * @description 显示单选题编辑面板
   * @type {boolean}
   */
  let show_single_select_edit_panel = $state(false);

  /**
   * @description 单选题编辑面板组件
   * @type {SingleSelectEditPanel}
   */
  let single_select_edit_panel_componet;

  /**
   * @description 显示多选题编辑面板
   * @type {boolean}
   */
  let show_multiple_select_edit_panel = $state(false);

  /**
   * @description 多选题编辑面板组件
   * @type {MultipleSelectEditPanel}
   */
  let mutiple_select_edit_panel_componet;

  /**
   * @description 显示判断题编辑面板
   * @type {boolean}
   */
  let show_judge_select_edit_panel = $state(false);

  /**
   * @description 判断题编辑面板组件
   * @type {JudgeSelectEditPanel}
   */
  let judge_edit_panel_componet;
  let is_dirty = false;
  let modifying_question = $state(null);
  let new_question_type = $state('');
  /**
   * @description 题目类型筛选条件
   * @type {Array<string>}
   */
  let question_type_fileter = $state([]);

  /**
   * @description 题目难度筛选条件
   * @type {Array<number>}
   */
  let question_difficulty_fileter = $state([]);
  /**
   * @description 题目标签筛选条件
   * @type {Array<string>}
   */
  let question_tag_fileter = $state([]);
  /**
   * @description 搜索文本
   * @type {string}
   */
  let search_question_content = $state('');
  /**
   * @description 符合筛选条件的题目数量
   */
  let question_filtered_count = $state(0);

  /**
   * @description 题库更新时间
   */
  let bank_update_time = $state('2025-04-01 10:51:51');

  /**
   * @description 题库创建时间
   */
  let bank_create_time = $state('2025-04-01 10:51:51');
  /**
   * @description 筛选条件选择
   * @param {(string|number)[]} value
   * @param {string} condition
   */

  /**
   * @description 当前页码
   * @type {number}
   */
  let current_page = $state(1);
  /**
   * @description 每页显示的题目数量
   * @type {number}
   */
  let page_size = $state(10);

  /**
   * @description 题目数据
   * @type {TheoryQuestion[]}
   */
  let questions = $state([]);

  /**
   * @description 题目数量
   * @type {number}
   */
  let question_count = $state(0);

  /**
   * @description 题库标签输入框内容
   * @type {string}
   */
  let tag_content = $state('');

  /**
   * @description 题库标签变更
   * @param {string} old_content
   * @param {string} new_content
   */
  /**
   * @description 题目标签
   * @type {Array<string>}
   */
  /**
   * @description 筛选条件集合
   */
  let filter_conditions = $derived.by(() => {
    return {
      type: question_type_fileter,
      difficulty: question_difficulty_fileter,
      tags: question_tag_fileter,
    };
  });

   /**
     * @description 已有标签变更
     * @param {string} old_content
     * @param {string} new_content
     * @param {number} index
     */
    const onSaveBankTagChange = (old_content, new_content, index) => {
        const value = new_content.trim();

        if (value === "") return;

        let new_tags = JSON.parse(JSON.stringify(bank_tags));
        new_tags[index] = value;
        bank_tags = [...new_tags];

        onQuestionBankDataChange();
    };
  /**
   * @description 列表点击编辑
   * @param {TheoryQuestion} question
   */
  const onListTableClickEdit = (question) => {
    modifying_question = question;
    is_dirty = true;

    switch (question.type) {
      case '00':
        single_select_edit_panel_componet.initPanel();
        show_single_select_edit_panel = true;
        break;
      case '02':
        mutiple_select_edit_panel_componet.initPanel();
        show_multiple_select_edit_panel = true;
        break;
      case '04':
        judge_edit_panel_componet.initPanel();
        show_judge_select_edit_panel = true;
        break;
      default:
        return;
    }
  };

  const onAddNewQuestion = (value) => {
    if (request_lock) {
      toast.warning('请等待当前操作完成后再进行其他操作');
      return;
    }
    if (value !== '00' && value !== '02' && value !== '04' && value !== '06' && value !== '08') {
      return;
    }

    new_question_type = value;
    modifying_question = null;
    is_dirty = true;
    switch (value) {
      case '00':
        single_select_edit_panel_componet.initPanel();
        show_single_select_edit_panel = true;
        break;
      case '02':
        mutiple_select_edit_panel_componet.initPanel();
        show_multiple_select_edit_panel = true;
        break;
      case '04':
        judge_edit_panel_componet.initPanel();
        show_judge_select_edit_panel = true;
        break;

      default:
        return;
    }
  };

  /**
   * @description 清空题库名称输入框
   */
  const onCleanBankNameInput = () => {
    if (bank_name_input) {
      bank_name_input.value = '';
      clean_bank_input_btn.style.visibility = 'hidden';
    }
  };

  /**
   * 添加题目
   * @param {Partial<TheoryQuestion>} new_question_data
   */
  export function AddNewQuestion(new_question_data) {
    // 构建 body 数据
    const data = [
      {
        Type: new_question_type,
        Difficulty: new_question_data.difficulty,
        Content: new_question_data.content,
        Tags: new_question_data.tags,
        Options: new_question_data.options,
        Answers: new_question_data.answers,
        Analysis: new_question_data.analysis,
        Score: new_question_data.score,
        QuestionAttachmentsPath: new_question_data.question_attachments_path,
        BelongTO: bank_id,
      },
    ];

    return fetch('/api/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP错误`);
        }
        return response.json();
      })
      .then((result) => {
        if (result.status !== 0) {
          throw new Error(`${result.msg}`);
        }
        question_count++;
        toast.success('添加题目成功');
        return getQuestionList().then(() => result); // 确保 getQuestionList() 执行后再返回 result
      })
      .catch((error) => {
        toast.error(`添加题目失败:${error.message}`);
        return;
      });
  }

  /**
   * @description 题目编辑确认
   * @param {Partial<TheoryQuestion>} new_question_data
   */
  const onEditPanelConFirm = async (new_question_data) => {
    //新增题目
    if (new_question_type != '') {
      const result = await AddNewQuestion(new_question_data);
      if (result.status == 0) {
        show_single_select_edit_panel = false;
        show_multiple_select_edit_panel = false;
        show_judge_select_edit_panel = false;
        modifying_question = null;
        new_question_type = '';
        is_dirty = false;
      } else {
        toast.error('添加题目失败: ' + result.msg);
      }
    }
  };

  /**
   * @description 输入题目搜索关键字
   * @param {Event} e
   */
  const onSearchQuestionKeyInput = (e) => {
    if (e.target && 'value' in e.target && typeof e.target.value === 'string') {
      const value = e.target.value;
   
      // 抖动
     
        search_question_content = value;
        list_table_component.updateFilteredQuestion(filter_conditions, value);
      
    }
  };
  /**
   * @description 题库数据校验
   */
  function onConfirmUpdateQuestionBankData() {
    if (bank_name.trim() === '') {
      toast.error('题库名称不能为空');
      return;
    }

    // 构造请求体
    const requestData = {
      name: bank_name,
      tags: bank_tags,
      id: bank_id,
      type: '00',
    };

    fetch('/api/question-banks', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: requestData }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP错误`);
        }
        return response.json();
      })
      .then((result) => {
        if (result.status !== 0) {
          throw new Error(`${result.msg}`);
          return;
        }
        toast.success('题库数据保存成功');

        // 更新题库原始数据
        origin_bank_data.name = bank_name;
        origin_bank_data.tags = bank_tags;
        bank_update_time = formatTimestamp(new Date().getTime());

        // 隐藏保存按钮
        if (bank_data_save_btn && bank_data_not_save_btn) {
          bank_data_save_btn.style.visibility = 'hidden';
          bank_data_save_btn.style.opacity = '0';
          bank_data_not_save_btn.style.visibility = 'hidden';
          bank_data_not_save_btn.style.opacity = '0';
        }
        is_dirty = false;

        return result;
      })
      .catch((error) => {
        toast.error(`保存题库数据失败:${error.message}`);
        return;
      });
  }

  $effect(() => {
    getQuestionList();
  });

  export function getBankWithQuestions() {
    // 构造查询参数（Query Params）
    const queryParams = new URLSearchParams({
      bankID: bank_id,
      page: current_page,
      pageSize: page_size,
      type:question_type_fileter,
      difficulty:question_difficulty_fileter,
     
    });

    return fetch(`/api/questions?${queryParams}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP错误`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.status !== 0) {
         throw new Error (`${data.msg}`);
        }
         toast.success(`获取试题列表成功`);
        return data;
      })
      .catch((error) => {
        toast.error(`获取试题列表失败:${error.message}`);
        return;
      });
  }

  /**
   * 是否初始化
  */

  let init=1;
  /**
   * @description 获取题目列表
   */
  const getQuestionList = async () => {
    if(bank_id==0){
      return ;
    }
    // 拉取题目列表
    request_lock = true;
    const response = await getBankWithQuestions();
    const data = response.data || null;
    request_lock = false;
    if (init == 1) {
      init=0;
    if(data!=null){
      question_count=response.rowCount;
    }
    }

     if(data!=null){
       question_filtered_count = response.rowCount;
    }
   
    questions = [];
    if(data!=null){
    for (let i = 0; i < data.length; i++) {
      questions.push({
        id: data[i].ID,
        content: data[i].Content,
        type: data[i].Type,
        options: data[i].Options,
        answers: data[i].Answers,
        analysis: data[i].Analysis,
        difficulty: data[i].Difficulty,
        tags: data[i].Tags,
        update_time: data[i].UpdateTime,
        update_time_str: formatTimestamp(data[i].UpdateTime),
        score: data[i].Score,
        question_attachments_path: data[i].QuestionAttachmentsPath,
      });
    }
  }
  };

  /**
   * @description 题目id
   * @type {number}
   */
  let bank_id = $state(0);

  onMount(async () => {
    let start = new Date().getTime();
    console.log('start loading ', start);
    if (localStorage) {
      let question_bank_data_json = localStorage.getItem('question_bank_data');
      if (question_bank_data_json) {
        let question_bank_data = JSON.parse(question_bank_data_json);
        bank_id = question_bank_data.id;
        bank_create_time = formatTimestamp(question_bank_data.create_time);
        origin_bank_data.name = question_bank_data.name;
        origin_bank_data.tags = question_bank_data.tags || [];
        bank_name = question_bank_data.name;
        bank_tags = question_bank_data.tags || [];
        bank_update_time = formatTimestamp(question_bank_data.update_time);
      }
    } else {
      toast.error('无法获得题库数据');
      return;
    }

    
  });

  /**
   * @description 题目列表组件
   * @type {ListTable}
   */
  let list_table_component;
  const filterConditionSelect = (value, condition) => {
    // 单线程JS可能更新不过来，故在此手动同步更新
    /**
     * @type {string[]}
     */
    let filter_string_value = [];
    /**
     * @type {number[]}
     */
    let filter_number_value = [];
    if (condition === 'type' || condition === 'tag') {
      filter_string_value = value.filter((item) => typeof item === 'string');
    } else if (condition === 'difficulty') {
      filter_number_value = value.filter((item) => typeof item === 'number');
    }

    if (condition === 'type') {
      question_type_fileter = filter_string_value;
    } else if (condition === 'tag') {
      question_tag_fileter = filter_string_value;
    } else if (condition === 'difficulty') {
      question_difficulty_fileter = filter_number_value;
    }

    filter_conditions = {
      type: question_type_fileter,
      difficulty: question_difficulty_fileter,
      tags: question_tag_fileter,
    };

   
  };

  /**
   * @description 题目编辑取消
   */
  const onEditPanelCancel = async () => {
    show_single_select_edit_panel = false;
    show_multiple_select_edit_panel = false;
    show_judge_select_edit_panel = false;
    modifying_question = null;
    new_question_type = '';
    is_dirty = false;
  };

  /**
   * @description 删除tag
   * @param {string} tagText
   */
  const onDeleteTag = async (tagText) => {
    let new_tags = JSON.parse(JSON.stringify(bank_tags));
    const index = new_tags.indexOf(tagText);
    if (index !== -1) {
      new_tags.splice(index, 1);
    }
    bank_tags = [...new_tags];

    onQuestionBankDataChange();
  };
  /**
   * @description 题库数据不保存
   */
  const onGiveUpQuestionBankDataUpdate = () => {
    is_dirty = false;
    bank_name = JSON.parse(JSON.stringify(origin_bank_data.name));
    bank_tags = JSON.parse(JSON.stringify(origin_bank_data.tags));

    if (!bank_data_save_btn || !bank_data_not_save_btn) return;

    bank_data_save_btn.style.visibility = 'hidden';
    bank_data_save_btn.style.opacity = '0';
    bank_data_not_save_btn.style.visibility = 'hidden';
    bank_data_not_save_btn.style.opacity = '0';
  };

  const addNewBankTag = (old_content, new_content) => {
    const value = new_content.trim();
    if (value === '') return;
    if (bank_tags.includes(value)) {
      tag_content = '';
      return;
    }

    bank_tags = [value, ...bank_tags];
    tag_content = '';

    onQuestionBankDataChange();
  };
  /**
   * @description 题目类型映射
   */
  let question_types_map = $derived.by(() => {
    return new Map(question_types.map((item) => [item.value, item.label]));
  });

  /**
   * @description 题库数据变更处理
   */
  const onQuestionBankDataChange = () => {
    let compare_res = compareBankMsg(origin_bank_data, {
      name: bank_name,
      tags: bank_tags,
    });

    if (compare_res) {
      is_dirty = false;
      if (!bank_data_save_btn || !bank_data_not_save_btn) return;

      bank_data_save_btn.style.visibility = 'hidden';
      bank_data_save_btn.style.opacity = '0';
      bank_data_not_save_btn.style.visibility = 'hidden';
      bank_data_not_save_btn.style.opacity = '0';
      return;
    }

    is_dirty = true;
    if (!bank_data_save_btn || !bank_data_not_save_btn) return;
    bank_data_save_btn.style.visibility = 'visible';
    bank_data_save_btn.style.opacity = '1';
    bank_data_not_save_btn.style.visibility = 'visible';
    bank_data_not_save_btn.style.opacity = '1';
  };

  /**
   * @description 预览面板数据
   * @type {TheoryQuestion}
   */
  let preview_question_data = $state({
    id: 0,
    content: '',
    type: '',
    options: [],
    answers: [],
    analysis: '',
    difficulty: 1,
    tags: [],
    update_time: new Date().getTime(),
    update_time_str: '',
    score: 0,
    question_attachments_path: [],
  });

  /**
   * @description 关闭预览面板
   */
  const onClosePrviewPanel = () => {
    show_preview_panel = false;
  };
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

<div class={`questionPrviewPanel ${show_preview_panel ? 'show' : 'hide'}`}>
  <QuestionPreviewPanel question={preview_question_data} closePanel={onClosePrviewPanel}></QuestionPreviewPanel>
</div>

<div class="pageContainer">
  <!-- 回退栏 -->
  <div class="rollbackBar">
    <button class="rollbackContainer" onclick={onGoBackToQuestionBankList}>
      <svg
        class="rollbankImg"
        version="1.1"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        width="31px"
        height="29px"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="matrix(1 0 0 1 -50 -10 )">
          <path
            d="M 5.26328055923079 7.25009103583336  L 9.18942268999992 3.27117873333336  L 7.50324543692308 1.56233725166668  L 1.54170668923081 7.60400370083331  C 1.07608146692313 8.07588713333335  1.07608144307696 8.84096148416668  1.54170654615377 9.31284503750001  L 7.50324543692308 15.3545115108333  L 9.18942268999992 13.645670585  L 5.26328055923079 10  L 19.0771026384617 10  C 23.0280638461538 9.66675770250003  26.2309487923078 12.9126923466667  26.2309487923078 16.9167577025  C 26.2309487923078 20.9208230583334  23.0280638461538 24.1667587416667  19.0771026384617 24  L 7.15402638307703 24  L 7.15402638307703 26.5834254083334  L 19.0771026384617 26.5834254083334  C 24.3450492461539 26.5834254083334  28.6155641769232 22.255509875  28.6155641769232 16.9167577025  C 28.6155641769232 11.5780054333334  24.3450492461539 7.25009103583336  19.0771026384617 7.25009103583336  L 5.26328055923079 7.25009103583336  Z "
            fill-rule="nonzero"
            fill="#000000"
            stroke="none"
            fill-opacity="0.996078431372549"
            transform="matrix(1 0 0 1 50 10 )"
          />
        </g>
      </svg>
      <span class="rollbackText">返回题库列表</span>
    </button>
  </div>

  <!-- 题库信息栏 -->
  <div class="bankMsgBar">
    <div class="leftColorBlock"></div>
    <div class="contentContainer">
      <div class="leftContent">
        <div class="bankNameContainer">
          <img class="editImg" src={ICON.edit} alt="editImg" />
          <div class="bankNameInputOutBorder">
            <input
              type="input"
              class="bankNameInput"
              placeholder="请输入题库名"
              bind:this={bank_name_input}
              bind:value={bank_name}
              oninput={onQuestionBankDataChange}
            />
            <button class="cleanBankNameInputBtn" bind:this={clean_bank_input_btn} onclick={onCleanBankNameInput}>
              <img class="cleanBankNameInputImg" src={ICON.Xacross} alt="cleanIputImg" />
            </button>
          </div>

          <button class="saveBankDataUpdateBtn" bind:this={bank_data_save_btn} onclick={onConfirmUpdateQuestionBankData}
            >保存修改</button
          >
          <button
            class="giveUpBankDataUpdateBtn"
            bind:this={bank_data_not_save_btn}
            onclick={onGiveUpQuestionBankDataUpdate}>放弃修改</button
          >
        </div>

        <div class="bankTagContainer">
          <img class="bankTagImg" src={ICON.bankTag} alt="bankTagImg" />
          <div class="bankTags">
            <BankTag
              bind:content={tag_content}
              handle_funcs={{
                onchange: addNewBankTag,
                delete: () => {
                  tag_content = '';
                },
              }}
            />
            {#each bank_tags as tag, index}
              <BankTag
                content={tag}
                handle_funcs={{
                  onchange: (old_content, new_content) => onSaveBankTagChange(old_content, new_content, index),
                  delete: () => {
                    onDeleteTag(tag);
                  },
                }}
              />
            {/each}
          </div>
        </div>

        <div class="bankTimeContainer">
          <span class="timeText">更新时间：{bank_update_time}</span>
          <span class="timeText">创建时间：{bank_create_time}</span>
        </div>
      </div>
      <div class="rightContent">
        <button class="normalBtn">
          <span>共享题库</span>
        </button>
        <button class="normalBtn" style="margin-right: 40px;margin-left:0px;">
          <span>展示日志</span>
        </button>
        <div class="questionCountContainer">
          <span class="questionCountText">题量总计</span>
          <span class="questionCountNum">{question_count}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 题库内容栏 -->
  <div class="bankContent">
    <div class="quesionFilter">
      <div class="questionFilterTitle">
        <div class="colorHolder"></div>
        <div style="display: flex;">
          <div class="leftColorBlock"></div>
          <span class="questionFilterTitleText">试题筛选</span>
        </div>
      </div>
      <FilterBar
        filter_title="题型"
        all_filter_conditions={question_types}
        onSelectTag={(value) => filterConditionSelect(value, 'type')}
      ></FilterBar>

      <FilterBar
        filter_title="难度"
        all_filter_conditions={[
          {
            value: 1,
            label: '简单',
          },
          {
            value: 2,
            label: '中等',
          },
          {
            value: 3,
            label: '困难',
          },
        ]}
        onSelectTag={(value) => filterConditionSelect(value, 'difficulty')}
      ></FilterBar>
      <div class="hiddenValue">
      <FilterBar
          
        filter_title="标签"
        all_filter_conditions={all_question_tags.map((tag) => {
          return {
            value: tag,
            label: tag,
          };
        })}
        onSelectTag={(value) => filterConditionSelect(value, 'tag')}
      ></FilterBar>
      </div>
    </div>
    <div class="questionListContainer">
      <div class="questionListTitle">
        <div class="leftColorBlock"></div>
        <span class="questionListTitleText">试题列表</span>
        <span>共筛选{question_filtered_count}道题</span>
      </div>
      <div class="questionListControlBar">
        <div class="questionListSearch">
          <span>搜索</span>
          <input
            type="text"
            class="questionListSearchInput"
            placeholder="请输入题目名称"
            oninput={onSearchQuestionKeyInput}
          />
        </div>
        <div class="questionListControlBtnContainer">
          <button class="questionListControlBtn normalBtn">
            <span>粘贴题目</span>
          </button>

          <Dropdown options={question_types} placeholder="添加题目" selectOptionFunc={onAddNewQuestion}></Dropdown>

          
        </div>
      </div>
      <QuestionList
        bind:this={list_table_component}
        bind:question_count={question_filtered_count}
        bind:question_data={questions}
        bind:page_size
        bind:current_page
        question_types={question_types_map}
        on:pageChange={(e) => (current_page = e.detail)}
        on:pageSizeChange={(e) => (page_size = e.detail)}
        onListItemClick={(question) => {
          preview_question_data = question;
          show_preview_panel = true;
        }}
        onEdit={onListTableClickEdit}
      ></QuestionList>
    </div>
  </div>
</div>

<SingleSelectEditPanel
  bind:this={single_select_edit_panel_componet}
  show={show_single_select_edit_panel}
  question_data={modifying_question !== null ? modifying_question : undefined}
  is_new_question={new_question_type === '00'}
  onCancel={async () => {
    await onEditPanelCancel();
  }}
  onConfirm={async (new_question_data) => {
    await onEditPanelConFirm(new_question_data);
  }}
></SingleSelectEditPanel>

<MultipleSelectEditPanel
  bind:this={mutiple_select_edit_panel_componet}
  show={show_multiple_select_edit_panel}
  question_data={modifying_question !== null ? modifying_question : undefined}
  is_new_question={new_question_type === '02'}
  onCancel={async () => {
    await onEditPanelCancel();
  }}
  onConfirm={async (new_question_data) => {
    await onEditPanelConFirm(new_question_data);
  }}
></MultipleSelectEditPanel>

<JudgeSelectEditPanel
  bind:this={judge_edit_panel_componet}
  show={show_judge_select_edit_panel}
  question_data={modifying_question !== null ? modifying_question : undefined}
  is_new_question={new_question_type === '04'}
  onCancel={async () => {
    await onEditPanelCancel();
  }}
  onConfirm={async (new_question_data) => {
    await onEditPanelConFirm(new_question_data);
  }}
></JudgeSelectEditPanel>

<style lang="scss" scoped>



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

  span,
  input {
    font-family: PingFang FC;
  }

.hiddenValue{
 visibility: hidden;
}

  .pageContainer {
    overflow: auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0px 30px 12px 30px;
    transition: all 0.2s ease;
    min-height: 0;

    .rollbackBar {
      margin-top: 10px;
      justify-content: flex-start;

      .rollbackContainer {
        display: flex;
        align-items: center;

        box-shadow: none;
      }
    }

    .bankMsgBar {
      display: flex;
     
       max-width: 100%;
      background-color: #fff;
      border-radius: 5px;
      flex-shrink: 0;
      overflow: hidden;

      margin-top: 10px;
      transition: all 0.2s ease;

      border-radius: 8px;
      box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.08),
        0 1px 2px rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.12);
      transition:
        transform 0.2s,
        box-shadow 0.2s;

      .leftColorBlock {
        display: block;
        max-width: 12px;
        min-width: 12px;
        flex: 1;

        background-color: var(--primary-color);

        border-radius: 5px;
      }

      .contentContainer {
        display: flex;
        justify-content: space-between;
        flex: 1;
        margin-left: 50px;
        max-width: 100%;
        .bankNameContainer {
          display: flex;
          align-items: center;
          margin-top: 15px;

          .editImg {
            height: 15px;
          }

          .bankNameInputOutBorder {
            display: flex;
            justify-content: center;
            align-items: center;
            border-bottom: 3px solid #0336ff;

            &:focus-within .cleanBankNameInputBtn {
              visibility: visible !important;
            }

            .bankNameInput {
              width: 200px;
              font-size: 20px;
              background-color: transparent;
              border: 0px;
              outline: none;
              font-weight: 600;
              letter-spacing: -0.5px;
              text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);

              &::placeholder {
                text-align: center;
              }
            }

            .cleanBankNameInputBtn {
              background-color: transparent;
              border: 0px;
              visibility: hidden;

              .cleanBankNameInputImg {
                width: 10px;
                height: 10px;
              }
            }
          }
        }

        .bankTagContainer {
          display: flex;
          // justify-content: center;
          align-items: start;
          margin-top: 20px;
          .bankTagImg {
            height: 15px;
          }

          .bankTags {
            display: flex;
            flex-wrap: wrap;
          }
        }

        .bankTimeContainer {
          display: flex;
          justify-content: space-between;
          width: 450px;
          margin-top: 10px;
          margin-bottom: 10px;

          .timeText {
            font-size: 12px;
            color: #333333;
            font-weight: 500;
            color: var(--text-secondary) !important;
          }
        }

        .questionCountContainer {
          display: flex;
          margin-right: 20px;
          user-select: none;

          .questionCountText {
            display: flex;
            align-items: center;
            font-size: 16px;
            padding: 5px;
            white-space: nowrap;

            background-color: var(--primary-color);
            color: var(--text-white);

            border-top-left-radius: 5px;
            border-bottom-left-radius: 5px;
          }

          .questionCountNum {
            display: flex;
            align-items: center;
            font-size: 16px;
            padding: 5px;

            font-weight: bold;
            border: 2px solid #0336ff;

            border-top-right-radius: 5px;
            border-bottom-right-radius: 5px;
          }
        }

        .saveBankDataUpdateBtn {
          border: 1px solid #0336ff;
          color: var(--primary-color);
          margin-left: 20px;
          padding: 5px 10px;
          border-radius: 5px;
          visibility: hidden;
          opacity: 0;

          &:hover {
            background-color: var(--primary-color);
            color: white;
          }
        }

        .giveUpBankDataUpdateBtn {
          border: 1px solid #d9001b;
          color: var(--red);
          margin-left: 10px;
          padding: 5px 10px;
          border-radius: 5px;
          visibility: hidden;
          opacity: 0;

          &:hover {
            background-color: var(--red);
            color: white;
          }
        }

        .rightContent {
          display: flex;
          height: fit-content;

          margin-top: 20px;
          align-items: center;
        }
      }
    }

    .bankContent {
      display: flex;
      margin-top: 15px;
      transition: all 0.2s ease;
      flex: 1;
      min-height: 0;

      .quesionFilter {
        display: flex;
        flex-direction: column;
        background-color: var(--bg-primary);
        border-radius: 5px;
        max-height:66vh;
        max-width: 21%;
        min-width: 200px;
        flex: 1;
        box-sizing: border-box;

        overflow-y: auto;
        scrollbar-gutter: stable both-edges;

        border-radius: 8px;
        box-shadow:
          0 2px 8px rgba(0, 0, 0, 0.08),
          0 1px 2px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(0, 0, 0, 0.12);
        transition:
          transform 0.2s,
          box-shadow 0.2s;

        .questionFilterTitle {
          position: sticky;
          top: 0;

          display: flex;
          flex-direction: column;
          margin-bottom: 10px;

          background-color: var(--bg-primary);

          .colorHolder {
            width: 100%;
            height: 15px;
            background-color: var(--bg-primary);
          }
          .leftColorBlock {
            display: block;
            max-width: 8px;
            min-width: 8px;
            flex: 1;

            background-color: var(--primary-color);

            border-radius: 3px;
          }

          .questionFilterTitleText {
            font-size: 16px;
            font-weight: bold;
            margin-left: 10px;
          }
        }
      }

      .questionListContainer {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 800px;
        min-height: 0;
        overflow: auto;
        max-height:66vh;
        border-radius: 5px;
        margin-left: 10px;
        padding: 5px;
        background-color: var(--bg-primary);
        box-sizing: border-box;

        border-radius: 8px;
        box-shadow:
          0 2px 8px rgba(0, 0, 0, 0.08),
          0 1px 2px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(0, 0, 0, 0.12);
        transition:
          transform 0.2s,
          box-shadow 0.2s;

        .questionListTitle {
          flex-shrink: 0;
          display: flex;
          margin-top: 10px;
          margin-bottom: 10px;
          align-items: center;
          gap: 5px;
          .leftColorBlock {
            display: block;
            max-width: 8px;
            min-width: 8px;
            height: 100%;
            flex: 1;

            background-color: var(--primary-color);

            border-radius: 3px;
          }

          .questionListTitleText {
            font-size: 16px;
            font-weight: bold;
            margin-left: 10px;
          }
        }

        .questionListControlBar {
          flex-shrink: 0;
          display: flex;
          justify-content: space-between;
          align-items: baseline;

          .questionListSearch {
            display: flex;
            align-items: baseline;
            margin-left: 20px;
            & span {
              font-size: 14px;
            }
            .questionListSearchInput {
              outline: none;
              border: #969696 1px solid;
              padding: 8px;
              width: 200px;
              border-radius: 25px;

              margin-left: 10px;

              font-size: 12px;
              line-height: 14px;
            }
          }

          .questionListControlBtnContainer {
            display: flex;
          }
        }

        & > :last-child {
          flex: 1;
          min-height: 0;
          overflow: auto;
        }
      }
    }
  }

  .normalBtn {
    visibility: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    margin-left: 20px;
    margin-right: 20px;
    padding: 5px 10px;
    color: var(--primary-color);
    box-sizing: border-box;
    border: 1px solid #cecece;
    transition: all 0.2s ease;
    &:hover {
      border-color: var(--primary-hover);
    }
    border-radius: 5px;

    height: fit-content;
  }

  @media screen and (max-width: 1200px) {
    .pageContainer {
      padding: 0px;
      transition: all 0.2s ease;

      .rollbackBar {
        margin-top: 0px;
      }
      .bankMsgBar {
        transition: all 0.2s ease;
        margin-top: 0px;
        border: 0px;
        border-bottom: 1px solid #ccc;
        border-radius: 0px;

        box-shadow: none;
      }

      .bankContent {
        transition: all 0.2s ease;
        margin-top: 0px;

        .quesionFilter {
          border: 0px;
          border-radius: 0px;

          box-shadow: none;
        }

        .questionListContainer {
          transition: all 0.2s ease;
          margin-left: 0px;
          border: 0px;
          border-left: 1px solid #ccc;
          border-radius: 0px;

          box-shadow: none;
        }
      }
    }
  }

  .questionPrviewPanel {
    position: fixed;
    top: 50%;
    right: 30px;
    width: 30%;
    height: 90vh;
    background-color: var(--bg-primary);
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease-in-out;
    z-index: 1000;

    // 默认状态（隐藏）
    &.hide {
      transform: translate(calc(100% + 30px), -50%);
    }

    // 显示状态
    &.show {
      transform: translate(0, -50%);
    }
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    justify-content: center;
    align-items: center;
    z-index: 100;

    .copyQuestionPanel {
      background-color: var(--bg-primary);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      width: 500px;
      max-width: 90%;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;

      & > div {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
    }

    .copyQuestionTextArea {
      width: 100%;
      height: 200px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: none;
      font-size: 14px;
      line-height: 1.5;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
    }

    .copyQuestionBtn {
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;

      &:first-child {
        background-color: white;
        color: #333;
        border: 1px solid #d9d9d9;
      }

      &:first-child:hover {
        color: #1890ff;
        border-color: #1890ff;
      }

      &:last-child {
        background-color: #1890ff;
        color: white;
        border: 1px solid #1890ff;
      }

      &:last-child:hover {
        background-color: #40a9ff;
        border-color: #40a9ff;
      }
    }
  }
</style>
