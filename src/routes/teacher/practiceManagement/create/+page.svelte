<!--
 * @Author: chenyijun
 * @Date: 2025-04-20 20:20:00
 * @LastEditors: chenyijun
 * @LastEditTime: 2025-05-02 19:20:13
 -->
<script>
    import PracticeForm from "../components/PracticeForm.svelte";
    import { practice_data_list } from "$lib/stores/practiceData";
    import { goto } from "$app/navigation";
    import Dialog from "../components/Dialog.svelte";
    import ActionToast from "$lib/component/ActionToast.svelte";
    
    // Dialog状态
    let isDialogOpen = $state(false);
    
    // 创建ActionToast组件实例
    /**
     * @type {ActionToast}
     */
    let actionToast;

    /**
     * @param {{ practice_name: any; grading_method: any; test: { id: any; suggest_duration?:number}; students: any[]; allowed_attempts:any}} practiceData
     */
    async function handleSubmit(practiceData) {
        try {
            // 准备请求数据
            const requestData = {
                action: "create",
                data: {
                    name: practiceData.practice_name,
                    correct_mode: practiceData.grading_method,
                    paper_id: practiceData.test.id,
                    students: practiceData.students,
                    allowed_attempts: practiceData.allowed_attempts,
                    duration:practiceData.test.suggest_duration
                },
            };
            console.log(requestData);
            // 发送请求
            const response = await fetch("/api/practices/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
                credentials: "include", // 添加凭证以处理跨域Cookie
            });

            const data = await response.json();
            console.log("创建练习响应:", data);

            if (data.status !== 0) {
                console.error("创建练习失败:", data.msg);
                actionToast.show("error", data.msg || "创建练习失败", "", 1000);
                return;
            }
            // 创建成功，将新创建的练习添加到store
            practice_data_list.update((list) => {
                const newPractice = {
                    ID: data.data?.id || Date.now(),
                    Name: data.data.name,
                    Type:
                        data.data.type === "00"
                            ? "经典巩固"
                            : data.data.type === "02"
                              ? "随机组卷"
                              : "智能提升",
                    Status: "未发布",
                    AllowedAttempts:  data.data.allowed_attempts,
                };
                return [newPractice, ...list];
            });
            
            // 显示创建成功的提示
            actionToast.show("success", "创建练习成功", "", 1000);
            
            // 延迟跳转，让用户能看到提示
            setTimeout(() => {
                goto("/teacher/practiceManagement");
            }, 1000);
        } catch (error) {
            console.error("创建练习请求异常:", error);
            actionToast.show("error", "创建练习请求异常", "", 1000);
        }
    }

    // 取消操作函数
    function handleCancel() {
        isDialogOpen = true;
    }

    // 确认取消
    function confirmCancel() {
        goto("/teacher/practiceManagement");
    }
</script>

<main>
    <div class="page-header">创建练习</div>

    <PracticeForm onSubmitFunc={handleSubmit} onCancelFunc={handleCancel} />

    <Dialog
        bind:isOpen={isDialogOpen}
        title="请问是否要取消创建？"
        content="取消创建将不会保存已填写的内容。"
        onConfirm={confirmCancel}
    />
    
    <ActionToast bind:this={actionToast} isShow={false} />
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
