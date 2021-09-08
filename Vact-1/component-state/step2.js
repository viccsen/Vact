// 创建公共实例

/**
 *
 * @param {*} element 元素
 * @param {*} internalInstance reconcilie生成的实例，包含dom, element, childInstances，作为组件公共实例的内部实例
 * @returns
 */
const createPublicInstnace = (element, internalInstance) => {
  const { type, props } = element;
  const publicInstance = new type(props);
  publicInstance.__internalInstance = internalInstance;
  return publicInstance;
};

// 引用reconciliation step4
const instantiate = (element) => {
  const { type, props, children = [] } = element;
  // 判断是否是原生dom标签类型
  const isOriginalDomElement = typeof type === "string";
  if (isOriginalDomElement) {
    // 创建dom
    const node = isTextElement(type)
      ? document.createTextNode("")
      : document.createElement(type);
    //更新属性
    updateDomProperties(node, {}, props);
    // 子元素实例
    const childInstances = children.map(instantiate);
    const childDoms = childInstances.map((childIns) => childIns.dom);

    childDoms.forEach((childDom) => node.appendChild(childDom));

    // 标准instance对象: dom, element, childInstances
    const instance = { dom: node, element, childInstances };

    return instance;
  } else {
    // 处理组件类型的实例生成
    const instance = {};
    const publicInstance = createPublicInstnace(element, instance);
    // 获取组件中的元素
    const childElement = publicInstance.render && publicInstance.render();
    const childInstance = childElement && instantiate(childElement);
    const dom = childInstance.dom;
    // 所以组件实例比较特殊。和普通实例包含不同属性不甚相同
    Object.assign(instance, { dom, element, childInstance, publicInstance });

    return instance;
  }
};
