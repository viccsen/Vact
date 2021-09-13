// 第一步主要是结合requestIdleCallback去执行队列任务

const ENOUGH_TIME = 1; //ms

let workQueue = [];
let nextUnitOfWork = null;

/**
 * 调度函数
 * @param {*} task 任务单元
 */
const schedule = (task) => {
  workQueue.push(task);
  requestIdleCallback(performWork);
};

/**
 * 执行任务单元
 * @param {*} deadline requestIdleCallback的回调函数会接收到一个名为 IdleDeadline 的参数，这个参数可以获取当前空闲时间以及回调是否在超时时间前已经执行的状态。
 * 参考 https://developer.mozilla.org/zh-CN/docs/Web/API/IdleDeadline
 */
const performWork = (deadline) => {
  if(!nextUnitOfWork) {
    nextUnitOfWork = workQueue.shift();
  }

  while(nextUnitOfWork && deadline.timeRemaining() > ENOUGH_TIME) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  if(nextUnitOfWork || workQueue.length) {
    requestIdleCallback(performWork);
  }
};