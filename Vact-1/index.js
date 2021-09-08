import { isEvent, isAttribute, isTextElement } from "./utils/helper";
import { ElememtType } from "./utils/Enum";

const generater = () => {
  let rootInstance = null;

  /**
   *
   * @param {*} instance 更新前元素对应的实例
   * @param {*} element 本次更新元素对象
   */
  const reconcileChildren = (instance, element) => {
    const { dom, childInstances } = instance;
    const nextChildElement = element.props.children || [];
    const maxCount = Math.max(childInstances.length, nextChildElement.length);
    let newChildInstances = [];
    for (let i = 0; i < maxCount; i++) {
      const childIns = childInstances[i];
      const childEle = nextChildElement[i];
      const newInstance = reconcile(dom, childIns, childEle);
      // 处理instance为null的情况
      if (newInstance) {
        newChildInstances.push();
      }
    }
    return newChildInstances;
  };

  // 删除旧属性，添加新属性
  const updateDomProperties = (dom, prevProps, nextProps) => {
    Object.keys(prevProps).forEach((key) => {
      if (isEvent(key)) {
        // 处理事件
        const eventName = key.slice(2).toLowerCase();
        eventName && dom.removeListener(eventName, prevProps[key]);
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
    const { type, props } = element;
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
      const childInstances = (props.children || []).map(instantiate);
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
    } else if (element === null) {
      // 处理element为null
      parentDom.removeChild(instance.dom);
      return null;
    } else if (instance.element.type !== element.type) {
      newInstance = instantiate(element);
      parentDom.replaceChild(newInstance.dom, instance.dom);
    } else if (typeof element.type !== "string") {
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

  class Component {
    constructor(props) {
      this.props = props;
      this.state = this.state || {};
    }

    setState(partialState) {
      this.state = Object.assign({}, this.state, partialState);
      updateInstance(this.__internalInstance);
    }
  }

  const updateInstance = (internalInstance) => {
    const parentDom = internalInstance.dom.parentNode;
    const element = internalInstance.element;
    reconcile(parentDom, internalInstance, element);
  };

  const render = (element, container) => {
    const previousInstance = rootInstance;
    const nextInstance = reconcile(container, previousInstance, element);
    rootInstance = nextInstance;
  };

  return {
    render,
    Component,
    createElement,
  };
};

const Vact = generater();

export default Vact;
