import ExcelJS from 'exceljs';
const { Workbook } = ExcelJS;

function isValidPhone(phone) {
    const phonePattern = /^1[3-9]\d{9}$/;
    return phonePattern.test(phone);
}


function isValidIDCard(idCard) {
    const idCardPattern = /(^\d{15}$)|(^\d{17}(\d|X|x)$)/;
    return idCardPattern.test(idCard);
}

/**
 * 检查并获取导入问卷题目Excel表格数据, 将返回识别成功和失败的数据
 * @param {File} file 必填，Excel文件数据
 * @returns {Promise<{error: string, data: []}>}
 */
export async function checkData(file) {
    
    let resultData = {
        error: null,
        data: []
    };

    if (file == null) {
        resultData.error = '缺少文件数据';
        return resultData;
    }

    // 用于存储已出现的身份证号
    const idCardSet = new Set();

    //校验文件类型和格式
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

                //只读取第一个sheet
                if (readNum > 0) {
                    readNum--;
                } else {
                    return;
                }

                // 表头(第2行)
                let header = sheet.getRow(2).values;

                // 表头纯文本数据
                let headerString = {
                    0: null,
                    length: header.length
                };

                // 表头索引map
                let headerIndexMap = {
                    0: null,
                    length: header.length
                }

                // 记录必填项
                let requiredHeader = {};
                for (let i = 1; i <= header.length; i++) {
                    let value = header[`${i}`];
                    if (value == null) {
                        continue;
                    }

                    // 若表头为富文本类型
                    if (typeof value == 'object' && value.richText != null) {
                        let richText = value.richText;

                        // 保存表头名，若表头以*开头, 则视为必填项。
                        if (richText[0].text == '*') {
                            requiredHeader[i] = true;
                            headerString[i] = (richText[1].text);
                        } else {
                            requiredHeader[i] = false;
                            headerString[i] = (richText[0].text);
                        }
                    } else {
                        // 保存表头名，若表头以*开头, 则视为必填项。
                        if (typeof value == 'string') {
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

                    //将对应的文本保存到映射结构体中，方便通过文本来获取表头列
                    headerIndexMap[headerString[i]] = i;
                }

                for (let row = 3; row <= sheet.rowCount; row++) {
                    // 若行数据为空, 则跳过
                    if (sheet.getRow(row).values?.length == 0 || sheet.getRow(row)?.values == null) {
                        continue;
                    }

                    //行数据
                    let rowData = {
                        errorType: "",
                        isOk: true
                    };

                    // 存储当前行的身份证号
                    let currentIdCard = null;

                    for (let column = 1; column <= header.length - 1; column++) {
                        // 单元格
                        let cell = sheet.getCell(row, column);

                        // 单元格值
                        let cellValue = cell.value;

                        // 是否为必填项
                        let isRequired = requiredHeader[column];

                        //将单元格数据保存到rowData中，格式为 "表头名":"单元格值"
                        if (cellValue == null) {
                            rowData[headerString[column]] = "";
                        } else {
                            rowData[headerString[column]] = `${cellValue}`; // 强转为字符串
                        }

                        // 必填项非空检查
                        if (isRequired && (cellValue == null || cellValue === '')) {
                            rowData.errorType = "缺少必填项";
                            rowData.isOk = false;
                            break; // 如果是缺失必填，就跳过后面的格式校验
                        }

                        // 格式校验
                        if (column === 3 && cellValue != null && !isValidPhone(`${cellValue}`)) {
                            rowData.errorType = "手机号格式错误";
                            rowData.isOk = false;
                        }

                        if (column === 4 && cellValue != null) {
                            currentIdCard = `${cellValue}`;
                            if (!isValidIDCard(currentIdCard)) {
                                rowData.errorType = "身份证号格式错误";
                                rowData.isOk = false;
                            }else {
                                idCardSet.add(currentIdCard);
                            }
                        }
                    }

                    // 添加序号
                    rowData.serial_number = resultData.data.length + 1;
                    resultData.data.push(rowData);
                }
            })
            resolve(true);
        }
    });

    return resultData;
}

