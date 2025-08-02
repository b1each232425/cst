import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import ExamPage from '../+page.svelte';
import { readable } from 'svelte/store';




describe('ExamPage 数据加载与渲染', () => {
    beforeEach(() => {
        // mock依赖组件和方法
        vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
        vi.mock('$app/state', () => ({
        page: readable({
            url: {
            searchParams: {
                get: (key) => {
                if (key === 'exam-id') return '108';
                if (key === 'exam-session-id') return '152';
                return null;
                }
            }
            }
        })
        }));
        vi.mock('$lib/components/Toast/Toast', () => ({
        toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
        }));
        vi.mock('../_component/CountdownTimer/CountdownTimer.svelte', () => ({ default: () => null }));
        vi.mock('../_component/SwitchBtn/BulmaSwitchBlue.svelte', () => ({
        default: ({ is_full_examMode }) => {
            // 渲染一个假的按钮，点击后切换模式
            return {
            $$render: () => `<button data-testid="switch-mode" onclick="window.__toggleExamMode && window.__toggleExamMode()">切换模式</button>`
            };
        }
        }));
        window.__toggleExamMode = () => {
        // 这里需要能访问到 Svelte 的 is_full_examMode
        // 你可以用 Svelte store 或其它方式暴露出来
        };
        vi.mock('../_component/WaterMark.svelte', () => ({ default: () => null }));
        vi.mock('$lib/components/Button/Button.svelte', () => ({ default: () => null }));
        vi.mock('../_component/ExamInfoModal/ExamInfoModal.svelte', () => ({ default: () => null }));
        vi.mock('../_component/QuestionAnswer/question.svelte', () => ({ default: () => null }));
        vi.mock('$lib/components/MessageBox/MessageBox.js', () => ({ default: vi.fn() }));

        // mock fetch
        const mockJson = vi.fn();
        global.fetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            json: mockJson,
        })
        );

        const mockApiData = {
        status: 0,
        msg: "success",
        API: "/api/respondent/init",
        method: "POST",
        data: {
            session: [
            {
                ID: 152,
                ExamID: 108,
                PaperID: 61,
                Duration: 10,
                StartTime: 1753771945056,
                EndTime: 1758784247642,
            }
            ],
            exam_info: {
            ID: 108,
            Name: "测试线上考试",
            Rules: "<p><span>线上考试规则</span></p>",
            Status: "06",
            Files: [],
            },
            ExamineeInfo: {
            ID: 3112,
            StartTime: 1753771945056,
            ActualEndTime: 1758784247642,
            },
            QuestionGroupInfo: {
            "42": {
                ID: 42,
                Name: "一、单选题",
                Order: 1,
            }
            },
            Questions: {
            "42": [
                {
                ID: 3684,
                group_name: "一、单选题",
                Content: "<p>H3C公司的总部位于哪个城市？</p>",
                Options: [
                    { Label: "A", Value: "<p>北京</p>" },
                    { Label: "B", Value: "<p>杭州</p>" },
                    { Label: "C", Value: "<p>深圳</p>" },
                    { Label: "D", Value: "<p>上海</p>" }
                ],
                Order: 1,
                }
            ]
            }
        }
        };

        window.localStorage.clear();
        mockJson.mockResolvedValue(mockApiData);
    });
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('进入页面后自动请求并渲染考试标题、题组和题目', async () => {
        render(ExamPage);
        // 等待异步渲染
        await waitFor(() => {
        // 标题
        expect(screen.getByText('测试线上考试')).toBeTruthy();
        // 题组
        expect(screen.getByText('一、单选题')).toBeTruthy();
        // 题目内容
        expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
        // 提交按钮
        expect(screen.getByText(/提交/)).toBeTruthy();
        // 答题进度
        expect(screen.getByText(/答题进度/)).toBeTruthy();
        });
    });


    it('加载后端数据后渲染考试标题和题组', async () => {
        render(ExamPage);

        
        // 等待异步渲染
        await waitFor(() => {
        expect(screen.getByText('测试线上考试')).toBeTruthy();
        expect(screen.getByText('一、单选题')).toBeTruthy();
        });
    });

    it('渲染题目内容', async () => {
        render(ExamPage);
        await waitFor(() => {
        expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
        });
    });

    it('显示提交按钮', async () => {
        render(ExamPage);
        await waitFor(() => {
        expect(screen.getByText(/提交/)).toBeTruthy();
        });
    });

    it('显示作答偏好标签', async () => {
        render(ExamPage);
        await waitFor(() => {
        expect(screen.getByText(/试卷作答偏好/)).toBeTruthy();
        expect(screen.getByText(/逐题模式/)).toBeTruthy();
        expect(screen.getByText(/全卷模式/)).toBeTruthy();
        });
    });

    it('显示答题进度', async () => {
        render(ExamPage);
        await waitFor(() => {
        expect(screen.getByText(/答题进度/)).toBeTruthy();
        });
    });

        it('点击下一题和上一题按钮可以切换题目', async () => {
        render(ExamPage);

        // 等待页面渲染出题目
        await waitFor(() => {
            expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
        });

        // 找到“下一题”按钮并点击
        const nextBtn = screen.getByText('下一题');
        expect(nextBtn).toBeTruthy();
        await fireEvent.click(nextBtn);

        // 检查是否切换到第二题（你可以根据 mock 数据内容断言第二题文本）
        await waitFor(() => {
            expect(screen.getByText(/H3C S系列交换机默认的管理VLAN是/)).toBeTruthy();
        });

        // 找到“上一题”按钮并点击
        const prevBtn = screen.getByText('上一题');
        expect(prevBtn).toBeTruthy();
        await fireEvent.click(prevBtn);

        // 检查是否切换回第一题
        await waitFor(() => {
            expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
        });
        });

    it('点击逐题模式后可以切换题目', async () => {
        render(ExamPage);

        // 等待页面渲染出“逐题模式”按钮
        await waitFor(() => {
            expect(screen.getByText('逐题模式')).toBeTruthy();
        });

        // 点击“逐题模式”按钮
        const modeBtn = screen.getByText('逐题模式');
        await fireEvent.click(modeBtn);

        // 等待页面渲染出第一题
        await waitFor(() => {
            expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
        });

        // 找到“下一题”按钮并点击
        const nextBtn = screen.getByText('下一题');
        expect(nextBtn).toBeTruthy();
        await fireEvent.click(nextBtn);

        // 检查是否切换到第二题
        await waitFor(() => {
            expect(screen.getByText(/H3C S系列交换机默认的管理VLAN是/)).toBeTruthy();
        });

        // 找到“上一题”按钮并点击
        const prevBtn = screen.getByText('上一题');
        expect(prevBtn).toBeTruthy();
        await fireEvent.click(prevBtn);

        // 检查是否切换回第一题
        await waitFor(() => {
            expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
        });
    });

    it('逐题模式下可以切换题目', async () => {
        render(ExamPage);

        // 强制切换到逐题模式
        window.__setExamMode(false);

        await waitFor(() => {
        expect(screen.getByText('下一题')).toBeTruthy();
        });

        // 强制切换到逐题模式（假设你能访问变量）
         window.is_full_examMode = false; // 或其它方式

        // 等待“下一题”按钮出现 
        await waitFor(() => {
            expect(screen.getByText('下一题')).toBeTruthy();
        });

        // 点击“下一题”按钮
        const nextBtn = screen.getByText('下一题');
        await fireEvent.click(nextBtn);

        // 检查是否切换到第二题
        await waitFor(() => {
            expect(screen.getByText(/H3C S系列交换机默认的管理VLAN是/)).toBeTruthy();
        });
    });
    it('逐题模式下可以切换题目', async () => {
    render(ExamPage);

        // 强制切换到逐题模式
        window.is_full_examMode = false; // 让页面进入逐题模式

        await waitFor(() => {
            expect(screen.getByText('下一题')).toBeTruthy();
        });

        // 点击“下一题”按钮
        const nextBtn = screen.getByText('下一题');
        await fireEvent.click(nextBtn);

        // 检查是否切换到第二题
        await waitFor(() => {
            expect(screen.getByText(/H3C S系列交换机默认的管理VLAN是/)).toBeTruthy();
        });
    });

    it('切换逐题模式后可点击下一题和上一题', async () => {
        render(ExamPage);

        // 等待页面渲染出“逐题模式”标签和切换按钮
        await waitFor(() => {
            expect(screen.getByText('逐题模式')).toBeTruthy();
            expect(screen.getByTestId('switch-mode')).toBeTruthy();
        });

        // 点击切换模式按钮，进入逐题模式
        await fireEvent.click(screen.getByTestId('switch-mode'));

        // 等待“下一题”按钮出现
        await waitFor(() => {
            expect(screen.getByText('下一题')).toBeTruthy();
        });

        // 点击“下一题”
        await fireEvent.click(screen.getByText('下一题'));

        // 检查是否切换到第二题
        await waitFor(() => {
            expect(screen.getByText(/H3C S系列交换机默认的管理VLAN是/)).toBeTruthy();
        });

        // 点击“上一题”
        await fireEvent.click(screen.getByText('上一题'));

        // 检查是否切换回第一题
        await waitFor(() => {
            expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
        });
     });

    it('切换逐题模式后可点击下一题和上一题', async () => {
        render(ExamPage);

        // 切换到逐题模式
        await waitFor(() => {
            expect(screen.getByTestId('switch-mode')).toBeTruthy();
        });
        await fireEvent.click(screen.getByTestId('switch-mode'));

        // 等待“下一题”按钮出现
        await waitFor(() => {
            expect(screen.getByText('下一题')).toBeTruthy();
        });

        // 点击“下一题”
        await fireEvent.click(screen.getByText('下一题'));

        // 等待页面渲染出第二题
        await waitFor(() => {
            expect(screen.getByText(/H3C S系列交换机默认的管理VLAN是/)).toBeTruthy();
        });

        // 点击“上一题”
        await fireEvent.click(screen.getByText('上一题'));

        // 等待页面渲染回第一题
        await waitFor(() => {
            expect(screen.getByText(/H3C公司的总部位于哪个城市/)).toBeTruthy();
        });
    });

  // 可继续补充交互测试，如切换题目、标记题目、提交考试等
});