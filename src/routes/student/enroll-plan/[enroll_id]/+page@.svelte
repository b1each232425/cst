<script>
  import Title from '$lib/components/Title/Title.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import Upload from '$lib/components/Upload/UploadImage.svelte';
  import divisions from 'china-division/dist/pcas-code.json';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { error } from '@sveltejs/kit';
  import { toast } from '$lib/components/Toast/Toast';
  import { fastdigest, encodeMetadata } from '$lib/utils/file_upload.svelte.js';
  import { createXXHash64 } from 'hash-wasm';

  const { data } = $props();

  // 性别映射
  const GENDER_MAP = {
    男: '男',
    女: '女',
  };

  // 状态码映射
  const STATUS_MAP = {
    '00': '报名中',
    '02': '待审核',
    '04': '通过',
    '06': '不通过',
    '08': '已迁移',
  };

  // 证件类型映射
  const CARD_TYPE_MAP = {
    居民身份证: '居民身份证',
    临时居民身份证: '临时居民身份证',
    外国人永久居留身份证: '外国人永久居留身份证',
    港澳居民来往内地通行证: '港澳居民来往内地通行证',
    台湾居民来往大陆通信证: '台湾居民来往大陆通信证',
  };

  // 身份证信息
  let id_card_front_file = $state(null); // 身份证正面图片
  let id_card_back_file = $state(null); // 身份证反面图片
  let id_card_front_path = $state(''); // 身份证正面路径
  let id_card_back_path = $state(''); // 身份证反面路径

  // 文件上传相关变量
  let tus;
  let endpoint = '/api/file';
  let chunkSize = 1024 * 1024 * 4; // 4MB
  let parallelUploads = 1;
  let jobs = new Map();

  // 用户信息
  let user_info = $state({
    Category: '',
    Domains: [],
  });

  // 报名信息数据
  let detail = $state({
    name: '',
    gender: '',
    idType: '',
    birthDate: '',
    idNumber: '',
    email: '',
    phone: '',
    address: '',
  });

  // 表单错误对象
  let formErrors = $state({
    name: '',
    gender: '',
    idType: '',
    birthDate: '',
    idNumber: '',
    email: '',
    phone: '',
    address: '',
    idCardFront: '',
    idCardBack: '',
  });

  // 必填项校验
  function validateForm() {
    formErrors = {
      name: detail.name ? '' : '请输入姓名',
      gender: detail.gender ? '' : '请选择性别',
      idType: detail.idType ? '' : '请选择证件类型',
      birthDate: detail.birthDate ? '' : '请选择出生日期',
      idNumber: detail.idNumber ? '' : '请输入证件号码',
      email: detail.email ? '' : '请输入邮箱',
      phone: detail.phone ? '' : '请输入电话',
      idCardFront: id_card_front_file || id_card_front_path ? '' : '请上传身份证正面图片',
      idCardBack: id_card_back_file || id_card_back_path ? '' : '请上传身份证反面图片',
    };
  }

  // 根据身份证计算出生日期
  function getBirthDateFromIdCard(idCard) {
    if (!idCard) return null;

    let birthStr = '';
    if (idCard.length === 18) {
      // 18位：第7到14位是出生日期 yyyyMMdd
      birthStr = idCard.slice(6, 14);
      const year = birthStr.slice(0, 4);
      const month = birthStr.slice(4, 6);
      const day = birthStr.slice(6, 8);
      return `${year}-${month}-${day}`;
    } else if (idCard.length === 15) {
      // 15位：第7到12位是出生日期 yyMMdd，前面加上19
      birthStr = idCard.slice(6, 12);
      const year = '19' + birthStr.slice(0, 2);
      const month = birthStr.slice(2, 4);
      const day = birthStr.slice(4, 6);
      return `${year}-${month}-${day}`;
    } else {
      return null; // 非法身份证号
    }
  }

  // ocr身份证识别接口
  function identifyIdCard(file) {
    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/ocr', {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((data) => {
        if (data.status === 0) {
          detail.name = data.data.name;
          detail.gender = data.data.gender;
          detail.idNumber = data.data.id_number;
          detail.idType = '居民身份证';
          detail.birthDate = getBirthDateFromIdCard(data.data.id_number);
          formErrors.idCardFront = '已成功识别身份证信息';
        } else {
          formErrors.idCardFront = `身份证识别失败，请重新上传。`;
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }

  // 获取当前用户信息
  function getUserInfo() {
    fetch('/api/user/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((res) => {
        const user = res.data;
        if (!user) throw new Error('用户数据为空');

        // 获取用户基础信息
        detail.name = user.OfficialName || '';
        detail.gender = user.Gender;
        detail.idType = user.IDCardType || '';
        detail.idNumber = user.IDCardNo || '';
        detail.birthDate = user.Birthday || '';
        detail.email = user.Email || '';
        detail.phone = user.MobilePhone || '';
        detail.address = user.Addr || '';

        // 处理身份证文件路径
        id_card_front_path = user.IDCardFile?.frontImgID || '';
        id_card_back_path = user.IDCardFile?.backImgID || '';

        // 获取用户权限信息
        user_info.Category = user.Category;
        user_info.Domains = user.Domains;
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // 更新用户信息
  async function updateUserInfo(message, enroll_status) {
    try {
      // 先上传身份证文件
      await uploadIdCardFiles();

      // 转换数据格式以匹配API要求
      const apiData = {
        data: {
          OfficialName: detail.name,
          Gender: detail.gender,
          MobilePhone: detail.phone,
          Email: detail.email,
          Birthday: detail.birthDate ? toTimestamp(detail.birthDate) : 0,
          IDCardNo: detail.idNumber,
          IDCardType: detail.idType,
          IDCardFile: {
            frontImgID: id_card_front_path || '',
            backImgID: id_card_back_path || '',
          },
          Category: user_info.Category,
          Domains: user_info.Domains,
        },
      };

      fetch('/api/user/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('网络错误');
          }
          return response.json();
        })
        .then((data) => {
          if (data.status !== 0) {
            toast.error(`${message}失败：${data.msg}`);
          } else if (message === '提交') {
            enrollReq(enroll_status);
          } else if (message === '保存') {
            toast.success(`${message}成功`);
            goto('/student/enroll-plan');
          }
        })
        .catch((e) => {
          console.log('更新用户信息失败:', e);
        });
    } catch (err) {
      console.error('处理失败:', err);
      toast.error('处理失败，请重试');
    }
  }

  // 删除文件
  function deleteFile(path) {
    fetch(`/api/file/${path}`, {
      method: 'DELETE',
      headers: {
        'Tus-Resumable': '1.0.0',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        // 检查响应状态码，204表示成功删除
        if (response.status === 204) {
          console.log('删除文件成功');
        } else {
          console.log('删除文件失败');
        }
      })
      .catch((e) => {
        console.error('删除文件失败:', e);
      });
  }

  // 上传身份证文件接口
  function singles(job) {
    return new Promise(async (resolve, reject) => {
      if (!job || !job.file) {
        reject('invalid/null job');
        return;
      }

      job.checksum = await fastdigest(job);
      let metadata = {
        filename: job.file.name,
        filetype: job.file.type,
        filesize: job.file.size,
        lastModified: job.file.lastModified,
        checksum: job.checksum,
      };

      const encodedMetadata = encodeMetadata(metadata);
      let v = encodeURIComponent(encodedMetadata);

      const tusOptions = {
        endpoint: `${endpoint}?metadata=${v}`,
        chunkSize,
        retryDelays: [0, 1000, 3000, 5000],
        parallelUploads,
        metadata,
        onUploadUrlAvailable() {
          job.url = job.tus.url;
        },
        onError(error) {
          console.log(error);
          reject(error);
        },
        onProgress(bytesUploaded, bytesTotal) {
          job.transmitPercentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          job.bytesUploaded = bytesUploaded;
          job.bytesTotal = bytesTotal;
        },
        onSuccess(resp) {
          resolve(job);
        },
      };
      job.tus = new tus.Upload(job.file, tusOptions);
      job.tus.start();
    });
  }

  // 处理身份证正面上传事件
  async function handleFrontUpload(file) {
    if (!file) {
      return;
    }

    try {
      // 只保存文件，不立即上传
      id_card_front_file = file;

      // 开始OCR识别
      identifyIdCard(id_card_front_file);
      formErrors.idCardFront = '正在识别身份证信息...';
    } catch (err) {
      console.error('身份证正面处理失败:', err);
      formErrors.idCardFront = '处理失败，请重试';
      toast.error('身份证正面处理失败');
    }
  }

  // 处理身份证反面上传事件
  async function handleBackUpload(file) {
    if (!file) {
      return;
    }

    try {
      // 只保存文件，不立即上传
      id_card_back_file = file;
    } catch (err) {
      console.error('身份证反面处理失败:', err);
      formErrors.idCardBack = '处理失败，请重试';
      toast.error('身份证反面处理失败');
    }
  }

  // 上传身份证文件到服务器
  async function uploadIdCardFiles() {
    const uploadPromises = [];

    // 存储旧路径
    const oldPaths = {
      front: id_card_front_path,
      back: id_card_back_path,
    };

    // 上传身份证正面
    if (id_card_front_file) {
      const frontPromise = uploadSingleFile(id_card_front_file, 'front');
      uploadPromises.push(frontPromise);
    }

    // 上传身份证反面
    if (id_card_back_file) {
      const backPromise = uploadSingleFile(id_card_back_file, 'back');
      uploadPromises.push(backPromise);
    }

    if (uploadPromises.length === 0) {
      console.log('没有需要上传的身份证文件');
      return;
    }

    try {
      const results = await Promise.all(uploadPromises);

      // 更新文件路径并删除旧文件
      results.forEach((result) => {
        if (result.type === 'front') {
          // 如果新路径与旧路径不相等，删除旧文件
          if (oldPaths.front && oldPaths.front !== result.url) {
            // 从完整URL中提取文件ID
            const fileId = oldPaths.front.replace(/.*\/api\/file\//, '');
            deleteFile(fileId);
          }
          id_card_front_path = result.url;
        } else if (result.type === 'back') {
          // 如果新路径与旧路径不相等，删除旧文件
          if (oldPaths.back && oldPaths.back !== result.url) {
            // 从完整URL中提取文件ID
            const fileId = oldPaths.back.replace(/.*\/api\/file\//, '');
            deleteFile(fileId);
          }
          id_card_back_path = result.url;
        }
      });
    } catch (err) {
      console.error('身份证文件上传失败:', err);
      throw new Error('身份证文件上传失败');
    }
  }

  // 上传单个文件
  async function uploadSingleFile(file, type) {
    try {
      // 创建上传任务
      let id = `${file.name}#${file.size}#${file.lastModified}`;
      let job = { id, file };
      jobs.set(id, job);

      // 执行TUS上传
      const result = await singles(job);

      return {
        type,
        url: result.url,
        file: result.file,
      };
    } catch (err) {
      console.error(`身份证${type === 'front' ? '正面' : '反面'}上传失败:`, err);
      throw err;
    }
  }

  // 监听出身日期变化
  function handleBirthDateChance(e) {
    detail.birthDate = e.detail.date;
  }

  // 报名请求函数
  function enrollReq(status) {
    fetch('/api/registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: { register_id: data.enroll_id, status: status },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('网络错误');
        }
        return response.json();
      })
      .then((data) => {
        if (data.status !== 0) {
          toast.error(`报名失败：${data.msg}`);
        } else {
          toast.success(`报名成功`);
          goto('/student/enroll-plan');
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }

  // 处理提交按钮点击事件
  function handleSubmit(status) {
    validateForm();
    const hasError = Object.values(formErrors).some((msg) => msg !== '');
    if (!hasError) {
      updateUserInfo('提交', status);
    }
  }

  // 保存按钮
  function handleSave(status) {
    updateUserInfo('保存', status);
  }

  // 处理取消按钮点击事件
  function handleCancle() {
    goto('/student/enroll-plan');
  }

  // 把时间转化成数字格式
  function toTimestamp(date) {
    return date ? Math.floor(new Date(date).getTime()) : null;
  }

  // ====== 处理地址选择 ======
  const AREA_DATA = divisions.map((p) => ({
    label: p.name,
    value: p.code,
    children:
      p.children?.map((c) => ({
        label: c.name,
        value: c.code,
        children:
          c.children?.map((a) => ({
            label: a.name,
            value: a.code,
          })) || [],
      })) || [],
  }));

  let province = $state('');
  let city = $state('');
  let district = $state('');

  let provinces = AREA_DATA;
  let cities = $state([]);
  let districts = $state([]);

  // 当选择省份时，更新城市
  $effect(() => {
    if (province) {
      const selectedProvince = provinces.find((p) => p.label === province);
      cities = selectedProvince ? selectedProvince.children : [];
      // city = '';
      // district = '';
      // districts = [];
    }
  });

  // 当选择城市时，更新区县
  $effect(() => {
    if (city) {
      const selectedCity = cities.find((c) => c.label === city);
      districts = selectedCity ? selectedCity.children : [];
      // district = '';
    }
  });

  // 个人居住地
  let person_location = $derived(() => {
    return `${province || ''} ${city || ''} ${district || ''} ${detail.address}`.trim();
  });

  onMount(async () => {
    // 导入TUS库
    tus = await import('tus-js-client');

    getUserInfo();
  });
</script>

<div class="student-detail-container">
  <div class="section-container">
    <Title title="报名信息" />
    <div class="info-container">
      <div class="info-row">
        <div class="info-item idcard-item required">
          <span class="label">身份证人像面</span>
          <div class="value">
            <Upload
              previewUrl={id_card_front_path}
              show_label={false}
              accept="image/*"
              limit_size="1000"
              onfile={handleFrontUpload}
            ></Upload>
            <div
              class="error-message"
              class:blue={formErrors.idCardFront === '正在识别身份证信息...'}
              class:green={formErrors.idCardFront === '已成功识别身份证信息'}
            >
              {formErrors.idCardFront}
            </div>
          </div>
        </div>
        <div class="info-item idcard-item required">
          <span class="label">身份证国徽面</span>
          <div class="value">
            <Upload
              previewUrl={id_card_back_path}
              show_label={false}
              accept="image/*"
              limit_size="1000"
              onfile={handleBackUpload}
            ></Upload>
            <div class="error-message">{formErrors.idCardBack}</div>
          </div>
        </div>
      </div>

      <div class="info-row">
        <div class="info-item required">
          <span class="label">姓名</span>
          <div class="value">
            <input type="text" bind:value={detail.name} placeholder="请输入姓名" />
            <div class="error-message">{formErrors.name}</div>
          </div>
        </div>
        <div class="info-item required">
          <span class="label">性别</span>
          <div class="value">
            <div class="gender-setting">
              <Select bind:value={detail.gender}>
                {#each Object.entries(GENDER_MAP) as [key, val]}
                  <Option value={key} label={val} />
                {/each}
              </Select>
            </div>
            <div class="error-message">{formErrors.gender}</div>
          </div>
        </div>
      </div>

      <div class="info-row">
        <div class="info-item required">
          <span class="label">证件类型</span>
          <div class="value">
            <div class="card-type-setting">
              <Select bind:value={detail.idType}>
                {#each Object.entries(CARD_TYPE_MAP) as [key, val]}
                  <Option value={key} label={val} />
                {/each}
              </Select>
            </div>
            <div class="error-message">{formErrors.idType}</div>
          </div>
        </div>
        <div class="info-item required">
          <span class="label">出生日期</span>
          <div class="value">
            <DatePicker
              input_width={'200px'}
              initial_start_date={new Date(detail.birthDate)}
              on:start_date_selected={handleBirthDateChance}
            ></DatePicker>
            <div class="error-message">{formErrors.birthDate}</div>
          </div>
        </div>
      </div>

      <div class="info-row">
        <div class="info-item required">
          <span class="label">证件号码</span>
          <div class="value">
            <input type="text" bind:value={detail.idNumber} placeholder="请输入证件号码" />
            <div class="error-message">{formErrors.idNumber}</div>
          </div>
        </div>
        <div class="info-item required">
          <span class="label">邮箱</span>
          <div class="value">
            <input type="text" bind:value={detail.email} placeholder="请输入邮箱" />
            <div class="error-message">{formErrors.email}</div>
          </div>
        </div>
      </div>

      <div class="info-row">
        <div class="info-item required">
          <span class="label">电话</span>
          <div class="value">
            <input type="text" bind:value={detail.phone} placeholder="请输入电话" />
            <div class="error-message">{formErrors.phone}</div>
          </div>
        </div>
        <div class="info-item">
          <span class="label">居住地</span>
          <div class="value">
            <div class="address-setting">
              <!-- 省份 -->
              <div class="select-address-setting">
                <Select bind:value={province}>
                  <Option value="" label="请选择省" />
                  {#each provinces as p}
                    <Option value={p.label} label={p.label} />
                  {/each}
                </Select>
              </div>

              <div class="select-address-setting">
                <!-- 城市 -->
                <Select bind:value={city} disabled={!province}>
                  <Option value="" label="请选择市" />
                  {#each cities as c}
                    <Option value={c.label} label={c.label} />
                  {/each}
                </Select>
              </div>

              <div class="select-address-setting">
                <!-- 区县 -->
                <Select bind:value={district} disabled={!city}>
                  <Option value="" label="请选择区" />
                  {#each districts as d}
                    <Option value={d.label} label={d.label} />
                  {/each}
                </Select>
              </div>
            </div>

            <!-- 详细地址输入 -->
            <input
              type="text"
              class="detail-address-input"
              placeholder="请输入详细地址（如街道、门牌号）"
              bind:value={detail.address}
            />
          </div>
        </div>
      </div>
    </div>

    <div class="action-row">
      <button class="btn cancel" onclick={handleCancle}>取消</button>
      <button class="btn save" onclick={handleSave}>保存</button>
      <button class="btn submit" onclick={() => handleSubmit('02')}>提交</button>
    </div>
  </div>
</div>

<style lang="scss" scoped>
  $primary-color: #0052d9;
  $normal-font-size: 14px;
  $gray-font-color: #666;
  $border-color: #ddd;

  .student-detail-container {
    display: flex;
    flex-direction: column;
    max-height: 100vh;
    overflow-y: auto;
    padding: 0 40px 40px 40px;
  }

  .info-container {
    --label-w: 120px;
    display: flex;
    flex-direction: column;
    gap: 50px;
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    padding: 40px 60px 0 60px;

    .gender-setting {
      width: 200px;
    }

    .card-type-setting {
      width: 200px;
    }

    .address-setting {
      display: flex;
      gap: 12px; /* 下拉框之间的间距 */
      margin-bottom: 8px; /* 与下面的输入框留点空隙 */
    }

    .select-address-setting {
      width: 110px;
    }

    .detail-address-input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
  }

  .info-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 32px;

    @media (max-width: 800px) {
      grid-template-columns: 1fr;
    }
  }

  .info-item {
    font-size: $normal-font-size;
    color: #333;
    display: grid;
    grid-template-columns: var(--label-w) 1fr;
    column-gap: 8px;
    align-items: start;

    .label {
      color: $gray-font-color;
      font-weight: 500;
      font-size: 16px;
      justify-self: end;
      text-align: right;
      white-space: nowrap;

      &::after {
        content: '：';
      }
    }

    .value {
      display: flex;
      flex-direction: column; // 输入框和错误信息垂直排列
      align-items: flex-start;
      min-width: 0;

      .error-message {
        font-size: 12px;
        margin-top: 4px;
        line-height: 1.2;
        height: 14px;
        color: red; /* 默认红色 */
      }

      .error-message.blue {
        color: blue;
      }

      .error-message.green {
        color: green;
      }
    }

    &.required .label::before {
      content: '*';
      color: red;
      margin-right: 2px;
    }
  }

  .action-row {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 100px;

    .btn {
      padding: 8px 20px;
      border-radius: 4px;
      font-size: $normal-font-size;
      cursor: pointer;
      font-weight: 500;
    }

    .btn.cancel {
      background: #fff;
      color: #000;
      border: 1px solid #ccc;
    }

    .btn.save,
    .btn.submit {
      background: $primary-color;
      color: #fff;
      border: none;
    }
  }

  input[type='text'] {
    padding: 6px 10px;
    border: 1px solid $border-color;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: $normal-font-size;
    transition: border-color 0.2s;

    &:focus {
      border-color: $primary-color;
      outline: none;
    }
  }
</style>
