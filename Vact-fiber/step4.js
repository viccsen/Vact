const ENOUGH_TIME = 1; //ms

const performWork = (deadline) => {
  workLoop(deadline);
  if(nextUnitOfWork || updateQueue.length) {
    requestIdleCallback(performWork);
  }
}


const workLoop = (deadline) => {
  if(!nextUnitOfWork) {
    resetNextUnitOfWork();
  }
  while(nextUnitOfWork && deadline.timeRemaining() > ENOUGH_TIME) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  if(pendingCommit) {
    commitAllWork(pendingCommit);
  }
};