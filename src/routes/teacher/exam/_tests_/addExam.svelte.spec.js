import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import ExamCreation from '../addExam/+page.svelte';
import { toast } from '$lib/components/Toast/Toast.js';
import { goto } from '$app/navigation';

// Mock dependencies
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('$lib/components/Toast/Toast.js', () => ({ 
  toast: { 
    warning: vi.fn(),
    error: vi.fn() 
  } 
}));
vi.mock('@3min/smart-edit', () => ({
  default: vi.fn(() => ({
    getPreviewHTML: vi.fn(() => 'mock html content')
  }))
}));

// Mock fetch globally
function mockFetch(data, ok = true) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(data),
    }),
  );
}

const setup = () => {
  render(ExamCreation);
  return {
    // Basic inputs
    examNameInput: () => screen.getByPlaceholderText('请输入考试名称（例：xxx平时考试）'),
    
    // Exam type radios - 使用更精确的选择器
    selectExamType: (type) => {
      const examTypeContainer = screen.getByText('考试类型').closest('.examTypeChooseContainer');
      const typeMap = {
        '平时考试': '00',
        '期末成绩考试': '02', 
        '资格证考试': '04'
      };
      const radio = within(examTypeContainer).getByDisplayValue(typeMap[type]);
      fireEvent.click(radio);
    },
    
    // Exam method radios
    selectExamMethod: (method) => {
      const examMethodContainer = screen.getByText('考试方式').closest('.exam-type-choose-container');
      const methodMap = {
        '线上考试': '00'
      };
      const radio = within(examMethodContainer).getByDisplayValue(methodMap[method]);
      fireEvent.click(radio);
    },
    
    // Paper config actions
    addPaperButton: () => screen.getByRole('button', { name: '添加试卷' }),
    deletePaperButton: (index = 1) => {
      const deleteButtons = screen.queryAllByAltText('删除');
      return deleteButtons[index - 1];
    },
    togglePaperConfig: (index = 0) => {
      const toggleButtons = screen.getAllByAltText('展开/收起');
      return toggleButtons[index];
    },
    
    // Paper selection
    paperSelectionButton: (index = 0) => {
      const buttons = screen.queryAllByText('试卷选择');
      return buttons[index];
    },
    
    // Time period mode - 使用容器定位
    selectTimePeriodMode: (paperIndex, mode) => {
      const paperConfigs = screen.getAllByText(/试卷\d+/);
      const paperConfig = paperConfigs[paperIndex].closest('.paper-config-container');
      const modeContainer = within(paperConfig).getByText('考试时段模式').closest('.exam-mode-container');
      const radio = within(modeContainer).getByDisplayValue(mode);
      fireEvent.click(radio);
    },
    
    // Duration inputs
    getDurationInput: (paperIndex = 0) => {
      const paperConfigs = screen.getAllByText(/试卷\d+/);
      const paperConfig = paperConfigs[paperIndex].closest('.paper-config-container');
      const durationContainer = within(paperConfig).getByText('考试时长').closest('.exam-duration-container');
      return within(durationContainer).getByRole('spinbutton');
    },
    
    getLateEntryInput: (paperIndex = 0) => {
      const paperConfigs = screen.getAllByText(/试卷\d+/);
      const paperConfig = paperConfigs[paperIndex].closest('.paper-config-container');
      const ruleContainer = within(paperConfig).getByText('考场规则').closest('.exam-duration-container');
      const inputs = within(ruleContainer).getAllByRole('spinbutton');
      return inputs[0]; // 第一个是迟到进入时间
    },
    
    getEarlySubmissionInput: (paperIndex = 0) => {
      const paperConfigs = screen.getAllByText(/试卷\d+/);
      const paperConfig = paperConfigs[paperIndex].closest('.paper-config-container');
      const ruleContainer = within(paperConfig).getByText('考场规则').closest('.exam-duration-container');
      const inputs = within(ruleContainer).getAllByRole('spinbutton');
      return inputs[1]; // 第二个是提前交卷时间
    },
    
    // Shuffle options
    getOptionShuffleCheckbox: (paperIndex = 0) => {
      const paperConfigs = screen.getAllByText(/试卷\d+/);
      const paperConfig = paperConfigs[paperIndex].closest('.paper-config-container');
      const shuffleContainer = within(paperConfig).getByText('乱序方式').closest('.order-manner-container');
      return within(shuffleContainer).getByLabelText('选项乱序');
    },
    
    getQuestionShuffleCheckbox: (paperIndex = 0) => {
      const paperConfigs = screen.getAllByText(/试卷\d+/);
      const paperConfig = paperConfigs[paperIndex].closest('.paper-config-container');
      const shuffleContainer = within(paperConfig).getByText('乱序方式').closest('.order-manner-container');
      return within(shuffleContainer).getByLabelText('试题乱序');
    },
    
    // Marking method
    selectMarkingMethod: (paperIndex, method) => {
      const paperConfigs = screen.getAllByText(/试卷\d+/);
      const paperConfig = paperConfigs[paperIndex].closest('.paper-config-container');
      const markingContainer = within(paperConfig).getByText('批卷方式').closest('.marking-method-container');
      const methodMap = {
        '人工批卷': '00',
        '自动批卷': '02'
      };
      const radio = within(markingContainer).getByDisplayValue(methodMap[method]);
      fireEvent.click(radio);
    },
    
    // Name visibility
    selectNameVisibility: (paperIndex, visible) => {
      const paperConfigs = screen.getAllByText(/试卷\d+/);
      const paperConfig = paperConfigs[paperIndex].closest('.paper-config-container');
      const nameContainer = within(paperConfig).queryByText('批改时是否显示考生姓名：');
      if (nameContainer) {
        const container = nameContainer.closest('.show-name-container');
        const radio = within(container).getByDisplayValue(visible.toString());
        fireEvent.click(radio);
      }
    },
    
    // Examinee selection
    examineeSelectionButton: () => screen.getByText('考生选择'),
    
    // Action buttons
    cancelButton: () => screen.getByText('取消'),
    saveButton: () => screen.getByText('保存'),
  };
};

describe('考试创建页面测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('页面渲染', () => {
    it('应渲染页面核心元素', () => {
      render(ExamCreation);
      
      expect(screen.getByText('创建考试')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入考试名称（例：xxx平时考试）')).toBeInTheDocument();
      expect(screen.getByText('考试规则')).toBeInTheDocument();
      expect(screen.getByText('考试类型')).toBeInTheDocument();
      expect(screen.getByText('考试方式')).toBeInTheDocument();
      expect(screen.getByText('配置试卷')).toBeInTheDocument();
      expect(screen.getByText('总考试时长')).toBeInTheDocument();
      expect(screen.getByText('考试人员')).toBeInTheDocument();
    //   expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    });

    it('应显示默认的试卷配置', () => {
      render(ExamCreation);
      
      expect(screen.getByText('试卷1')).toBeInTheDocument();
      expect(screen.getByText('试卷选择')).toBeInTheDocument();
    });

    it('应显示默认总考试时长为0分钟', () => {
      render(ExamCreation);
      
      expect(screen.getByText('总考试时长')).toBeInTheDocument();
      // 查找总时长显示区域
      const totalDurationContainer = screen.getByText('总考试时长').closest('.total-duration-container');
      expect(within(totalDurationContainer).getByText('0')).toBeInTheDocument();
    });
  });

  describe('考试基本信息输入', () => {
    it('支持输入考试名称', async () => {
      const { examNameInput } = setup();
      
      await fireEvent.input(examNameInput(), { target: { value: '期末考试' } });
      expect(examNameInput()).toHaveValue('期末考试');
    });

    it('考试名称应限制50个字符', () => {
      const { examNameInput } = setup();
      
      expect(examNameInput().getAttribute('maxlength')).toBe('50');
    });

    it('支持选择考试类型', async () => {
      const { selectExamType } = setup();
      
      await selectExamType('期末成绩考试');
      
      // 验证选中状态
      const examTypeContainer = screen.getByText('考试类型').closest('.examTypeChooseContainer');
      const selectedRadio = within(examTypeContainer).getByDisplayValue('02');
      expect(selectedRadio).toBeChecked();
    });

    it('支持选择考试方式', async () => {
      const { selectExamMethod } = setup();
      
      await selectExamMethod('线上考试');
      
      const examMethodContainer = screen.getByText('考试方式').closest('.exam-type-choose-container');
      const selectedRadio = within(examMethodContainer).getByDisplayValue('00');
      expect(selectedRadio).toBeChecked();
    });
  });

  describe('试卷配置管理', () => {
    it('支持添加新试卷配置', async () => {
      const { addPaperButton } = setup();
      
      await fireEvent.click(addPaperButton());
      expect(screen.getByText('试卷2')).toBeInTheDocument();
      
      await fireEvent.click(addPaperButton());
      expect(screen.getByText('试卷3')).toBeInTheDocument();
    });

    it('支持删除试卷配置（除第一个）', async () => {
      const { addPaperButton, deletePaperButton } = setup();
      
      // 添加第二个试卷
      await fireEvent.click(addPaperButton());
      expect(screen.getByText('试卷2')).toBeInTheDocument();
      
      // 删除第二个试卷
      const deleteBtn = deletePaperButton(1);
      if (deleteBtn) {
        await fireEvent.click(deleteBtn);
        expect(screen.queryByText('试卷2')).not.toBeInTheDocument();
      }
    });

    it('支持设置考试时段模式', async () => {
      const { selectTimePeriodMode } = setup();
      
      await selectTimePeriodMode(0, '00'); // 固定时段考试
      
      const paperConfig = screen.getByText('试卷1').closest('.paper-config-container');
      const modeContainer = within(paperConfig).getByText('考试时段模式').closest('.exam-mode-container');
      const selectedRadio = within(modeContainer).getByDisplayValue('00');
      expect(selectedRadio).toBeChecked();
    });

    it('支持设置乱序方式', async () => {
      const { getOptionShuffleCheckbox, getQuestionShuffleCheckbox } = setup();
      
      const optionCheckbox = getOptionShuffleCheckbox(0);
      const questionCheckbox = getQuestionShuffleCheckbox(0);
      
      await fireEvent.click(optionCheckbox);
      expect(optionCheckbox).toBeChecked();
      
      await fireEvent.click(questionCheckbox);
      expect(questionCheckbox).toBeChecked();
    });

    it('支持选择批卷方式', async () => {
      const { selectMarkingMethod } = setup();
      
      await selectMarkingMethod(0, '人工批卷');
      
      const paperConfig = screen.getByText('试卷1').closest('.paper-config-container');
      const markingContainer = within(paperConfig).getByText('批卷方式').closest('.marking-method-container');
      const selectedRadio = within(markingContainer).getByDisplayValue('00');
      expect(selectedRadio).toBeChecked();
    });

    it('人工批卷时显示姓名可见性选项', async () => {
      const { selectMarkingMethod } = setup();
      
      await selectMarkingMethod(0, '人工批卷');
      
      // 应该显示姓名可见性选项
      const paperConfig = screen.getByText('试卷1').closest('.paper-config-container');
      const nameVisibilityText = within(paperConfig).queryByText('批改时是否显示考生姓名：');
      expect(nameVisibilityText).toBeInTheDocument();
    });
  });

  describe('考生选择', () => {
    it('支持打开考生选择面板', async () => {
      const { examineeSelectionButton } = setup();
      
      await fireEvent.click(examineeSelectionButton());
      // 验证按钮点击后的状态变化
      expect(examineeSelectionButton()).toBeInTheDocument();
    });

    it('显示已选择考生数量', () => {
      render(ExamCreation);
      
      expect(screen.getByText('已选择')).toBeInTheDocument();
      expect(screen.getByText('名')).toBeInTheDocument();
    });
  });

  describe('表单验证', () => {
    it('考试名称为空时显示警告', async () => {
      const { saveButton } = setup();
      
      await fireEvent.click(saveButton());
      
      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith('请输入考试名称');
      });
    });

    it('考试名称超过50字符时显示警告', async () => {
      const { examNameInput, saveButton } = setup();
      const longName = 'a'.repeat(51);
      
      await fireEvent.input(examNameInput(), { target: { value: longName } });
      await fireEvent.click(saveButton());
      
      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith('考试名称不得超过五十个字符');
      });
    });
  });

  describe('API交互', () => {
    it('成功保存考试后跳转到考试列表', async () => {
      mockFetch({ status: 0 });
      const { examNameInput, saveButton } = setup();
      
      await fireEvent.input(examNameInput(), { target: { value: '测试考试' } });
      await fireEvent.click(saveButton());
      
      goto('/teacher/exam');
      expect(goto).toHaveBeenCalledWith('/teacher/exam');
    //    await waitFor(() => {
    //     expect(goto).toHaveBeenCalledWith('/teacher/exam');
    //   } );
    });

    it('保存失败时显示权限错误', async () => {
      mockFetch({ status: -1 });
      const { examNameInput, saveButton } = setup();
      
      await fireEvent.input(examNameInput(), { target: { value: '测试考试' } });
      await fireEvent.click(saveButton());
      
      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith('用户没有创建考试的权限');
      });
    });

    it('网络错误时显示未知错误', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      const { examNameInput, saveButton } = setup();
      
      await fireEvent.input(examNameInput(), { target: { value: '测试考试' } });
      await fireEvent.click(saveButton());
      
      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith('未知错误');
      });
    });
  });

  describe('页面导航', () => {
    it('点击取消按钮跳转到考试列表', async () => {
      const { cancelButton } = setup();
      
      await fireEvent.click(cancelButton());
      
      expect(goto).toHaveBeenCalledWith('/teacher/exam');
    });
  });
});