import { render, cleanup, screen, fireEvent } from '@testing-library/svelte';
import { vi, describe, it, expect, afterEach } from 'vitest';
import EditableTag from '../EditableTag.svelte';
import EditableTags from '../EditableTags.svelte';
import Tag from '../Tag.svelte';
import UneditableHashTags from '../UneditableHashTags.svelte';
import UneditableTag from '../UneditableTag.svelte';
import UneditableTags from '../UneditableTags.svelte';

/** TAG TESTS */
describe('Tag', () => {
  //--
  //--EditableTag--
  //--
  describe('EditableTag 组件测试', () => {
    // 每次测试后清理 DOM
    afterEach(() => {
      cleanup();
    });

    it('应该能渲染一个基本EditableTag标签', () => {
      render(EditableTag, {
        props: {
          content: 'Hello World',
        },
      });
      expect(screen.getByDisplayValue('Hello World')).toBeVisible();
    });

    it('应该渲染带有约束的输入框', () => {
      const constraints = {
        min_length: 5,
        max_length: 20,
        pattern: '[a-zA-Z]+',
      };
      render(EditableTag, { props: { content: 'Test', constraints } });
      const input = screen.getAllByPlaceholderText('+标签')[0];

      // 在内部的html元素上应该会有相应的属性
      expect(input).toHaveAttribute('minlength', '5');
      expect(input).toHaveAttribute('maxlength', '20');
      expect(input).toHaveAttribute('pattern', '[a-zA-Z]+');
    });

    it('应该调用handle_funcs中的函数', async () => {
      const handle_funcs = {
        input_focus: vi.fn(),
        input_blur: vi.fn(),
        onchange: vi.fn(),
        input_change: vi.fn(),
        delete: vi.fn(),
      };
      render(EditableTag, { props: { content: 'Test', handle_funcs } });
      const input = screen.getAllByPlaceholderText('+标签')[0];

      await fireEvent.focus(input);
      expect(handle_funcs.input_focus).toHaveBeenCalled();

      // 输入内容
      await fireEvent.input(input, { target: { value: 'NewTest' } });
      expect(handle_funcs.input_change).toHaveBeenCalledWith('NewTest');

      // onchange事件
      await fireEvent.change(input, { target: { value: 'NewTest' } });
      expect(handle_funcs.onchange).toHaveBeenCalledWith('Test', 'NewTest');

      // 失去焦点
      await fireEvent.blur(input);
      expect(handle_funcs.input_blur).toHaveBeenCalledWith('NewTest');

      // 关闭标签（删除）
      await fireEvent.mouseOver(input);
      const clearBtn = screen.getByText('⨉');
      await fireEvent.click(clearBtn);
      expect(handle_funcs.delete).toHaveBeenCalled();
    });

    it('应该在鼠标悬停时显示清除按钮', async () => {
      render(EditableTag, { props: { content: 'Test' } });
      const container = document.querySelector('.tag__content');
      await fireEvent.mouseOver(container);
      // 因该会显示清除按钮
      await expect(screen.getByText('⨉')).toBeVisible();

      // // 鼠标移开后应该隐藏清除按钮
      // await fireEvent.mouseOut(container);
      // await tick();
      // // 等待 show_clear_btn 反应到 DOM
      // await waitFor(() => {
      //   expect(screen.queryByText('⨉')).not.toBeInTheDocument();
      // });
    });

    it('传入非正常数据null,undefined,空字符串,应该能正常运行,且控制台会有警告', async () => {
      const spy = vi.spyOn(console, 'warn');

      const DATA = [null, undefined, ''];
      // content
      DATA.forEach(async (data) => {
        render(EditableTag, { props: { content: data } });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(1); // 1个警告，null会触发警告,undefined不会触发警告，因为svelte的原因,空字符串不会触发警告
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      // constraints
      DATA.forEach(async (data) => {
        render(EditableTag, { props: { colors: data } });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 1个警告，null，空字符串都会触发警告会触发警告，undefined不会触发警告，因为svelte的原因，
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();
    });
  });

  //--
  //--EditableTags--
  //--
  describe('EditableTags 组件测试', () => {
    // 每次测试后清理 DOM
    afterEach(() => {
      cleanup();
    });

    it('应该能渲染一个基本EditableTags标签', async () => {
      const onInputChange = vi.fn(); // 输入事件

      const { getAllByPlaceholderText } = render(EditableTags, { props: { original_tags: ['Hello'], onInputChange } });
      await expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
      const inputs = getAllByPlaceholderText('+标签');
      await expect(inputs.length).toBe(2); // 初始有一个标签 + 一个空输入

      // 测试输入事件是否能够进行运行
      // 修改第一个输入框
      await fireEvent.input(inputs[0], { target: { value: '新标签' } });
      // 检查 onInputChange 被调用
      await expect(onInputChange).toHaveBeenCalled();
      // 第一个标签元素改为新标签
      await expect(inputs[0]).toHaveValue('新标签');

      // 新增加一个标签元素应该能够进行渲染
      await fireEvent.input(inputs[1], { target: { value: '新标签2' } });
      await expect(inputs[1]).toHaveValue('新标签2');
      await expect(screen.getAllByText('×').length).toBe(2); // 2个移除按钮
    });

    it('应该渲染多个标签并显示移除按钮对于非空标签', async () => {
      render(EditableTags, { props: { original_tags: ['Tag1', '', 'Tag3'] } });
      await expect(screen.getByDisplayValue('Tag1')).toBeInTheDocument();
      await expect(screen.getByDisplayValue('')).toBeInTheDocument();
      await expect(screen.getByDisplayValue('Tag3')).toBeInTheDocument();
      await expect(screen.getAllByText('×').length).toBe(2); // 2个移除按钮
    });

    it('应该处理输入事件', async () => {
      const handleInput = vi.fn();
      render(EditableTags, { props: { original_tags: ['Hello'], handleInput } });
      const input = screen.getByDisplayValue('Hello');
      await fireEvent.input(input, { target: { value: 'World' } });
      // handleInput is defined in the component, but we can mock if exposed; here test DOM update
      await expect(input).toHaveValue('World');
    });

    it('应该处理移除标签', async () => {
      const removeTag = vi.fn();
      render(EditableTags, { props: { original_tags: ['Hello'], removeTag } });
      const removeBtn = screen.getByText('×');
      await fireEvent.click(removeBtn);
      expect(removeBtn).not.toBeInTheDocument();
    });

    it('传入一个空数组进去应该能正常运行', () => {
      render(EditableTags, { props: { original_tags: [] } });
      expect(screen.queryByText('×')).not.toBeInTheDocument();
    });

    it('测试传入非正常数据null,undefined,空字符串,应该能正常运行,且控制台会有警告', async () => {
      const spy = vi.spyOn(console, 'warn');
      const innormal_data = [null, undefined, ''];

      // original_tags
      innormal_data.forEach(async (data) => {
        render(EditableTags, { props: { original_tags: data } });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，null,空字符串都会触发警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      // max_tags_num
      innormal_data.forEach(async (data) => {
        render(EditableTags, { props: { max_tags_num: data } });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，null,空字符串都会触发警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      // max_tags_text_num
      innormal_data.forEach(async (data) => {
        render(EditableTags, { props: { max_tags_text_num: data } });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，null,空字符串都会触发警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      // input_type
      innormal_data.forEach(async (data) => {
        render(EditableTags, { props: { input_type: data } });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(1); // 1个警告，null会触发警告，空字符串不会触发警告（因为范围太大），undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      // colors
      innormal_data.forEach(async (data) => {
        render(EditableTags, { props: { colors: data } });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，null,空字符串都会触发警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      // onInputChange
      innormal_data.forEach(async (data) => {
        render(EditableTags, { props: { onInputChange: data } });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，null,空字符串都会触发警告，undefined不会触发警告，因为svelte的原因
    });
  });

  //--
  //-----Tag--------
  //---
  describe('Tag 组件测试', () => {
    // 每次测试后清理 DOM
    afterEach(() => {
      cleanup();
    });

    it('应该渲染不同颜色类型, 尺寸类型,是否圆角,主题类型的Tag标签', async () => {
      // 颜色类型
      const color_types = ['primary', 'success', 'warning', 'danger', 'info'];
      color_types.forEach(async (color_type) => {
        render(Tag, {
          props: {
            children: () => 'Hello 这个是Tag标签',
            type: color_type,
          },
        });

        await expect(screen.getByText('Hello 这个是Tag标签')).toHaveClass(`tag--${color_type}`);
        await cleanup();
      });

      // 尺寸类型
      const size_types = ['small', 'middle', 'large'];
      size_types.forEach(async (size_type) => {
        render(Tag, {
          props: {
            children: () => 'Hello 这个是Tag标签',
            size: size_type,
          },
        });

        await expect(screen.getByText('Hello 这个是Tag标签')).toHaveClass(`tag--${size_type}`);
        await cleanup();
      });

      // 主题类型
      const theme_types = ['light', 'dark', 'plain'];
      theme_types.forEach(async (theme_type) => {
        render(Tag, {
          props: {
            children: () => 'Hello 这个是Tag标签',
            theme: theme_type,
          },
        });

        await expect(screen.getByText('Hello 这个是Tag标签')).toHaveClass(`is-${theme_type}`);
        await cleanup();
      });

      // 是否圆角
      const round_types = [true, false];
      round_types.forEach(async (round_type) => {
        render(Tag, {
          props: {
            children: () => 'Hello 这个是Tag标签',
            round: round_type,
          },
        });
        if (round_type) await expect(screen.getByText('Hello 这个是Tag标签')).toHaveClass(`tag--round`);
        else await expect(screen.getByText('Hello 这个是Tag标签')).not.toHaveClass(`tag--round`);
        await cleanup();
      });
    });

    it('对于传入undefined,null,空字符串的数据,应该会进行处理', async () => {
      const spy = vi.spyOn(console, 'warn');
      const innormal_data = [undefined, null, ''];
      innormal_data.forEach(async (data) => {
        // 测试type数据
        render(Tag, {
          props: {
            type: data,
            children: () => '测试type属性',
          },
        });
      });
      await expect(spy).toHaveBeenCalled();
      expect(spy.mock.calls.length).toBe(2); // 2个警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      innormal_data.forEach(async (data) => {
        // 测试size数据
        render(Tag, {
          props: {
            size: data,
            children: () => '测试size属性',
          },
        });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      innormal_data.forEach((data) => {
        // 测试them数据
        render(Tag, {
          props: {
            them: data,
            children: () => '测试theme属性',
          },
        });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      // 测试round属性
      innormal_data.forEach((data) => {
        render(Tag, {
          props: {
            round: data,
            children: () => '测试round属性',
          },
        });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();
    });
  });

  //--
  //--UneditableHashTags--
  //--
  describe('UneditableHashTags 组件测试', () => {
    // 每次测试后清理 DOM
    afterEach(() => {
      cleanup();
    });

    it('应该能渲染一个基本UneditableHashTags标签', async () => {
      render(UneditableHashTags, { props: { tags: ['Hello'] } });
      await expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('应该渲染多个标签', async () => {
      render(UneditableHashTags, { props: { tags: ['Tag1', 'Tag2'] } });
      await expect(screen.getByText('Tag1')).toBeInTheDocument();
      await expect(screen.getByText('Tag2')).toBeInTheDocument();
    });

    it('应该处理空标签,null,undefined标签数组', async () => {
      const spy = vi.spyOn(console, 'warn');
      const DATA = [undefined, null, ''];
      DATA.forEach(async (value) => {
        render(UneditableHashTags, { props: { tags: value } });
      });

      // 检查控制台是否有数据警告
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，null,空字符串都会触发警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();
    });
  });

  //--
  //--UneditableTag--
  //--
  describe('UneditableTag 组件测试', () => {
    // 每次测试后清理 DOM
    afterEach(() => {
      cleanup();
    });

    it('应该能渲染一个基本UneditableTag标签', async () => {
      render(UneditableTag, { props: { content: 'Hello' } });
      await expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('测试对于null,undefined,空字符串的数据的处理', async () => {
      const spy = vi.spyOn(console, 'warn');
      const DATA = [undefined, null, ''];
      // 测试content数据
      DATA.forEach(async (value) => {
        render(UneditableTag, { props: { content: value } });
      });

      // 检查控制台是否有数据警告
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，null,空字符串都会触发警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      // 测试colors数据
      DATA.forEach(async (value) => {
        render(UneditableTag, { props: { content: '测试colors属性', colors: value } });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，null,空字符串都会触发警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();
    });
  });

  //--
  //--UneditableTags--
  //--
  describe('UneditableTags 组件测试', () => {
    // 每次测试后清理 DOM
    afterEach(() => {
      cleanup();
    });

    it('应该能渲染一个基本UneditableTags标签', async () => {
      render(UneditableTags, { props: { tags: ['Hello'] } });
      await expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    it('应该渲染多个标签', async () => {
      render(UneditableTags, { props: { tags: ['Tag1', 'Tag2'] } });
      await expect(screen.getByText('Tag1')).toBeInTheDocument();
      await expect(screen.getByText('Tag2')).toBeInTheDocument();
    });

    // it('应该能正常喧嚷传入的颜色数组数据', async () => {
    //   const colors = ['#f00', '#0f0', '#00f'];
    //   const colors_rgb = ['rgba(255, 0, 0, 0)', 'rgba(0, 255, 0, 0)', 'rgba(0, 0, 255, 0)'];

    //   render(UneditableTags, { props: { tags: ['测试colors属性'], colors } });
    //   const tagEl = screen.getByText('测试colors属性');

    //   // 获取最终计算的背景色
    //   const bgColor = getComputedStyle(tagEl).backgroundColor;

    //   // 断言应该在预期颜色数组中
    //   expect(colors_rgb).toContain(bgColor);
    // });

    it('测试传入非正常数据null,undefined,空字符串的处理', async () => {
      const spy = vi.spyOn(console, 'warn');
      const DATA = [undefined, null, ''];
      DATA.forEach(async (value) => {
        render(UneditableTags, { props: { tags: value } });
      });

      // 检查控制台是否有数据警告
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，null,空字符串都会触发警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();

      // 测试colors数据
      DATA.forEach(async (value) => {
        render(UneditableTags, { props: { tags: ['测试colors属性'], colors: value } });
      });
      await expect(spy).toHaveBeenCalled();
      await expect(spy.mock.calls.length).toBe(2); // 2个警告，null,空字符串都会触发警告，undefined不会触发警告，因为svelte的原因
      await spy.mockClear(); // 清空计数，为下一组准备
      await cleanup();
    });
  });
});
