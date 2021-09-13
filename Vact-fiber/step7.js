// 为输入fiber创建子fiber

const beginWork = (wipFiber) => {
  if(wipFiber.tag === CLASS_COMPONENT) {
    updateClassComponent(wipFiber);
  } else {
    updateHostComponent(wipFiber);
  }
};

// 处理HOST_*类型fiber
const updateHostComponent = (wipFiber) => {
  if(!wipFiber.stateNode) {
    wipFiber.stateNode = createDomElement(wipFiber);
  }
  const newChildElements = wipFiber.props.children;
  // todo
  reconcileChildrenArray(wipFiber, newChildElements);
};

const updateClassComponent = (wipFiber) => {
  let instance = wipFiber.stateNode;
  if(instance === null) {
    instance = wipFiber.stateNode = createInstance(wipFiber);
  } else if(wipFiber.props === instance.props && !wipFiber.partialState) {
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