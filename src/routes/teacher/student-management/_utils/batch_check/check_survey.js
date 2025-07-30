// @ts-nocheck
import { Workbook } from 'exceljs';

const questionType = "单选题,多选题,简答题,量表题";

const optionsHeader = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

/**
 * 检查并获取导入问卷题目Excel表格数据, 将返回识别成功和失败的数据
 * @param {File} file 必填，Excel文件数据
 * @returns {Promise<{success: [] , failure: []}>}
 */
export async function checkData(file){
    if(file == null){
        throw new Error('缺少文件数据');
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
                    color: { argb: 'FFFF0000' },
                    bold: true
                }
            }
        ]
    };
    
    resultData.failure[0][3] = "道";

    if(!(file instanceof File)){
        throw new Error('文件数据类型错误, 请传入File类型数据');
    }

    let fileExtension = file.name.split('.').pop();

    if(fileExtension != 'xlsx' && fileExtension != 'xls'){
        throw new Error('不支持的文件类型, 支持的文件类型为：xlsx, xls');
    }

    let fileReader = new FileReader();

    fileReader.readAsArrayBuffer(file);

    // 等待文件读取完成
    await new Promise((resolve)=>{
        fileReader.onloadend = async (e) => {

            let fileBuffer = e.target?.result;

            if(fileBuffer == null){
                throw new Error('文件数据为空');
            }else if( typeof fileBuffer == 'string'){
                throw new Error('暂不支持的文件数据类型: string');
            }

            let workbook = new Workbook();

            workbook = await workbook.xlsx.load(fileBuffer);

            // 读取sheet的数量
            let readNum = 1;

            workbook.eachSheet((sheet)=>{
                
                if(readNum > 0){
                    readNum--;
                }else{
                    return;
                }

                // 表头(第3行)
                let header = sheet.getRow(3).values;

                resultData.failure[1] = header;

                console.log(header);

                // 表头纯文本数据
                let headerString = {
                    0:null,
                    length: header.length
                };

                // 表头索引map
                let headerIndexMap = {
                    0: null,
                    length: header.length
                }

                // 记录必填项
                let requiredHeader = {};

                for(let i = 1; i <= header.length; i++){
                    let value = header[`${i}`];

                    if(value == null){
                        continue;
                    }

                    // 若表头为富文本类型
                    if( typeof value == 'object' && value.richText != null ){
                        let richText = value.richText;

                        // 若表头以*开头, 则为必填项
                        if(richText[0].text == '*'){
                            requiredHeader[i] = true;

                            headerString[i] = (richText[1].text);
                        }else{
                            requiredHeader[i] = false;

                            headerString[i] = (richText[0].text);
                        }


                    }else{

                        if(typeof value == 'string'){
                            if(value.startsWith('*')){
                                requiredHeader[i] = true;

                                headerString[i] = value.slice(1);

                            }else{
                                requiredHeader[i] = false;

                                headerString[i] = value;

                            }
                        }else{
                            throw new Error(`未知的表头类型: ${typeof value}`);
                        }
                    }

                    resultData.success[0][i] = headerString[i];

                    headerIndexMap[headerString[i]] = i;
                }

                // console.log(requiredHeader);

                // console.log(headerString);

                console.log(headerIndexMap);

                console.log(sheet.getSheetValues());

                // 从第4行开始读取
                for(let i = 4; i <= sheet.rowCount; i++){

                    // 若行数据为空, 则跳过
                    if(sheet.getRow(i).values?.length == 0 || sheet.getRow(i)?.values == null){
                        continue;
                    }

                    // 数据识别失败记录
                    let failureRecord = [];
                    let isFailure = false;

                    // console.log(sheet.getRow(i).values);

                    let rowData = {};

                    // 整体数据检测
                    for(let j = 1; j <= header.length; j++){

                        // 单元格
                        let cell = sheet.getCell(i, j);

                        // 单元格值
                        let cellValue = cell.value;

                        // 是否为必填项
                        let isRequired = requiredHeader[j];

                        failureRecord[j] = cellValue;


                        if(cellValue == null){
                            rowData[headerString[j]] = "";
                        }else{
                            rowData[headerString[j]] = `${cellValue}`; // 强转为字符串
                        }


                        // 必填项是否为空检测
                        if(isRequired && (cellValue == null || cellValue == '')){

                            // 缺少必填项记录
                            failureRecord[j] = {
                                richText: [
                                    {
                                        text: `缺少${headerString[j]}`,
                                        font: {
                                            color: { argb: 'FFFF0000' }
                                        }
                                    }
                                ]
                            }

                            isFailure = true;

                        } 
                        
                    }

                    
                    // 题型检测
                    if(questionType.indexOf(rowData['题型']) == -1 && rowData['题型'] != null){
                        isFailure = true;

                        failureRecord[headerIndexMap['题型']] = {
                            richText: [
                                {
                                    text: `题型不正确, 请填写: ${questionType}`,
                                    font: {
                                        color: { argb: 'FFFF0000' }
                                    }
                                }
                            ]
                        }
                    }
                    
                    // 根据题型检测题目内容
                    switch(rowData['题型']){

                        case '单选题':{
                            
                            let hasEmptyOption = false;

                            let emptyOptions = [];

                            let emptyOptionsCache = [];

                            let optionData = [];

                            let optionError = false;

                            for(let i = 0; i < optionsHeader.length; i++){

                                if(rowData[optionsHeader[i]] == null || rowData[optionsHeader[i]] == ''){
                                    hasEmptyOption = true;

                                    emptyOptionsCache.push(optionsHeader[i]);

                                    continue;
                                }

                                if(hasEmptyOption){
                                    
                                    emptyOptions.push(...emptyOptionsCache);

                                    emptyOptionsCache = [];

                                    optionError = true;
                                }

                                optionData.push(optionsHeader[i]);

                            }

                            if(optionData.length == 0){
                                isFailure = true;

                                failureRecord[headerIndexMap['A']] = {
                                    richText: [
                                        {
                                            text: `缺少选项描述, 请在选项A-Z中填写选项描述`,
                                            font: {
                                                color: { argb: 'FFFF0000' }
                                            }
                                        }
                                    ]
                                }
                            }

                            if(!optionError){
                                break;
                            }

                            isFailure = true;

                            emptyOptions.forEach((option) => {
                                failureRecord[headerIndexMap[option]] = {
                                    richText: [
                                        {
                                            text: `缺少选项${option}描述`,
                                            font: {
                                                color: { argb: 'FFFF0000' }
                                            }
                                        }
                                    ]
                                }
                            })


                            break;
                        
                        }

                        case '多选题':{

                            let hasEmptyOption = false;

                            let emptyOptions = [];

                            let emptyOptionsCache = [];

                            let optionData = [];

                            let optionError = false;

                            for(let i = 0; i < optionsHeader.length; i++){

                                if(rowData[optionsHeader[i]] == null || rowData[optionsHeader[i]] == ''){
                                    hasEmptyOption = true;

                                    emptyOptionsCache.push(optionsHeader[i]);

                                    continue;
                                }

                                if(hasEmptyOption){
                                    
                                    emptyOptions.push(...emptyOptionsCache);

                                    emptyOptionsCache = [];

                                    optionError = true;
                                }

                                optionData.push(optionsHeader[i]);

                            }

                            if(optionData.length == 0){
                                isFailure = true;

                                failureRecord[headerIndexMap['A']] = {
                                    richText: [
                                        {
                                            text: `缺少选项描述, 请在选项A-Z中填写选项描述`,
                                            font: {
                                                color: { argb: 'FFFF0000' }
                                            }
                                        }
                                    ]
                                }
                            }


                            if(!optionError){
                                break;
                            }

                            isFailure = true;

                            emptyOptions.forEach((option) => {
                                failureRecord[headerIndexMap[option]] = {
                                    richText: [
                                        {
                                            text: `缺少选项${option}描述`,
                                            font: {
                                                color: { argb: 'FFFF0000' }
                                            }
                                        }
                                    ]
                                }
                            })
                            
                            break;

                        }

                        case '简答题':{

                            break;

                        }

                        case '量表题':{

                            let optionError = false;

                            for(let i = 0; i < optionsHeader.length; i++){

                                if(optionsHeader[i] == 'A'){
                                    
                                    if(rowData['A'] != null && rowData['A'] != ''){
                                        continue;
                                    }

                                    isFailure = true;

                                    failureRecord[headerIndexMap['A']] = {
                                        richText: [
                                            {
                                                text: `缺少最小值描述, 请在选项A中填写最小值描述`,
                                                font: {
                                                    color: { argb: 'FFFF0000' }
                                                }
                                            }
                                        ]
                                    }
                                }

                                if(rowData[optionsHeader[i]] != null && rowData[optionsHeader[i]] != ''){
                                    optionError = false;
                                    break;
                                }

                                optionError = true;
                                
                            }
                            

                            if(optionError){
                                isFailure = true;

                                failureRecord[headerIndexMap['B']] = {
                                    richText: [
                                        {
                                            text: `缺少最大值描述, 请在选项B-Z中的任意一个单元格填写最大值描述`,
                                            font: {
                                                color: { argb: 'FFFF0000' }
                                            }
                                        }
                                    ]
                                }
                            }



                            break;

                        }

                        default:
                            isFailure = true;
                            break;

                    }


                    console.log(failureRecord);

                    if(isFailure){
                        
                        // 记录识别失败的题目数量
                        resultData.failure[0][2].richText[0].text = parseInt(resultData.failure[0][2].richText[0].text) + 1;

                        resultData.failure.push(failureRecord);
                    }else{
                        resultData.success[i - 3] = rowData;
                    }

                }

            })


            console.log("结果输出:",resultData);

            resolve(true);
        }
    });

    

    return resultData;

}
