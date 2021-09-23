## 前言
从头开始完成react的重写，本次重写与Vact版本相比，差异有:
- hooks
- concurrent Mode（requestIdleCallback）
- 包含了Render和Commit阶段（commit阶段其实最主要是之前我们写的commitAllWork收尾阶段）
- Function Component（其实和处理Class组件有异曲同工之妙，脑补一下，render()和app()都得到的是子元素）

建议学习的同学可以先看看Vact-1和Vact-fiber。
其中有一点大家日常都用到的，就是在react16.8之后，我们就可以使用hooks让函数组件应用的场景基本覆盖class组件，
包括，初始化，更新需要处理的数据处理和组件销毁的场景，还有第三方插件比如redux状态管理也可以使用hooks。
可以参考一下[HOOKS简介](https://zh-hans.reactjs.org/docs/hooks-intro.html)，其中有提到写hooks的动机我觉得很有意思，
包括：
- 优化一些高阶组件和第三方插件的使用。通常使用高阶组件和插件都会以原组件做参数一层层嵌套函数，使用非常麻烦，也可以称之为潜逃地狱。
- 组件复杂状态下会更难处理。因为我们一般会在class组件等生命周期里处理数据，如果状态太复杂整理起来就会比较难理解。
- class组件学习成本更高。在使用class组件的时候必须理解this的工作方式，必须将函数绑定到class实例。
- 就目前的工具来说，class组件不能很好的压缩，也会使HMR不稳定。

> 从概念上讲，React 组件一直更像是函数。而 Hook 则拥抱了函数，同时也没有牺牲 React 的精神原则。

所以，拥抱hooks吧！

### Step1 Function Components

我们之前处理过Class组件，那么Function Component又有什么不一样呢？
直接上栗子：

``` javascript
/** @jsx Vact.createElement */
function App(props) {
  return <h1>Hi {props.name}</h1>
}
const element = <App name="foo" />
const container = document.getElementById("root")
Vact.render(element, container)
```
经过预处理器解析后，我们得到的js代码是：

``` javascript
function App(props) {
  return Vact.createElement(
    "h1",
    null,
    "Hi ",
    props.name
  )
};
const element = Vact.createElement(App, {
  name: "foo",
});
const container = document.getElementById("root")
Vact.render(element, container)
```
可以看出来，经过预处理器解析后得到的数据结构和普通元素其实是一致的，所以在createElement这里无需做特殊处理。那么不一样的地方呢？

- 一个函数组件对应的fiber没有对应dom
- 子元素children来源于函数运行而不是children属性

而我们一旦获取到children，就可以按照之前的reconciliation进行更新，不需要其他更改。

如果fiber没有dom的话我们还需要处理`commitWork`。

### Step2 hooks

终于可以在函数中添加状态了！
我们的目标是：

``` javascript
  function Counter() {
    const [count, setCount] = useState(0);
    return (
      <div>
        <p>{count}</p>
        <button onClick={() => setCount(count => count+1)}>click add</button>
      </div>
    );
  }
```

我们在处理函数更新的时候处理状态更新。
为了能够按顺序处理hooks，我们需要定义一些全局变量，包括`wipFiber`（当前工作fiber），
`hookIndex`当前应该更新hook的index。
其中`wipFiber`包括`hooks`属性，保存的是当前组件的所有hook组成的链表。每个hook保存独自的状态和action列表。

### others

剩下的内容和我们之前的vact编写过程大同小异，但过程更加流畅，后续我也会去整理，敬请期待。