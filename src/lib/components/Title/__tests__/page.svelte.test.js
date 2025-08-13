import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Title from '../Title.svelte';

describe('Title 组件测试', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('渲染默认标题和默认显示横线', () => {
    render(Title);

    expect(screen.getByText('Title')).toBeInTheDocument();
    const hr = document.querySelector('hr');
    expect(hr).toBeVisible();
  });

  it('渲染自定义标题且line为true时显示横线', () => {
    render(Title, { title: '自定义标题', line: true });

    expect(screen.getByText('自定义标题')).toBeInTheDocument();
    const hr = document.querySelector('hr');
    expect(hr).toBeVisible();
    expect(hr).not.toHaveClass('is-hidden');
  });

  it('line为false时不显示横线', () => {
    render(Title, { title: '无横线标题', line: false });

    expect(screen.getByText('无横线标题')).toBeInTheDocument();
    const hr = document.querySelector('hr');
    // 检测是否有对应的样式类
    expect(hr).toHaveClass('is-hidden');
  });

  it('测试tittle属性传入空字符串时显示默认标题,同时控制台有警告', () => {
    const warnspy = vi.spyOn(console, 'warn');
    render(Title, { title: '' });

    expect(screen.getByText('Title')).toBeInTheDocument();
    // 控制台应该有警告
    expect(warnspy).toHaveBeenCalled();
    expect(warnspy).toHaveBeenCalledWith("[Title] 属性 'title' 无效:校验函数不通过,已使用默认值 'Title',传入值为:''");
  });

  it('测试tittle属性传入0时显示默认标题,同时控制台有警告', () => {
    const warnspy = vi.spyOn(console, 'warn');
    render(Title, { title: 0 });

    expect(screen.getByText('Title')).toBeInTheDocument();

    expect(warnspy).toHaveBeenCalled();
    expect(warnspy).toHaveBeenCalledWith(
      "[Title] 属性 'title' 无效:类型错误，期望类型为string，实际类型为number,已使用默认值 'Title',传入值为:'0'",
    );
  });

  it('测试tittle属性传入null时显示默认标题,同时控制台有警告', () => {
    const warnspy = vi.spyOn(console, 'warn');
    render(Title, { title: null });

    expect(screen.getByText('Title')).toBeInTheDocument();

    expect(warnspy).toHaveBeenCalled();
    expect(warnspy).toHaveBeenCalledWith(
      "[Title] 属性 'title' 无效:类型错误，期望类型为string，实际类型为null,已使用默认值 'Title',传入值为:'null'",
    );
  });

  it('测试tittle属性传入undefined时显示默认标题', () => {
    render(Title, { title: undefined });

    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('测试tittle属性传入NaN时显示默认标题,同时控制台有警告', () => {
    const warnspy = vi.spyOn(console, 'warn');
    render(Title, { title: NaN });

    expect(screen.getByText('Title')).toBeInTheDocument();

    expect(warnspy).toHaveBeenCalled();
    expect(warnspy).toHaveBeenCalledWith(
      "[Title] 属性 'title' 无效:类型错误，期望类型为string，实际类型为number,已使用默认值 'Title',传入值为:'NaN'",
    );
  });

  it('测试line属性传入undefined时显示默认显示横线,同时控制台有警告', () => {
    render(Title, { line: undefined });

    const hr = document.querySelector('hr');
    expect(hr).toBeVisible();
  });

  it('测试line属性传入null时显示默认显示横线,同时控制台有警告', () => {
    const warnspy = vi.spyOn(console, 'warn');
    render(Title, { line: null });

    const hr = document.querySelector('hr');
    expect(hr).toBeVisible();

    expect(warnspy).toHaveBeenCalled();
    expect(warnspy).toHaveBeenCalledWith(
      "[Title] 属性 'line' 无效:类型错误，期望类型为boolean，实际类型为null,已使用默认值 'true',传入值为:'null'",
    );
  });

  it('测试line属性传入NaN时显示默认显示横线,同时控制台有警告', () => {
    const warnspy = vi.spyOn(console, 'warn');
    render(Title, { line: NaN });

    const hr = document.querySelector('hr');
    expect(hr).toBeVisible();

    expect(warnspy).toHaveBeenCalled();
    expect(warnspy).toHaveBeenCalledWith(
      "[Title] 属性 'line' 无效:类型错误，期望类型为boolean，实际类型为number,已使用默认值 'true',传入值为:'NaN'",
    );
  });

  it('测试line属性传入0时显示默认显示横线,同时控制台有警告', () => {
    const warnspy = vi.spyOn(console, 'warn');
    render(Title, { line: 0 });
    const hr = document.querySelector('hr');
    expect(hr).toBeVisible();

    expect(warnspy).toHaveBeenCalled();
    expect(warnspy).toHaveBeenCalledWith(
      "[Title] 属性 'line' 无效:类型错误，期望类型为boolean，实际类型为number,已使用默认值 'true',传入值为:'0'",
    );
  });
});
