<!-- /*
 * @Author: chenyijun 
 * @Date: 2025-04-13 16:36:08 
 * @Last Modified by:   chenyijun 
 * @Last Modified time: 2025-04-13 16:36:08 
 */ -->

<script>
    import Pagination from "$lib/component/Pagination.svelte";

    // 定义类型
    /**
     * @typedef {Object} ClassItem
     * @property {number} id
     * @property {string} name
     * @property {string} course
     * @property {boolean} checked
     */

    /**
     * @typedef {Object} SelectedClassItem
     * @property {number} id
     * @property {string} name
     * @property {string} course
     */

    // 属性定义
    let {
        show = $bindable(false),
        /** @type {SelectedClassItem[]} */
        selectedClasses = $bindable([]),
        /**
         * @callback ConfirmCallback
         * @param {SelectedClassItem[]} classes
         * @returns {void}
         */
        /** @type {ConfirmCallback} */
        onConfirm = (/**@type {SelectedClassItem[]}*/ classes) => {},
    } = $props();

    // 原来的show值
    let prevShow = false;
    
    /**
     * 监视show属性变化的函数
     * @param {boolean} newShow - 新的show值
     */
    function handleShowChange(newShow) {
        // 如果show从false变为true，表示弹窗刚刚打开
        if (newShow && !prevShow) {
            syncSelectedClasses();
        }
        prevShow = newShow;
    }

    // 状态管理
    let courseFilter = $state(""); // 课程筛选值
    let classNameFilter = $state(""); // 班级名称筛选值
    let checkAll = $state(false); // 全选状态
    let currentPage = $state(1); // 当前页码
    let pageSize = $state(8); // 每页显示条数
    let isDropdownOpen = $state(false); // 课程下拉框是否展开

    // 添加课程勾选状态对象
    /** @type {Record<string, boolean>} */
    let courseCheckedState = $state({}); // 存储每个课程的勾选状态

    // 模拟数据
    /** @type {ClassItem[]} */
    let allClasses = $state([
        {
            id: 1,
            name: "课程班级",
            course: "《Svelte入门实战课》",
            checked: false,
        },
        {
            id: 2,
            name: "Svelte入门专项班",
            course: "《Svelte入门实战课》",
            checked: false,
        },
        {
            id: 3,
            name: "英语专项班1",
            course: "《专业计算机英语课》",
            checked: false,
        },
        {
            id: 4,
            name: "英语专项班2",
            course: "《专业计算机英语课》",
            checked: false,
        },
        {
            id: 5,
            name: "英语专项班3",
            course: "《专业计算机英语课》",
            checked: false,
        },
        { id: 6, name: "Vue实战1", course: "《Vue实战课》", checked: false },
        { id: 7, name: "Vue实战2", course: "《Vue实战课》", checked: false },
        { id: 8, name: "Vue实战3", course: "《Vue实战课》", checked: false },
        {
            id: 9,
            name: "React基础1",
            course: "《React入门课》",
            checked: false,
        },
        {
            id: 10,
            name: "React基础2",
            course: "《React入门课》",
            checked: false,
        },
        {
            id: 11,
            name: "React进阶1",
            course: "《React高级课》",
            checked: false,
        },
        {
            id: 12,
            name: "React进阶2",
            course: "《React高级课》",
            checked: false,
        },
        {
            id: 13,
            name: "Node.js入门1",
            course: "《Node.js基础》",
            checked: false,
        },
        {
            id: 14,
            name: "Node.js入门2",
            course: "《Node.js基础》",
            checked: false,
        },
        {
            id: 15,
            name: "Python数据分析1",
            course: "《Python数据科学》",
            checked: false,
        },
        {
            id: 16,
            name: "Python数据分析2",
            course: "《Python数据科学》",
            checked: false,
        },
    ]);

    /**
     * 从班级列表中提取所有不重复的课程
     * @returns {string[]} 课程列表
     */
    function extractCourses() {
        const courseSet = new Set();
        allClasses.forEach((cls) => {
            courseSet.add(cls.course);
        });
        return Array.from(courseSet);
    }

    // 初始化课程勾选状态
    function initCourseCheckedState() {
        /** @type {Record<string, boolean>} */
        const courseObj = {};
        courses.forEach((course) => {
            courseObj[course] = false;
        });
        courseCheckedState = courseObj;
    }

    /**
     * 根据过滤条件筛选班级
     * @returns {ClassItem[]} 筛选后的班级列表
     */
    function filterClasses() {
        return allClasses.filter((cls) => {
            let matchCourse = true;
            let matchName = true;

            if (courseFilter && courseFilter !== "all") {
                matchCourse = cls.course === courseFilter;
            }

            if (classNameFilter) {
                matchName = cls.name
                    .toLowerCase()
                    .includes(classNameFilter.toLowerCase());
            }

            return matchCourse && matchName;
        });
    }

    /**
     * 根据当前页码和页面大小分页班级列表
     * @param {ClassItem[]} classes 要分页的班级列表
     * @returns {ClassItem[]} 分页后的班级列表
     */
    function paginateClasses(classes) {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return classes.slice(startIndex, endIndex);
    }

    /**
     * 计算总页数
     * @param {ClassItem[]} classes 班级列表
     * @returns {number} 总页数
     */
    function calculateTotalPages(classes) {
        return Math.ceil(classes.length / pageSize);
    }

    /**
     * 生成页码数组
     * @param {number} total 总页数
     * @returns {number[]} 页码数组
     */
    function generatePageNumbers(total) {
        const numbers = [];
        for (let i = 1; i <= total; i++) {
            numbers.push(i);
        }
        return numbers;
    }

    /**
     * 计算选中的班级数量
     * @returns {number} 选中的班级数量
     */
    function countSelectedClasses() {
        return allClasses.filter((cls) => cls.checked).length;
    }

    // 提取所有可选课程
    /** @type {string[]} */
    let courses = $state(extractCourses());

    // 初始化课程勾选状态
    initCourseCheckedState();

    // 更新所有派生数据
    function updateData() {
        const filtered = filterClasses();
        filteredClasses = filtered;

        const total = calculateTotalPages(filtered);
        totalPages = total;

        pageNumbers = generatePageNumbers(total);
        pagedClasses = paginateClasses(filtered);
        selectedCount = countSelectedClasses();
    }
    
    // 同步已选班级状态
    function syncSelectedClasses() {
        // 重置所有班级的选中状态
        allClasses.forEach(cls => {
            cls.checked = false;
        });
        
        // 创建一个已选班级ID的集合，用于快速查找
        const selectedIds = new Set(selectedClasses.map(cls => cls.id));
        
        // 根据selectedClasses设置选中状态
        allClasses.forEach(cls => {
            cls.checked = selectedIds.has(cls.id);
        });
        
        // 更新课程选中状态
        updateCourseCheckedState();
        
        // 更新其他相关数据
        updateData();
    }
    
    // 更新课程的选中状态
    function updateCourseCheckedState() {
        courses.forEach(course => {
            // 检查该课程下的所有班级是否都被选中
            const classesOfCourse = allClasses.filter(cls => cls.course === course);
            const allChecked = classesOfCourse.every(cls => cls.checked);
            courseCheckedState[course] = allChecked;
        });
    }

    // 初始化派生状态
    /** @type {ClassItem[]} */
    let filteredClasses = $state([]);

    /** @type {ClassItem[]} */
    let pagedClasses = $state([]);

    let totalPages = $state(1);

    /** @type {number[]} */
    let pageNumbers = $state([]);

    let selectedCount = $state(0);

    // 初始化数据
    updateData();

    // 处理课程勾选变化
    /**
     * @param {string} course
     */
    function handleCourseCheckboxChange(course) {
        courseCheckedState[course] = !courseCheckedState[course];

        // 更新该课程下所有班级的选中状态
        allClasses.forEach((cls) => {
            if (cls.course === course) {
                cls.checked = courseCheckedState[course];
            }
        });

        updateData();
    }

    // 处理课程筛选变化
    function handleCourseFilterChange() {
        currentPage = 1;
        updateData();
    }

    // 处理班级名称筛选变化
    function handleClassNameFilterChange() {
        currentPage = 1;
        updateData();
    }

    // 处理搜索
    function handleSearch() {
        currentPage = 1; // 重置页码
        updateData();
    }

    // 处理重置
    function handleReset() {
        courseFilter = "";
        classNameFilter = "";
        currentPage = 1;

        // 重置课程勾选状态
        courses.forEach((course) => {
            courseCheckedState[course] = false;
        });

        // 重置所有班级选中状态
        allClasses.forEach((cls) => {
            cls.checked = false;
        });

        updateData();
    }

    // 处理全选/取消全选
    function handleToggleAll() {
        checkAll = !checkAll;
        pagedClasses.forEach((cls) => {
            cls.checked = checkAll;
        });
        selectedCount = countSelectedClasses();
    }

    // 处理单个班级选择状态变更
    /**
     * @param {ClassItem} classItem
     */
    function handleToggleClass(classItem) {
        classItem.checked = !classItem.checked;

        // 检查是否全部选中
        checkAll = pagedClasses.every((cls) => cls.checked);
        selectedCount = countSelectedClasses();
    }

    // 处理页码变更
    /**
     * @param {number} page
     */
    function changePage(page) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            pagedClasses = paginateClasses(filteredClasses);
        }
    }

    // 处理确认
    function handleConfirm() {
        selectedClasses = allClasses
            .filter((cls) => cls.checked)
            .map((cls) => ({
                id: cls.id,
                name: cls.name,
                course: cls.course,
            }));
        
        onConfirm(selectedClasses);
        show = false;
    }

    // 处理取消
    function handleCancel() {
        show = false;
    }

    // 处理页面大小变更
    /**
     * @param {Event} event
     */
    function handlePageSizeChange(event) {
        if (event.target instanceof HTMLSelectElement) {
            const target = event.target;
            pageSize = parseInt(target.value);
            currentPage = 1; // 重置页码
            updateData();
        }
    }

    // 分页相关处理函数
    /**
     * @param {boolean} isNext - 是否前往下一页
     */
    function handlePageChange(isNext) {
        if (isNext) {
            changePage(Math.min(totalPages, currentPage + 1));
        } else {
            changePage(Math.max(1, currentPage - 1));
        }
    }
    
    /**
     * @param {number} pageNum - 要跳转的页码
     */
    function handlePageChoose(pageNum) {
        changePage(pageNum);
    }
    
    /**
     * @param {string|number} value - 每页显示的条数
     */
    function handlePageSizeSelect(value) {
        const size = typeof value === 'string' ? parseInt(value) : value;
        pageSize = size;
        currentPage = 1;
        filterClasses();
    }
    
    /**
     * @param {string} value - 输入的页码字符串
     */
    function handlePageSearch(value) {
        const pageNum = parseInt(value);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
            changePage(pageNum);
        }
    }
</script>

{#if show}
    <!-- 监听show变化 -->
    {() => handleShowChange(show)}
    
    <div class="modal-overlay" onclick={handleCancel}>
        <div class="modal-content" onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h2>选择发布班级</h2>
            </div>

            <div class="search-area">
                <div class="search-inputs">
                    <div class="course-dropdown">
                        <div
                            class="dropdown-header"
                            onclick={() => (isDropdownOpen = !isDropdownOpen)}
                        >
                            <span>选择课程</span>
                            <span class="arrow-icon">▼</span>
                        </div>
                        <div
                            class="dropdown-content"
                            style="display: {isDropdownOpen ? 'block' : 'none'}"
                        >
                            {#each courses as course}
                                <div class="dropdown-item">
                                    <div
                                        class="custom-checkbox {courseCheckedState[
                                            course
                                        ]
                                            ? 'checked'
                                            : ''}"
                                        onclick={() =>
                                            handleCourseCheckboxChange(course)}
                                    >
                                        {#if courseCheckedState[course]}
                                            <div class="checkbox-inner"></div>
                                        {/if}
                                    </div>
                                    <label for={`course-${course}`}
                                        >{course}</label
                                    >
                                </div>
                            {/each}
                        </div>
                    </div>
                    <input
                        type="text"
                        class="class-search"
                        placeholder="请输入班级名称"
                        bind:value={classNameFilter}
                        oninput={handleClassNameFilterChange}
                    />
                    <div class="buttons-container">
                        <button class="search-btn" onclick={handleSearch}
                            >搜索</button
                        >
                        <button class="reset-btn" onclick={handleReset}
                            >重置</button
                        >
                    </div>
                </div>
                <div class="selected-count">
                    已选 <span class="count">{selectedCount}</span> 项
                </div>
            </div>

            <div class="class-table">
                <div class="table-header">
                    <div class="checkbox-cell">
                        <div
                            class="custom-checkbox {checkAll ? 'checked' : ''}"
                            onclick={handleToggleAll}
                        >
                            {#if checkAll}
                                <div class="checkbox-inner"></div>
                            {/if}
                        </div>
                        <label for="select-all">全选</label>
                    </div>
                    <div class="sequence-cell">
                        序号 <span class="sort-icon">↓</span>
                    </div>
                    <div class="class-name-cell">班级名称</div>
                    <div class="course-name-cell">所属课程名称</div>
                </div>

                <div class="table-body">
                    {#each pagedClasses as classItem, index}
                        <div class="table-row">
                            <div class="checkbox-cell">
                                <div
                                    class="custom-checkbox {classItem.checked
                                        ? 'checked'
                                        : ''}"
                                    onclick={() => handleToggleClass(classItem)}
                                >
                                    {#if classItem.checked}
                                        <div class="checkbox-inner"></div>
                                    {/if}
                                </div>
                            </div>
                            <div class="sequence-cell">
                                {(currentPage - 1) * pageSize + index + 1}
                            </div>
                            <div class="class-name-cell" title={classItem.name}>
                                {classItem.name}
                            </div>
                            <div
                                class="course-name-cell"
                                title={classItem.course}
                            >
                                {classItem.course}
                            </div>
                        </div>
                    {/each}

                    {#if pagedClasses.length === 0}
                        <div class="empty-data">
                            <p>暂无数据</p>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="pagination">
                <Pagination
                    total_data_num={filteredClasses.length}
                    total_page_num={totalPages}
                    current_page_num={currentPage}
                    max_show_page_num={5}
                    data_num_per_page_options={[
                        { value: 8, label: "8条/页" },
                        { value: 16, label: "16条/页" },
                        { value: 32, label: "32条/页" }
                    ]}
                    selected={{ value: pageSize, label: `${pageSize}条/页` }}
                    onPageChangeFunc={handlePageChange}
                    onPageChooseFunc={handlePageChoose}
                    selectOptionFunc={handlePageSizeSelect}
                    onPageSearchFunc={handlePageSearch}
                />
            </div>

            <div class="modal-footer">
                <button class="cancel-btn" onclick={handleCancel}>取消</button>
                <button class="confirm-btn" onclick={handleConfirm}>确定</button
                >
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    // 定义变量
    $primary-color: #0336ff;
    $border-color: #e8e8e8;
    $border-light: #ebeef5;
    $text-main: #333;
    $text-regular: #606266;
    $text-secondary: #909399;
    $text-placeholder: #c0c4cc;
    $bg-white: white;
    $bg-light: white;
    $bg-lighter: white;

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
    }

    .modal-content {
        width: 90%;
        max-width: 900px;
        height: 90vh;
        max-height: 600px;
        min-height: 300px;
        padding: 0 3%;
        background-color: $bg-white;
        border-radius: 0;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        text-align: center;
        padding: 15px 0;
        border: none;
        flex-shrink: 0;

        h2 {
            font-size: 18px;
            color: $text-main;
            margin: 0;
            font-weight: normal;
        }
    }

    .search-area {
        padding: 12px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: none;
        background-color: $bg-light;
        flex-shrink: 0;
        flex-wrap: wrap;
        gap: 10px;
    }

    .search-inputs {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;

        .buttons-container {
            display: flex;
            gap: 10px;
        }
    }

    .course-dropdown {
        position: relative;
        width: 200px;

        .dropdown-header {
            width: 100%;
            height: 32px;
            border: 1px solid #dcdfe6;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            background-color: $bg-white;
            font-size: 14px;
            color: $text-regular;
            cursor: pointer;
        }

        .dropdown-content {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
            background-color: $bg-white;
            border: 1px solid #dcdfe6;
            border-top: none;
            z-index: 10;

            .dropdown-item {
                padding: 8px 10px;
                display: flex;
                align-items: center;

                label {
                    font-size: 14px;
                    color: $text-regular;
                    cursor: pointer;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                &:hover {
                    background-color: $bg-lighter;
                }
            }
        }
    }

    .select-wrapper {
        position: relative;
        width: 200px;
        max-width: 100%;

        .course-select {
            width: 100%;
            height: 32px;
            border: 1px solid #dcdfe6;
            border-radius: 0;
            padding: 0 10px;
            appearance: none;
            background-color: $bg-white;
            font-size: 14px;
            color: $text-regular;
        }
    }

    .arrow-icon {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
        color: $text-placeholder;
        pointer-events: none;

        &.small {
            font-size: 10px;
        }
    }

    .class-search {
        width: 200px;
        max-width: 100%;
        height: 32px;
        border: 1px solid #dcdfe6;
        border-radius: 0;
        padding: 0 10px;
        font-size: 14px;
        color: $text-regular;
    }

    .search-btn {
        height: 32px;
        padding: 0 15px;
        background-color: $primary-color;
        color: white;
        border: none;
        border-radius: 0;
        cursor: pointer;
        font-size: 14px;
    }

    .reset-btn {
        height: 32px;
        padding: 0 15px;
        background-color: $bg-white;
        color: $text-regular;
        border: 1px solid #dcdfe6;
        border-radius: 0;
        cursor: pointer;
        font-size: 14px;
    }

    .selected-count {
        font-size: 14px;
        color: $text-regular;
        white-space: nowrap;

        .count {
            color: $primary-color;
            font-weight: bold;
        }
    }

    .class-table {
        padding: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 200px;
    }

    .table-header {
        display: flex;
        background-color: $bg-lighter;
        font-weight: normal;
        font-size: 14px;
        color: $text-secondary;
        padding: 12px 0;
        border: none;
        flex-shrink: 0;
    }

    .checkbox-cell {
        min-width: 80px;
        width: auto;
        display: flex;
        align-items: center;
        padding-left: 20px;
        flex-shrink: 0;
        white-space: nowrap;

        label {
            white-space: nowrap;
            display: inline-block;
        }
    }

    .sequence-cell {
        min-width: 60px;
        width: auto;
        display: flex;
        align-items: center;
        flex-shrink: 0;
        white-space: nowrap;
    }

    .sort-icon {
        margin-left: 4px;
        color: $text-placeholder;
        font-size: 12px;
    }

    .class-name-cell {
        flex: 1;
        display: flex;
        align-items: center;
        min-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .course-name-cell {
        flex: 1;
        display: flex;
        align-items: center;
        min-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .table-body {
        flex: 1;
        overflow-y: auto;

        .table-row {
            display: flex;
            font-size: 14px;
            color: $text-regular;
            padding: 12px 0;
            border-bottom: 1px solid $border-light;

            &:hover {
                background-color: $bg-lighter;
            }

            .checkbox-cell,
            .sequence-cell,
            .class-name-cell,
            .course-name-cell {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        .empty-data {
            padding: 40px 0;
            text-align: center;
            color: $text-secondary;
        }
    }

    .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        border-top: 1px solid $border-light;
        background-color: $bg-light;
        flex-shrink: 0;
        flex-wrap: wrap;
        gap: 10px;

        .page-info {
            font-size: 13px;
            color: $text-regular;
        }

        .page-controls {
            display: flex;
            align-items: center;
            gap: 5px;
            flex-wrap: wrap;
        }
    }

    .prev-page,
    .next-page,
    .page-num {
        min-width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #dcdfe6;
        background-color: $bg-white;
        cursor: pointer;
        font-size: 13px;
        color: $text-regular;
    }

    .prev-page,
    .next-page {
        &:disabled {
            color: $text-placeholder;
            cursor: not-allowed;
        }
    }

    .page-num {
        &.active {
            background-color: $primary-color;
            color: white;
            border-color: $primary-color;
        }
    }

    .page-size {
        position: relative;
        margin-left: 15px;
        flex-shrink: 0;

        select {
            height: 28px;
            padding: 0 25px 0 10px;
            border: 1px solid #dcdfe6;
            border-radius: 0;
            appearance: none;
            background-color: $bg-white;
            font-size: 13px;
            color: $text-regular;
        }
    }

    .goto {
        margin-left: 15px;
        font-size: 13px;
        color: $text-regular;
        white-space: nowrap;
    }

    .modal-footer {
        padding: 10px 0;
        border-top: 1px solid $border-light;
        display: flex;
        justify-content: center;
        gap: 20px;
        background-color: $bg-white;
        flex-shrink: 0;

        .cancel-btn,
        .confirm-btn {
            width: 80px;
            height: 32px;
            border-radius: 0;
            font-size: 14px;
            cursor: pointer;
        }

        .cancel-btn {
            background-color: $bg-white;
            border: 1px solid #dcdfe6;
            color: $text-regular;

            &:hover {
                border-color: $primary-color;
                color: $primary-color;
            }
        }

        .confirm-btn {
            background-color: $primary-color;
            border: none;
            color: white;

            &:hover {
                opacity: 0.9;
            }
        }
    }

    /* 响应式设计 */
    @media screen and (max-width: 768px) {
        .modal-content {
            width: 95%;
            height: 95vh;
            padding: 0 2%;
        }

        .search-area {
            flex-direction: column;
            align-items: flex-start;
        }

        .search-inputs {
            width: 100%;
            justify-content: flex-start;
        }

        .select-wrapper,
        .class-search {
            width: 48%;
        }

        .search-btn,
        .reset-btn {
            width: auto;
            min-width: 60px;
            max-width: 80px;
        }

        .selected-count {
            align-self: flex-end;
            margin-top: 10px;
        }

        .checkbox-cell {
            min-width: 70px;
            padding-left: 10px;
        }

        .sequence-cell {
            min-width: 50px;

            .sort-icon {
                display: none;
            }
        }

        .class-name-cell,
        .course-name-cell {
            min-width: 80px;
        }
    }

    @media screen and (max-width: 480px) {
        .search-inputs {
            flex-direction: column;
            width: 100%;

            .buttons-container {
                display: flex;
                gap: 10px;
                width: 100%;
                margin-top: 10px;

                .search-btn,
                .reset-btn {
                    width: 50%;
                    min-width: unset;
                    max-width: unset;
                }
            }
        }

        .select-wrapper,
        .class-search {
            width: 100%;
        }

        .pagination {
            flex-direction: column;
            align-items: center;
        }

        .page-controls {
            margin-top: 10px;
        }

        .table-header,
        .table-row {
            .checkbox-cell {
                min-width: 60px;
                width: auto;
            }

            .sequence-cell {
                min-width: 40px;
                width: auto;
            }

            .class-name-cell,
            .course-name-cell {
                min-width: 60px;
            }
        }
    }

    .custom-checkbox {
        width: 18px;
        height: 18px;
        border: 1px solid #dcdfe6;
        background-color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        margin-right: 8px;
        flex-shrink: 0;

        &.checked {
            border-color: #165dff;
            background-color: white;
        }

        .checkbox-inner {
            width: 12px;
            height: 12px;
            background-color: #165dff;
        }

        &:hover {
            border-color: #165dff;
        }
    }
</style>
