import { render, screen, fireEvent } from '@testing-library/svelte';
import Breadcrumb from '../Crumb.svelte';
import { vi } from 'vitest';
import { goto } from '$app/navigation';

// 模拟 $app/navigation 的 goto 函数
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

describe('面包屑组件测试', () => {
  let current_nav_path_data;
  let app_name = 'Test App';
  let avatar_img = '/user_icons/defaultAvatar.svg';
  let icons = { notification: '/user_icons/notification.svg' };

  beforeEach(() => {
    // 假设当前路径为 "/teacher/question-bank/theory/editBank"
    current_nav_path_data = [
      { name: '理论题库管理', title: '理论题库管理', path: '/teacher/question-bank/theory', isFilter: false },
      { name: '编辑题库', title: '编辑题库', path: '/teacher/question-bank/theory/editBank', isFilter: false },
    ];
  });

  it('应该正确渲染面包屑', () => {
    render(Breadcrumb, {
      props: {
        app_name,
        current_nav_path_data,
        avatar_img,
        icons,
      },
    });

    // 验证每个面包屑项的渲染
    expect(screen.getByTestId('breadcrumb-item-理论题库管理')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb-item-编辑题库')).toBeInTheDocument();
  });

  //   it('应该过滤掉带有 isFilter: true 的项', () => {
  //     render(Breadcrumb, {
  //       props: {
  //         app_name,
  //         current_nav_path_data,
  //       },
  //     });

  //     // 验证 "题库管理" 被过滤掉，因为 isFilter 为 true
  //     expect(screen.queryByText('题库管理')).not.toBeInTheDocument();
  //   });

  //   it('点击面包屑时应该跳转到对应的路径', async () => {
  //     render(Breadcrumb, {
  //       props: {
  //         app_name,
  //         current_nav_path_data,
  //       },
  //     });

  //     // 模拟点击“理论题库管理”
  //     const theoryBreadcrumb = screen.getByText('理论题库管理');
  //     await fireEvent.click(theoryBreadcrumb);

  //     // 验证 goto 是否被调用
  //     expect(goto).toHaveBeenCalledWith('/teacher/question-bank/theory');

  //     // 模拟点击“编辑题库”
  //     const editBreadcrumb = screen.getByText('编辑题库');
  //     await fireEvent.click(editBreadcrumb);

  //     // 验证 goto 是否被调用
  //     expect(goto).toHaveBeenCalledWith('/teacher/question-bank/theory/editBank');
  //   });

  //   it('应该根据导航数据更新页面标题', () => {
  //     render(Breadcrumb, {
  //       props: {
  //         app_name,
  //         current_nav_path_data,
  //       },
  //     });

  //     // 获取页面标题并验证
  //     const currentNavItem = current_nav_path_data[current_nav_path_data.length - 1];
  //     expect(document.title).toBe(`${currentNavItem.title} • ${app_name}`);
  //   });

  //   it('应处理没有导航数据的情况', () => {
  //     render(Breadcrumb, {
  //       props: {
  //         app_name,
  //         current_nav_path_data: [],
  //       },
  //     });

  //     // 验证没有任何面包屑项
  //     expect(screen.queryByText('题库管理')).not.toBeInTheDocument();
  //   });
});
