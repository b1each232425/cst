import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatISOString } from '../dateFormatter.js';

describe('日期格式化工具测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 模拟console.error以避免测试输出中的错误信息
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('formatISOString', () => {
        it('应该正确格式化标准ISO字符串', () => {
            const isoString = '2024-01-15T09:30:45.123Z';
            const result = formatISOString(isoString);
            
            // 由于时区差异，我们检查格式是否正确
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });

        it('应该正确格式化不带毫秒的ISO字符串', () => {
            const isoString = '2024-12-25T23:59:59Z';
            const result = formatISOString(isoString);
            
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });

        it('应该正确格式化带时区的ISO字符串', () => {
            const isoString = '2024-06-15T14:30:00+08:00';
            const result = formatISOString(isoString);
            
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });

        it('应该正确处理本地时间格式', () => {
            const isoString = '2024-03-10T08:15:30';
            const result = formatISOString(isoString);
            
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });

        it('应该在输入为空字符串时返回占位符', () => {
            const result = formatISOString('');
            expect(result).toBe('−');
        });

        it('应该在输入为null时返回占位符', () => {
            const result = formatISOString(null);
            expect(result).toBe('−');
        });

        it('应该在输入为undefined时返回占位符', () => {
            const result = formatISOString(undefined);
            expect(result).toBe('−');
        });

        it('应该在输入为无效日期字符串时返回占位符', () => {
            const invalidDate = 'invalid-date-string';
            const result = formatISOString(invalidDate);
            
            expect(result).toBe('−');
            expect(console.error).toHaveBeenCalledWith(
                'Invalid date format:', 
                invalidDate, 
                expect.any(Error)
            );
        });

        it('应该在输入为数字字符串时返回占位符', () => {
            const invalidDate = '12345';
            const result = formatISOString(invalidDate);
            
            expect(result).toBe('−');
            expect(console.error).toHaveBeenCalledWith(
                'Invalid date format:', 
                invalidDate, 
                expect.any(Error)
            );
        });

        it('应该正确处理边界日期', () => {
            // 测试年初
            const newYear = '2024-01-01T00:00:00Z';
            const newYearResult = formatISOString(newYear);
            expect(newYearResult).toMatch(/^2024-01-01 \d{2}:\d{2}:\d{2}$/);

            // 测试年末
            const yearEnd = '2024-12-31T23:59:59Z';
            const yearEndResult = formatISOString(yearEnd);
            expect(yearEndResult).toMatch(/^2024-12-31 \d{2}:\d{2}:\d{2}$/);
        });

        it('应该正确处理闰年日期', () => {
            const leapYear = '2024-02-29T12:00:00Z';
            const result = formatISOString(leapYear);
            expect(result).toMatch(/^2024-02-29 \d{2}:\d{2}:\d{2}$/);
        });

        it('应该正确格式化单位数的月份和日期', () => {
            const singleDigits = '2024-01-05T09:08:07Z';
            const result = formatISOString(singleDigits);
            
            // 验证月份和日期都被正确补零
            expect(result).toMatch(/^2024-01-05 \d{2}:\d{2}:\d{2}$/);
        });

        it('应该正确格式化单位数的时分秒', () => {
            const singleDigitTime = '2024-12-25T01:02:03Z';
            const result = formatISOString(singleDigitTime);
            
            // 验证时分秒都被正确补零
            expect(result).toMatch(/^2024-12-25 01:02:03$/);
        });

        it('应该处理不同年份的日期', () => {
            const dates = [
                '2020-06-15T12:30:45Z',
                '2025-08-20T18:45:30Z',
                '1999-12-31T23:59:59Z'
            ];

            dates.forEach(date => {
                const result = formatISOString(date);
                expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
            });
        });

        it('应该处理包含特殊字符的无效输入', () => {
            const invalidInputs = [
                'abc-def-ghi',
                '2024/01/15 12:30:45',
                '2024年1月15日',
                '{}',
                '[]'
            ];

            invalidInputs.forEach(input => {
                const result = formatISOString(input);
                expect(result).toBe('−');
                expect(console.error).toHaveBeenCalledWith(
                    'Invalid date format:', 
                    input, 
                    expect.any(Error)
                );
            });
        });

        it('应该处理极端的时间戳', () => {
            // 测试Unix时间戳开始
            const unixStart = '1970-01-01T00:00:00Z';
            const result = formatISOString(unixStart);
            expect(result).toMatch(/^1970-01-01 \d{2}:\d{2}:\d{2}$/);
        });

        it('应该在Date构造函数抛出异常时返回占位符', () => {
            // 模拟Date构造函数抛出异常
            const originalDate = global.Date;
            global.Date = vi.fn(() => {
                throw new Error('Date constructor error');
            });

            const result = formatISOString('2024-01-15T12:30:45Z');
            
            expect(result).toBe('−');
            expect(console.error).toHaveBeenCalledWith(
                'Invalid date format:', 
                '2024-01-15T12:30:45Z', 
                expect.any(Error)
            );

            // 恢复原始Date构造函数
            global.Date = originalDate;
        });

        it('应该正确处理毫秒精度', () => {
            const withMilliseconds = '2024-01-15T12:30:45.999Z';
            const result = formatISOString(withMilliseconds);
            
            // 毫秒应该被忽略，只显示到秒
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
            expect(result).not.toContain('.999');
        });
    });
});
