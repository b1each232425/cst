<!-- /*
 * @Author: 李乐毅
 * @Date: 2025-07-27 16:36:22
 * @Last Modified by:   李乐毅
 * @Last Modified time: 2025-07-27 16:36:22
 */ -->

<script>
  import PracticeForm from '../../_components/PracticeForm.svelte';
  import { practice_data_list } from '../../store/practiceData';
  import { goto } from '$app/navigation';
  import MessageBox from '$lib/components/MessageBox/MessageBox.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { toast } from '$lib/components/Toast/Toast.js';
  import { transFormType } from '../../utils';
  import Title from '$lib/components/Title/Title.svelte';

  // 获取路由参数中的 id (即 practice_id)
  const practiceId = $page.params.id;
  // 使用runes接收页面数据
  let practice = $state();
  //需要关联的学生ID
  let practiceStudentIds = $state([]);

  // Dialog状态
  let isDialogOpen = $state(false);
  /**
   * @param {{ practice_name: any; grading_method: any; test: { id: any;suggest_duration?:number }; students: any[];allowed_attempts:any}} practiceData
   */
  async function handleSubmit(practiceData, newStudents, selectedStudents, is_deleted_all) {
    const EDIT_PRACTICE = () => {
      // 准备请求数据
      const requestData = {
        Action: is_deleted_all ? 'clear' : 'POST',
        Data: {
          practice: {
            ID: practice.data.practice.ID,
            Name: practiceData.practice_name,
            CorrectMode: practiceData.grading_method,
            PaperID: practiceData.test.id,
            Type: transFormType(practiceData.test.assembly_type),
            AllowedAttempts: practiceData.allowed_attempts,
            duration: practiceData.test.suggest_duration,
          },
          student: is_deleted_all ? [] : practiceStudentIds,
        },
      };

      // 发送请求
      return fetch('/api/practice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include', // 添加凭证以处理跨域Cookie
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to update practice');
          }
          console.log('111', response);
          return response.json();
        })
        .then((data) => {
          console.log('编辑练习响应:', data);

          if (data.status !== 0) {
            console.error('编辑练习失败:', data.msg);
            toast.error(data.msg || '编辑练习失败', '', 1000);
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
                  Type: data.data.type === '00' ? '经典巩固' : data.data.type === '02' ? '随机组卷' : '智能提升',
                  // 其他属性保持不变
                };
              }
              return item;
            });
          });

          // 显示编辑成功的提示
          toast.success('保存练习成功', 1000);

          // 延迟跳转，让用户能看到提示
          setTimeout(() => {
            // 跳转回列表页
            goto('/teacher/practice');
          }, 1000);
        });
    };
    if (newStudents && newStudents.length > 0) {
      // 先执行导入操作
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
          let existStudentIds = selectedStudents.filter((item) => item.id).map((item) => item.id);
          //创建需要关联的学生ID
          practiceStudentIds = [...practiceStudentIds, ...studentIds, ...existStudentIds];
          // 导入成功后执行创建练习
          return EDIT_PRACTICE();
        })
        .catch((error) => {
          console.error('编辑练习请求异常:', error);
          toast.error('编辑练习请求异常', 1000);
        });
    } else {
      //获取已经有账号的学生的ID
      let existStudentIds = selectedStudents.filter((item) => item.id).map((item) => item.id);
      console.log('existStudentIds', existStudentIds);
      //创建需要关联的学生ID
      practiceStudentIds = [...practiceStudentIds, ...existStudentIds];

      EDIT_PRACTICE().catch((error) => {
        console.error('编辑练习请求异常:', error);
        toast.error('编辑练习请求异常', 1000);
      });
    }
  }

  // 处理取消
  function handleCancel() {
    isDialogOpen = true;
  }

  // 确认取消
  function confirmCancel() {
    goto('/teacher/practice');
  }
  //发生错误时设置默认值
  function getDefaultValue(id) {
    practice = {
      data: { id: parseInt(id) },
      form: {
        practice_name: '',
        grading_method: '00',
        test: null,
        students: [],
        status: '未发布',
        type: '经典巩固',
      },
    };
  }
  //获取当前练习的信息
  async function getPracticeInfo() {
    await fetch(`/api/practice?id=${practiceId}`, {
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          console.error('Failed to fetch practice detail.');
          return getDefaultValue(practiceId);
        }
        return response.json();
      })
      .then((data) => {
        console.log('练习详情数据:', data);

        if (data.status !== 0 || !data.data) {
          console.error('获取练习详情响应格式错误:', data);
          return getDefaultValue(practiceId);
        }

        // 转换练习状态显示
        let statusText = '未发布';
        if (data.data.practice.Status === '02') statusText = '已发布';
        // 构建表单所需的数据结构
        {
          practice = {
            data: data.data,
            form: {
              practice_name: data.data.practice.Name,
              grading_method: data.data.practice.CorrectMode,
              test: {
                id: data.data.practice.PaperID || 0,
                name: data.data.paper_name || '',
              },
              status: statusText,
              type: data.data.practice.Type,
              students: data.data.student_count,
            },
          };
        }
      })
      .catch((error) => {
        console.error(`获取练习ID=${practiceId}的详情失败:`, error);
        return getDefaultValue(practiceId);
      });
  }

  onMount(() => {
    getPracticeInfo();
  });
</script>

<main>
  <div class="page-header"><Title title="编辑练习"></Title></div>
  {#if practice}
    <PracticeForm
      PracticeId={practiceId}
      onSubmitFunc={practice.data.practice.Status === '02' ? handleSubmit : handleSubmit}
      practiceData={practice}
      onCancelFunc={handleCancel}
    />
  {/if}
  <MessageBox
    bind:visible={isDialogOpen}
    title="请问是否要取消编辑？"
    content="取消编辑将不会保存修改的内容。"
    confirm_text="确定"
    cancel_text="取消"
    onConfirm={confirmCancel}
    onCancel={() => {
      isDialogOpen = false;
    }}
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
