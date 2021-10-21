## 前言
本文是基于[Build your own React](https://pomb.us/build-your-own-react/)，也并不会逐句进行翻译，我会根据自己理解把原文表达的意思尽可能写下来，
如果有觉得表达不准确的地方，大家可以多参考参考原文。

我们会按照React(16.8)的真实架构，从头开始写一遍React，但就不会包含一些优化和对架构来说不必要的功能。
如果你有看过我[之前版本的Vact源码编写](https://github.com/viccsen/Vact/blob/master/Vact-1/README.md)，那这次16.8的版本包含的不同的地方就有hooks和Function Component。

步骤：

1. createElement函数
2. render函数
3. Concurrent Mode（requestIdleCallback）
4. fibers
5. render和commit阶段
6. Reconciliation（协调函数）
7. 函数组件
8. hooks

## 准备
我们先来复习一下react/DOM Elements/JSX之间的关系。

首先我们一般是这样使用react的，
```javascript
// 创建react_element
const element = <h1 class="header">Hello World</h1>;
// 获取页面dom元素并通过render将react_element作为dom元素子元素渲染到页面中
ReactDOM.render(element, document.getElementById("root"));
```

接下来我们看一看预处理器（一般babel）解析后的javascript代码：

```javascript
const element = React.createElement("h1", {className: "header"}, "Hello World");
ReactDOM.render(element, document.getElementById("root"));
```

其实这个过程很简单，把元素的tag（如果是类组件或者函数组件就是其本身）和属性，子元素作为参数调用`React.createElement`（可自定义，默认React.createElement）函数。
所以我们从这路可以看出来`React.createElement`的大概用法，接受元素的属性作为参数，返回一个对象，然后再处理一些特殊的验证，后面会讲到。所以其实render拿到的就是createElement最后输出的对象再进行后续更新。
通过`React.createElement`我们得到：
```javascript
const element = {
  type: "h1",
  props: {
    className: "header",
    children: "Hello World"
  }
};
```
可以看出来，我们这里只是把children放到props中去了，所以createElement目前为止其实是相对简单的。
childern其实通常是数组，所以整个elements对象是一个树状结构。

接下来我们看一下另外一个函数`ReactDOM.render`。
首先我们看一下render的参数，包含`React.createElement`处理之后传过来的element对象和container。
通过element中的type创建dom元素，再更新dom属性：
```javascript
// element特指React.Element，node特指dom元素
  const {type, props} = element;
  const node = document.createElement(type);
  // 将props对象中的属性逐一添加到node对象中
  node["classname"] = props.classname;
```
接下来我们再处理children，是我们都知道React.Element对象包含type，props对象，那么刚才我们的"Hello World"文本对象要怎么处理呢？
所以对于文本对象来说，就需要做一些特殊处理：
```javascript
const {type, props} = element;
const text = document.createTextNode("");
text["nodeValue"] = element.props.children;
// 最后将text元素append到container
container.appendChild(text);
```
这样我们就不需要去专门再去设置父元素的innerText了，这样对于一个文本元素来说就可以也当作一个普通元素来处理了。
到现在为止，我们就实现了在没有React的情况下，和react一样的处理react元素并渲染dom到页面的最简单实现。
```javascript
const element = {
  type: "h1",
  props: {
    className: "header",
    children: "Hello World"
  }
};
const container = document.getElementById("root");
const {type, props} = element;
const node = document.createElement(type);
node["classname"] = props.classname;
const text = document.createTextNode("");
text["nodeValue"] = element.props.children;

node.appendChild(text);
container.appendChild(node);
```

### 第一步：CreateElement

接下来我们就会按照React的思路，一步一步构建属于我们自己的react。
首先我们得知道的是我们平时使用的jsx是通过第三方编译工具编译成js代码的然后调用`createElement`生成我们需要的element对象。
上面能看到我们的元素对象包含两个属性，type和props，所以在通过编译器处理后的页面元素传递给`createElement`函数最终也会得到包含type和props属性的对象。

```javascript
/** @jsx createElement */
const element = createElement("div", {
  id: "foo"
}, createElement("h1", {
  className: "header"
}, "hello world"), createElement("p", null, "welcome to react"), createElement("i", null));
```

而编译器会传递给我们的元素参数基本就如上所示，有兴趣的小伙伴可以去[babel提供的工具](https://babeljs.io/repl#?browsers=&build=&builtIns=false&corejs=3.6&spec=false&loose=false&code_lz=PQKhAIAECsGcA9wGMBOBTAhgFzQUQDZoC2aAdluCMAFDVID2psFahJ54AvOABTXgAeACYBLAG7gRQzgCIAZvXoyAfPwCQAgBYBGZPgyxYszZiFoUKk_nz1wAd3op8QgcB2rwnwQAdld1gwk4Fi26BhIWK6-_F4CIsAerqJiqgCUANy0QA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=true&fileSize=false&timeTravel=false&sourceType=module&lineWrap=false&presets=react&prettier=false&targets=&version=7.15.8&externalPlugins=&assumptions=%7B%7D)尝试一下。
我们现在知道了我们需要什么（type和props），我们的参数是什么，那么最简单的函数我们就可以得出来了：
```javascript
function createElement(type, props, ...children) {
  return ({
    type,
    props: {
      ...props,
      children
    },
  });
}
```
那上面的`createElement`能得到的结果就是：
```javascript
const element = {
  type: "div",
  props: {
    id: "foo",
    children: [{
      type: "h1",
      props: {
        className: "header",
        children: [{ type: "TEXT_ELEMENT", props: {nodeValue: "hello world", children: []}}]
      }
    }, {
      type: "p",
      props: {
        children: [{ type: "TEXT_ELEMENT", props: {nodeValue: "welcome to react", children: []}}]
      }
    }, {
      type: "i",
      props: {
        children: []
      }
    }]
  }
}
```

大家有没有注意到我们的tyoe有一个很特别的`TEXT_ELEMENT`，这是我们为了统一element的数据结构定义对string类型元素的一种特殊定义。
因为我们编写的代码和react源码还是有很多区别的，所以这里就可以用一个我们自己喜欢的库名了，比我我就叫他Vact。

那我们用了自己命名的库之后怎么告诉babel给我的`Vact.createElement`传递元素参数呢？
其实很简单：

```javascript
/** @jsx Vact.createElement */
const element = createElement("div", {
  id: "foo"
}, createElement("h1", {
  className: "header"
}, "hello world"), createElement("p", null, "welcome to react"), createElement("i", null));
```
如上，顶部注释的`createElement`改为`Vact.createElement`，当然也可以在babel配置中修改，有兴趣的同学可以自行查询。
这样我们在得到最终的元素对象的时候就是通过我们自己定义的`Vact.createElement`调用后得到的元素。

### 第二步：render

拿到element后，我们需要做的就是通过`Vact.render`将其渲染到页面。
首先我们知道，render也包含两个参数，element和container。即`Vact.render(element, container)`。
其实render在这里我们只需要知道其功能是渲染元素到dom中，所以我们可以做如下处理：

1. 创建dom元素
2. 更新元素属性
4. 递归处理子元素

```javascript
function render(element, container) {
  const {type, props, children} = element;
  const isProperty = key => key !== "children";
  // 考虑之前我们处理的字符串节点的特殊情况，我们在这里也会做特殊处理
  const dom = type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(type);
  Object.keys(props).forEach(key => {
    if(isProperty(key)) {
      dom[key] = props[key];
    }
  });
  children.forEach(child => render(child, dom));
  container.appendChild(dom);
}
```
以上就是在不考虑元素更新还有一些特殊处理比如事件监听到处理情况下的`render`函数。基本功能就是通过react提供的元素对象渲染出相应的dom元素并更新至页面。

### 第三步：Concurrent Mode(并发模式)

Concurrent Mode是React17开始支持的一种模式，是伴随着react的重构，fiber的诞生的新功能。[了解更多](https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html)

> There’s a problem with this recursive call.
> Once we start rendering, we won’t stop until we have rendered the complete element tree. If the element tree is big, it may block the main thread for too long. 
  And if the browser needs to do high priority stuff like handling user input or keeping an animation smooth, it will have to wait until the render finishes.

最简单直接的原因就是如果按照我们上面的写法，一旦我们开始了一次渲染，就需要将页面上的元素全部递归处理完之后才能处理其他工作。
如果当前存在需要及时响应的操作，比如用户输入，或者页面动画，那么主进程就会被阻塞直到我们处理结束，这样就会带来不友好的体验。

所以我们需要做的就是将任务碎片化处理，我们可以称之为任务单元，每完成一个任务单元之后如果浏览器有其他优先级更高的任务需要处理，
那我们会等待浏览器处理完高优先级任务之后再继续我们的单元任务。

```javascript
// render function
let nextUnitOfWork = null;

function workLoop(deadLine) {
  // 停止任务
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 这里我们使用浏览器提供的方法：requestIdleCallback，它以callback函数作为参数，会为callback提供deadline参数
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

function performUnitOfWork(){
  // TODO
}
```

其中使用的`requestIdleCallback`函数，简单来说就是浏览器在空闲时间会调用其callback函数，大家可以参考[这里](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback);
在react中没有使用浏览器提供的requestIdleCallback函数，可能是因为还是实验性功能，所以react自己写了[Scheduler](https://github.com/facebook/react/tree/main/packages/scheduler)用于调度任务。
但我们这里用其实功能上是一致的。

> As of November 2019, Concurrent Mode isn’t stable in React yet. 
>  The stable version of the loop looks more like this:
> ```javascript
> while (nextUnitOfWork) {    
>  nextUnitOfWork = performUnitOfWork(   
>    nextUnitOfWork  
>  ) 
>}
> ```
> 所以如果不是手动启用，一般我们目前还是不会开启Concurrent Mode。

所以我们需要怎么才能开始接下来的工作呢，在我们更新render函数之后，可以看到，我们现在就需要定义第一个`nextUnitOfWork`，定义`performUnitOfWork`函数。
其中`performUnitOfWork`函数的功能则是Fiber Tree的更新以及返回一个新的`nextUnitOfWork`对象。Fiber Tree后续我们会讲到，敬请期待。

### 第四步：Fiber

前面我们提到了Fiber Tree，所以我们接下来就继续了解fiber的结构和功能。
首先，我们把一个元素对应一个fiber，而每个fiber会作为一个工作单元（unitIfWork），如果我们的页面结构是这样的：

```javascript
class App extends Vact.Component {
  render() {
    return (<h1>
      <i/>
      <span>
        <b/>
      </span>
    </h1>);
  }
};

Vact.render(<App/>, document.createElement('div'));
```
看一下Fiber Tree的结构：

![fiber tree structure](https://res.viccsen.com/study/react/fibertree.png!t)

我们可以看到在上面的结构中Fiber Tree其实就是一个链表，这样就能很方便的找到每个fiber的兄弟fiber和父fiber。
在render函数中我们会创建root fiber，并把其赋值给nextUnitOfWork，然后在performUnitOfWork函数中，我们会做大致三件事：
1. 添加元素到dom中
2. 为element的children都创建其对应的fiber
3. 选择下一个nextUnitOfWOrk去进行下一次performUnitOfWork（子fiber或者兄弟fiber或者父元素的兄弟元素）
```javascript
// 首先我们会把render中的代码提取出来
function createDom(fiber) {
  const {type, props, } = fiber;
  const isProperty = key => key !== "children";
  // 考虑之前我们处理的字符串节点的特殊情况，我们在这里也会做特殊处理
  const dom = type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(type);
  Object.keys(props).forEach(key => {
    if(isProperty(key)) {
      dom[key] = props[key];
    }
  });
  return dom;
}
let nextUnitOfWork = null;
let wipRoot = null; // work-in-progress root fiber

function render(element, container) {
  // 在render函数中我们初始化root fiber
  // 在这里我们引入wipRoot变量，指的是work-in-progress tree的root fiber，后续会说明我们为什么需要work-in-progress tree
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    }
  };
  nextUnitOfWork = wipRoot;
}

function performUnitOfWork(fiber) {
  // 如果dom不存在，我们创建
  const {props} = fiber;
  const childElements = props.children;
  
  let index = 0;
  let prevSibling = null;

  if(!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  if(fiber.parent) {
    fiber.parent.dom.append(fiber.dom);
  }

  // 创建所有的child fiber并把这些fiber关联到原fiber的child属性
  while(index < childElements.length) {
    const child = childElements[index];
    const childFiber = {
      type: child.type,
      props: child.props,
      parent: fiber,
      dom: null
    };
    if(index === 0) {
      // 如果是第一个那么直接是child
      fiber.child = childFiber;
    } else {
      // 后续则都是兄弟fiber
      prevSibling.sibling = childFiber;
    }
    // 保存上一个fiber引用
    prevSibling = childFiber;
    index++;
  }
  // 如果存在child fiber，直接返回
  if(fiber.child) {
    return fiber.child;
  }

  // 如果不存在child fiber，返回兄弟fiber，如果不存在兄弟fiber，则寻找parent fiber的兄弟fiber作为nextUnitOfWork
  let nextFiber = fiber;

  while(nextFiber) {
    if(nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}
```
以上就是我们peformUnitOfWork的主要内容，简单概括就是更新当前fiber，生成子fiber，返回下一个fiber。
目前处理当前fiber比较简单，是直接创建新的dom然后添加到页面，没有涉及到更新等操作，后续我们会继续完善。

### 第五步：Render and Commit Phases

在上一步中我们可以看到：
```javascript
if(fiber.parent) {
    fiber.parent.dom.append(fiber.dom);
  }
```
我们在每一次处理fiber的过程中都会直接将dom添加到dom tree中，那就会直接展现到页面上。而我们现在的fiber tree的更新是可中断的，所以如果这样做就会导致用户在页面上能看到不完整的UI，因此我们这里不能这样做，即每次处理fiber都去更新dom，我们得把这个操作记录下来，最后一起处理dom更改。

在上面的workloop中：
```javascript
let nextUnitOfWork = null;

function commitRoot() {
  // TODO: 其实我们看出来这一步应该是完成最后所有的更新工作
};

function workLoop(deadLine) {
  // 停止任务
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 这里我们使用浏览器提供的方法：requestIdleCallback，它以callback函数作为参数，会为callback提供deadline参数
    shouldYield = deadline.timeRemaining() < 1;
  }
  if(!nextUnitOfWork && wipRoot) {
    // 如果不存在下一个fiber工作单元，那说明已经处理完fiber tree的所有fiber，我们就可以开始收尾工作了
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);
```

### 第六步：Reconciliation（协调）

接着上一步我们继续完善`commitRoot`：

```javascript
function commitRoot() {
  commitWork(wipRoot.child);
  wipRoot = null;
}
function commitWork(fiber) {
  if(!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```
目前为止，我们看到的处理dom都是生成新的dom，那接下来我们就开始处理dom的更新和删除。
那怎么判断dom是更新还是删除呢？
这就要提到我们上面提出来的`work-in-progress tree`了，我们可以称之为工作树，那有当前正在工作的tree，对应的肯定也存在`old fiber tree`了，我们称之为历史树，历史树保存上一次更新后保存起来的整个fiber tree。
所以我们要怎么保存`old fiber tree`呢？

```javascript
  function commitRoot() {
    commitWork(wipRoot.child);
    // commit完成之后，保存历史fiber tree
    currentRoot = wipRoot;
    wipRoot = null;
  }

let nextUnitOfWork = null;
let wipRoot = null; // work-in-progress root fiber
let currentRoot = null; // 一般用来保存上一次更新的fiber tree

function render(element, container) {
  // 所以在我们初始化新的work-in-progress tree的时候，我们添加一个alternate字段就能将old fiber tree的引用直接保存到wipRoot上，alternate就用来保存当前fiber所对应的上一次更新的fiber
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  };
  nextUnitOfWork = wipRoot;
}
```

接下来我们就开始`reconciliation`相关函数，当然得从performUnitOfWork中将部分功能分割出来：

```javascript

let nextUnitOfWork = null;
let wipRoot = null; // work-in-progress root fiber
let currentRoot = null; // 一般用来保存上一次更新的fiber tree
let deletions = null; // 用于保存需要删除的上一次更新的fiber

function render() {
  // 在render函数中初始化
  deletions = [];
};
function performUnitOfWork(fiber) {
  // 如果dom不存在，我们创建
  const {props} = fiber;
  const childElements = props.children;

  if(!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // fiber的更新就不在这简单处理了
  // 我们先处理children
  reconcileChildren(fiber, childElements);
  
  // 如果存在child fiber，直接返回
  if(fiber.child) {
    return fiber.child;
  }

  // 如果不存在child fiber，返回兄弟fiber，如果不存在兄弟fiber，则寻找parent fiber的兄弟fiber作为nextUnitOfWork
  let nextFiber = fiber;

  while(nextFiber) {
    if(nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  // 获取到接下来需要去比较的old child fiber，我们就不会按照key去比较了，就简单的按照index顺序比较
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while(index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    // TODO: compare old fiber and 
    const sameType = oldFiber && element && element.type === oldFiber.type;
    if(sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      };
    } else if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    } else if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }
    if(oldFiber) {
      oldFiber = oldFiber.sibling;
    }
  }
}

// 最后，我们在最终commit的时候同时处理deletions即需要删除的元素
function commitRoot() {
    deletions.forEach(commitWork);
    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
}
// 所以我们接下来再处理dom更新的时候就不单单是新增了，就要根据effectTag来考虑是新增还是修改或者删除
function commitWork(fiber) {
  if(!fiber) {
    return;
  }
  const domParent = fiber.parent.dom;

  if(fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if(fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if(fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// 事件属性
const isEvent = key => key.startsWith("on");
// 需要排除事件属性
const isProperty = key => key !== "children" && !isEvent(key);
// 需新增属性
const isNew = (oldProps, newProps) => key => oldProps[key] !== newProps[key];
// 需删除属性
const isGone = (newProps) => key => !(key in newProps);

// 处理更新dom元素on
function updateDom(dom, oldProps, newProps) {
  // 处理事件属性
  // 处理需要删除的事件监听，不存在或者和之前的值不相等
  Object.keys(oldProps)
  .filter(isEvent)
  .filter(key => !(key in newProps) || isNew(newProps)(key))
  .forEach(key => {
    const eventType = key.toLowerCase().substring(2);
    dom.removeEventListener(eventType, oldProps[key]);
  })
  // 处理需要添加的事件监听
  Object.keys(newProps)
  .filter(isEvent)
  .filter(isNew(newProps))
  .forEach(key => {
    const eventType = key.toLowerCase().substring(2);
    dom.addEventListener(eventType, newProps[key]);
  })
  // 删除属性
  Object.keys(oldProps)
  .filter(isProperty)
  .filter(isGone(newProps))
  .forEach(key => {
    dom[key] = "";
  });
  // 新增属性
  Object.keys(newProps)
  .filter(isProperty)
  .filter(isNew(oldProps, newProps))
  .forEach(key => {
    dom[key] = newProps[key];
  })
}

```

如上，我们比较新旧fiber主要做三步：
1. 如果两个fiber的type类型相同，那么我们只需要更新其props
2. 如果类型不同，而element存在，直接重新创建Dom节点
3. 如果类型不同，且element不存在，直接删除当前节点
   
> Here React also uses keys, that makes a better reconciliation. For example, it detects when children change places in the element array.

到这一步为止，我们对fiber的更新已经包含增删改的功能，以及根据元素顺序和元素类型进行了基本的更新判断，如果需要了解到更多更优化的更新细节，可以参考react源码可以了解更多。

### 第七步：函数组件

接下来我们需要支持函数组件，可以看到我们之前接受的元素类型都必须为html元素类型，直接可以用来创建dom元素，那么如果是函数组件，type又会是什么值呢？我们又需要怎么去创建对应函数组件的dom元素呢？
比如我们一般会这样写：

```javascript
/** @jsx Vact.createElement */
const App = () => {
  return (<header>
      <h1 className="title">hello react</h1>
      <p>wolcome to new world</p>
    </header>);
}
Vact.render(<App/>, document.getElementById("root"));
```

通过bable编译之后，我们会得到js:

```javascript
const App = () => {
  return Vact.createElement("header", null, Vact.createElement("h1", { className:"title"
  }, "hello react"), Vact.createElement("p", null, "wolcome to new world"));
};

Vact.render(Vact.createElement(App, null), document.getElementById("root"));
```
我们可以看到，其实通过编译器处理之后的代码我们函数组件最终返回的就是我们需要的元素对象。
所以组件函数我们可以说有至少两点是不一样的：
1. 组件所对应的fiber并没有直接对应的dom元素
2. 函数组件的子元素不是直接来源于属性，而是通过函数调用获得返回的元素作为子元素
   
参考以上两点，我们知道在创建dom元素，更新dom元素的时候需要进行特殊处理。
我们继续从上面的`performUnitOfWork`为基础做修改：

```javascript
// 在performUnitOfWork中创建dom元素的时候需要做特殊处理
function performUnitOfWork(fiber) {
  // 如果dom不存在，我们创建
  const {props} = fiber;
  const childElements = props.children;
  // 判断当前fiber是否为function对应fiber
  const isFunctionComponent = fiber.type instanceof Function;

  if(isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  // 之前的更新代码我们就作为更新普通元素的方式
  // if(!fiber.dom) {
  //   fiber.dom = createDom(fiber);
  // }
  // reconcileChildren(fiber, childElements);
  
  // 如果存在child fiber，直接返回
  if(fiber.child) {
    return fiber.child;
  }

  // 如果不存在child fiber，返回兄弟fiber，如果不存在兄弟fiber，则寻找parent fiber的兄弟fiber作为nextUnitOfWork
  let nextFiber = fiber;

  while(nextFiber) {
    if(nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }

  function updateHostComponent(fiber) {
    if(!fiber.dom) {
      fiber.dom = createDom(fiber);
    }
    reconcileChildren(fiber, childElements);
  }

  // 和处理普通元素唯一的区别就是获取children的方式不一样，更新children方式一致
  function updateFunctionComponent(fiber) {
    // fiber.type是当前组件函数，调用就可以返回子元素
    // children默认是数组
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
  }
}

// 在commitWork中更新dom元素的时候需要做特殊处理
function commitWork(fiber) {
  if(!fiber) {
    return;
  }
  // 函数组件fiber不一定包含dom，所以domParent不一定存在
  // const domParent = fiber.parent.dom;
  // 改动
  let domParentFiber = fiber.parent;

  while(!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }

  const domParent = domParentFiber.dom;

  if(fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if(fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if(fiber.effectTag === "DELETION") {
    // fiber.dom不一定存在，所以需要特殊处理
    // domParent.removeChild(fiber.dom);
    commitDeletion(fiber, domParent);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// 在删除dom的时候被删除的fiber.dom不一定存在，所以也需要特殊处理
function commitDeletion(fiber, domParent) {
  if(fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

```
以上就是我们针对函数组件的特殊处理，现在我们就已经支持函数组件了。

### 第八步：Hooks

Hooks大家应该都用过，就比如useState，useEffect，我们这里会支持useState hook。
我们上面的例子可以修改一下：

```javascript
/** @jsx Vact.createElement */
const App = () => {
  const [count, setCount] = vact.useState();
  return (<header>
      <h1 className="title">count number：{count}</h1>
      <p>wolcome to new world</p>
      <button onClick={() => setCount(count => count++)}>click</button>
    </header>);
}
Vact.render(<App/>, document.getElementById("root"));
```
我们会在`updateFunctionComponent`的时候处理useState：

```javascript
let wipFiber = null;
let hookIndex = null;
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState(initial) {
  const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    // 我们用queue保存当前hook所有的action
    queue: [],
  };
  const actions = oldHook ? oldHook.queue : [];
  // 每次更新都会从头将所有的action调用一遍直至最新的action返回最新的state
  actions.forEach(action => {
    // 我们这里默认action都是函数
    hook.state = action(hook.state);
  });
  const setState = (action) => {
    hooks.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    };
    nextunitOfWork = wipRoot;
    deletions = [];
  };
  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state];
}
```

我们首先设置一个work-in-progress fiber的全局变量，用于保存当前正在更新的fiber，然后再设置hooks数组用来保存组件状态，还有记录当前的hook index。
当组件调用useState的时候，我们会先查询是否存在旧的对应的hook，如果存在则使用上一次保存的状态，不存在则使用新的初始化状态。
我们在`setState`函数中生成了新的`wipRoot`和`nextUnitOfWOrk`，所以相当于手动触发了一次状态更新，这就是为什么我们在setState的时候会触发react更新了。

### 结语

至此，我们已经完成了一个：
1. 能够使用jsx编写，
2. 支持函数组件，
3. 支持useState hook，
4. 能够简单处理元素的增删改，
5. 批量且可间断更新元素

包括以上功能的类react的简单库，因为代码相对简单，所以相比react，会少了很多优化的细节以及功能，比如：
1. 我们在render阶段会检查整个fiber tree，而react会根据一些提示或者标记去跳过那些没有变化的整个子树。
2. 我们在commit阶段也会检查整个fiber tree，而react会记录一个只包含有有效effectTag的链表，然后只检查这些fiber。
3. 我们在每次创建新的进程树的时候，都会创建新的fiber，而react则是回收使用之前的fiber对象。
4. 在render阶段，当我们触发了一次更新，我们不会去检查进程树当前正在进行什么任务而重新开始新的更新。而react会给每次更新标记过期时间用于判断哪次优先级更高。
5. 更多...
   
如果有什么不对或者是可以改善的地方，欢迎大家在[我的github](https://github.com/viccsen/Vact)提issues。
如果不嫌弃也可以看一下[Vact](https://github.com/viccsen/Vact)的其他项目，不同版本也有不同的写法，clone还支持本地测试哦。🚀🚀🚀

参考：[Build your own React](https://pomb.us/build-your-own-react/)

