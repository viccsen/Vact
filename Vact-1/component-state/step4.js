// 更新reconcile协调函数，处理component组件类型元素

/**
 *
 * @param {*} parentDom 父元素
 * @param {*} instance 更新前元素对应的实例
 * @param {*} element 本次更新元素对象
 * @returns
 */
 const reconcile = (parentDom, instance, element) => {
  // 和之前render逻辑计划不变，如果上一个dom所对应实例存在，那么替换，没有就直接append
  let newInstance;
  if (instance === null) {
    newInstance = instantiate(element);
    parentDom.appendChild(newInstance.dom);
  } else if (element === null) {// 处理element为null
    parentDom.removeChild(instance.dom);
    return null;
  } else if (instance.element.type !== element.type) {
    newInstance = instantiate(element);
    parentDom.replaceChild(newInstance.dom, instance.dom);
  } else if(typeof element.type === 'string') {
 // 感受到instance的强大没有！！！
    // 上一次保存的dom直接拿来使用，只需要两步：更新element，更新dom属性！不产生dom增删操作！
    updateDomProperties(instance.dom, instance.element.props, element.props);
    // 递归更新子元素实例
    // 第五步之后childInstances就有可能变少了
    instance.childInstances = reconcileChildren(instance, element);
    instance.element = element;
    return instance;
  } else {
    // 如果是组件的情况下，包含公共实例，单个子元素
    instance.publicInstance.props = element.props; // 更新公共实例属性
    const childElement = instance.publicInstance.render(); // 生成新的子元素
    const oldInstance = instance.childInstance; // 更新前子元素实例
    const childInstance = reconcile(parentDom, oldInstance, childElement); // 新的子元素实例
    instance.dom = childInstance.dom;
    instance.childInstance = childInstance;
    instance.element = element;
    return instance;
  }
  return newInstance;
};
