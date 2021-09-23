
const performUnitOfWork = (fiber) => {
  const isFunctionComponent = fiber.type instanceof Function;
  if(isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    // updateHostComponent();
  }
};


const updateFunctionComponent = (fiber) => {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
};

const commitWork = (fiber) => {
  if(!fiber) {
    return;
  }

  // 针对fiber没有对应dom的function component的修改
  let parentFiber = fiber.parent;
  while (!parentFiber.dom) {
    parentFiber = parentFiber.parent;
  }

  const domParent = parentFiber.dom;
  if(fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if(fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDomProperties(fiber.dom, fiber.alternate.props, fiber.props);
  } else if(fiber.effectTag === "DELETION") {
    // domParent.removeChild(fiber.dom);
    // 针对没有dom的fiber的function component修改，直接删除可能不存在dom
    commitDeletion(fiber, domParent);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const commitDeletion = (fiber, domParent) => {
  if(fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
};