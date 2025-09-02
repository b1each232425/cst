import { render, screen } from '@testing-library/svelte';
import StudentDetail from '../+page.svelte';

describe('StudentDetail', () => {
  it('渲染标题部分', () => {
    render(StudentDetail);
    expect(screen.getByText('报名信息')).toBeInTheDocument();
    expect(screen.getByText('审核信息')).toBeInTheDocument();
  });

  it('渲染基本报名信息', () => {
    render(StudentDetail);

    expect(screen.getByText(/姓名：/)).toBeInTheDocument();
    expect(screen.getByText(/证件类型：/)).toBeInTheDocument();
    expect(screen.getByText(/身份证号：/)).toBeInTheDocument();

    expect(screen.getByText(/出生日期：/)).toBeInTheDocument();
    expect(screen.getByText(/电话：/)).toBeInTheDocument();
    expect(screen.getByText(/邮箱：/)).toBeInTheDocument();

    expect(screen.getByText(/住址：/)).toBeInTheDocument();
    expect(screen.getByText(/性别：/)).toBeInTheDocument();
    expect(screen.getByText(/报名方式：/)).toBeInTheDocument();

    expect(screen.getByText(/考试科目：/)).toBeInTheDocument();
    expect(screen.getByText(/考试类型：/)).toBeInTheDocument();
    expect(screen.getByText(/报名时间：/)).toBeInTheDocument();
  });

  it('渲染身份证图片', () => {
    render(StudentDetail);

    expect(screen.getByAltText('身份证人像面')).toBeInTheDocument();
    expect(screen.getByAltText('身份证国徽面')).toBeInTheDocument();
  });

  it('渲染审核信息', () => {
    render(StudentDetail);

    expect(screen.getByText(/审核人：/)).toBeInTheDocument();
    expect(screen.getByText('未审核')).toBeInTheDocument();
  });

  it('渲染操作按钮', () => {
    render(StudentDetail);

    expect(screen.getByRole('button', { name: '通过' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '不通过' })).toBeInTheDocument();
  });
});
