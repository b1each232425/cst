import { render } from '@testing-library/svelte';
import Brand from '../Brand.svelte';
import { describe, it, expect } from 'vitest';

describe('商标测试', () => {
  it('renders the copyright content correctly', () => {
    const content = '© 2025 MyCompany'; // 定义版权内容

    const { getByText } = render(Brand, {
      props: {
        content,
      },
    });

    // 验证组件是否正确渲染了版权内容
    const copyrightElement = getByText(content);
    expect(copyrightElement).toBeInTheDocument();
  });
});
