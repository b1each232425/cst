import { expect, test } from '@playwright/test';

// 端对端测试：测试的是用户交互与页面的展示
// 对于接口的具体实现，里面参数的具体判断，可以不必过于重视，避免测试脆弱（接口一旦变动就需要更改测试代码）

test.describe('考试列表页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/exam/list**', async (route) => {
      const mockResponse = [
        {
          id: 5,
          name: '语文考试',
          exam_sessions: [
            {
              id: 201,
              start_time: new Date('2025-07-20 10:00').getTime(),
              end_time: new Date('2025-07-20 11:00').getTime(),
              session_num: '001',
              paper_name: '语文试卷A',
              status: '10',
              examinee_status: '00',
              student_score: 92,
              total_score: 100,
            },
          ],
        },
        {
          id: 6,
          name: 'H34',
          exam_sessions: [
            {
              id: 201,
              start_time: new Date('2025-07-20 10:00').getTime(),
              end_time: new Date('2025-07-20 11:00').getTime(),
              session_num: '001',
              paper_name: '语文试卷A',
              status: '10',
              examinee_status: '00',
              student_score: 92,
              total_score: 100,
            },
          ],
        },
        {
          id: 7,
          name: 'H34',
          exam_sessions: [
            {
              id: 201,
              start_time: new Date('2025-08-01 09:00').getTime(),
              end_time: new Date('2025-08-01 11:00').getTime(),
              session_num: '001',
              paper_name: '语文试卷A',
              status: '08',
              examinee_status: '00',
              student_score: 92,
              total_score: 100,
            },
          ],
        },
        {
          id: 8,
          name: '语文期末',
          exam_sessions: [
            {
              id: 201,
              start_time: new Date('2025-08-01 09:00').getTime(),
              end_time: new Date('2025-08-01 11:00').getTime(),
              session_num: '001',
              paper_name: '语文试卷A',
              status: '10',
              examinee_status: '02',
              student_score: 92,
              total_score: 100,
            },
          ],
        },
        {
          id: 9,
          name: '语文期中',
          exam_sessions: [
            {
              id: 201,
              start_time: new Date('2025-08-01 09:00').getTime(),
              end_time: new Date('2025-08-01 11:00').getTime(),
              session_num: '001',
              paper_name: '语文试卷A',
              status: '06',
              examinee_status: '04',
              student_score: 92,
              total_score: 100,
            },
          ],
        },
      ];
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 0,
          data: mockResponse,
          rowCount: 12,
        }),
      });
    });

    // 表示在每个测试开始前，自动跳转到 '/student/exam' 页面，等页面加载完成再继续执行测试。
    await page.goto('/student/exam');
  });

  test('点击搜索按钮获取多场次多考试', async ({ page }) => {
    const mockResponse = [
      {
        id: 1,
        name: '数学期末',
        exam_sessions: [
          {
            id: 101,
            start_time: new Date('2025-07-20 10:00').getTime(),
            end_time: new Date('2025-07-20 11:00').getTime(),
            session_num: '001',
            paper_name: '数学试卷A',
            status: '04',
            examinee_status: '00',
            student_score: 85,
            total_score: 100,
          },
          {
            id: 102,
            start_time: new Date('2025-07-21 13:00').getTime(),
            end_time: new Date('2025-07-21 14:00').getTime(),
            session_num: '002',
            paper_name: '数学试卷B',
            status: '06',
            examinee_status: '12',
            student_score: 50,
            total_score: 100,
          },
        ],
      },
      {
        id: 2,
        name: '语文期末',
        exam_sessions: [
          {
            id: 201,
            start_time: new Date('2025-08-01 09:00').getTime(),
            end_time: new Date('2025-08-01 11:00').getTime(),
            session_num: '001',
            paper_name: '语文试卷A',
            status: '10',
            examinee_status: '00',
            student_score: 92,
            total_score: 100,
          },
        ],
      },
    ];

    await page.route('/api/exam/list**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 0,
          data: mockResponse,
        }),
      });
    });

    await page.locator('text=搜索').click();

    await page.waitForResponse((res) => res.url().includes('/api/exam/list'));

    await expect(page.locator('table tbody tr')).toHaveCount(3);
  });

  test('输入考试名称并搜索', async ({ page }) => {
    await page.route('/api/exam/list**', async (route) => {
      // 无需判断传参
      // const url = new URL(request.url());
      // const q = JSON.parse(url.searchParams.get('q') || '{}');
      // await expect(q.filter.Name).toBe('数学期末');

      const mockResponse = [
        {
          id: 1,
          name: '数学期末',
          exam_sessions: [
            {
              id: 101,
              start_time: new Date('2025-08-01 09:00').getTime(),
              end_time: new Date('2025-08-01 11:00').getTime(),
              session_num: '001',
              paper_name: '数学试卷A',
              status: '02',
              examinee_status: '00',
              student_score: 85,
              total_score: 100,
            },
            {
              id: 102,
              start_time: new Date('2025-08-02 09:00').getTime(),
              end_time: new Date('2025-08-02 11:00').getTime(),
              session_num: '002',
              paper_name: '数学试卷B',
              status: '02',
              examinee_status: '10',
              student_score: 90,
              total_score: 100,
            },
          ],
        },
      ];

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 0,
          data: mockResponse,
          rowCount: 2,
        }),
      });
    });

    // 输入考试名称
    await page.fill('input.InputBox-input', '数学期末');
    await expect(page.locator('input.InputBox-input')).toHaveValue('数学期末');

    await page.click('button:has-text("搜索")');

    // 要么等待接口回复，要么等待目标元素渲染出来
    await page.waitForResponse((res) => res.url().includes('/api/exam/list'));

    const rows = await page.locator('table tbody tr').all(); // 获取所有行
    for (const row of rows) {
      const name = await row.locator('td').nth(0).textContent(); // 获取对应列
      expect(name?.trim()).toBe('数学期末');
    }
  });

  test('下拉框选择状态并搜索', async ({ page }) => {
    await page.route('/api/exam/list**', async (route) => {
      const mockResponse = [
        {
          id: 1,
          name: '数学期中',
          exam_sessions: [
            {
              id: 101,
              start_time: new Date('2025-08-03 09:00').getTime(),
              end_time: new Date('2025-08-03 11:00').getTime(),
              session_num: '001',
              paper_name: '数学试卷A',
              status: '02',
              examinee_status: '00',
              student_score: 85,
              total_score: 100,
            },
            {
              id: 102,
              start_time: new Date('2025-08-04 09:00').getTime(),
              end_time: new Date('2025-08-04 11:00').getTime(),
              session_num: '002',
              paper_name: '数学试卷B',
              status: '02',
              examinee_status: '10',
              student_score: 90,
              total_score: 100,
            },
          ],
        },
      ];

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 0,
          data: mockResponse,
          rowCount: 10,
        }),
      });
    });

    // 选择待开始
    await page.locator('.dropdown-icon').click();
    await page.locator('text="待开始"').click();
    await expect(page.locator('.dropdown-input')).toHaveValue('待开始');

    await page.click('button:has-text("搜索")');

    await page.waitForResponse((res) => res.url().includes('/api/exam/list'));

    const rows = await page.locator('table tbody tr').all(); // 获取所有行
    for (const row of rows) {
      const status = await row.locator('td').nth(3).textContent(); // 获取对应列
      expect(status?.trim()).toBe('待开始');
    }
  });

  test('点击分页选择器获取不同页的考试数据', async ({ page }) => {
    await page.route('/api/exam/list**', async (route, request) => {
      const mockResponse = [
        {
          id: 1,
          name: '数学期中',
          exam_sessions: [
            {
              id: 101,
              start_time: new Date('2025-08-01 09:00').getTime(),
              end_time: new Date('2025-08-01 11:00').getTime(),
              session_num: '001',
              paper_name: '数学试卷A',
              status: '02',
              examinee_status: '00',
              student_score: 85,
              total_score: 100,
            },
            {
              id: 102,
              start_time: new Date('2025-08-05 09:00').getTime(),
              end_time: new Date('2025-08-05 11:00').getTime(),
              session_num: '002',
              paper_name: '数学试卷B',
              status: '02',
              examinee_status: '10',
              student_score: 90,
              total_score: 100,
            },
          ],
        },
      ];

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 0,
          data: mockResponse,
          rowCount: 12,
        }),
      });
    });

    page.locator('.jump-to input').fill('2');
    await page.locator('.jump-to input').press('Enter');

    await page.waitForResponse((res) => res.url().includes('/api/exam/list'));

    const rows = await page.locator('table tbody tr').count();
    await expect(page.locator('table tbody tr')).toHaveCount(2);
  });

  test('重置按钮功能', async ({ page }) => {
    // 输入考试名称并检查
    await page.fill('input.InputBox-input', '测试考试');
    await expect(page.locator('input.InputBox-input')).toHaveValue('测试考试');

    // 选择考试时间段并检查
    await page.click('input.date-picker');
    await page.locator('.calendar').nth(0).locator('.calendar-day:not(.non-current-month):has-text("28")').click();
    await expect(page.locator('.time-select').nth(0)).toBeVisible();
    await page.locator('.time-select').nth(0).locator('.time-column').nth(0).locator('button:has-text("12")').click();
    await page.locator('.time-select').nth(0).locator('.time-column').nth(1).locator('button:has-text("13")').click();
    await page.locator('.calendar').nth(1).locator('.calendar-day:not(.non-current-month):has-text("29")').click();
    await expect(page.locator('.time-select').nth(1)).toBeVisible();
    await page.locator('.time-select').nth(1).locator('.time-column').nth(0).locator('button:has-text("14")').click();
    await page.locator('.time-select').nth(1).locator('.time-column').nth(1).locator('button:has-text("15")').click();

    await page.locator('.calendar-footer .confirm-btn').click();

    // 选择考试状态并检查
    await page.locator('.dropdown-icon').click();
    await page.locator('text="待开始"').click();
    await expect(page.locator('.dropdown-input')).toHaveValue('待开始');

    const inputValue = await page.inputValue('input.date-picker');
    expect(inputValue).toContain('/28');
    expect(inputValue).toContain('/29');
    expect(inputValue).toContain('12:13');
    expect(inputValue).toContain('14:15');

    // 点击重置
    await page.click('button:has-text("重置")');

    // 检查
    await expect(page.locator('input.InputBox-input')).toHaveValue('');
    await expect(page.locator('.dropdown-input')).toHaveText('');
    await expect(page.locator('input.date-picker')).toHaveValue('开始日期   ~   结束日期');
  });

  test('接口异常时显示错误提示', async ({ page }) => {
    await page.route('/api/exam/list**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ status: -1, msg: '服务器错误' }),
      });
    });

    await page.locator('text=搜索').click();

    // await page.waitForResponse((res) => res.url().includes('/api/exam/list')); // 这里等待目标元素渲染即可

    await expect(page.locator('text=服务器错误')).toBeVisible();
  });

  test('无数据时页面展示暂无数据', async ({ page }) => {
    await page.route('/api/exam/list**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ status: 0, data: [] }),
        rowCount: 0,
      });
    });

    await page.locator('text=搜索').click();

    await expect(page.locator('text=暂无考试数据')).toBeVisible();
  });

  // TODO 完善路径
  test('考试列表操作按钮跳转', async ({ page }) => {
    await page.route('/api/exam/list**', async (route) => {
      const mockResponse = [
        {
          id: 1,
          name: '数学期中',
          exam_sessions: [
            {
              id: 101,
              start_time: new Date('2025-08-01 09:00').getTime(),
              end_time: new Date('2025-08-01 11:00').getTime(),
              session_num: '001',
              paper_name: '数学试卷A',
              status: '04',
              examinee_status: '00',
              student_score: 85,
              total_score: 100,
            },
            {
              id: 102,
              start_time: new Date('2025-08-06 09:00').getTime(),
              end_time: new Date('2025-08-06 11:00').getTime(),
              session_num: '002',
              paper_name: '数学试卷B',
              status: '10',
              examinee_status: '10',
              student_score: 90,
              total_score: 100,
            },
          ],
        },
      ];

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 0,
          data: mockResponse,
        }),
      });
    });

    // 通过搜索获取 mock 数据
    await page.click('button:has-text("搜索")');

    await page.waitForResponse((res) => res.url().includes('/api/exam/list'));

    // 进入考试按钮
    const [examPage] = await Promise.all([
      page.waitForURL(),
      page.locator('button:has-text("进入考试")').nth(0).click(),
    ]);
    await expect(page).toHaveURL(/student/);

    // 返回后点击查看试卷
    await page.goBack();

    // 查看试卷按钮
    await page.locator('button:has-text("查看试卷")').nth(0).click();
    await expect(page.url()).toContain('/student/answer/exam-detail?exam-id=1&exam-session-id=102');
  });
});
