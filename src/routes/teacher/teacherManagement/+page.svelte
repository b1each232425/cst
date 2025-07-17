<!--
 /*
 * @Author: 王皓 xwcoder7@gmail.com
 * @Date: 2025-04-14 15:44:58
 * @LastEditors: 王皓 xwcoder7@gmail.com
 * @LastEditTime: 2025-05-30 11:34:00
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\teacherManagement\+page.svelte
 * @Description: 教师管理页
 * @Copyright: Copyright (c) 2025 by Xavier Wang, All Rights Reserved.
 */
 -->

<script>
    // @ts-nocheck
    import Title from "$lib/component/Title.svelte";
    import DatePicker from "$lib/component/DatePicker/DatePicker.svelte";
    import Pagination from "$lib/component/Pagination.svelte";
    import DropdownGray from "$lib/component/DropdownGray.svelte";
    import Dialog from "../practiceManagement/components/Dialog.svelte";
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    // 教师列表数据
    let teacher_list = $state([]);

    // 性别/账号搜索的输入值
    let searchValue = $state("");
    let showSearchClearBtn = $state(false);

    // 分页相关状态
    let currentPage = $state(1);
    let pageSize = $state(10);
    let totalItems = $state(0); // 总记录数（来自 rowCount）
    let totalPages = $state(0); // 总页数

    // 加载状态
    let loading = $state(false);
    let error = $state(null);

    // 筛选相关状态
    let startDate = $state(null); // 入职时间开始日期
    let endDate = $state(null);   // 入职时间结束日期
    let selectedStatus = $state("all"); // 选中的账号状态

    // 课程数量、学生数量、班级数量的输入值
    let courseMinValue = $state("");
    let courseMaxValue = $state("");
    let studentMinValue = $state("");
    let studentMaxValue = $state("");
    let classMinValue = $state("");
    let classMaxValue = $state("");

    // 是否显示清除按钮
    let showCourseClearBtn = $state(false);
    let showStudentClearBtn = $state(false);
    let showClassClearBtn = $state(false);

    // 更新显示清除按钮的状态
    function updateClearButtonVisibility() {
        showCourseClearBtn = courseMinValue || courseMaxValue;
        showStudentClearBtn = studentMinValue || studentMaxValue;
        showClassClearBtn = classMinValue || classMaxValue;
    }

    // 更新搜索框清除按钮状态
    function updateSearchClearButtonVisibility() {
        showSearchClearBtn = !!searchValue;
    }

    // 清除搜索框输入值
    function clearSearchValue() {
        searchValue = "";
        showSearchClearBtn = false;
    }

    // 清除输入值
    function clearCourseValues() {
        courseMinValue = "";
        courseMaxValue = "";
        showCourseClearBtn = false;
        fetchTeachersList(); // 清除后重新获取数据
    }

    function clearStudentValues() {
        studentMinValue = "";
        studentMaxValue = "";
        showStudentClearBtn = false;
        fetchTeachersList(); // 清除后重新获取数据
    }

    function clearClassValues() {
        classMinValue = "";
        classMaxValue = "";
        showClassClearBtn = false;
        fetchTeachersList(); // 清除后重新获取数据
    }

    // 状态映射常量
    const StateMap = {
        "00": "已启用",
        "02": "已停用",
        "04": "已删除",
    };

    const StateClassMap = {
        "00": "enabled",
        "02": "disabled",
        "04": "deleted",
    };

    /**
     * 将时间戳转换为可读格式: YYYY-MM-DD
     * @param {number} timestamp - 时间戳
     */
    function formatDate(timestamp) {
        if (!timestamp) return '-';

        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // 判断搜索值是性别还是账号
    function determineSearchType(value) {
        // 如果是空值，返回空对象
        if (!value || value.trim() === "") {
            return { account: null, gender: null };
        }

        // 判断是否为性别
        const trimmedValue = value.trim();
        if (trimmedValue === "男" || trimmedValue === "女") {
            return { account: null, gender: trimmedValue };
        } else {
            // 如果不是性别，则认为是账号
            return { account: trimmedValue, gender: null };
        }
    }

    // 将开始日期转换为当天开始时间的时间戳字符串
    function convertStartDateToTimestampString(date) {
        if (!date) return null;

        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0); // 设置为当天的开始时间 00:00:00.000
        return newDate.getTime().toString(); // 转换为字符串
    }

    // 将结束日期转换为当天结束时间的时间戳字符串
    function convertEndDateToTimestampString(date) {
        if (!date) return null;

        const newDate = new Date(date);
        newDate.setHours(23, 59, 59, 999); // 设置为当天的结束时间 23:59:59.999
        return newDate.getTime().toString(); // 转换为字符串
    }

    // 构建筛选条件
    function buildFilterConditions() {
        // 判断搜索值类型
        const searchResult = determineSearchType(searchValue);

        // 构建入职时间筛选条件（转换为Unix时间戳字符串）
        const joinTimeFilter = {
            start_time: startDate ? convertStartDateToTimestampString(startDate) : null,
            end_time: endDate ? convertEndDateToTimestampString(endDate) : null
        };

        // 构建状态筛选条件
        const statusFilter = selectedStatus === "all" ? null : selectedStatus;

        // 构建课程数量筛选条件
        const courseFilter = {
            min: courseMinValue ? parseInt(courseMinValue) : null,
            max: courseMaxValue ? parseInt(courseMaxValue) : null
        };

        // 构建学生数量筛选条件
        const studentFilter = {
            min: studentMinValue ? parseInt(studentMinValue) : null,
            max: studentMaxValue ? parseInt(studentMaxValue) : null
        };

        // 构建班级数量筛选条件
        const classFilter = {
            min: classMinValue ? parseInt(classMinValue) : null,
            max: classMaxValue ? parseInt(classMaxValue) : null
        };

        // 返回完整的筛选条件
        return {
            account: searchResult.account,
            gender: searchResult.gender,
            join_time: joinTimeFilter,
            status: statusFilter,
            course_count: courseFilter,
            student_count: studentFilter,
            class_count: classFilter
        };
    }

    // 获取教师列表数据
    async function fetchTeachersList() {
        loading = true;
        error = null;
        resetSelection(); // 重置选中状态

        // 构建筛选条件
        const filter = buildFilterConditions();

        const params = new URLSearchParams();

        // 添加分页参数
        params.append('page', currentPage.toString());
        params.append('page_size', pageSize.toString());

        // 只添加有值的筛选条件
        if (filter.account) params.append('account', filter.account);
        if (filter.gender) params.append('gender', filter.gender);
        if (filter.join_time.start_time) params.append('start_time', filter.join_time.start_time);
        if (filter.join_time.end_time) params.append('end_time', filter.join_time.end_time);
        if (filter.status) params.append('status', filter.status);

        // 处理课程数量筛选
        if (filter.course_count.min !== null || filter.course_count.max !== null) {
            const courseCount = {};
            if (filter.course_count.min !== null) courseCount.min = filter.course_count.min;
            if (filter.course_count.max !== null) courseCount.max = filter.course_count.max;
            params.append('course_count', JSON.stringify(courseCount));
        }

        // 处理学生数量筛选
        if (filter.student_count.min !== null || filter.student_count.max !== null) {
            const studentCount = {};
            if (filter.student_count.min !== null) studentCount.min = filter.student_count.min;
            if (filter.student_count.max !== null) studentCount.max = filter.student_count.max;
            params.append('student_count', JSON.stringify(studentCount));
        }

        // 处理班级数量筛选
        if (filter.class_count.min !== null || filter.class_count.max !== null) {
            const classCount = {};
            if (filter.class_count.min !== null) classCount.min = filter.class_count.min;
            if (filter.class_count.max !== null) classCount.max = filter.class_count.max;
            params.append('class_count', JSON.stringify(classCount));
        }

        // 发起请求
        let response;
        try {
            response = await fetch(`/api/admin/teacher/list?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
        } catch (e) {
            console.error('网络请求失败：', e);
            error = '网络连接失败或 API 不可用';
            teacher_list = [];
            loading = false;
            return;
        }

        if (!response.ok) {
            error = `请求失败: ${response.status}`;
            teacher_list = [];
            totalItems = 0;
            totalPages = 0;
            loading = false;
            return;
        }

        // 解析 JSON 并处理数据
        let result;
        try {
            result = await response.json();
        } catch (e) {
            console.error('解析响应失败：', e);
            error = '返回数据格式异常';
            teacher_list = [];
            loading = false;
            return;
        }

        if (result && result.data) {
            // 处理返回的数据
            teacher_list = result.data.map(teacher => ({
                id: teacher.id || '-',
                account: teacher.account || '-',
                name: teacher.official_name || '-',
                gender: teacher.gender || '-',
                phone: teacher.phone || '-',
                account_status: '-',
                question_bank_count: teacher.question_bank_count.toString(),
                student_count: teacher.student_count.toString(),
                class_count: teacher.class_count.toString(),
                join_time: teacher.join_time || '-', // 这里是Unix时间戳
                state: teacher.status || '-',
                action_expended: false
            }));

            // 使用 rowCount 作为总记录数并更新分页信息
            if (result.rowCount !== undefined) {
                totalItems = result.rowCount; // 总记录数就是 rowCount
                totalPages = Math.ceil(totalItems / pageSize);
            } else {
                // 如果后端没有返回 rowCount，则使用当前页的数据长度
                totalItems = teacher_list.length;
                totalPages = 1; // 如果没有总数，假设只有1页
            }
        } else {
            teacher_list = [];
            totalItems = 0;
            totalPages = 0;
        }

        loading = false;
    }

    // 切换页面 - 点击上一页/下一页
    function handlePageNavigation(is_next) {
        if (is_next && currentPage < totalPages) {
            currentPage++;
        } else if (!is_next && currentPage > 1) {
            currentPage--;
        }
        fetchTeachersList();
    }

    // 点击具体页码
    function handlePageSelect(page) {
        currentPage = page;
        fetchTeachersList();
    }

    // 改变每页显示数量
    function handlePageSizeChange(value) {
        pageSize = parseInt(value);
        currentPage = 1; // 重置到第一页
        fetchTeachersList();
    }

    // 输入页码跳转
    function handlePageSearch(value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
            currentPage = pageNum;
            fetchTeachersList();
        }
    }

    // 复选框相关状态
    let selectedTeachers = $state(new Set()); // 存储选中的教师ID
    let allSelected = $state(false); // 是否全选

    // 切换单个教师的选中状态
    function toggleTeacherSelection(id) {
        if (selectedTeachers.has(id)) {
            selectedTeachers.delete(id);
            allSelected = false;
        } else {
            selectedTeachers.add(id);
            // 检查是否所有教师都被选中
            allSelected = teacher_list.length > 0 && selectedTeachers.size === teacher_list.length;
        }
    }

    // 切换全选状态
    function toggleAllSelection() {
        if (allSelected) {
            // 如果当前是全选状态，则取消全选
            // 使用新的空 Set 而不是 clear() 来确保响应式更新
            selectedTeachers = new Set();
            allSelected = false;
        } else {
            // 如果当前不是全选状态，则全选
            selectedTeachers = new Set(teacher_list.map(teacher => teacher.id));
            allSelected = true;
        }
    }

    // 页面加载时获取教师列表
    onMount(() => {
        fetchTeachersList();
    });

    // 当数据变化时重置选中状态
    function resetSelection() {
        // 使用新的空 Set 而不是 clear() 来确保响应式更新
        selectedTeachers = new Set();
        allSelected = false;
    }

    // 删除确认对话框状态
    let deleteDialogOpen = $state(false);
    // 当前要删除的教师ID
    let teacherToDelete = $state(null);
    // 是否批量删除
    let isBatchDelete = $state(false);

    // 启用单个教师
    async function activateTeacher(teacherId) {
        // 根据ID查找教师账号
        const teacher = teacher_list.find(t => t.id === teacherId);
        if (!teacher) {
            throw new Error('未找到教师信息');
        }

        const response = await fetch('/api/admin/teacher/activate', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                data: [teacher.account] // 使用教师账号而不是ID
            })
        });

        if (!response.ok) {
            console.log(`请求失败: ${response.status}`);
            throw new Error(`请求失败: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.status === 0) {
            // 更新本地教师状态
            teacher_list = teacher_list.map(t => {
                if (t.id === teacherId) {
                    return { ...t, state: "00" };
                }
                return t;
            });
            // 启用成功，不显示提示
        } else {
            console.error(`启用失败: ${result.message || '未知错误'}`);
            alert(`启用失败: ${result.message || '未知错误'}`)
        }
    }

    // 停用单个教师
    async function deactivateTeacher(teacherId) {
        // 根据ID查找教师账号
        const teacher = teacher_list.find(t => t.id === teacherId);
        if (!teacher) {
            throw new Error('未找到教师信息');
        }

        const response = await fetch('/api/admin/teacher/deactivate', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                data: [teacher.account] // 使用教师账号而不是ID
            })
        });

        if (!response.ok) {
            console.log(`请求失败: ${response.status}`);
            throw new Error(`请求失败: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.status === 0) {
            // 更新本地教师状态
            teacher_list = teacher_list.map(t => {
                if (t.id === teacherId) {
                    return { ...t, state: "02" };
                }
                return t;
            });
            // 停用成功，不显示提示
        } else {
            console.error(`停用失败: ${result.message || '未知错误'}`);
            alert(`停用失败: ${result.message || '未知错误'}`)
        }
    }

    // 启用选中的教师
    async function activateSelectedTeachers() {
        if (selectedTeachers.size === 0) {
            alert('请先选择要启用的教师');
            return;
        }

        // 获取选中教师的账号列表
        const selectedIds = Array.from(selectedTeachers);
        const teacherAccounts = teacher_list
            .filter(teacher => selectedIds.includes(teacher.id))
            .map(teacher => teacher.account);

        if (teacherAccounts.length === 0) {
            console.log('未找到选中教师的账号信息');
            throw new Error('未找到选中教师的账号信息');
        }

        const response = await fetch('/api/admin/teacher/activate', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                data: teacherAccounts // 使用教师账号列表
            })
        });

        if (!response.ok) {
            console.log(`请求失败: ${response.status}`);
            throw new Error(`请求失败: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.status === 0) {
            // 更新本地教师状态
            teacher_list = teacher_list.map(teacher => {
                if (selectedTeachers.has(teacher.id)) {
                    return { ...teacher, state: "00" };
                }
                return teacher;
            });
            // 批量启用成功，不显示提示
            resetSelection(); // 重置选中状态
        } else {
            console.error(`启用失败: ${result.message || '未知错误'}`);
            alert(`启用失败: ${result.message || '未知错误'}`);
        }
    }

    // 停用选中的教师
    async function deactivateSelectedTeachers() {
        if (selectedTeachers.size === 0) {
            alert('请先选择要停用的教师');
            return;
        }

        // 获取选中教师的账号列表
        const selectedIds = Array.from(selectedTeachers);
        const teacherAccounts = teacher_list
            .filter(teacher => selectedIds.includes(teacher.id))
            .map(teacher => teacher.account);

        if (teacherAccounts.length === 0) {
            console.log('未找到选中教师的账号信息');
            throw new Error('未找到选中教师的账号信息');
        }

        const response = await fetch('/api/admin/teacher/deactivate', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                data: teacherAccounts // 使用教师账号列表
            })
        });

        if (!response.ok) {
            console.log(`请求失败: ${response.status}`);
            throw new Error(`请求失败: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.status === 0) {
            // 更新本地教师状态
            teacher_list = teacher_list.map(teacher => {
                if (selectedTeachers.has(teacher.id)) {
                    return { ...teacher, state: "02" };
                }
                return teacher;
            });
            // 批量停用成功，不显示提示
            resetSelection(); // 重置选中状态
        } else {
            console.error(`停用失败: ${result.message || '未知错误'}`);
            alert(`停用失败: ${result.message || '未知错误'}`);
        }
    }

    // 删除单个教师
    function deleteTeacher(teacherId) {
        teacherToDelete = teacherId;
        isBatchDelete = false;
        deleteDialogOpen = true;
    }

    // 删除选中的教师
    function deleteSelectedTeachers() {
        if (selectedTeachers.size === 0) {
            alert('请先选择要删除的教师');
            return;
        }

        isBatchDelete = true;
        deleteDialogOpen = true;
    }

    // 确认删除教师
    async function confirmDeleteTeachers() {
        let teacherAccounts = [];

        if (isBatchDelete) {
            // 批量删除
            const selectedIds = Array.from(selectedTeachers);
            teacherAccounts = teacher_list
                .filter(teacher => selectedIds.includes(teacher.id))
                .map(teacher => teacher.account);
        } else {
            // 单个删除
            const teacher = teacher_list.find(t => t.id === teacherToDelete);
            if (!teacher) {
                console.log('未找到教师信息');
                throw new Error('未找到教师信息');
            }
            teacherAccounts = [teacher.account];
        }

        if (teacherAccounts.length === 0) {
            console.log('未找到教师账号信息');
            throw new Error('未找到教师账号信息');
        }

        const response = await fetch('/api/admin/teacher', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                data: teacherAccounts
            })
        });

        if (!response.ok) {
            console.log(`请求失败: ${response.status}`);
            throw new Error(`请求失败: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.status === 0) {
            // 删除成功，从列表中移除教师
            if (isBatchDelete) {
                // 批量删除
                teacher_list = teacher_list.filter(teacher => !selectedTeachers.has(teacher.id));
                resetSelection(); // 重置选中状态
            } else {
                // 单个删除
                teacher_list = teacher_list.filter(teacher => teacher.id !== teacherToDelete);
            }

            // 更新总记录数
            totalItems = teacher_list.length;
            totalPages = Math.ceil(totalItems / pageSize);

            // 如果当前页空了，则返回上一页
            if (teacher_list.length === 0 && currentPage > 1) {
                currentPage--;
                await fetchTeachersList();
            }
        } else {
            console.error(`删除失败: ${result.message || '未知错误'}`);
            alert(`删除失败: ${result.message || '未知错误'}`);
        }
    }
</script>

<!-- 表头 -->
{#snippet tableHead()}
    <tr class = "table-head-row">
        <th style="width: 3%;" class = "table-head">
            <input
                type="checkbox"
                class="checkbox-all"
                checked={allSelected}
                onclick={toggleAllSelection}
            />
        </th>
        <th style="width: 10%;" class = "table-head">账号</th>
        <th style="width: 5%;" class = "table-head">姓名</th>
        <th style="width: 5%;" class = "table-head">性别</th>
        <th style="width: 7%;" class = "table-head">电话</th>
        <th style="width: 5%;" class = "table-head">帐号状态</th>
        <th style="width: 5%;" class = "table-head">题库数量</th>
        <th style="width: 7%;" class = "table-head">授课学生数</th>
        <th style="width: 5%;" class = "table-head">班级数量</th>
        <th style="width: 7%;" class = "table-head">入职时间</th>
        <th style="width: 5%;" class = "table-head">当前状态</th>
        <th style="width: 12%;" class = "table-head">操作</th>
    </tr>
{/snippet}

<!--状态标签-->
{#snippet stateRender(/** @type {"00" | "02"} */ state, /** @type {string} */ addi)}
    <span class="status-text {StateClassMap[state]}">{StateMap[state]}</span>
{/snippet}

<!--操作按钮-->
{#snippet actionRender(/** @type {"00" | "02"} */ state,/** @type {number} */ index)}
    <div class="button-container" style="background-color: rgb(0, 0, 0, 0);">
        <button class = "view-details-button action-button" onclick={() => goto(`/teacher/teacherManagement/teacherDetail?account=${teacher_list[index].account}`)}>详情</button>
        <button class = "edit-teacher-button action-button" onclick={() => goto(`/teacher/teacherManagement/editTeacher?account=${teacher_list[index].account}`)}>修改</button>
        {#if state === "00"}
            <button class = "disable-teacher-button action-button" onclick={() => deactivateTeacher(teacher_list[index].id)}>停用</button>
        {:else if state === "02"}
            <button class = "enable-teacher-button action-button" onclick={() => activateTeacher(teacher_list[index].id)}>启用</button>
        {/if}
        <button class = "delete-teacher-button action-button" style="color: red;" onclick={() => deleteTeacher(teacher_list[index].id)}>删除</button>
    </div>
{/snippet}

{#snippet tableData(/** @type {{ account: string; name: string; gender: string; phone: string; account_status: string; question_bank_count: string; student_count: string; class_count: string; join_time: string; state: string; addi?: string}} */  data,/** @type {any} */ index)}
    <tr class = "table-data-tr">
        <td class = "teacher-checkbox default-td">
            <input
                type="checkbox"
                class="checkbox-item"
                checked={selectedTeachers.has(data.id)}
                onclick={() => toggleTeacherSelection(data.id)}
            />
        </td>
        <td class = "teacher-account default-td">
            {data.account}
        </td>
        <td class = "teacher-name default-td">
            {data.name}
        </td>
        <td class = "teacher-gender default-td">
            {data.gender}
        </td>
        <td class = "teacher-phone default-td">
            {data.phone}
        </td>
        <td class = "teacher-account-status default-td">
            {data.account_status}
        </td>
        <td class = "teacher-course-number default-td">
            {data.question_bank_count}
        </td>
        <td class = "teacher-student-number default-td">
            {data.student_count}
        </td>
        <td class = "teacher-class-number default-td">
            {data.class_count}
        </td>
        <td class = "teacher-join-time default-td">
            {formatDate(data.join_time)}
        </td>
        <td class = "teacher-status default-td">
            {@render stateRender(data.state,data.addi)}
        </td>
        <td class="default-td">
            {@render actionRender(data.state,index)}
        </td>
    </tr>
{/snippet}

<div class = "teacher-management-container">
    <Title title="教师列表" />

    <div class = "table-action-container">
        <div class="action-layout">
            <!-- 左侧：填写框部分 -->
            <div class="left-section">
                <!-- 性别/账号搜索 -->
                <div class="input-item">
                    <span class="item-label">性别/账号</span>
                    <div class="input-container">
                        <div class="search-input-container">
                            <input
                                type="text"
                                bind:value={searchValue}
                                oninput={updateSearchClearButtonVisibility}
                                placeholder="请输入文字搜索"
                                class="search-input"
                                onkeydown={(e) => {
                                    if (e.key === 'Enter') {
                                        fetchTeachersList();
                                    }
                                }}
                                onblur={() => {
                                    fetchTeachersList();
                                }}
                            />
                            {#if showSearchClearBtn}
                                <button class="clear-button" onclick={() => {
                                    clearSearchValue();
                                    fetchTeachersList(); // 清除后重新获取数据
                                }}>×</button>
                            {/if}
                        </div>
                    </div>
                </div>
                <!-- 账号状态下拉菜单 -->
                <div class="input-item">
                    <span class="item-label">帐号状态</span>
                    <div class="input-container">
                        <DropdownGray
                            options = {[
                                {value:"all",label:"全部"},
                                {value:"00",label:"已启用"},
                                {value:"02",label:"已停用"}
                            ]}
                            selected = {selectedStatus}
                            selectOptionFunc={(value) => { selectedStatus = value; fetchTeachersList(); }}
                        ></DropdownGray>
                    </div>
                </div>
                <!-- 入职时间日期选择器 -->
                <div class="input-item">
                    <span class="item-label">入职时间</span>
                    <div class="input-container">
                        <DatePicker
                            onSelectDate={(start, end) => {
                                startDate = start;
                                endDate = end;
                                fetchTeachersList();
                            }}
                            onClearDate={() => {
                                startDate = null;
                                endDate = null;
                                fetchTeachersList();
                            }}
                        ></DatePicker>
                    </div>
                </div>
                <!-- 课程数量 -->
                <div class="input-item">
                    <span class="item-label">课程数量</span>
                    <div class="input-container">
                        <div class="range-container">
                            <input
                                    type="text"
                                    class="range-input min-value"
                                    placeholder="最小数量"
                                bind:value={courseMinValue}
                                oninput={updateClearButtonVisibility}
                                onblur={() => {
                                    fetchTeachersList();
                                }}
                            />
                            <span class="range-separator">~</span>
                            <input
                                type="text"
                                class="range-input max-value"
                                placeholder="最大数量"
                                bind:value={courseMaxValue}
                                oninput={updateClearButtonVisibility}
                                onblur={() => {
                                    fetchTeachersList();
                                }}
                            />
                            {#if showCourseClearBtn}
                                <button class="clear-button" onclick={clearCourseValues}>×</button>
                            {/if}
                        </div>
                    </div>
                </div>
                <!-- 学生数量 -->
                <div class="input-item">
                    <span class="item-label">学生数量</span>
                    <div class="input-container">
                        <div class="range-container">
                            <input
                                type="text"
                                class="range-input min-value"
                                placeholder="最小数量"
                                bind:value={studentMinValue}
                                oninput={updateClearButtonVisibility}
                                onblur={() => {
                                    fetchTeachersList();
                                }}
                            />
                            <span class="range-separator">~</span>
                            <input
                                type="text"
                                class="range-input max-value"
                                placeholder="最大数量"
                                bind:value={studentMaxValue}
                                oninput={updateClearButtonVisibility}
                                onblur={() => {
                                    fetchTeachersList();
                                }}
                            />
                            {#if showStudentClearBtn}
                                <button class="clear-button" onclick={clearStudentValues}>×</button>
                            {/if}
                        </div>
                    </div>
                </div>
                <!-- 班级数量 -->
                <div class="input-item">
                    <span class="item-label">班级数量</span>
                    <div class="input-container">
                        <div class="range-container">
                            <input
                                type="text"
                                class="range-input min-value"
                                placeholder="最小数量"
                                bind:value={classMinValue}
                                oninput={updateClearButtonVisibility}
                                onblur={() => {
                                    fetchTeachersList();
                                }}
                            />
                            <span class="range-separator">~</span>
                            <input
                                type="text"
                                class="range-input max-value"
                                placeholder="最大数量"
                                bind:value={classMaxValue}
                                oninput={updateClearButtonVisibility}
                                onblur={() => {
                                    fetchTeachersList();
                                }}
                            />
                            {#if showClassClearBtn}
                                <button class="clear-button" onclick={clearClassValues}>×</button>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧：操作按钮部分 -->
            <div class="right-section">
                <!-- 导出按钮 -->
                <div class="button-item">
                    <button class="export-button action-btn">导出</button>
                </div>
                <!-- 导入按钮 -->
                <div class="button-item">
                    <button class="import-button action-btn">导入</button>
                </div>
                <!-- 新增按钮 -->
                <div class="button-item">
                    <button class="add-teacher-button action-btn" onclick={() => goto('/teacher/teacherManagement/addTeacher')}>新增</button>
                </div>
                <!-- 删除按钮 -->
                <div class="button-item">
                    <button class="delete-button action-btn" onclick={deleteSelectedTeachers}>删除</button>
                </div>
                <!-- 启用按钮 -->
                <div class="button-item">
                    <button class="enable-button action-btn" onclick={activateSelectedTeachers}>启用</button>
                </div>
                <!-- 停用按钮 -->
                <div class="button-item">
                    <button class="disable-button action-btn" onclick={deactivateSelectedTeachers}>停用</button>
                </div>
            </div>
        </div>
    </div>

    <div class = "table-container">
        <table class = "teacher-list-table">
            <thead class = "teacher-list-table-head">
            {@render tableHead()}
            </thead>
            <tbody class = "teacher-list-table-data">
            {#each teacher_list as data, index}
                {@render tableData(data, index)}
            {/each}
            </tbody>
        </table>
        <div class="pagination-container">
            {#if loading}
                <div class="loading-indicator">加载中...</div>
            {:else if error}
                <div class="error-message">加载失败: {error}</div>
            {:else if teacher_list.length === 0}
                <div class="empty-message">暂无教师数据</div>
            {:else}
                <Pagination
                    total_data_num={totalItems}
                    total_page_num={totalPages}
                    current_page_num={currentPage}
                    max_show_page_num={5}
                    data_num_per_page_options={[
                        { value: 10, label: "10条/页" },
                        { value: 20, label: "20条/页" },
                        { value: 50, label: "50条/页" }
                    ]}
                    selected={pageSize}
                    onPageChangeFunc={handlePageNavigation}
                    onPageChooseFunc={handlePageSelect}
                    selectOptionFunc={handlePageSizeChange}
                    onPageSearchFunc={handlePageSearch}
                    expand_direction="up"
                ></Pagination>
            {/if}
        </div>
    </div>

    <!-- 删除确认对话框 -->
    <Dialog
        bind:isOpen={deleteDialogOpen}
        title="确认删除所选教师？"
        content="该操作不可逆，请谨慎操作。"
        confirmTextBackgroundColor="#E34D59"
        onConfirm={confirmDeleteTeachers}
    />
</div>

<style lang="scss">
  $normal-font-size:14px;
  $gray-font-color: rgb(0,0,0,0.6);

  .teacher-management-container {
    position: relative;
    background-color: white;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    min-width: 1000px;

    @media (max-width: 1200px) {
      min-width: 800px;
    }

    @media (max-width: 992px) {
      min-width: 700px;
    }

    @media (max-width: 768px) {
      min-width: 600px;
    }
  }

  .big-title {
    display: flex;
    align-items: center;
    height: 60px;
    min-height: 60px;
    padding-left: 32px;
    .big-title-icon {
      width: 7px;
      height: 24px;
      background-color: #0052d9;
    }

    .big-title-text {
      font-size: 20px;
      font-weight: bold;
      padding-left: 2px;
    }
  }

  .table-action-container {
    display: flex;
    flex-direction: column;
    padding: 17px 0 0 30px;

    @media (max-width: 1200px) {
      padding: 17px 20px 0 20px;
    }

    @media (max-width: 768px) {
      padding: 17px 10px 0 10px;
    }

    .action-layout {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 20px;
      flex-wrap: wrap; /* 允许在必要时换行 */
      gap: 20px; /* 减小间距以适应更窄的屏幕 */
      align-items: flex-start; /* 确保顶部对齐 */

      @media (max-width: 1400px) {
        gap: 15px;
      }

      @media (max-width: 1200px) {
        gap: 15px;
      }

      @media (max-width: 992px) {
        gap: 15px;
        flex-direction: row; /* 确保在中等屏幕上保持行布局 */
      }

      @media (max-width: 768px) {
        gap: 10px;
        flex-direction: column; /* 在非常窄的屏幕上改为列布局 */
      }
    }

    /* 左侧填写框部分 */
    .left-section {
      display: grid;
      grid-template-columns: repeat(3, minmax(240px, 2fr)); /* 设置最小宽度 */
      grid-template-rows: repeat(2, 1fr);
      gap: 20px;
      flex: 1; /* 使用弹性布局 */
      min-width: 600px; /* 设置最小宽度 */
      max-width: 100%; /* 设置最大宽度 */

      @media (max-width: 1600px) {
        min-width: 550px;
        grid-template-columns: repeat(2, minmax(240px, 1fr));
        grid-template-rows: repeat(3, 1fr);
      }

      @media (max-width: 1200px) {
        min-width: 500px;
        grid-template-columns: repeat(2, minmax(240px, 1fr));
        grid-template-rows: repeat(3, 1fr);
      }

      @media (max-width: 992px) {
        min-width: 400px;
        max-width: 100%;
        width: 100%;
        margin-bottom: 20px;
        flex-basis: 100%; /* 确保在小屏幕上占据整行 */
        order: 1; /* 确保在小屏幕上显示在最前面 */
      }
    }

    .input-item {
      display: flex;
      align-items: center;

      .item-label {
        font-size: $normal-font-size;
        color: $gray-font-color;
        min-width: 70px;
        display: inline-block;
        text-align: right;
        margin-right: 10px;
      }

      .input-container {
        width: 100%;
        height: 32px;
        display: flex;
      }

      .search-input-container {
        height: 100%;
        width: 100%;
        flex: 1;
        border: 1px solid rgb(221, 221, 221, 1);
        border-radius: 3px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        padding: 0 0 0 5px;
        position: relative;
      }

      .search-input {
        flex: 1;
        border: none;
        outline: none;
        height: 100%;
        width: 100%;
        padding: 0 25px 0 5px;
        font-size: 14px;
        background-color: transparent;
        box-sizing: border-box;
      }

      .range-container {
        display: flex;
        align-items: center;
        border: 1px solid #ddd;
        border-radius: 3px;
        padding: 0 10px;
        height: 32px;
        width: 100%;
        box-sizing: border-box; /* 确保padding不会增加元素总高度 */
        position: relative;

        .range-input {
          border: none;
          outline: none;
          width: 100%;
          height: 28px;
          font-size: $normal-font-size;
          color: #333;
          background: transparent;
          text-align: center; /* 添加文本居中 */

          &::placeholder {
            color: #999;
            font-size: $normal-font-size;
            text-align: center; /* 添加占位符文本居中 */
          }
        }

        .range-separator {
          margin: 0 5px;
          color: #999;
          line-height: 32px; /* 使分隔符垂直居中 */
          text-align: center; /* 添加分隔符居中 */
        }

        .clear-button {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            color: #666;
          }
        }
      }
    }

    /* 右侧按钮部分 */
    .right-section {
      display: grid;
      grid-template-columns: repeat(3, minmax(70px, 1fr)); /* 减小最小宽度以适应更窄的屏幕 */
      grid-template-rows: repeat(2, 1fr);
      gap: 20px; /* 减小间距以适应更窄的屏幕 */
      flex: 0 0 auto; /* 不伸缩但保持自身大小 */
      min-width: 280px; /* 减小最小宽度 */
      margin-right: 40px; /* 减小右边距 */

      /* 大屏幕布局 - 3列2行 */
      @media (min-width: 1401px) {
        grid-template-columns: repeat(3, minmax(70px, 1fr));
        grid-template-rows: repeat(2, 1fr);
      }

      /* 中等屏幕布局 - 先减小按钮宽度 */
      @media (max-width: 1400px) and (min-width: 1201px) {
        grid-template-columns: repeat(3, minmax(60px, 1fr));
        grid-template-rows: repeat(2, 1fr);
        gap: 20px;
        margin-right: 30px;
      }

      /* 较小屏幕布局 - 2列3行 */
      @media (max-width: 1600px) and (min-width: 992px) {
        grid-template-columns: repeat(2, minmax(60px, 1fr));
        grid-template-rows: repeat(3, 1fr);
        gap: 20px;
        margin-right: 20px;
      }

      /* 小屏幕布局 - 换行后的布局 */
      @media (max-width: 992px) {
        grid-template-columns: repeat(3, minmax(60px, 1fr));
        grid-template-rows: repeat(2, 1fr);
        gap: 10px;
        margin-right: 0;
        margin-top: 15px;
        width: 100%;
        flex-basis: 100%; /* 确保在小屏幕上占据整行 */
        order: 2; /* 确保在小屏幕上显示在左侧部分之后 */
      }

      /* 最小屏幕布局 - 2列3行，更小的间距 */
      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(3, 1fr);
        gap: 8px;
        margin-right: 0;
        width: 100%;
      }
    }

    .button-item {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;

      @media (max-width: 1200px) {
        min-width: 0; /* 移除最小宽度限制 */
      }
    }

    .action-btn {
      border-radius: var(--btn-border-radius);
      height: 32px;
      padding: 0 10px; /* 减小内边距 */
      font-size: 14px;
      cursor: pointer;
      min-width: 60px; /* 减小最小宽度 */
      text-align: center;
      width: 100%; /* 使按钮填充容器 */
      max-width: 120px; /* 设置最大宽度 */
      white-space: nowrap; /* 防止文本换行 */
      overflow: hidden; /* 隐藏溢出内容 */
      text-overflow: ellipsis; /* 显示省略号 */
      transition: all 0.3s ease; /* 添加过渡效果 */

      /* 响应式调整按钮内边距和字体大小 */
      @media (max-width: 1400px) and (min-width: 1201px) {
        padding: 0 8px;
        min-width: 50px;
      }

      @media (max-width: 1200px) and (min-width: 992px) {
        padding: 0 6px;
        min-width: 45px;
        font-size: 13px;
      }

      @media (max-width: 992px) {
        padding: 0 6px;
        min-width: 40px;
        font-size: 13px;
      }
    }

    /* 按钮样式 */
    .add-teacher-button {
      background-color: var(--blue);
      color: white;
      border: none;
    }

    .export-button, .import-button {
      background-color: white;
      color: #333;
      border: 1px solid #ddd;
    }

    .delete-button {
      background-color: var(--red);
      color: white;
      border: none;
    }

    .enable-button {
      background-color: var(--green);
      color: white;
      border: none;
    }

    .disable-button {
      background-color: var(--orange);
      color: white;
      border: none;
    }
  }

  .state-tag {
    border: none;
    border-radius: 10px;
    color:rgba(0, 0, 0, 0.75);
    font-size: 12px;
    width: 74px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: auto;
    &.unpublished {
      background-color: #689BFF;
    }
    &.to-start {
      background-color: #0052D9;
    }
    &.ended {
      background-color: #001B9F;
    }
    &.archived {
      background-color: #7F7F7F;
    }
    &.on-going {
      background-color: #117C00;
    }
    &.error {
      background-color: #D90000;
    }
  }

  .status-text {
    font-size: 14px;
    &.enabled {
      color: var(--green);
      font-weight: 500;
    }
    &.disabled {
      color: var(--red);
      font-weight: 500;
    }
    &.deleted {
      color: rgba(0, 0, 0, 0.5);
    }
  }

  .teacher-list-table {
    font-size: 14px;
    border-collapse: collapse;
    width: 100%;
  }

  .checkbox-all,
  .checkbox-item {
    width: 16px;
    height: 16px;
    cursor: pointer;
    vertical-align: middle;
    accent-color: #0052d9;
  }

  .teacher-list-table-head {
    background-color: #ffffff;
    font-size: 14px;
    font-weight: normal;
    color: rgb(0, 0, 0, 0.3);
    border: none;
    padding: 8px;
    text-align: center;
  }

  .table-head-row{
    height:40px;
    .table-head{
      font-weight: normal;
    }
  }

  .teacher-time-sort-button{
    border: none;
    background-color: white;
    font-size: 14px;
    font-weight: normal;
    color: rgb(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    margin: auto;
    cursor: pointer;
  }

  .teacher-list-table-data {
    .table-data-tr {
      border-top: none;
      border-bottom: 1px solid #ddd;
      border-left: none;
      border-right: none;
      padding: 8px;
      font-size: 14px;
      text-align: center;
      color: rgb(0, 0, 0, 0.75);
      height: 60px;
    }
    .table-data-tr:hover {
      background-color: #ECF2FE;
    }
  }

  .table-container {
    padding: 5px 37px 50px 37px;
    overflow-x: auto;

    @media (max-width: 1200px) {
      padding: 5px 20px 50px 20px;
    }

    @media (max-width: 768px) {
      padding: 5px 10px 50px 10px;
    }
  }

  .action-button {
    border:none;
    background-color: rgb(0, 0, 0, 0);
    color: var(--blue);
    cursor: pointer;
    font-size: 14px;
  }

  .action-button:hover {
    font-weight: bold;
  }

  .pagination-container {
    justify-self: right;
    padding: 20px 0 0 0;
    display: flex;
    justify-content: right;
    align-items: center;
    width: 100%;

    .loading-indicator {
      color: $gray-font-color;
      font-size: $normal-font-size;
      padding: 20px;
    }

    .error-message {
      color: #d9001b;
      font-size: $normal-font-size;
      padding: 20px;
    }

    .empty-message {
      color: $gray-font-color;
      font-size: $normal-font-size;
      padding: 20px;
    }
  }

  .tip {
    position:absolute;
    border: none;
    background-color: rgb(0,0,0,0);
    left:95%;
    display: flex;
    align-items: center;
    justify-content: center;
    top:4px
  }

  .tooltip-text {
    visibility: hidden;
    width: max-content;
    max-width: 200px;
    background-color: white;
    border: 1px solid #D7D7D7;
    color: black;
    text-align: left;
    padding: 6px 8px;
    border-radius: 4px;
    position: absolute;
    z-index: 1;
    bottom: 150%;
    left: 50%;
    transform: translateX(-50%);
    white-space: pre-line;
    font-size: 12px;
    line-height: 1.4;
  }

  .more-action-list {
    position:absolute;
    box-sizing: border-box;
    overflow-y: auto;
    background-color: white;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 0;
    width: 110px;
    max-height: 115px;
    border: 1px solid rgb(0, 0, 0, 0.3);
    border-radius: 3px;
  }
  .more-action-button {
    border: none;
    background-color: white;
    font-size: 14px;
    color: rgb(0, 0, 0, 0.75);
    height: 26px;
    width: 100%;
    cursor: pointer;
  }
  .more-action-button:hover {
    background-color: rgba(242, 242, 242, 0.35);
    border-radius: 5px;
  }

  .clear-button {
    position: absolute;
    right: 5px;
    background: none;
    border: none;
    cursor: pointer;
    color: #999;
    font-size: 16px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>