import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { transformPracticeData, transFormType,exportToExcel,pageQueryHandle } from '../utils';
import { transform } from 'typescript';
import ExcelJS from 'exceljs';

describe('转置type测试', () => {
	beforeEach(()=>{
		vi.clearAllMocks();
	})
	it('将自定义组卷（经典巩固）转换为00', () => {
		const result=transFormType('自定义组卷（经典巩固）')
		expect(result).toBe('00');
	});
	it('应将"随机组卷（随机组卷）"转换为"02"', () => {
    const result = transFormType("随机组卷（随机组卷）");
    expect(result).toBe('02');
  });

  it('应将"智能刷题（智能提升）"转换为"04"', () => {
    const result = transFormType("智能刷题（智能提升）");
    expect(result).toBe('04');
  });

});

describe('transformPracticeData 函数测试', () => {
  it('应该正确转换练习数据数组', () => {
    const mockData = [
      {
        student_count: 25,
        practice: {
          id: 1,
          name: '数学练习1',
          Type: '00',
          selected:false,
          Status: '02'
        }
      },
      {
        student_count: 18,
        practice: {
          id: 2,
          name: '英语练习1',
          Type: '02',
          selected:false,
          Status: '00'
        }
      },
      {
        student_count: 30,
        practice: {
          id: 3,
          name: '物理练习1',
          Type: '04',
          selected:false,
          Status: '02'
        }
      }
    ];

    const result = transformPracticeData(mockData);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 1,
      name: '数学练习1',
      Type: '经典巩固',
      Status: '已发布',
      selected:false,
      student_count: 25
    });
    
    expect(result[1]).toEqual({
      id: 2,
      name: '英语练习1',
      Type: '随机组卷',
      Status: '未发布',
      selected:false,
      student_count: 18
    });
    
    expect(result[2]).toEqual({
      id: 3,
      name: '物理练习1',
      Type: '智能提升',
      Status: '已发布',
      selected:false,
      student_count: 30
    });
  });

  it('应该处理空数组输入', () => {
    const result = transformPracticeData([]);
    expect(result).toEqual([]);
  });

  it('应该处理非数组输入', () => {
    const result = transformPracticeData(null);
    expect(result).toEqual([]);
    
    const result2 = transformPracticeData(undefined);
    expect(result2).toEqual([]);
  });

  it('应该处理没有student_count的情况', () => {
    const mockData = [
      {
        practice: {
          id: 1,
          name: '练习1',
          Type: '00',
          selected:false,
          Status: '02'
        }
      }
    ];

    const result = transformPracticeData(mockData);
    expect(result[0].student_count).toBe(0);
  });

  it('应该保留practice对象的其他属性', () => {
    const mockData = [
      {
        student_count: 10,
        practice: {
          id: 1,
          name: '练习1',
          description: '这是一个测试练习',
          Type: '00',
          Status: '02',
          selected:false,
          created_at: '2023-01-01'
        }
      }
      ];
      
      const result = transformPracticeData(mockData);
      expect(result[0]).toMatchObject({
        id: 1,
        name: '练习1',
        description: '这是一个测试练习',
        Type: '经典巩固',
        Status: '已发布',
        selected:false,
        created_at: '2023-01-01',
        student_count: 10
      });
    });
});
describe('测试导出学生名单函数', () => { 
	let originalBlob;
	let originalCreateObjectURL;
	let originalRevokeObjectURL;
	let originalExcelJSWorkbook;
    let mockWorksheet;
    let mockWriteBuffer;

	beforeEach(()=>{
		global.document = {
      createElement: vi.fn()
    };
		originalBlob = global.Blob;
		originalCreateObjectURL=URL.createObjectURL
		originalRevokeObjectURL=URL.revokeObjectURL
		originalExcelJSWorkbook=ExcelJS.Workbook;
		global.Blob=vi.fn((data,options)=>({
			data,
			options,
		}))
		URL.createObjectURL=vi.fn(() => 'blob:test-url-123')
		URL.revokeObjectURL=vi.fn()
		 // 模拟ExcelJS.Workbook
        mockWriteBuffer = vi.fn().mockResolvedValue(new Uint8Array([0x50, 0x4B, 0x03, 0x04]));
		 mockWorksheet = {
            columns: [],
            addRow: vi.fn(),
        };
		   // 模拟Workbook类
        const MockWorkbook = vi.fn(() => ({
            addWorksheet: vi.fn().mockReturnValue(mockWorksheet),
            xlsx: {
                writeBuffer: mockWriteBuffer
            }
        }));
		ExcelJS.Workbook = MockWorkbook;
		document.createElement=vi.fn((tagName)=>{
			if(tagName==='a'){
				return{
					href:'',
					download:'',
					click:vi.fn()
				}
			}
			return document.createElement(tagName)
		})
		afterEach(()=>{
			 // 恢复原始API
        global.Blob = originalBlob;
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        ExcelJS.Workbook = originalExcelJSWorkbook;
        vi.restoreAllMocks();
		})
	})	
	it('应该正确创建Blob对象并设置正确的MIME类型',async()=>{
	const mockData=[
		{
			id: 1,
            name: '张三',
            phone_number: '13535215794',
            id_card: '440801200505022917',
            account: 'item.account',
            password: 'item.password'
		}
		]
		await exportToExcel(mockData)
		expect(ExcelJS.Workbook).toHaveBeenCalled();
		 // 验证工作表是否被创建
        const workbookInstance = ExcelJS.Workbook.mock.results[0].value;
        expect(workbookInstance.addWorksheet).toHaveBeenCalledWith('Sheet1');
        expect(workbookInstance.addWorksheet).toHaveBeenCalledTimes(1);
	})
});

describe('测试前端分页函数',()=>{
	beforeEach(()=>{
		vi.clearAllMocks()
	})
	it('正常进行分页计算',()=>{
		const result=pageQueryHandle(100,10)
		expect(result).toBe(10)
	})
	it('传入不正常的计算参数',()=>{
	const result=pageQueryHandle(0,10)
	expect(result).toBe(1)
	})
	})





