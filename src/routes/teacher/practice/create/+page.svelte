<!-- /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ -->
<script>
  import PracticeForm from '../../practice/_components/PracticeForm.svelte';
  import { practice_data_list } from '../../practice/store/practiceData';
  import { goto } from '$app/navigation';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { transFormType } from '../utils';
  import Title from '$lib/components/Title/Title.svelte';

  // Dialog状态
  let isDialogOpen = $state(false);
  //需要关联的学生ID
  let practiceStudentIds = $state([]);

  /**
   * @param {{ practice_name: any; grading_method: any; test: { id: any; suggest_duration?:number}; students: any[]; allowed_attempts:any}} practiceData
   */
  async function handleSubmit(practiceData, newStudents,selectedStudents) {
    const CREATE_PRACTICE =()=>{
        // 准备请求数据
      const requestData = {
        Action: 'POST',
        Data: {
          practice: {
            Name: practiceData.practice_name,
            CorrectMode: practiceData.grading_method,
            PaperID: practiceData.test.id,
            Type: transFormType(practiceData.test.assembly_type),
            AllowedAttempts: practiceData.allowed_attempts,
            duration: practiceData.test.suggest_duration,
          },
          student: practiceStudentIds,
        },
      };
      console.log(requestData);
      
      // 发送请求
      return fetch('/api/practice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include',
      })
        .then((response) => {
          if (!response.ok) {
            toast.error('请求失败');
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => {
          console.log('创建练习响应:', data);

          if (data.status !== 0) {
            console.error('创建练习失败:', data.msg);
            toast.error(data.msg || '创建练习失败');
            throw new Error(data.msg || '创建练习失败');
          }
          
          // 创建成功，将新创建的练习添加到store
          practice_data_list.update((list) => {
            const newPractice = {
              ID: data.Data?.id || Date.now(),
              Name: requestData.Data.practice.Name,
              Type:
                requestData.Data.practice.Type === '00'
                  ? '经典巩固'
                  : requestData.Data.practice.Type === '02'
                    ? '随机组卷'
                    : '智能提升',
              Status: '未发布',
              AllowedAttempts: requestData.Data.practice.AllowedAttempts,
            };
            return [newPractice, ...list];
          });

          // 显示创建成功的提示
          toast.success('创建练习成功');

          // 延迟跳转，让用户能看到提示
          setTimeout(() => {
            goto('/teacher/practice');
          }, 1000);
        });
    }
    //先发送请求创建账号再与练习关联
 
    // 判断是否需要导入学生
    if (newStudents && newStudents.length > 0) {
      // 先执行对没有账号的学生生成账号操作
      fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: newStudents }),
      })
        .then((res) => {
          if (!res.ok) {
            return res.text().then((msg) => {
              throw new Error(`导入失败: ${res.status} ${res.statusText} - ${msg}`);
            });
          }
          return res.json();
        })
        .then((result) => {
          if (result.status !== 0) {
            throw new Error(result.msg || '导入失败');
          }
          //获取新增之后的学生ID
          let studentIds = result.data.map((item) => item.ID);
          //获取已经有账号的学生的ID
          let existStudentIds = selectedStudents.filter(item=>item.id).map(item=>item.id)
          console.log('exist',selectedStudents.filter(item=>item.ID))
             //创建需要关联的学生ID
          practiceStudentIds = [...practiceStudentIds,...studentIds,...existStudentIds]
          // 导入成功后执行创建练习
          return CREATE_PRACTICE(practiceStudentIds);
        })
        .catch((error) => {
          console.error('创建练习请求异常:', error);
          toast.error(error.message || '创建练习请求异常');
        });
    } else {
      // 直接执行创建练习
       //获取已经有账号的学生的ID
        let existStudentIds = selectedStudents.filter(item=>item.id).map(item=>item.id)
          //创建需要关联的学生ID
          practiceStudentIds = [...practiceStudentIds,...existStudentIds]
          
      CREATE_PRACTICE()
        .catch((error) => {
          console.error('创建练习请求异常:', error);
          toast.error(error.message || '创建练习请求异常');
        });
    }
  }

  // 取消操作函数
  function handleCancel() {
    isDialogOpen = true;
  }

  // 确认取消
  function confirmCancel() {
    goto('/teacher/practice');
  }
</script>

<main>
  <Title title="创建练习"></Title>

  <PracticeForm onSubmitFunc={handleSubmit} onCancelFunc={handleCancel} />
  <!-- todo,等组件封装好 -->

  <MessageBox
    bind:visible={isDialogOpen}
    title="请问是否要取消创建？"
    content="取消创建将不会保存已填写的内容。"
    onConfirm={confirmCancel}
    onCancel={() => {
      isDialogOpen = false;
    }}
    cancel_text="取消"
    confirm_text="确定"
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
  }
</style>
