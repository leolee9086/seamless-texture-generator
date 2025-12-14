/**
 * common-utils 模块导出
 * 通用工具函数，与图像处理场景无关，可用于任何场合
 */

// 类型守卫
import { isNumber } from './common.guard'
import { 获取滚动容器 } from './scroll.guard'

// 设备检测
import { isMobileDevice, supportsNativeCamera } from './deviceDetection'

// 滚动处理
import {
    horizontalScroll,
    horizontalScrollFirst,
    verticalScroll,
    verticalScrollFirst
} from './scroll'

// 调试控制台
import {
    initVConsole,
    destroyVConsole,
    toggleVConsole,
    getVConsoleInstance,
    getVConsoleVisibility,
    VConsole
} from './vconsole'

export {
    // 类型守卫
    isNumber,
    获取滚动容器,
    // 设备检测
    isMobileDevice,
    supportsNativeCamera,
    // 滚动处理
    horizontalScroll,
    horizontalScrollFirst,
    verticalScroll,
    verticalScrollFirst,
    // 调试控制台
    initVConsole,
    destroyVConsole,
    toggleVConsole,
    getVConsoleInstance,
    getVConsoleVisibility,
    VConsole
}

// @AIDONE 已迁移 scroll.ts / scroll.guard.ts / vconsole.ts

// @AITODO 待迁移:
// - vue/ 目录 - Vue 相关通用工具（需评估是否与业务解耦）
