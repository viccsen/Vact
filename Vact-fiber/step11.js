import { ElementType, EffectTagEnum } from './utils/Enum';

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
  if(effectiveFiber.tag === ElementType.HOST_ROOT) {
    return;
  }
  let parentFiber = effectiveFiber.parent;
  while(parentFiber.tag === ElementType.CLASS_COMPONENT) {
    // 如果当前fiber是class组件，那么就再往上寻找dom类型元素
    parentFiber = parentFiber.parent;
  }
  const parentDom = parentFiber.stateNode;

  // 开始处理dom
  // 新增
  if(effectiveFiber.effectTag === EffectTagEnum.PLACEMENT && effectiveFiber.tag === ElementType.HOST_COMPONENT) {
    parentDom.appendChild(effectiveFiber.stateNode);
  }
  // 更新属性
  else if(effectiveFiber === EffectTagEnum.UPDATE) {
    updateDomProperties(effectiveFiber.stateNode, effectiveFiber.alternate.props, effectiveFiber.props);
  }
  // 删除操作
  else if (effectiveFiber.effectTag === EffectTagEnum.DELETION) {
    deleteChildren(parentDom, effectiveFiber);
  }
};

/**
 * 
 * @param {*} parentDom 父元素
 * @param {*} fiber 当前更新fiber
 */
const deleteChildren = (parentDom, fiber) => {
  let active = fiber;

  while(true) {
    if(active.tag === ElementType.CLASS_COMPONENT) {
      active = active.child;
      continue;
    }
    parentDom.removeChild(active.stateNode);
    // 当执行到最后一个子元素，重新赋值父元素，仅class组件情况
    while(active !== fiber && !active.sibling) {
      active = active.parent;
    }

    if(active === fiber) {
      // 如果是dom元素，直接返回，如果是class组件，则在删除完组件下所有dom元素后返回
      return;
    }
    active = active.sibling;
  }
}