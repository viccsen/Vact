import { ElementType } from './utils/Enum';

/**
 * 
 * @param {*} wipFiber work-in-progress fiber
 */
const completeWork = (wipFiber) => {
  if(wipFiber.tag === ElementType.CLASS_COMPONENT) {
    // 更新class组件实例内部的__fiber引用
    wipFiber.stateNode.__fiber = fiber;
  }

  // 有parent的情况下将子fiber和当前fiber的effects列表都添加至父元素effects列表。
  // 没有则将pendingCommit赋值
  if(wipFiber.parent) {
    const childEffects = wipFiber.effects || [];
    const thisEffect = wipFiber.effectTag !== null ? [wipFiber] : [];
    const parentEffects = wipFiber.parent.effects || [];
    wipFiber.parent.effects = parentEffects.concat(childEffects, thisEffect);
  } else {
    pendingCommit = wipFiber;
  }
};