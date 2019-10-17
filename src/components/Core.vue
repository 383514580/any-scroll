<template>
    <div :style="viewStyle" class="any-scroll-view">
        <!-- 固定头 -->
        <header v-if="$slots.top || $scopedSlots.top" class="any-scroll-view__top">
            <slot
                name="top"
                :scrollTop="scrollY"
                :scrollLeft="scrollX"
                :directionX="directionX"
                :directionY="directionY"
            ></slot>
        </header>

        <!-- 上层 -->
        <section v-if="$slots.upper || $scopedSlots.upper" class="any-scroll-view__upper">
            <slot
                name="upper"
                :scrollTop="scrollY"
                :scrollLeft="scrollX"
                :directionX="directionX"
                :directionY="directionY"
            ></slot>
        </section>

        <!-- 下层 -->
        <section v-if="$slots.under || $scopedSlots.under" class="any-scroll-view__under">
            <slot
                name="under"
                :scrollTop="scrollY"
                :scrollLeft="scrollX"
                :directionX="directionX"
                :directionY="directionY"
            ></slot>
        </section>

        <!-- 滚动条 -->
        <scroll-bar
            :is-show-x="isShowXBar"
            :is-show-y="isShowYBar"
            :scroll-x-state="scrollXState"
            :scroll-y-state="scrollYState"
            :scroll-x="scrollX"
            :scroll-y="scrollY"
            :overflow-x="overflowX"
            :overflow-y="overflowY"
            :content-width="contentWidth"
            :content-height="contentHeight"
            :view-width="viewWidth"
            :view-height="viewHeight"
            :is-out-of-top="isOutOfTop"
            :is-out-of-left="isOutOfLeft"
            :is-out-of-right="isOutOfRight"
            :is-out-of-bottom="isOutOfBottom"
            :outOfTopDistance="outOfTopDistance"
            :outOfBottomDistance="outOfBottomDistance"
            :outOfRightDistance="outOfRightDistance"
            :outOfLeftDistance="outOfLeftDistance"
        />

        <!-- 内容 -->
        <div ref="content" :style="contentStyle" class="any-scroll-view__content">
            <slot
                :scrollTop="scrollY"
                :scrollLeft="scrollX"
                :directionX="directionX"
                :directionY="directionY"
            ></slot>
        </div>

        <!-- 底部固定 -->
        <footer v-if="$slots.bottom || $scopedSlots.bottom" class="any-scroll-view__bottom">
            <slot
                name="bottom"
                :scrollTop="scrollY"
                :scrollLeft="scrollX"
                :directionX="directionX"
                :directionY="directionY"
            ></slot>
        </footer>
    </div>
</template>

<script>
import {
    STATE_STATIC,
    STATE_DRAG_SCROLL,
    STATE_ANIMATE_SCROLL,
    STATE_BOUNCE_STRETCHED,
    STATE_BOUNCE_SHRINK,
    POSITION_UPPERCASE_LIST,
    POSITION_LOWERCASE_LIST,

    // 方向
    DIRECTION_UP_LOWERCASE,
    DIRECTION_RIGHT_LOWERCASE,
    DIRECTION_LEFT_LOWERCASE,
    DIRECTION_DOWN_LOWERCASE,

    // X/Y
    AXIS_X,
    AXIS_Y
} from '@/const.js';
import AnyTouch from 'any-touch';
import raf from 'raf';
import ScrollBar from '@/components/ScrollBar';
export default {
    name: 'AnyScrollView',

    components: { ScrollBar },

    props: {
        // 速度衰减因子
        damping: {
            type: [Number, String],
            default: 0.1,
            validator: (v) => {
                return 0 < v && 1 > v;
            }
        },

        // 回弹距离
        bounceDistance: {
            type: [Number, String, Object],
            default: 150
        },

        // 回弹动画时间
        bounceTime: {
            type: [String, Number],
            default: 500
        },

        // 回弹动画曲线
        easeFunction: {
            type: Function,
            default: (t) => (t - 1) ** 3 + 1
        },

        width: {
            type: [Number, String],
            default: 320
        },

        height: {
            type: [Number, String],
            default: 500
        },

        overflowX: {
            type: Boolean,
            default: false
        },

        overflowY: {
            type: Boolean,
            default: false
        },

        isShowXBar: {
            type: Boolean,
            default: true
        },

        isShowYBar: {
            type: Boolean,
            default: true
        },

        isPreventDefault: {
            type:Boolean,
            default: false
        }
    },

    data() {
        return {
            translateY: 0,
            translateX: 0,
            transitionDuration: 0,
            contentHeight: 0,
            contentWidth: 0,
            viewWidth: 0,
            viewHeight: 0,
            // 记录惯性滚动动画的id
            rafId: null,
            // scrollTo内容rafId
            scrollToRafId: null,
            // 滚动状态
            scrollXState: STATE_STATIC,
            scrollYState: STATE_STATIC,
            // 弹簧状态
            topBounceState: STATE_STATIC,
            bottomBounceState: STATE_STATIC,
            leftBounceState: STATE_STATIC,
            rightBounceState: STATE_STATIC,

            // 当前方向
            directionX: undefined,
            directionY: undefined
        };
    },

    computed: {
        viewStyle() {
            const height = this.height == parseInt(this.height) ? `${this.height}px` : this.height;
            const width = this.width == parseInt(this.width) ? `${this.width}px` : this.width;
            return { height, width };
        },

        contentStyle() {
            return {
                transform: `translate3d(${this.translateX}px, ${this.translateY}px, 0px)`
            };
        },

        scrollData() {
            return { scrollTop: this.scrollY, scrollLeft: this.scrollX };
        },

        // Y轴目标滚动条高度
        scrollY: {
            get() {
                return -this.translateY;
            },

            set(scrollY) {
                this.translateY = 0 - scrollY;
            }
        },

        // X轴目标滚动条高度
        scrollX: {
            get() {
                return -this.translateX;
            },

            set(scrollX) {
                this.translateX = 0 - scrollX;
            }
        },

        topBounceDistance() {
            return Number(this.bounceDistance.top || this.bounceDistance);
        },

        rightBounceDistance() {
            return Number(this.bounceDistance.right || this.bounceDistance);
        },

        leftBounceDistance() {
            return Number(this.bounceDistance.left || this.bounceDistance);
        },

        bottomBounceDistance() {
            return Number(this.bounceDistance.bottom || this.bounceDistance);
        },

        // 在有回弹特效的情况下, 最小的scrollTop
        minScrollYWithBounce() {
            return this.minScrollY - this.topBounceDistance;
        },

        // 在有回弹特效的情况下, 最小的scrollTop
        maxScrollYWithBounce() {
            return this.maxScrollY + this.bottomBounceDistance;
        },

        // 在有回弹特效的情况下, 最小的scrollLeft
        minScrollXWithBounce() {
            return this.minScrollX - this.leftBounceDistance;
        },

        // 在有回弹特效的情况下, 最小的scrollLeft
        maxScrollXWithBounce() {
            return this.maxScrollX + this.rightBounceDistance;
        },

        // Y轴滚动的最小距离
        minScrollY() {
            return 0;
        },

        // Y轴滚动的最远距离
        maxScrollY() {
            return this.contentHeight - this.viewHeight;
        },

        // X轴滚动的最小距离
        minScrollX() {
            return 0;
        },

        // X轴滚动的最远距离
        maxScrollX() {
            return this.contentWidth - this.viewWidth;
        },

        // 是否超出顶部边界
        isOutOfTop() {
            return this.minScrollY > this.scrollY;
        },

        // 是否超出左侧边界
        isOutOfLeft() {
            return this.minScrollX > this.scrollX;
        },

        // 是否滚动条在最底端
        isOutOfBottom() {
            return this.maxScrollY < this.scrollY;
        },

        // 是否滚动条在最右端
        isOutOfRight() {
            return this.maxScrollX < this.scrollX;
        },

        // 超出边界的距离
        outOfTopDistance() {
            return Math.max(0, this.minScrollY - this.scrollY);
        },

        outOfBottomDistance() {
            return Math.max(0, this.scrollY - this.maxScrollY);
        },

        outOfLeftDistance() {
            return Math.max(0, this.minScrollX - this.scrollX);
        },

        outOfRightDistance() {
            return Math.max(0, this.scrollX - this.maxScrollX);
        },

        bounceXState() {
            return STATE_STATIC === this.leftBounceState ? this.rightBounceState : this.leftBounceState;
        },
        bounceYState() {
            return STATE_STATIC === this.topBounceState ? this.bottomBounceState : this.topBounceState;
        }
    },

    watch: {
        width() {
            this.updateSize();
        },

        height() {
            this.updateSize();
        },

        bounceXState(x) {
            this.$emit('bounce-state-change', {
                top: this.topBounceState,
                right: this.rightBounceState,
                bottom: this.bottomBounceState,
                left: this.leftBounceState
            });
        },

        bounceYState(y) {
            this.$emit('bounce-state-change', {
                top: this.topBounceState,
                right: this.rightBounceState,
                bottom: this.bottomBounceState,
                left: this.leftBounceState
            });
        },

        scrollXState(value) {
            this.$emit('scroll-state-change', { x: value, y: this.scrollYState });
        },

        scrollYState(value) {
            this.$emit('scroll-state-change', { y: value, x: this.scrollXState });
        },

        // 监控scrollTop, 防止滑出有效区域
        scrollY(scrollY, prevScrollY) {
            this.directionY = scrollY > prevScrollY ? DIRECTION_UP_LOWERCASE : DIRECTION_DOWN_LOWERCASE;
            this.watchScrollXYHandler(scrollY, prevScrollY, AXIS_Y);
        },

        // 监控scrollLeft, 防止滑出有效区域
        scrollX(scrollX, prevScrollX) {
            this.directionX = scrollX > prevScrollX ? DIRECTION_LEFT_LOWERCASE : DIRECTION_RIGHT_LOWERCASE;
            this.watchScrollXYHandler(scrollX, prevScrollX, AXIS_X);
        }
    },

    mounted() {
        const at = new AnyTouch(this.$el, {isPreventDefault:this.isPreventDefault});
        this.updateSize();
        try {
            const MutationObserver = MutationObserver || WebKitMutationObserver || MozMutationObserver;
            const _observer = new MutationObserver(() => {
                this.updateSize();
            });

            _observer.observe(this.$refs.content, {
                subtree: true,
                childList: true
            });
        } catch (error) {}

        // 销毁
        this.$on('hook:destroy', () => {
            at.destroy();
            at = null;
            _observer.disconnect();
            _observer = null;
        });

        // 第一次触碰
        at.on('inputstart', (ev) => {
            this.stop();
            this.$emit('stop-scroll', this.$scrollData);
        });

        // 第一次触碰
        at.on('inputend', (ev) => {
            this.panendHandler();
        });

        // 拖拽开始
        at.on('panstart', (ev) => {
            this.panstartHandler(ev);
            this.$emit('panstart', ev);
        });

        // 拖拽中
        at.on('panmove', (ev) => {
            this.panmoveHandler(ev);
            this.$emit('panmove', ev);
        });

        // 结束拖拽
        at.on('panend', (ev) => {
            // this.panendHandler();
            this.$emit('panend', ev);
        });

        // 快速滑动
        at.on('swipe', (ev) => {
            this.decelerate(ev);
            this.$emit('swipe', ev);
        });

        at.on('tap', (ev) => {
            this.$emit('tap', ev);
        });

        at.on('doubletap', (ev) => {
            this.$emit('doubletap', ev);
        });
    },

    methods: {
        /**
         * 通过观察scroll的值
         */
        watchScrollXYHandler() {
            // 通知方向变化
            this.$emit('direction-change', { x: this.directionX, y: this.directionY });

            // 响应弹簧的状态
            // POSITION_UPPERCASE_LIST === ['Top', 'Right', 'Bottom', 'Left'];
            POSITION_UPPERCASE_LIST.forEach((DIRECTION_UPPERCASE, index) => {
                // topBounceState等
                if (this[`isOutOf${DIRECTION_UPPERCASE}`]) {
                    if (STATE_BOUNCE_SHRINK !== this[`${POSITION_LOWERCASE_LIST[index]}BounceState`]) {
                        this[`${POSITION_LOWERCASE_LIST[index]}BounceState`] = STATE_BOUNCE_STRETCHED;
                    }
                } else {
                    this[`${POSITION_LOWERCASE_LIST[index]}BounceState`] = STATE_STATIC;
                }
            });
            this.$emit('scroll', this.scrollData);
        },

        updateSize() {
            this.$nextTick(() => {
                this.viewWidth = this.$el.offsetWidth;
                this.viewHeight = this.$el.offsetHeight;
                this.contentWidth = this.$refs.content.scrollWidth;
                this.contentHeight = this.$refs.content.scrollHeight;
            });
        },

        /**
         * 立即在当前位置停止滚动
         */
        stop() {
            raf.cancel(this.scrollToRafId);
            raf.cancel(this.rafId);
            this.scrollXState = STATE_STATIC;
            this.scrollYState = STATE_STATIC;
        },

        panstartHandler({ deltaX, deltaY, x, y }) {
            this.dragMoveContent({ deltaX, deltaY });
        },

        panmoveHandler({ deltaX, deltaY }) {
            this.dragMoveContent({ deltaX, deltaY });
        },

        /**
         * 拖拽内容
         */
        dragMoveContent({ deltaX, deltaY }) {
            if (0 !== deltaX) {
                this.scrollXState = STATE_DRAG_SCROLL;
            }

            if (0 !== deltaY) {
                this.scrollYState = STATE_DRAG_SCROLL;
            }

            this.scrollBy({ deltaX, deltaY });
        },

        panendHandler() {
            // 滚动状态为静止
            this.scrollXState = STATE_STATIC;
            this.scrollYState = STATE_STATIC;
            this.snapToEdge();
        },

        /**
         * 移动content
         * @param {Object} 多拽产生的数据
         * @param {Object} 包含deltaX: x轴位移变化;deltaY: y轴位移变化
         */
        scrollBy(ev) {
            ['X', 'Y'].forEach((axis) => {
                if (!this[`overflow${axis}`]) {
                    let willScroll = this[`scroll${axis}`] - ev[`delta${axis}`];
                    if (this[`maxScroll${axis}WithBounce`] < willScroll) {
                        willScroll = this[`maxScroll${axis}WithBounce`];
                    } else if (this[`minScroll${axis}WithBounce`] > willScroll) {
                        willScroll = this[`minScroll${axis}WithBounce`];
                    }
                    this[`scroll${axis}`] = willScroll;
                }
            });
        },

        /**
         * 拖拽松手后减速移动至停止
         * velocityX/Y的单位是px/ms
         */
        decelerate(ev) {
            this.$emit('before-scroll', this.scrollData);
            raf.cancel(this.rafId);

            const { speedX, speedY } = ev;
            const _calcDeltaDisplacement = (speed) => {
                // 根据速度求滑动距离
                // 此处的公式其实就是想让速度和距离有一个线性关系,
                // 并不是什么物理公式,
                // 此处的30也可以是其他任何值
                return ~~(speed * 30) / this.damping;
            };
            // 减速动画
            // 弹簧shrink状态下,对应轴线, 不允许加速运动
            this._decelerateAnimation({
                x: _calcDeltaDisplacement(STATE_BOUNCE_SHRINK === this.bounceXState || this.overflowX ? 0 : speedX),
                y: _calcDeltaDisplacement(STATE_BOUNCE_SHRINK === this.bounceYState || this.overflowY ? 0 : speedY)
            });
        },

        /**
         * 减速动
         */
        _decelerateAnimation(delta) {
            raf.cancel(this.rafId);
            let isFinish = { x: 0 === delta.x, y: 0 === delta.y };
            let AXIS_LIST = ['x', 'y'].filter((axis) => !this[`overflow${axis.toUpperCase()}`] && !isFinish[axis]);
            // 已经移动
            // let hasMoved = { x: 0, y: 0 };
            // 剩余滑动位移
            let remainDistance = { x: delta.x, y: delta.y };
            this.$emit('scroll-start', this.scrollData);
            // 滑动到下一帧的scroll位置
            const _moveToNextFramePosition = () => {
                // 过滤掉overflow限制的方向
                // 过滤掉超出弹簧边界移动的方向
                for (let axis of AXIS_LIST) {
                    const AXIS = axis.toUpperCase();
                    // 如果已经完成滑动, 那么标记为静止, 不再参与滑动计算
                    if (isFinish[axis]) {
                        this[`scroll${AXIS}State`] = STATE_STATIC;
                        continue;
                    }
                    // 本次减少后剩余距离
                    const currentRemain = ~~(remainDistance[axis] * (1 - this.damping));
                    // 本次移动距离
                    const willMove = currentRemain - remainDistance[axis];
                    if (0 === willMove) {
                        isFinish[axis] = true;
                        this[`scroll${AXIS}State`] = STATE_STATIC;
                    } else {
                        this[`scroll${AXIS}State`] = STATE_ANIMATE_SCROLL;
                        // 待滑动距离
                        remainDistance[axis] = currentRemain;
                        // hasMoved[axis] += willMove;
                        // 滑动
                        this[`scroll${AXIS}`] += willMove;
                    }

                    // 修正滑动, 限制在移动范围内
                    if (this[`minScroll${AXIS}WithBounce`] > this[`scroll${AXIS}`]) {
                        this[`scroll${AXIS}`] = this[`minScroll${AXIS}WithBounce`];
                        isFinish[axis] = true;
                    } else if (this[`maxScroll${AXIS}WithBounce`] < this[`scroll${AXIS}`]) {
                        this[`scroll${AXIS}`] = this[`maxScroll${AXIS}WithBounce`];
                        isFinish[axis] = true;
                    }
                }

                if (isFinish.x) {
                    this.scrollXState = STATE_STATIC;
                    if (STATE_BOUNCE_SHRINK !== this.bounceXState) {
                        this.snapToEdge('x');
                    }
                }

                if (isFinish.y) {
                    this.scrollYState = STATE_STATIC;
                    if (STATE_BOUNCE_SHRINK !== this.bounceYState) {
                        this.snapToEdge('y');
                    }
                }

                // 2个轴都结束滑动, 那么标记为"静止"
                if (isFinish.x && isFinish.y) {
                    this.$emit('scroll-end', this.scrollData);
                    this.$emit('after-scroll', this.scrollData);
                } else {
                    this.rafId = raf(_moveToNextFramePosition);
                }
            };
            _moveToNextFramePosition();
        },

        /**
         * 滚动指定位置
         * 由于内部snap方法使用他
         * 所以不包含$emit, 钩子都在scrollTo中
         */
        _scrollTo({ top, left, callback = () => {} }, duration = 300) {
            const START_TIME = Date.now();
            const DIST_SCROLL = { X: left, Y: top };
            const START_SCROLL = {};
            const WILL_MOVE = {};
            const AXIS_LIST = [undefined !== top && 'Y', undefined !== left && 'X'].filter((axis) => !!axis);
            for (let axis of AXIS_LIST) {
                START_SCROLL[axis] = this[`scroll${axis}`];
                WILL_MOVE[axis] = DIST_SCROLL[axis] - START_SCROLL[axis];
                this[`scroll${axis}State`] = WILL_MOVE[axis] ? STATE_ANIMATE_SCROLL : STATE_STATIC;
            }

            if (0 === AXIS_LIST.length) return;

            const _toNextPosition = () => {
                const elapse = Date.now() - START_TIME;
                // 通过和1比较大小, 让easeFunction的返回值以1结束
                const progress = this.easeFunction(Math.min(1, elapse / duration));

                // 移动

                for (let axis of AXIS_LIST) {
                    this[`scroll${axis}`] = Math.ceil(START_SCROLL[axis] + WILL_MOVE[axis] * progress);
                }

                if (elapse <= duration) {
                    this.scrollToRafId = raf(_toNextPosition);
                } else {
                    // 因为是根据时间运动, 所以一定是同时到达
                    for (let axis of AXIS_LIST) {
                        if (WILL_MOVE[axis]) {
                            this[`scroll${axis}State`] = STATE_STATIC;
                        }
                    }
                    callback();
                }
            };

            // raf.cancel(this.scrollToRafId);
            this.scrollToRafId = raf(_toNextPosition);
        },

        /**
         * 对外暴露的scrollTo方法
         */
        scrollTo({ top, left, callback = () => {} }, duration = 300) {
            this.$emit('before-scroll', this.scrollData);
            this.$emit('scroll-start', this.scrollData);
            this._scrollTo(
                {
                    top,
                    left,
                    callback: () => {
                        this.$emit('scroll-end', this.scrollData);
                        callback();
                    }
                },
                duration
            );
        },

        /**
         * 吸附最近的边界位置
         * @param {String} 轴线,'x' | 'y'
         */
        snapToEdge(axis) {
            const POS = {
                x: undefined,
                y: undefined
            };

            const AXIS_LIST = undefined === axis ? ['x', 'y'] : [axis];

            AXIS_LIST.forEach((axis) => {
                const AXIS_UPPERCASE = axis.toUpperCase();
                if (this[`minScroll${AXIS_UPPERCASE}`] > this[`scroll${AXIS_UPPERCASE}`]) {
                    this[`${'x' === axis ? 'left' : 'top'}BounceState`] = STATE_BOUNCE_SHRINK;
                    POS[axis] = this[`minScroll${AXIS_UPPERCASE}`];
                } else if (this[`maxScroll${AXIS_UPPERCASE}`] < this[`scroll${AXIS_UPPERCASE}`]) {
                    this[`${'x' === axis ? 'right' : 'bottom'}BounceState`] = STATE_BOUNCE_SHRINK;
                    POS[axis] = this[`maxScroll${AXIS_UPPERCASE}`];
                }
            });

            if (undefined !== POS.x || undefined !== POS.y) {
                this._scrollTo(
                    {
                        top: POS.y,
                        left: POS.x,
                        callback: () => {
                            POSITION_LOWERCASE_LIST.forEach((POSITION_LOWERCASE) => {
                                this[`${POSITION_LOWERCASE}BounceState`] = STATE_STATIC;
                            });
                        }
                    },
                    this.bounceTime
                );
            }
        }
    }
};
</script>

<style lang="scss">
$topZIndex: 4;
$bottomZIndex: 4;
$contentZIndex: 2;
$upperZIndex: 3;
$underZIndex: 1;

.any-scroll-view {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    &__top {
        position: absolute;
        top: 0;
        left: 0;
        z-index: $topZIndex;
        width: 100%;
    }
    &__upper {
        position: absolute;
        top: 0;
        left: 0;
        z-index: $upperZIndex;
        width: 100%;
    }
    &__under {
        position: absolute;
        top: 0;
        left: 0;
        z-index: $underZIndex;
        width: 100%;
    }
    &__bottom {
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: $bottomZIndex;
        width: 100%;
    }

    &__content {
        position: absolute;
        z-index: $contentZIndex;
        width: 100%;
        height: 100%;
    }
}
</style>
