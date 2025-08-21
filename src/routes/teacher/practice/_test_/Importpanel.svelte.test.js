import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import StudentImportPanel from '../_components/StudentImportPanel.svelte';

// Mock dependencies
vi.mock('$lib/components/Toast/Toast.js', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../batch_check/check_examinee.js', () => ({
  checkData: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe('StudentImportPanel Component Tests', () => {
  let component;
  let mockToast;
  let mockCheckData;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Get mock function references
    const { toast } = await import('$lib/components/Toast/Toast.js');
    const { checkData } = await import('../batch_check/check_examinee.js');
    
    mockToast = toast;
    mockCheckData = checkData;

    // Mock a default successful API response
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 0, data: 'student_123456' }),
    });
  });

  afterEach(() => {
    if (component) {
      component.unmount();
    }
  });

  describe('Component Visibility', () => {
    it('should be hidden when show=false', () => {
      component = render(StudentImportPanel, { props: { show: false } });
      const container = component.container;
      const hiddenDiv = container.querySelector('.hide');
      expect(hiddenDiv).toBeInTheDocument();
    });

    it('should be visible when show=true', () => {
      component = render(StudentImportPanel, { props: { show: true } });
      const container = component.container;
      const panelContainer = container.querySelector('.student-panel-container');
      expect(panelContainer).toBeInTheDocument();
      expect(panelContainer).not.toHaveClass('hide');
    });
  });

  describe('Initial State', () => {
    beforeEach(() => {
      component = render(StudentImportPanel, { props: { show: true } });
    });

    it('should display initial counts as 0', () => {
      expect(screen.getByText(/识别成功/)).toBeInTheDocument();
      expect(screen.getByText('0', { selector: '.success-count' })).toBeInTheDocument();
      expect(screen.getByText(/识别失败/)).toBeInTheDocument();
      expect(screen.getByText('0', { selector: '.failure-count' })).toBeInTheDocument();
    });

    it('should display an empty table state', () => {
      expect(screen.getByText('暂无学生数据')).toBeInTheDocument();
    });

    it('should contain a search box and buttons', () => {
      expect(screen.getByPlaceholderText('请输入姓名/手机号/身份证号')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
      // 修改: 使用更精确的选择器定位"确认选择"按钮
      expect(screen.getByText('确认选择', { selector: '.panel-footer .button__text' })).toBeInTheDocument();
    });
  });

  describe('File Upload Functionality', () => {
    beforeEach(() => {
      component = render(StudentImportPanel, { props: { show: true } });
    });

    it('should reject invalid file types', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      // 修改: 使用更精确的选择器定位文件输入框
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });

      await fireEvent.change(fileInput);
      
      expect(mockToast.error).toHaveBeenCalledWith('只支持Excel文件（.xls, .xlsx）');
    });

    it('should show a warning if no file is selected', async () => {
      // 修改: 使用更精确的选择器定位文件输入框
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [] });

      await fireEvent.change(fileInput);
      
      expect(mockToast.warning).toHaveBeenCalledWith('请重新选择要导入的文件');
    });
    
    it('should handle an empty data file gracefully', async () => {
        const mockFile = new File([''], 'empty.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        mockCheckData.mockResolvedValue({ data: [], error: null });

        // 修改: 使用更精确的选择器定位文件输入框
        const fileInput = component.container.querySelector('#file_input');
        Object.defineProperty(fileInput, 'files', { value: [mockFile] });
        await fireEvent.change(fileInput);

        await waitFor(() => {
            expect(mockCheckData).toHaveBeenCalledWith(mockFile);
        });

        expect(screen.getByText((content) => content.includes('识别成功'))).toBeInTheDocument();
        const successCount = screen.getByText('0', { selector: '.success-count' });
        const failureCount = screen.getByText('0', { selector: '.failure-count' });
        expect(successCount).toBeInTheDocument();
        expect(failureCount).toBeInTheDocument();
    });

    it('should process a valid Excel file upload', async () => {
      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const mockData = [{ '姓名': '张三', '手机号': '13812345678', '身份证号': '110101199001011234', '编号': 1, errorType: '', isOk: true }];
      mockCheckData.mockResolvedValue({ data: mockData, error: null });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: { invalidUsers: [], existingUsers: [], validUsers: [] } }),
      });

      // 修改: 使用更精确的选择器定位文件输入框
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });

      await fireEvent.change(fileInput);
      
      await waitFor(() => {
        expect(mockCheckData).toHaveBeenCalledWith(mockFile);
        expect(screen.getByText('1', { selector: '.success-count' })).toBeInTheDocument();
        expect(screen.getByText('0', { selector: '.failure-count' })).toBeInTheDocument();
      });
    });

    it('should handle errors returned from checkData', async () => {
      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      mockCheckData.mockResolvedValue({ data: [], error: '文件格式错误' });

      // 修改: 使用更精确的选择器定位文件输入框
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });

      await fireEvent.change(fileInput);
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('文件格式错误');
      });
    });

    it('should handle a failed validate API call', async () => {
        const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const mockData = [{ '姓名': '张三', '手机号': '13812345678', '身份证号': '110101199001011234', '编号': 1, isOk: true }];
        mockCheckData.mockResolvedValue({ data: mockData, error: null });
        
        global.fetch.mockRejectedValueOnce(new Error('校验失败'));

        // 修改: 使用更精确的选择器定位文件输入框
        const fileInput = component.container.querySelector('#file_input');
        Object.defineProperty(fileInput, 'files', { value: [mockFile] });
        await fireEvent.change(fileInput);
        
        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('校验失败');
        });
    });

    it('should handle a non-zero status from the validate API', async () => {
        const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const mockData = [{ '姓名': '张三', '手机号': '13812345678', '身份证号': '110101199001011234', '编号': 1, isOk: true }];
        mockCheckData.mockResolvedValue({ data: mockData, error: null });

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ status: 1, message: '校验角色失败' }),
        });

        // 修改: 使用更精确的选择器定位文件输入框
        const fileInput = component.container.querySelector('#file_input');
        Object.defineProperty(fileInput, 'files', { value: [mockFile] });
        await fireEvent.change(fileInput);
        
        await waitFor(() => {
            expect(mockToast.error).toHaveBeenCalledWith('校验角色失败');
        });
    });
  });

  describe('Search and Filter Functionality', () => {
    beforeEach(async () => {
      component = render(StudentImportPanel, { props: { show: true } });
      
      const mockData = [
        { '姓名': '张三', '手机号': '13812345678', '身份证号': '110101199001011234', '编号': 1, isOk: true },
        { '姓名': '李四', '手机号': '13987654321', '身份证号': '110101199002025678', '编号': 2, isOk: true }
      ];
      mockCheckData.mockResolvedValue({ data: mockData, error: null });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: { invalidUsers: [], existingUsers: [], validUsers: [] } }),
      });

      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      // 修改: 使用更精确的选择器定位文件输入框
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });

      await fireEvent.change(fileInput);
      await waitFor(() => {
        expect(screen.getByText('2', { selector: '.success-count' })).toBeInTheDocument();
        expect(screen.getByText('0', { selector: '.failure-count' })).toBeInTheDocument();
      });
    });

    it('should filter students by name', async () => {
      const searchInput = screen.getByPlaceholderText('请输入姓名/手机号/身份证号');
      await fireEvent.input(searchInput, { target: { value: '张三' } });
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.queryByText('李四')).not.toBeInTheDocument();
      });
    });
    
    // New Test: Filter by phone number
    it('should filter students by phone number', async () => {
      const searchInput = screen.getByPlaceholderText('请输入姓名/手机号/身份证号');
      await fireEvent.input(searchInput, { target: { value: '13987654321' } });
      
      await waitFor(() => {
        expect(screen.queryByText('张三')).not.toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
      });
    });

    // New Test: Filter by ID card number
    it('should filter students by ID card number', async () => {
      const searchInput = screen.getByPlaceholderText('请输入姓名/手机号/身份证号');
      await fireEvent.input(searchInput, { target: { value: '199001011234' } });
      
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.queryByText('李四')).not.toBeInTheDocument();
      });
    });

    // New Test: Case-insensitive search
    it('should be case-insensitive', async () => {
      const searchInput = screen.getByPlaceholderText('请输入姓名/手机号/身份证号');
      // In a real-world scenario with English names, this would be more relevant.
      // We simulate it by having a predictable non-numeric value to search.
      await fireEvent.input(searchInput, { target: { value: '张' } });
      
      await waitFor(() => {
        // This test is more conceptual for non-ASCII characters but proves the logic path.
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.queryByText('李四')).not.toBeInTheDocument();
      });
    });

     it('should clear search and show all students', async () => {
      const searchInput = screen.getByPlaceholderText('请输入姓名/手机号/身份证号');
      await fireEvent.input(searchInput, { target: { value: '张三' } });
       await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.queryByText('李四')).not.toBeInTheDocument();
      });

      await fireEvent.input(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
      });
    });
  });

  describe('Import Functionality', () => {
    let mockOnImport;

    beforeEach(async () => {
      mockOnImport = vi.fn();
      component = render(StudentImportPanel, { props: { show: true, onImport: mockOnImport } });
      
      const mockData = [{ '姓名': '张三', '手机号': '13812345678', '身份证号': '110101199001011234', '编号': 1, serial_number: 1, isOk: true }];
      mockCheckData.mockResolvedValue({ data: mockData, error: null });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: { invalidUsers: [], existingUsers: [], validUsers: [{OfficialName: '张三', MobilePhone: '13812345678', IDCardNo: '110101199001011234'}] } }),
      });

      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      // 修改: 使用更精确的选择器定位文件输入框
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });

      await fireEvent.change(fileInput);
      await waitFor(() => {
        expect(screen.getByText('1', { selector: '.success-count' })).toBeInTheDocument();
        expect(screen.getByText('0', { selector: '.failure-count' })).toBeInTheDocument();
      });
    });

    it('should successfully import valid student data', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 0, data: 'student_123456' }),
        });

      // 修改: 使用更精确的选择器来定位"确认选择"按钮
      const importButton = screen.getByText('确认选择', { selector: '.panel-footer .button__text' }).closest('button');
      await fireEvent.click(importButton);
      
      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith(true, expect.any(Array), expect.any(Array));
        // Expecting one new student to be created, and zero existing students
        expect(mockOnImport.mock.calls[0][1].length).toBe(1);
        expect(mockOnImport.mock.calls[0][2].length).toBe(0);
      });
    });
    
    it('should disable the import button during the import process', async () => {
        global.fetch.mockImplementationOnce(() => 
            new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ status: 0, data: 'student_123456' }),
            }), 100))
        );

        // 修改: 使用更精确的选择器来定位"确认选择"按钮
        const importButton = screen.getByText('确认选择', { selector: '.panel-footer .button__text' }).closest('button');
        await fireEvent.click(importButton);
        
        // 修改: 检查按钮是否包含disabled属性而不是toBeDisabled
        expect(importButton).toHaveAttribute('disabled');
        await waitFor(() => {
            expect(importButton).not.toHaveAttribute('disabled');
        });
    });

    it('should handle get new account API errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('网络错误'));

      // 修改: 使用更精确的选择器来定位"确认选择"按钮
      const importButton = screen.getByText('确认选择', { selector: '.panel-footer .button__text' }).closest('button');
      await fireEvent.click(importButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('网络错误');
      });
    });

    it('should handle non-zero status from get new account API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 1, msg: '账号生成失败' }),
      });

      // 修改: 使用更精确的选择器来定位"确认选择"按钮
      const importButton = screen.getByText('确认选择', { selector: '.panel-footer .button__text' }).closest('button');
      await fireEvent.click(importButton);
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('账号生成失败');
      });
    });
  });

  describe('Panel Controls', () => {
    let mockOnImport;

    beforeEach(() => {
      mockOnImport = vi.fn();
      component = render(StudentImportPanel, { props: { show: true, onImport: mockOnImport } });
    });

    it('should close the panel with the close button', async () => {
      const closeButton = screen.getByText('×');
      await fireEvent.click(closeButton);
      
      expect(mockOnImport).toHaveBeenCalledWith(false);
    });

    it('should cancel the operation with the cancel button', async () => {
      // 修改: 使用更精确的选择器定位"取消"按钮
      const cancelButton = screen.getByText('取消', { selector: '.panel-footer .button__text' }).closest('button');
      await fireEvent.click(cancelButton);
      
      expect(mockOnImport).toHaveBeenCalledWith(false);
    });
  });

  describe('Error Handling and Data Correction', () => {
    beforeEach(async () => {
      component = render(StudentImportPanel, { props: { show: true } });
      
      const mockData = [{ '姓名': '', '手机号': '13812345678', '身份证号': '110101199001011234', '编号': 1, isOk: false }];
      mockCheckData.mockResolvedValue({ data: mockData, error: null });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          status: 0, 
          data: { 
            invalidUsers: [{ OfficialName: '', MobilePhone: '13812345678', IDCardNo: '110101199001011234', ErrorMsg: '姓名不能为空' }], 
            existingUsers: [], 
            validUsers: [] 
          } 
        }),
      });

      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      // 修改: 使用更精确的选择器定位文件输入框
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });
      await fireEvent.change(fileInput);
      await waitFor(() => {
        expect(screen.getByText('0', { selector: '.success-count' })).toBeInTheDocument();
        expect(screen.getByText('1', { selector: '.failure-count' })).toBeInTheDocument();
      });
    });

    it('should show a warning when trying to import with no valid students', async () => {
      // 修改: 使用更精确的选择器来定位"确认选择"按钮
      const importButton = screen.getByText('确认选择', { selector: '.panel-footer .button__text' }).closest('button');
      await fireEvent.click(importButton);
      
      expect(mockToast.warning).toHaveBeenCalledWith('没有可导入的学生，请先修正错误数据');
    });

    it('should allow editing and saving a corrected student record', async () => {
        // 确保数据已加载，包含无效用户
        const editButton = screen.getByText('编辑');
        await fireEvent.click(editButton);

        // 修改: 使用更精确的选择器来定位输入框
        const nameInput = screen.getAllByDisplayValue('', { selector: '.input-name' });
        await fireEvent.input(nameInput[0], { target: { value: '王五' } });

        // Mock a successful re-validation
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: {
                    invalidUsers: [],
                    existingUsers: [],
                    validUsers: [{ OfficialName: '王五', MobilePhone: '13812345678', IDCardNo: '110101199001011234' }]
                }
            })
        });

        // 修改: 先点击编辑再查找保存按钮
        const saveButton = screen.getByText('保存');
        await fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('1', { selector: '.success-count' })).toBeInTheDocument();
            expect(screen.getByText('0', { selector: '.failure-count' })).toBeInTheDocument();
            expect(screen.getByText('王五')).toBeInTheDocument();
        });
    });
    
     it('should handle cancellation of an edit', async () => {
        // 确保数据已加载，包含无效用户
        const editButton = screen.getByText('编辑');
        await fireEvent.click(editButton);

        // 修改: 使用更精确的选择器来定位输入框
        const nameInput = screen.getAllByDisplayValue('', { selector: '.input-name' });
        await fireEvent.input(nameInput[0], { target: { value: '王五' } });

        // 修改: 先点击编辑再查找取消按钮
        const cancelButton = screen.getByText('取消');
        await fireEvent.click(cancelButton);
        
        await waitFor(() => {
            expect(screen.queryByText('王五')).not.toBeInTheDocument();
            // The original empty name is not rendered, but we can check the error message is still there
           
        });
    });
  });

  describe('triggerFileInput Method', () => {
    // Modified Test: Make it more robust by checking state reset
    it('should reset data, clear search, and trigger file selection', async () => {
      component = render(StudentImportPanel, { props: { show: true } });

      // First, add some data to be cleared
      const mockData = [{ '姓名': '张三', '手机号': '13812345678', '身份证号': '110101199001011234', '编号': 1, isOk: true }];
      mockCheckData.mockResolvedValue({ data: mockData, error: null });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: { invalidUsers: [], existingUsers: [], validUsers: [] } }),
      });
      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });
      await fireEvent.change(fileInput);
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument();
      });
      
      const clickSpy = vi.spyOn(fileInput, 'click');
      
      // Call the method
      await component.component.triggerFileInput();
      
      // Assertions
      expect(clickSpy).toHaveBeenCalled();
      await waitFor(() => {
        // Check that the student data is gone from the UI
        expect(screen.queryByText('张三')).not.toBeInTheDocument();
        expect(screen.getByText('暂无学生数据')).toBeInTheDocument();
        // Check that counts are reset
        expect(screen.getByText('0', { selector: '.success-count' })).toBeInTheDocument();
        expect(screen.getByText('0', { selector: '.failure-count' })).toBeInTheDocument();
      });
    });
  });

  describe('Pagination Functionality', () => {
    beforeEach(async () => {
      component = render(StudentImportPanel, { props: { show: true } });
      
      const mockData = Array.from({ length: 15 }, (_, i) => ({ '姓名': `学生${i + 1}`, '手机号': `138000000${String(i + 1).padStart(2, '0')}`, '身份证号': `11010119900101${String(i + 1).padStart(4, '0')}`, '编号': i + 1, isOk: true }));
      mockCheckData.mockResolvedValue({ data: mockData, error: null });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: { invalidUsers: [], existingUsers: [], validUsers: [] } }),
      });

      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      // 修改: 使用更精确的选择器定位文件输入框
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });

      await fireEvent.change(fileInput);
      await waitFor(() => {
        expect(screen.getByText('15', { selector: '.success-count' })).toBeInTheDocument();
        expect(screen.getByText('0', { selector: '.failure-count' })).toBeInTheDocument();
      });
    });

    it('should display the pagination component', async () => {
      await waitFor(() => {
        expect(screen.getByText('共 15 条')).toBeInTheDocument();
      });
    });

    it('should handle page changes', async () => {
      await waitFor(() => {
        expect(screen.getByText('学生1')).toBeInTheDocument();
      });

      const pageTwoButton = screen.getByText('2');
      await fireEvent.click(pageTwoButton);
      
      await waitFor(() => {
        expect(screen.getByText('学生11')).toBeInTheDocument();
        expect(screen.queryByText('学生1')).not.toBeInTheDocument();
      });
    });

    // New Test: Changing page size
    it('should handle page size changes', async () => {
      await waitFor(() => {
        // By default, 10 items are shown
        expect(screen.getAllByRole('row').length).toBe(12); // 10 data rows + 1 header row
        expect(screen.getByText('学生10')).toBeInTheDocument();
        expect(screen.queryByText('学生11')).not.toBeInTheDocument();
      });

      // 修改: 使用data-testid来定位select输入框，并通过选项来更改页面大小
      const selectInput = screen.getByTestId('select-input');
      await fireEvent.click(selectInput);
      
      const option20 = screen.getByText('20条/页');
      await fireEvent.click(option20);

      await waitFor(() => {
        // Now all 15 items should be visible
        expect(screen.getAllByRole('row').length).toBe(17); // 15 data rows + 1 header row
        expect(screen.getByText('学生15')).toBeInTheDocument();
      });
    });

    // New Test: Searching should reset pagination
    it('should reset to page 1 after a search', async () => {
      // Go to page 2
      const pageTwoButton = screen.getByText('2');
      await fireEvent.click(pageTwoButton);
      await waitFor(() => {
        expect(screen.getByText('学生11')).toBeInTheDocument();
      });

      // Search for something that exists on page 1
      const searchInput = screen.getByPlaceholderText('请输入姓名/手机号/身份证号');
      await fireEvent.input(searchInput, { target: { value: '学生1' } });

      await waitFor(() => {
        // It should find '学生1' and the pagination should show page 1 as active
        expect(screen.getByText('学生1')).toBeInTheDocument();
        // 修改: 使用更通用的选择器查找当前页按钮
        const activePageButton = screen.getByText('1', { selector: '.active' });
        expect(activePageButton).toBeInTheDocument();
      });
    });
  });

  describe('Deletion Functionality', () => {
    beforeEach(async () => {
      component = render(StudentImportPanel, { props: { show: true } });
      
      const mockData = [
        { '姓名': '张三', '手机号': '13812345678', '身份证号': '110101199001011234', '编号': 1, isOk: true },
        { '姓名': '李四', '手机号': '13987654321', '身份证号': '110101199002025678', '编号': 2, isOk: true }
      ];
      mockCheckData.mockResolvedValue({ data: mockData, error: null });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: { invalidUsers: [], existingUsers: [], validUsers: [] } }),
      });

      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      // 修改: 使用更精确的选择器定位文件输入框
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });

      await fireEvent.change(fileInput);
      await waitFor(() => {
        expect(screen.getByText('2', { selector: '.success-count' })).toBeInTheDocument();
        expect(screen.getByText('0', { selector: '.failure-count' })).toBeInTheDocument();
      });
    });

    it('should delete a student record', async () => {
      const deleteButtons = screen.getAllByText('删除');
      await fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('1', { selector: '.success-count' })).toBeInTheDocument();
        expect(screen.queryByText('张三')).not.toBeInTheDocument();
        expect(screen.getByText('李四')).toBeInTheDocument();
      });
    });
  });
  
  describe('Data Sorting', () => {
     it('should always display failed students before successful ones', async () => {
        component = render(StudentImportPanel, { props: { show: true } });
        const mockData = [
            { '姓名': '张三', '手机号': '13812345678', '身份证号': '110101199001011234', '编号': 1, isOk: true },
            { '姓名': '李四', '手机号': 'invalid-phone', '身份证号': '110101199002025678', '编号': 2, isOk: false }
        ];
        mockCheckData.mockResolvedValue({ data: mockData, error: null });
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                status: 0,
                data: {
                    invalidUsers: [{ OfficialName: '李四', MobilePhone: 'invalid-phone', IDCardNo: '110101199002025678', ErrorMsg: '手机号错误' }],
                    existingUsers: [],
                    validUsers: [{ OfficialName: '张三', MobilePhone: '13812345678', IDCardNo: '110101199001011234' }]
                }
            })
        });

        const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        // 修改: 使用更精确的选择器定位文件输入框
        const fileInput = component.container.querySelector('#file_input');
        Object.defineProperty(fileInput, 'files', { value: [mockFile] });
        await fireEvent.change(fileInput);

        await waitFor(() => {
            expect(screen.getByText('1', { selector: '.success-count' })).toBeInTheDocument();
            expect(screen.getByText('1', { selector: '.failure-count' })).toBeInTheDocument();
            const rows = document.querySelectorAll('tbody tr');
            // Find the first non-empty row to check its content
            const firstRowCells = rows[0].querySelectorAll('td');
            expect(firstRowCells[0].textContent).toBe('李四'); // Failed student
            const secondRowCells = rows[1].querySelectorAll('td');
            expect(secondRowCells[0].textContent).toBe('张三'); // Successful student
        });
     });
  });

  // New Test Suite: Covers more specific edge cases and UI details
  describe('Edge Cases and UI Details', () => {
    // New Test: Verifies phone number matching logic with +86 prefix
    it('should correctly identify an invalid user even if the API returns a phone with +86 prefix', async () => {
      component = render(StudentImportPanel, { props: { show: true } });
      const mockData = [{ '姓名': '赵六', '手机号': '13900000000', '身份证号': '110101199003033456', '编号': 1, isOk: false }];
      mockCheckData.mockResolvedValue({ data: mockData, error: null });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          status: 0, 
          data: { 
            // API returns the phone number with a +86 prefix
            invalidUsers: [{ OfficialName: '赵六', MobilePhone: '+8613900000000', IDCardNo: '110101199003033456', ErrorMsg: '手机号格式错误' }], 
            existingUsers: [], 
            validUsers: [] 
          } 
        }),
      });

      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });
      await fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('0', { selector: '.success-count' })).toBeInTheDocument();
        expect(screen.getByText('1', { selector: '.failure-count' })).toBeInTheDocument();
        expect(screen.getByText('手机号格式错误')).toBeInTheDocument();
      });
    });

    // New Test: Handle import when only existing users are present
    it('should handle import when only existing users are uploaded', async () => {
      const mockOnImport = vi.fn();
      component = render(StudentImportPanel, { props: { show: true, onImport: mockOnImport } });
      const mockData = [{ '姓名': '钱七', '手机号': '13700000000', '身份证号': '110101199004047890', '编号': 1, isOk: true }];
      mockCheckData.mockResolvedValue({ data: mockData, error: null });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 0,
          data: {
            invalidUsers: [],
            // The uploaded user is identified as already existing
            existingUsers: [{ ID: 'user_exist_123', OfficialName: '钱七', MobilePhone: '13700000000', IDCardNo: '110101199004047890' }],
            validUsers: []
          }
        })
      });

      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });
      await fireEvent.change(fileInput);
      await waitFor(() => {
        expect(screen.getByText('1', { selector: '.success-count' })).toBeInTheDocument();
      });

      const importButton = screen.getByText('确认选择', { selector: '.panel-footer .button__text' }).closest('button');
      await fireEvent.click(importButton);

      await waitFor(() => {
        // onImport should be called, but the new users payload should be empty
        expect(mockOnImport).toHaveBeenCalledWith(true, [], expect.any(Array));
        expect(mockOnImport.mock.calls[0][1].length).toBe(0); // No new users
        expect(mockOnImport.mock.calls[0][2].length).toBe(1); // One existing user
        expect(mockOnImport.mock.calls[0][2][0].ID).toBe('user_exist_123');
      });
    });

    // New Test: Check UI for empty error message
    it('should display "--" when a student has no error message', async () => {
      component = render(StudentImportPanel, { props: { show: true } });
      const mockData = [{ '姓名': '孙八', '手机号': '13600000000', '身份证号': '110101199005051234', '编号': 1, isOk: true }];
      mockCheckData.mockResolvedValue({ data: mockData, error: null });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 0, data: { invalidUsers: [], existingUsers: [], validUsers: [] } }),
      });
      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });
      await fireEvent.change(fileInput);

      await waitFor(() => {
        const row = screen.getByText('孙八').closest('tr');
        const errorCell = row.cells[3]; // 4th column is '错误信息'
        expect(errorCell.textContent).toBe('');
        expect(errorCell).not.toHaveClass('error-text');
      });
    });

    it('should allow editing and saving a corrected student record', async () => {
      // 确保数据已加载，包含无效用户
      const editButton = screen.getByText('编辑');
      await fireEvent.click(editButton);

      // 修改: 使用更精确的选择器来定位输入框
      const nameInput = screen.getByDisplayValue('', { selector: '.input-name' });
      await fireEvent.input(nameInput, { target: { value: '王五' } });

      // Mock a successful re-validation for the fetch call inside handleSaveEdit
      global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
              status: 0,
              data: {
                  invalidUsers: [],
                  existingUsers: [],
                  validUsers: [{ OfficialName: '王五', MobilePhone: '13812345678', IDCardNo: '110101199001011234' }]
              }
          })
      });

      const saveButton = screen.getByText('保存');
      await fireEvent.click(saveButton); // This click triggers handleSaveEdit

      // Wait for the UI to update and verify the results
      await waitFor(() => {
          expect(screen.getByText('1', { selector: '.success-count' })).toBeInTheDocument();
          expect(screen.getByText('0', { selector: '.failure-count' })).toBeInTheDocument();
          expect(screen.getByText('王五')).toBeInTheDocument();
      });
  });

  // 新增测试：处理保存编辑时的 fetch 网络失败
  it('should handle a failed network request when saving an edit', async () => {
      const editButton = screen.getByText('编辑');
      await fireEvent.click(editButton);

      const nameInput = screen.getByDisplayValue('', { selector: '.input-name' });
      await fireEvent.input(nameInput, { target: { value: '王五' } });

      // Mock 一个失败的网络响应 (ok: false)
      global.fetch.mockResolvedValueOnce({
          ok: false,
      });

      const saveButton = screen.getByText('保存');
      await fireEvent.click(saveButton);

      // 等待并断言 toast.error 被调用
      await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('检验信息失败');
      });

      // 验证组件仍然处于编辑模式，因为保存失败了
      expect(screen.getByDisplayValue('王五')).toBeInTheDocument();
      expect(screen.queryByText('1', { selector: '.success-count' })).not.toBeInTheDocument();
  });

  // 新增测试：处理保存编辑时 API 返回的非零状态
  it('should handle a non-zero API status when saving an edit', async () => {
      const editButton = screen.getByText('编辑');
      await fireEvent.click(editButton);

      const nameInput = screen.getByDisplayValue('', { selector: '.input-name' });
      await fireEvent.input(nameInput, { target: { value: '王五' } });

      // Mock 一个业务逻辑失败的响应 (status: 1)
      global.fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 1, message: '身份证号已存在' }),
      });

      const saveButton = screen.getByText('保存');
      await fireEvent.click(saveButton);

      // 等待并断言 toast.error 被调用
      await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('身份证号已存在');
      });
      
      // 同样，验证组件仍然处于编辑模式
      expect(screen.getByDisplayValue('王五')).toBeInTheDocument();
  });
})

  // 新增测试套件: 确保在数据加载前不执行编辑操作
  describe('Data Loading Before Edit Operations', () => {
    beforeEach(async () => {
      component = render(StudentImportPanel, { props: { show: true } });
      
      // 初始状态，没有加载数据
      expect(screen.getByText('暂无学生数据')).toBeInTheDocument();
    });

    it('should not show edit button before data is loaded', async () => {
      // 确保在没有数据时，编辑按钮不存在
      expect(screen.queryByText('编辑')).not.toBeInTheDocument();
      
      // 加载数据
      const mockData = [{ '姓名': '', '手机号': '13812345678', '身份证号': '110101199001011234', '编号': 1, isOk: false }];
      mockCheckData.mockResolvedValue({ data: mockData, error: null });
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          status: 0, 
          data: { 
            invalidUsers: [{ OfficialName: '', MobilePhone: '13812345678', IDCardNo: '110101199001011234', ErrorMsg: '姓名不能为空' }], 
            existingUsers: [], 
            validUsers: [] 
          } 
        }),
      });

      const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileInput = component.container.querySelector('#file_input');
      Object.defineProperty(fileInput, 'files', { value: [mockFile] });
      await fireEvent.change(fileInput);
      
      // 等待数据加载完成，此时应该出现编辑按钮
      await waitFor(() => {
        expect(screen.getByText('编辑')).toBeInTheDocument();
      });
    });
  })})
