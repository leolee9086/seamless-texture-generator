import VConsole from 'vconsole'
import { ref } from 'vue'

// 创建全局vConsole实例
let vConsoleInstance: VConsole | null = null

// 控制台显示状态
const isVConsoleVisible = ref(false)

/**
 * 初始化vConsole调试工具
 * @param enable 是否启用（默认仅在开发环境启用）
 */
export const initVConsole = (enable: boolean = import.meta.env.DEV) => {
  // 如果已经初始化，先销毁
  if (vConsoleInstance) {
    vConsoleInstance.destroy()
    vConsoleInstance = null
  }

  // 根据条件决定是否初始化
  if (enable) {
    vConsoleInstance = new VConsole({
      defaultPlugins: ['system', 'network', 'element', 'storage'],
      onReady: () => {
        console.log('vConsole 已初始化')
        isVConsoleVisible.value = true
      }
    })

    console.log('vConsole 调试工具已启用')
  }
}

/**
 * 销毁vConsole实例
 */
export const destroyVConsole = () => {
  if (vConsoleInstance) {
    vConsoleInstance.destroy()
    vConsoleInstance = null
    isVConsoleVisible.value = false
    console.log('vConsole 已销毁')
  }
}

/**
 * 切换vConsole显示状态
 */
export const toggleVConsole = () => {
  if (vConsoleInstance) {
    if (isVConsoleVisible.value) {
      vConsoleInstance.hide()
      isVConsoleVisible.value = false
    } else {
      vConsoleInstance.show()
      isVConsoleVisible.value = true
    }
  }
}

/**
 * 获取vConsole实例
 */
export const getVConsoleInstance = () => vConsoleInstance

/**
 * 获取vConsole显示状态
 */
export const getVConsoleVisibility = () => isVConsoleVisible

// 导出vConsole类型供外部使用
export { VConsole }