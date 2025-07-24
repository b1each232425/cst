<!--
 * @Author: chenyijun
 * @Date: 2025-04-19 19:38:33
 * @LastEditors: chenyijun
 * @LastEditTime: 2025-05-02 20:37:34
 -->
<script>
    import Pagination from "$lib/component/Pagination.svelte";
    import { checkData } from "$lib/batch_check/check_examinee";
    import { onMount } from "svelte";
    
    let { 
        show = $bindable(false),
        selectedStudents = ([]),
        onSelectionChangeFunc = (/** @type {any[]} */ students) => { console.log("学生选择变更:", students); },
        students = ([])
    } = $props();
    
    /**
     * @typedef {Object} Student
     * @property {number} id - 学生ID
     * @property {string} name - 学生姓名
     * @property {string} phone_number - 学生手机号
     * @property {string} id_card - 学生身份证号
     */
    
    // 暂存选中的学生
    /** @type {Student[]} */
    let tempSelectedStudents = $state([]);
    
    // 处理show变化
    let prevShow = false;
    
    /**
     * 监视show属性变化的函数
     * @param {boolean} newShow - 新的show值
     */
    function handleShowChange(newShow) {
        if (newShow && !prevShow) {
            // 加载初始数据，但不再使用props的双向绑定
            tempSelectedStudents = [...selectedStudents];
        }
        prevShow = newShow;
    }
    onMount(() => {
        if (students && students.length > 0) {
            // 选中所有学生
            tempSelectedStudents = [...students];
            // 设置全选状态为true
            allSelected = true;
            onSelectionChangeFunc(tempSelectedStudents);
        }
    });
    
    // 分页相关
    let currentPage = $state(1);
    let pageSize = $state(10);
    let totalStudents = $state(students.length);
    let totalPages = $derived(Math.ceil(totalStudents / pageSize));
    
    // 筛选相关
    let searchKeyword = $state('');
    let showSelected = $state(false);
    let showUnselected = $state(false);
    
    // 文件上传相关
    let fileInput = $state(/** @type {HTMLInputElement | null} */ (null));
    
    // 全选当前页状态
    let allSelected = $state(false);
    
    /**
     * 更新全选状态
     */
    function updateAllSelectedState() {
        const currentPageStudents = getFilteredStudents();
        // 只有当当前页有学生，且全部被选中时，全选状态才为true
        allSelected = currentPageStudents.length > 0 && 
                      currentPageStudents.every((/** @type {Student} */ student) => 
                          tempSelectedStudents.some((/** @type {Student} */ s) => s.id === student.id));
    }
    
    /**
     * 更新分页信息
     */
    function updatePaginationInfo() {
        totalStudents = students.length;
    }
    
    // 选择/取消选择所有学生
    function toggleSelectAll() {
        const currentPageStudents = getFilteredStudents();
        
        if (allSelected) {
            // 取消选择所有当前页学生
            tempSelectedStudents = tempSelectedStudents.filter((/** @type {Student} */ student) => 
                !currentPageStudents.some((/** @type {Student} */ s) => s.id === student.id)
            );
            allSelected = false;
        } else {
            // 选择所有当前页学生
            const newSelected = [...tempSelectedStudents];
            currentPageStudents.forEach((/** @type {Student} */ student) => {
                if (!tempSelectedStudents.some((/** @type {Student} */ s) => s.id === student.id)) {
                    newSelected.push(student);
                }
            });
            tempSelectedStudents = newSelected;
            allSelected = true;
        }
        
        updateSelectedCount();
    }
    
    // 选择/取消选择单个学生
    /**
     * @param {Student} student - 要切换选择状态的学生
     */
    function toggleSelectStudent(student) {
        const index = tempSelectedStudents.findIndex(s => s.id === student.id);
        
        if (index === -1) {
            // 选择学生
            tempSelectedStudents = [...tempSelectedStudents, student];
        } else {
            // 取消选择学生
            tempSelectedStudents = tempSelectedStudents.filter(s => s.id !== student.id);
        }
        
        updateAllSelectedState();
        updateSelectedCount();
    }
    
    // 根据筛选条件获取学生列表
    function getFilteredStudents() {
        return students.filter((/** @type {Student} */ student) => {
            // 搜索关键字过滤
            const matchesKeyword = searchKeyword === '' || 
                student.name.includes(searchKeyword) || 
                student.phone_number.includes(searchKeyword) ||
                student.id_card.includes(searchKeyword);
            
            // 已选/未选过滤
            const isSelected = tempSelectedStudents.some((/** @type {Student} */ s) => s.id === student.id);
            const matchesSelectedFilter = 
                (!showSelected && !showUnselected) || 
                (showSelected && isSelected) || 
                (showUnselected && !isSelected);
            
            return matchesKeyword && matchesSelectedFilter;
        });
    }
    
    // 确认选择
    function confirmSelection() {
        // 不再更新selectedStudents绑定，而是通过回调函数通知父组件
        onSelectionChangeFunc(tempSelectedStudents);
        show = false;
    }
    
    // 取消选择
    function cancelSelection() {
        show = false;
    }
    
    // 搜索学生
    function searchStudents() {
        currentPage = 1; // 重置到第一页
        updateAllSelectedState();
    }
    
    // 导入学生
    function importStudents() {
        if (fileInput) {
            fileInput.click();
        }
    }
    
    // 处理文件上传
    /**
     * @param {Event} event - 文件上传事件
     */
    async function handleFileUpload(event) {
        const target = /** @type {HTMLInputElement} */(event.target);
        const file = target.files?.[0]; // 选中的第一个文件
        if (file) {
                let result = await checkData(file);
                // 校验表头 - 移除不必要的错误处理
                if (result.data?.length > 0) {
                    // 转换数据格式并更新学生列表
                    let tempData = result.data;
                    // 新导入的学生数据
                    const newStudents = transformData(tempData);

                    console.log(newStudents);
                    
                    // 过滤掉重复数据
                    const uniqueNewStudents = filterDuplicateStudents(newStudents);
                    
                    // 添加到现有列表而不是替换
                    if (students.length > 0 && uniqueNewStudents.length > 0) {
                        // 计算新的ID起始值（避免ID冲突）
                        const maxId = Math.max(...students.map((/** @type {Student} */ s) => s.id));
                        uniqueNewStudents.forEach((student, index) => {
                            student.id = maxId + index + 1;
                        });
                        
                        // 合并到现有列表
                        students = [...students, ...uniqueNewStudents];
                    } else if (uniqueNewStudents.length > 0) {
                        // 如果是首次导入，直接使用新数据
                        students = uniqueNewStudents;
                    }
                    
                    // 默认全选新导入的学生
                    tempSelectedStudents = [...tempSelectedStudents, ...uniqueNewStudents];
                    
                    // 更新全选状态和分页信息
                    updateAllSelectedState();
                    updatePaginationInfo();
                    updateSelectedCount();
                    console.log("导入成功")
                }
             catch (err) {
                console.error('文件处理错误:', err);
            }
            
            // 重置文件输入，允许上传相同文件
            target.value = '';
        }
    }
    
    /**
     * 过滤掉重复的学生数据
     * @param {Student[]} newStudents - 新导入的学生数据
     * @returns {Student[]} - 过滤后不重复的学生数据
     */
    function filterDuplicateStudents(newStudents) {
        // 过滤掉与现有列表中重复的数据（基于姓名、手机号和身份证号的组合）
        return newStudents.filter(newStudent => {
            // 检查是否与现有学生重复
            const isDuplicate = students.some((/** @type {Student} */ existingStudent) => 
                existingStudent.name === newStudent.name && 
                existingStudent.phone_number === newStudent.phone_number &&
                existingStudent.id_card === newStudent.id_card
            );
            
            // 同时也要检查新学生列表内部是否有重复
            const duplicateIndex = newStudents.findIndex(student => 
                student !== newStudent && // 不是同一个对象
                student.name === newStudent.name && 
                student.phone_number === newStudent.phone_number &&
                student.id_card === newStudent.id_card
            );
            
            // 如果是第一次出现，且不与现有列表重复，则保留
            return !isDuplicate && duplicateIndex === -1;
        });
    }
    
    /**
     * 转换导入数据为学生格式
     * @param {any[]} dataArray - 导入的原始数据
     * @returns {any[]} - 转换后的学生数据
     */
    function transformData(dataArray) {
        // 转换数据
        const transformed = dataArray.map((item, index) => {
            // 创建学生对象
            let student = { 
                id: index + 1,
                name: item['姓名'] || '',
                phone_number: item['手机号'] || '',
                id_card: item['身份证号'] || ''
            };
            
            return student;
        });
        
        return transformed;
    }
    
    // 当前已选数量
    let selectedCount = $state(0);
    
    // 更新已选数量
    function updateSelectedCount() {
        selectedCount = tempSelectedStudents.length;
    }
    
    // 当页码改变时的处理函数
    /**
     * @param {boolean} isNext - 是否前往下一页
     */
    function handlePageChange(isNext) {
        if (isNext) {
            currentPage = Math.min(totalPages, currentPage + 1);
        } else {
            currentPage = Math.max(1, currentPage - 1);
        }
        updateAllSelectedState();
    }
    
    // 当选择特定页码时的处理函数
    /**
     * @param {number} pageNum - 要跳转的页码
     */
    function handlePageChoose(pageNum) {
        currentPage = pageNum;
        updateAllSelectedState();
    }
    
    // 当选择每页条数时的处理函数
    /**
     * @param {string|number} value - 每页显示的条数
     */
    function handlePageSizeChange(value) {
        // 确保value是数字类型
        const pageSizeValue = typeof value === 'string' ? parseInt(value) : value;
        pageSize = pageSizeValue;
        currentPage = 1; // 重置到第一页
        updatePaginationInfo();
        updateAllSelectedState();
    }
    
    // 当输入页码跳转时的处理函数
    /**
     * @param {string} value - 输入的页码字符串
     */
    function handlePageSearch(value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
            currentPage = pageNum;
            updateAllSelectedState();
        }
    }
    
    // 初始化时更新已选数量
    updateSelectedCount();

    async function downloadTemplate() {
        try {
            const response = await fetch('/api/files/exam/d0a9rv6slh1c714h2fkg.xlsx', {
                method: 'GET',
            }).then(response => {

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
            }).then( blob => {
  let filename = '考生导入模板.xlsx';
            
            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            // 清理
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
}).catch(error => { 
     console.error('下载模板失败:', error);
            alert('下载模板失败，请稍后重试');
});
    }
</script>

{#if show}
<!-- 监听show变化 -->
{() => handleShowChange(show)}

<div class="modal-overlay" 
    onclick={cancelSelection} 
    onkeydown={(e) => e.key === 'Escape' && cancelSelection()} 
    tabindex="0" 
    role="dialog" 
    aria-modal="true">
    <div class="modal-content" 
        onclick={(e) => e.stopPropagation()} 
        onkeydown={(e) => e.stopPropagation()}
        tabindex="0"
        role="dialog">
        <div class="modal-header">
            <h2>选择学生</h2>
        </div>
        
        <div class="modal-body">
            <div class="filter-section">
                <div class="search-box">
                    <label class="search-label" for="student-search">搜索学生：</label>
                    <input 
                        id="student-search"
                        type="text" 
                        placeholder="请输入姓名或手机号或身份证号" 
                        bind:value={searchKeyword}
                        oninput={updateAllSelectedState}
                        onkeydown={(e) => e.key === 'Enter' && searchStudents()}
                    />
                </div>
                
                <div class="filter-options">
                    <label class="checkbox-label">
                        <input type="checkbox" bind:checked={showSelected} onchange={updateAllSelectedState} />
                        <span>已选</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" bind:checked={showUnselected} onchange={updateAllSelectedState} />
                        <span>未选</span>
                    </label>
                    <button class="download-template-btn" onclick={downloadTemplate}>下载模板</button>
                    <button class="import-btn" onclick={importStudents}>上传文件</button>
                    <input 
                        type="file" 
                        style="display: none" 
                        onchange={handleFileUpload}
                        bind:this={fileInput}
                        accept=".xlsx,.xls"
                    />
                </div>
            </div>
            
            <div class="student-table">
                <table>
                    <thead>
                        <tr>
                            <th class="checkbox-column">
                                <input 
                                    type="checkbox" 
                                    checked={allSelected} 
                                    onchange={toggleSelectAll}
                                />
                            </th>
                            <th>姓名</th>
                            <th>手机号</th>
                            <th>身份证号</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each getFilteredStudents() as student (student.id)}
                        <tr>
                            <td class="checkbox-column">
                                <input 
                                    type="checkbox" 
                                    checked={tempSelectedStudents.some(s => s.id === student.id)} 
                                    onchange={() => toggleSelectStudent(student)}
                                />
                            </td>
                            <td>{student.name}</td>
                            <td>{student.phone_number}</td>
                            <td>{student.id_card}</td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            
            <div class="pagination-section">
                <div class="selection-info">
                    已选 {selectedCount} 项，共 {totalStudents} 条
                </div>
                
                <Pagination
                    total_data_num={totalStudents}
                    total_page_num={totalPages}
                    current_page_num={currentPage}
                    max_show_page_num={5}
                    data_num_per_page_options={[
                        { value: 10, label: "10条/页" },
                        { value: 20, label: "20条/页" },
                        { value: 30, label: "30条/页" }
                    ]}
                    selected={{ value: pageSize, label: `${pageSize}条/页` }}
                    onPageChangeFunc={handlePageChange}
                    onPageChooseFunc={handlePageChoose}
                    selectOptionFunc={handlePageSizeChange}
                    onPageSearchFunc={handlePageSearch}
                    expand_direction="up"
                />
            </div>
        </div>
        
        <div class="modal-footer">
            <button class="cancel-btn" onclick={cancelSelection}>取消</button>
            <button class="confirm-btn" onclick={confirmSelection}>确定</button>
        </div>
    </div>
</div>
{/if}

<style lang="scss">
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        min-width: 600px;
    }
    
    .modal-content {
        background-color: white;
        border-radius: 4px;
        width: 800px;
        max-width: 90%;
        height: 80vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        min-width: 600px;
    }
    
    .modal-header {
        padding: 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-bottom: 1px solid #eee;
        flex-shrink: 0;
        
        h2 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
    }
    
    .modal-body {
        padding: 16px;
        overflow: hidden;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    
    .filter-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        flex-wrap: wrap;
        gap: 16px;
        padding: 0 10px;
        
        .search-box {
            display: flex;
            align-items: center;
            width: 320px;
            min-width: 280px;
            
            .search-label {
                font-size: 14px;
                color: #333;
                margin-right: 10px;
                white-space: nowrap;
            }
            
            input {
                width: 220px;
                height: 32px;
                padding: 0 10px;
                border: 1px solid #dcdfe6;
                border-radius: 4px;
                font-size: 14px;
                outline: none;
                
                &:focus {
                    border-color: #0336ff;
                }
                
                &::placeholder {
                    color: #c0c4cc;
                }
            }
        }
        
        .filter-options {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            
            .checkbox-label {
                display: flex;
                align-items: center;
                cursor: pointer;
                margin-right: 5px;
                
                input[type="checkbox"] {
                    margin-right: 4px;
                    cursor: pointer;
                    accent-color: #0336ff;
                }
                
                span {
                    font-size: 14px;
                    color: #333;
                    white-space: nowrap;
                }
            }
            
            .download-template-btn {
                height: 32px;
                border: none;
                border-radius: 3px;
                background-color: #e3e3e3;
                color: #165dff;
                font-size: 14px;
                cursor: pointer;
                padding: 0 10px;
                white-space: nowrap;
                
                &:hover {
                    background-color: #d0d0d0;
                }
            }
            
            .import-btn {
                height: 32px;
                border: none;
                border-radius: 3px;
                background-color: #0336ff;
                color: white;
                font-size: 14px;
                cursor: pointer;
                padding: 0 10px;
                white-space: nowrap;
                
                &:hover {
                    background-color: #0329e0;
                }
            }
        }
    }
    
    .student-table {
        flex: 1;
        min-height: 0;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        overflow: auto;
        margin: 16px 10px;
        
        table {
            width: 100%;
            border-collapse: collapse;
            
            th, td {
                padding: 12px 8px;
                text-align: left;
                font-size: 14px;
                border-bottom: 1px solid #ebeef5;
            }
            
            thead {
                position: sticky;
                top: 0;
                z-index: 1;
                
                th {
                    background-color: #f5f7fa;
                    font-weight: 500;
                    color: #606266;
                }
            }
            
            tr:nth-child(even) {
                background-color: #fafafa;
            }
            
            .checkbox-column {
                width: 40px;
                text-align: center;
                
                input[type="checkbox"] {
                    cursor: pointer;
                    accent-color: #0336ff;
                }
            }
        }
    }
    
    .pagination-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        color: #606266;
        flex-shrink: 0;
        padding: 0 10px;
        .selection-info {
            white-space: nowrap;
        }
    }
    
    .modal-footer {
        padding: 16px;
        display: flex;
        justify-content: center;
        border-top: 1px solid #eee;
        gap: 20px;
        flex-shrink: 0;
        
        button {
            width: 120px;
            height: 36px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            white-space: nowrap;
            
            &.confirm-btn {
                background-color: #0336ff;
                border: none;
                color: white;
                
                &:hover {
                    background-color: #0329e0;
                }
            }
            
            &.cancel-btn {
                background-color: white;
                border: 1px solid #dcdfe6;
                color: #606266;
                
                &:hover {
                    border-color: #0336ff;
                    color: #0336ff;
                }
            }
        }
    }
</style> 