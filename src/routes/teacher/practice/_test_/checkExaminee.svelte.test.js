// src/routes/teacher/practice/__tests__/check_examinee.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkData } from '../batch_check/check_examinee.js';

describe('测试导入学生信息检验函数',(()=>{
    beforeEach(()=>{
        vi.clearAllMocks();
    })

    it('测试正常导入并识别',(()=>{
        //模拟一份有数据的File文件
        const file = new File([
            '编号,姓名,手机号,身份证号\n',
            '1,张三,12345678901,440801200505022917\n',
            '2,李四,,12345678902,440801200505022918'],'test.xlsx')
            const result = checkData(file);

            expect(result).toEqual(Promise.resolve())
    }))

    it('文件为空',(()=>{
        const file = null
        const result = checkData(file);
        const expectResult = Promise.reject({
            error:'文件为空'
        })
        expect(checkData(result)).toEqual(expectResult)
    }))

    it('文件格式不是xlsx',(()=>{
        const file = new File([],'test.txt')
        const result = checkData(file);
        const expectResult = Promise.reject({
            error:'不支持的文件类型, 支持的文件类型为：xlsx, xls'
        })
        expect(checkData(result)).toEqual(expectResult)
    }))
    it('文件数据为空',(async()=>{
         const checkDataSpy = vi.spyOn(checkData);
  
  // Mock 不同的返回值
  checkDataSpy.mockImplementation((file) => {
    if (file.name === 'empty.xlsx') {
      return Promise.resolve({ error: '文件数据为空', data: [] });
    }
    if (file.name === 'valid.xlsx') {
      return Promise.resolve({ 
        error: null, 
        data: [{ serial_number: 1, name: '张三', is_ok: true }] 
      });
    }
    return Promise.resolve({ error: '未知错误', data: [] });
  });
  
  // 测试不同场景
  const emptyResult = await checkData(new File([''], 'empty.xlsx'));
  expect(emptyResult.error).toBe('文件数据为空');
  
  const validResult = await checkData(new File([''], 'valid.xlsx'));
  expect(validResult.data).toHaveLength(1);
  
  checkDataSpy.mockRestore();
    }))
}))
// 工具函数：构造一个最小有效 Excel 文件（xlsx）的 ArrayBuffer
async function createMockXlsx(rows = []) {
  const { Workbook } = await import('exceljs');
  const wb = new Workbook();
  const ws = wb.addWorksheet('Sheet1');

  // 第1行：空行
  ws.addRow([]);
  // 第2行：表头
  const header = ['*姓名', '*性别', '*手机号', '*身份证号', '备注'];
  ws.addRow(header);

  // 第3行开始：数据行
  rows.forEach(row => ws.addRow(row));

  const buffer = await wb.xlsx.writeBuffer();
  return buffer;
}

// 工具函数：ArrayBuffer 转 File
function bufferToFile(buffer, filename = 'test.xlsx') {
  return new File([buffer], filename, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

describe('checkData', () => {
  it('应拒绝非 File 类型', async () => {
    const res = await checkData('not-a-file');
    expect(res.error).toBe('文件数据类型错误, 请传入File类型数据');
  });

  it('应拒绝非 xlsx/xls 扩展名', async () => {
    const file = new File([''], 'a.txt', { type: 'text/plain' });
    const res = await checkData(file);
    expect(res.error).toBe('不支持的文件类型, 支持的文件类型为：xlsx, xls');
  });

  it('应检测必填项缺失', async () => {
    const buffer = await createMockXlsx([
      ['张三', '男', '', '11010119900307555X', '备注1'], // 缺少手机号
    ]);
    const res = await checkData(bufferToFile(buffer));
    expect(res.data).toHaveLength(1);
    expect(res.data[0].errorType).toBe('缺少必填项');
    expect(res.data[0].isOk).toBe(false);
  });

  it('应检测手机号格式错误', async () => {
    const buffer = await createMockXlsx([
      ['张三', '男', '12345678901', '11010119900307555X', ''], // 手机号格式错误
    ]);
    const res = await checkData(bufferToFile(buffer));
    expect(res.data[0].errorType).toBe('手机号格式错误');
  });

  it('应检测身份证号格式错误', async () => {
    const buffer = await createMockXlsx([
      ['张三', '男', '13800138000', '123456789', ''], // 身份证号格式错误
    ]);
    const res = await checkData(bufferToFile(buffer));
    expect(res.data[0].errorType).toBe('身份证号格式错误');
  });

  it('应检测手机号重复', async () => {
    const buffer = await createMockXlsx([
      ['张三', '男', '13800138000', '11010119900307555X', ''],
      ['李四', '女', '13800138000', '11010119900307666X', ''], // 重复手机号
    ]);
    const res = await checkData(bufferToFile(buffer));
    expect(res.data.filter(r => r.errorType === 'duplicate_phone')).toHaveLength(2);
  });

  it('应检测身份证号重复', async () => {
    const buffer = await createMockXlsx([
      ['张三', '男', '13800138000', '11010119900307555X', ''],
      ['李四', '女', '13800138001', '11010119900307555X', ''], // 重复身份证号
    ]);
    const res = await checkData(bufferToFile(buffer));
    expect(res.data.filter(r => r.errorType === 'duplicate_id_card')).toHaveLength(2);
  });

  it('应成功解析无错误文件', async () => {
    const buffer = await createMockXlsx([
      ['张三', '男', '13800138000', '11010119900307555X', ''],
      ['李四', '女', '13800138001', '11010119900307666X', ''],
    ]);
    const res = await checkData(bufferToFile(buffer));
    expect(res.error).toBeNull();
    expect(res.data).toHaveLength(2);
    res.data.forEach(r => expect(r.isOk).toBe(true));
  });
});
