<!--
 /*
 * @Author: 王皓 xwcoder7@gmail.com
 * @Date: 2025-04-14 16:30:58
 * @LastEditors: 王皓 xwcoder7@gmail.com
 * @LastEditTime: 2025-04-14 16:30:58
 * @FilePath: \tutorial-platform-fe\src\routes\teacher\teacherManagement\addTeacher\+page.svelte
 * @Description: 新增教师页
 * @Copyright: Copyright (c) 2025 by Xavier Wang, All Rights Reserved.
 */
 -->

<script>
    // @ts-nocheck
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import Title from "$lib/component/Title.svelte";

    // 上传文件相关状态
    let idCardFrontFile = $state(null);
    let idCardBackFile = $state(null);

    // 图片预览URL
    let idCardFrontPreview = $state('');
    let idCardBackPreview = $state('');

    // 基本信息相关状态
    let account = $state('');
    let password = $state('');
    let email = $state('');
    let phone = $state('');

    /**
     * 获取新账号
     */
    async function fetchNewAccount() {
        try {
            const response = await fetch('/api/new-account', {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.data) {
                    account = result.data;
                } else {
                    console.error('获取新账号失败：响应数据格式错误');
                    alert('获取新账号失败，请刷新页面重试');
                }
            } else {
                console.error('获取新账号失败：', response.status);
                alert('获取新账号失败，请刷新页面重试');
            }
        } catch (error) {
            console.error('获取新账号出错：', error);
            alert('获取新账号出错，请刷新页面重试');
        }
    }

    // 页面加载时获取新账号
    onMount(() => {
        fetchNewAccount();
    });

    // 身份证识别结果
    let idCardRecognized = $state(false);
    let name = $state('');
    let gender = $state('');
    let idNumber = $state('');

    // 识别状态
    let recognizing = $state(false);
    let recognitionError = $state('');

    // 处理身份证正面上传
    function handleIdCardFrontUpload(event) {
        const file = event.target.files[0];
        if (file) {
            // 这里可以添加文件类型和大小验证
            if (file.type.startsWith('image/jpeg') || file.type.startsWith('image/png')) {
                if (file.size <= 10 * 1024 * 1024) { // 限制为10MB，图片通常不需要太大
                    idCardFrontFile = file;

                    // 创建预览URL
                    if (idCardFrontPreview) {
                        URL.revokeObjectURL(idCardFrontPreview); // 释放之前的URL
                    }
                    idCardFrontPreview = URL.createObjectURL(file);

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
                    if (idCardBackPreview) {
                        URL.revokeObjectURL(idCardBackPreview); // 释放之前的URL
                    }
                    idCardBackPreview = URL.createObjectURL(file);

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
                    name = result.data.name || '';
                    gender = result.data.gender || '';
                    idNumber = result.data.id_number || '';
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

    // 提交表单
    async function submitForm() {
        // 表单验证
        if (!idCardFrontFile) {
            alert('请上传身份证正面');
            return;
        }
        if (!idCardBackFile) {
            alert('请上传身份证反面');
            return;
        }
        if (!account) {
            alert('请输入账号');
            return;
        }
        if (!password) {
            alert('请输入密码');
            return;
        }
        if (!phone) {
            alert('请输入手机号');
            return;
        }
        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            alert('请输入正确的手机号码');
            return;
        }
        if (!name) {
            alert('请输入姓名');
            return;
        }
        if (!gender) {
            alert('请选择性别');
            return;
        }
        if (!idNumber) {
            alert('请输入身份证号');
            return;
        }

        try {
            // 创建FormData对象
            const formData = new FormData();

            // 添加身份证照片
            formData.append('id_card_front', idCardFrontFile);
            formData.append('id_card_back', idCardBackFile);

            // 创建JSON数据并添加到FormData
            const jsonData = {
                account: account,
                password: password,
                phone: phone,
                email: email || '',
                gender: gender,
                id_card_no: idNumber,
                official_name: name
            };

            // 将JSON数据转换为字符串并添加到FormData
            formData.append('data', JSON.stringify(jsonData));

            // 显示提交中状态
            const submitButton = document.querySelector('.submit-button');
            const originalText = submitButton.textContent;
            submitButton.textContent = '提交中...';
            submitButton.disabled = true;

            // 发送POST请求
            const response = await fetch('/api/admin/teacher', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            // 处理响应
            if (response.ok) {
                alert('教师添加成功');
                // 提交成功后返回教师管理页面
                goto('/teacher/teacherManagement');
            } else {
                const errorData = await response.json();
                alert(`添加失败: ${errorData.message || '未知错误'}`);
                // 恢复按钮状态
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        } catch (error) {
            console.error('提交表单时出错:', error);
            alert(`提交表单时出错: ${error.message || '未知错误'}`);
            // 恢复按钮状态
            const submitButton = document.querySelector('.submit-button');
            if (submitButton) {
                submitButton.textContent = '提交';
                submitButton.disabled = false;
            }
        }
    }

    // 取消操作
    function cancelForm() {
        goto('/teacher/teacherManagement');
    }
</script>

<div class="add-teacher-container">
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
            <!-- 照片上传区域（一行） -->
            <div class="upload-row">
                <!-- 身份证正面上传 -->
                <div class="upload-item">
                    <div class="upload-label">
                        <span class="required-mark">*</span>
                        <span>身份证正面</span>
                    </div>
                    <div class="upload-area">
                        <label for="id-card-front" class="upload-button">
                            {#if idCardFrontFile}
                                {#if idCardFrontPreview}
                                    <div class="image-preview-container">
                                        <img src={idCardFrontPreview} alt="身份证正面预览" class="image-preview" />
                                        <div class="preview-overlay">
                                            <div class="file-info">
                                                <div class="file-name">{idCardFrontFile.name}</div>
                                                <div class="file-size">{Math.round(idCardFrontFile.size / 1024)} KB</div>
                                            </div>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="file-uploaded">
                                        <div class="file-name">{idCardFrontFile.name}</div>
                                        <div class="file-size">{Math.round(idCardFrontFile.size / 1024)} KB</div>
                                    </div>
                                {/if}
                            {:else}
                                <div class="upload-icon">+</div>
                                <div class="upload-text">Upload</div>
                            {/if}
                        </label>
                        <input
                            type="file"
                            id="id-card-front"
                            accept=".jpg,.jpeg,.png"
                            onchange={handleIdCardFrontUpload}
                            style="display: none;"
                        />
                        <div class="upload-info">仅支持 JPG 和 PNG 格式，最大文件尺寸 10 MB。</div>
                    </div>
                </div>

                <!-- 身份证反面上传 -->
                <div class="upload-item">
                    <div class="upload-label">
                        <span class="required-mark">*</span>
                        <span>身份证反面</span>
                    </div>
                    <div class="upload-area">
                        <label for="id-card-back" class="upload-button">
                            {#if idCardBackFile}
                                {#if idCardBackPreview}
                                    <div class="image-preview-container">
                                        <img src={idCardBackPreview} alt="身份证反面预览" class="image-preview" />
                                        <div class="preview-overlay">
                                            <div class="file-info">
                                                <div class="file-name">{idCardBackFile.name}</div>
                                                <div class="file-size">{Math.round(idCardBackFile.size / 1024)} KB</div>
                                            </div>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="file-uploaded">
                                        <div class="file-name">{idCardBackFile.name}</div>
                                        <div class="file-size">{Math.round(idCardBackFile.size / 1024)} KB</div>
                                    </div>
                                {/if}
                            {:else}
                                <div class="upload-icon">+</div>
                                <div class="upload-text">Upload</div>
                            {/if}
                        </label>
                        <input
                            type="file"
                            id="id-card-back"
                            accept=".jpg,.jpeg,.png"
                            onchange={handleIdCardBackUpload}
                            style="display: none;"
                        />
                        <div class="upload-info">仅支持 JPG 和 PNG 格式，最大文件尺寸 10 MB。</div>
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
                                class="form-input {!name ? 'input-error' : ''}" 
                                bind:value={name} 
                                placeholder="请输入姓名"
                            />
                            {#if !name && idCardRecognized}
                                <div class="error-message">姓名不能为空</div>
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
                                class="form-input {!gender ? 'input-error' : ''}" 
                                bind:value={gender}
                            >
                                <option value="">请选择性别</option>
                                <option value="男">男</option>
                                <option value="女">女</option>
                            </select>
                            {#if !gender && idCardRecognized}
                                <div class="error-message">性别不能为空</div>
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
                                class="form-input {!idNumber ? 'input-error' : ''}" 
                                bind:value={idNumber} 
                                placeholder="请输入身份证号"
                            />
                            {#if !idNumber && idCardRecognized}
                                <div class="error-message">身份证号不能为空</div>
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
            <div class="big-title-right">
                <!-- 这里可以放基本信息相关的状态或提示 -->
            </div>
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
                        bind:value={account}
                        placeholder="请输入账号"
                        class="form-input"
                        readonly
                        title="账号已自动生成"
                    />
                </div>
            </div>

            <!-- 密码 -->
            <div class="form-item">
                <div class="form-label">
                    <span class="required-mark">*</span>
                    <span>密码</span>
                </div>
                <div class="form-input-container">
                    <input
                        type="password"
                        bind:value={password}
                        placeholder="请输入密码"
                        class="form-input"
                    />
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
                        bind:value={phone}
                        placeholder="请输入手机号"
                        class="form-input"
                        pattern="[0-9]{11}"
                    />
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
                        bind:value={email}
                        placeholder="请输入邮箱"
                        class="form-input"
                    />
                </div>
            </div>
        </div>
    </div>

    <!-- 按钮区域 -->
    <div class="button-container">
        <button class="cancel-button" onclick={cancelForm}>取消</button>
        <button class="submit-button" onclick={submitForm}>提交</button>
    </div>
</div>

<style lang="scss" scoped>
    $primary-color: #0052d9;
    $gray-color: rgba(0, 0, 0, 0.6);
    $border-color: #ddd;

    .add-teacher-container {
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

        .required-mark {
            color: red;
            margin-right: 4px;
        }
    }

    .upload-area {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 20px;
    }

    .upload-button {
        width: 200px;
        height: 140px;
        border: 1px dashed $border-color;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        background-color: #f9f9f9;

        @media (max-width: 1200px) {
            width: 180px;
            height: 120px;
        }

        @media (max-width: 768px) {
            width: 150px;
            height: 100px;
        }

        &:hover {
            border-color: $primary-color;
        }

        .upload-icon {
            font-size: 24px;
            color: $gray-color;
        }

        .upload-text {
            font-size: 14px;
            color: $gray-color;
            margin-top: 5px;
        }

        .file-uploaded {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            padding: 10px;

            .file-name {
                font-size: 12px;
                color: $primary-color;
                text-align: center;
                word-break: break-all;
                margin-bottom: 5px;
            }

            .file-size {
                font-size: 12px;
                color: $gray-color;
            }
        }

        .image-preview-container {
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;

            .image-preview {
                width: 100%;
                height: 100%;
                object-fit: contain; /* 确保图片完全显示在容器内 */
                display: block;
            }

            .preview-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: rgba(0, 0, 0, 0.5);
                padding: 5px;
                opacity: 0;
                transition: opacity 0.3s ease;

                .file-info {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;

                    .file-name {
                        font-size: 10px;
                        color: white;
                        text-align: center;
                        word-break: break-all;
                        margin-bottom: 2px;
                        max-width: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .file-size {
                        font-size: 10px;
                        color: rgba(255, 255, 255, 0.8);
                    }
                }
            }

            &:hover .preview-overlay {
                opacity: 1;
            }
        }
    }

    .upload-info {
        font-size: 12px;
        color: $gray-color;
        max-width: 300px;
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

        .form-item {
            flex: 1 1 calc(50% - 10px);
            min-width: 300px;
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

        @media (max-width: 992px) {
            width: 100%;
            max-width: 600px;
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

    /* 识别状态和错误信息样式已移动到big-title中 */

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

        .required-mark {
            color: red;
            margin-right: 4px;
        }
    }

    .form-input-container {
        position: relative;
        flex: 1;
    }
    
    .error-message {
        color: #e34d59;
        font-size: 12px;
        margin-top: 4px;
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
    }

    .button-container {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 40px;
    }

    .cancel-button, .submit-button {
        width: 100px;
        height: 36px;
        border-radius: 3px;
        font-size: 14px;
        cursor: pointer;
    }

    .cancel-button {
        background-color: white;
        color: #333;
        border: 1px solid $border-color;
    }

    .submit-button {
        background-color: $primary-color;
        color: white;
        border: none;
    }
</style>