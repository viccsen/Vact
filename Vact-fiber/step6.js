// 构建work-in-progress tree

const performUnitOfWork = (wipFiber) => {
  // 创建子fiber
  beginWork(wipFiber);
  // 如果当前fiber有子fiber，返回子fiber继续循环
  if(wipFiber.child) {
    return wipFiber.child;
  }

  // 如果没有子fiber，如果当前fiber没有兄弟fiber，则表示当前fiber已完成此次更新
  let uow = wipFiber;
  while(uow) {
    completeWork(uow);
    if(uow.sibling) {
      return uow.sibling;
    }
    uow = uow.parent;
  }
};