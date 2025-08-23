import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import GradeChart from '../GradeChart.svelte';

describe('GradeChart 组件', () => {
  it('应该能正常挂载', () => {
    const { container } = render(GradeChart, {
      props: {
        type: 'practice',
        resource_id: '123',
      },
    });

    expect(container.querySelector('.chart-container')).toBeInTheDocument();
  });
});