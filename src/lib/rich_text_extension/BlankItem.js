// CustomBlock.js
import { Node } from '@tiptap/core'
import TextStyle from '@tiptap/extension-text-style'

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
                parseHTML: element => {
                    // 只有当元素是span且class包含'blank-item'时才解析属性
                    if (element.tagName === 'SPAN' && element.classList.contains('blank-item')) {
                        return element.getAttribute('blankNumber');
                    }
                    return null;
                },
                renderHTML: attributes => {
                    // 只有当属性存在且元素是span且class包含'blank-item'时才渲染属性
                    if (attributes['blankNumber']) {
                        return { 'blankNumber': attributes['blankNumber'] }
                    }
                    return {}
                }
            },
            'id': {
                default: null,
                parseHTML: element => {
                    if (element.tagName === 'SPAN' && element.classList.contains('blank-item')) {
                        return element.getAttribute('id');
                    }
                    return null;
                },
                renderHTML: attributes => {
                    if (attributes['id']) {
                        return { 'id': attributes['id'] }
                    }
                    return {}
                }
            },
            'class': {
                default: null,
                parseHTML: element => {
                    if (element.tagName === 'SPAN' && element.classList.contains('blank-item')) {
                        return element.getAttribute('class');
                    }
                    return null;
                },
                renderHTML: attributes => {
                    if (attributes['class']) {
                        return { 'class': attributes['class'] }
                    }
                    return {}
                }
            },
            'style': {
                default: null,
                parseHTML: element => {
                    if (element.tagName === 'SPAN' && element.classList.contains('blank-item')) {
                        return element.getAttribute('style');
                    }
                    return null;
                },
                renderHTML: attributes => {
                    if (attributes['style']) {
                        return { 'style': attributes['style'] }
                    }
                    return {}
                }
            }
        }
    },

    // 添加一个辅助方法来判断当前元素是否是blank-item
    isBlankItemElement() {
        // 注意：在renderHTML中，我们无法直接访问DOM元素
        // 所以这个方法可能需要在其他地方使用，或者需要调整实现方式
        // 可能需要重新考虑如何在renderHTML中判断

        // 由于在renderHTML中无法访问DOM元素，我们需要另一种方式
        // 可能需要通过schema或node来识别

        // 暂时返回true，实际实现需要更复杂的逻辑
        return true;
    }
})

// export const CustomTextStyle = TextStyle.extend({
//     addAttributes() {
//         return {
//             ...this.parent?.(),
//             'blankNumber': {  // 你的自定义属性
//                 default: null,
//                 parseHTML: element => element.getAttribute('blankNumber'),
//                 renderHTML: attributes => {
//                     if (!attributes['blankNumber']) return {}
//                     return { 'blankNumber': attributes['blankNumber'] }
//                 }
//             },
//             // 可以添加更多自定义属性
//             'id': {
//                 default: null,
//                 parseHTML: element => element.getAttribute('id'),
//                 renderHTML: attributes => {
//                     if (!attributes['id']) return {}
//                     return { 'id': attributes['id'] }
//                 }
//             },
//             'class': {
//                 default: null,
//                 parseHTML: element => element.getAttribute('class'),
//                 renderHTML: attributes => {
//                     if (!attributes['class']) return {}
//                     return { 'class': attributes['class'] }
//                 }
//             },
//             'style': {
//                 default: null,
//                 parseHTML: element => element.getAttribute('style'),
//                 renderHTML: attributes => {
//                     if (!attributes['style']) return {}
//                     return { 'style': attributes['style'] }
//                 }
//             }
//         }
//     }
// })