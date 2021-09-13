// 重写Component，主要改变setState

class Component {
  constructor(props) {
    this.props = props;
    this.state = this.state || {};
  }

  setState(partialState) {
    scheduleUpdate(this, partialState);
  }
}

// 前文我们已经介绍过fiber的数据结构，包括type和props，且和我们之前的typs, props一致
const createInstance = (fiber) => {
  const {type, props} = fiber;
  const instance = new type(props);
  instance.__fiber = fiber; // 实例内部保留fiber引用，和之前公共实例内部保留元素实例相似
  return instance;
};