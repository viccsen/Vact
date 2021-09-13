
/**
 * 
 * @param {*} wipFiber work-in-progress fiber
 */
const cloneChildFibers = (wipFiber) => {
  const oldFiber = wipFiber.alternate;
  if(!oldFiber.child) {
    return;
  }

  let oldChild = oldFiber.child;
  let prevChild = null;

  while(oldChild) {
    const newChild = {
      tag: oldChild.tag,
      type: oldChild.type,
      props: oldChild.props,
      stateNode: oldChild.stateNode,
      partialState: oldChild.partialState,
      alternate: oldChild,
      parent: wipFiber,
    };

    if(prevChild) {
      prevChild.sibling = newChild;
    } else {
      wipFiber.child = newChild;
    }
    prevChild = newChild;
    oldChild = oldChild.sibling;
  }
};