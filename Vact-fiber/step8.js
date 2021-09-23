import { EffectTagEnum, ElementType } from './utils/Enum';
import { arrify } from './utils/helper';

const reconcileChildrenArray = (wipFiber, childrenElements) => {
  // 因为fiber为class component时，childrenElements为render返回的子元素为可能为单个元素，所以这里要做数组化处理
  // 这也是为什么react16之后react能接受返回为数组格式的子元素列表
  const childrenElements = arrify(childrenElements);

  let index = 0;
  // wipFiber.alternate保存的是old tree上对应的old fiber
  let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null;
  // 准备创建的子fiber
  let newFiber = null;

  const elementLength = childrenElements.length;

  // 当oldFiber和childs不为空的时候，都可以生成新fiber
  while(index < elementLength || oldFiber !== null) {
    const prevFiber = newFiber;
    const element = elementLength ? childrenElements[index] : null;
    const isSameType = element && oldFiber && oldFiber.type === element.type;
    
    // 都存在且类型相同，更新
    if(isSameType) {
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
    if(element && !isSameType) {
      // 因为没有对应的旧fiber，所以这一步中没有alternate和stateNode属性，实例stateNode会在beginWork生成
      newFiber = {
        parent: wipFiber,
        type: element.type,
        props: element.props,
        effectTag: EffectTagEnum.PLACEMENT,
        tag: typeof element.type === "string" ? ElementType.HOST_COMPONENT : ElementType.CLASS_COMPONENT,
      };
    }

    // 旧的元素fiber存在，新的元素不存在，不创建新的fiber，把旧fiber tag改为删除
    if(oldFiber && !isSameType) {
      oldFiber.effectTag = EffectTagEnum.DELETION,
      wipFiber.effects = wipFiber.effects || [];
      wipFiber.effects.push(oldFiber);
    }

    if(oldFiber) {
      // 准备下一个fiber的比较，对应elements index+1
      oldFiber = oldFiber.sibling;
    }

    // 处理新生成的fiber，将其添加到work-in-progress tree
    if(index === 0) {
      wipFiber.child = newFiber;
    } else if(prevFiber && element) {
      // 只有在有新元素的情况下才会添加新fiber
      prevFiber.sibling = newFiber;
    }

    index++;

  }
};