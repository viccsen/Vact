// 处理children为textNode类型的情况

import { isEvent, isAttribute, isTextElement } from "../utils/helper";

const render = (element, container) => {
  const { type, props } = element;
  // 创建dom
  const node = isTextElement(type)
    ? document.createTextNode("")
    : document.createElement(type);
  const childElements = props.children || [];
  //更新属性
  if (props) {
    Object.keys(props).forEach((key) => {
      if (isEvent(key)) {
        // 处理事件
        const eventName = key.slice(2).toLowerCase();
        eventName && node.addEventListener(eventName, props[key]);
      } else if (isAttribute(key)) {
        // 处理属性
        node[key] = props[key];
      }
    });
  }
  // 递归children
  childElements.forEach((child) => render(child, node));
  container.appendChild(node);
};
