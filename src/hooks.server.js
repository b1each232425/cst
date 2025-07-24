export function handleError({ event, error }) {
  // @ts-ignore
  console.error(error.stack);

  return {
    message: "您访问的页面不存在哦，请点击下方按钮回到上一个页面。",
  };
}
