<template>
    <div>
        <div v-if="isShowX && !overflowX" class="any-scroll__bar-x" :style="styleX"></div>
        <div v-if="isShowY && !overflowY" class="any-scroll__bar-y" :style="styleY"></div>
    </div>
</template>

<script>
import { STATE_STATIC } from '@/const.js';
export default {
    name: 'ScrollBar',

    props: {
        isShowX: {
            type: Boolean,
            default: true
        },
        isShowY: {
            type: Boolean,
            default: true
        },
        scrollX: {
            type: Number
        },

        scrollY: {
            type: Number
        },

        overflowX: {
            type: Boolean
        },

        overflowY: {
            type: Boolean
        },

        scrollXState: {
            type: String
        },

        scrollYState: {
            type: String
        },

        contentWidth: {
            type: Number
        },

        contentHeight: {
            type: Number
        },

        viewWidth: {
            type: Number
        },

        viewHeight: {
            type: Number
        },

        // 短边
        width: {
            type: Number,
            default: 6
        },

        // 长边
        height: {
            type: Number,
            default: 6
        },

        color: {
            type: String,
            default: `rgba(0,0,0,0.4)`
        },

        isOutOfTop: {
            type: Boolean
        },

        isOutOfLeft: {
            type: Boolean
        },

        isOutOfRight: {
            type: Boolean
        },

        isOutOfBottom: {
            type: Boolean
        },

        // 超出边界的距离
        outOfTopDistance: {
            type: Number
        },

        outOfBottomDistance: {
            type: Number
        },

        outOfRightDistance: {
            type: Number
        },

        outOfLeftDistance: {
            type: Number
        }
    },

    computed: {
        // x进度
        progressX() {
            return this.overflowX ? 0 : Math.round((this.scrollX / (this.contentWidth - this.viewWidth)) * 100);
        },

        // y进度
        progressY() {
            return this.overflowY ? 0 : Math.round((this.scrollY / (this.contentHeight - this.viewHeight)) * 100);
        },

        // 通用样式
        commonStyle() {
            return {
                backgroundColor: this.color,
                zIndex: 1986,
                position: 'absolute',
                transition: 'opacity 300ms'
            };
        },

        // x轴滚动条样式
        styleX() {
            if (this.overflowX) return;
            // 大于0 小于100
            const progress = Math.min(100, Math.max(0, this.progressX));
            let scale = 1;
            let transformOrigin = '';

            if (this.isOutOfLeft) {
                transformOrigin = 'left';
                scale = this.viewWidth / (this.viewWidth + Math.abs(this.outOfLeftDistance));
            } else if (this.isOutOfRight) {
                transformOrigin = 'right';
                scale = this.viewWidth / (this.viewWidth + Math.abs(this.outOfRightDistance));
            }

            return {
                ...this.commonStyle,
                opacity: STATE_STATIC === this.scrollXState ? 0 : 1,
                borderRadius: `${this.height}px`,
                bottom: 0,
                left: `${progress}%`,
                height: `${this.height}px`,
                width: `${this.viewWidth * 0.2}px`,
                transform: `translateX(${0 - progress}%) scaleX(${scale})`,
                transformOrigin
            };
        },

        // y轴滚动条样式
        styleY() {
            if (this.overflowY) return;
            // 大于0 小于100
            const progress = Math.min(100, Math.max(0, this.progressY));
            let scale = 1;
            let transformOrigin = '';

            if (this.isOutOfTop) {
                transformOrigin = 'top';
                scale = this.viewHeight / (this.viewHeight + Math.abs(this.outOfTopDistance));
            } else if (this.isOutOfBottom) {
                transformOrigin = 'bottom';
                scale = this.viewHeight / (this.viewHeight + Math.abs(this.outOfBottomDistance));
            }

            return {
                ...this.commonStyle,
                opacity: STATE_STATIC === this.scrollYState ? 0 : 1,
                borderRadius: `${this.width}px`,
                top: `${progress}%`,
                right: 0,
                height: `${this.viewHeight * 0.2}px`,
                width: `${this.width}px`,
                transform: `translateY(${0 - progress}%) scaleY(${scale})`,
                transformOrigin
            };
        }
    }
};
</script>
