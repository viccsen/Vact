// 这一步我们主要处理当新的子元素个数比实例更少，element为null的情况下怎么处理协调函数

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
  } else if (instance.element.type === element.type) {
    // 感受到instance的强大没有！！！
    // 上一次保存的dom直接拿来使用，只需要两步：更新element，更新dom属性！不产生dom增删操作！
    updateDomProperties(instance.dom, instance.element.props, element.props);
    // 递归更新子元素实例
    // 第五步之后childInstances就有可能变少了
    instance.childInstances = reconcileChildren(instance, element);
    instance.element = element;
    return instance;
  } else {
    newInstance = instantiate(element);
    parentDom.replaceChild(newInstance.dom, instance.dom);
  }
  return newInstance;
};

/**
 * 
 * @param {*} instance 更新前元素对应的实例
 * @param {*} element 本次更新元素对象
 */
 const reconcileChildren = (instance, element) => {
  const {dom, childInstances} = instance;
  const nextChildElement = element.props.children || [];
  const maxCount = Math.max(childInstances.length, nextChildElement.length);
  let newChildInstances = [];
  for (let i = 0; i < maxCount; i++) {
    const childIns = childInstances[i];
    const childEle = nextChildElement[i];
    const newInstance = reconcile(dom, childIns, childEle);
    // 处理instance为null的情况
    if(newInstance) {
      newChildInstances.push(newInstance);
    }
  }
  return newChildInstances;
};