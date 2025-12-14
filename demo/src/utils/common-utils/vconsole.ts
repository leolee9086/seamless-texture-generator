import { VConsole, ref } from './imports'

// 创建全局vConsole实例
let vConsoleInstance: VConsole | null = null

// 控制台显示状态
const isVConsoleVisible = ref(false)

/**
 * 初始化vConsole调试工具
 * @param enable 是否启用（默认仅在开发环境启用）
 */
export const initVConsole = (enable: boolean = import.meta.env.DEV): void => {
    // 如果已经初始化，先销毁
    if (vConsoleInstance) {
        vConsoleInstance.destroy()
        vConsoleInstance = null
    }

    // 根据条件决定是否初始化
    if (!enable) {
        return
    }

    vConsoleInstance = new VConsole({
        defaultPlugins: ['system', 'network', 'element', 'storage'],
        onReady: (): void => {
            isVConsoleVisible.value = true
        }
    })
}

/**
 * 销毁vConsole实例
 */
export const destroyVConsole = (): void => {
    if (!vConsoleInstance) {
        return
    }

    vConsoleInstance.destroy()
    vConsoleInstance = null
    isVConsoleVisible.value = false
}

/**
 * 切换vConsole显示状态
 */
export const toggleVConsole = (): void => {
    if (!vConsoleInstance) {
        return
    }

    const shouldHide = isVConsoleVisible.value
    if (shouldHide) {
        vConsoleInstance.hide()
        isVConsoleVisible.value = false
        return
    }

    vConsoleInstance.show()
    isVConsoleVisible.value = true
}

/**
 * 获取vConsole实例
 */
export const getVConsoleInstance = (): VConsole | null => vConsoleInstance

/**
 * 获取vConsole显示状态
 */
export const getVConsoleVisibility = (): typeof isVConsoleVisible => isVConsoleVisible

// 导出vConsole类型供外部使用
export { VConsole }
