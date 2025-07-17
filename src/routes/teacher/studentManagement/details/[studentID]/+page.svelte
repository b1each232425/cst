<!--/**
 * @Author: ZouYingXiong && 1584637407@qq.com
 * @Date: 2025-04-23 20:03:03
 * @LastEditors: ZouYingXiong config user.email
 * @LastEditTime: 2025-05-01 20:41:45
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\studentManagement\details\[studentID]\+page.svelte
 * @Description: 学生详情页
 * @Copyright (c) 2025 by ZouYingXiong, All Rights Reserved. 
 */ -->
<script>
    // @ts-nocheck
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';

    // 学生ID - 从URL参数获取
    let studentId = $state('');

    // 学生详细信息
    let studentInfo = $state(null);

    // 加载状态
    let loading = $state(true);
    let error = $state(null);

    // 身份证照片URL
    let idCardFrontUrl = $state('');
    let idCardBackUrl = $state('');

    // 照片加载状态
    let frontImageError = $state(false);
    let backImageError = $state(false);

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
        '02': '已停用'
    };

    // 状态类名映射
    const statusClassMap = {
        '00': 'status-enabled',
        '02': 'status-disabled'
    };

    // 在组件挂载时获取学生详情
    onMount(async () => {
        // 从URL路径中获取学生ID
        const pathParts = window.location.pathname.split('/');
        studentId = pathParts[pathParts.length - 1].replace(/^\s+|\s+$/g, "");

        if (!studentId) {
            error = '未提供学生ID';
            loading = false;
            return;
        }

        await fetchStudentDetail();
    });

    // 获取学生详情
    async function fetchStudentDetail() {
        loading = true;
        error = null;

        try {
            const response = await fetch(`/api/teacher/student/detail?id=${studentId}`, {
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
                studentInfo = result.data;
                console.log(studentInfo)
                // 获取身份证照片
                await fetchIdCardImages();
            } else {
                error = '未找到学生信息';
            }
        } catch (err) {
            console.error('获取学生详情失败:', err);
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
                    account: studentInfo.account,
                    img_type: 'front'
                });

                const frontResponse = await fetch(`/api/teacher/student/id-card-img?${params.toString()}`, {
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
                    account: studentInfo.account,
                    img_type: 'back'
                });

                const backResponse = await fetch(`/api/teacher/student/id-card-img?${params.toString()}`, {
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

    // 返回学生管理页面
    function goBack() {
        goto('/teacher/studentManagement');
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

<div class="student-detail-container">
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
    {:else if studentInfo}
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
                <div class="big-title-left">
                    <div class="big-title-icon"></div>
                    <span class="big-title-text">实名信息</span>
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
                                    <div class="error-image">加载失败</div>
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
                                    <div class="error-image">加载失败</div>
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
                                <span>姓名</span>
                            </div>
                            <div class="form-value">
                                {studentInfo.official_name || '-'}
                            </div>
                        </div>

                        <!-- 性别 -->
                        <div class="form-item">
                            <div class="form-label">
                                <span>性别</span>
                            </div>
                            <div class="form-value">
                                {studentInfo.gender || '-'}
                            </div>
                        </div>

                        <!-- 身份证号 -->
                        <div class="form-item">
                            <div class="form-label">
                                <span>身份证号</span>
                            </div>
                            <div class="form-value">
                                {studentInfo.id_card_no || '-'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 基本信息部分 -->
        <div class="section-container">
            <div class="big-title">
                <div class="big-title-left">
                    <div class="big-title-icon"></div>
                    <span class="big-title-text">基本信息</span>
                </div>
            </div>

            <div class="basic-info-container">
                <!-- 账号 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>账号</span>
                    </div>
                    <div class="form-value">
                        {studentInfo.account || '-'}
                    </div>
                </div>

                <!-- 密码 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>密码</span>
                    </div>
                    <div class="password-container">
                        <div class="form-value password-field">
                            {#if showPassword}
                                {studentInfo.password || '••••••••'}
                            {:else}
                                ••••••••
                            {/if}
                        </div>
                        <button class="password-toggle" onclick={togglePasswordVisibility} title="{showPassword ? '隐藏密码' : '显示密码'}">
                            <img src="/teacher_mgt/{showPassword ? 'hide.svg' : 'show.svg'}" alt="{showPassword ? '隐藏' : '显示'}密码" />
                        </button>
                    </div>
                </div>

                <!-- 手机号 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>手机号</span>
                    </div>
                    <div class="form-value">
                        {studentInfo.phone || '-'}
                    </div>
                </div>

                <!-- 邮箱 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>邮箱</span>
                    </div>
                    <div class="form-value">
                        {studentInfo.email || '-'}
                    </div>
                </div>

                <!-- 创建时间 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>创建时间</span>
                    </div>
                    <div class="form-value">
                        {studentInfo.create_time ? formatDateTime(studentInfo.create_time) : '-'}
                    </div>
                </div>

                <!-- 最近登录时间 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>最近登录</span>
                    </div>
                    <div class="form-value">
                        {studentInfo.login_time ? formatDateTime(studentInfo.login_time) : '-'}
                    </div>
                </div>

                <!-- 状态 -->
                <div class="form-item">
                    <div class="form-label">
                        <span>状态</span>
                    </div>
                    <div class="form-value">
                        <span class="status-badge {getStatusClass(studentInfo.status)}">
                            {getStatusText(studentInfo.status)}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 按钮区域 -->
        <div class="button-container">
            <button class="back-button" onclick={goBack}>返回</button>
        </div>
    {/if}
</div>

<style lang="scss">
    $primary-color: #0052d9;
    $gray-color: rgba(0, 0, 0, 0.6);
    $border-color: #ddd;

    .student-detail-container {
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
        width: 100%;

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

        .form-item {
            width: calc(50% - 10px);

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
        width: calc(50% - 10px);
        min-width: 250px;
        margin-bottom: 5px;

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
        flex-shrink: 0;

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
        width: 60%;

        &.password-field {
            letter-spacing: 2px;
            position: relative;
        }
    }
    
    .password-container {
        display: flex;
        align-items: center;
        width: 60%;
        
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
        gap: 20px;
        margin-top: 40px;
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
</style>
