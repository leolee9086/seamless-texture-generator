<template>

  <div class="fixed bottom-5 right-5 z-[9999]">
    <!-- Debug Toggle Button - Small Icon -->
    <button v-if="showDebugButton" @click="toggleConsole"
      class="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-500/80 to-purple-600/80 text-white border-none rounded-full cursor-pointer shadow-md transition-all duration-300 hover:shadow-lg hover:scale-110 active:scale-95 backdrop-blur-sm"
      :class="{ 'animate-pulse bg-gradient-to-br from-pink-400/80 to-red-500/80': isConsoleActive }"
      :title="isConsoleActive ? 'Close Debug Console' : 'Open Debug Console'">
      <div class="i-carbon-debug text-base"></div>
    </button>

    <!-- Debug Info Panel -->
    <div v-if="showDebugInfo"
      class="fixed bottom-20 right-5 w-80 max-h-[400px] glass-panel overflow-hidden z-[9998] animate-fade-in-up">
      <div
        class="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-blue-500/80 to-purple-600/80 text-white backdrop-blur-md">
        <h4 class="m-0 text-base font-semibold">Debug Info</h4>
        <button @click="toggleDebugInfo"
          class="bg-transparent border-none text-white text-xl cursor-pointer p-0 w-6 h-6 flex-center rounded-full hover:bg-white/20 transition-colors">×</button>
      </div>
      <div class="p-5 max-h-[300px] overflow-y-auto text-white">
        <div class="flex justify-between items-center py-2 border-b border-white/10 last:border-none">
          <label class="font-medium text-white/70 text-sm">Environment:</label>
          <span class="text-white text-sm font-semibold">{{ environment }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-white/10 last:border-none">
          <label class="font-medium text-white/70 text-sm">Device Type:</label>
          <span class="text-white text-sm font-semibold">{{ deviceType }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-white/10 last:border-none">
          <label class="font-medium text-white/70 text-sm">Touch Support:</label>
          <span class="text-white text-sm font-semibold">{{ touchSupport ? 'Yes' : 'No' }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-white/10 last:border-none">
          <label class="font-medium text-white/70 text-sm">WebGPU Support:</label>
          <span class="text-white text-sm font-semibold">{{ webGPUSupport ? 'Yes' : 'No' }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-white/10 last:border-none">
          <label class="font-medium text-white/70 text-sm">Screen Size:</label>
          <span class="text-white text-sm font-semibold">{{ screenWidth }}x{{ screenHeight }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-white/10 last:border-none">
          <label class="font-medium text-white/70 text-sm">Pixel Ratio:</label>
          <span class="text-white text-sm font-semibold">{{ pixelRatio }}</span>
        </div>
        <div class="flex gap-2 mt-4 flex-wrap">
          <button @click="reloadPage"
            class="flex-1 min-w-[80px] py-2 px-3 bg-white/10 border border-white/20 rounded-md text-white text-xs cursor-pointer transition-all hover:bg-white/20">Reload</button>
          <button @click="clearLogs"
            class="flex-1 min-w-[80px] py-2 px-3 bg-white/10 border border-white/20 rounded-md text-white text-xs cursor-pointer transition-all hover:bg-white/20">Clear
            Logs</button>
          <button @click="exportLogs"
            class="flex-1 min-w-[80px] py-2 px-3 bg-white/10 border border-white/20 rounded-md text-white text-xs cursor-pointer transition-all hover:bg-white/20">Export</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { initVConsole, destroyVConsole, toggleVConsole, getVConsoleVisibility } from '../utils/vconsole'

// 响应式数据
const isConsoleActive = ref(false)
const showDebugInfo = ref(false)
const environment = ref('')
const deviceType = ref('')
const touchSupport = ref(false)
const webGPUSupport = ref(false)
const screenWidth = ref(0)
const screenHeight = ref(0)
const pixelRatio = ref(1)

// 计算属性
const showDebugButton = computed(() => {
  // 在开发环境或移动端显示调试按钮
  return import.meta.env.DEV || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

// 初始化调试信息
const initDebugInfo = () => {
  environment.value = import.meta.env.MODE
  deviceType.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
  touchSupport.value = 'ontouchstart' in window
  webGPUSupport.value = !!(navigator as any).gpu
  screenWidth.value = window.screen.width
  screenHeight.value = window.screen.height
  pixelRatio.value = window.devicePixelRatio || 1
}

// 切换控制台
const toggleConsole = () => {
  toggleVConsole()
  isConsoleActive.value = !isConsoleActive.value

  // 添加调试日志
  if (isConsoleActive.value) {
    console.log('Debug console opened', {
      environment: environment.value,
      deviceType: deviceType.value,
      timestamp: new Date().toISOString()
    })
  }
}

// 切换调试信息面板
const toggleDebugInfo = () => {
  showDebugInfo.value = !showDebugInfo.value
}

// 刷新页面
const reloadPage = () => {
  window.location.reload()
}

// 清空日志
const clearLogs = () => {
  console.clear()
  console.log('Logs cleared', new Date().toISOString())
}

// 导出日志
const exportLogs = () => {
  const logs = Array.from(document.querySelectorAll('.vc-log'))
  const logText = logs.map(log => log.textContent).join('\n')
  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.txt`
  a.click()
  URL.revokeObjectURL(url)

  console.log('Logs exported', new Date().toISOString())
}

// 监听窗口大小变化
const handleResize = () => {
  screenWidth.value = window.screen.width
  screenHeight.value = window.screen.height
}

// 组件挂载
onMounted(() => {
  // 初始化调试信息
  initDebugInfo()

  // 初始化vConsole
  initVConsole(true)

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 添加全局错误处理
  window.addEventListener('error', (event) => {
    console.error('Global Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString()
    })
  })

  // 添加未处理的Promise拒绝处理
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', {
      reason: event.reason,
      timestamp: new Date().toISOString()
    })
  })
})

// 组件卸载
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  destroyVConsole()
})
</script>

<style>
/* Animation for fade in up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}
</style>