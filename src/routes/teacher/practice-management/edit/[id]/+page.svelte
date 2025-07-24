<!--
 * @Author: chenyijun
 * @Date: 2025-04-20 20:20:00
 * @LastEditors: chenyijun
 * @LastEditTime: 2025-05-02 16:29:35
 -->

<script>
  import PracticeForm from "../../_components/PracticeForm.svelte";
  import { practice_data_list } from "$lib/stores/modules/practiceData";
  import { goto } from "$app/navigation";
  // import Dialog from "../../components/Dialog.svelte";
  // import ActionToast from "$lib/component/ActionToast.svelte";
  import { onMount } from "svelte";

  // 使用runes接收页面数据
  const { data } = $props();
  const { practice } = data;

  // Dialog状态
  let isDialogOpen = $state(false);

  /**
   * @type {ActionToast}
   */
  let actionToast;

  /**
   * @param {{ practice_name: any; grading_method: any; test: { id: any;suggest_duration?:number }; students: any[];allowed_attempts:any}} practiceData
   */
  async function handleSubmit(practiceData) {
      // 准备请求数据
      const requestData = {
        action: "edit",
        data: {
          id: practice.data.id,
          name: practiceData.practice_name,
          correct_mode: practiceData.grading_method,
          paper_id: practiceData.test.id,
          students: practiceData.students,
          allowed_attempts: practiceData.allowed_attempts,
          duration: practiceData.test.suggest_duration,
        },
      };

      // 发送请求
      const response = await fetch("/api/practices/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        credentials: "include", // 添加凭证以处理跨域Cookie
      }).then( (response)=>{
        if (!response.ok) {
          throw new Error("Failed to update practice");
        }
        return response.json();
      }).then((data)=>{
 console.log("编辑练习响应:", data);

      if (data.status !== 0) {
        console.error("编辑练习失败:", data.msg);
        actionToast.show("error", data.msg || "编辑练习失败", "", 1000);
        return;
      }
      // 更新store中的数据
      practice_data_list.update((list) => {
        return list.map((item) => {
          // 找到对应ID的练习并更新
          if (item.ID === practice.data.id) {
            return {
              ...item,
              Name: data.data.name,
              Type:
                data.data.type === "00"
                  ? "经典巩固"
                  : data.data.type === "02"
                    ? "随机组卷"
                    : "智能提升",
              // 其他属性保持不变
            };
          }
          return item;
        });
      });

      // 显示编辑成功的提示
      actionToast.show("success", "保存练习成功", "", 1000);

      // 延迟跳转，让用户能看到提示
      setTimeout(() => {
        // 跳转回列表页
        goto("/teacher/practice-management");
      }, 1000);
      }).catch((error) => { 
console.error("编辑练习请求异常:", error);
      actionToast.show("error", "编辑练习请求异常", "", 1000);
      });

    
     
    
  }
  /**
   * @param {{ practice_name: any; grading_method: any; test: { id: any;suggest_duration?:number }; students: any[];allowed_attempts:any}} practiceData
   */
  async function updateStudents(practiceData) {
   
      // 准备请求数据
      const requestData = {
        data: {
          id: practice.data.id,
          students: practiceData.students,
        },
      };
      // 发送请求
      const response = await fetch("/api/practices/students", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        credentials: "include", // 添加凭证以处理跨域Cookie
      }).then((response)=>{
         if (!response.ok) {
        throw new Error(`更新失败:${response.text()}  `);
      }return response.json();
      }).then((result)=>{
      console.log("update result:", result);
      if (result.status === 0) {
        actionToast.show("success", "更新成功", "", 1000);
        // 延迟跳转，让用户能看到提示
        setTimeout(() => {
          // 跳转回列表页
          goto("/teacher/practice-management");
        }, 1000);
      } else {
        throw new Error(`更新失败:${result.msg}  `);
      }
      }).catch((error) => { 
         console.error("编辑练习请求异常:", error);
      actionToast.show("error", "编辑练习请求异常", "", 1000);
      });
     
     
   
  }

  // 处理取消
  function handleCancel() {
    isDialogOpen = true;
  }

  // 确认取消
  function confirmCancel() {
    goto("/teacher/practice-management");
  }

  onMount(() => {
    console.log("edit practice", practice);
  });
</script>

<main>
  <div class="page-header">编辑练习</div>

  <PracticeForm
    onSubmitFunc={practice.data.status === "02" ? updateStudents : handleSubmit}
    practiceData={practice}
    onCancelFunc={handleCancel}
  />
  <!-- 等待组件封装 <Dialog
    bind:isOpen={isDialogOpen}
    title="请问是否要取消编辑？"
    content="取消编辑将不会保存修改的内容。"
    onConfirm={confirmCancel}
  />

  <ActionToast bind:this={actionToast} isShow={false} /> -->
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  main {
    padding: 20px;
    background-color: #fff;
    box-shadow: none;
    position: relative;
    display: block;
    height: 100%;
    overflow: auto;
    .page-header {
      display: flex;
      align-items: center;
      font-size: 20px;
      font-weight: bold;
      color: #000;
    }
    .page-header::before {
      content: "";
      display: inline-block;
      width: 13px;
      height: 29px;
      background-color: #0336ff;
      margin-right: 8px;
      border-radius: 4px;
    }
  }
</style>
