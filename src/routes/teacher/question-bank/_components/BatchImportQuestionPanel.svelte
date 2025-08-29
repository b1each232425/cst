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
  import SingleSelectEditPanel from './singlePage.svelte';
  import MultipleSelectEditPanel from './multiplePage.svelte';
  import JudgeSelectEditPanel from './judgePage.svelte';
  import QuestionPreviewPanel from './QuestionPreview.svelte';
  import ShortAnswerEditPanel from './shortAnswer.svelte';
  import FillBlankEditPanel from "./fillBank.svelte";
  import{selectQuestion}from '../store'
  import { toast } from '$lib/components/Toast/Toast';
  import {checkData, download_theory, parseQuestionData} from "../utils/check";



 let {
    bank_id
  } = $props()

//是否显示导入面板
let isShow = $state(false);
//总题目
let total_questions = $state([]);
//导入失败题目列表
let failure_question_list = $state([]);
//导入状态数据
let imported_stats_data = $state({success: 0, failure: 0, total: 0});

  // 定义当前选中的标签索引
  let activeIndex = $state(0)

  /**
   * @type {{name: string, count: number, type: string}[]} // 标签数组
   */
  let tabs = $state([
    // {name: '单选题', count: 1, type: "00"},
    // {name: '多选题', count: 0, type: "02"},
    // {name: '判断题', count: 0, type: "04"},
    // {name: '填空题', count: 0, type: "06"}
     // {name: '简答题', count: 0, type: "08"}
  ])
 let questions = $state([
    // {
    //   ...preview_question_data,
    // }
  ])
  //是否导入文件
    let isImported = $state(false)

    //是否全选
     let isSelectedAll = $state(false)
     //选中的数据
  let selected_questions = []

 /**
   * @description 显示单选题编辑面板
   * @type {boolean}
   */
  let show_single_select_edit_panel = $state(false);

  /**
   * @description 单选题编辑面板组件
   * @type {SingleSelectEditPanel}
   */
  let single_select_edit_panel_component;

  /**
   * @description 显示多选题编辑面板
   * @type {boolean}
   */
  let show_multiple_select_edit_panel = $state(false);

  /**
   * @description 多选题编辑面板组件
   * @type {MultipleSelectEditPanel}
   */
  let mutiple_select_edit_panel_component;

  /**
   * @description 显示判断题编辑面板
   * @type {boolean}
   */
  let show_judge_select_edit_panel = $state(false);

  /**
   * @description 判断题编辑面板组件
   * @type {JudgeSelectEditPanel}
   */
  let judge_edit_panel_component;

  /**
   * @description 显示填空题编辑面板
   * @type {boolean}
   */
  let show_fill_bank_edit_panel = $state(false);

  /**
   * @description 填空题编辑面板组件
   * @type {FillBlankEditPanel}
   */
  let fill_bank_edit_panel_component;

  /**
   * @description 显示简答题编辑面板
   * @type {boolean}
   */
  let show_short_answer_edit_panel = $state(false);

  /**
   * @description 简答题编辑面板组件
   * @type {ShortAnswerEditPanel}
   */
  let short_answer_edit_panel_component;


  
  let modifying_question = $state({})
  let file_input = $state(null);
  
  let icons = {
    excel: "/theory_question_bank/icons/excel.svg",
    excel_download: "/theory_question_bank/icons/excel-download.svg",
    upload: "/theory_question_bank/icons/upload.svg",
    arrow_left: "/mark/i-arrow-left.svg",
    download: "/theory_question_bank/icons/download.svg"
  }


  export const showPanel = () => {
    isShow = true;
  }

 export const closePanel = () => {
    isShow = false
    reset()
  }

   function reset() {
    total_questions = []
    failure_question_list = []
    imported_stats_data = {
      total: 0,
      success: 0,
      failure: 0
    }
    tabs = []
    activeIndex = 0
    isImported = false;
    isSelectedAll = false;
    selected_questions = []
  }


  function onConfirmEditQuestion(question) {
    console.log(question)

    for (let i = 0; i < total_questions.length; i++) {
      if (total_questions[i].id === question.id) {
        total_questions[i] = {
          ...total_questions[i],
          ...question
        }
      }
    }

    for (let i = 0; i < questions.length; i++) {
      if (questions[i].id === question.id) {
        questions[i] = {
          ...questions[i],
          ...question
        }
      }
    }


  }


  function onEditQuestion(question) {
    console.log(question.id)
    modifying_question = question
    switch (question.type) {
      case "00":
        single_select_edit_panel_component.initPanel();
        show_single_select_edit_panel = true;
        break;
      case "02":
        mutiple_select_edit_panel_component.initPanel();
        show_multiple_select_edit_panel = true;
        break;
      case "04":
        judge_edit_panel_component.initPanel();
        show_judge_select_edit_panel = true;
        break;
      case "06":
        fill_bank_edit_panel_component.initPanel();
        show_fill_bank_edit_panel = true;
        break;
      case "08":
        short_answer_edit_panel_component.initPanel();
        show_short_answer_edit_panel = true;
        break;
      default:
        return;
    }
  }


    function onToggleQuestionSelect(id) {
      toast.success("id:"+id)
    questions.forEach(q => {
      if (q.id === id) {
        q.is_selected = !q.is_selected
      }
    })

    total_questions.forEach(q => {
      if (q.id === id) {
        q.is_selected = !q.is_selected
      }
    })

    // questions = questions
  }

   function onClickSelectAllButton() {
    if (isSelectedAll) {
      // 已全选，点击后取消全选
      // 遍历questions
    selectQuestion.clear();

      isSelectedAll = false
    } else {
      // 未全选，点击后全选
      total_questions.forEach(q => {
        if(!$selectQuestion.has(q.id)){
          selectQuestion.toggle(q.id)
        }
      

      })

      isSelectedAll = true
    }

    // 更新questions
    handleTabClick(activeIndex)
  }

    function handleTabClick(index) {
    console.log(index)
    activeIndex = index
    const tab = tabs[index]
    if (tab && tab.type) {
      questions = total_questions.filter(q => q.type === tab.type)
    } else {
      questions = [...total_questions]
    }
  }


    function downloadTemplate() {
    const url = '/theory_question_bank/理论题批量导入模板.xlsx';
    const a = document.createElement('a');
    a.href = url;
    a.download = '导入题目模版.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }


    function updateTabs(tabs /** @type {any[]} */, questions /** @type {any[]} */) {
    /** @type {{[key: string]: {name: string, type: string}}} */
    const typeMap = {
      "00": {name: "单选题", type: "00"},
      "02": {name: "多选题", type: "02"},
      "04": {name: "判断题", type: "04"},
      "06": {name: "填空题", type: "06"},
      "08": {name: "简答题", type: "08"}
    };

    /** @type {{[key: string]: number}} */
    const counts = {};
    questions.forEach((question /** @type {any} */) => {
      const type = question.type;
      counts[type] = (counts[type] || 0) + 1;
    });

    // 更新现有tabs中的count值
    Object.keys(counts).forEach(type => {
      const existingTab = tabs.find(tab => tab.type === type);
      if (existingTab) {
        existingTab.count += counts[type];
      } else {
        // 如果不存在对应项，创建新项
        if (typeMap[type]) {
          tabs.push({
            name: typeMap[type].name,
            count: counts[type],
            type: type
          });
        }
      }
    });

    return tabs;
  }

    //处理文件上传
  async function handleFileUpload(event) {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) {
        // onImport([], false);
        return;
      }

      const file = files[0];
      if (file) {
        let result = await checkData(file);
        if (!result.success && result.success.length === 0) {
          console.error("文件格式错误")
         toast.error("文件格式错误")
          return
        }

        console.log(result)
        const parsedQuestions = parseQuestionData(result)
        console.log('解析结果:', parsedQuestions);
        // questions = [...questions, ...parsedQuestions]

        if (parsedQuestions.length === 0) {
          console.error("解析题目失败，请检查格式是否有误")
          toast.error("解析题目失败，请检查格式是否有误")
          return
        }

        isImported = true

        total_questions = [...total_questions, ...parsedQuestions]

        let failure_question_count = (result.failure?.length ?? 2) - 2
        // 将格式错误的数据直接放入failure_question_list 含表头数据
        if (failure_question_count > 0) {
          failure_question_list = [...failure_question_list, ...result.failure];
        }


        if (failure_question_count > 0) {
          imported_stats_data.failure += failure_question_count
        }
       
        imported_stats_data.total += parsedQuestions.length + failure_question_count
        imported_stats_data.success += parsedQuestions.length

        updateTabs(tabs, parsedQuestions)

        handleTabClick(0)

        if (file_input) {
          file_input.value = null
        }
      }

    } catch (error) {
      console.error('解析失败:', error);
    }
  }


    function onDownloadFailureQuestions() {
    try {
      download_theory(failure_question_list)
    } catch (e) {
      console.error(e)
      toast.error("下载失败，请重试")
    }

  }


 function onImportQuestions(new_question_data) {
    // 构建 body 数据
    let data = [];
  const fieldMap = {
    type: 'Type',
    difficulty: 'Difficulty',
    content: 'Content',
    tags: 'Tags',
    options: 'Options',
    answers: 'Answers',
    analysis: 'Analysis',
    score: 'Score',
    question_attachments_path: 'QuestionAttachmentsPath',
    // ...
  };

  if(!new_question_data || new_question_data.length === 0){
     throw new Error("没有可导入的题目")
    return;
  }

  for (let i = 0; i < new_question_data.length; i++) {
    const q = new_question_data[i];
    const item = {};
    for (const key in fieldMap) {
      if (q[key] !== undefined) {
        item[fieldMap[key]] = q[key];
      }
    }
    item.BelongTO = bank_id;
    data.push(item);

  }


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
      
        toast.success("导入题目成功")
      
      })
      .catch((error) => {
        throw error; // 继续抛出错误以便调用者处理
        return;
      });
  }
   async function onClickImportButton() {
    try {
      selected_questions = total_questions.filter(q => q.is_selected)
    for(let i=0;i<total_questions.length;i++){
     if($selectQuestion.has(total_questions[i].id)){
       
          selected_questions.push(total_questions[i])
     }

    }
      const res = await onImportQuestions(selected_questions)
      console.log(res)

     
      window.location.reload(); 
    } catch (error) {
      console.error("导入失败:", error)
      toast.error("上传题目失败，请重试")
    }

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
<div class="panel-container" style="display: {isShow ? 'block' : 'none'}">
  <div class="navi-container">

    <div class="navi-back-container" onclick={closePanel}>
      <img class="navi-back-icon" src="{icons.arrow_left}" alt="">
      <p>取消导入</p>
    </div>
  </div>

  <div class="split-container">
    
      <div class="import-container">

        <!-- 左侧可以是任何内容，比如一个列表 -->
        <!--        <div class="import-container">-->

        <!--        </div>-->
        <div class="title-container">
          <p class="title-text over-line">Excel文件导入</p>
          <p class="title-description-text over-line">支持</p>
          <p class="question-type-text over-line">
            单选题、多选题、判断题、填空题、简答题
          </p>
          <p class="title-description-text over-line">题型</p>
        </div>

        <div class="content-container">
          <p class="step-text over-line">第一步:下载模板文件,按照模板要求录入题目</p>
          <div class="upload-download-container" onclick={downloadTemplate}> 
            <div class="upload-download-box">
              <div class="img-container">
                <img class="excel-img" src={icons.excel} alt="">
                <img class="excel-download" src={icons.excel_download} alt="">
              </div>
            </div>
          </div>
          <p class="step-text over-line" style="margin-top: 36px;" >第二步:上传文件</p>
          <div class="upload-download-container">
            <div class="upload-download-box download-box" onclick={() => {if(file_input){file_input.click()}}}>
              <input
                type="file"
                id="fileInput"
                style="display: none;"
                onchange={handleFileUpload}
                bind:this={file_input}
              />
              <div class="img-container">
                <img class="excel-img" src={icons.upload} alt="">
              </div>
              <p class="over-line" style="color: #7F7F7F; max-width: 100%;">将文件拖拽至此或点击上传文件</p>
            </div>
          </div>
        </div>

      </div>

      <div class="preview-container" >
        <div class="title-container">
          <p class="title-text">题目预览</p>
        </div>

        {#if !isImported}
          <div class="mask-container">
            <div class="mask-text-container">
              <p class="mask-text">请先在左侧导入Excel文件</p>
            </div>
          </div>
        {/if}


        <div class="stats-and-import-button-container">
          <div class="stats-data-container">
            <p>总共 </p>
            <p class="stats-data-text" style="color: var(--blue);">{imported_stats_data.total}</p>
            <p> 道，</p>
            <p>成功识别 </p>
            <p class="stats-data-text" style="color: var(--green);">{imported_stats_data.success}</p>
            <p> 道，</p>
            <p>识别失败 </p>
            <p class="stats-data-text" style="color: var(--red);">{imported_stats_data.failure} </p>
            <p> 道</p>
            {#if imported_stats_data.failure >= 0}
              <div class="download-container" onclick={onDownloadFailureQuestions} >
                <img class="" src="{icons.download}" alt="下载结果">
              </div>
            {/if}
          </div>
          <div class="import-button-container">
            <div class="select-all-container" onclick={onClickSelectAllButton}>
              <input
                type="checkbox"
                class="checkbox-item"
                checked={isSelectedAll}
                readonly
              />
              <p>{isSelectedAll ? '取消全选' : '全选'}</p>
            </div>
            <div class="import-button" onclick={onClickImportButton} ><p>导入题目</p></div>
          </div>
        </div>


        <div class="question-type-selector">

          <!-- 标签栏 -->
          <div class="tab-bar">
            {#each tabs as tab, index}
              <div
                class="tab-button {activeIndex === index ? 'active' : ''}"
                onclick={() => handleTabClick(index)}
              >
                <div class="tab-button-text-container {activeIndex === index ? 'active' : ''}">
                  <p>{tab.name}</p>
                  <p class="count-text">{tab.count} 道</p>
                </div>
                <!--{tab.name}-->
              </div>
            {/each}

            <!-- 动态滑动指示条 -->
            <div class="indicator"
                 style="transform: translateX({activeIndex * 100}%); width: calc(100% / {tabs.length});"></div>
          </div>
        </div>


        <div class="preview-content-container">
          {#each questions as q, index}
            <div class="content-container">
              <input
                type="checkbox"
                class="checkbox-item"
                checked={$selectQuestion.has(q.id)}
                onclick={()=>{  selectQuestion.toggle(q.id)}}
              />
              <div class="order-container">
                <p>{index + 1}.</p>
              </div>
              <QuestionPreviewPanel
                question={q}
              ></QuestionPreviewPanel>
              <div class="edit-button" onclick={() => onEditQuestion(q)}>编辑</div>
            </div>

          {/each}
        </div>
      </div>
 
  </div>
</div>




<SingleSelectEditPanel
  bind:this={single_select_edit_panel_component}
  show={show_single_select_edit_panel}
  question_data={modifying_question !== null
            ? modifying_question
            : undefined}
  is_new_question={false}
  onCancel={async () => {
    show_single_select_edit_panel = false;
            // await onEditPanelCancel();
        }}
  onConfirm={async (new_question_data) => {
            show_single_select_edit_panel = false;
            onConfirmEditQuestion(new_question_data)
        }}
></SingleSelectEditPanel>

<MultipleSelectEditPanel
  bind:this={mutiple_select_edit_panel_component}
  show={show_multiple_select_edit_panel}
  question_data={modifying_question !== null
            ? modifying_question
            : undefined}
  is_new_question={false}
  onCancel={async () => {
    show_multiple_select_edit_panel = false;
            // await onEditPanelCancel();
    }}
  onConfirm={async (new_question_data) => {
            show_multiple_select_edit_panel = false;
            onConfirmEditQuestion(new_question_data)
        }}
></MultipleSelectEditPanel>

<JudgeSelectEditPanel
  bind:this={judge_edit_panel_component}
  show={show_judge_select_edit_panel}
  question_data={modifying_question !== null
            ? modifying_question
            : undefined}
  is_new_question={false}
  onCancel={async () => {
    show_judge_select_edit_panel = false;
            // await onEditPanelCancel();
        }}
  onConfirm={async (new_question_data) => {
            show_judge_select_edit_panel = false;
            onConfirmEditQuestion(new_question_data)
        }}
></JudgeSelectEditPanel>

<FillBlankEditPanel
  bind:this={fill_bank_edit_panel_component}
  show={show_fill_bank_edit_panel}
  question_data={modifying_question !== null
            ? modifying_question
            : undefined}
  is_new_question={false}
  onCancel={async () => {
     show_fill_bank_edit_panel = false;
            // await onEditPanelCancel();
        }}
  onConfirm={async (new_question_data) => {
            show_fill_bank_edit_panel = false;
            onConfirmEditQuestion(new_question_data)
        }}
></FillBlankEditPanel>

<ShortAnswerEditPanel
  bind:this={short_answer_edit_panel_component}
  show={show_short_answer_edit_panel}
  question_data={modifying_question !== null
            ? modifying_question
            : undefined}
  is_new_question={false}
  onCancel={async () => {
     show_short_answer_edit_panel = false;
            // await onEditPanelCancel();
        }}
  onConfirm={async (new_question_data) => {
            show_short_answer_edit_panel = false;
            onConfirmEditQuestion(new_question_data)
        }}
></ShortAnswerEditPanel>

<style scoped>

    p {
        color: #333333;
        font-size: 14px;
        margin-block-start: 0;
        margin-block-end: 0;
        margin-inline-start: 0;
        margin-inline-end: 0;
    }

    div {
        font-size: 14px;
    }

    .panel-container {
        background-color: #fff;
        display: flex;
        /*flex-direction: column;*/
        align-items: center;
        justify-content: center;
        width: 100vw;
        min-width: 1000px;
        height: 100vh;
        position: fixed;
        z-index: 1002;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;

        .split-container {
          display: flex;
            height: calc(100% - 35px - 5px);
        }
    }

    .navi-container {
        height: 35px;
        display: flex;

        .navi-back-container {
            display: flex;
            height: 29px;
            width: max-content;
            margin-left: 10px;
            margin-top: 3px;
            margin-bottom: 3px;
            align-items: center;
            /*padding: 5px;*/
            border-radius: 3px;

            .navi-back-icon {
                width: 20px;
                height: 20px;
            }

            p {
                line-height: 29px;
            }
        }

    }

    .navi-back-container:hover {
        background-color: #e4e4e4;
        transition: background-color 0.3s ease;
        cursor: pointer;
    }

    .import-container {
        width: 30%;
        height: calc(100% - 2px);
        background-color: #f7f7f7;
        margin-left: 10px;
        /*margin-top: 5px;*/
        border-radius: 8px;
        border: 1px solid #dbdbdb;
        overflow: auto;

        .content-container {
            margin: 0 auto;
            margin-top: 30px;
            width: 80%;
            /*height: calc(100% - 30px - 60px);*/
            display: flex;
            flex-direction: column;
            overflow: auto;

            .step-text {
                line-height: 45px;
                height: 45px;

            }

            .upload-download-container {
                position: relative;
                width: 100%;
                max-width: 669px;
                max-height: 240px;
                /*padding-top: 35%;*/

                /*:after {*/
                /*    content: "";*/
                /*    display: block;*/
                /*    padding-top: 35%;*/
                /*}*/

                .upload-download-box {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    max-width: 669px;
                    /*min-width: 21px;*/
                    height: 100%;
                    max-height: 240px;
                    /*min-height: 20px;*/
                    border-radius: 5px;
                    border: 1px dashed rgba(0, 82, 217, 0.5);
                    background-color: #f7f8fa;
                    box-sizing: border-box;
                    display: flex;
                    justify-content: center;
                    align-items: center;

                    /*.excel-img {*/
                    /*    width: 12.86%;*/
                    /*    max-width: 100%;*/
                    /*    height: max-content;*/
                    /*    object-fit: contain;*/
                    /*    !*height: auto;*!*/
                    /*}*/

                    .img-container {
                        width: 12.86%;
                        height: 33.7%;
                        position: relative;
                        min-width: 21px;
                        min-height: 20px;
                        max-height: 80px;
                        max-width: 80px;

                        .excel-img {
                            width: 86.04%;
                            max-width: 100%;
                            height: max-content;
                            object-fit: contain;
                            /*height: auto;*/
                        }

                        .excel-download {
                            position: absolute;
                            bottom: 0;
                            right: 0;
                            width: 41.7%;
                            max-width: 100%;
                            height: max-content;
                            object-fit: contain;
                        }
                    }
                }

                :hover {
                    background-color: #f0f2f5;
                    transition: background-color 0.3s ease;
                    box-sizing: border-box;
                    cursor: pointer;
                }

                .download-box {
                    display: flex;
                    flex-direction: column;
                }
            }
        }
    }

    .upload-download-container:after {
        content: "";
        display: block;
        padding-top: 35%;
    }

    .preview-container {
   
        width: 70%;
        height: calc(100% - 2px);
        background-color: #f7f7f7;
        /*margin-top: 5px;*/
        margin-right: 10px;
        border-radius: 8px;
        border: 1px solid #dbdbdb;
        display: flex;
        flex-direction: column;
        /*overflow: auto;*/

        position: relative;
    }

    .mask-container {
        z-index: 1002;
        position: absolute;
        top: 50px;
        width: 100%;
        height: calc(100% - 50px);
        background-color: #f7f7f7;
        display: flex;
        justify-content: center;
        align-items: center;

        .mask-text-container {
            height: 100px;
            width: 400px;
            background-color: #f2f2f2;

            p {
                line-height: 100px;
                text-align: center;
                font-size: 30px;
                color: #989898;
            }
        }
    }

    .stats-and-import-button-container {
        position: relative;
        display: flex;
        align-items: center;
        margin-top: 20px;
        margin-right: 30px;
    }

    .stats-data-container {
        position: relative;
        display: flex;
        height: 45px;

        margin-left: 30px;
        margin-right: 30px;
        /*line-height: 45px;*/
        /* 让文字底部对齐*/
        align-items: flex-end;

        p {
            vertical-align: bottom;
        }

        .stats-data-text {
            margin-left: 4px;
            margin-right: 4px;
            font-size: 18px;
        }
    }

    .download-container {
        height: 20px;
        margin-left: 5px;
    }

    .download-container:hover {
        cursor: pointer;
    }

    .import-button-container {
        position: absolute;
        right: 0;
        bottom: -5px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 30px;
        height: 35px;

        .select-all-container {
            display: flex;
            gap: 5px;
            align-items: center;
        }

        .select-all-container:hover {
            cursor: pointer;
        }

        .import-button {
            width: 100px;
            height: 35px;
            line-height: 35px;
            padding: 2px 2px 2px 2px;
            border-radius: 3px;
            background-color: #00a870;
            text-align: center;

            p {

                font-family: 'ArialMT', 'Arial', sans-serif;
                color: #ffffff;
            }
        }
    }

    .import-button:hover {
        cursor: pointer;
        background-color: #00b07b;
        transition: background-color 0.3s ease;
    }

    .question-type-selector {
        border-bottom: 1px solid #dbdbdb;
        margin-left: 30px;
        margin-right: 30px;
        margin-top: 40px;
        width: calc(100% - 30px - 30px);

    }

    .tab-container {
        max-width: 600px;
        margin: 20px auto;
    }

    .tab-bar {
        position: relative;
        display: flex;
        /*background: #fff;*/
        /*border-radius: 8px;*/
        padding-bottom: 4px;
        max-width: calc(100% - 30px - 30px);
        width: max-content;
        /*margin-left: 30px;*/

        /*border-bottom: 1px solid #dbdbdb;*/
    }

    .tab-button {
        flex: 1;
        display: flex;
        justify-content: center;
        height: 30px;
        max-width: 120px;
        width: 120px;
        line-height: 30px;
        /*border: none;*/
        /*background: none;*/
        font-size: 16px;
        color: #666;
        cursor: pointer;
        transition: color 0.3s ease;
        /*position: relative;*/
        /*z-index: 1;*/
    }

    .tab-button:hover {
        p {
            color: var(--blue);
            transition: color 0.3s ease;
        }
    }

    .tab-button-text-container {
        display: flex;
        /* 让文字底部对齐*/
        align-items: flex-end;

        .count-text {
            margin-left: 5px;
            font-size: 18px;
            color: var(--green);
        }
    }

    .indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        /*width: 120px; !* 根据标签数量调整 *!*/
        background: #2196F3;
        transition: transform 0.3s ease;
    }

    /*.content {*/
    /*    margin-top: 20px;*/
    /*    padding: 20px;*/
    /*    background: #fff;*/
    /*    border-radius: 8px;*/
    /*    min-height: 200px;*/
    /*}*/

    .checkbox-item {
        width: 20px;
        height: 20px;
        cursor: pointer;
        accent-color: var(--blue);
        margin-right: 10px;
        margin-top: 0;
        margin-bottom: 0;
    }

    .preview-content-container {
        overflow: auto;
        display: flex;
        flex-direction: column;
        margin-left: 30px;
        margin-right: 30px;
        margin-top: 20px;
        gap: 20px;

        .content-container {
            display: flex;
            /*min-width: 500px;*/


            .order-container {
                margin-right: 10px;
                height: 20px;

                p {
                    line-height: 20px;
                }

            }

            .edit-button {
                width: 60px;
                height: 30px;
                line-height: 30px;
                padding: 2px 2px 2px 2px;
                border-radius: 3px;
                background-color: #0052d9;
                box-sizing: border-box;
                font-family: 'ArialMT', 'Arial', sans-serif;
                color: #ffffff;
                text-align: center;
                margin-left: 30px;
                margin-right: 10px;
            }

            .edit-button:hover {
                background-color: #256fec;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
        }
    }

    .title-container {
        width: 100%;
        height: 50px;
        background-color: #eeeeee;
        border-radius: 8px 8px 0 0;
        display: flex;
        line-height: 50px;

        .title-description-text {
            font-size: 12px;
            color: #757575;
        }

        .question-type-text {

            color: #0052d9;
            font-size: 14px;
            margin-left: 5px;
            margin-right: 5px;

        }
    }

    .over-line {
        text-overflow: ellipsis;
        overflow: hidden;
        word-break: break-all;
        white-space: nowrap;
    }

    .title-text {
        line-height: 50px;
        font-size: 16px;
        margin-left: 10px;
        margin-right: 10px;
        color: #333;
    }


</style>