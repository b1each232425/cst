<!-- /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ -->
<script>
    import PracticeForm from "../_components/PracticeForm.svelte";
    import { practice_data_list } from "../store/practiceData"
    import { goto } from "$app/navigation";
    import MessageBox from "$lib/components/MessageBox/MessageBox.svelte";
  import  {toast}  from "$lib/components/Toast/Toast.js";
  import { transFormType } from "../utils";
  
    
    // Dialog状态
    let isDialogOpen = $state(false);
    


    /**
     * @param {{ practice_name: any; grading_method: any; test: { id: any; suggest_duration?:number}; students: any[]; allowed_attempts:any}} practiceData
     */
    async function handleSubmit(practiceData) {
        
            // 准备请求数据
            const requestData = {
                practice: {
                    Name: practiceData.practice_name,
                    CorrectMode: practiceData.grading_method,
                    PaperID: practiceData.test.id,
                    Type : transFormType(practiceData.test.assembly_type),
                    AllowedAttempts: practiceData.allowed_attempts,                                                                            
                    duration:practiceData.test.suggest_duration
                },
                 student: practiceData.student,
            };
            console.log(requestData);
            // 发送请求
            await fetch("/api/practice", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
                credentials: "include", // 添加凭证以处理跨域Cookie
            }).then(response => { 
                if (!response.ok) { 
                    throw new Error("Network response was not ok");
                }
                return response.json();
            }).then(data => { 
                 console.log("创建练习响应:", data);

            if (data.status !== 0) {
                console.error("创建练习失败:", data.msg);
                toast.error("error", data.msg || "创建练习失败", "", 1000);
                return;
            }
            // 创建成功，将新创建的练习添加到store
            practice_data_list.update((list) => {
                const newPractice = {
                    ID: requestData?.id || Date.now(),
                    Name: requestData.practice.Name,
                    Type:
                        requestData.practice.Type === "00"
                            ? "经典巩固"
                            : requestData.practice.Type === "02"
                              ? "随机组卷"
                              : "智能提升",
                    Status: "未发布",
                    AllowedAttempts:  requestData.practice.AllowedAttempts,
                };
                return [newPractice, ...list];
            });
            
            // 显示创建成功的提示
            toast.success( "创建练习成功", 1000);
            
            // 延迟跳转，让用户能看到提示
            setTimeout(() => {
                goto("/teacher/practice-management");
            }, 1000);
            }).catch(error => { 
                 console.error("创建练习请求异常:", error);
            toast.error( "创建练习请求异常", 1000);
            });
           
    
    }

    // 取消操作函数
    function handleCancel() {
        isDialogOpen = true;
    }

    // 确认取消
    function confirmCancel() {
        goto("/teacher/practice-management");
    }
</script>

<main>
    <div class="page-header">创建练习</div>

    <PracticeForm onSubmitFunc={handleSubmit} onCancelFunc={handleCancel} />
    <!-- todo,等组件封装好 -->

    <MessageBox
        bind:visible={isDialogOpen}
        title="请问是否要取消创建？"
        content="取消创建将不会保存已填写的内容。"
        onConfirm={confirmCancel}
         cancel_text = '取消'
    confirm_text = '确定'
    /> 
    
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
