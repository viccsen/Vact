const resetNextUnitOfWork = () => {
  const update = updateQueue.shift();
  if (!update) {
    return;
  }

  if(update.partialState) {
    // 将组件状态对象保存到fiber对象中，后续组件render的时候会用到
    update.instance.__fiber.partialState = update.partialState;
  }

  // 根fiber对象
  // 第一次render不会存在__rootContainerFiber，所以第一次render的情况下root为null
  // 后续的render我们会在dom中获得_rootContainerFiber所对应的根fiber对象
  // 如果更新源自setState，那我们就需要最顶层的父fiber
  const root = update.from === HOST_ROOT ? update.dom.__rootContainerFiber : getRoot(update.instance.__fiber);

  // reset生成的unitOfWork关联的fiber是work-in-progress tree的根fiber
  nextUnitOfWork = {
    tag: HOST_ROOT,
    stateNode: update.dom || root.stateNode,
    props: update.newProps || root.props,
    alternate: root,
  };
};

const getRoot = fiber => {
  const node = fiber;
  while (node.parent) {
    node = node.parent;
  }
  return node;
};