import { CLASS_COMPONENT, HOST_COMPONENT, HOST_ROOT } from './utils/Enum';

const updateQueue = [];
let nextUnitOfWork = null;
let pendingCommit = null;

// 每一次render都会向更新队列中添加一个更新对象
const render = (elements, containerDom) => {
  updateQueue.push({
    from: HOST_ROOT,
    dom: containerDom,
    newProps: {
      children: elements,
    }
  });
  requestIdleCallback(performWork);
};


// 每一次状态更新都会在update队列中添加一个更新对象
const scheduleUpdate = (instance, partialState) => {
  updateQueue.push({
    from: CLASS_COMPONENT,
    instance,
    partialState,
  });
  requestIdleCallback(performWork);
};