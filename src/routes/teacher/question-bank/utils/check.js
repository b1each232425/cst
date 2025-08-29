// @ts-nocheck
// import { Workbook } from 'exceljs';
import ExcelJS from 'exceljs';


const {Workbook} = ExcelJS;

const questionType = "单选题,多选题,判断题,填空题,简答题";

const difficulty = "简单,中等,困难";

const optionsHeader = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const MIME_TYPE = {
    'csv': 'text/csv',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/**
 * 检查并获取导入的理论题目Excel表格数据, 将返回成功和失败的题目数据
 * @param {File} file 必填，Excel文件数据
 * @returns {Promise<{success: [] , failure: []}>}
 */
export async function checkData(file) {
  if (file == null) {
    throw new Error('缺少文件数据');
  }

  if (!(file instanceof File)) {
    throw new Error('文件数据类型错误, 请传入File类型数据');
  }

  let fileExtension = file.name.split('.').pop();

  if (fileExtension != 'xlsx' && fileExtension != 'xls') {
    throw new Error('不支持的文件类型, 支持的文件类型为：xlsx, xls');
  }


  /**
   * 识别结果数据
   * 识别成功数据格式: 0索引为表头内容，1索引为第一行题目数据(json格式), 2索引为第二行题目数据(json格式), 以此类推
   * [
   *  [null, "题型", "题目", ...  ],
   *  { "题型": "单选题", "题目": "XXX", ... }, // 第一题数据
   *  {...},
   *  ...
   * ]
   *
   * 识别失败数据格式: 0索引为识别失败的题目数量, 1索引为表头内容, 2索引往后为识别失败的题目数据
   * [
   *  [null, "共识别失败", "0", "道"],  // 0索引为空值，从索引1开始设置单元格内容(exceljs的识别索引从1开始)
   *  [null, "题型", "题目", ...],  // 0索引为空值，从索引1开始设置表头内容(exceljs的识别索引从1开始)
   *  [null, "单选题", "XXX", ...], // 第一题数据，0索引为空值，从索引1开始设置单元格内容(exceljs的识别索引从1开始)
   *  ...
   * ]
   */
  let resultData = {
    success: [
      []
    ],
    failure: [
      []
    ]
  };

  resultData.failure[0][1] = "共识别失败";
  resultData.failure[0][2] = {
    richText: [
      {
        text: "0",
        font: {
          color: {argb: 'FFFF0000'},
          bold: true
        }
      }
    ]
  };
  resultData.failure[0][3] = "道";

  let fileReader = new FileReader();

  fileReader.readAsArrayBuffer(file);

  // 等待文件读取完成
  await new Promise((resolve) => {
    fileReader.onloadend = async (e) => {

      let fileBuffer = e.target?.result;

      if (fileBuffer == null) {
        throw new Error('文件数据为空');
      } else if (typeof fileBuffer == 'string') {
        throw new Error('暂不支持的文件数据类型: string');
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

        // 表头(第3行)
        let header = sheet.getRow(3).values;

        resultData.failure[1] = header;

        // console.log(header);

        // 表头纯文本数据: 列号: 列名
        let headerString = {
          0: null,
          length: header.length
        };

        // 表头索引map： 列名: 列号
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

            // 若表头以*开头, 则为必填项
            if (richText[0].text == '*') {
              requiredHeader[i] = true;

              headerString[i] = (richText[1].text);
            } else {
              requiredHeader[i] = false;

              headerString[i] = (richText[0].text);
            }


          } else {

            if (typeof value == 'string') {
              if (value.startsWith('*')) {
                requiredHeader[i] = true;

                headerString[i] = value.slice(1);

              } else {
                requiredHeader[i] = false;

                headerString[i] = value;

              }
            } else {
              throw new Error(`未知的表头类型: ${typeof value}`);
            }
          }

          resultData.success[0][i] = headerString[i];

          headerIndexMap[headerString[i]] = i;
        }

        // console.log(requiredHeader);

        // console.log(headerString);

        // console.log(headerIndexMap);

        // console.log(sheet.getSheetValues());

        // 从第4行开始读取
        for (let i = 4; i <= sheet.rowCount; i++) {

          // 若行数据为空, 则跳过
          if (sheet.getRow(i).values?.length == 0 || sheet.getRow(i)?.values == null) {
            continue;
          }

          // 数据识别失败记录
          let failureRecord = [];
          let isFailure = false;

          // console.log(sheet.getRow(i).values);

          let rowData = {};

          // 整体数据检测
          for (let j = 1; j <= header.length; j++) {

            // 单元格
            let cell = sheet.getCell(i, j);

            // 单元格值
            let cellValue = cell.value;

            // 是否为必填项
            let isRequired = requiredHeader[j];

            failureRecord[j] = cellValue;


            if (cellValue == null) {
              rowData[headerString[j]] = "";
            } else {
              rowData[headerString[j]] = `${cellValue}`; // 将值强转为字符串
            }


            // 必填项是否为空检测
            if (isRequired && (cellValue == null || cellValue == '')) {

              // 缺少必填项记录
              failureRecord[j] = {
                richText: [
                  {
                    text: `缺少${headerString[j]}`,
                    font: {
                      color: {argb: 'FFFF0000'}
                    }
                  }
                ]
              }

              isFailure = true;

            }

          }


          // 题型检测
          if (questionType.indexOf(rowData['题型']) == -1 && rowData['题型'] != null) {
            isFailure = true;

            failureRecord[headerIndexMap['题型']] = {
              richText: [
                {
                  text: `题型不正确, 请填写: ${questionType}`,
                  font: {
                    color: {argb: 'FFFF0000'}
                  }
                }
              ]
            }
          }


          // 难度检测
          if (difficulty.indexOf(rowData['难度']) == -1 && rowData['难度'] != null) {
            isFailure = true;

            failureRecord[headerIndexMap['难度']] = {
              richText: [
                {
                  text: `难度填写不正确, 请填写: ${difficulty}`,
                  font: {
                    color: {argb: 'FFFF0000'}
                  }
                }
              ]
            }
          }


          let answer = rowData['答案'];

          let answerOption = rowData[answer];

          let answerArray = [];

          let correctionRule = rowData['批改规则'];

          let correctionRuleArr = [];

          // 根据题型检测题目内容
          switch (rowData['题型']) {

            case '单选题': {
              /* 分值检测 */

              // 分值检测: 为数字
              if (rowData['分值'] != null && /^\d+$/.test(rowData['分值']) == false) {
                isFailure = true;

                failureRecord[headerIndexMap['分值']] = {
                  richText: [
                    {
                      text: `分值填写不正确, 请填写数字`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }
              }


              /* 答案检测 */

              // 答案检测: 有且只有一个答案, 并且为字母A~Z或a~z中的一个
              if (answer != null && answer.length == 1 && answer.match(/[A-Za-z]/) == null) {

                // 单字符情况

                isFailure = true;

                failureRecord[headerIndexMap['答案']] = {
                  richText: [
                    {
                      text: `答案填写不正确, 请填写字母A~Z或a~z中的一个`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }

                break;

              } else if (answer != null && answer.length > 1) {

                // 多字符情况

                isFailure = true;

                failureRecord[headerIndexMap['答案']] = {
                  richText: [
                    {
                      text: `答案填写不正确, 请填写字母A~Z或a~z中的一个`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }
                break;

              } else if (typeof answer == 'number') {

                // 数字情况

                isFailure = true;

                failureRecord[headerIndexMap['答案']] = {
                  richText: [
                    {
                      text: `答案填写不正确, 请填写字母A~Z或a~z中的一个`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }

                break;
              }

              /* 选项检测 */

              let hasEmptyOption = false;

              let emptyOptions = [];

              let emptyOptionsCache = [];

              let optionError = false;

              // 空选项检测
              for (let i = 0; i < optionsHeader.length; i++) {

                if (rowData[optionsHeader[i]] == null || rowData[optionsHeader[i]] == '') {
                  hasEmptyOption = true;

                  emptyOptionsCache.push(optionsHeader[i]);

                  continue;
                }

                if (hasEmptyOption) {

                  emptyOptions.push(...emptyOptionsCache);

                  emptyOptionsCache = [];

                  optionError = true;
                }

              }

              if (optionError) {
                isFailure = true;

                emptyOptions.forEach((option) => {
                  failureRecord[headerIndexMap[option]] = {
                    richText: [
                      {
                        text: `缺少选项${option}描述`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }
                })
              }

              answer = answer.toUpperCase(); // 转换为大写

              answerOption = rowData[answer];

              if (answerOption == null || answerOption == '') {
                isFailure = true;

                failureRecord[headerIndexMap[answer]] = {
                  richText: [
                    {
                      text: `答案选项内容不可为空`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }
              }

              break;

            }

            case '多选题': {

              /* 分值检测 */

              // 分值检测: 为数字
              if (rowData['分值'] != null && /^\d+$/.test(rowData['分值']) == false) {
                isFailure = true;

                failureRecord[headerIndexMap['分值']] = {
                  richText: [
                    {
                      text: `分值填写不正确, 请填写数字`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }
              }

              /* 答案检测 */

              // 答案检测: 至少有一个答案, 并且为A~Z或a~z的字母，若有多个答案，答案之间用英文逗号","分隔
              if (answer != null && answer.length == 1) {

                // 单字符情况

                if (answer.match(/[A-Za-z]/) != null) {
                  answerArray.push(answer);
                } else {
                  isFailure = true;

                  failureRecord[headerIndexMap['答案']] = {
                    richText: [
                      {
                        text: `答案填写不正确, 请填写A~Z或a~z范围中的字母, 若有多个答案，答案之间用英文逗号","分隔`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }

                  break;
                }


              } else if (answer != null && answer.length > 1) {

                // 多字符情况

                answerArray = answer.split(',');

                if (answerArray.length <= 1) {
                  isFailure = true;

                  failureRecord[headerIndexMap['答案']] = {
                    richText: [
                      {
                        text: `答案填写不正确, 请填写A~Z或a~z范围中的字母, 若有多个答案，答案之间用英文逗号","分隔`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }

                  break;
                }

                let answerHasError = false;

                for (let i = 0; i < answerArray.length; i++) {

                  if (answerArray[i].length > 1) {
                    isFailure = true;

                    answerHasError = true;

                    failureRecord[headerIndexMap['答案']] = {
                      richText: [
                        {
                          text: `答案填写不正确, 请填写A~Z或a~z范围中的字母, 若有多个答案，答案之间用英文逗号","分隔`,
                          font: {
                            color: {argb: 'FFFF0000'}
                          }
                        }
                      ]
                    }

                    break;
                  }

                  if (answerArray[i].match(/[A-Za-z]/) == null) {
                    isFailure = true;

                    answerHasError = true;

                    failureRecord[headerIndexMap['答案']] = {
                      richText: [
                        {
                          text: `答案填写不正确, 答案中含有非字母A~Z或a~z的字符`,
                          font: {
                            color: {argb: 'FFFF0000'}
                          }
                        }
                      ]
                    }

                    break;
                  }

                }


                if (answerHasError) {
                  break;
                }

              } else if (answer != null && typeof answer == 'number') {

                // 数字情况

                isFailure = true;

                failureRecord[headerIndexMap['答案']] = {
                  richText: [
                    {
                      text: `答案填写不正确, 请填写A~Z或a~z范围中的字母, 若有多个答案，答案之间用英文逗号","分隔`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }

                break;

              }

              /* 选项检测 */

              let hasEmptyOption = false;

              let emptyOptions = [];

              let emptyOptionsCache = [];

              let optionError = false;

              // 空选项检测
              for (let i = 0; i < optionsHeader.length; i++) {

                if (rowData[optionsHeader[i]] == null || rowData[optionsHeader[i]] == '') {
                  hasEmptyOption = true;

                  emptyOptionsCache.push(optionsHeader[i]);

                  continue;
                }

                if (hasEmptyOption) {

                  emptyOptions.push(...emptyOptionsCache);

                  emptyOptionsCache = [];

                  optionError = true;
                }

              }

              if (optionError) {
                isFailure = true;

                emptyOptions.forEach((option) => {
                  failureRecord[headerIndexMap[option]] = {
                    richText: [
                      {
                        text: `缺少选项${option}描述`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }
                })
              }

              answerArray.forEach((answer) => {

                answer = answer.toUpperCase(); // 转换为大写

                let answerOption = rowData[answer];

                if (answerOption == null || answerOption == '') {
                  isFailure = true;

                  failureRecord[headerIndexMap[answer]] = {
                    richText: [
                      {
                        text: `答案选项内容不可为空`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }
                }

              })

              break;


            }


            case '判断题': {

              /* 分值检测 */

              // 分值检测: 为数字
              if (rowData['分值'] != null && /^\d+$/.test(rowData['分值']) == false) {
                isFailure = true;

                failureRecord[headerIndexMap['分值']] = {
                  richText: [
                    {
                      text: `分值填写不正确, 请填写数字`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }
              }

              /* 答案检测 */

              // 答案检测: 有且只有一个答案，并且为"A"或"B"
              if (answer != null && (answer != 'A' && answer != 'B')) {

                isFailure = true;

                failureRecord[headerIndexMap['答案']] = {
                  richText: [
                    {
                      text: `答案填写不正确, 请填写"A"或"B"`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }

              }


              /* 选项检测 */

              // 选项检测: 选项A和选项B内容不可为空

              let optionA = rowData['A'];

              let optionB = rowData['B'];

              if (optionA == null || optionA == '') {
                isFailure = true;

                failureRecord[headerIndexMap['A']] = {
                  richText: [
                    {
                      text: `选项A内容不可为空`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }
              }

              if (optionB == null || optionB == '') {
                isFailure = true;

                failureRecord[headerIndexMap['B']] = {
                  richText: [
                    {
                      text: `选项B内容不可为空`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }
              }

              break;


            }


            case '填空题': {

              /* 题目检测 */

              // 题目填空识别: 识别题目中的(1),(2)...
              let question = rowData['题目'];

              let gapArray = question.match(/\(\d+\)/g);

              if (gapArray == null || gapArray.length == 0) {
                isFailure = true;

                failureRecord[headerIndexMap['题目']] = {
                  richText: [
                    {
                      text: `填空题题目中缺少填空项, 请在题目中添加填空项, 如: (1),(2)...`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }

                break;
              }

              let gapMapArr = [];

              let gapError = false;

              for (let i = 0; i < gapArray.length; i++) {
                let num = gapArray[i].match(/\d+/)[0];

                if (num != i + 1) {
                  isFailure = true;

                  gapError = true;

                  failureRecord[headerIndexMap['题目']] = {
                    richText: [
                      {
                        text: `填空题题目中缺少填空项(${i + 1}), 请在题目中添加序号连续的填空项(注意使用英文括号), 如: (1),(2),(3)...`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      },
                    ]
                  }

                  break;
                }

                gapMapArr[num] = false;
              }

              if (gapError) {
                break;
              }

              let gapNum = gapArray == null ? 0 : gapArray.length;

              if (gapNum == 0) {
                isFailure = true;

                failureRecord[headerIndexMap['题目']] = {
                  richText: [
                    {
                      text: `填空题题目中缺少填空项, 请在题目中添加填空项, 如: (1),(2)...`,
                      font: {
                        color: {argb: 'FFFF0000'}
                      }
                    }
                  ]
                }
              }

              /* 分值检测 */

              // 多个分值检测: 格式 数字加井号再加分值 换行 例如: 1#2\n2#3

              let scoreMapArr = [...gapMapArr]; // 复制填空项数组

              if (rowData['分值'] != null && /^\d+$/.test(rowData['分值']) == false) {

                let scoreArray = rowData['分值'].split('\n');

                let scoreError = false;

                scoreArray.forEach((score) => {

                  // 跳过空行
                  if (score == '') {
                    return;
                  }

                  let scoreSplit = score.split('#');

                  if (scoreSplit.length != 2 || scoreSplit[0].match(/^\d+$/) == null) {
                    scoreError = true;
                  } else if (scoreSplit.length == 2 && (scoreSplit[1] == '' || /^\s+$/.test(scoreSplit[1]))) {

                    // 分值为空或全为空格

                    scoreMapArr[scoreSplit[0]] = false;

                    return;
                  }

                  scoreMapArr[scoreSplit[0]] = true;
                })

                if (scoreError) {
                  isFailure = true;

                  failureRecord[headerIndexMap['分值']] = {
                    richText: [
                      {
                        text: `分值填写不正确, 请填写数字, 若有多个填空,则请按照说明进行填写,并且数量和题目填空数量一致: 数字加井号再加分值 换行 例如:\n1#2\n2#3`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }


                } else {

                  for (let i = 1; i <= gapNum; i++) {
                    if (scoreMapArr[i] == false) {
                      isFailure = true;

                      if (failureRecord[headerIndexMap['分值']] == null || failureRecord[headerIndexMap['分值']].richText == null || failureRecord[headerIndexMap['分值']].richText.length <= 1) {
                        failureRecord[headerIndexMap['分值']] = {
                          richText: [
                            {
                              text: `缺少填空`,
                              font: {
                                color: {argb: 'FFFF0000'}
                              }
                            },
                            {
                              text: `(${i})`,
                              font: {
                                color: {argb: 'FFFF0000'}
                              }
                            },
                            {
                              text: `的分值`,
                              font: {
                                color: {argb: 'FFFF0000'}
                              }
                            }
                          ]
                        }
                      } else {
                        failureRecord[headerIndexMap['分值']].richText[1].text += `,(${i})`;
                      }
                    }
                  }

                }

              }

              /* 答案检测 */

              // 多填空答案检测: 格式 1#答案\n2#答案\n3#答案
              // 识别逻辑, 从数字加井号开始识别,到下一个数字加井号结束或者到最后一个字符结束
              answerArray = rowData['答案'].match(/\d+#[\s\S]*?(?=\d+#|$)/g);

              let answerError = false;

              let answerMapArr = [...gapMapArr]; // 复制填空项数组

              for (let i = 0; answerArray != null && i < answerArray.length; i++) {

                // 跳过空行
                if (answerArray[i] == '') {
                  continue;
                }

                // 识别逻辑: 识别数字加井号后的内容,并提取数字和内容
                let answerSplit = answerArray[i].match(/(\d+)#(.+)?/);

                if (answerSplit == null) {
                  answerSplit = ["", "", ""];
                }

                let answerIndex = answerSplit[1];

                let answerContent = answerSplit[2];

                if (answerIndex.match(/^\d+$/) == null) {

                  isFailure = true;

                  answerError = true;

                  failureRecord[headerIndexMap['答案']] = {
                    richText: [
                      {
                        text: `答案填写不正确, 请按照说明进行填写,并且数量和题目填空数量一致: 数字加井号再加答案 换行 例如:\n1#答案1\n2#答案2\n3#答案3`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }

                  break;
                } else if (answerContent == null || answerContent == '' || /^\s+$/.test(answerContent)) {

                  // 答案为空或全为空格

                  isFailure = true;

                  answerMapArr[answerIndex] = false;

                  continue;
                }

                answerMapArr[answerIndex] = true;
              }

              if (!answerError) {
                for (let i = 1; i <= gapNum; i++) {
                  if (answerMapArr[i] == false) {
                    isFailure = true;

                    if (failureRecord[headerIndexMap['答案']].richText == null || failureRecord[headerIndexMap['答案']].richText.length <= 1) {
                      failureRecord[headerIndexMap['答案']] = {
                        richText: [
                          {
                            text: `缺少填空`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          },
                          {
                            text: `(${i})`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          },
                          {
                            text: `的答案`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          }
                        ]
                      }
                    } else {
                      failureRecord[headerIndexMap['答案']].richText[1].text += `,(${i})`;
                    }
                  }

                }
              }

              /* 批改规则检测 */

              // 多填空批改规则检测: 格式 1#批改规则\n2#批改规则\n3#批改规则
              // 识别逻辑, 从数字加井号开始识别,到下一个数字加井号结束或者到最后一个字符结束
              correctionRuleArr = correctionRule.match(/\d+#[\s\S]*?(?=\d+#|$)/g);

              let correctionRuleError = false;

              let correctionRuleMapArr = [...gapMapArr]; // 复制填空项数组

              for (let i = 0; correctionRuleArr != null && i < correctionRuleArr.length; i++) {

                // 跳过空行
                if (correctionRuleArr[i] == '') {
                  continue;
                }

                let correctionRuleSplit = correctionRuleArr[i].match(/(\d+)#(.+)?/);

                if (correctionRuleSplit == null) {
                  correctionRuleSplit = ["", "", ""];
                }

                let correctionRuleIndex = correctionRuleSplit[1];

                let correctionRuleContent = correctionRuleSplit[2];

                if (correctionRuleIndex.match(/^\d+$/) == null) {

                  isFailure = true;

                  correctionRuleError = true;

                  failureRecord[headerIndexMap['批改规则']] = {
                    richText: [
                      {
                        text: `批改规则填写不正确, 请按照说明进行填写,并且数量和题目填空数量一致: 数字加井号再加批改规则 换行 例如:\n1#批改规则1\n2#批改规则2\n3#批改规则3`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }

                  break;

                } else if (correctionRuleContent == null || correctionRuleContent == '' || /^\s+$/.test(correctionRuleContent)) {

                  // 批改规则为空或全为空格

                  isFailure = true;

                  correctionRuleMapArr[correctionRuleIndex] = false;

                  continue;
                }

                correctionRuleMapArr[correctionRuleIndex] = true;

              }

              if (!correctionRuleError) {
                for (let i = 1; i <= gapNum; i++) {
                  if (correctionRuleMapArr[i] == false) {
                    isFailure = true;

                    if (failureRecord[headerIndexMap['批改规则']] == null || failureRecord[headerIndexMap['批改规则']].richText == null || failureRecord[headerIndexMap['批改规则']].richText.length <= 1) {
                      failureRecord[headerIndexMap['批改规则']] = {
                        richText: [
                          {
                            text: `缺少填空`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          },
                          {
                            text: `(${i})`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          },
                          {
                            text: `的批改规则`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          }
                        ]
                      }
                    } else {
                      failureRecord[headerIndexMap['批改规则']].richText[1].text += `,(${i})`;
                    }
                  }

                }
              }

              break;

            }

            case '简答题': {

              /* 题目检测 */

              // 识别题目中的(1),(2)...
              let subQuestionArray = rowData['题目'].match(/\(\d+\)/g);

              let subQuestionNum = subQuestionArray == null ? 0 : subQuestionArray.length;

              let subQuestionMapArr = [];

              let subQuestionError = false;

              for (let i = 0; i < subQuestionNum; i++) {

                let num = subQuestionArray[i].match(/\d+/)[0];

                if (num != i + 1) {

                  isFailure = true;

                  subQuestionError = true;

                  failureRecord[headerIndexMap['题目']] = {
                    richText: [
                      {
                        text: `简答题题目中缺少子题(${i + 1}), 请在题目中添加序号连续的子题(注意使用英文括号), 如: (1),(2),(3)...`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }

                  break;
                }

                subQuestionMapArr[num] = false;
              }

              // 没有子题目的情况, 默认为1个子题
              if (subQuestionNum == 0) {
                subQuestionMapArr[1] = false;
              }

              if (subQuestionError) {
                break;
              }

              /* 分值检测 */

              // 多个分值检测: 格式 数字加井号再加分值 换行 例如: 1#2\n2#3

              let scoreMapArr = [...subQuestionMapArr]; // 复制填空项数组

              if (rowData['分值'] != null && /^\d+$/.test(rowData['分值']) == false) {

                let scoreArray = rowData['分值'].split('\n');

                let scoreError = false;

                scoreArray.forEach((score) => {

                  // 跳过空行
                  if (score == '') {
                    return;
                  }

                  let scoreSplit = score.split('#');

                  if (scoreSplit.length != 2 || scoreSplit[0].match(/^\d+$/) == null) {
                    scoreError = true;
                  } else if (scoreSplit.length == 2 && (scoreSplit[1] == '' || /^\s+$/.test(scoreSplit[1]))) {

                    // 分值为空或全为空格

                    scoreMapArr[scoreSplit[0]] = false;

                    return;
                  }

                  scoreMapArr[scoreSplit[0]] = true;
                })

                if (scoreError) {
                  isFailure = true;

                  failureRecord[headerIndexMap['分值']] = {
                    richText: [
                      {
                        text: `分值填写不正确, 请填写数字, 若有多个填空,则请按照说明进行填写,并且数量和题目填空数量一致: 数字加井号再加分值 换行 例如:\n1#2\n2#3`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }


                } else {

                  for (let i = 1; i <= subQuestionNum; i++) {
                    if (scoreMapArr[i] == false) {
                      isFailure = true;

                      if (failureRecord[headerIndexMap['分值']] == null || failureRecord[headerIndexMap['分值']].richText == null || failureRecord[headerIndexMap['分值']].richText.length <= 1) {
                        failureRecord[headerIndexMap['分值']] = {
                          richText: [
                            {
                              text: `缺少子题`,
                              font: {
                                color: {argb: 'FFFF0000'}
                              }
                            },
                            {
                              text: `(${i})`,
                              font: {
                                color: {argb: 'FFFF0000'}
                              }
                            },
                            {
                              text: `的分值`,
                              font: {
                                color: {argb: 'FFFF0000'}
                              }
                            }
                          ]
                        }
                      } else {
                        failureRecord[headerIndexMap['分值']].richText[1].text += `,(${i})`;
                      }
                    }
                  }

                }

              }

              /* 答案检测 */

              // 多子题答案检测: 格式 1#答案\n2#答案\n3#答案
              // 识别逻辑, 从数字加井号开始识别,到下一个数字加井号结束或者到最后一个字符结束
              let answerArray = rowData['答案'].match(/\d+#[\s\S]*?(?=\d+#|$)/g);

              let answerMapArr = [...subQuestionMapArr]; // 复制填空项数组

              let answerError = false;

              for (let i = 0; answerArray != null && i < answerArray.length; i++) {

                // 跳过空行
                if (answerArray[i] == '') {
                  continue;
                }

                let answerSplit = answerArray[i].match(/(\d+)#(.+)?/);

                if (answerSplit == null) {
                  answerSplit = ["", "", ""];
                }

                let answerIndex = answerSplit[1];

                let answerContent = answerSplit[2];

                if (answerIndex.match(/^\d+$/) == null) {

                  isFailure = true;

                  answerError = true;

                  failureRecord[headerIndexMap['答案']] = {
                    richText: [
                      {
                        text: `答案填写不正确, 请按照说明进行填写,并且数量和题目子题数量一致: 数字加井号再加答案 换行 例如:\n1#答案1\n2#答案2\n3#答案3`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }

                  break;
                } else if (answerContent == null || answerContent == '' || /^\s+$/.test(answerContent)) {

                  // 答案为空或全为空格

                  isFailure = true;

                  answerMapArr[answerIndex] = false;

                  continue;
                }

                answerMapArr[answerIndex] = true;

              }

              if (!answerError) {
                for (let i = 1; i <= subQuestionNum; i++) {
                  if (answerMapArr[i] == false) {
                    isFailure = true;

                    if (failureRecord[headerIndexMap['答案']] == null || failureRecord[headerIndexMap['答案']].richText == null || failureRecord[headerIndexMap['答案']].richText.length <= 1) {
                      failureRecord[headerIndexMap['答案']] = {
                        richText: [
                          {
                            text: `缺少子题`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          },
                          {
                            text: `(${i})`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          },
                          {
                            text: `的答案`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          }
                        ]
                      }
                    } else {
                      failureRecord[headerIndexMap['答案']].richText[1].text += `,(${i})`;
                    }
                  }

                }
              }

              /* 批改规则检测 */

              // 多子题批改规则检测: 格式 1#批改规则\n2#批改规则\n3#批改规则
              // 识别逻辑, 从数字加井号开始识别,到下一个数字加井号结束或者到最后一个字符结束
              correctionRuleArr = correctionRule.match(/\d+#[\s\S]*?(?=\d+#|$)/g);

              let correctionRuleError = false;

              let correctionRuleMapArr = [...subQuestionMapArr]; // 复制填空项数组

              for (let i = 0; correctionRuleArr != null && i < correctionRuleArr.length; i++) {

                // 跳过空行
                if (correctionRuleArr[i] == '') {
                  continue;
                }

                let correctionRuleSplit = correctionRuleArr[i].match(/(\d+)#(.+)?/);

                if (correctionRuleSplit == null) {
                  correctionRuleSplit = ["", "", ""];
                }

                let correctionRuleIndex = correctionRuleSplit[1];

                let correctionRuleContent = correctionRuleSplit[2];

                if (correctionRuleIndex.match(/^\d+$/) == null) {

                  isFailure = true;

                  correctionRuleError = true;

                  failureRecord[headerIndexMap['批改规则']] = {
                    richText: [
                      {
                        text: `批改规则填写不正确, 请按照说明进行填写,并且数量和题目子题数量一致: 数字加井号再加批改规则 换行 例如:\n1#批改规则1\n2#批改规则2\n3#批改规则3`,
                        font: {
                          color: {argb: 'FFFF0000'}
                        }
                      }
                    ]
                  }

                  break;

                } else if (correctionRuleContent == null || correctionRuleContent == '' || /^\s+$/.test(correctionRuleContent)) {

                  // 批改规则为空或全为空格

                  isFailure = true;

                  correctionRuleMapArr[correctionRuleIndex] = false;

                  continue;
                }

                correctionRuleMapArr[correctionRuleIndex] = true;

              }

              if (!correctionRuleError) {

                for (let i = 1; i <= subQuestionNum; i++) {
                  if (correctionRuleMapArr[i] == false) {
                    isFailure = true;

                    if (failureRecord[headerIndexMap['批改规则']] == null || failureRecord[headerIndexMap['批改规则']].richText == null || failureRecord[headerIndexMap['批改规则']].richText.length <= 1) {
                      failureRecord[headerIndexMap['批改规则']] = {
                        richText: [
                          {
                            text: `缺少子题`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          },
                          {
                            text: `(${i})`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          },
                          {
                            text: `的批改规则`,
                            font: {
                              color: {argb: 'FFFF0000'}
                            }
                          }
                        ]
                      }
                    } else {
                      failureRecord[headerIndexMap['批改规则']].richText[1].text += `,(${i})`;
                    }
                  }

                }

              }

              break;

            }

            default:
              isFailure = true;
              break;

          }


          // console.log(failureRecord);

          if (isFailure) {

            // 记录识别失败的题目数量
            resultData.failure[0][2].richText[0].text = parseInt(resultData.failure[0][2].richText[0].text) + 1;

            resultData.failure.push(failureRecord);
          } else {
            resultData.success[i - 3] = rowData;
          }

        }

      })


      // console.log("结果输出:",resultData);
      resolve(true);
    }
  });


  return resultData;

}


/**
 * 解析题目数据的函数
 * @param {Object} jsonData - 输入的JSON数据
 * @returns {Array} 解析后的题目数组
 */
export function parseQuestionData(jsonData) {
  let result = [];

  // 题型映射表
  const typeMapping = {
    '单选题': '00',
    '多选题': '02',
    '判断题': '04',
    '填空题': '06',
    '简答题': '08',
    
 
  };

  // 难度映射表
  const difficultyMapping = {
    '简单': 1,
    '中等': 2,
    '困难': 3
  };

  // 检查数据结构
  if (!jsonData.success || !Array.isArray(jsonData.success)) {
    throw new Error('Invalid JSON data structure');
  }

  // 跳过第一个元素（表头），从第二个元素开始处理
  const questions = jsonData.success.slice(1);

  questions.forEach((questionData, index) => {
    try {
      // 解析基本信息
      const order = parseInt(questionData['编号']) || (index + 1);
      // const content = wrapInParagraph(questionData.题目 || '');
      let content = questionData['题目'] || '';
      const type = typeMapping[questionData['题型']] || '00';
      const {scores, total_score} = parseScore(questionData['分值']);
      const difficulty = difficultyMapping[questionData['难度']] || 1;
      const analysis = questionData['解析'] || '';
      const tags = parseTags(questionData['标签']);
      const mark_rule = parseAnswers(questionData['批改规则'], questionData['题型'])

      // 解析选项
      const options = parseOptions(questionData, questionData['题型']);

      // 解析答案
      const answersStr = parseAnswers(questionData['答案'], questionData['题型']);

      let answers = []

      if (questionData['题型'] === '简答题' || questionData['题型'] === '填空题') {
        let answer
        answersStr.forEach((answerStr, index) => {
          if (index <= scores.length - 1) {
            answer = {
              index: index + 1, // 从1开始
              answer: answerStr,
              score: scores[index],
              grading_rule: "",
              alternative_answers: [],
            }

            if (index <= mark_rule.length) {
              answer.grading_rule = mark_rule[index]
            }

            answers.push(answer)
          }
        })
      } else {
        answers = answersStr
      }

  if (questionData['题型'] === '填空题' && content) {
  // 匹配所有 (数字)
  const regex = /\((\d+)\)/g;
  let matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      number: match[1], // 括号中的数字
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
    // 防止死循环
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  if (matches.length > 0) {
    let newContent = '';
    let lastIndex = 0;
    matches.forEach((m, i) => {
      // 添加 () 之前的部分
      newContent += content.substring(lastIndex, m.startIndex);
      // 插入 span，blankNumber 为括号中的数字
      newContent += `<span type="blankItem" id="blank_${Date.now()}_${i}" class="blank-item" blankNumber="${m.number}"></span>`;
      lastIndex = m.endIndex;
    });
    // 添加剩余部分
    newContent += content.substring(lastIndex);
    content = newContent;
  }
}
      // 构建结果对象
      const questionObj = {
        id: index, // 基础ID + 索引
        order: order,
        content: content,
        type: type,
        options: options.length === 0 ? null : options,
        answers: answers,
        scores: scores,
        analysis: analysis,
        mark_rule: mark_rule,
        difficulty: difficulty,
        tags: tags,
        update_time: Date.now(),
        update_time_str: formatDate(new Date()),
        score: total_score,
        question_attachments_path: [],
        belong_to: -1,
        is_selected: false,
      };

      result.push(questionObj);

    } catch (error) {
      console.error(`Error parsing question ${index + 1}:`, error);
      // 可以选择跳过错误的题目或者抛出异常
    }
  });

  return result;
}

/**
 * 将文本包装在段落标签中
 */
function wrapInParagraph(text) {
  if (!text) return '';
  // 如果已经包含HTML标签，直接返回
  if (text.includes('<p>') || text.includes('<div>')) {
    return text;
  }
  // 处理换行符
  const formattedText = text.replace(/\n/g, '<br>');
  return `<p><span style="font-size: 12pt">${formattedText}</span></p>`;
}

/**
 * 解析分值
 */
function parseScore(scoreStr) {
  if (!scoreStr) return {
    scores: [1],
    total_score: 1,
  };

  let scores = []

  // 如果是复合分值格式（如填空题的多个分值）
  if (scoreStr.includes('#')) {
    const parts = scoreStr.split('\n');
    let totalScore = 0;
    parts.forEach(part => {
      const match = part.match(/\d+#(\d+)/);
      if (match) {
        scores.push(parseInt(match[1]));
        totalScore += parseInt(match[1]);
      }
    });
    return {
      scores: scores,
      total_score: totalScore,
    }
  }

  // 普通数字分值
  const score = parseInt(scoreStr);
  // return isNaN(score) ? 1 : score;
  return {
    scores: [isNaN(score) ? 1 : score],
    total_score: isNaN(score) ? 1 : score,
  }
}

/**
 * 解析标签
 */
function parseTags(tagStr) {
  if (!tagStr) return [];
  return tagStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}

/**
 * 解析选项
 */
function parseOptions(questionData, questionType) {
  const options = [];
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  // 对于填空题和简答题，通常不需要选项
  if (questionType === '填空题' || questionType === '简答题') {
    return [];
  }

  // 对于判断题，固定选项
  if (questionType === '判断题') {
    return [
      // { label: 'A', value: '<p><span style="font-size: 12pt">正确</span></p>' },
      // { label: 'B', value: '<p><span style="font-size: 12pt">错误</span></p>' }
      {label: 'A', value: '正确'},
      {label: 'B', value: '错误'}
    ];
  }

  // 解析其他类型题目的选项
  optionLabels.forEach(label => {
    const optionText = questionData[label];
    if (optionText && optionText.trim() !== '') {
      options.push({
        label: label,
        value: wrapInParagraph(optionText)
      });
    }
  });

  return options;
}

/**
 * 解析答案
 */
// function parseAnswers(answerStr, questionType) {
//     if (!answerStr) return [];
//
//     // 处理填空题和简答题的复合答案格式
//     if (questionType === '填空题' || questionType === '简答题') {
//         if (answerStr.includes('#')) {
//             const answers = [];
//             const parts = answerStr.split('\n');
//             parts.forEach(part => {
//                 const match = part.match(/\d+#(.+)/);
//                 if (match) {
//                     // 去掉"正确答案："前缀
//                     const answer = match[1].replace(/^正确答案：/, '').trim();
//                     answers.push(answer);
//                 }
//             });
//             return answers.length > 0 ? answers : [answerStr];
//         }
//         return [answerStr];
//     }
//
//     // 处理选择题答案
//     if (answerStr.includes(',')) {
//         // 多选题
//         return answerStr.split(',').map(ans => ans.trim()).filter(ans => ans.length > 0);
//     } else {
//         // 单选题或判断题
//         return [answerStr.trim()];
//     }
// }

function parseAnswers(answerStr, questionType) {
  if (!answerStr) return [];

  // 处理填空题和简答题的复合答案格式
  if (questionType === '填空题' || questionType === '简答题') {
    if (answerStr.includes('#')) {
      const answers = [];

      // 使用正则表达式匹配所有的 数字# 模式
      const pattern = /(\d+)#/g;
      const matches = [];
      let match;

      // 找到所有匹配的位置
      while ((match = pattern.exec(answerStr)) !== null) {
        matches.push({
          questionNum: match[1],
          startIndex: match.index + match[0].length // #号后面的位置
        });
      }

      // 提取每个小问的答案
      for (let i = 0; i < matches.length; i++) {
        const currentMatch = matches[i];
        const nextMatch = matches[i + 1];

        let answerContent;
        if (nextMatch) {
          // 从当前#号后面到下一个数字#前面
          answerContent = answerStr.substring(currentMatch.startIndex, nextMatch.startIndex - nextMatch.questionNum.length - 1);
        } else {
          // 最后一个答案，从当前#号后面到字符串结束
          answerContent = answerStr.substring(currentMatch.startIndex);
        }

        // 去掉"正确答案："前缀并清理首尾空白字符
        const cleanAnswer = answerContent.replace(/^正确答案：/, '').trim();
        if (cleanAnswer) {
          answers.push(cleanAnswer);
        }
      }

      return answers.length > 0 ? answers : [answerStr];
    }
    return [answerStr];
  }

  // 处理选择题答案
  if (answerStr.includes(',')) {
    // 多选题
    return answerStr.split(',').map(ans => ans.trim()).filter(ans => ans.length > 0);
  } else {
    // 单选题或判断题
    return [answerStr.trim()];
  }
}




/**
 * 格式化日期
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export async function download_theory(failedData_theory) {

  const workbook = new Workbook();

  const worksheet = workbook.addWorksheet('Sheet1');

  console.log(failedData_theory);

  let newRows = worksheet.addRows(failedData_theory);

  newRows.forEach((row, index) => {

    if (row == null || row == undefined) {
      return;
    }

    if (index == 0) {
      row.eachCell((cell) => {
        cell.border = {
          top: {style: 'thin'},
          left: {style: 'thin'},
          bottom: {style: 'thin'},
          right: {style: 'thin'}
        }

        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        }

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {argb: 'FFFFFF00'}
        }
      })
    } else if (index == 1) {
      row.eachCell((cell) => {

        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left'
        }

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {argb: 'FFEBEBEB'}
        }
      })
    } else {
      row.height = 38;
      row?.eachCell((cell) => {
        cell.alignment = {
          vertical: 'top',
          horizontal: 'left'
        }
      })
    }

  })

  worksheet?.columns?.forEach((column) => {
    if (column == null || column == undefined) {
      return;
    }

    column.width = 20;
  });

  console.log(newRows);

  // 保存文件
  const buffer = await workbook.xlsx.writeBuffer();
const fileName = `导入失败题目.xlsx`;
  console.log(buffer);


    if(buffer == null){
        throw new Error('缺少文件数据缓存');
    }

    if(fileName == null){
        throw new Error('缺少文件名');
    }

    let fileExtension = fileName.split('.').pop();

    if(fileExtension == null){
        throw new Error('文件名中缺少扩展名');
    }

    let mimeType = MIME_TYPE[fileExtension];

    if(mimeType == null){
        throw new Error('不支持的文件类型');
    }

    let blob = new Blob([buffer], {type: mimeType});

    let url = window.URL.createObjectURL(blob);

    let a = document.createElement('a');

    a.id = 'download-link';

    a.href = url;

    a.download = fileName;

    a.click();

    window.URL.revokeObjectURL(url);

    a.remove();

}