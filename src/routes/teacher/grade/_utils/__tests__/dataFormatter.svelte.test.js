import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatISOString,
  validateNumericField,
  formatPracticeData,
  formatExamData,
  safeDisplayNumber,      
  safeDisplayText,        
  safeDisplayBoolean      
} from '../dataFormatter.js';

describe('数据格式化工具测试', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// 模拟 console.error 以避免测试输出中的错误信息
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('formatISOString - ISO字符串格式化', () => {
		it('应该正确格式化有效的ISO字符串', () => {
			const isoString = '2023-12-25T10:30:45.000Z';
			const result = formatISOString(isoString);
			
			// 由于时区差异，我们检查格式而不是具体值
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
		});

		it('应该处理空值', () => {
			expect(formatISOString(null)).toBe('-');
			expect(formatISOString(undefined)).toBe('-');
			expect(formatISOString('')).toBe('-');
		});

		it('应该处理无效的日期字符串', () => {
			const result = formatISOString('invalid-date');
			expect(result).toBe('-');
			expect(console.error).toHaveBeenCalledWith(
				'Invalid date format:',
				'invalid-date',
				expect.any(Error)
			);
		});

		it('应该正确处理特定日期', () => {
			// 使用固定的UTC时间来避免时区问题
			const isoString = '2025-01-01T00:00:00.000Z';
			const result = formatISOString(isoString);
			expect(result).toContain('2025');
			expect(result).toContain('08:00:00');
		});
	});

	describe('validateNumericField - 数值字段验证', () => {
		it('应该处理特殊值', () => {
			expect(validateNumericField(-1)).toBeNull();
			expect(validateNumericField(null)).toBeNull();
			expect(validateNumericField(undefined)).toBeNull();
			expect(validateNumericField('')).toBeNull();
		});

		it('应该验证有效数字', () => {
			expect(validateNumericField(10)).toBe(10);
			expect(validateNumericField(10.5)).toBe(10.5);
			expect(validateNumericField('15')).toBe(15);
			expect(validateNumericField('20.7')).toBe(20.7);
		});

		it('应该处理无效数字', () => {
			expect(validateNumericField('abc')).toBeNull();
			expect(validateNumericField(NaN)).toBeNull();
			expect(validateNumericField(Infinity)).toBeNull();
			expect(validateNumericField(-Infinity)).toBeNull();
		});

		it('应该处理负数', () => {
			expect(validateNumericField(-5)).toBeNull();
			expect(validateNumericField(-10.5)).toBeNull();
		});

		it('应该处理整数验证', () => {
			expect(validateNumericField(10, true)).toBe(10);
			expect(validateNumericField(10.7, true)).toBe(11); // 四舍五入
			expect(validateNumericField(10.3, true)).toBe(10); // 四舍五入
			expect(validateNumericField('15', true)).toBe(15);
		});

		it('应该处理零值', () => {
			expect(validateNumericField(0)).toBe(0);
			expect(validateNumericField('0')).toBe(0);
			expect(validateNumericField(0, true)).toBe(0);
		});
	});

	describe('formatPracticeData - 练习数据格式化', () => {
		it('应该处理空数据', () => {
			expect(formatPracticeData(null)).toEqual([]);
			expect(formatPracticeData(undefined)).toEqual([]);
			expect(formatPracticeData([])).toEqual([]);
		});

		it('应该格式化练习数据', () => {
			const practiceData = [
				{
					id: 1,
					name: '练习1',
					total_score: '100',
					average_score: '85.5',
					completed_students: '30',
					passed_students: '25'
				},
				{
					id: 2,
					name: '练习2',
					total_score: -1, // 无效值
					average_score: 'invalid', // 无效值
					completed_students: 20,
					passed_students: 15
				}
			];

			const result = formatPracticeData(practiceData);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				id: 1,
				name: '练习1',
				total_score: 100,
				average_score: 85.5,
				completed_students: 30,
				passed_students: 25
			});
			expect(result[1]).toEqual({
				id: 2,
				name: '练习2',
				total_score: null,
				average_score: null,
				completed_students: 20,
				passed_students: 15
			});
		});

		it('应该保持原数组引用', () => {
			const practiceData = [
				{
					id: 1,
					name: '练习1',
					total_score: 100
				}
			];

			const result = formatPracticeData(practiceData);
			expect(result).toBe(practiceData); // 应该是同一个数组引用
		});
	});

	describe('formatExamData - 考试数据格式化', () => {
		it('应该处理空数据', () => {
			expect(formatExamData(null)).toEqual([]);
			expect(formatExamData(undefined)).toEqual([]);
			expect(formatExamData([])).toEqual([]);
		});

		it('应该格式化考试数据', () => {
			const examData = [
				{
					id: 1,
					name: '期中考试',
					sessions: [
						{
							exam_session_id: 1,
							start_time: '2023-12-25T10:00:00.000Z',
							end_time: '2023-12-25T12:00:00.000Z',
							total_score: '100',
							average_score: '85.5',
							scheduled_examinees: '50',
							actual_examinees: '48',
							pass_examinees: '40'
						}
					]
				}
			];

			const result = formatExamData(examData);

			expect(result).toHaveLength(1);
			expect(result[0].sessions[0]).toEqual(
				expect.objectContaining({
					exam_session_id: 1,
					start_time: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
					end_time: expect.stringMatching(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
					total_score: 100,
					average_score: 85.5,
					scheduled_examinees: 50,
					actual_examinees: 48,
					pass_examinees: 40
				})
			);
		});

		it('应该处理无效的场次数据', () => {
			const examData = [
				{
					id: 1,
					name: '考试',
					sessions: [
						{
							exam_session_id: 1,
							start_time: 'invalid-date',
							end_time: null,
							total_score: -1,
							average_score: 'invalid',
							scheduled_examinees: 'abc',
							actual_examinees: -5,
							pass_examinees: 10.7
						}
					]
				}
			];

			const result = formatExamData(examData);

			expect(result[0].sessions[0]).toEqual(
				expect.objectContaining({
					start_time: '-',
					end_time: '-',
					total_score: null,
					average_score: null,
					scheduled_examinees: null,
					actual_examinees: null,
					pass_examinees: 11 // 四舍五入到整数
				})
			);
		});

		it('应该处理没有场次的考试', () => {
			const examData = [
				{
					id: 1,
					name: '考试',
					sessions: []
				}
			];

			const result = formatExamData(examData);
			expect(result[0].sessions).toEqual([]);
		});

		it('应该保持原数组引用', () => {
			const examData = [
				{
					id: 1,
					name: '考试',
					sessions: []
				}
			];

			const result = formatExamData(examData);
			expect(result).toBe(examData); // 应该是同一个数组引用
		});
	});

	describe('safeDisplayNumber - 安全显示数值', () => {
  it('应该返回 "-" 当值为 null / undefined / "" / -1', () => {
    expect(safeDisplayNumber(null)).toBe('-');
    expect(safeDisplayNumber(undefined)).toBe('-');
    expect(safeDisplayNumber('')).toBe('-');
    expect(safeDisplayNumber(-1)).toBe('-');
  });

  it('应该返回 "-" 当值为 NaN / Infinity / 负数', () => {
    expect(safeDisplayNumber('abc')).toBe('-');
    expect(safeDisplayNumber(NaN)).toBe('-');
    expect(safeDisplayNumber(Infinity)).toBe('-');
    expect(safeDisplayNumber(-5)).toBe('-');
  });

  it('应该返回原数字符串，当 decimals 未传', () => {
    expect(safeDisplayNumber(0)).toBe('0');
    expect(safeDisplayNumber('123')).toBe('123');
    expect(safeDisplayNumber(123.456)).toBe('123.456');
  });

  it('应该按指定小数位格式化', () => {
    expect(safeDisplayNumber(3.1415926, 2)).toBe('3.14');
    expect(safeDisplayNumber(123, 0)).toBe('123');
  });
});

// =============================================
// safeDisplayText
// =============================================
describe('safeDisplayText - 安全显示文本', () => {
  it('应该返回 "-" 当值为 null / undefined / ""', () => {
    expect(safeDisplayText(null)).toBe('-');
    expect(safeDisplayText(undefined)).toBe('-');
    expect(safeDisplayText('')).toBe('-');
  });

  it('应该将其它值转为字符串', () => {
    expect(safeDisplayText(0)).toBe('0');
    expect(safeDisplayText(false)).toBe('false');
    expect(safeDisplayText('abc')).toBe('abc');
  });
});

// =============================================
// safeDisplayBoolean
// =============================================
describe('safeDisplayBoolean - 安全显示布尔值', () => {
  it('应该返回 "-" 当值为 null / undefined', () => {
    expect(safeDisplayBoolean(null)).toBe('-');
    expect(safeDisplayBoolean(undefined)).toBe('-');
  });

  it('应该返回 trueText / falseText', () => {
    expect(safeDisplayBoolean(true)).toBe('是');
    expect(safeDisplayBoolean(false)).toBe('否');
    expect(safeDisplayBoolean(true, '开', '关')).toBe('开');
    expect(safeDisplayBoolean(0, '开', '关')).toBe('关');
    expect(safeDisplayBoolean('任意真值')).toBe('是');
  });
});
});
