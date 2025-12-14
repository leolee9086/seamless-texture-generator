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
// @AIDONE LUT 文件评估完成:
// - utils/LUTDB.* 是存储工具，保留在 utils/
// - processPipelines/lut.* 是管线处理逻辑，已迁移到 adjustments/lut/
// @AIDONE vue/ 目录评估完成:
// - vue/wrapper/ 是 Vue 框架特定的组件包装器工具库
// - 虽然与业务解耦，但属于 Vue 生态系统工具，不应归入 common-utils
// - common-utils 定位为"与框架无关的通用工具"
// - vue/ 目录应保留在 utils/vue/ 位置，作为 Vue 相关工具的专属目录
