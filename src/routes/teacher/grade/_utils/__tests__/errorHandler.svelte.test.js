import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    handleApiError, 
    handleValidationError, 
    handleSuccess, 
    handleFeatureNotImplemented, 
    handleSelectionError 
} from '../errorHandler.js';

// 模拟 Toast 组件
vi.mock('$lib/components/Toast/Toast.js', () => ({
    toast: {
        error: vi.fn(),
        warning: vi.fn(),
        success: vi.fn()
    }
}));

// 模拟环境变量
Object.defineProperty(import.meta, 'env', {
    value: {
        DEV: true
    },
    writable: true
});

describe('错误处理工具', () => {
    let mockToast;

    beforeEach(() => {
        vi.clearAllMocks();
        mockToast = (await import('$lib/components/Toast/Toast.js')).toast;
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('API 错误处理', () => {
        it('应该处理网络连接错误', () => {
            const error = new Error('Failed to fetch');
            const result = handleApiError(error, '获取数据');

            expect(mockToast.error).toHaveBeenCalledWith('获取数据失败：网络连接异常，请检查网络连接');
            expect(console.error).toHaveBeenCalledWith('获取数据失败:', error);
            expect(result).toBe('获取数据失败：网络连接异常，请检查网络连接');
        });

        it('should handle HTTP 401 errors', () => {
            const error = new Error('HTTP error! status: 401');
            const result = handleApiError(error, '获取用户信息');

            expect(mockToast.error).toHaveBeenCalledWith('登录已过期，请重新登录');
            expect(result).toBe('登录已过期，请重新登录');
        });

        it('should handle HTTP 403 errors', () => {
            const error = new Error('HTTP error! status: 403');
            const result = handleApiError(error, '删除数据');

            expect(mockToast.error).toHaveBeenCalledWith('权限不足，无法执行此操作');
            expect(result).toBe('权限不足，无法执行此操作');
        });

        it('should handle HTTP 404 errors', () => {
            const error = new Error('HTTP error! status: 404');
            const result = handleApiError(error, '获取资源');

            expect(mockToast.error).toHaveBeenCalledWith('请求的资源不存在');
            expect(result).toBe('请求的资源不存在');
        });

        it('should handle HTTP 500 errors', () => {
            const error = new Error('HTTP error! status: 500');
            const result = handleApiError(error, '保存数据');

            expect(mockToast.error).toHaveBeenCalledWith('服务器内部错误，请稍后重试');
            expect(result).toBe('服务器内部错误，请稍后重试');
        });

        it('should handle generic errors', () => {
            const error = new Error('Something went wrong');
            const result = handleApiError(error, '处理请求');

            expect(mockToast.error).toHaveBeenCalledWith('处理请求失败：Something went wrong');
            expect(result).toBe('处理请求失败：Something went wrong');
        });

        it('should not show toast when showToast is false', () => {
            const error = new Error('Test error');
            const result = handleApiError(error, '测试操作', { showToast: false });

            expect(mockToast.error).not.toHaveBeenCalled();
            expect(console.error).toHaveBeenCalledWith('测试操作失败:', error);
            expect(result).toBe('测试操作失败：Test error');
        });

        it('should not log error when logError is false', () => {
            const error = new Error('Test error');
            const result = handleApiError(error, '测试操作', { logError: false });

            expect(mockToast.error).toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
            expect(result).toBe('测试操作失败：Test error');
        });
    });

    describe('handleValidationError', () => {
        it('should show warning toast for validation errors', () => {
            const message = '请填写必填字段';
            const result = handleValidationError(message);

            expect(mockToast.warning).toHaveBeenCalledWith(message);
            expect(result).toBe(message);
        });

        it('should not show toast when showToast is false', () => {
            const message = '验证失败';
            const result = handleValidationError(message, { showToast: false });

            expect(mockToast.warning).not.toHaveBeenCalled();
            expect(result).toBe(message);
        });
    });

    describe('handleSuccess', () => {
        it('should show success toast', () => {
            const operation = '保存数据';
            const result = handleSuccess(operation);

            expect(mockToast.success).toHaveBeenCalledWith('保存数据成功');
            expect(result).toBe('保存数据成功');
        });

        it('should not show toast when showToast is false', () => {
            const operation = '删除数据';
            const result = handleSuccess(operation, { showToast: false });

            expect(mockToast.success).not.toHaveBeenCalled();
            expect(result).toBe('删除数据成功');
        });
    });

    describe('handleFeatureNotImplemented', () => {
        it('should show warning for unimplemented features', () => {
            const feature = '批量导出';
            const result = handleFeatureNotImplemented(feature);

            expect(mockToast.warning).toHaveBeenCalledWith('批量导出功能正在开发中，敬请期待');
            expect(result).toBe('批量导出功能正在开发中，敬请期待');
        });
    });

    describe('handleSelectionError', () => {
        it('should show warning for selection errors', () => {
            const action = '删除';
            const result = handleSelectionError(action);

            expect(mockToast.warning).toHaveBeenCalledWith('请至少选择一项进行删除');
            expect(result).toBe('请至少选择一项进行删除');
        });
    });

    describe('Development environment handling', () => {
        it('should log errors in development environment', () => {
            import.meta.env.DEV = true;
            const error = new Error('Dev error');
            
            handleApiError(error, '开发测试');
            
            expect(console.error).toHaveBeenCalledWith('开发测试失败:', error);
        });

        it('should not log errors in production environment', () => {
            import.meta.env.DEV = false;
            const error = new Error('Prod error');
            
            handleApiError(error, '生产测试');
            
            expect(console.error).not.toHaveBeenCalled();
            
            // Reset for other tests
            import.meta.env.DEV = true;
        });
    });
});
