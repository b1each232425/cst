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

    it('文件数据为空',(()=>{
          // 创建一个空的文件，会导致FileReader读取结果为null
        const file = new File([], 'empty.xlsx');
        
        // 使用spyOn模拟FileReader的行为
        const mockFileReader = vi.spyOn(window, 'FileReader');
        const mockInstance = {
            readAsArrayBuffer: vi.fn(),
            onloadend: null,
            result: null
        };
        
        mockFileReader.mockImplementation(() => mockInstance);
        
        // 手动触发onloadend事件
        setTimeout(() => {
            if (mockInstance.onloadend) {
                mockInstance.onloadend({ target: { result: null } });
            }
        }, 0);
        
        const result = checkData(file);
        expect(result.error).toBe('文件数据为空');
        
        // 清理mock
        mockFileReader.mockRestore();
    }))




}))
