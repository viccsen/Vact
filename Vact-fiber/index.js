const arrify = (val) => {
  return val == null ? [] : Array.isArray(val) ? val : [val];
};

const ElementType = {
  CLASS_COMPONENT: "class",
  HOST_COMPONENT: "host",
  HOST_ROOT: "root",
  TEXT_ELEMENT: "TEXT ELEMENT",
};

const EffectTagEnum = {
  PLACEMENT: 1,
  DELETION: 2,
  UPDATE: 3,
};

const isEvent = (propsName) => {
  return propsName && propsName.startsWith("on");
};

const isAttribute = (propsName) =>
  propsName && !isEvent(propsName) && propsName !== "children";

const Vact = () => {
  // 第一步主要是结合requestIdleCallback去执行队列任务

  const ENOUGH_TIME = 1; //ms

  let nextUnitOfWork = null;

  const updateQueue = [];
  let pendingCommit = null;

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

  /**
   *
   * @param {*} parentDom 父元素
   * @param {*} fiber 当前更新fiber
   */
  const deleteChildren = (parentDom, fiber) => {
    let active = fiber;
    // console.log("delete children start");
    while (true) {
      if (active.tag === ElementType.CLASS_COMPONENT) {
        active = active.child;
        continue;
      }
      parentDom.removeChild(active.stateNode);
      // 当执行到最后一个子元素，重新赋值父元素，仅class组件情况
      while (active != fiber && !active.sibling) {
        active = active.parent;
      }

      if (active == fiber) {
        // 如果是dom元素，直接返回，如果是class组件，则在删除完组件下所有dom元素后返回
        // console.log("delete children end");
        return;
      }
      active = active.sibling;
    }
  };

  /**
   *
   * @param {*} fiber root fiber
   */
  const commitAllWork = (fiber) => {
    fiber.effects.forEach(commitWork);
    // 这就是我们之前提到的_rootContainerFiber，
    // 在一次更新完成后，work-in-progress-tree会自动变为old-tree，
    // 会给原root实例添加这个属性，保存old-fiber-tree。
    fiber.stateNode._rootContainerFiber = fiber;
    nextUnitOfWork = null;
    pendingCommit = null;
  };

  /**
   *
   * @param {*} effectiveFiber 有状态变化的fiber
   */
  const commitWork = (effectiveFiber) => {
    // 如果是根元素，不做处理
    if (effectiveFiber.tag == ElementType.HOST_ROOT) {
      return;
    }
    let parentFiber = effectiveFiber.parent;
    while (parentFiber.tag == ElementType.CLASS_COMPONENT) {
      // 如果当前fiber是class组件，那么就再往上寻找dom类型元素
      parentFiber = parentFiber.parent;
    }
    const parentDom = parentFiber.stateNode;

    // 开始处理dom
    if (
      effectiveFiber.effectTag === EffectTagEnum.PLACEMENT &&
      effectiveFiber.tag === ElementType.HOST_COMPONENT
    ) {
      // 新增
      parentDom.appendChild(effectiveFiber.stateNode);
    } else if (effectiveFiber.effectTag === EffectTagEnum.UPDATE) {
      // 更新属性
      updateDomProperties(
        effectiveFiber.stateNode,
        effectiveFiber.alternate.props,
        effectiveFiber.props
      );
    } else if (effectiveFiber.effectTag === EffectTagEnum.DELETION) {
      // 删除操作
      deleteChildren(parentDom, effectiveFiber);
    }
  };

  const getRoot = (fiber) => {
    // console.log("get root start");
    let node = fiber;
    while (node.parent) {
      node = node.parent;
    }
    // console.log("get root end");
    return node;
  };

  // 构建work-in-progress tree

  const performUnitOfWork = (wipFiber) => {
    // console.log("performUnitOfWork start");
    // 创建子fiber
    beginWork(wipFiber);
    // 如果当前fiber有子fiber，返回子fiber继续循环
    if (wipFiber.child) {
      return wipFiber.child;
    }

    // 如果没有子fiber，如果当前fiber没有兄弟fiber，则表示当前fiber已完成此次更新
    let uow = wipFiber;
    while (uow) {
      completeWork(uow);
      if (uow.sibling) {
        return uow.sibling;
      }
      uow = uow.parent;
    }
    // console.log("performUnitOfWork end");
  };

  const resetNextUnitOfWork = () => {
    const update = updateQueue.shift();
    if (!update) {
      return;
    }

    if (update.partialState) {
      // 将组件状态对象保存到fiber对象中，后续组件render的时候会用到
      update.instance.__fiber.partialState = update.partialState;
    }

    // 根fiber对象
    // 第一次render不会存在__rootContainerFiber，所以第一次render的情况下root为null
    // 后续的render我们会在dom中获得_rootContainerFiber所对应的根fiber对象
    // 如果更新源自setState，那我们就需要最顶层的父fiber
    const root =
      update.from === ElementType.HOST_ROOT
        ? update.dom.__rootContainerFiber
        : getRoot(update.instance.__fiber);

    // reset生成的unitOfWork关联的fiber是work-in-progress tree的根fiber
    nextUnitOfWork = {
      tag: ElementType.HOST_ROOT,
      stateNode: update.dom || root.stateNode,
      props: update.newProps || root.props,
      alternate: root,
    };
  };

  const workLoop = (deadline) => {
    if (!nextUnitOfWork) {
      resetNextUnitOfWork();
    }
    while (nextUnitOfWork && deadline.timeRemaining() > ENOUGH_TIME) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
    if (pendingCommit) {
      commitAllWork(pendingCommit);
    }
  };

  /**
   * 执行任务单元
   * @param {*} deadline requestIdleCallback的回调函数会接收到一个名为 IdleDeadline 的参数，这个参数可以获取当前空闲时间以及回调是否在超时时间前已经执行的状态。
   * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/IdleDeadline
   */
  const performWork = (deadline) => {
    workLoop(deadline);
    if (nextUnitOfWork || updateQueue.length) {
      requestIdleCallback(performWork);
    }
  };

  // 前文我们已经介绍过fiber的数据结构，包括type和props，且和我们之前的typs, props一致
  const createInstance = (fiber) => {
    const { type, props } = fiber;
    const instance = new type(props);
    instance.__fiber = fiber; // 实例内部保留fiber引用，和之前公共实例内部保留元素实例相似
    return instance;
  };

  // 每一次状态更新都会在update队列中添加一个更新对象
  const scheduleUpdate = (instance, partialState) => {
    updateQueue.push({
      from: ElementType.CLASS_COMPONENT,
      instance,
      partialState,
    });
    requestIdleCallback(performWork);
  };

  // 重写Component，主要改变setState

  class Component {
    constructor(props) {
      this.props = props;
      this.state = this.state || {};
    }

    setState(partialState) {
      scheduleUpdate(this, partialState);
    }
  }

  // 为输入fiber创建子fiber

  const beginWork = (wipFiber) => {
    if (wipFiber.tag === ElementType.CLASS_COMPONENT) {
      updateClassComponent(wipFiber);
    } else {
      updateHostComponent(wipFiber);
    }
  };

  function createElement(type, props, ...children) {
    let _props = Object.assign({}, props);
    // children可能为多个单独对象，也可能为一个完整数组，比如页面上map产生的列表
    const newChildren = children.length ? [].concat(...children) : [];
    // 如果child不是object，就重新创建一个render能识别的textNode对象
    _props.children = newChildren
      .filter((child) => child != null && child !== false)
      .map((child) =>
        child instanceof Object ? child : createTextElement(child)
      );

    return { type, props: _props };
  }

  function createTextElement(value) {
    return createElement(ElementType.TEXT_ELEMENT, { nodeValue: value });
  }

  function createDomElement(fiber) {
    const isTextElement = fiber.type === ElementType.TEXT_ELEMENT;
    const dom = isTextElement
      ? document.createTextNode("")
      : document.createElement(fiber.type);
    updateDomProperties(dom, [], fiber.props);
    return dom;
  }

  // 处理HOST_*类型fiber
  const updateHostComponent = (wipFiber) => {
    if (!wipFiber.stateNode) {
      wipFiber.stateNode = createDomElement(wipFiber);
    }
    const newChildElements = wipFiber.props.children;
    // todo
    reconcileChildrenArray(wipFiber, newChildElements);
  };

  const updateClassComponent = (wipFiber) => {
    let instance = wipFiber.stateNode;
    if (!instance) {
      instance = wipFiber.stateNode = createInstance(wipFiber);
    } else if (wipFiber.props === instance.props && !wipFiber.partialState) {
      // 如果即将更新的fiber的props和原实例的props相同且没有新的state更新，那么就不需要再进行更新了，这也相当于简单的shouldComponentUpdate
      // todo
      cloneChildFibers(wipFiber);
      return;
    }

    instance.props = wipFiber.props;
    instance.state = Object.assign({}, instance.state, wipFiber.partialState);
    wipFiber.partialState = null;

    const newChildElements = wipFiber.stateNode.render();
    reconcileChildrenArray(wipFiber, newChildElements);
  };

  const reconcileChildrenArray = (wipFiber, children) => {
    // 因为fiber为class component时，childrenElements为render返回的子元素为可能为单个元素，所以这里要做数组化处理
    // 这也是为什么react16之后react能接受返回为数组格式的子元素列表
    const childrenElements = arrify(children);

    let index = 0;
    // wipFiber.alternate保存的是old tree上对应的old fiber
    let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
    // 准备创建的子fiber
    let newFiber = null;

    const elementLength = childrenElements.length;
    // console.log("reconcileChildrenArray start");
    // 当oldFiber和childs不为空的时候，都可以生成新fiber
    while (index < elementLength || oldFiber != null) {
      const prevFiber = newFiber;
      const element = elementLength ? childrenElements[index] : null;
      const isSameType = element && oldFiber && oldFiber.type == element.type;

      // 都存在且类型相同，更新
      if (isSameType) {
        newFiber = {
          parent: wipFiber,
          tag: oldFiber.tag,
          type: oldFiber.type,
          alternate: oldFiber,
          props: element.props,
          stateNode: oldFiber.stateNode,
          partialState: oldFiber.partialState,
          effectTag: EffectTagEnum.UPDATE,
        };
      }

      // 新的元素存在，但类型不相同，替换
      if (element && !isSameType) {
        // 因为没有对应的旧fiber，所以这一步中没有alternate和stateNode属性，实例stateNode会在beginWork生成
        newFiber = {
          parent: wipFiber,
          type: element.type,
          props: element.props,
          effectTag: EffectTagEnum.PLACEMENT,
          tag:
            typeof element.type === "string"
              ? ElementType.HOST_COMPONENT
              : ElementType.CLASS_COMPONENT,
        };
      }

      // 旧的元素fiber存在，新的元素不存在，不创建新的fiber，把旧fiber tag改为删除
      if (oldFiber && !isSameType) {
        (oldFiber.effectTag = EffectTagEnum.DELETION),
          (wipFiber.effects = wipFiber.effects || []);
        wipFiber.effects.push(oldFiber);
      }

      if (oldFiber) {
        // 准备下一个fiber的比较，对应elements index+1
        oldFiber = oldFiber.sibling;
      }

      // 处理新生成的fiber，将其添加到work-in-progress tree
      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (prevFiber && element) {
        // 只有在有新元素的情况下才会添加新fiber
        prevFiber.sibling = newFiber;
      }

      index++;
    }

    // console.log("reconcileChildrenArray end");
  };

  /**
   *
   * @param {*} wipFiber work-in-progress fiber
   */
  const cloneChildFibers = (wipFiber) => {
    const oldFiber = wipFiber.alternate;
    if (!oldFiber.child) {
      return;
    }

    let oldChild = oldFiber.child;
    let prevChild = null;

    while (oldChild) {
      const newChild = {
        tag: oldChild.tag,
        type: oldChild.type,
        props: oldChild.props,
        stateNode: oldChild.stateNode,
        partialState: oldChild.partialState,
        alternate: oldChild,
        parent: wipFiber,
      };

      if (prevChild) {
        prevChild.sibling = newChild;
      } else {
        wipFiber.child = newChild;
      }
      prevChild = newChild;
      oldChild = oldChild.sibling;
    }
  };

  /**
   *
   * @param {*} wipFiber work-in-progress fiber
   */
  const completeWork = (wipFiber) => {
    if (wipFiber.tag === ElementType.CLASS_COMPONENT) {
      // 更新class组件实例内部的__fiber引用
      wipFiber.stateNode.__fiber = wipFiber;
    }

    // 有parent的情况下将子fiber和当前fiber的effects列表都添加至父元素effects列表。
    // 没有则将pendingCommit赋值
    if (wipFiber.parent) {
      const childEffects = wipFiber.effects || [];
      const thisEffect = wipFiber.effectTag != null ? [wipFiber] : [];
      const parentEffects = wipFiber.parent.effects || [];
      wipFiber.parent.effects = parentEffects.concat(childEffects, thisEffect);
    } else {
      pendingCommit = wipFiber;
    }
  };

  // 每一次render都会向更新队列中添加一个更新对象
  const render = (elements, containerDom) => {
    updateQueue.push({
      from: ElementType.HOST_ROOT,
      dom: containerDom,
      newProps: {
        children: elements,
      },
    });
    requestIdleCallback(performWork);
  };

  return {
    createElement,
    Component,
    render,
  };
};

module.exports = Vact();
