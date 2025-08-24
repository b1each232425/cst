<script>
  import Title from '$lib/components/Title/Title.svelte';
  import Select from '$lib/components/Select/Select.svelte';
  import Option from '$lib/components/Select/Option.svelte';
  import DatePicker from '$lib/components/DatePicker/DatePicker.svelte';
  import Upload from '$lib/components/Upload/UploadImage.svelte';
  import divisions from 'china-division/dist/pcas-code.json';
  import { goto } from '$app/navigation';

  // 性别映射
  const GENDER_MAP = {
    male: '男',
    female: '女',
  };

  // 证件类型映射
  const CARD_TYPE_MAP = {
    id_card: '居民身份证',
    temp_id_card: '临时居民身份证',
    foreign_resident: '外国人永久居留身份证',
    hk_macao_pass: '港澳居民来往内地通行证',
    tw_pass: '台湾居民来往大陆通信证',
  };

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
    idCardFront: '',
    idCardBack: '',
  });

  // 表单错误对象
  let formErrors = $state({
    name: '',
    gender: '',
    idType: '',
    birthDate: null,
    idNumber: '',
    email: '',
    phone: '',
    address: '',
    idCardFront: '',
    idCardBack: '',
  });

  function validateForm() {
    formErrors = {
      name: detail.name ? '' : '请输入姓名',
      gender: detail.gender ? '' : '请选择性别',
      idType: detail.idType ? '' : '请选择证件类型',
      birthDate: detail.birthDate ? '' : '请选择出生日期',
      idNumber: detail.idNumber ? '' : '请输入证件号码',
      email: detail.email ? '' : '请输入邮箱',
      phone: detail.phone ? '' : '请输入电话',
      idCardFront: detail.idCardFront ? '' : '请上传身份证人像面',
      idCardBack: detail.idCardBack ? '' : '请上传身份证国徽面',
    };
  }

  function handleFrontUpload(file) {
    idCardFrontFile = file;
    idCardFrontOk = true;
    formErrors.idCardFront = '';
  }

  function handleBackUpload(file) {
    idCardBackFile = file;
    idCardBackOk = true;
    formErrors.idCardBack = '';
  }

  // 监听出身日期变化
  function handleBirthDateChance(e) {
    detail.birthDate = e.detail.date;
    console.log(detail.birthDate);
  }

  function handleSubmit() {
    validateForm();
    const hasError = Object.values(formErrors).some((msg) => msg !== '');
    if (!hasError) {
      alert('表单通过，可以提交:', detail);
    }
  }

  // 处理取消按钮点击事件
  function handleCancle() {
    goto('/student/enroll-plan');
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
      const selectedProvince = provinces.find((p) => p.value === province);
      cities = selectedProvince ? selectedProvince.children : [];
      city = '';
      district = '';
      districts = [];
    }
  });

  // 当选择城市时，更新区县
  $effect(() => {
    if (city) {
      const selectedCity = cities.find((c) => c.value === city);
      districts = selectedCity ? selectedCity.children : [];
      district = '';
    }
  });
</script>

<div class="student-detail-container">
  <div class="section-container">
    <Title title="报名信息" />
    <div class="info-container">
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
            <DatePicker input_width={'200px'} on:start_date_selected={handleBirthDateChance}></DatePicker>
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
                    <Option value={p.value} label={p.label} />
                  {/each}
                </Select>
              </div>

              <div class="select-address-setting">
                <!-- 城市 -->
                <Select bind:value={city} disabled={!province}>
                  <Option value="" label="请选择市" />
                  {#each cities as c}
                    <Option value={c.value} label={c.label} />
                  {/each}
                </Select>
              </div>

              <div class="select-address-setting">
                <!-- 区县 -->
                <Select bind:value={district} disabled={!city}>
                  <Option value="" label="请选择区" />
                  {#each districts as d}
                    <Option value={d.value} label={d.label} />
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

      <div class="info-row">
        <div class="info-item idcard-item required">
          <span class="label">身份证人像面</span>
          <div class="value">
            <Upload show_label={false} accept="image/*" limit_size="10" onfile={handleFrontUpload}></Upload>
            <div class="error-message">{formErrors.idCardFront}</div>
          </div>
        </div>
        <div class="info-item idcard-item required">
          <span class="label">身份证国徽面</span>
          <div class="value">
            <Upload show_label={false} accept="image/*" limit_size="10" onfile={handleFrontUpload}></Upload>
            <div class="error-message">{formErrors.idCardBack}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-row">
      <button class="btn cancel" onclick={handleCancle}>取消</button>
      <button class="btn save" onclick={handleSave}>保存</button>
      <button class="btn submit" onclick={handleSubmit}>提交</button>
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
        color: red;
        margin-top: 4px;
        line-height: 1.2;
        height: 10px;
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
