import ExcelJS from 'exceljs';
const { Workbook } = ExcelJS;

// 校验手机号
function isValidPhone(phone) {
  const phonePattern = /^1[3-9]\d{9}$/;
  return phonePattern.test(phone);
}

// 校验证件号
function isValidIDCard(idCard) {
  if (!/^\d{15}$|^\d{17}(\d|X|x)$/.test(idCard)) return false;
  if (idCard.length === 18) {
    // 校验校验位
    const weight = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const validate = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    const sum = idCard
      .split('')
      .slice(0, 17)
      .reduce((acc, cur, idx) => acc + Number(cur) * weight[idx], 0);
    const checkCode = validate[sum % 11];
    return checkCode === idCard[17].toUpperCase();
  }
  return true;
}

// 校验邮箱（兼容 ExcelJS 的超链接对象）
function isValidEmail(cellValue) {
  let email = '';

  if (typeof cellValue === 'object' && cellValue?.text) {
    // Excel 自动识别成超链接
    email = cellValue.text;
  } else if (typeof cellValue === 'string') {
    email = cellValue;
  } else {
    email = String(cellValue ?? '');
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email) ? email : null; // 返回标准邮箱或 null
}

// 校验日期格式 (兼容 Date/数字/字符串)
function isValidDate(cellValue) {
  let formattedDate = null;

  if (!cellValue) return null;

  if (cellValue instanceof Date) {
    // ExcelJS 已经解析成 Date 对象
    const year = cellValue.getFullYear();
    const month = String(cellValue.getMonth() + 1).padStart(2, '0');
    const day = String(cellValue.getDate()).padStart(2, '0');
    formattedDate = `${year}/${month}/${day}`;
  } else if (typeof cellValue === 'number') {
    // Excel 内部存储的日期序列号，起点 1900-01-01
    const date = new Date(Math.round((cellValue - 25569) * 86400 * 1000));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    formattedDate = `${year}/${month}/${day}`;
  } else if (typeof cellValue === 'string') {
    // 必须是 yyyy-mm-dd 格式
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(cellValue)) {
      formattedDate = cellValue;
    }
  }

  return formattedDate; // 成功返回 yyyy/mm/dd，失败返回 null
}

/**
 * 将 Excel 原始数据转换为目标数据结构
 * @param {Array} rawData - checkFileData 输出的原始数据
 * @returns {Array} 转换后的数据
 */
export function transformFileData(rawData) {
  const mapping = {
    姓名: 'name',
    电话: 'phone',
    邮箱: 'email',
    性别: 'gender',
    证件号: 'id_card',
    证件类型: 'id_type',
    出生日期: 'birth',
    住址: 'address',
  };

  return rawData.data.map((item) => {
    let transformed = {
      name: '',
      phone: '',
      email: '',
      gender: '',
      id_card: '',
      id_type: '',
      birth: '',
      address: '',
      error: '',
      serial_number: item.serial_number,
    };

    // 映射字段
    Object.keys(mapping).forEach((cnKey) => {
      const enKey = mapping[cnKey];
      transformed[enKey] = item[cnKey] ?? '';
    });

    // 出生日期格式改为 yyyy-mm-dd
    if (transformed.birth && transformed.birth.includes('/')) {
      transformed.birth = transformed.birth.replace(/\//g, '-');
    }

    // 错误信息
    if (!item.isOk) {
      transformed.error = item.errorType || '格式错误';
    }

    return transformed;
  });
}

/**
 * 检查并获取导入学生Excel表格数据, 将返回识别成功和失败的数据
 * @param {File} file 必填，Excel文件数据
 * @returns {Promise<{error: string|null, data: any[]}>}
 */
export async function checkFileData(file) {
  let resultData = {
    error: null,
    data: [],
  };

  if (file == null) {
    resultData.error = '缺少文件数据';
    return resultData;
  }

  // 校验文件类型和格式
  if (!(file instanceof File)) {
    resultData.error = '文件数据类型错误, 请传入File类型数据';
    return resultData;
  }
  let fileExtension = file.name.split('.').pop();

  if (fileExtension != 'xlsx' && fileExtension != 'xls') {
    resultData.error = '不支持的文件类型, 支持的文件类型为：xlsx, xls';
    return resultData;
  }

  let fileReader = new FileReader();
  fileReader.readAsArrayBuffer(file);

  await new Promise((resolve) => {
    fileReader.onloadend = async (e) => {
      let fileBuffer = e.target?.result;

      if (fileBuffer == null) {
        resultData.error = '文件数据为空';
        return resultData;
      } else if (typeof fileBuffer == 'string') {
        resultData.error = '暂不支持的文件数据类型: string';
        return resultData;
      }

      let workbook = new Workbook();
      workbook = await workbook.xlsx.load(fileBuffer);

      // 读取sheet的数量
      let readNum = 1;

      workbook.eachSheet((sheet) => {
        if (readNum > 0) {
          readNum--;
        } else {
          return;
        }

        // 表头(第2行)
        let header = sheet.getRow(2).values;

        let headerString = { 0: null, length: header.length };
        let headerIndexMap = { 0: null, length: header.length };

        // 记录必填项
        let requiredHeader = {};
        for (let i = 1; i <= header.length; i++) {
          let value = header[`${i}`];
          if (value == null) continue;

          if (typeof value === 'object' && value.richText != null) {
            let richText = value.richText;
            if (richText[0].text === '*') {
              requiredHeader[i] = true;
              headerString[i] = richText[1].text;
            } else {
              requiredHeader[i] = false;
              headerString[i] = richText[0].text;
            }
          } else {
            if (typeof value === 'string') {
              if (value.startsWith('*')) {
                requiredHeader[i] = true;
                headerString[i] = value.slice(1);
              } else {
                requiredHeader[i] = false;
                headerString[i] = value;
              }
            } else {
              resultData.error = `未知的表头类型: ${typeof value}`;
              return resultData;
            }
          }

          headerIndexMap[headerString[i]] = i;
        }

        for (let row = 3; row <= sheet.rowCount; row++) {
          if (sheet.getRow(row).values?.length === 0 || sheet.getRow(row)?.values == null) {
            continue;
          }

          let rowData = {
            errorType: '',
            isOk: true,
          };

          // 存储当前行的邮箱、电话、证件号
          let currentEmail = null;
          let currentPhone = null;
          let currentIdCard = null;

          for (let column = 1; column <= header.length - 1; column++) {
            let cell = sheet.getCell(row, column);
            let cellValue = cell.value;
            let isRequired = requiredHeader[column];

            if (cellValue == null) {
              rowData[headerString[column]] = '';
            } else {
              rowData[headerString[column]] = `${cellValue}`;
            }

            // 必填项非空检查（地址可以为空）
            if (isRequired && headerString[column] !== '住址' && (cellValue == null || cellValue === '')) {
              rowData.errorType += `缺少${headerString[column]}\n`;
              rowData.isOk = false;
            }

            // 格式校验
            switch (headerString[column]) {
              case '电话': {
                currentPhone = `${cellValue}`;
                if (cellValue && !isValidPhone(cellValue)) {
                  rowData.errorType += '电话格式错误\n';
                  rowData.isOk = false;
                }
                break;
              }

              case '邮箱': {
                const email = isValidEmail(cellValue);
                rowData['邮箱'] =
                  typeof cellValue === 'object' && cellValue?.text ? cellValue.text : String(cellValue ?? '');
                currentEmail = email ?? rowData['邮箱'];

                if (cellValue && !email) {
                  rowData.errorType += '邮箱格式错误\n';
                  rowData.isOk = false;
                }
                break;
              }

              case '证件号': {
                const rawIdCard = cellValue == null ? '' : String(cellValue).trim();
                const valid = rawIdCard ? isValidIDCard(rawIdCard) : true;
                rowData['证件号'] = rawIdCard;
                currentIdCard = rawIdCard;

                if (rawIdCard && !valid) {
                  rowData.errorType += '证件号格式错误\n';
                  rowData.isOk = false;
                }
                break;
              }

              case '出生日期': {
                const formattedDate = isValidDate(cellValue);
                rowData['出生日期'] = formattedDate ?? '';
                if (cellValue && !formattedDate) {
                  rowData.errorType += '出生日期格式错误\n';
                  rowData.isOk = false;
                }
                break;
              }
            }
          }

          // 添加序号
          rowData.serial_number = resultData.data.length + 1;

          // 存储用于重复检查
          if (currentEmail) rowData.currentEmail = currentEmail;
          if (currentPhone) rowData.currentPhone = currentPhone;
          if (currentIdCard) rowData.currentIdCard = currentIdCard;

          resultData.data.push(rowData);
        }

        // 重复检查：邮箱、电话、证件号
        const emailCount = {};
        const phoneCount = {};
        const idCardCount = {};

        resultData.data.forEach((item) => {
          if (item.currentEmail) {
            emailCount[item.currentEmail] = (emailCount[item.currentEmail] || 0) + 1;
          }
          if (item.currentPhone) {
            phoneCount[item.currentPhone] = (phoneCount[item.currentPhone] || 0) + 1;
          }
          if (item.currentIdCard) {
            idCardCount[item.currentIdCard] = (idCardCount[item.currentIdCard] || 0) + 1;
          }
        });

        resultData.data = resultData.data.map((item) => {
          if (item.currentEmail && emailCount[item.currentEmail] > 1) {
            item.errorType += '邮箱重复\n';
            item.isOk = false;
          }
          if (item.currentPhone && phoneCount[item.currentPhone] > 1) {
            item.errorType += '电话重复\n';
            item.isOk = false;
          }
          if (item.currentIdCard && idCardCount[item.currentIdCard] > 1) {
            item.errorType += '证件号重复\n';
            item.isOk = false;
          }

          delete item.currentEmail;
          delete item.currentPhone;
          delete item.currentIdCard;

          return item;
        });
      });

      resolve(true);
    };
  });

  return {
    error: resultData.error,
    data: transformFileData(resultData),
  };
}

// 行数据校验
export function validateRowData(rowData) {
  rowData.error = ''; // 清空旧的错误

  // ============ 电话校验 ============
  if (rowData.phone && !isValidPhone(rowData.phone)) {
    rowData.error += '电话格式错误\n';
  }

  // ============ 邮箱校验 ============
  const email = isValidEmail(rowData.email);
  if (rowData.email && !email) {
    rowData.error += '邮箱格式错误\n';
  }

  // ============ 证件号校验 ============
  const rawIdCard = rowData.id_card?.trim();
  if (rawIdCard && !isValidIDCard(rawIdCard)) {
    rowData.error += '证件号格式错误\n';
  }

  // ============ 出生日期校验 ============
  if (rowData.birth) {
    const formattedDate = isValidDate(rowData.birth);
    if (!formattedDate) {
      rowData.error += '出生日期格式错误\n';
    } else {
      rowData.birth = formattedDate.replace(/\//g, '-'); // 格式化 yyyy-mm-dd
    }
  }

  // ============ 必填项校验 ============
  // 地址可以为空，其他必填
  if (!rowData.name) {
    rowData.error += '缺少姓名\n';
  }
  if (!rowData.phone) {
    rowData.error += '缺少电话\n';
  }
  if (!rowData.email) {
    rowData.error += '缺少邮箱\n';
  }
  if (!rowData.gender) {
    rowData.error += '缺少性别\n';
  }
  if (!rowData.id_card) {
    rowData.error += '缺少证件号\n';
  }
  if (!rowData.id_type) {
    rowData.error += '缺少证件类型\n';
  }
  if (!rowData.birth) {
    rowData.error += '缺少出生日期\n';
  }

  return rowData;
}

/**
 * 整表重复检查（邮箱、电话、证件号）
 * @param {Array} data - 已经过 transformFileData/validateRowData 处理的行数据数组
 * @returns {true | Array} - 如果没有重复返回 true，否则返回带重复错误信息的数组
 */
export function validateDuplicates(data) {
  const emailCount = {};
  const phoneCount = {};
  const idCardCount = {};

  // 统计次数
  data.forEach((item) => {
    if (item.email) {
      emailCount[item.email] = (emailCount[item.email] || 0) + 1;
    }
    if (item.phone) {
      phoneCount[item.phone] = (phoneCount[item.phone] || 0) + 1;
    }
    if (item.id_card) {
      idCardCount[item.id_card] = (idCardCount[item.id_card] || 0) + 1;
    }
  });

  let hasDuplicate = false;

  // 标记错误（注意：先清理旧的“重复”错误）
  const result = data.map((item) => {
    // 先移除旧的“重复类错误”
    let errorType = (item.error || '')
      .replace(/邮箱重复\n?/g, '')
      .replace(/电话重复\n?/g, '')
      .replace(/证件号重复\n?/g, '');

    if (item.email && emailCount[item.email] > 1) {
      errorType += '邮箱重复\n';
      hasDuplicate = true;
    }

    if (item.phone && phoneCount[item.phone] > 1) {
      errorType += '电话重复\n';
      hasDuplicate = true;
    }

    if (item.id_card && idCardCount[item.id_card] > 1) {
      errorType += '证件号重复\n';
      hasDuplicate = true;
    }

    return {
      ...item,
      error: errorType.trim() ? errorType : '', // 避免出现只有换行的情况
    };
  });

  return { data: result, hasDuplicate };
}
