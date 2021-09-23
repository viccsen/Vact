
let wipFiber = null;
let hookIndex = null;

const performUnitOfWork = (fiber) => {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];

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


const useState = (initial) => {
  // 如果旧的fiber存在历史状态，我们在初始化的时候会把历史状态赋予给新的hook，
  // 这样就保证下次setState触发的更新能拿到上次的更新结果
  const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };
  // 获取到历史的action列表
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    // 每次更新都以上一次状态为入参
    hook.state = action(hook.state);
  });
  const setState = (action) => {
    hook.queue.push(action);
    // 赋值nextUnitOfWork，触发新的更新
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };
  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
};