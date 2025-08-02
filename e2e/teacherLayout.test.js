import { expect, test } from '@playwright/test';

/**
 * 教师端侧边栏、面包屑端对端测试
 * npx playwright test e2e/teacherLayout.test.js --headed
 */
test.describe('教师端主页测试', () => {
  /**
   * 测试页面基本元素渲染
   */
  test('页面基本元素应该正确渲染', async ({ page }) => {
    await page.goto('/teacher/question-bank/theory');

    // 检查侧边栏元素
    await expect(page.locator('.sidebar-toggle-btn')).toBeVisible();
    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('.sidebar-item').filter({ hasText: '题库管理' })).toBeVisible();
    await expect(page.locator('.sidebar-subitem').filter({ hasText: '理论题库管理' })).toBeVisible();
    await expect(page.locator('.sidebar-item').filter({ hasText: '试卷管理' })).toBeVisible();
    await expect(page.locator('.sidebar-item').filter({ hasText: '练习管理' })).toBeVisible();
    await expect(page.locator('.sidebar-item').filter({ hasText: '考试管理' })).toBeVisible();
    await expect(page.locator('.sidebar-item').filter({ hasText: '成绩管理' })).toBeVisible();
    await expect(page.locator('.sidebar-subitem').filter({ hasText: '考试成绩管理' })).toBeVisible();
    await expect(page.locator('.sidebar-subitem').filter({ hasText: '练习成绩管理' })).toBeVisible();
    await expect(page.locator('.sidebar-item').filter({ hasText: '学生管理' })).toBeVisible();
    await expect(page.locator('.sidebar-item').filter({ hasText: '用户管理' })).toBeVisible();

    // 检查面包屑元素
    await expect(page.locator('.crumb-unflod-btn')).toBeDefined();
    await expect(page.locator('.breadcrumbs-container')).toBeVisible();
    await expect(page.locator('.welcome-text')).toBeVisible();
    await expect(page.locator('.avatar-img')).toBeVisible();
    await expect(page.locator('.notification-img')).toBeVisible();
  });

  /**
   * 测试侧边栏点击事件
   */
  test('测试侧边栏点击事件', async ({ page }) => {
    await page.goto('/teacher/question-bank/theory');

    // 折叠侧边栏
    await page.locator('.sidebar-toggle-btn').click();
    await page.waitForTimeout(1000);

    // 展开侧边栏
    await page.locator('.crumb-toggle-btn').click();
    await page.waitForTimeout(1000);

    // 测试子菜单的收起展开
    await page.locator('.sidebar-item-btn').filter({ hasText: '题库管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '成绩管理' }).click();
    await page.waitForTimeout(1000);
    await page.locator('.sidebar-item-btn').filter({ hasText: '题库管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '成绩管理' }).click();

    // 点击菜单栏跳转页面
    await page.locator('.sidebar-item-btn').filter({ hasText: '试卷管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '练习管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '考试管理' }).click();
    await page.locator('.sidebar-subitem-btn').filter({ hasText: '考试成绩管理' }).click();
    await page.locator('.sidebar-subitem-btn').filter({ hasText: '练习成绩管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '学生管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '用户管理' }).click();
    await page.locator('.sidebar-subitem-btn').filter({ hasText: '理论题库管理' }).click();

    await page.pause();
  });

  /**
   * 测试悬浮侧边栏点击事件
   */
  test('测试悬浮侧边栏点击事件', async ({ page }) => {
    await page.goto('/teacher/question-bank/theory');

    // 折叠侧边栏
    await page.locator('.sidebar-toggle-btn').click();
    await page.waitForTimeout(1000);

    // 在展开按钮上悬停
    await page.locator('.crumb-unflod-btn').hover();
    await page.waitForTimeout(500);
    await page.locator('.floating-sidebar-container').hover();

    // 测试子菜单的收起展开
    await page.locator('.sidebar-item-btn').filter({ hasText: '题库管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '成绩管理' }).click();
    await page.waitForTimeout(1000);
    await page.locator('.sidebar-item-btn').filter({ hasText: '题库管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '成绩管理' }).click();

    // 点击菜单栏跳转页面
    await page.locator('.sidebar-item-btn').filter({ hasText: '试卷管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '练习管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '考试管理' }).click();
    await page.locator('.sidebar-subitem-btn').filter({ hasText: '考试成绩管理' }).click();
    await page.locator('.sidebar-subitem-btn').filter({ hasText: '练习成绩管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '学生管理' }).click();
    await page.locator('.sidebar-item-btn').filter({ hasText: '用户管理' }).click();
    await page.locator('.sidebar-subitem-btn').filter({ hasText: '理论题库管理' }).click();

    await page.pause();
  });
});
