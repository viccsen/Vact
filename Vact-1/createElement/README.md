## createElement

JSX提供了一种语法糖来创建页面元素，而不是直接这样写：

``` javascript
const element = {
  type: "div",
  props: {
    id: "container",
    children: [
      { type: "input", props: { value: "foo", type: "text" } },
      {
        type: "a",
        props: {
          href: "/bar",
          children: [{ type: "TEXT ELEMENT", props: { nodeValue: "bar" } }]
        }
      },
      {
        type: "span",
        props: {
          onClick: e => alert("Hi"),
          children: [{ type: "TEXT ELEMENT", props: { nodeValue: "click me" } }]
        }
      }, {
        type: "TEXT ELEMENT",
        props: {
          nodeValue: "Viccsen"
        }
      }
    ]
  }
};
```

我们可以直接在jsx中这样添加页面元素：

``` javascript
  const element = (
  <div id="container">
    <input value="foo" type="text" />
    <a href="/bar">bar</a>
    <span onClick={e => alert("Hi")}>click me</span>
    Viccsen
  </div>
);
```

而浏览器其实是无法识别这种代码的，所以一般是通过像babel这种预处理器来将上面的代码转换成浏览器可处理的代码格式：

``` javascript
const element = createElement(
  "div",
  { id: "container" },
  createElement("input", { value: "foo", type: "text" }),
  createElement(
    "a",
    { href: "/bar" },
    "bar"
  ),
  createElement(
    "span",
    { onClick: e => alert("Hi") },
    "click me"
  ),
  "Viccsen"
);
```

所以我们需要做的就是创建createElement函数。其中createElement的参数包括元素类型（type）、原属属性（props），剩下的所有参数都是子元素。