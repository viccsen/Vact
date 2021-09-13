export const arrify = (val) => {
  return val === null ? [] : Array.isArray(val) ? val : [val];
};