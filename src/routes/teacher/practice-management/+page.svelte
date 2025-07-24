<script>
  import Title from "./_components/Title.svelte";
  import {
    practice_data_list,
    practice_data_list_display,
    practice_name_store,
    practice_type_store,
    practice_status_store,
    current_page_store,
    page_size_store,
  } from "$lib/stores/modules/practiceData.js";
  import { goto } from '$app/navigation';

  const data = $props();

  //练习数据类型
  
  /**
   * @typedef {Object} Practice
   * @property {number} ID - 练习ID
   * @property {string} Name - 练习名称
   * @property {number} student_cnt - 学生人数
   * @property {string} Type - 练习类型
   * @property {string} Status - 练习状态
   * @property {number} AllowedAttempts - 可作答的次数
   */

   //练习列表数据类型
   /**
   * @type {Practice[]} 
   */
   let displayed_practice_list = $state(
    Array.isArray(data.practices_display) ? data.practices_display : []
  );

  //练习列表数据,从page.js里面加载
  /**
   * @type {Practice[]} 
   */
  let practice_list = $state(Array.isArray(data.practices) ? data.practices : []);

  //筛选管理
  let practice_name= $state(data.practice_name || ""); // 练习名称/课程名称输入框的值;
  let practice_type= $state(data.practice_type || "全部");//练习类型
  let practice_status= $state(data.practice_status || "全部");//练习状态


  //分页条设置
  let total_page_num  = $state(data.total_page || 1);
  let total_data_num  = $state(data.total_count || 0);
  let current_page_num = $state(data.current_page || 1);
  let data_per_page  = $state(data.page_size || 10);






  // 自动查询逻辑
  function handle_name_input() {
   current_page_num=1//重置成第一页
   filter_practice_list(
   );
  }


  //筛选练习列表，采用本地筛选
 async function filter_practice_list() {
   //更新store 
    practice_name_store.set(practice_name || "");
    practice_type_store.set(practice_type || "全部");
    practice_status_store.set(practice_status || "全部");
    current_page_store.set(current_page_num);
    page_size_store.set(data_per_page);

    //发送分页查询请求
    await practice_page_query(
    current_page_num,
    data_per_page,
    practice_name,
    practice_type,
    practice_status,
    );

  }

  /**
   * 从服务器获取指定页的练习数据
   * @param {number} page - 页码
   * @param {number} page_size - 每页数据条数
   * @param {string} [name=""] - 练习名称筛选
   * @param {string} [type="全部"] - 练习类型筛选
   * @param {string} [status="全部"] - 练习状态筛选
   */

  //分页查询函数
  async function practice_page_query(
    page, 
    page_size,
    name="", 
    type="全部",
    status="全部"
    ) { 
        //组装查询字符串
        let queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("page_size", page_size.toString());
        //检验过滤条件是否存在
        if (name) {
          queryParams.append("name", name);
        }
        if (type != "全部") {
          //转换为后端的形式
          let typeCode = "";
        if (type === "经典巩固") typeCode = "00";
        else if (type === "随机组卷") typeCode = "02";
        else if (type === "智能提升") typeCode = "04";

        if (typeCode) queryParams.append("type", typeCode);
        }
        if (status != "全部") {
            //转换为后端的格式
            let statusCode = "";
        if (status === "已发布") statusCode = "02";
        else if (status === "未发布") statusCode = "00";

        if (statusCode) queryParams.append("status", statusCode);
        }

        //发送请求 统一进行错误处理todo
       const url = `/api/practice?${queryParams.toString()}`;
       const result = await fetch(url,
        { credentials: "include",}
       ).then(res => res.json()).then(result => {
         //将返回的数据进行处理
       if (result.status === 0 && result.data && result.data.records) {
        // 更新练习列表和分页信息
        const transformedData = transformPracticeData(result.data.records);
        practice_list = transformedData;
        displayed_practice_list = transformedData;

        // 更新分页信息
        total_data_num = result.rowCount || 0;
        total_page_num = result.data.pages;
        current_page_num = result.data.current;
        data_per_page = result.data.size;

        // 更新store
        practice_data_list.set(practice_list);
        practice_data_list_display.set(displayed_practice_list);
        current_page_store.set(current_page_num);
        page_size_store.set(data_per_page);
      } else {
        console.error("获取练习列表响应格式错误:", result);
      }
       })


       //练习列表数据类型
     /**
      *@param {any[]} practices
       *@returns {Practice[]}
     */
       //转换后端传来的数据
       function transformPracticeData(practices) { 
        if(!Array.isArray(practices)) return [];

        return practices.map(
            practice=>{
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
            }
        )
       }
  }

  //创建新的练习
  function create_new_practice() { 
    //跳转到创建新练习的页面
   goto (`/teacher/practice-management/create`)
  }





  // 这里可以添加你需要的逻辑
</script>

<div class="practice-management">
  <Title title="练习列表" />
  <div class="table-action-container">
    <div class="search-add-button-container">
      <div class="search-bar">
        <div class="search-box">
        <span class="search-label">搜索练习：</span>
        <input
          class="search-input"
          type="text"
          placeholder="请输入练习名称"
          bind:value={practice_name}
          oninput={handle_name_input}
        />
      </div>

      <div class=filter-box>
        <span class="filter-label">练习类型：</span>
        <div class="dropdown-wrapper">
            //todo  等待公共组件
         </div>
        
      </div>

      <div class="filter-box">
        <span class="filter-label">练习状态：</span>
        <div class="dropdown-wrapper">
            //todo等待公共组件
        </div>
      </div>

        </div>
        <button class="new-practice-btn" onclick={create_new_practice}>+新增练习</button>
    </div>
    <div class="practice-table">
        <table > 
        <thead>
          <tr>
            <th class="header" >练习名称</th>
            <th class="header" >练习类型</th>
            <th class="header" >学生人数</th>
            <th class="header" >当前状态</th>
            <th class="header" >可作答次数</th>
            <th class="header" >操作</th>
          </tr>
        </thead>
         <tbody>
          {#each displayed_practice_list as practice}
            <tr>
              <td class="practice-content"
              title={practice.Name}
                >{practice.Name}</td
              >
              <td class="practice-content"
              title={practice.Type}
                >{practice.Type}</td
              >
              <td class="practice-content"
                
                title={practice.student_cnt.toString()}
                >{practice.student_cnt}</td
              >
              <td class="practice-content"
                >
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


  </div>

</div>

<style lang="scss">
  :global(*) {
    box-sizing: border-box;
  }
  $border-color: #e5e6eb;
  $primary-color: var(--blue);

  .practice-content{
    text-align: center;
  }
  .header {
    width: 20%;
  }

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

    .search-add-button-container {
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
        min-width: 200px;

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
