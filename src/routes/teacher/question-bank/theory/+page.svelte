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
  import BankCard from '../_components/bankCard.svelte';
  import { onMount } from 'svelte';
  import { formatTimestamp } from '$lib/utils/time_utils';
  import { goto} from '$app/navigation';
  import { toast } from '$lib/components/Toast/Toast.js';

  /**
   * @typedef BankCardItemData
   * @property {number}           id              - 题库ID
   * @property {string}           name            - 题库名称
   * @property {Array<string>}    [tags]          - 题库标签
   * @property {string}           create_time     - 创建时间
   * @property {string}           update_time     - 更新时间
   * @property {boolean}          [selected]      - 是否选中
   * @property {boolean}          [is_changed]    - 是否有变更
   * @property {boolean}          [is_hidden]     - 是否隐藏
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
      selected: false,
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


  function getBankList({ keyword = '', page = '', pageSize = '', bankID = '' } = {}) {
  bank_list=[];
  origin_bank_list=[];
    const queryParams = new URLSearchParams({
      keyword,
      page,
      pageSize,
      bankID,
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
       
        return data.data; // 返回实际数据
      })
      .catch((error) => {
        toast.error(`获取题库列表失败:${error.message}`);
        return null; 
      });
  }

  onMount(async () => {

    const data = await getBankList();
    for (let bank of data) {
      bank_list.push({
        id: bank.ID,
        name: bank.Name,
        tags: bank.Tags || [],
        create_time: `${formatTimestamp(bank.CreateTime, { show_time: false })}`,
        update_time: `${formatTimestamp(bank.UpdateTime)}`,
        is_changed: false,
        is_hidden: false,
        selected: false,
      });

      origin_bank_list.push({
        id: bank.ID,
        name: bank.Name,
        tags: bank.Tags || [],
        create_time: `${formatTimestamp(bank.CreateTime, { show_time: false })}`,
        update_time: `${formatTimestamp(bank.UpdateTime)}`,
        is_changed: false,
        is_hidden: false,
        selected: false,
      });
    }
  
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
       

        // 存储到 localStorage
        localStorage.setItem(
          'question_bank_data',
          JSON.stringify({
            id: result.data.ID,
            name: '未命名题库',
            tags: [],
            create_time: formatTimestamp(Date.now()),
            update_time: formatTimestamp(Date.now()),
          }),
        );

        // 跳转页面
        goto(`${window.location.pathname}/editBank`);
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

    item.selected = item.selected == null ? true : !item.selected;

    if (item.selected) {
      selected_bank_list.push(item);
    } else {
      selected_bank_list = selected_bank_list.filter((bank) => bank.id !== item.id);
    }

    // console.log("选中题库列表:", $state.snapshot(selected_bank_list));
  }

  /**
   * 取消所有选中题库处理函数
   */
  function antiSelectAllHandleFunc() {
    for (let item of selected_bank_list) {
      item.selected = false;
    }

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

    item.name = name;

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

    item.name = old_name;

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

    if (item?.tags) {
      item.tags.push(content);
    } else {
      item.tags = [content];
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

    if (item?.tags) {
      item.tags.splice(index, 1);
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

    if (item?.tags) {
      item.tags[index] = content;
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

    if (item?.tags) {
      item.tags[index] = new_content;
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

    let bank_index = bank_list.findIndex((bank) => bank.id === item.id);

    if (bank_index === -1) {
      return;
    }

    let origin_item =origin_bank_list[bank_index];

    if (origin_item == null) {
      throw new Error(`origin_item(${item.id}) is null`);
    }

    item.name = origin_item.name;
    item.tags = origin_item.tags ?? [];

    item.is_changed = false;
  }

  /**
   * 检查题库数据是否有做变更
   * @param {BankCardItemData} item - 题库数据
   * @return {boolean} - 是否有变更
   */
  function checkBankDataChange(item) {
    let bank_index = bank_list.findIndex((bank) => bank.id === item.id);

    let origin_item = origin_bank_list[bank_index];

    if (origin_item == null) {
      return false;
    }

    let tags = item.tags ?? [];

    let origin_tags = origin_item.tags ?? [];

    let bank_is_changed = item.name != origin_item.name;

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
    localStorage.setItem(
      'question_bank_data',
      JSON.stringify({
        id: item.id,
        name: item.name,
        tags: item.tags ?? [],
        create_time: item.create_time,
        update_time: item.update_time,
      }),
    );
    // window.location.href = `${window.location.pathname}/editBank`;
    goto(`${window.location.pathname}/editBank`);
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

<div class="question-bank-container">
  <!-- 顶部栏 -->
  <div class="top-bar">
    <div class="search-input-container">
      <input class="search-input" type="text" placeholder="请输入题库名/标签" bind:value={search_input} />
      {#if search_input.length > 0}
        <button
          class="search-input-clear-btn"
          onclick={() => {
            search_input = '';
          }}
        >
          <span>⨉</span>
        </button>
      {/if}
    </div>

    <div class="operation-btns">
      <button class="button-delete" >
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
        <div class="bank-card-container" class:hidden={item.is_hidden}>
          <BankCard
            type="normal"
            {icons}
            data={{
              ...item,
              id: String(item.id),
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
  button {
    margin: 0px;
    padding: 0px;
    border: 0px;
    background-color: transparent;
    cursor: pointer;
    user-select: none;

    transition: all 0.2s ease;
    &:focus {
      outline: none;
    }
  }

  .button-delete {
    background-color: red
  }
 .button-delete .icon {
    display: inline-block;
    width: 20px;
    height: 20px;
    background-image: url("/programming_question_bank/icons/delete.svg");
    background-size: contain;
    background-repeat: no-repeat;
    color: red;
  }

  .button-cancelSelect {
    background-color: #7787a2;
  }

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
    left: 0;
    width: 100%;
    height: 50px;
    padding: 2px;
    padding-left: 25px;
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

    .search-input-container {
      display: flex;
      position: relative;
      justify-content: flex-start;
      align-items: center;
      width: 45%;
      min-width: 250px;
      max-width: 400px;
      height: max-content;
      box-sizing: border-box;
      margin-right: 20px;

      .search-input {
        width: 100%;
        height: 30px;
        border: none;
        padding: 2px 2px 2px 2px;
        border-left: 2px solid #dddddd;
        background-color: rgb(240, 240, 240);
        box-sizing: border-box;
        font-family: 'PingFangSC-Regular', 'PingFang SC', sans-serif;
        color: #999999;
        text-align: left;

        &:focus {
          outline: none;
          border-left: 2px solid #87adec;
          color: #333333;
        }

        &:hover {
          border-left: 2px solid #87adec;
        }
      }

      .search-input-clear-btn {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
        right: 1%;
        border: none;
        border-radius: 3px;
        background-color: transparent;
        cursor: pointer;
        &:hover {
          background-color: #45454524;
        }
      }
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
    }
  }

  .bank-container {
    position: absolute;
    top: 50px;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    box-sizing: border-box;
    padding: 10px 15px 10px 15px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

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
