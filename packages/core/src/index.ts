import dist from 'any-event';
import AnyTouch from 'any-touch'
import raf from 'raf';

const STYLE: Partial<CSSStyleDeclaration> = {
    overflow: 'hidden',
};
const CONTENT_STYLE: Partial<CSSStyleDeclaration> = {
    width: '100%'
};

export default function (el: HTMLElement, options = {}) {
    // 内容元素当前位移
    let x = 0;
    let y = 0;
    let rafID = 0;

    // 设置外容器样式
    for (const key in STYLE) {
        el.style.setProperty(key, STYLE[key] as string);
    }

    // 生成内容器, 并把外容器内的dom移动到内容器
    const contentEl = document.createElement('div');

    while (el.firstChild) {
        contentEl.appendChild(el.firstChild);
    }
    // 设置内容器样式
    for (const key in CONTENT_STYLE) {
        contentEl.style.setProperty(key, CONTENT_STYLE[key] as string);
    }
    el.appendChild(contentEl);


    // 加载手势
    const at = new AnyTouch(el);
    at.on('panmove', e => {
        const { deltaX, deltaY } = e;
        const dist = _setContentTranslate([el, contentEl], [x, y], [deltaX, deltaY]);
        // 同步xy, xy可能并不变化, 
        // 最终取值由_setContentTranslate返回值决定
        x = dist[0];
        y = dist[1];
    });

    at.on('panend', e => {
        // _scroll([el, contentEl], [x, y], [-x, -y], 500, ([distX, distY]) => {
        //     x = distX;
        //     y = distY;
        // }, id => {
        //     rafID = id;
        // });
    });

    at.on('at:start', e => {
        raf.cancel(rafID)
    });

    const swipe = at.get('swipe');
    swipe && swipe.set({ velocity: 1 });

    at.on('swipe', e => {
        // let dx = e.speedX * 30;
        // let dy = e.speedY * 30;
        // _scroll([el, contentEl], [x, y], [dx, dy], 2000, ([distX, distY]) => {
        //     x = distX;
        //     y = distY;
        // }, id => {
        //     rafID = id;
        // });
    });
}

/**
 * 设置元素的translate
 * @param el 元素
 * @param param1 坐标 
 */
function _setContentTranslate([el, contentEl]: [HTMLElement, HTMLElement], [x, y]: [number, number], [dx, dy]: [number, number], tolerance: number = 50): [number, number] {
    // 计算内容尺寸
    let distX = x + dx;
    let distY = y + dy;
    
    const minX = el.offsetWidth - contentEl.scrollWidth - tolerance
    if (minX > distX) {
        distX = minX;
    } else if (minX + tolerance > distX && minX <= distX) {
        distX = x + dx / 2;
    } else if (0 >= distX) {
        // distX = Math.max(y, el.offsetWidth - contentEl.scrollWidth - tolerance);
    } else if (tolerance > distX) {
        distX = x + dx / 2;
    } else {
        distX = tolerance
    }

    const minY = el.offsetHeight - contentEl.scrollHeight - tolerance
    if (minY > distY) {
        distY = minY;
    } else if (minY + tolerance > distY && minY <= distY) {
        distY = y + dy / 2;
    } else if (0 >= distY) {
        // distY = Math.max(y, el.offsetHeight - contentEl.scrollHeight - tolerance);
    } else if (tolerance > distY) {
        distY = y + dy / 2;
    } else {
        distY = tolerance
    }
    contentEl.style.setProperty('transform', `translate3d(${distX}px, ${distY}px, 0)`);
    return [distX, distY];
}
/**
 * 
 * @param elements 
 * @param from 
 * @param delta 
 * @param duration 
 * @param onScroll 
 * @param onChangeRaf 
 */
function _scroll([el, contentEl]: [HTMLElement, HTMLElement], [x, y]: [number, number], [dx, dy]: [number, number], duration: number, onScroll: ([x, y]: [number, number]) => void, onChangeRaf?: (id: number) => void) {
    let startTime = Date.now();
    function animate() {
        const timeDiff = Date.now() - startTime;
        if (duration > timeDiff) {
            const activeXY: [number, number] = [easeOut(timeDiff, x, dx, duration), easeOut(timeDiff, y, dy, duration)];
            _setContentTranslate([el, contentEl], [x, y], [activeXY[0] - x, activeXY[1] - y]);
            onChangeRaf && onChangeRaf(raf(animate));
            onScroll && onScroll(activeXY);
        } else {
            const activeXY = _setContentTranslate([el, contentEl], [x, y], [dx, dy]);
            onScroll && onScroll(activeXY);
        }
    }
    animate()
}
/**
 * 参考 https://github.com/zhangxinxu/Tween/blob/master/tween.js
 * t: current time（当前时间）；
 * b: beginning value（初始值）；
 * c: change in value（变化量）；
 * d: duration（持续时间）。
*/
function easeOut(t: number, b: number, c: number, d: number) {
    return -c * (t /= d) * (t - 2) + b;
}