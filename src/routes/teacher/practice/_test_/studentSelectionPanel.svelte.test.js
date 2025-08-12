import {  describe,  it } from 'vitest';
import {  render } from '@testing-library/svelte';
import StudentSelectionPanel from '../_components/StudentSelectionPanel.svelte';

describe('成功渲染组件', (() => { 
    it('渲染组件',(()=>{
        render(StudentSelectionPanel);
    }))


}));

describe('获取学生函数测试',(()=>{
    it('返回的ok不为true',(()=>{
        
    }))
}))