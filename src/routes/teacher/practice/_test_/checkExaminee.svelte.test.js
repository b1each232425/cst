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
