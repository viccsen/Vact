// 重构render，添加instantiate实例化函数

import { isEvent, isAttribute, isTextElement } from "../utils/helper";

let rootInstance = null;

const render = (element, container) => {
  const previousInstance = rootInstance;
  const nextInstance = reconcile(container, previousInstance, element);
  rootInstance = nextInstance;
};

const reconcile = (parentDom, instance, element) => {
  const newInstance = instantiate(element);
  // 和之前render逻辑计划不变，如果上一个dom所对应实例存在，那么替换，没有就直接append
  if(instance === null) {
    parentDom.appendChild(newInstance.dom);
  } else {
    parentDom.replaceChild(newInstance.dom, instance.dom);
  }
  return newInstance;
};

// 和之前render功能相比，生成dom元素过程一致，增加处理子元素实例的过程，
// 没有了container，不会直接操作dom元素，这样就可以在后续通过对比新旧实例的差异再去操作dom。
const instantiate = (element) => {
  const { type, props, } = element;
  // 创建dom
  const node = isTextElement(type)
    ? document.createTextNode("")
    : document.createElement(type);
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
  // 子元素实例
  const childInstances = (props.children || []).map(instantiate);
  const childDoms = childInstances.map(childIns => childIns.dom);

  childDoms.forEach(childDom => node.appendChild(childDom));

  // 标准instance对象: dom, element, childInstances
  const instance = { dom: node, element, childInstances };

  return instance;
}