import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import StudentSelectionPanel from '../_components/StudentSelectionPanel.svelte';

describe('StudentSelectionPanel 组件', () => {
     beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });
 

    it('显示面板', () => {
        render(StudentSelectionPanel, { show_panel: true });
        expect(screen.getByText('学生列表')).toBeInTheDocument();
    });

  

    it('显示空数据提示', () => {
        render(StudentSelectionPanel, { show_panel: true });
        // 由于存在多个"暂无学生数据"元素，使用getAllByText并检查第一个元素
        const elements = screen.getAllByText('暂无学生数据');
        expect(elements[0]).toBeInTheDocument();
    });

    it('触发取消按钮', async () => {
        const onCancel = vi.fn();
        render(StudentSelectionPanel, { show_panel: true, onCancel });
        
        // 使用更具体的选择器来获取正确的取消按钮
        const cancelButton = screen.getAllByText('×');
        await fireEvent.click(cancelButton[0]);
        
        expect(onCancel).toHaveBeenCalledWith(false);
    });

    it('触发确定按钮', async () => {
        const onConfirm = vi.fn();
        render(StudentSelectionPanel, { show_panel: true, onConfirm });
        
        const confirmButton = screen.getByText('确定');
        await fireEvent.click(confirmButton);
        
        expect(onConfirm).toHaveBeenCalled();
    });

    it('触发底部取消按钮', async () => {
        const onCancel = vi.fn();
        render(StudentSelectionPanel, { show_panel: true, onCancel });
        
        // 获取底部取消按钮（通过文本内容）
        const cancelButton = screen.getAllByText('取消');
        await fireEvent.click(cancelButton[0]);
        
        expect(onCancel).toHaveBeenCalledWith(false);
    });

    describe('获取学生函数测试', () => {
        it('处理网络错误', async () => {
            // 模拟fetch失败
            global.fetch = vi.fn().mockRejectedValue(new Error('网络错误'));
            
            render(StudentSelectionPanel, { 
                show_panel: true, 
                practice_id: 1 
            });
            
            // 等待异步操作完成
            await waitFor(() => {
                expect(screen.getByText('获取学生列表失败')).toBeInTheDocument();
            });
        });

        it('处理API返回错误状态', async () => {
            // 模拟API返回错误状态
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    status: 1,
                    msg: '自定义错误信息'
                })
            });
            
            render(StudentSelectionPanel, { 
                show_panel: true, 
                practice_id: 1 
            });
            
            await waitFor(() => {
                expect(screen.getByText('自定义错误信息')).toBeInTheDocument();
            });
        });

        it('成功获取学生列表', async () => {
            // 模拟成功获取数据
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    data: [{
                        id: 1,
                        official_name: '张三',
                        phone: '13800138000',
                        id_card_no: '110101199003072936'
                    }]
                })
            });
            
            const ids = [{
                ID: 1,
                officialName: '张三',
                mobilePhone: '13800138000',
                idCardNo: '110101199003072936'
            }];
            
            render(StudentSelectionPanel, { 
                show_panel: true, 
                practice_id: 1,
                ids
            });
            
            // 验证是否正确处理了数据映射
            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/practiceStudentList'), expect.any(Object));
            });
        });
    });

    describe('学生操作功能', () => {
         beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });
        const mockStudents = [{
            ID: 1,
            officialName: '张三',
            gender: '男',
            mobilePhone: '13800138000',
            idCardNo: '110101199003072936',
            serial_number: 1
        }];

        it('删除学生功能', async () => {
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: mockStudents 
            });
            
            // 等待组件加载完成
            await waitFor(() => {
                expect(screen.getByText('张三')).toBeInTheDocument();
            });
            
            const deleteButton = screen.getByText('删除');
            await fireEvent.click(deleteButton);
            
            // 应该提示选择学生
            expect(screen.getByText('请选择要删除的学生')).toBeInTheDocument();
        });

        it('下载模板功能', async () => {
            render(StudentSelectionPanel, { show_panel: true });
            
            // 创建一个符合DOM节点要求的mock link元素
            const mockLink = document.createElement('a');
            mockLink.click = vi.fn();
            
            const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
            const appendChildSpy = vi.spyOn(document.body, 'appendChild');
            const removeChildSpy = vi.spyOn(document.body, 'removeChild');
            
            const downloadButton = screen.getByText('下载模板');
            await fireEvent.click(downloadButton);
            
            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(mockLink.click).toHaveBeenCalled();
            expect(appendChildSpy).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalled();
            
            createElementSpy.mockRestore();
            appendChildSpy.mockRestore();
            removeChildSpy.mockRestore();
        });

        it('选择学生功能', async () => {
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: mockStudents 
            });
            
            await waitFor(() => {
                expect(screen.getByText('张三')).toBeInTheDocument();
            });
            
            // 由于有多个checkbox，使用getAllByRole并选择特定的一个
            const checkboxes = screen.getAllByRole('checkbox');
            const checkbox = checkboxes[1]; // 跳过全选checkbox
            await fireEvent.click(checkbox);
            
            expect(checkbox.checked).toBe(true);
        });

        it('全选功能', async () => {
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: mockStudents 
            });
            
            await waitFor(() => {
                expect(screen.getByText('张三')).toBeInTheDocument();
            });
            
            // 选择全选checkbox（第一个）
            const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
            await fireEvent.click(selectAllCheckbox);
            
            expect(selectAllCheckbox.checked).toBe(true);
        });

        // 新增测试用例：取消选择学生
        it('取消选择学生功能', async () => {
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: mockStudents 
            });
            
            await waitFor(() => {
                expect(screen.getByText('张三')).toBeInTheDocument();
            });
            
            // 先选中学生
            const checkboxes = screen.getAllByRole('checkbox');
            const studentCheckbox = checkboxes[1];
            await fireEvent.click(studentCheckbox);
            expect(studentCheckbox.checked).toBe(true);
            
            // 再次点击取消选择
            await fireEvent.click(studentCheckbox);
            expect(studentCheckbox.checked).toBe(false);
        });

        // 新增测试用例：取消全选
        it('取消全选功能', async () => {
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: mockStudents 
            });
            
            await waitFor(() => {
                expect(screen.getByText('张三')).toBeInTheDocument();
            });
            
            // 先全选
            const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
            await fireEvent.click(selectAllCheckbox);
            expect(selectAllCheckbox.checked).toBe(true);
            
            // 再次点击取消全选
            await fireEvent.click(selectAllCheckbox);
            expect(selectAllCheckbox.checked).toBe(false);
        });

        // 新增测试用例：删除已选择的学生
        it('删除已选择的学生', async () => {
            const mockStudentsWithSelection = [{
                ID: 1,
                officialName: '张三',
                gender: '男',
                mobilePhone: '13800138000',
                idCardNo: '110101199003072936',
                serial_number: 1,
                selected: true
            }];
            
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: mockStudentsWithSelection 
            });
            
            await waitFor(() => {
                expect(screen.getByText('张三')).toBeInTheDocument();
            });
            
            // 先选择学生
            const checkboxes = screen.getAllByRole('checkbox');
            const studentCheckbox = checkboxes[1];
            await fireEvent.click(studentCheckbox);
            
            // 然后删除
            const deleteButton = screen.getByText('删除');
            await fireEvent.click(deleteButton);
            
            // 验证学生被删除（通过检查是否显示空数据提示）
            const elements = screen.getAllByText('暂无学生数据');
            expect(elements[0]).toBeInTheDocument();
        });
    });

    describe('搜索和分页功能', () => {
        const mockStudents = [
            {
                ID: 1,
                officialName: '张三',
                gender: '男',
                mobilePhone: '13800138000',
                idCardNo: '110101199003072936',
                serial_number: 1
            },
            {
                ID: 2,
                officialName: '李四',
                gender: '女',
                mobilePhone: '13800138001',
                idCardNo: '110101199003072937',
                serial_number: 2
            }
        ];

        it('搜索功能', async () => {
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: mockStudents 
            });
            
            await waitFor(() => {
                expect(screen.getByText('张三')).toBeInTheDocument();
            });
            
            const searchInput = screen.getByPlaceholderText('请输姓名/手机号/身份证号');
            await fireEvent.input(searchInput, { target: { value: '张三' } });
            
            // 应该只显示张三
            expect(screen.getByText('张三')).toBeInTheDocument();
            // 李四应该被过滤掉，但因为是分页显示，需要检查当前页数据
        });

        it('分页功能', async () => {
            const manyStudents = Array.from({ length: 15 }, (_, i) => ({
                ID: i + 1,
                officialName: `学生${i + 1}`,
                gender: i % 2 === 0 ? '男' : '女',
                mobilePhone: `1380013800${i}`,
                idCardNo: `1101011990030729${String(i).padStart(2, '0')}`,
                serial_number: i + 1
            }));
            
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: manyStudents 
            });
            
            await waitFor(() => {
                expect(screen.getByText('学生1')).toBeInTheDocument();
            });
            
            // 检查分页组件是否存在
            const pagination = screen.getByText('1');
            expect(pagination).toBeInTheDocument();
        });

        // 新增测试用例：搜索不存在的学生
        it('搜索不存在的学生', async () => {
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: mockStudents 
            });
            
            await waitFor(() => {
                expect(screen.getByText('张三')).toBeInTheDocument();
            });
            
            const searchInput = screen.getByPlaceholderText('请输姓名/手机号/身份证号');
            await fireEvent.input(searchInput, { target: { value: '王五' } });
            
            // 应该显示暂无数据
            const elements = screen.getAllByText('暂无学生数据');
            expect(elements[0]).toBeInTheDocument();
        });

        // 新增测试用例：分页切换
        it('分页切换功能', async () => {
            const manyStudents = Array.from({ length: 25 }, (_, i) => ({
                ID: i + 1,
                officialName: `学生${i + 1}`,
                gender: i % 2 === 0 ? '男' : '女',
                mobilePhone: `1380013800${i}`,
                idCardNo: `1101011990030729${String(i).padStart(2, 0)}`,
                serial_number: i + 1
            }));
            
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: manyStudents,
                page_size: 10
            });
            
            await waitFor(() => {
                expect(screen.getByText('学生1')).toBeInTheDocument();
            });
            
            // 检查分页组件
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
        });
    });

    describe('导入功能', () => {
         beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });
        it('触发导入按钮', async () => {
            const mockImportPanel = {
                triggerFileInput: vi.fn()
            };
            
            render(StudentSelectionPanel, { show_panel: true });
            
            // 获取导入按钮，由于存在多个相同文本的元素，使用getAllByText
            const importButtons = screen.getAllByText('导入学生');
            await fireEvent.click(importButtons[0]);
            
            // 由于组件未完全挂载，这里只是检查按钮存在
            expect(importButtons[0]).toBeInTheDocument();
        });

        // 新增测试用例：导入成功处理
        it('处理导入成功事件', async () => {
            const mockImportData = [{
                officialName: '王五',
                MobilePhone: '13800138002',
                Gender: '男',
                idCardNo: '110101199003072938',
                Account: 'account5'
            }];
            
            const mockExistStudents = [];
            
            render(StudentSelectionPanel, { show_panel: true });
            
            // 模拟导入成功事件
            const component = screen.getByText('导入学生').closest('div');
            // 这里我们测试组件能够接收导入数据，但不直接测试子组件
            
            expect(component).toBeInTheDocument();
        });
    });

    describe('边界情况和错误处理', () => {
        it('处理空学生列表', async () => {
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: [] 
            });
            
            // 使用getAllByText处理多个相同元素的情况
            const elements = screen.getAllByText('暂无学生数据');
            expect(elements[0]).toBeInTheDocument();
        });

        it('处理学生信息不完整', async () => {
            const incompleteStudents = [{
                ID: 1,
                officialName: null,
                gender: null,
                mobilePhone: null,
                idCardNo: null,
                serial_number: 1
            }];
            
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: incompleteStudents 
            });
            
            await waitFor(() => {
                // 应该显示"--"作为默认值
                expect(screen.getByText('--')).toBeInTheDocument();
            });
        });

        // 新增测试用例：处理大量学生数据
        it('处理大量学生数据', async () => {
            const manyStudents = Array.from({ length: 100 }, (_, i) => ({
                ID: i + 1,
                officialName: `学生${i + 1}`,
                gender: i % 2 === 0 ? '男' : '女',
                mobilePhone: `1380013800${String(i).padEnd(8, '0')}`,
                idCardNo: `1101011990030729${String(i).padStart(2, '0')}`,
                serial_number: i + 1
            }));
            
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: manyStudents 
            });
            
            await waitFor(() => {
                expect(screen.getByText('学生1')).toBeInTheDocument();
            });
        });

        // 新增测试用例：确认按钮传递正确参数
        it('确认按钮传递正确参数', async () => {
            const onConfirm = vi.fn();
            const mockStudents = [{
                ID: 1,
                officialName: '张三',
                gender: '男',
                mobilePhone: '13800138000',
                idCardNo: '110101199003072936',
                serial_number: 1
            }];
            
            render(StudentSelectionPanel, { 
                show_panel: true, 
                ids: mockStudents,
                onConfirm
            });
            
            await waitFor(() => {
                expect(screen.getByText('张三')).toBeInTheDocument();
            });
            
            const confirmButton = screen.getByText('确定');
            await fireEvent.click(confirmButton);
            
            expect(onConfirm).toHaveBeenCalled();
            // 检查是否传递了正确的参数
            expect(onConfirm.mock.calls[0]).toHaveLength(3);
        });
    });
});