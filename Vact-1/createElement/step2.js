// step1: 创建新的props对象，并将children写入props中
// step2: 处理text元素
import { ElememtType } from "../utils/Enum";

function createElement(type, props, ...children) {
  let _props = Object.assign({}, props);
  // children可能为多个单独对象，也可能为一个完整数组，比如页面上map产生的列表
  const newChildren = children.length ? [].concat(...children) : [];
  // 如果child不是object，就重新创建一个render能识别的textNode对象
  _props.children = newChildren
    .filter((child) => child !== null && child !== false)
    .map((child) =>
      child instanceof Object ? child : createTextElement(child)
    );

  return { type, props: _props };
}


function createTextElement(value) {
  return createElement(ElememtType.TEXTELEMENT, { nodeValue: value });
}
