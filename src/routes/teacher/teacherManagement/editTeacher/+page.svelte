<!--
 /*
 * @Author: 王皓 xwcoder7@gmail.com
 * @Date: 2025-04-15 10:30:58
 * @LastEditors: 王皓 xwcoder7@gmail.com
 * @LastEditTime: 2025-04-15 10:30:58
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\teacherManagement\editTeacher\+page.svelte
 * @Description: 教师信息编辑页
 * @Copyright: Copyright (c) 2025 by Xavier Wang, All Rights Reserved.
 */
 -->

 <script>
    // @ts-nocheck
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import Title from "$lib/component/Title.svelte";

    // 教师账号 - 从URL参数获取
    let teacherAccount = $state('');

    // 教师详细信息
    let teacherInfo = $state(null);
    
    // 可编辑字段
    let editableFields = $state({
        official_name: '',
        gender: '',
        phone: '',
        id_card_no: '',
        account: '',
        password: '',
        email: ''
    });
    
    // 表单验证状态
    let formErrors = $state({
        official_name: '',
        gender: '',
        phone: '',
        id_card_no: '',
        account: '',
        password: '',
        email: ''
    });
    
    // 保存状态
    let saving = $state(false);
    let saveSuccess = $state(false);
    let saveError = $state('');

    // 加载状态
    let loading = $state(true);
    let error = $state(null);

    // 身份证照片URL
    let idCardFrontUrl = $state('');
    let idCardBackUrl = $state('');

    // 照片加载状态
    let frontImageError = $state(false);
    let backImageError = $state(false);
    
    // 上传文件相关状态
    let idCardFrontFile = $state(null);
    let idCardBackFile = $state(null);

    // 识别状态
    let recognizing = $state(false);
    let recognitionError = $state('');
    let idCardRecognized = $state(false);

    // 大图预览状态
    let showLargeImage = $state(false);
    let largeImageUrl = $state('');

    // 密码显示状态
    let showPassword = $state(false);
    
    // 切换密码显示状态
    function togglePasswordVisibility() {
        showPassword = !showPassword;
    }

    // 状态映射
    const statusMap = {
        '00': '已启用',
        '02': '已停用',
        '04': '已删除'
    };

    // 状态类名映射
    const statusClassMap = {
        '00': 'status-enabled',
        '02': 'status-disabled',
        '04': 'status-deleted'
    };

    // 在组件挂载时获取教师详情
    onMount(async () => {
        // 从URL参数中获取教师账号
        const urlParams = new URLSearchParams($page.url.search);
        teacherAccount = urlParams.get('account');

        if (!teacherAccount) {
            error = '未提供教师账号';
            loading = false;
            return;
        }

        await fetchTeacherDetail();
    });

    // 获取教师详情
    async function fetchTeacherDetail() {
        loading = true;
        error = null;

        try {
            const params = new URLSearchParams({
                account: teacherAccount,
            });

            const response = await fetch(`/api/admin/teacher/detail?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }

            const result = await response.json();

            if (result && result.data) {
                teacherInfo = result.data;
                
                // 初始化可编辑字段
                editableFields = {
                    official_name: teacherInfo.official_name || '',
                    gender: teacherInfo.gender || '',
                    phone: teacherInfo.phone || '',
                    id_card_no: teacherInfo.id_card_no || '',
                    account: teacherInfo.account || '',
                    password: teacherInfo.password || '',
                    email: teacherInfo.email || ''
                };

                // 获取身份证照片
                await fetchIdCardImages();
            } else {
                error = '未找到教师信息';
            }
        } catch (err) {
            console.error('获取教师详情失败:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    // 获取身份证照片
    async function fetchIdCardImages() {
        try {
            // 获取身份证正面照片
            frontImageError = false;
            try {
                const params = new URLSearchParams({
                    account: teacherAccount,
                    img_type: 'front',
                });

                const frontResponse = await fetch(`/api/admin/teacher/id-card-img?${params.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (frontResponse.ok) {
                    const blob = await frontResponse.blob();
                    // 检查是否是空文件或非图片文件
                    if (blob.size > 0 && blob.type.startsWith('image/')) {
                        idCardFrontUrl = URL.createObjectURL(blob);
                    } else {
                        frontImageError = true;
                    }
                } else {
                    frontImageError = true;
                }
            } catch (err) {
                console.error('获取身份证正面照片失败:', err);
                frontImageError = true;
            }

            // 获取身份证反面照片
            backImageError = false;
            try {
                const params = new URLSearchParams({
                    account: teacherAccount,
                    img_type: 'back',
                });

                const backResponse = await fetch(`/api/admin/teacher/id-card-img?${params.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                if (backResponse.ok) {
                    const blob = await backResponse.blob();
                    // 检查是否是空文件或非图片文件
                    if (blob.size > 0 && blob.type.startsWith('image/')) {
                        idCardBackUrl = URL.createObjectURL(blob);
                    } else {
                        backImageError = true;
                    }
                } else {
                    backImageError = true;
                }
            } catch (err) {
                console.error('获取身份证反面照片失败:', err);
                backImageError = true;
            }
        } catch (err) {
            console.error('获取身份证照片失败:', err);
            frontImageError = true;
            backImageError = true;
        }
    }
    
    // 处理身份证正面上传
    function handleIdCardFrontUpload(event) {
        const file = event.target.files[0];
        if (file) {
            // 这里可以添加文件类型和大小验证
            if (file.type.startsWith('image/jpeg') || file.type.startsWith('image/png')) {
                if (file.size <= 10 * 1024 * 1024) { // 限制为10MB，图片通常不需要太大
                    idCardFrontFile = file;

                    // 创建预览URL
                    if (idCardFrontUrl) {
                        URL.revokeObjectURL(idCardFrontUrl); // 释放之前的URL
                    }
                    idCardFrontUrl = URL.createObjectURL(file);
                    frontImageError = false;

                    // 如果正反面都上传了，则进行识别
                    if (idCardBackFile) {
                        recognizeIdCard();
                    }
                } else {
                    alert('图片大小超过10MB限制');
                }
            } else {
                alert('只支持JPG和PNG格式的图片');
            }
        }
    }

    // 处理身份证反面上传
    function handleIdCardBackUpload(event) {
        const file = event.target.files[0];
        if (file) {
            // 这里可以添加文件类型和大小验证
            if (file.type.startsWith('image/jpeg') || file.type.startsWith('image/png')) {
                if (file.size <= 10 * 1024 * 1024) { // 限制为10MB，图片通常不需要太大
                    idCardBackFile = file;

                    // 创建预览URL
                    if (idCardBackUrl) {
                        URL.revokeObjectURL(idCardBackUrl); // 释放之前的URL
                    }
                    idCardBackUrl = URL.createObjectURL(file);
                    backImageError = false;

                    // 如果正反面都上传了，则进行识别
                    if (idCardFrontFile) {
                        recognizeIdCard();
                    }
                } else {
                    alert('图片大小超过10MB限制');
                }
            } else {
                alert('只支持JPG和PNG格式的图片');
            }
        }
    }

    // 身份证识别函数
    async function recognizeIdCard() {
        if (!idCardFrontFile || !idCardBackFile) {
            return;
        }

        recognizing = true;
        recognitionError = '';

        try {
            const formData = new FormData();
            formData.append('file', idCardFrontFile);

            const response = await fetch("/api/idCardRecognition", {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();

                if (result.status === '0' && result.data) {
                    // 设置识别结果
                    editableFields.official_name = result.data.name || editableFields.official_name;
                    editableFields.gender = result.data.gender || editableFields.gender;
                    editableFields.id_card_no = result.data.id_number || editableFields.id_card_no;
                    idCardRecognized = true;
                } else {
                    recognitionError = '识别失败，请手动填写信息';
                }
            } else {
                recognitionError = '识别请求失败，请手动填写信息';
            }
        } catch (error) {
            console.error('身份证识别出错:', error);
            recognitionError = '识别过程出错，请手动填写信息';
        } finally {
            recognizing = false;
        }
    }

    // 返回教师管理页面
    function goBack() {
        goto('/teacher/teacherManagement');
    }
    
    // 验证表单
    function validateForm() {
        let isValid = true;
        
        // 重置错误信息
        formErrors = {
            official_name: '',
            gender: '',
            phone: '',
            id_card_no: '',
            account: '',
            password: '',
            email: ''
        };
        
        // 验证姓名
        if (!editableFields.official_name.trim()) {
            formErrors.official_name = '姓名不能为空';
            isValid = false;
        }
        
        // 验证性别
        if (!editableFields.gender.trim()) {
            formErrors.gender = '性别不能为空';
            isValid = false;
        }
        
        // 验证手机号
        if (!editableFields.phone.trim()) {
            formErrors.phone = '手机号不能为空';
        } else if (!/^1[3-9]\d{9}$/.test(editableFields.phone)) {
            formErrors.phone = '请输入有效的手机号';
            isValid = false;
        }
        
        // 验证身份证号
        if (!editableFields.id_card_no.trim()) {
            formErrors.id_card_no = '身份证号不能为空';
            isValid = false;
        } else if (!/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(editableFields.id_card_no)) {
            formErrors.id_card_no = '请输入有效的身份证号';
            isValid = false;
        }
        
        // 验证账号
        if (!editableFields.account.trim()) {
            formErrors.account = '账号不能为空';
            isValid = false;
        }
        
        // 验证密码
        if (!editableFields.password.trim()) {
            formErrors.password = '密码不能为空';
            isValid = false;
        }
        
        // 验证邮箱
        if (editableFields.email.trim() && !/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(editableFields.email)) {
            formErrors.email = '请输入有效的邮箱地址';
            isValid = false;
        }
        
        return isValid;
    }
    
    // 保存教师信息
    async function saveTeacherInfo() {
        // 验证表单
        if (!validateForm()) {
            return;
        }
        
        saving = true;
        saveError = '';
        saveSuccess = false;
        
        try {
            // 1. 先更新教师基本信息
            const { account, ...updateData } = editableFields;
            const response = await fetch('/api/admin/teacher/detail', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    sets: [teacherAccount],
                    data: updateData
                })
            });
            
            if (!response.ok) {
                console.error('保存失败:', response.statusText);
                throw new Error(`保存失败: ${response.status}`);
            }
            
            const result = await response.json();
            
            // 2. 如果有上传新的身份证照片，则上传照片
            if (idCardFrontFile || idCardBackFile) {
                try {
                    const formData = new FormData();
                    
                    // 添加教师账号信息
                    formData.append('data', JSON.stringify({
                        account: teacherAccount
                    }));
                    
                    // 添加身份证照片
                    if (idCardFrontFile) {
                        formData.append('id_card_front', idCardFrontFile);
                    }
                    
                    if (idCardBackFile) {
                        formData.append('id_card_back', idCardBackFile);
                    }
                    
                    // 上传身份证照片
                    const photoResponse = await fetch('/api/admin/teacher/id-card-img', {
                        method: 'POST',
                        credentials: 'include',
                        body: formData
                    });
                    
                    if (!photoResponse.ok) {
                        console.error('照片上传失败:', photoResponse.statusText);
                        throw new Error(`照片上传失败: ${photoResponse.status}`);
                    }
                } catch (photoErr) {
                    console.error('上传身份证照片失败:', photoErr);
                    throw new Error(`上传身份证照片失败: ${photoErr.message}`);
                }
            }
            
            if (result && result.status === 0) {
                saveSuccess = true;
                // 更新成功后延迟返回列表页
                setTimeout(() => {
                    goto('/teacher/teacherManagement');
                }, 1500);
            } else {
                saveError = result.message || '保存失败';
            }
        } catch (err) {
            console.error('保存教师信息失败:', err);
            saveError = err.message;
        } finally {
            saving = false;
        }
    }

    // 打开大图预览
    function openLargeImage(imageUrl) {
        if (imageUrl) {
            largeImageUrl = imageUrl;
            showLargeImage = true;

            // 添加事件监听器，点击 ESC 键关闭大图
            document.addEventListener('keydown', handleEscKeyPress);
        }
    }

    // 关闭大图预览
    function closeLargeImage() {
        showLargeImage = false;
        largeImageUrl = '';

        // 移除事件监听器
        document.removeEventListener('keydown', handleEscKeyPress);
    }

    // 处理 ESC 键按下事件
    function handleEscKeyPress(event) {
        if (event.key === 'Escape') {
            closeLargeImage();
        }
    }

    // 格式化日期时间
    function formatDateTime(timestamp) {
        if (!timestamp) return '-';

        // 判断是否为数字字符串，如果是则转换为数字
        if (typeof timestamp === 'string' && !isNaN(Number(timestamp))) {
            timestamp = Number(timestamp);
        }

        const date = new Date(timestamp);

        // 检查是否为有效日期
        if (isNaN(date.getTime())) return '-';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // 获取状态文本
    function getStatusText(status) {
        return statusMap[status] || '未知状态';
    }

    // 获取状态类名
    function getStatusClass(status) {
        return statusClassMap[status] || '';
    }
</script>

<div class="teacher-detail-container">
    {#if loading}
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <span>加载中...</span>
        </div>
    {:else if error}
        <div class="error-container">
            <div class="error-icon">!</div>
            <span>{error}</span>
            <button class="back-button" onclick={goBack}>返回</button>
        </div>
    {:else if teacherInfo}
        <!-- 大图预览模态框 -->
        {#if showLargeImage}
            <div 
                class="large-image-overlay" 
                onclick={closeLargeImage}
                onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        closeLargeImage();
                    }
                }}
                role="button"
                tabindex="0"
            >
                <div class="large-image-container">
                    <img 
                        src={largeImageUrl} 
                        alt="身份证大图" 
                        class="large-image" 
                        onclick={(e) => e.stopPropagation()}
                    />
                    <button class="close-button" onclick={closeLargeImage}>×</button>
                </div>
            </div>
        {/if}
        <!-- 实名信息部分 -->
        <div class="section-container">
            <div class="big-title">
                <Title title="实名信息" />
                <div class="big-title-right">
                    {#if recognizing}
                        <div class="status-indicator">
                            <div class="loading-spinner"></div>
                            <span>正在识别身份证信息...</span>
                        </div>
                    {/if}
                    {#if recognitionError}
                        <div class="error-indicator">
                            <span>{recognitionError}</span>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="id-card-upload-container">
                <!-- 照片显示区域（一行） -->
                <div class="upload-row">
                    <!-- 身份证正面 -->
                    <div class="upload-item">
                        <div class="upload-label">
                            <span>身份证正面</span>
                        </div>
                        <div class="upload-area">
                            <div class="id-card-preview">
                                {#if idCardFrontUrl}
                                    <img
                                        src={idCardFrontUrl}
                                        alt="身份证正面"
                                        class="id-card-image clickable"
                                        onclick={() => openLargeImage(idCardFrontUrl)}
                                        title="点击查看大图"
                                    />
                                {:else if frontImageError}
                                    <label for="id-card-front" class="upload-button">
                                        <div class="upload-icon">+</div>
                                        <div class="upload-text">Upload</div>
                                    </label>
                                    <input
                                        type="file"
                                        id="id-card-front"
                                        accept=".jpg,.jpeg,.png"
                                        onchange={handleIdCardFrontUpload}
                                        style="display: none;"
                                    />
                                {:else}
                                    <div class="no-image">暂无图片</div>
                                {/if}
                            </div>
                        </div>
                    </div>

                    <!-- 身份证反面 -->
                    <div class="upload-item">
                        <div class="upload-label">
                            <span>身份证反面</span>
                        </div>
                        <div class="upload-area">
                            <div class="id-card-preview">
                                {#if idCardBackUrl}
                                    <img
                                        src={idCardBackUrl}
                                        alt="身份证反面"
                                        class="id-card-image clickable"
                                        onclick={() => openLargeImage(idCardBackUrl)}
                                        title="点击查看大图"
                                    />
                                {:else if backImageError}
                                    <label for="id-card-back" class="upload-button">
                                        <div class="upload-icon">+</div>
                                        <div class="upload-text">Upload</div>
                                    </label>
                                    <input
                                        type="file"
                                        id="id-card-back"
                                        accept=".jpg,.jpeg,.png"
                                        onchange={handleIdCardBackUpload}
                                        style="display: none;"
                                    />
                                {:else}
                                    <div class="no-image">暂无图片</div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 实名信息显示 -->
                <div class="id-card-info-container">
                    <div class="info-row">
                        <!-- 姓名 -->
                        <div class="form-item">
                            <div class="form-label">
                                <span class="required-mark">*</span>
                                <span>姓名</span>
                            </div>
                            <div class="form-input-container">
                                <input 
                                    type="text" 
                                    class="form-input {formErrors.official_name ? 'input-error' : ''}" 
                                    bind:value={editableFields.official_name} 
                                    placeholder="请输入姓名"
                                />
                                {#if formErrors.official_name}
                                    <div class="error-message">{formErrors.official_name}</div>
                                {/if}
                            </div>
                        </div>

                        <!-- 性别 -->
                        <div class="form-item">
                            <div class="form-label">
                                <span class="required-mark">*</span>
                                <span>性别</span>
                            </div>
                            <div class="form-input-container">
                                <select 
                                    class="form-input {formErrors.gender ? 'input-error' : ''}" 
                                    bind:value={editableFields.gender}
                                >
                                    <option value="">请选择性别</option>
                                    <option value="男">男</option>
                                    <option value="女">女</option>
                                </select>
                                {#if formErrors.gender}
                                    <div class="error-message">{formErrors.gender}</div>
                                {/if}
                            </div>
                        </div>

                        <!-- 身份证号 -->
                        <div class="form-item">
                            <div class="form-label">
                                <span class="required-mark">*</span>
                                <span>身份证号</span>
                            </div>
                            <div class="form-input-container">
                                <input 
                                    type="text" 
                                    class="form-input {formErrors.id_card_no ? 'input-error' : ''}" 
                                    bind:value={editableFields.id_card_no} 
                                    placeholder="请输入身份证号"
                                />
                                {#if formErrors.id_card_no}
                                    <div class="error-message">{formErrors.id_card_no}</div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 基本信息部分 -->
        <div class="section-container">
            <div class="big-title">
                <Title title="基本信息" />
            </div>

            <div class="basic-info-container">
                <!-- 账号 -->
                <div class="form-item">
                    <div class="form-label">
                        <span class="required-mark">*</span>
                        <span>账号</span>
                    </div>
                    <div class="form-input-container">
                        <input 
                            type="text" 
                            class="form-input {formErrors.account ? 'input-error' : ''}" 
                            bind:value={editableFields.account} 
                            placeholder="请输入账号"
                            readonly
                            disabled
                        />
                        {#if formErrors.account}
                            <div class="error-message">{formErrors.account}</div>
                        {/if}
                    </div>
                </div>

                <!-- 密码 -->
                <div class="form-item">
                    <div class="form-label">
                        <span class="required-mark">*</span>
                        <span>密码</span>
                    </div>
                    <div class="form-input-container">
                        <div class="password-input-container password-container">
                            <input 
                                type="{showPassword ? 'text' : 'password'}" 
                                class="form-input {formErrors.password ? 'input-error' : ''}" 
                                bind:value={editableFields.password} 
                                placeholder="请输入密码"
                            />
                            <button class="password-toggle" onclick={togglePasswordVisibility} title="{showPassword ? '隐藏密码' : '显示密码'}">
                                <img src="/teacher_mgt/{showPassword ? 'hide.svg' : 'show.svg'}" alt="{showPassword ? '隐藏' : '显示'}密码" />
                            </button>
                        </div>
                        {#if formErrors.password}
                            <div class="error-message">{formErrors.password}</div>
                        {/if}
                    </div>
                </div>

                <!-- 手机号 -->
                <div class="form-item">
                    <div class="form-label">
                        <span class="required-mark">*</span>
                        <span>手机号</span>
                    </div>
                    <div class="form-input-container">
                        <input 
                            type="tel" 
                            class="form-input {formErrors.phone ? 'input-error' : ''}" 
                            bind:value={editableFields.phone} 
                            placeholder="请输入手机号"
                        />
                        {#if formErrors.phone}
                            <div class="error-message">{formErrors.phone}</div>
                        {/if}
                    </div>
                </div>

                <!-- 邮箱 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>邮箱</span>
                    </div>
                    <div class="form-input-container">
                        <input 
                            type="email" 
                            class="form-input {formErrors.email ? 'input-error' : ''}" 
                            bind:value={editableFields.email} 
                            placeholder="请输入邮箱"
                        />
                        {#if formErrors.email}
                            <div class="error-message">{formErrors.email}</div>
                        {/if}
                    </div>
                </div>

                <!-- 入职时间 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>入职时间</span>
                    </div>
                    <div class="form-value">
                        {teacherInfo.join_time ? formatDateTime(teacherInfo.join_time) : '-'}
                    </div>
                </div>

                <!-- 最近登录时间 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>最近登录</span>
                    </div>
                    <div class="form-value">
                        {teacherInfo.logon_time ? formatDateTime(teacherInfo.logon_time) : '-'}
                    </div>
                </div>

                <!-- 状态 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>状态</span>
                    </div>
                    <div class="form-value">
                        <span class="status-badge {getStatusClass(teacherInfo.status)}">
                            {getStatusText(teacherInfo.status)}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 按钮区域 -->
        <div class="button-container">
            <button class="back-button" onclick={goBack}>返回</button>
            <button 
                class="save-button" 
                onclick={saveTeacherInfo} 
                disabled={saving}
            >
                {#if saving}
                    保存中...
                {:else}
                    保存
                {/if}
            </button>
        </div>
        
        <!-- 保存结果提示 -->
        {#if saveSuccess}
            <div class="save-success-message">保存成功！即将返回列表页...</div>
        {/if}
        
        {#if saveError}
            <div class="save-error-message">{saveError}</div>
        {/if}
    {/if}
</div>

<style lang="scss">
    $border-color: #ddd;

    /* 上传按钮样式 */
    .upload-button {
        width: 140px;
        height: 140px;
        border: 1px dashed $border-color;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        background-color: #f9f9f9;
        aspect-ratio: 1 / 1; /* 确保始终保持正方形 */
    }

    .upload-button:hover {
        border-color: #0052d9;
        background-color: rgba(0, 82, 217, 0.05);
    }

    .upload-icon {
        font-size: 32px;
        color: #999;
        margin-bottom: 8px;
    }

    .upload-text {
        font-size: 14px;
        color: #666;
    }

    .upload-info {
        font-size: 12px;
        color: #999;
        margin-top: 8px;
        text-align: center;
    }

    .image-preview-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 150px;
        overflow: hidden;
        border-radius: 4px;
    }

    .image-preview {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .preview-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 8px;
        font-size: 12px;
    }

    .file-info {
        display: flex;
        flex-direction: column;
    }

    .file-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
    }

    .file-size {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.8);
    }

    /* 状态指示器样式 */
    .status-indicator {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #0052d9;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .error-indicator {
        font-size: 14px;
        color: #e34d59;
    }

    .upload-icon {
        font-size: 32px;
        color: #999;
        margin-bottom: 8px;
    }

    .upload-text {
        font-size: 14px;
        color: #666;
    }

    .upload-info {
        font-size: 12px;
        color: #999;
        margin-top: 8px;
        text-align: center;
    }

    .image-preview-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 150px;
        overflow: hidden;
        border-radius: 4px;
    }

    .image-preview {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .preview-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 8px;
        font-size: 12px;
    }

    .file-info {
        display: flex;
        flex-direction: column;
    }

    .file-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
    }

    .file-size {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.8);
    }

    /* 状态指示器样式 */
    .status-indicator {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #0052d9;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .error-indicator {
        font-size: 14px;
        color: #e34d59;
    }
    $primary-color: #0052d9;
    $gray-color: rgba(0, 0, 0, 0.6);
    $border-color: #ddd;
    
    // 表单输入样式
    .form-input-container {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    
    .form-input {
        height: 36px;
        padding: 0 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        width: 60%;
        
        &:focus {
            border-color: $primary-color;
            outline: none;
            box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.2);
        }
        
        &.input-error {
            border-color: #e34d59;
        }
    }
    
    .error-message {
        color: #e34d59;
        font-size: 12px;
        margin-top: 4px;
    }
    
    .required-mark {
        color: #e34d59;
        margin-left: 2px;
    }
    
    .password-input-container {
        position: relative;
        width: 100%;
    }
    
    // 保存按钮样式
    .save-button {
        background-color: $primary-color;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 24px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.3s;
        margin-left: 16px;
        width: 100px;
        
        &:hover {
            background-color: darken($primary-color, 10%);
        }
        
        &:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
    }
    
    // 保存结果提示
    .save-success-message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #52c41a;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
    }
    
    .save-error-message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #e34d59;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 1000;
    }
    .teacher-detail-container {
        position: relative;
        background-color: white;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        padding: 20px 20px 40px 20px;
        min-width: 800px;

        @media (max-width: 1200px) {
            min-width: 700px;
        }

        @media (max-width: 768px) {
            min-width: 500px;
        }
    }

    .loading-container, .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        gap: 20px;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 82, 217, 0.3);
        border-radius: 50%;
        border-top-color: $primary-color;
        animation: spin 1s linear infinite;
    }

    .error-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #e34d59;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .section-container {
        margin-bottom: 30px;
    }

    .big-title {
        display: flex;
        align-items: center;
        height: 60px;
        min-height: 60px;
        padding: 0 32px;
        gap: 20px;

        .big-title-left {
            display: flex;
            align-items: center;

            .big-title-icon {
                width: 7px;
                height: 24px;
                background-color: $primary-color;
            }

            .big-title-text {
                font-size: 20px;
                font-weight: bold;
                padding-left: 2px;
            }
        }

      .big-title-right {
        display: flex;
        align-items: center;

        .status-indicator {
          display: flex;
          align-items: center;

          .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(0, 82, 217, 0.3);
            border-radius: 50%;
            border-top-color: $primary-color;
            animation: spin 1s linear infinite;
            margin-right: 8px;
          }

          span {
            font-size: 14px;
            color: $gray-color;
          }
        }

        .error-indicator {
          color: #e34d59;
          font-size: 14px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      }
    }

    .id-card-upload-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px 0 0 40px;

        @media (max-width: 1200px) {
            padding: 20px 0 0 20px;
        }

        @media (max-width: 768px) {
            padding: 20px 0 0 10px;
        }
    }

    .upload-row {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 20px;
        width: 90%;

        @media (max-width: 1200px) {
            gap: 20px;
        }

        @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    .upload-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;
        flex: 1;
        min-width: 300px;

        @media (max-width: 768px) {
            width: 100%;
            min-width: auto;
        }
    }

    .upload-label {
        font-size: 14px;
        color: $gray-color;
        width: 100px;
        text-align: right;
    }

    .upload-area {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 20px;
    }

    .id-card-preview {
        width: 200px;
        height: 140px;
        border: 1px solid $border-color;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #f9f9f9;
        overflow: hidden;

        @media (max-width: 1200px) {
            width: 180px;
            height: 120px;
        }

        @media (max-width: 768px) {
            width: 150px;
            height: 100px;
        }

        .id-card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;

            &.clickable {
                cursor: pointer;
                transition: transform 0.2s ease;

                &:hover {
                    transform: scale(1.05);
                }
            }
        }

        .no-image {
            color: $gray-color;
            font-size: 14px;
        }

        .error-image {
            color: #e34d59;
            font-size: 14px;
        }
    }

    .id-card-info-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        width: 90%;
        max-width: 1200px;

        @media (max-width: 1200px) {
            padding: 20px 0 0 20px;
        }

        @media (max-width: 768px) {
            padding: 20px 0 0 10px;
        }
    }

    .info-row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        width: 100%; /* Use full width of the container */

        @media (max-width: 1200px) {
            gap: 20px;
        }

        @media (max-width: 992px) {
            flex-direction: column;
            width: 100%;
            max-width: 600px;
        }

        @media (max-width: 768px) {
            gap: 15px;
        }

        /* Ensure form items in this row have the same styling as basic info */
        .form-item {
            width: calc(50% - 10px); /* Same width as in basic info */

            @media (max-width: 992px) {
                width: 100%;
            }
        }
    }

    .basic-info-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        padding: 20px 0 0 40px;
        width: 90%;
        max-width: 1200px;

        @media (max-width: 1200px) {
            padding: 20px 0 0 20px;
        }

        @media (max-width: 992px) {
            flex-direction: column;
            width: 100%;
            max-width: 600px;
        }

        @media (max-width: 768px) {
            padding: 20px 0 0 10px;
        }
    }

    .form-item {
        display: flex;
        align-items: center;
        width: calc(50% - 10px); /* 50% width minus half the gap */
        min-width: 250px;
        margin-bottom: 5px; /* Add a small margin for better spacing */

        @media (max-width: 992px) {
            width: 100%;
        }

        @media (max-width: 768px) {
            width: 100%;
            min-width: auto;
        }
    }

    .form-label {
        width: 90px;
        text-align: right;
        font-size: 14px;
        color: $gray-color;
        margin-right: 10px;
        white-space: nowrap;
        flex-shrink: 0; /* Prevent label from shrinking */

        @media (max-width: 768px) {
            width: 90px;
        }
    }

    .form-value {
        min-width: 150px;
        height: 32px;
        line-height: 32px;
        font-size: 14px;
        color: #333;
        padding: 0 10px;
        background-color: #f9f9f9;
        border-radius: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 50%;

        &.password-field {
            letter-spacing: 2px;
            position: relative;
        }
    }
    
    .password-container {
        display: flex;
        align-items: center;
        
        .form-value {
            width: 100%;
            margin-right: 5px;
        }
        
        .password-toggle {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            margin-left: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            
            img {
                width: 20px;
                height: 20px;
                opacity: 0.6;
                transition: opacity 0.2s;
            }
            
            &:hover img {
                opacity: 1;
            }
        }
    }

    .button-container {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 10px;
    }

    .back-button {
        width: 100px;
        height: 36px;
        border-radius: 3px;
        font-size: 14px;
        cursor: pointer;
        background-color: $primary-color;
        color: white;
        border: none;
    }

    /* 大图预览相关样式 */
    .large-image-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(3px);
    }

    .large-image-container {
        position: relative;
        max-width: 90%;
        max-height: 90%;
        background-color: white;
        border-radius: 5px;
        overflow: hidden;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }

    .large-image {
        display: block;
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
    }

    .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: background-color 0.2s ease;

        &:hover {
            background-color: rgba(0, 0, 0, 0.7);
        }
    }

    /* 状态标签样式 */
    .status-badge {
        display: inline-block;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        text-align: center;
    }

    .status-enabled {
        color: #00B42A;
    }

    .status-disabled {
        color: #E34D59;
    }

    .status-deleted {
        background-color: rgba(0, 0, 0, 0.1);
        color: rgba(0, 0, 0, 0.5);
    }
</style>
