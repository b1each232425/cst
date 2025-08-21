export function replaceSpansWithLines(htmlString) {
  if (htmlString === null || htmlString === undefined || htmlString == '') return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const spans = doc.querySelectorAll('span.blank-item');

  spans.forEach((span) => {
    const blankNumber = span.getAttribute('blanknumber') || '';
    const id = span.id;

    const line = document.createElement('span');
    // input.type = 'text';
    line.className = 'blank-item-line'; // 可选：添加样式
    line.setAttribute('data-blank-number', blankNumber);
    line.setAttribute('data-original-id', id);

    // 设置文本
    line.textContent = `_____`;

    // 替换 span 为 input
    span.replaceWith(line);
  });

  // 返回修改后的 HTML 字符串
  return doc.body.innerHTML;
}
