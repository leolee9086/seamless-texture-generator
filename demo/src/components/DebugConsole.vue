<template>
  <div class="debug-console">
    <!-- 调试控制台切换按钮 -->
    <button
      v-if="showDebugButton"
      @click="toggleConsole"
      class="debug-toggle-btn"
      :class="{ 'active': isConsoleActive }"
      :title="isConsoleActive ? '关闭调试控制台' : '打开调试控制台'"
    >
      <svg class="debug-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 19V7H4v12h16m0-16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h16m-7 14v-2h5v2h-5m-3-4v-2h8v2h-8m-2-4V7h10v2H8"/>
      </svg>
      <span class="debug-text">{{ isConsoleActive ? '调试中' : '调试' }}</span>
    </button>

    <!-- 调试信息面板 -->
    <div v-if="showDebugInfo" class="debug-info-panel">
      <div class="debug-header">
        <h4>调试信息</h4>
        <button @click="toggleDebugInfo" class="close-btn">×</button>
      </div>
      <div class="debug-content">
        <div class="debug-item">
          <label>环境:</label>
          <span>{{ environment }}</span>
        </div>
        <div class="debug-item">
          <label>设备类型:</label>
          <span>{{ deviceType }}</span>
        </div>
        <div class="debug-item">
          <label>触摸支持:</label>
          <span>{{ touchSupport ? '是' : '否' }}</span>
        </div>
        <div class="debug-item">
          <label>WebGPU支持:</label>
          <span>{{ webGPUSupport ? '是' : '否' }}</span>
        </div>
        <div class="debug-item">
          <label>屏幕尺寸:</label>
          <span>{{ screenWidth }}x{{ screenHeight }}</span>
        </div>
        <div class="debug-item">
          <label>像素比:</label>
          <span>{{ pixelRatio }}</span>
        </div>
        <div class="debug-actions">
          <button @click="reloadPage" class="action-btn">刷新页面</button>
          <button @click="clearLogs" class="action-btn">清空日志</button>
          <button @click="exportLogs" class="action-btn">导出日志</button>
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
  deviceType.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? '移动端' : '桌面端'
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
    console.log('调试控制台已打开', {
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
  console.log('日志已清空', new Date().toISOString())
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
  
  console.log('日志已导出', new Date().toISOString())
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
    console.error('全局错误:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString()
    })
  })
  
  // 添加未处理的Promise拒绝处理
  window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', {
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

<style scoped>
.debug-console {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.debug-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.debug-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.debug-toggle-btn.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
  }
  50% {
    box-shadow: 0 4px 25px rgba(245, 87, 108, 0.6);
  }
  100% {
    box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
  }
}

.debug-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.debug-text {
  font-weight: 600;
}

.debug-info-panel {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 320px;
  max-height: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 9998;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.debug-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.debug-content {
  padding: 16px 20px;
  max-height: 300px;
  overflow-y: auto;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.debug-item:last-child {
  border-bottom: none;
}

.debug-item label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

.debug-item span {
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.debug-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 80px;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  color: #495057;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .debug-console {
    bottom: 15px;
    right: 15px;
  }
  
  .debug-toggle-btn {
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .debug-info-panel {
    width: 280px;
    right: 15px;
    bottom: 70px;
  }
  
  .debug-content {
    padding: 12px 16px;
  }
  
  .debug-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}

/* 超小屏幕适配 */
@media (max-width: 480px) {
  .debug-info-panel {
    width: calc(100vw - 30px);
    right: 15px;
    left: 15px;
  }
}
</style>