<!--
 * @Author: qjj qiaojunjie6@qq.com
 * @Date: 2025-07-24  19:31:15
 * @LastEditors: qjj qiaojunjie6@qq.com
 * @LastEditTime:  2025-07-24  19:31:15
 * @FilePath: \src\routes\teacher\question-bank-management\theory\+page.svelte
 * @Description: 
 * @
 * @Copyright (c) 2025 by qjj
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
  import '$lib/components/Input/index.scss';
  import BankCard from '../_components/bankCard.svelte';
  import { onMount } from 'svelte';
  import { formatTimestamp } from '$lib/utils/time_utils';
  import { goto} from '$app/navigation';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { selection} from '../store';
  import MessageBox from '$lib/components/MessageBox/MessageBox.js';
  	import Title from '$lib/components/Title/Title.svelte';
import '$lib/components/Input/index.scss';
  import { Value } from 'sass';
  /**
   * @typedef BankCardItemData
   * @property {number}           ID              - 题库ID
   * @property {string}           Name            - 题库名称
   * @property {Array<string>}    [Tags]          - 题库标签
   * @property {string}           CreateTime     - 创建时间
   * @property {string}           UpdateTime     - 更新时间
  
   */

  
  /**
   * 题库搜索输入框的值
   * @type {string}
   */
  let search_input = $state('');

  /**
   * 原始题库列表数据
   * @type {Array<BankCardItemData>}
   */
  let origin_bank_list = $state([
    {
      id: 0,
      name: '示例',
      tags: ['示例', 'example', 'test', '测试', 'svelte', '编程', 'hello world', 'javascript', 'html', 'css'],
      create_time: `${formatTimestamp(Date.now(), { show_time: false })}`,
      update_time: `${formatTimestamp(Date.now())}`,
    
    },
  ]);

  /**
   * 题库列表数据
   * @type {Array<BankCardItemData>}
   */
  let bank_list = $state([
    {
      id: 0,
      name: '示例',
      tags: ['示例', 'example', 'test', '测试', 'svelte', '编程', 'hello world', 'javascript', 'html', 'css'],
      create_time: `${formatTimestamp(Date.now(), { show_time: false })}`,
      update_time: `${formatTimestamp(Date.now())}`,
      selected: false,
    },
  ]);

  /**
   * 图标路径数据
   * @type {{
   *      cross:      string;     // 叉号图标路径
   *      delete:     string;     // 删除图标路径
   *      big_add:    string;     // 添加图标路径
   *      check_mark: string;     // 选中图标路径
   * }}
   */
  let icons = {
    cross: '/programming_question_bank/icons/cross.svg',
    delete: '/programming_question_bank/icons/delete.svg',
    big_add: '/programming_question_bank/icons/big_add.svg',
    check_mark: '/programming_question_bank/icons/check_mark.svg',
  };

  /**
   * 选中的题库列表数据
   * @type {Array<BankCardItemData>}
   */
  let selected_bank_list = $state([]);


  function getBankList({  page = '', pageSize = '' } = {}) {
  bank_list=[];
  origin_bank_list=[];
    const queryParams = new URLSearchParams({
      keyword:search_input,
      page,
      pageSize,
      
    });

    return fetch(`/api/question-banks?${queryParams}`, {
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
          throw new Error(`${data.msg}`);
        }
       
       bank_list=data.data; // 返回实际数据
       origin_bank_list=data.data;
      })
      .catch((error) => {
        toast.error(`获取题库列表失败:${error.message}`);
        return null; 
      });
  }

 function deleteBank(deleteBank) {

    return fetch(`/api/question-banks`, {
      method: 'DELETE',
      credentials: 'include',
      body: JSON.stringify({data:deleteBank}),
    })
      .then((response) => {
         if (!response.ok) {
          throw new Error(`HTTP错误`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.status !== 0) {
          throw new Error(`${data.msg}`);
        }
           getBankList();
       
      })
      .catch((error) => {
        toast.error(`删除题库失败:${error.message}`);
        return null; 
      });
  }

  onMount(async () => {
    selection.clear();
      getBankList();
  });

  /**
   * 添加题库接口
   *
   */
  function addNewBank() {
    const data = {
      name: '未命名题库',
      type: '00', //理论题库
      tags: [],
    };

    return fetch('/api/question-banks', {
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
       
              
        

        // 跳转页面
         goto(`${window.location.pathname}/editBank?bankID=${ result.data.ID}`);
        return;
      })
      .catch((error) => {
        toast.error(`新建题库失败:${error.message}`);
        return;
      });
  }

  /**
   * 添加题库处理函数
   */


  /**
   * 选中题库处理函数
   * @param {BankCardItemData} item
   */
  function selectHandleFunc(item) {
    // // console.log("选中题库:", item);

    selection.toggle(item.ID); 

    if ($selection.has(item.ID)) {
      selected_bank_list.push(item.ID);
    } else {
      selected_bank_list = selected_bank_list.filter((bank) => bank!== item.ID);
    }

    // console.log("选中题库列表:", $state.snapshot(selected_bank_list));
  }

  /**
   * 取消所有选中题库处理函数
   */
  function antiSelectAllHandleFunc() {
  selection.clear();
    selected_bank_list = [];

    // console.log("取消选中题库列表:", $state.snapshot(selected_bank_list));
  }

  /**
   * 题库名称改变处理函数
   * @param {string} name - 题库名称
   * @param {BankCardItemData} item - 题库数据
   */
  function bankNameChangeHandleFunc(name, item) {
    // console.log("题库名称:", $state.snapshot(name));

    if (name == null) {
      return;
    }

    if (typeof name !== 'string') {
      throw new Error('name must be a string');
    }

    item.Name = name;

    item.is_changed = checkBankDataChange(item);

    // console.log("题库名称:", $state.snapshot(item.name))
  }

  /**
   * 题库名称输入框失去焦点处理函数
   * @param {string} old_name - 原题库名称
   * @param {string} new_name - 题库名称
   * @param {BankCardItemData} item - 题库数据
   */
  function bankNameOnchangeHandleFunc(old_name, new_name, item) {
    if (new_name == null) {
      return;
    }

    if (typeof new_name !== 'string') {
      throw new Error('new_name must be a string');
    }

    if (new_name != '') {
      return;
    }

    if (old_name == null) {
      throw new Error('old_name is required');
    }

    item.Name = old_name;

    item.is_changed = checkBankDataChange(item);
  }

  /**
   * 添加标签处理函数
   * @param {BankCardItemData} item - 题库数据
   * @param {string} content - 标签内容
   */
  function addTagHandleFunc(item, content) {
    // // console.log("添加标签:", content);

    if (content == null || content == '') {
      return;
    }

    if (typeof content !== 'string') {
      throw new Error('content must be a string');
    }

    if (item?.Tags) {
      item.Tags.push(content);
    } else {
      item.Tags = [content];
    }

    item.is_changed = checkBankDataChange(item);

    // console.log("题库标签:", ...$state.snapshot(item.tags))
  }

  /**
   * 删除标签处理函数
   * @param {BankCardItemData} item - 题库数据
   * @param {number} index - 标签索引
   */
  function deleteTagHandleFunc(item, index) {
    if (item == null) {
      throw new Error('item is required');
    }

    // console.log("删除标签:", item?.tags?.[index],index);

    if (item?.Tags) {
      item.Tags.splice(index, 1);
    }

    item.is_changed = checkBankDataChange(item);

    // // console.log("题库标签:", $state.snapshot(item.tags))
  }

  /**
   * 题库标签内容改变处理函数, 输入时调用
   * @param {string} content - 标签内容
   * @param {number} index - 标签索引
   * @param {BankCardItemData} item - 题库数据
   */
  function tagContentChangeHandleFunc(content, index, item) {
    // console.log("标签内容:", $state.snapshot(content));

    if (content == null) {
      return;
    }

    if (typeof content !== 'string') {
      throw new Error('content must be a string');
    }

    if (item?.Tags) {
      item.Tags[index] = content;
    } else {
      throw new Error('current item tags is null');
    }

    item.is_changed = checkBankDataChange(item);
  }

  /**
   * 题库标签内容改变处理函数, 失去焦点或按下回车时调用
   * @param {string} old_content - 原标签内容
   * @param {string} new_content - 新标签内容
   * @param {number} index - 标签索引
   * @param {BankCardItemData} item - 题库数据
   */
  function tagOnChangeHandleFunc(old_content, new_content, index, item) {
    // console.log("标签内容:", $state.snapshot(new_content));

    if (new_content == null) {
      return;
    }

    if (typeof new_content !== 'string') {
      throw new Error('content must be a string');
    }

    if (old_content == null) {
      throw new Error('old_content is required');
    }

    if (typeof old_content !== 'string') {
      throw new Error('old_content must be a string');
    }

    new_content = new_content == '' ? old_content : new_content;

    if (item?.Tags) {
      item.Tags[index] = new_content;
    } else {
      throw new Error('current item tags is null');
    }

    item.is_changed = checkBankDataChange(item);
  }

  /**
   * 放弃修改
   * @param {BankCardItemData} item - 题库数据
   */
  function discardChanges(item) {
    // console.log("放弃修改:", item);
    if (item == null) {
      return;
    }

    let bank_index = bank_list.findIndex((bank) => bank.ID === item.ID);

    if (bank_index === -1) {
      return;
    }

    let origin_item =origin_bank_list[bank_index];

    if (origin_item == null) {
      throw new Error(`origin_item(${item.ID}) is null`);
    }

    item.Name = origin_item.Name;
    item.Tags = origin_item.Tags ?? [];

    item.is_changed = false;
  }

  /**
   * 检查题库数据是否有做变更
   * @param {BankCardItemData} item - 题库数据
   * @return {boolean} - 是否有变更
   */
  function checkBankDataChange(item) {
    let bank_index = bank_list.findIndex((bank) => bank.ID === item.ID);

    let origin_item = origin_bank_list[bank_index];

    if (origin_item == null) {
      return false;
    }

    let tags = item.Tags ?? [];

    let origin_tags = origin_item.Tags ?? [];

    let bank_is_changed = item.Name != origin_item.Name;

    let tags_is_changed = bank_is_changed || tags.length !== origin_tags.length;

    if (tags_is_changed) {
      return true;
    }

    for (let tag of origin_tags) {
      if (!tags.includes(tag)) {
        bank_is_changed = true;
        break;
      }
    }

    // console.log("题库数据是否有变更:", bank_is_changed);

    return bank_is_changed;
  }



  /**
   * 跳转到编辑题库页面
   * @param {BankCardItemData} item
   */
  async function onGoToEditBank(item) {

    // window.location.href = `${window.location.pathname}/editBank`;
    goto(`${window.location.pathname}/editBank?bankID=${item.ID}`);
  }

  //显示删除题库题型
  	function deleteMessageBox() {
     if(selected_bank_list.length==0){
      toast.warning("请先选择要删除的题库")
      return ;
     }

		MessageBox({
			title: '确认操作',
			content: '你确定要删除题库吗？',
			onConfirm: () => {
        deleteBank(selected_bank_list)
				console.log('点击了确认');
			},
			onCancel: () => {
				console.log('点击了取消');
			}
		});
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

<!--标题-->
<div>
    <Title title="题库列表" />
  </div>

<div class="question-bank-container">
  <!-- 顶部栏 -->
  <div class="top-bar">
  <div class="input">
    <input  bind:value={search_input} placeholder="请输入题库名/标签"     oninput={()=>{getBankList();}}/>
  </div>
           
    <div class="operation-btns">
      <button class="button-delete" onclick={()=>{
        deleteMessageBox()
      }} >
         <span class="icon"></span>
        <span>批量删除</span>
      </button>

      <button
        class="button-cancelSelect"
        onclick={() => {
          antiSelectAllHandleFunc();
        }}
      >
        <img src={icons.cross} alt="取消选中" />
        <span>取消选中</span>
      </button>

    </div>
  </div>


  <!-- 题库列表 -->
  <div class="bank-container">
    <div class="bank-list">
      <div class="bank-card-container">
        <BankCard type="add" {icons} add_handle_func={addNewBank} />
      </div>
      {#each bank_list as item, index}
        <div class="bank-card-container">
          <BankCard
            type="normal"
            {icons}
            data={{
              ...item,
              ID: String(item.ID),
            }}
            normal_handle_funcs={{
              select: () => {
                selectHandleFunc(item);
              },
              add_tag: (content) => {
                addTagHandleFunc(item, content);
              },
              delete_tag: (index) => {
                deleteTagHandleFunc(item, index);
              },
              tag_change: (content, index) => {
                tagContentChangeHandleFunc(content, index, item);
              },
              tag_onchange: (old_content, new_content, index) => {
                tagOnChangeHandleFunc(old_content, new_content, index, item);
              },
              name_change: (name) => {
                bankNameChangeHandleFunc(name, item);
              },
              name_input_onchange: (old_name, new_name) => {
                bankNameOnchangeHandleFunc(old_name, new_name, item);
              },
              discard: () => {
                discardChanges(item);
              },
              delete:()=>{
                const delteData=[item.ID];
                deleteBank(delteData)    
              },
              edit: () => onGoToEditBank(item),
             
            }}
          />
        </div>
      {/each}
    </div>
  </div>
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

 

 

  .question-bank-container {
  
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  .top-bar {
    display: flex;
    position: absolute;
    top: 0;
    left: 5px;
    width: 100%;
    height: 50px;
    padding: 2px;
    box-sizing: border-box;
    justify-content: flex-start;
    align-items: center;

    .search-text {
      display: flex;
      font-size: 20px;
      justify-content: center;
      align-items: center;
      font-family: 'Arial-BoldMT', 'Arial Bold', 'Arial', sans-serif;
      font-weight: 700;
      color: #333333;
      line-height: 25px;
      margin-right: 10px;
      white-space: nowrap;
    }

 

    .operation-btns {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      width: max-content;
      height: max-content;
      box-sizing: border-box;

      button {
        display: flex;
        width: 90px;
        height: 35px;
        box-sizing: border-box;
        font-family: 'ArialMT', 'Arial', sans-serif;
        color: #ffffff;
        justify-content: center;
        align-items: center;
        text-align: center;
        border: none;
        border-radius: 3px;
        margin-left: 10px;
        cursor: pointer;
      }
       .button-cancelSelect {
    background-color: #7787a2;
  } 

   .button-delete {
    color: rgb(255, 255, 255);
    background-color: rgb(248, 104, 104)
   
  }
 .button-delete .icon {
    display: inline-block;
    width: 20px;
    height: 20px;
    background-image: url("/programming_question_bank/icons/delete.svg");
    background-size: contain;
    background-repeat: no-repeat;
    background-color :rgb(248, 104, 104);
  }

    }
  }

  .bank-container {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;;
    top: 50px;

    .bank-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      align-items: center;
      width: 100%;
      height: max-content;
      box-sizing: border-box;
    }

    .bank-card-container {
      display: flex;
      width: max-content;
      height: max-content;
      box-sizing: border-box;
      margin: 5px;

      &.hidden {
        display: none;
      }
    }
  }
</style>
