//step1: 通过虚拟dom创建真实dom
const render = (element, container) => {
  const { type, children } = element;
  // 创建dom
  const node = document.createElement(type);
  const childElements = children || [];
  // 递归children
  childElements.forEach((child) => render(child, node));
  container.appendChild(node);
};
