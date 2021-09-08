// 这一步我们主要比较element的type是否相同，如果相同则只更新属性，不做dom增删操作，
// 添加updateDomProperties更新属性函数，删除旧属性，添加新属性
import { isEvent, isAttribute, isTextElement } from "../utils/helper";

/**
 *
 * @param {*} parentDom 父元素
 * @param {*} instance 更新前元素对应的实例
 * @param {*} element 本次更新元素对象
 * @returns
 */
const reconcile = (parentDom, instance, element) => {
  // 和之前render逻辑计划不变，如果上一个dom所对应实例存在，那么替换，没有就直接append
  if (instance === null) {
    const newInstance = instantiate(element);
    parentDom.appendChild(newInstance.dom);
  } else if (instance.element.type === element.type) {
    // 感受到instance的强大没有！！！
    // 上一次保存的dom直接拿来使用，只需要两步：更新element，更新dom属性！不产生dom增删操作！
    updateDomProperties(instance.dom, instance.element.props, element.props);
    instance.element = element;
    return instance;
  } else {
    const newInstance = instantiate(element);
    parentDom.replaceChild(newInstance.dom, instance.dom);
  }
  return newInstance;
};

const instantiate = (element) => {
  const { type, props } = element;
  // 创建dom
  const node = isTextElement(type)
    ? document.createTextNode("")
    : document.createElement(type);
  //更新属性
  updateDomProperties(node, {}, props);
  // 子元素实例
  const childInstances = (props.children||[]).map(instantiate);
  const childDoms = childInstances.map((childIns) => childIns.dom);

  childDoms.forEach((childDom) => node.appendChild(childDom));

  // 标准instance对象: dom, element, childInstances
  const instance = { dom: node, element, childInstances };

  return instance;
};

// 删除旧属性，添加新属性
const updateDomProperties = (dom, prevProps, nextProps) => {
  Object.keys(prevProps).forEach((key) => {
    if (isEvent(key)) {
      // 处理事件
      const eventName = key.slice(2).toLowerCase();
      eventName && dom.removeEventListener(eventName, prevProps[key]);
    } else if (isAttribute(key)) {
      // 处理属性
      dom[key] = null;
    }
  });
  Object.keys(nextProps).forEach((key) => {
    if (isEvent(key)) {
      // 处理事件
      const eventName = key.slice(2).toLowerCase();
      eventName && dom.addEventListener(eventName, nextProps[key]);
    } else if (isAttribute(key)) {
      // 处理属性
      dom[key] = nextProps[key];
    }
  });
};
