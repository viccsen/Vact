## 步骤说明

### Step1

一般存在如下情况：

``` javascript
const rootDom = document.getElementById("root");

function tick() {
  const time = new Date().toLocaleTimeString();
  const clockElement = <h1>{time}</h1>;
  render(clockElement, rootDom);
}

tick();
setInterval(tick, 1000);
```

如果按照之前的render函数，那么每执行一次render会新生成一个dom元素，所以这一步要做的就是在父元素存在的子元素的情况下，用新的元素替换掉旧的元素。


### Step2

步骤4处理的情况是一种简单状态更新，当页面上有更多的元素以及更多的状态变化情况下这种处理显然是不恰当的，所以这里需要的就是比较上一次的子元素和新元素所生成的各自的dom树的差异，只更新有变化的元素。
react把这个过程叫做[reconciliation](https://reactjs.org/docs/reconciliation.html)，我们要做的就是把上一次的虚拟dom树保存起来，然后比较两次差异。

要保存树结构的dom数据，那么在原来的props基础上，本就有children属性就更容易创建树结构的数据，
所以接下来就面对两个方向：
- 要在结构中保存真实的dom元素的引用，并且保证结构不可变（*immutable*）;
- 支持状态组件 State Components
  
#### Instances（实例）

> An instance represents an element that has been rendered to the DOM.

一个实例是指已经渲染到真实DOM树中的元素，通过一个纯js对象保存，包含`element, dom, childInstances`三个属性，其中`childInstances`保存子元素实例。

---

> Note that what we are referring as instances here is not the same instance tha [Dan Abramov](https://medium.com/@dan_abramov) uses in [*React Components, Elements, and Instances*](https://medium.com/@dan_abramov/react-components-elements-and-instances-90800811f8ca). He refers to public instances, which are what React gets when it calls the constructor of a class that inherits from React.Component.

另外一种实例则叫公共实例，是指通过Class创建的组件的contstructor构造函数获取的this对象，通常这个实例怎么生成用户不需要关心，都由react内部完成。后面我们也会称这个实例为公共实例。

---

接上，每一个dom都会有一个与其匹配的实例，协调算法就是为了尽可能少的减少实例的增删，这样如果实例重用得更多，那么dom tree的更改操作越少，页面性能自然得到了提升。

为了能够对比新旧实例的差异，所以我们不能直接在render中操作dom了，接下来第二步做的是添加实例对象，然后面向实例对象重构render；

### Step3 实例开始有用武之地！

现在我们有了实例了，继续我们的工作，更新可重用dom的属性。
简单的说就是通过比较我们从jsx对象获取到的element type属性，相同则只更新dom属性并更新element对象。

### Step4 怎么协调算法在子元素的应用？

步骤3目前只处理了当前元素的差异化更新，接下来就是处理子元素的属性更新。初步的方法是递归子元素，根据子元素的顺序和类型来判断是否可重用，虽然问题很明显（顺序很可能变化），但目前简单易懂为上。

### Step5 当新元素的子元素更少的时候怎么办？

步骤4我们说了根据子元素的顺序来判断子元素怎么更新，如果子元素个数比子实例个数多，那么我们在协调函数里有处理当实例为null的情况，创建一个新的实例。那如果子元素的个数更少呢？如果处理element为null的情况呢？

## 总结

本节主要在reconcile中添加了instantiate实例化函数，并且能够简单的通过比较element元素type类型来判断元素是否需要更新。而不是像之前直接替换，减少了dom操作负担，同时也有一些比较好的副作用就是维护一些dom的内部状态比如滚动位置和焦点等。