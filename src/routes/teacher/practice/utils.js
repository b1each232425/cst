 /*
 * @Author: 李乐毅 
 * @Date: 2025-07-27 16:36:22 
 * @Last Modified by:   李乐毅 
 * @Last Modified time: 2025-07-27 16:36:22 
 */ 
import ExcelJS from 'exceljs';
export async function exportToExcel(data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 添加表头
    worksheet.columns = [
        { header: '姓名', key: 'name', width: 20 },
        { header: '手机号', key: 'phone_number', width: 15 },
        { header: '身份证号', key: 'id_card', width: 20 },
        { header: '账号', key: 'account', width: 20 },
    ];

    // 添加数据行
    data.forEach(item => {
        // 确保数据字段与 Golang 结构体字段匹配
        worksheet.addRow({
            name: item.official_name,
            phone_number: item.phone,
            id_card: item.id_card_no,
            account: item.account,
        });
    });

    // 生成二进制数据
    const buffer = await workbook.xlsx.writeBuffer();

    // 创建下载链接
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = '学生名单.xlsx';
    link.click();

    URL.revokeObjectURL(url);
}

export  function pageQueryHandle(total,pageSize){
      // 计算总页数
   return    total/ pageSize
            ? Math.ceil(total/ pageSize)
            : 1;

}
export function transformPracticeData(practices) {
    if (!Array.isArray(practices)) return [];

    return practices.map((item) => {
    const practice = item.practice; // 提取实际的practice对象
    
    // 转置type字段
    let transformedType = practice.Type;
    if (practice.Type === '00') transformedType = '经典巩固';
    else if (practice.Type === '02') transformedType = '随机组卷';
    else if (practice.Type === '04') transformedType = '智能提升';

    // 转置status字段
    let transformedStatus = practice.Status;
    if (practice.Status === '02') transformedStatus = '已发布';
    else if (practice.Status === '00') transformedStatus = '未发布';
    else if (practice.Status === '06') transformedStatus = '已作废';

    // 创建新对象，包含practice的所有属性和转换后的字段
    return {
      ...practice, // 展开practice对象的所有属性
      student_count: item.student_count||0, // 从外层对象获取student_count
      Type: transformedType,
      Status: transformedStatus,
      selected:false
    };
  });
  }

  export function transFormType(Type) { 
    
    // 转置type字段
    if (Type === "自定义组卷（经典巩固）") return '00';
    else if (Type === "随机组卷（随机组卷）") return'02';
    else if (Type === "智能刷题（智能提升）") return '04';
    

  }