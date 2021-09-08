// 创建新的props对象，并将children写入props中

function createElement(type, props, ...children) {
  let _props = Object.assign({}, props);
  // children可能为多个单独对象，也可能为一个完整数组，比如页面上map产生的列表
  _props.children = children.length ? [].concat(...children) : [];
  return { type, props: _props };
}
