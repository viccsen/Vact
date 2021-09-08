const isEvent = (propsName) => {
  return propsName && propsName.startsWith('on');
};

const isAttribute = (propsName) => propsName && !isEvent(propsName) && propsName !== "children";

const isTextElement = (typeName) => typeName && typeName === "TEXT ELEMENT";

export {
  isEvent,
  isAttribute,
  isTextElement,
}