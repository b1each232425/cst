// CustomBlock.js
import { Node } from '@tiptap/core'
import {TextStyle} from '@tiptap/extension-text-style'

// 定义空白填空节点的 schema
export const BlankItem = Node.create({
    name: 'blankItem',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            id: {
                default: 'blank'
            },
            class: {
                default: 'blank-item'
            },
            blankNumber: {
                default: 1
            }
        }
    },

    parseHTML() {
        return [{
            tag: 'span[class="blank-item"]',
            getAttrs: element => ({
                id: element.getAttribute('id'),
                blankNumber: parseInt(element.getAttribute('data-blank-number')) || 1,
                class: element.getAttribute('class')
            })
        }]
    },

    // parseHTML() {
    //     return [
    //         {
    //             tag: 'span',
    //             getAttrs: (el) => {
    //                 if (el.classList.contains('blank-item')) {
    //                     return {
    //                         id: el.getAttribute('id') || 'blank',
    //                         class: el.getAttribute('class') || 'blank-item',
    //                         blankNumber: parseInt(el.getAttribute('blankNumber') || '1', 10)
    //                     }
    //                 }
    //                 return false // 如果不是 blank-item，就不解析为这个节点
    //             }
    //         }
    //     ]
    // },

    renderHTML({HTMLAttributes}) {
        return ['span', {
            ...HTMLAttributes,
            style: 'display: inline-block; color: #2196f3;'
        }, `[填空${HTMLAttributes.blankNumber || 1}]`]
    },

});

export const CustomTextStyle = TextStyle.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            'blankNumber': {  // 你的自定义属性
                default: null,
                parseHTML: element => element.getAttribute('blankNumber'),
                renderHTML: attributes => {
                    if (!attributes['blankNumber']) return {}
                    return { 'blankNumber': attributes['blankNumber'] }
                }
            },
            // 可以添加更多自定义属性
            'id': {
                default: null,
                parseHTML: element => element.getAttribute('id'),
                renderHTML: attributes => {
                    if (!attributes['id']) return {}
                    return { 'id': attributes['id'] }
                }
            },
            'class': {
                default: null,
                parseHTML: element => element.getAttribute('class'),
                renderHTML: attributes => {
                    if (!attributes['class']) return {}
                    return { 'class': attributes['class'] }
                }
            },
            'style': {
                default: null,
                parseHTML: element => element.getAttribute('style'),
                renderHTML: attributes => {
                    if (!attributes['style']) return {}
                    return { 'style': attributes['style'] }
                }
            }
        }
    }
})