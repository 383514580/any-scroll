# any-scroll  [![NPM Version][npm-image]][npm-url] [![NPM Downloads][downloads-image]][downloads-url] [![npm bundle size (minified + gzip)][size-image]][size-url] 
模拟scrollview, 基于vue制作, 可加工成Tab/SwipeOut/Slider/Carousel等组件.

[size-image]: https://badgen.net/bundlephobia/minzip/any-scroll
[size-url]: https://bundlephobia.com/result?p=any-scroll
[npm-image]: https://img.shields.io/npm/v/any-scroll.svg
[npm-url]: https://npmjs.org/package/any-scroll
[downloads-image]: https://badgen.net/npm/dt/any-scroll
[downloads-url]: https://npmjs.org/package/any-scroll


## 初衷
本插件的初衷是让更多人理解**scroll-view的原理**, 并可以自己动手写一个scroll-view. 

我个人觉得scroll-view的css和js逻辑如果理解了, **写其他UI组件会变得很简单(:zap: 编辑器除外)**.

所以我也会在[掘金](https://juejin.im/post/5ca982aff265da24f741ec21)写一些制作过程和使用的文章,  希望大家喜欢, 多多捧场鼓励, 谢谢.

## 安装
```shell
npm i -S any-scroll
```

## 使用
```html
<any-scroll>
  <p>第一行</p>
  <p>第二行</p>
  ...
</any-scroll>
```

``` javascript
import AnyScroll from 'any-scroll'
new Vue({
  components: {AnyScroll}
});
```
##


## 什么时候用

1. 模拟scrollview, 规避ios下系统的scrollview拖拽到2端出现空白的bug.
...

## 属性(props)
|名称|数据类型|默认值|说明|
|---|---|---|---|
|height|`String`|500px|scrollView的高度,可以给`100%`让其填满父元素高度,或者`100vh`和浏览器一样高|
|width|`String`|-|scrollView的宽度|
|overflowX|`Boolean`|true|x轴是否可以滚动|
|overflowY|`Boolean`|true|y轴是否可以滚动|
|bounceDistance|`Number` / `Object`|150|4个边界的可拉伸距离, 如果是对象, 可以通过top/left/right/bottom单独配置每一边|
|bounceTime|`Number`|100|回弹时间, 单位ms|
|easeFunction|`Function`|`const t => (t - 1) ** 3 + 1`| 根据时间变化的输出的值从0到1的曲线


## 事件(event)
|名称|返回值|说明|
|---|---|---|
|before-scroll|同scroll事件返回值|滚动发生前触发,返回滚动条当前位置信息|
|scroll-start|同scroll事件返回值|滚动发生前触发|
|scroll|**scrollTop**(Number) / **scrollLeft**(Number)|滚动过程中实时触发, 返回滚动条位置信息|
|direction-change|**directionX**('left' \| 'right') / **directionY**('up' \| 'down')|滚动过程中实时触发, 返回滚动方向| 
|scroll-state-change|**x**('static' \| 'drag-scroll' \|  'animate-scroll') / **y**)|滚动状态(静止 \| 拖拽滚动 \| 动画滚动)|
|bounce-state-change| **top**('static' \| 'stretched' \| 'shrink') / **right** / **bottom** / **left**|返回4个方向边界的弹性状态, 有静止 / 伸展 / 收缩3种状态|
|scroll-end| 同scroll事件返回值 |滚动停止时触发|
|stop-scroll|同scroll事件返回值|手动停止滚动触发, 比如滚动过程中拖拽会停止当前滚动|
|panstart|**any-touch.js**返回数据, 包含距离/坐标等信息, 具体参考[any-touch](https://github.com/383514580/any-touch)文档| 拖拽开始触发|
|panmove|同panstart事件|拖拽中触发|
|panend|同panstart事件|拖拽结束触发|
|swipe|同panstart事件|快速划触发|
|tap|同panstart事件|单击触发|
|doubletap|同panstart事件|双击触发|

## 插槽(slot)
|名称|作用域值|说明|
|---|---|---|
|default|scrollTop(Y轴滚动条位置) \| scrollLeft(X轴滚动条位置) \| directionX(X轴滚动方向) \| directionY(Y轴滚动方向)| 默认插槽, 要显示的内容都放在这里|
|top|同default|固定在顶部的插槽, 具体效果可参见[demo](https://383514580.github.io/any-scroll/)|
|bottom|同default|固定在底部的插槽, 具体效果可参见[demo](https://383514580.github.io/any-scroll/)|
|upper|同default|浮在内容上面的层, 可以放"返回顶部按钮"|
|under|同default|在内容下面的层, 可以放"loading图标"|
