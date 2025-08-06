import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getExams,
    submitExamGrades,
    getExamineeGradeList,
    getGradeLogs,
    getPractices,
    exportPracticeGrades
} from '../score.js';

// 模拟全局fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 模拟DOM操作
Object.defineProperty(window, 'URL', {
    value: {
        createObjectURL: vi.fn(() => 'mock-blob-url')
    }
});

Object.defineProperty(document, 'createElement', {
    value: vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn(),
        remove: vi.fn()
    }))
});

Object.defineProperty(document.body, 'appendChild', {
    value: vi.fn()
});

describe('成绩API测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getExams - 获取考试成绩列表', () => {
        it('应该使用默认参数发送请求', async () => {
            const mockResponse = {
                status: 0,
                data: { exams: [], total: 0 }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await getExams();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/grade/list?category=exam&page=1&pageSize=10&submitted=-1',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );
            expect(result).toEqual(mockResponse);
        });

        it('应该正确处理所有参数', async () => {
            const params = {
                name: '期中考试',
                type: '00',
                submitted: 1,
                page: 2,
                pageSize: 20,
                teacherID: 123,
                examID: 456
            };

            const mockResponse = { status: 0, data: {} };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            await getExams(params);

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/grade/list?category=exam&page=2&pageSize=20&name=%E6%9C%9F%E4%B8%AD%E8%80%83%E8%AF%95&type=00&teacherID=123&examID=456&submitted=1',
                expect.any(Object)
            );
        });

        it('应该处理HTTP错误', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(getExams()).rejects.toThrow('HTTP error! status: 500');
        });

        it('应该处理API错误响应', async () => {
            const errorResponse = {
                status: -1,
                msg: '获取失败'
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(errorResponse)
            });

            await expect(getExams()).rejects.toThrow('获取失败');
        });

        it('应该处理空参数', async () => {
            const mockResponse = { status: 0, data: {} };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            await getExams(null);

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/grade/list?category=exam&page=1&pageSize=10&submitted=-1',
                expect.any(Object)
            );
        });
    });

    describe('submitExamGrades - 提交考试成绩', () => {
        it('应该成功提交成绩', async () => {
            const examIds = [1, 2, 3];
            const mockResponse = { status: 0, msg: '提交成功' };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await submitExamGrades(examIds);

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/grade/submission',
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        data: {
                            exam_ids: examIds
                        }
                    })
                }
            );
            expect(result).toEqual(mockResponse);
        });

        it('应该拒绝空数组', async () => {
            await expect(submitExamGrades([])).rejects.toThrow('提交成绩失败：exam_ids 必须是一个非空数组。');
        });

        it('应该拒绝非数组参数', async () => {
            await expect(submitExamGrades('not-array')).rejects.toThrow('提交成绩失败：exam_ids 必须是一个非空数组。');
        });

        it('应该处理API错误', async () => {
            const examIds = [1, 2];
            const errorResponse = { status: -1, msg: '提交失败' };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(errorResponse)
            });

            await expect(submitExamGrades(examIds)).rejects.toThrow('提交失败');
        });
    });

    describe('getExamineeGradeList - 获取考生成绩列表', () => {
        it('应该成功获取考生列表', async () => {
            const examIDString = '1,2,3';
            const mockResponse = { status: 0, data: [] };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await getExamineeGradeList(examIDString);

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/teacher/exam-grade/examinee-grade-list?examID=1,2,3&page=-1&pageSize=-1',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );
            expect(result).toEqual(mockResponse);
        });

        it('应该拒绝空字符串', async () => {
            await expect(getExamineeGradeList('')).rejects.toThrow('获取考生名单失败：examIDString 必须是一个非空字符串。');
        });

        it('应该拒绝非字符串参数', async () => {
            await expect(getExamineeGradeList(123)).rejects.toThrow('获取考生名单失败：examIDString 必须是一个非空字符串。');
        });
    });

    

    describe('getPractices - 获取练习成绩列表', () => {
        it('应该使用默认参数', async () => {
            const mockResponse = { status: 0, data: [] };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await getPractices();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/grade/list?category=practice&page=1&pageSize=10',
                {
                    method: 'GET',
                    credentials: 'include'
                }
            );
            expect(result).toEqual(mockResponse);
        });

        it('应该正确处理所有参数', async () => {
            const params = {
                practiceName: '数学练习',
                page: 3,
                pageSize: 15,
                teacherID: 789,
                practiceID: 101
            };

            const mockResponse = { status: 0, data: [] };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            await getPractices(params);

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/grade/list?category=practice&page=3&pageSize=15&name=%E6%95%B0%E5%AD%A6%E7%BB%83%E4%B9%A0&teacherID=789&practiceID=101',
                expect.any(Object)
            );
        });
    })
});
